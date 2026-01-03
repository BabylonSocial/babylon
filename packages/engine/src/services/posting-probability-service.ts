/**
 * Posting Probability Service
 *
 * SIMPLIFIED: Equal probability for all NPCs with spam prevention.
 * Tier affects post quality/voice, not posting frequency.
 * Entropy > elaborate probability math.
 */

import {
  type ActorStateRow,
  actorState,
  db,
  desc,
  eq,
  gte,
  inArray,
  worldEvents,
} from '@babylon/db';
import { type ActorTier } from '@babylon/shared';
import { StaticDataRegistry } from './static-data-registry';

/**
 * Minimal actor interface for posting probability.
 * Compatible with both Actor and StaticActor types.
 */
export interface PostingActor {
  id: string;
  domain?: string[];
  personality?: string;
  affiliations?: string[];
  tier?: ActorTier | null;
}

/**
 * Context needed to calculate posting probability
 */
export interface PostingContext {
  /** Current UTC hour (0-23) */
  currentHour: number;
  /** Current timestamp */
  currentTime: Date;
  /** IDs of actors mentioned in recent posts/comments */
  recentlyMentionedActorIds: string[];
  /** IDs of questions with recent events */
  activeEventQuestionIds: string[];
  /** Active event summaries for context */
  activeEvents: Array<{
    questionId: string;
    affectedActorIds: string[];
    /** Stock tickers affected by this event */
    affectedStocks?: string[];
  }>;
}

/**
 * SIMPLIFIED: Equal base probability for all tiers.
 * All NPCs have equal chance to post - creates natural entropy.
 * Reduced from 0.5 to encourage more action variety.
 */
const BASE_PROBABILITY = 0.25;

/**
 * Maximum posts per day per NPC to prevent spam.
 * Same for all tiers - fair rotation.
 * Reduced from 4 to limit feed saturation.
 */
const MAX_POSTS_PER_DAY = 3;

/**
 * Minimum hours between posts for same NPC.
 * Prevents same NPC posting multiple times per tick.
 * Increased from 1 to spread posts out more.
 */
const MIN_HOURS_BETWEEN_POSTS = 2;

/**
 * Boost when actor was mentioned by player (keeps engagement reactive)
 */
const MENTION_BOOST = 1.5;

/**
 * Boost when actor is affiliated with an active event
 * (e.g., their org's stock is being affected by narrative events)
 */
const AFFILIATION_BOOST = 1.5;

/**
 * Build a map of org ID -> ticker for efficient lookup.
 * Cached at module level since org data is static.
 */
let orgIdToTickerMap: Map<string, string> | null = null;

function getOrgIdToTickerMap(): Map<string, string> {
  if (!orgIdToTickerMap) {
    orgIdToTickerMap = new Map();
    const allOrgs = StaticDataRegistry.getAllOrganizations();
    for (const org of allOrgs) {
      if (org.ticker) {
        orgIdToTickerMap.set(org.id.toLowerCase(), org.ticker.toLowerCase());
      }
    }
  }
  return orgIdToTickerMap;
}

/**
 * Build a map of actor ID -> affiliated stock tickers.
 * Cached at module level since actor affiliations are static.
 */
let actorToStocksMap: Map<string, string[]> | null = null;

function getActorToStocksMap(): Map<string, string[]> {
  if (!actorToStocksMap) {
    actorToStocksMap = new Map();
    const allActors = StaticDataRegistry.getAllActors();
    const orgToTicker = getOrgIdToTickerMap();

    for (const actor of allActors) {
      if (actor.affiliations && actor.affiliations.length > 0) {
        const tickers = actor.affiliations
          .map((affId) => orgToTicker.get(affId.toLowerCase()))
          .filter((t): t is string => t !== undefined);
        if (tickers.length > 0) {
          actorToStocksMap.set(actor.id, tickers);
        }
      }
    }
  }
  return actorToStocksMap;
}

/**
 * Clear the static data caches.
 * Useful for testing or when actor/org data is known to have changed.
 */
export function clearStaticDataCaches(): void {
  orgIdToTickerMap = null;
  actorToStocksMap = null;
}

/**
 * Check if an actor has an affiliated event in the current context.
 * Returns true if:
 * - Actor is directly listed in an event's affectedActorIds
 * - Actor's org affiliations have tickers that match affected stocks (exact match)
 */
function hasAffiliatedEvent(
  actor: PostingActor,
  context: PostingContext
): boolean {
  if (context.activeEvents.length === 0) {
    return false;
  }

  // Get the org ID -> ticker map for proper lookup
  const orgToTicker = getOrgIdToTickerMap();

  for (const event of context.activeEvents) {
    // Check if actor is directly affected by the event
    if (event.affectedActorIds.includes(actor.id)) {
      return true;
    }

    // Check if actor's org affiliations have tickers that match affected stocks
    if (
      actor.affiliations &&
      event.affectedStocks &&
      event.affectedStocks.length > 0
    ) {
      // Convert affected stocks to lowercase Set for O(1) lookup
      const affectedStocksLower = new Set(
        event.affectedStocks.map((s) => s.toLowerCase())
      );

      for (const affiliation of actor.affiliations) {
        // Look up the ticker for this org ID
        const ticker = orgToTicker.get(affiliation.toLowerCase());
        if (ticker && affectedStocksLower.has(ticker)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Calculate posting probability for an NPC.
 *
 * Formula:
 *   base × spam_check × mention_boost × affiliation_boost
 *
 * All NPCs have equal base chance. Spam prevention keeps it fair.
 * Boosts apply for player mentions and active narrative events.
 */
export function calculatePostingProbability(
  actor: PostingActor,
  state: ActorStateRow | null,
  context: PostingContext
): number {
  const postsToday = state?.postsToday ?? 0;

  // Daily cap check - prevent any single NPC from dominating
  if (postsToday >= MAX_POSTS_PER_DAY) {
    return 0;
  }

  // Recent post check - spread posts out over time
  // Use context.currentTime for consistency with the context snapshot
  if (state?.lastPostAt) {
    const hoursSinceLastPost =
      (context.currentTime.getTime() - state.lastPostAt.getTime()) /
      (1000 * 60 * 60);
    if (hoursSinceLastPost < MIN_HOURS_BETWEEN_POSTS) {
      return 0; // Posted too recently
    }
  }

  // Base probability - equal for all
  let prob = BASE_PROBABILITY;

  // Mention boost - keep this for player engagement reactivity
  if (context.recentlyMentionedActorIds.includes(actor.id)) {
    prob *= MENTION_BOOST;
  }

  // Affiliation boost - NPCs related to active events are more likely to post
  if (hasAffiliatedEvent(actor, context)) {
    prob *= AFFILIATION_BOOST;
  }

  return Math.min(prob, 1.0);
}

/**
 * Weighted random sample from a list of candidates.
 * Uses probabilities as weights.
 */
export function weightedRandomSample<T extends { probability: number }>(
  candidates: T[],
  count: number
): T[] {
  if (candidates.length === 0) return [];
  if (candidates.length <= count) return [...candidates];

  const selected: T[] = [];
  const remaining = [...candidates];

  while (selected.length < count && remaining.length > 0) {
    // Calculate total weight
    const totalWeight = remaining.reduce((sum, c) => sum + c.probability, 0);

    if (totalWeight <= 0) {
      // All remaining have 0 probability, pick randomly
      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(idx, 1)[0]!);
      continue;
    }

    // Random selection weighted by probability
    let random = Math.random() * totalWeight;
    let selectedIdx = 0;

    for (let i = 0; i < remaining.length; i++) {
      random -= remaining[i]!.probability;
      if (random <= 0) {
        selectedIdx = i;
        break;
      }
    }

    selected.push(remaining.splice(selectedIdx, 1)[0]!);
  }

  return selected;
}

/**
 * Get NPC state for all actors from database.
 */
export async function getNpcsWithState(
  actorIds: string[]
): Promise<Map<string, ActorStateRow>> {
  if (actorIds.length === 0) return new Map();

  const states = await db
    .select()
    .from(actorState)
    .where(
      actorIds.length === 1
        ? eq(actorState.id, actorIds[0]!)
        : inArray(actorState.id, actorIds)
    );

  const stateMap = new Map<string, ActorStateRow>();
  for (const state of states) {
    stateMap.set(state.id, state);
  }

  return stateMap;
}

/**
 * Posting Probability Service class for dependency injection.
 */
export class PostingProbabilityService {
  calculate(
    actor: PostingActor,
    state: ActorStateRow | null,
    context: PostingContext
  ): number {
    return calculatePostingProbability(actor, state, context);
  }

  weightedSample<T extends { probability: number }>(
    candidates: T[],
    count: number
  ): T[] {
    return weightedRandomSample(candidates, count);
  }

  async getStateMap(actorIds: string[]): Promise<Map<string, ActorStateRow>> {
    return getNpcsWithState(actorIds);
  }
}

// Singleton instance
export const postingProbabilityService = new PostingProbabilityService();

/**
 * How many hours to look back for "recent" events
 */
const RECENT_EVENTS_HOURS = 6;

/**
 * Cache duration for active events (in milliseconds)
 * Events don't change frequently, so cache for 2 minutes
 */
const ACTIVE_EVENTS_CACHE_MS = 2 * 60 * 1000;

/**
 * Cached active events result
 */
let activeEventsCache: {
  data: {
    activeEventQuestionIds: string[];
    activeEvents: PostingContext['activeEvents'];
  };
  timestamp: number;
} | null = null;

/**
 * Fetch active events for use in PostingContext.
 * Returns events from the last RECENT_EVENTS_HOURS hours.
 * Results are cached for ACTIVE_EVENTS_CACHE_MS to reduce DB load.
 *
 * @returns Object with activeEventQuestionIds and activeEvents arrays
 */
export async function getActiveEventsForPosting(): Promise<{
  activeEventQuestionIds: string[];
  activeEvents: PostingContext['activeEvents'];
}> {
  const now = Date.now();

  // Return cached result if still valid
  if (
    activeEventsCache &&
    now - activeEventsCache.timestamp < ACTIVE_EVENTS_CACHE_MS
  ) {
    return activeEventsCache.data;
  }

  const currentDate = new Date();
  const cutoff = new Date(
    currentDate.getTime() - RECENT_EVENTS_HOURS * 60 * 60 * 1000
  );

  // Fetch recent world events
  const recentEvents = await db
    .select()
    .from(worldEvents)
    .where(gte(worldEvents.timestamp, cutoff))
    .orderBy(desc(worldEvents.timestamp))
    .limit(50);

  // Build active events for posting context
  const activeEvents: PostingContext['activeEvents'] = [];
  const activeEventQuestionIds = new Set<string>();

  // Use cached actor -> stocks mapping (built from static data)
  const actorToStocks = getActorToStocksMap();

  for (const event of recentEvents) {
    const actorIds = (event.actors || []) as string[];

    // Collect affected stocks from affiliated actors
    const affectedStocks = new Set<string>();
    for (const actorId of actorIds) {
      const stocks = actorToStocks.get(actorId) || [];
      for (const stock of stocks) {
        affectedStocks.add(stock);
      }
    }

    activeEvents.push({
      questionId: event.relatedQuestion?.toString() || '',
      affectedActorIds: actorIds,
      affectedStocks: Array.from(affectedStocks),
    });

    if (event.relatedQuestion) {
      activeEventQuestionIds.add(event.relatedQuestion.toString());
    }
  }

  const result = {
    activeEventQuestionIds: Array.from(activeEventQuestionIds),
    activeEvents,
  };

  // Cache the result
  activeEventsCache = {
    data: result,
    timestamp: now,
  };

  return result;
}

/**
 * Clear the active events cache.
 * Useful for testing or when events are known to have changed.
 */
export function clearActiveEventsCache(): void {
  activeEventsCache = null;
}
