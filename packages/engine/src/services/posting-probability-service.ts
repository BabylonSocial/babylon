/**
 * Posting Probability Service
 *
 * Calculates the probability that an NPC should post in a given tick.
 * Combines multiple factors: tier, activity patterns, recency, events, mentions.
 */

import { type ActorStateRow, actorState, db, eq } from '@babylon/db';
import { ACTOR_TIERS, type ActorTier } from '@babylon/shared';
import { getActivityMultiplier } from './activity-pattern-service';

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
  }>;
}

/**
 * Base probability by tier.
 * S_TIER posts most frequently, C_TIER least.
 */
const BASE_PROBABILITY: Record<ActorTier, number> = {
  [ACTOR_TIERS.S_TIER]: 0.35,
  [ACTOR_TIERS.A_TIER]: 0.22,
  [ACTOR_TIERS.B_TIER]: 0.12,
  [ACTOR_TIERS.C_TIER]: 0.06,
};

/**
 * Maximum posts per day per NPC to prevent spam
 */
const MAX_POSTS_PER_DAY: Record<ActorTier, number> = {
  [ACTOR_TIERS.S_TIER]: 8,
  [ACTOR_TIERS.A_TIER]: 5,
  [ACTOR_TIERS.B_TIER]: 3,
  [ACTOR_TIERS.C_TIER]: 2,
};

/**
 * Calculate posting probability for an NPC.
 *
 * Formula:
 *   base (tier) × time multiplier × recency boost × event boost × mention boost
 *
 * Capped at 0.95 to always allow some randomness.
 */
export function calculatePostingProbability(
  actor: PostingActor,
  state: ActorStateRow | null,
  context: PostingContext
): number {
  const tier = actor.tier ?? ACTOR_TIERS.B_TIER;

  // Check daily post cap
  const maxPosts = MAX_POSTS_PER_DAY[tier];
  const postsToday = state?.postsToday ?? 0;
  if (postsToday >= maxPosts) {
    return 0; // Hit daily cap
  }

  // Base probability from tier
  let prob = BASE_PROBABILITY[tier];

  // Time multiplier from activity patterns
  const timeMultiplier = getActivityMultiplier(actor, context.currentTime);
  prob *= timeMultiplier;

  // Recency boost: longer since last post = higher chance
  const hoursSinceLastPost = getHoursSince(state?.lastPostAt ?? null);
  // Boost grows from 1.0 to 2.5 over 6 hours
  const recencyBoost = Math.min(1.0 + hoursSinceLastPost / 6, 2.5);
  prob *= recencyBoost;

  // Event boost: if a relevant event just occurred
  if (hasRelevantActiveEvent(actor, context)) {
    prob *= 1.8;
  }

  // Mention boost: if mentioned by player/NPC recently
  if (context.recentlyMentionedActorIds.includes(actor.id)) {
    prob *= 2.5;
  }

  // Affiliation boost: if event affects actor's organization
  if (hasAffiliatedEvent(actor, context)) {
    prob *= 1.5;
  }

  // Cap at 95%
  return Math.min(prob, 0.95);
}

/**
 * Calculate hours since a timestamp (returns Infinity if null).
 */
function getHoursSince(timestamp: Date | null): number {
  if (!timestamp) {
    return 24; // Default to 24 hours if never posted
  }
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Check if there's an active event relevant to this actor's domain.
 */
function hasRelevantActiveEvent(
  actor: PostingActor,
  context: PostingContext
): boolean {
  // Check if actor is directly affected by any active event
  return context.activeEvents.some((event) =>
    event.affectedActorIds.includes(actor.id)
  );
}

/**
 * Check if an event affects one of the actor's affiliated organizations.
 */
function hasAffiliatedEvent(
  actor: PostingActor,
  _context: PostingContext
): boolean {
  const affiliations = actor.affiliations ?? [];
  if (affiliations.length === 0) return false;

  // Check if any active event involves actor's affiliations
  // This would require event data to include affected org IDs
  // For now, return false - will be enhanced in Phase 4
  return false;
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
        : // For multiple IDs, we'd use inArray but for now fetch all and filter
          undefined
    );

  const stateMap = new Map<string, ActorStateRow>();
  for (const state of states) {
    if (actorIds.includes(state.id)) {
      stateMap.set(state.id, state);
    }
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
