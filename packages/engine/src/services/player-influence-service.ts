/**
 * Player Influence Service
 *
 * Handles light player influence on the narrative:
 * - Player mentions of NPCs boost response probability
 * - Large player trades add to NPC memory
 */

import { db, eq, organizations } from '@babylon/db';
import { logger } from '@babylon/shared';
import { npcMemoryService } from './npc-memory-service';
import { StaticDataRegistry } from './static-data-registry';

/**
 * Threshold for a "significant" trade (in game currency)
 */
const SIGNIFICANT_TRADE_THRESHOLD = 1000;

/**
 * Threshold for a "large" trade that warrants special mention
 */
const LARGE_TRADE_THRESHOLD = 5000;

/**
 * How long a mention stays "recent" (in ms)
 */
const MENTION_RECENCY_WINDOW = 30 * 60 * 1000; // 30 minutes

/**
 * Maximum number of mentions to track (LRU cache bound)
 */
const MAX_MENTION_CACHE_SIZE = 1000;

/**
 * LRU Cache for recent mentions with bounded size.
 * When max size is reached, oldest entries are evicted.
 */
class LRUMentionCache {
  private cache = new Map<string, Date>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  set(actorId: string, timestamp: Date): void {
    // Delete first to reset position for LRU
    if (this.cache.has(actorId)) {
      this.cache.delete(actorId);
    }

    // Evict oldest entries if at max size
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      } else {
        break;
      }
    }

    this.cache.set(actorId, timestamp);
  }

  get(actorId: string): Date | undefined {
    const value = this.cache.get(actorId);
    if (value) {
      // Move to end for LRU (most recently accessed)
      this.cache.delete(actorId);
      this.cache.set(actorId, value);
    }
    return value;
  }

  delete(actorId: string): boolean {
    return this.cache.delete(actorId);
  }

  entries(): IterableIterator<[string, Date]> {
    return this.cache.entries();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Recent mention tracking (in-memory LRU cache, cleared on restart)
 * Maps actorId -> timestamp of last mention
 * Bounded to MAX_MENTION_CACHE_SIZE to prevent memory leaks
 */
const recentMentions = new LRUMentionCache(MAX_MENTION_CACHE_SIZE);

/**
 * Handle a player mentioning an NPC in a post or comment
 */
export async function handlePlayerMention(
  playerId: string,
  mentionedActorId: string,
  postId: string
): Promise<void> {
  try {
    // 1. Record the mention in memory cache for probability boost
    recentMentions.set(mentionedActorId, new Date());

    // 2. Add to NPC's memory
    await npcMemoryService.addMemory(mentionedActorId, {
      type: 'mentioned_by',
      timestamp: new Date().toISOString(),
      summary: `Was mentioned by a player in a post`,
      actorIds: [playerId],
      sentiment: 0.1, // Slight positive (attention is good)
    });

    logger.info(
      `Player ${playerId} mentioned NPC ${mentionedActorId}`,
      { playerId, mentionedActorId, postId },
      'PlayerInfluence'
    );
  } catch (error) {
    logger.error(
      `Failed to handle player mention`,
      {
        playerId,
        mentionedActorId,
        error: error instanceof Error ? error.message : String(error),
      },
      'PlayerInfluence'
    );
  }
}

/**
 * Check if an actor was mentioned recently (for probability boost)
 */
export function wasMentionedRecently(actorId: string): boolean {
  const lastMention = recentMentions.get(actorId);
  if (!lastMention) return false;

  const now = new Date();
  const isRecent =
    now.getTime() - lastMention.getTime() < MENTION_RECENCY_WINDOW;

  // Clean up old entries
  if (!isRecent) {
    recentMentions.delete(actorId);
  }

  return isRecent;
}

/**
 * Get all recently mentioned actor IDs
 */
export function getRecentlyMentionedActorIds(): string[] {
  const now = new Date();
  const recentIds: string[] = [];

  for (const [actorId, lastMention] of recentMentions.entries()) {
    if (now.getTime() - lastMention.getTime() < MENTION_RECENCY_WINDOW) {
      recentIds.push(actorId);
    } else {
      // Clean up old entries
      recentMentions.delete(actorId);
    }
  }

  return recentIds;
}

/**
 * Handle a significant player trade
 * Uses batch memory updates to avoid N+1 query pattern
 */
export async function handlePlayerTrade(
  playerId: string,
  stockTicker: string,
  side: 'long' | 'short',
  size: number
): Promise<void> {
  // Only process significant trades
  if (size < SIGNIFICANT_TRADE_THRESHOLD) {
    return;
  }

  try {
    // Find NPCs affiliated with this stock's organization
    const relevantNpcs = await getNpcsAffiliatedWith(stockTicker);

    if (relevantNpcs.length === 0) {
      return;
    }

    // Use batch method to add memory to all NPCs at once
    // This reduces N+1 queries by fetching all states in one query
    const successCount = await npcMemoryService.addMemoryBatch(relevantNpcs, {
      type: 'witnessed_event',
      timestamp: new Date().toISOString(),
      summary: `A player took a ${size >= LARGE_TRADE_THRESHOLD ? 'large ' : ''}${side} position on ${stockTicker}`,
      actorIds: [playerId],
      sentiment: side === 'long' ? 0.1 : -0.1,
    });

    logger.info(
      `Player trade recorded for ${successCount}/${relevantNpcs.length} NPCs`,
      {
        playerId,
        stockTicker,
        side,
        size,
        affectedNpcs: relevantNpcs.length,
        successCount,
      },
      'PlayerInfluence'
    );
  } catch (error) {
    logger.error(
      `Failed to handle player trade`,
      {
        playerId,
        stockTicker,
        error: error instanceof Error ? error.message : String(error),
      },
      'PlayerInfluence'
    );
  }
}

/**
 * Get NPC IDs affiliated with a stock ticker's organization.
 * Uses StaticDataRegistry to find actors whose affiliations include the organization.
 */
async function getNpcsAffiliatedWith(stockTicker: string): Promise<string[]> {
  // Get the organization for this ticker
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.ticker, stockTicker))
    .limit(1);

  if (!org) {
    return [];
  }

  // Find actors affiliated with this organization using static data
  const allActors = StaticDataRegistry.getAllActors();
  const affiliatedActorIds = allActors
    .filter((actor) => actor.affiliations.includes(org.id))
    .map((actor) => actor.id);

  return affiliatedActorIds;
}

/**
 * Extract mentions from post content
 */
export function extractMentions(content: string): string[] {
  // Match @username patterns
  const mentionPattern = /@([a-zA-Z0-9_-]+)/g;
  const matches = content.matchAll(mentionPattern);
  const mentions: string[] = [];

  for (const match of matches) {
    if (match[1]) {
      mentions.push(match[1]);
    }
  }

  return mentions;
}

/**
 * Player Influence Service class
 */
export class PlayerInfluenceService {
  async handleMention(
    playerId: string,
    mentionedActorId: string,
    postId: string
  ): Promise<void> {
    return handlePlayerMention(playerId, mentionedActorId, postId);
  }

  async handleTrade(
    playerId: string,
    stockTicker: string,
    side: 'long' | 'short',
    size: number
  ): Promise<void> {
    return handlePlayerTrade(playerId, stockTicker, side, size);
  }

  wasMentionedRecently(actorId: string): boolean {
    return wasMentionedRecently(actorId);
  }

  getRecentlyMentionedActorIds(): string[] {
    return getRecentlyMentionedActorIds();
  }

  extractMentions(content: string): string[] {
    return extractMentions(content);
  }
}

// Singleton instance
export const playerInfluenceService = new PlayerInfluenceService();
