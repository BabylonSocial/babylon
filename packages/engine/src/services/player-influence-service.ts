/**
 * Player Influence Service
 *
 * Handles light player influence on the narrative:
 * - Player mentions of NPCs boost response probability
 * - Large player trades add to NPC memory
 *
 * Uses Redis-backed cache for durability across restarts.
 * Falls back to in-memory cache if Redis is unavailable.
 */

import { getCache, invalidateCache, setCache } from '@babylon/api';
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
 * How long a mention stays "recent" (in seconds for Redis TTL)
 */
const MENTION_RECENCY_SECONDS = 30 * 60; // 30 minutes

/**
 * Maximum number of mentions to track in memory fallback (LRU cache bound)
 */
const MAX_MENTION_CACHE_SIZE = 1000;

/**
 * Cache key prefix for player mentions
 */
const MENTION_CACHE_PREFIX = 'player:mention';

/**
 * Cache key for the set of all recently mentioned actor IDs
 */
const MENTION_SET_KEY = 'player:mention:set';

/**
 * LRU Cache for recent mentions with bounded size (in-memory fallback).
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
 * In-memory fallback cache (used when Redis is unavailable)
 */
const memoryFallbackCache = new LRUMentionCache(MAX_MENTION_CACHE_SIZE);

/**
 * Record a player mention in the cache (Redis with in-memory fallback)
 */
async function recordMention(actorId: string, timestamp: Date): Promise<void> {
  const timestampIso = timestamp.toISOString();

  try {
    // Store in Redis with TTL
    await setCache(
      actorId,
      { timestamp: timestampIso },
      { namespace: MENTION_CACHE_PREFIX, ttl: MENTION_RECENCY_SECONDS }
    );

    // Also update the set of mentioned actors
    const currentSet = await getCache<string[]>(MENTION_SET_KEY, {});
    const updatedSet = currentSet
      ? [...new Set([...currentSet, actorId])]
      : [actorId];
    await setCache(MENTION_SET_KEY, updatedSet, {
      ttl: MENTION_RECENCY_SECONDS,
    });

    logger.debug('Mention recorded in Redis', { actorId }, 'PlayerInfluence');
  } catch {
    // Fallback to in-memory cache
    memoryFallbackCache.set(actorId, timestamp);
    logger.debug(
      'Mention recorded in memory fallback',
      { actorId },
      'PlayerInfluence'
    );
  }
}

/**
 * Get the last mention timestamp for an actor
 */
async function getMentionTimestamp(actorId: string): Promise<Date | null> {
  try {
    const cached = await getCache<{ timestamp: string }>(actorId, {
      namespace: MENTION_CACHE_PREFIX,
    });

    if (cached?.timestamp) {
      return new Date(cached.timestamp);
    }
  } catch {
    // Fallback to in-memory cache
    const memoryValue = memoryFallbackCache.get(actorId);
    if (memoryValue) {
      return memoryValue;
    }
  }

  // Also check in-memory fallback (could have been set before Redis connected)
  const memoryValue = memoryFallbackCache.get(actorId);
  return memoryValue ?? null;
}

/**
 * Remove a mention from the cache
 */
async function removeMention(actorId: string): Promise<void> {
  try {
    await invalidateCache(actorId, { namespace: MENTION_CACHE_PREFIX });
  } catch {
    // Ignore Redis errors
  }
  memoryFallbackCache.delete(actorId);
}

/**
 * Handle a player mentioning an NPC in a post or comment
 */
export async function handlePlayerMention(
  playerId: string,
  mentionedActorId: string,
  postId: string
): Promise<void> {
  try {
    // 1. Record the mention in cache for probability boost (Redis with fallback)
    await recordMention(mentionedActorId, new Date());

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
export async function wasMentionedRecently(actorId: string): Promise<boolean> {
  const lastMention = await getMentionTimestamp(actorId);
  if (!lastMention) return false;

  const now = new Date();
  const isRecent =
    now.getTime() - lastMention.getTime() < MENTION_RECENCY_SECONDS * 1000;

  // Clean up old entries
  if (!isRecent) {
    await removeMention(actorId);
  }

  return isRecent;
}

/**
 * Synchronous check for recently mentioned (uses in-memory cache only)
 * Use this when async is not possible (e.g., in probability calculations)
 */
export function wasMentionedRecentlySync(actorId: string): boolean {
  const lastMention = memoryFallbackCache.get(actorId);
  if (!lastMention) return false;

  const now = new Date();
  const isRecent =
    now.getTime() - lastMention.getTime() < MENTION_RECENCY_SECONDS * 1000;

  // Clean up old entries
  if (!isRecent) {
    memoryFallbackCache.delete(actorId);
  }

  return isRecent;
}

/**
 * Get all recently mentioned actor IDs
 */
export async function getRecentlyMentionedActorIds(): Promise<string[]> {
  const now = new Date();
  const recentIds: string[] = [];

  try {
    // Try to get from Redis set
    const cachedSet = await getCache<string[]>(MENTION_SET_KEY, {});
    if (cachedSet && cachedSet.length > 0) {
      // Verify each ID is still valid
      for (const actorId of cachedSet) {
        const timestamp = await getMentionTimestamp(actorId);
        if (
          timestamp &&
          now.getTime() - timestamp.getTime() < MENTION_RECENCY_SECONDS * 1000
        ) {
          recentIds.push(actorId);
        }
      }
      return recentIds;
    }
  } catch {
    // Fallback to in-memory
  }

  // Fallback to in-memory cache
  for (const [actorId, lastMention] of memoryFallbackCache.entries()) {
    if (
      now.getTime() - lastMention.getTime() <
      MENTION_RECENCY_SECONDS * 1000
    ) {
      recentIds.push(actorId);
    } else {
      // Clean up old entries
      memoryFallbackCache.delete(actorId);
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

  async wasMentionedRecently(actorId: string): Promise<boolean> {
    return wasMentionedRecently(actorId);
  }

  wasMentionedRecentlySync(actorId: string): boolean {
    return wasMentionedRecentlySync(actorId);
  }

  async getRecentlyMentionedActorIds(): Promise<string[]> {
    return getRecentlyMentionedActorIds();
  }

  extractMentions(content: string): string[] {
    return extractMentions(content);
  }
}

// Singleton instance
export const playerInfluenceService = new PlayerInfluenceService();
