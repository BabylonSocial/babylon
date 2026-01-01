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

/**
 * Threshold for a "significant" trade (in game currency)
 */
const SIGNIFICANT_TRADE_THRESHOLD = 1000;

/**
 * Recent mention tracking (in-memory cache, cleared on restart)
 * Maps actorId -> timestamp of last mention
 */
const recentMentions = new Map<string, Date>();

/**
 * How long a mention stays "recent" (in ms)
 */
const MENTION_RECENCY_WINDOW = 30 * 60 * 1000; // 30 minutes

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

  for (const [actorId, lastMention] of recentMentions) {
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

    for (const npcId of relevantNpcs) {
      // Add to NPC's memory
      await npcMemoryService.addMemory(npcId, {
        type: 'witnessed_event',
        timestamp: new Date().toISOString(),
        summary: `A player took a ${size >= 5000 ? 'large ' : ''}${side} position on ${stockTicker}`,
        actorIds: [playerId],
        sentiment: side === 'long' ? 0.1 : -0.1,
      });
    }

    logger.info(
      `Player trade recorded for ${relevantNpcs.length} NPCs`,
      { playerId, stockTicker, side, size, affectedNpcs: relevantNpcs.length },
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
 * Get NPC IDs affiliated with a stock ticker's organization
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

  // Get all actor states and check for affiliation
  // Note: In production, we'd have a proper affiliation index
  // For now, return empty - affiliations are in static data
  // This will be populated when we integrate with StaticDataRegistry
  return [];
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
