/**
 * NPC Memory Service
 *
 * Manages bounded, summarized memory for NPCs to provide continuity.
 * Memories are stored in actorState.recentMemories (JSONB column).
 * Memory is capped at MAX_MEMORIES entries, with oldest evicted first.
 */

import {
  actorState,
  db,
  eq,
  type NpcMemory,
  type RelationshipState,
} from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';

/** Maximum memories per NPC before eviction */
const MAX_MEMORIES = 50;

/** Maximum relationship notes per actor pair */
const MAX_RELATIONSHIP_NOTES = 10;

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
   */
  async addMemory(
    actorId: string,
    memory: Omit<NpcMemory, 'id'>
  ): Promise<void> {
    try {
      // Get current state
      const [state] = await db
        .select({
          recentMemories: actorState.recentMemories,
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

      // Get existing memories or initialize empty array
      // Cast from unknown since JSONB columns don't have type info at runtime
      const memories: NpcMemory[] =
        (state.recentMemories as NpcMemory[] | null) ?? [];

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

      // Update database
      await db
        .update(actorState)
        .set({
          recentMemories: memories,
          updatedAt: new Date(),
        })
        .where(eq(actorState.id, actorId));

      logger.debug(
        `Added memory for ${actorId}`,
        { memoryType: memory.type, totalMemories: memories.length },
        'NpcMemoryService'
      );
    } catch (error) {
      logger.error(
        `Failed to add memory for ${actorId}`,
        { error: error instanceof Error ? error.message : String(error) },
        'NpcMemoryService'
      );
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

      // Cast from unknown since JSONB columns don't have type info at runtime
      let memories = state.recentMemories as NpcMemory[];

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

      // Cast from unknown since JSONB columns don't have type info at runtime
      const relationships = state.relationships as Record<
        string,
        RelationshipState
      >;
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
   */
  async updateRelationship(
    actorId: string,
    otherActorId: string,
    interaction: {
      sentimentChange: number; // -1 to 1
      note?: string;
    }
  ): Promise<void> {
    try {
      const [state] = await db
        .select({
          relationships: actorState.relationships,
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

      // Cast from unknown since JSONB columns don't have type info at runtime
      const relationships: Record<string, RelationshipState> =
        (state.relationships as Record<string, RelationshipState> | null) ?? {};

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

      // Update database
      await db
        .update(actorState)
        .set({
          relationships,
          updatedAt: now,
        })
        .where(eq(actorState.id, actorId));

      logger.debug(
        `Updated relationship`,
        {
          actorId,
          otherActorId,
          newSentiment: relationships[otherActorId]?.sentiment,
        },
        'NpcMemoryService'
      );
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
    }
  }

  /**
   * Update activity state when NPC takes an action.
   */
  async updateActivityState(
    actorId: string,
    options: {
      posted?: boolean;
      active?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const now = new Date();
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

        // Get current posts today count and check if needs reset
        const [state] = await db
          .select({
            postsToday: actorState.postsToday,
            postsTodayResetAt: actorState.postsTodayResetAt,
          })
          .from(actorState)
          .where(eq(actorState.id, actorId))
          .limit(1);

        if (state) {
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
      }

      await db
        .update(actorState)
        .set(updates)
        .where(eq(actorState.id, actorId));
    } catch (error) {
      logger.error(
        `Failed to update activity state for ${actorId}`,
        { error: error instanceof Error ? error.message : String(error) },
        'NpcMemoryService'
      );
    }
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
