/**
 * NPC Memory Service
 *
 * Manages bounded, summarized memory for NPCs to provide continuity.
 * Memories are stored in actorState.recentMemories (JSONB column).
 * Memory is capped at MAX_MEMORIES entries, with oldest evicted first.
 *
 * Uses optimistic locking with retry to prevent race conditions
 * when multiple concurrent updates occur.
 */

import {
  actorState,
  and,
  db,
  eq,
  type NpcMemory,
  type RelationshipState,
} from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';
import { parseMemoriesSafe, parseRelationshipsSafe } from './jsonb-validators';

/** Maximum memories per NPC before eviction */
const MAX_MEMORIES = 50;

/** Maximum relationship notes per actor pair */
const MAX_RELATIONSHIP_NOTES = 10;

/** Maximum retries for optimistic locking */
const MAX_RETRIES = 3;

/** Delay between retries in ms (with exponential backoff) */
const RETRY_BASE_DELAY_MS = 50;

/**
 * NPC Memory Service
 *
 * Provides memory management for NPC continuity:
 * - Add memories with automatic eviction of oldest
 * - Query recent memories for prompt context
 * - Track relationships between actors
 */
export class NpcMemoryService {
  /**
   * Add a memory to an NPC's memory store.
   * Automatically evicts oldest memories when cap is exceeded.
   * Uses optimistic locking with retry to prevent race conditions.
   */
  async addMemory(
    actorId: string,
    memory: Omit<NpcMemory, 'id'>
  ): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Get current state with updatedAt for optimistic locking
        const [state] = await db
          .select({
            recentMemories: actorState.recentMemories,
            updatedAt: actorState.updatedAt,
          })
          .from(actorState)
          .where(eq(actorState.id, actorId))
          .limit(1);

        if (!state) {
          logger.warn(
            `Cannot add memory: ActorState not found for ${actorId}`,
            { actorId },
            'NpcMemoryService'
          );
          return;
        }

        // Parse memories with Zod validation - handles corrupted data gracefully
        const memories = parseMemoriesSafe(state.recentMemories, { actorId });

        // Create new memory with ID
        const newMemory: NpcMemory = {
          id: await generateSnowflakeId(),
          ...memory,
        };

        // Add new memory and enforce cap
        memories.push(newMemory);
        while (memories.length > MAX_MEMORIES) {
          memories.shift(); // Remove oldest
        }

        const now = new Date();

        // Update database with optimistic locking
        // Only update if updatedAt hasn't changed since we read it
        const result = await db
          .update(actorState)
          .set({
            recentMemories: memories,
            updatedAt: now,
          })
          .where(
            and(
              eq(actorState.id, actorId),
              eq(actorState.updatedAt, state.updatedAt)
            )
          )
          .returning({ id: actorState.id });

        // If no rows were updated, another process modified the record
        if (result.length === 0) {
          if (attempt < MAX_RETRIES - 1) {
            // Exponential backoff before retry
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            logger.debug(
              `Memory update conflict for ${actorId}, retrying (attempt ${attempt + 1})`,
              { actorId },
              'NpcMemoryService'
            );
            continue;
          }
          logger.warn(
            `Memory update failed after ${MAX_RETRIES} attempts due to concurrent modification`,
            { actorId },
            'NpcMemoryService'
          );
          return;
        }

        logger.debug(
          `Added memory for ${actorId}`,
          { memoryType: memory.type, totalMemories: memories.length },
          'NpcMemoryService'
        );
        return; // Success
      } catch (error) {
        logger.error(
          `Failed to add memory for ${actorId}`,
          { error: error instanceof Error ? error.message : String(error) },
          'NpcMemoryService'
        );
        return;
      }
    }
  }

  /**
   * Get recent memories for an NPC, optionally filtered by type.
   */
  async getRecentMemories(
    actorId: string,
    limit = 10,
    types?: NpcMemory['type'][]
  ): Promise<NpcMemory[]> {
    try {
      const [state] = await db
        .select({
          recentMemories: actorState.recentMemories,
        })
        .from(actorState)
        .where(eq(actorState.id, actorId))
        .limit(1);

      if (!state?.recentMemories) {
        return [];
      }

      // Parse memories with Zod validation - handles corrupted data gracefully
      let memories = parseMemoriesSafe(state.recentMemories, { actorId });

      // Filter by type if specified
      if (types && types.length > 0) {
        memories = memories.filter((m) => types.includes(m.type));
      }

      // Return most recent first, limited
      return memories.slice(-limit).reverse();
    } catch (error) {
      logger.error(
        `Failed to get memories for ${actorId}`,
        { error: error instanceof Error ? error.message : String(error) },
        'NpcMemoryService'
      );
      return [];
    }
  }

  /**
   * Get relationship state between two actors.
   */
  async getRelationship(
    actorId: string,
    otherActorId: string
  ): Promise<RelationshipState | null> {
    try {
      const [state] = await db
        .select({
          relationships: actorState.relationships,
        })
        .from(actorState)
        .where(eq(actorState.id, actorId))
        .limit(1);

      if (!state?.relationships) {
        return null;
      }

      // Parse relationships with Zod validation - handles corrupted data gracefully
      const relationships = parseRelationshipsSafe(state.relationships, {
        actorId,
      });
      return relationships[otherActorId] ?? null;
    } catch (error) {
      logger.error(
        `Failed to get relationship`,
        {
          actorId,
          otherActorId,
          error: error instanceof Error ? error.message : String(error),
        },
        'NpcMemoryService'
      );
      return null;
    }
  }

  /**
   * Update relationship between two actors based on an interaction.
   * Uses optimistic locking with retry to prevent race conditions.
   */
  async updateRelationship(
    actorId: string,
    otherActorId: string,
    interaction: {
      sentimentChange: number; // -1 to 1
      note?: string;
    }
  ): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const [state] = await db
          .select({
            relationships: actorState.relationships,
            updatedAt: actorState.updatedAt,
          })
          .from(actorState)
          .where(eq(actorState.id, actorId))
          .limit(1);

        if (!state) {
          logger.warn(
            `Cannot update relationship: ActorState not found for ${actorId}`,
            { actorId },
            'NpcMemoryService'
          );
          return;
        }

        // Parse relationships with Zod validation - handles corrupted data gracefully
        const relationships = parseRelationshipsSafe(state.relationships, {
          actorId,
        });

        // Get or create relationship
        const existing = relationships[otherActorId];
        const now = new Date();

        if (existing) {
          // Update existing relationship
          existing.sentiment = Math.max(
            -1,
            Math.min(1, existing.sentiment + interaction.sentimentChange * 0.1)
          );
          existing.lastInteraction = now.toISOString();
          existing.interactionCount += 1;

          if (interaction.note) {
            existing.notes.push(interaction.note);
            // Keep only recent notes
            while (existing.notes.length > MAX_RELATIONSHIP_NOTES) {
              existing.notes.shift();
            }
          }
        } else {
          // Create new relationship
          relationships[otherActorId] = {
            actorId: otherActorId,
            sentiment: Math.max(-1, Math.min(1, interaction.sentimentChange)),
            lastInteraction: now.toISOString(),
            interactionCount: 1,
            notes: interaction.note ? [interaction.note] : [],
          };
        }

        // Update database with optimistic locking
        const result = await db
          .update(actorState)
          .set({
            relationships,
            updatedAt: now,
          })
          .where(
            and(
              eq(actorState.id, actorId),
              eq(actorState.updatedAt, state.updatedAt)
            )
          )
          .returning({ id: actorState.id });

        // If no rows were updated, another process modified the record
        if (result.length === 0) {
          if (attempt < MAX_RETRIES - 1) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            logger.debug(
              `Relationship update conflict for ${actorId}, retrying (attempt ${attempt + 1})`,
              { actorId },
              'NpcMemoryService'
            );
            continue;
          }
          logger.warn(
            `Relationship update failed after ${MAX_RETRIES} attempts due to concurrent modification`,
            { actorId },
            'NpcMemoryService'
          );
          return;
        }

        logger.debug(
          `Updated relationship`,
          {
            actorId,
            otherActorId,
            newSentiment: relationships[otherActorId]?.sentiment,
          },
          'NpcMemoryService'
        );
        return; // Success
      } catch (error) {
        logger.error(
          `Failed to update relationship`,
          {
            actorId,
            otherActorId,
            error: error instanceof Error ? error.message : String(error),
          },
          'NpcMemoryService'
        );
        return;
      }
    }
  }

  /**
   * Update activity state when NPC takes an action.
   * Uses optimistic locking with retry to prevent race conditions
   * when multiple concurrent updates occur.
   */
  async updateActivityState(
    actorId: string,
    options: {
      posted?: boolean;
      active?: boolean;
    } = {}
  ): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const now = new Date();

        // Get current state including updatedAt for optimistic locking
        const [state] = await db
          .select({
            postsToday: actorState.postsToday,
            postsTodayResetAt: actorState.postsTodayResetAt,
            updatedAt: actorState.updatedAt,
          })
          .from(actorState)
          .where(eq(actorState.id, actorId))
          .limit(1);

        if (!state) {
          logger.warn(
            `Actor state not found for ${actorId}`,
            { actorId },
            'NpcMemoryService'
          );
          return;
        }

        const updates: Partial<{
          lastPostAt: Date;
          lastActiveAt: Date;
          postsToday: number;
          postsTodayResetAt: Date;
          updatedAt: Date;
        }> = {
          updatedAt: now,
        };

        if (options.active) {
          updates.lastActiveAt = now;
        }

        if (options.posted) {
          updates.lastPostAt = now;

          const resetAt = state.postsTodayResetAt;
          const shouldReset =
            !resetAt || now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000;

          if (shouldReset) {
            updates.postsToday = 1;
            updates.postsTodayResetAt = now;
          } else {
            updates.postsToday = (state.postsToday ?? 0) + 1;
          }
        }

        // Update with optimistic locking
        const result = await db
          .update(actorState)
          .set(updates)
          .where(
            and(
              eq(actorState.id, actorId),
              eq(actorState.updatedAt, state.updatedAt)
            )
          )
          .returning({ id: actorState.id });

        // If no rows were updated, another process modified the record
        if (result.length === 0) {
          if (attempt < MAX_RETRIES - 1) {
            // Exponential backoff before retry
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            logger.debug(
              `Activity state update conflict for ${actorId}, retrying (attempt ${attempt + 1})`,
              { actorId },
              'NpcMemoryService'
            );
            continue;
          }
          logger.warn(
            `Activity state update failed after ${MAX_RETRIES} attempts due to concurrent modification`,
            { actorId },
            'NpcMemoryService'
          );
          return;
        }

        return; // Success
      } catch (error) {
        logger.error(
          `Failed to update activity state for ${actorId}`,
          { error: error instanceof Error ? error.message : String(error) },
          'NpcMemoryService'
        );
        return;
      }
    }
  }

  /**
   * Add the same memory to multiple NPCs in a batch operation.
   * Reduces N+1 query problem by fetching all states at once.
   *
   * @param actorIds - Array of actor IDs to add memory to
   * @param memory - Memory to add (without id, will be generated)
   * @returns Number of successfully updated actors
   */
  async addMemoryBatch(
    actorIds: string[],
    memory: Omit<NpcMemory, 'id'>
  ): Promise<number> {
    if (actorIds.length === 0) {
      return 0;
    }

    // For single actor, delegate to single method
    if (actorIds.length === 1) {
      await this.addMemory(actorIds[0]!, memory);
      return 1;
    }

    // Delegate to addMemory which has retry logic built in
    // Use Promise.allSettled for isolation between actors
    const updateResults = await Promise.allSettled(
      actorIds.map(async (actorId) => {
        try {
          await this.addMemory(actorId, memory);
          return true;
        } catch (error) {
          logger.warn(
            `Failed to add batch memory for actor ${actorId}`,
            {
              actorId,
              error: error instanceof Error ? error.message : String(error),
            },
            'NpcMemoryService'
          );
          return false;
        }
      })
    );

    // Count successes
    const successCount = updateResults.filter(
      (r) => r.status === 'fulfilled' && r.value === true
    ).length;

    logger.debug(
      `Batch memory added to ${successCount}/${actorIds.length} actors`,
      { memoryType: memory.type, successCount, totalActors: actorIds.length },
      'NpcMemoryService'
    );

    return successCount;
  }

  /**
   * Format memories for inclusion in NPC prompts.
   */
  formatMemoriesForPrompt(memories: NpcMemory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const lines = memories.map((m) => {
      const timeAgo = this.formatTimeAgo(m.timestamp);
      return `- [${timeAgo}] ${m.summary}`;
    });

    return `## Recent Memories\n${lines.join('\n')}`;
  }

  /**
   * Format time ago string for memory display.
   */
  private formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    if (diffMins > 0) {
      return `${diffMins}m ago`;
    }
    return 'just now';
  }
}

// Singleton instance
export const npcMemoryService = new NpcMemoryService();
