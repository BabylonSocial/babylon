/**
 * Posting Probability Service
 *
 * SIMPLIFIED: Equal probability for all NPCs with spam prevention.
 * Tier affects post quality/voice, not posting frequency.
 * Entropy > elaborate probability math.
 */

import { type ActorStateRow, actorState, db, eq, inArray } from '@babylon/db';
import { type ActorTier } from '@babylon/shared';

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
 */
const BASE_PROBABILITY = 0.5;

/**
 * Maximum posts per day per NPC to prevent spam.
 * Same for all tiers - fair rotation.
 */
const MAX_POSTS_PER_DAY = 4;

/**
 * Minimum hours between posts for same NPC.
 * Prevents same NPC posting multiple times per tick.
 */
const MIN_HOURS_BETWEEN_POSTS = 1;

/**
 * Boost when actor was mentioned by player (keeps engagement reactive)
 */
const MENTION_BOOST = 1.5;

/**
 * Calculate posting probability for an NPC.
 *
 * SIMPLIFIED formula:
 *   base × spam_check × mention_boost
 *
 * All NPCs have equal base chance. Spam prevention keeps it fair.
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
  if (state?.lastPostAt) {
    const hoursSinceLastPost =
      (Date.now() - state.lastPostAt.getTime()) / (1000 * 60 * 60);
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
