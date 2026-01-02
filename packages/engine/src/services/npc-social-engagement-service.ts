/**
 * NPC Social Engagement Service
 *
 * Organic social interactions for NPCs based on:
 * - Affiliations (actors engage more with their orgs)
 * - Post type (articles get more engagement)
 * - Author relationships (affiliated actors engage more with each other)
 * - Natural randomness with jitter
 */

import {
  and,
  comments,
  count,
  db,
  desc,
  gte,
  inArray,
  isNull,
  posts,
  reactions,
  shares,
} from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { BabylonLLMClient } from '../llm/openai-client';
import { secureRandom } from '../utils/entropy';
import { StaticDataRegistry } from './static-data-registry';

// =============================================================================
// TYPES
// =============================================================================

export interface SocialEngagementResult {
  likesCreated: number;
  sharesCreated: number;
  commentsCreated: number;
  actorsEngaged: number;
}

/** Actor context for engagement decisions */
interface ActorContext {
  id: string;
  name: string;
  personality?: string;
  affiliations: string[];
}

/** Post context for engagement decisions */
interface PostContext {
  id: string;
  authorId: string;
  content: string;
  type: string;
  authorAffiliations: string[];
}

// =============================================================================
// CONFIG
// =============================================================================

/** Base probabilities - before affiliation/relationship boosts */
const BASE_LIKE_PROB = 0.06;
const BASE_SHARE_PROB = 0.015;
const BASE_COMMENT_PROB = 0.008;

/** Boost multipliers for relationships */
const AFFILIATION_BOOST = 1.8; // Same org = 80% more likely
const ARTICLE_BOOST = 1.5; // Articles get 50% more engagement

/** Caps to prevent spam */
const MAX_LIKES_PER_TICK = 12;
const MAX_SHARES_PER_TICK = 4;
const MAX_COMMENTS_PER_TICK = 3;

/** Sampling config */
const ACTORS_TO_SAMPLE = 15;
const POSTS_TO_CONSIDER = 30;

// =============================================================================
// LLM CLIENT
// =============================================================================

let llmClientRef: BabylonLLMClient | null = null;

export function setSocialEngagementLLMClient(client: BabylonLLMClient): void {
  llmClientRef = client;
}

// =============================================================================
// MAIN SERVICE
// =============================================================================

/**
 * Process NPC social engagements with relationship-aware probability.
 */
export async function processNPCSocialEngagements(): Promise<SocialEngagementResult> {
  const result: SocialEngagementResult = {
    likesCreated: 0,
    sharesCreated: 0,
    commentsCreated: 0,
    actorsEngaged: 0,
  };

  try {
    // Get recent posts (last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentPostsRaw = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        type: posts.type,
      })
      .from(posts)
      .where(and(isNull(posts.deletedAt), gte(posts.timestamp, sixHoursAgo)))
      .orderBy(desc(posts.timestamp))
      .limit(POSTS_TO_CONSIDER);

    if (recentPostsRaw.length === 0) return result;

    // Enrich posts with author affiliations
    const recentPosts: PostContext[] = recentPostsRaw.map((p) => {
      const author = StaticDataRegistry.getActor(p.authorId);
      return {
        ...p,
        authorAffiliations: author?.affiliations ?? [],
      };
    });

    // Randomly sample actors
    const allActors = StaticDataRegistry.getAllActors();
    const shuffled = [...allActors].sort(() => secureRandom() - 0.5);
    const sampledActors: ActorContext[] = shuffled
      .slice(0, ACTORS_TO_SAMPLE)
      .map((a) => ({
        id: a.id,
        name: a.name,
        personality: a.personality,
        affiliations: a.affiliations ?? [],
      }));

    // Get existing engagements
    const postIds = recentPosts.map((p) => p.id);
    const [existingReactions, existingShares] = await Promise.all([
      db
        .select({ postId: reactions.postId, userId: reactions.userId })
        .from(reactions)
        .where(inArray(reactions.postId, postIds)),
      db
        .select({ postId: shares.postId, userId: shares.userId })
        .from(shares)
        .where(inArray(shares.postId, postIds)),
    ]);

    const reactionSet = new Set(
      existingReactions.map((r) => `${r.postId}-${r.userId}`)
    );
    const shareSet = new Set(
      existingShares.map((s) => `${s.postId}-${s.userId}`)
    );
    const engagedActors = new Set<string>();

    for (const actor of sampledActors) {
      // Random skip for organic feel
      if (secureRandom() < 0.3) continue;

      for (const post of recentPosts) {
        if (post.authorId === actor.id) continue;
        if (result.likesCreated >= MAX_LIKES_PER_TICK) break;

        const key = `${post.id}-${actor.id}`;
        const probs = calculateEngagementProbability(actor, post);

        // LIKE
        if (!reactionSet.has(key) && secureRandom() < probs.like) {
          await db.insert(reactions).values({
            id: await generateSnowflakeId(),
            postId: post.id,
            userId: actor.id,
            type: 'like',
          });
          result.likesCreated++;
          reactionSet.add(key);
          engagedActors.add(actor.id);
        }

        // SHARE
        if (!shareSet.has(key) && result.sharesCreated < MAX_SHARES_PER_TICK) {
          if (secureRandom() < probs.share) {
            await db.insert(shares).values({
              id: await generateSnowflakeId(),
              postId: post.id,
              userId: actor.id,
            });
            result.sharesCreated++;
            shareSet.add(key);
            engagedActors.add(actor.id);
          }
        }

        // COMMENT
        if (llmClientRef && result.commentsCreated < MAX_COMMENTS_PER_TICK) {
          if (secureRandom() < probs.comment) {
            const comment = await generateNPCComment(actor, post);
            if (comment) {
              await db.insert(comments).values({
                id: await generateSnowflakeId(),
                postId: post.id,
                authorId: actor.id,
                content: comment,
                updatedAt: new Date(),
              });
              result.commentsCreated++;
              engagedActors.add(actor.id);
            }
          }
        }
      }
    }

    result.actorsEngaged = engagedActors.size;

    if (
      result.likesCreated + result.sharesCreated + result.commentsCreated >
      0
    ) {
      logger.info(
        'NPC engagement',
        {
          likes: result.likesCreated,
          shares: result.sharesCreated,
          comments: result.commentsCreated,
        },
        'NPCSocialEngagement'
      );
    }
  } catch (error) {
    logger.error(
      'NPC engagement failed',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'NPCSocialEngagement'
    );
  }

  return result;
}

// =============================================================================
// PROBABILITY CALCULATION
// =============================================================================

/**
 * Calculate engagement probability based on affiliations and post type.
 * Simple multipliers, no complex formulas.
 */
function calculateEngagementProbability(
  actor: ActorContext,
  post: PostContext
): { like: number; share: number; comment: number } {
  let likeProb = BASE_LIKE_PROB;
  let shareProb = BASE_SHARE_PROB;
  let commentProb = BASE_COMMENT_PROB;

  // Affiliation boost: actors engage more with content from their orgs
  const sharedAffiliations = actor.affiliations.filter((a) =>
    post.authorAffiliations.includes(a)
  );
  if (sharedAffiliations.length > 0) {
    likeProb *= AFFILIATION_BOOST;
    shareProb *= AFFILIATION_BOOST;
    commentProb *= AFFILIATION_BOOST * 1.2; // Even more likely to comment on "their people"
  }

  // Article boost: higher quality content gets more engagement
  if (post.type === 'article') {
    likeProb *= ARTICLE_BOOST;
    shareProb *= ARTICLE_BOOST * 1.3; // Articles get shared more
    commentProb *= ARTICLE_BOOST;
  }

  // Add jitter for organic feel (±15% variance)
  const jitter = () => 1 + (secureRandom() - 0.5) * 0.3;

  return {
    like: Math.min(likeProb * jitter(), 0.4), // Cap at 40%
    share: Math.min(shareProb * jitter(), 0.15), // Cap at 15%
    comment: Math.min(commentProb * jitter(), 0.1), // Cap at 10%
  };
}

// =============================================================================
// COMMENT GENERATION
// =============================================================================

/**
 * Generate a comment with full actor context
 */
async function generateNPCComment(
  actor: ActorContext,
  post: PostContext
): Promise<string | null> {
  if (!llmClientRef) return null;

  try {
    const postAuthor = StaticDataRegistry.getActor(post.authorId);
    const authorName = postAuthor?.name ?? 'someone';

    // Note shared affiliations for context
    const sharedOrgs = actor.affiliations
      .filter((a) => post.authorAffiliations.includes(a))
      .map((orgId) => StaticDataRegistry.getOrganization(orgId)?.name)
      .filter(Boolean);

    const affiliationContext =
      sharedOrgs.length > 0
        ? `You both work with ${sharedOrgs.join(', ')}. `
        : '';

    const prompt = `You're ${actor.name}${actor.personality ? ` (${actor.personality})` : ''}.
${affiliationContext}Reply to this post by ${authorName} in 1-2 sentences. Be natural, no hashtags/emojis.

Post: "${post.content.slice(0, 250)}"

<response><comment>Your reply</comment></response>`;

    interface CommentResponse {
      comment: string;
    }
    const response = await llmClientRef.generateJSON<CommentResponse>(
      prompt,
      undefined,
      {
        maxTokens: 100,
        temperature: 0.85,
        promptType: 'npc-comment',
      }
    );

    const comment = response.comment?.trim();
    return comment && comment.length > 3 && comment.length < 300
      ? comment
      : null;
  } catch {
    return null;
  }
}

// =============================================================================
// STATS - Simple counts for monitoring
// =============================================================================

export interface EngagementStats {
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  last24hLikes: number;
  last24hShares: number;
  last24hComments: number;
}

/**
 * Get engagement statistics for monitoring dashboards
 */
export async function getEngagementStats(): Promise<EngagementStats> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    [totalLikesResult],
    [totalSharesResult],
    [totalCommentsResult],
    [recentLikesResult],
    [recentSharesResult],
    [recentCommentsResult],
  ] = await Promise.all([
    db.select({ count: count() }).from(reactions),
    db.select({ count: count() }).from(shares),
    db
      .select({ count: count() })
      .from(comments)
      .where(isNull(comments.deletedAt)),
    db
      .select({ count: count() })
      .from(reactions)
      .where(gte(reactions.createdAt, oneDayAgo)),
    db
      .select({ count: count() })
      .from(shares)
      .where(gte(shares.createdAt, oneDayAgo)),
    db
      .select({ count: count() })
      .from(comments)
      .where(
        and(isNull(comments.deletedAt), gte(comments.createdAt, oneDayAgo))
      ),
  ]);

  return {
    totalLikes: totalLikesResult?.count ?? 0,
    totalShares: totalSharesResult?.count ?? 0,
    totalComments: totalCommentsResult?.count ?? 0,
    last24hLikes: recentLikesResult?.count ?? 0,
    last24hShares: recentSharesResult?.count ?? 0,
    last24hComments: recentCommentsResult?.count ?? 0,
  };
}
