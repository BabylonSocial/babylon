/**
 * User Verify Twitter Follow API
 *
 * @route POST /api/users/[userId]/verify-twitter-follow - Verify Twitter follow
 * @access Authenticated
 *
 * @description
 * Awards points for following @PlayBabylon on Twitter/X.
 * Uses a trusted reward system (no API verification needed).
 *
 * @example
 * ```typescript
 * await fetch(`/api/users/${userId}/verify-twitter-follow`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 * });
 * ```
 */

import {
  AuthorizationError,
  authenticate,
  BusinessLogicError,
  invalidateCache,
  PointsService,
  requireUserByIdentifier,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { db, eq, users } from '@babylon/db';
import { logger, UserIdParamSchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * POST /api/users/[userId]/verify-twitter-follow
 * Award points for following @PlayBabylon on Twitter (trusted system)
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
  ) => {
    // Authenticate user
    const authUser = await authenticate(request);
    const { userId } = UserIdParamSchema.parse(await context.params);

    // Check if the authenticated user has a database record
    if (!authUser.dbUserId) {
      throw new AuthorizationError(
        'User profile not found. Please complete onboarding first.',
        'twitter-follow-verification',
        'create'
      );
    }

    const targetUser = await requireUserByIdentifier(userId, { id: true });
    const canonicalUserId = targetUser.id;

    // Verify user is claiming their own follow reward
    if (authUser.dbUserId !== canonicalUserId) {
      throw new AuthorizationError(
        'You can only claim your own Twitter follow reward',
        'twitter-follow-verification',
        'create'
      );
    }

    // Get user's Twitter info
    const [user] = await db
      .select({
        twitterUsername: users.twitterUsername,
        twitterId: users.twitterId,
        pointsAwardedForTwitterFollow: users.pointsAwardedForTwitterFollow,
      })
      .from(users)
      .where(eq(users.id, canonicalUserId))
      .limit(1);

    // VALIDATION: Check if user has linked Twitter account
    if (!user?.twitterUsername && !user?.twitterId) {
      throw new BusinessLogicError(
        'Please link your Twitter account first to claim this reward.',
        'TWITTER_NOT_LINKED'
      );
    }

    const alreadyAwarded = user.pointsAwardedForTwitterFollow;

    if (alreadyAwarded) {
      logger.info(
        'Twitter follow reward already claimed',
        { userId: canonicalUserId },
        'POST /api/users/[userId]/verify-twitter-follow'
      );

      return successResponse({
        verified: true,
        message: 'You already received points for this action.',
        points: {
          awarded: 0,
          newTotal: 0,
        },
      });
    }

    // Award points (trusted system - no API verification)
    const pointsResult =
      await PointsService.awardTwitterFollow(canonicalUserId);

    let pointsAwarded = 0;
    let newPointsTotal = 0;

    if (pointsResult.success) {
      pointsAwarded = pointsResult.pointsAwarded;
      newPointsTotal = pointsResult.newTotal;

      // Ensure waitlist dashboard reflects new points immediately.
      await invalidateCache(canonicalUserId, {
        namespace: 'waitlist:position',
      });

      logger.info(
        `Awarded ${pointsAwarded} points for Twitter follow (trusted)`,
        { userId: canonicalUserId, pointsAwarded },
        'POST /api/users/[userId]/verify-twitter-follow'
      );
    }

    return successResponse({
      verified: true,
      message:
        pointsAwarded > 0
          ? `Thank you for following! You earned ${pointsAwarded} points.`
          : 'Follow reward claimed successfully!',
      points: {
        awarded: pointsAwarded,
        newTotal: newPointsTotal,
      },
    });
  }
);
