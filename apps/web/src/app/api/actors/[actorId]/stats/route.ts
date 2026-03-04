/**
 * Actor Statistics API
 *
 * @route GET /api/actors/[actorId]/stats
 * @access Public
 *
 * @description
 * Returns comprehensive statistics for a specific actor (NPC), including follower
 * counts (from both ActorFollow and UserActorFollow), following count, and post count.
 * Supports lookup by actor ID or name (case-insensitive).
 *
 * @param {string} actorId - Actor ID or name (path parameter)
 *
 * @returns {Promise<NextResponse>} Actor statistics including followers, following, and posts
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/actors/actor_123/stats');
 * const { stats } = await response.json();
 * console.log(stats.followers); // Total follower count
 * ```
 *
 * @see {@link @babylon/api} Error handling utilities
 */

import {
  BusinessLogicError,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { db } from '@babylon/db';
import { StaticDataRegistry } from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * GET /api/actors/[actorId]/stats
 *
 * @description Get actor statistics (followers, following, posts)
 *
 * @param {NextRequest} _request - Request object
 * @param {Promise<{actorId: string}>} context.params - Route parameters
 *
 * @returns {Promise<NextResponse>} Actor statistics
 */
export const GET = withErrorHandling(
  async (
    _request: NextRequest,
    context: { params: Promise<{ actorId: string }> }
  ) => {
    const params = await context.params;
    const { actorId } = params;

    // Try to find actor by ID first, then by name (case-insensitive)
    let actor = StaticDataRegistry.getActor(actorId);

    // If not found by ID, try finding by name
    if (!actor) {
      actor =
        StaticDataRegistry.getAllActors().find(
          (a) => a.name.toLowerCase() === actorId.toLowerCase()
        ) ?? null;
    }

    if (!actor) {
      throw new BusinessLogicError(`Actor ${actorId} not found`, 'NOT_FOUND');
    }

    const actualActorId = actor.id;

    // Get follower counts (both from ActorFollow and UserActorFollow)
    const [
      actorFollowerCount,
      userActorFollowerCount,
      followingCount,
      postCount,
    ] = await Promise.all([
      // NPCs following this actor (ActorFollow)
      db.actorFollow.count({
        where: { followingId: actualActorId },
      }),
      // Users following this actor (UserActorFollow)
      db.userActorFollow.count({
        where: {
          actorId: actualActorId,
        },
      }),
      // This actor following others (only NPC-to-NPC follows via ActorFollow)
      db.actorFollow.count({
        where: { followerId: actualActorId },
      }),
      // Posts by this actor
      db.post.count({
        where: { authorId: actualActorId },
      }),
    ]);

    const totalFollowers = actorFollowerCount + userActorFollowerCount;

    logger.info(
      'Actor stats fetched successfully',
      {
        actorId,
        actualActorId,
        totalFollowers,
        actorFollowerCount,
        userActorFollowerCount,
        followingCount,
      },
      'GET /api/actors/[actorId]/stats'
    );

    return successResponse({
      stats: {
        followers: totalFollowers,
        following: followingCount,
        posts: postCount,
        actorFollowers: actorFollowerCount,
        userFollowers: userActorFollowerCount,
      },
    });
  }
);
