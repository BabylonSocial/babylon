/**
 * User Profile API Route
 *
 * @description Retrieves comprehensive user profile information including stats, social connections, and account details
 *
 * @route GET /api/users/[userId]/profile
 * @access Public (no authentication required)
 */

import {
  addPublicReadHeaders,
  cachedDb,
  findUserByIdentifier,
  publicRateLimit,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { logger, UserIdParamSchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * GET Handler for User Profile
 *
 * @description Retrieves comprehensive user profile information including stats and social connections
 *
 * @param {NextRequest} request - Next.js request object
 * @param {Object} context - Route context containing dynamic parameters
 * @param {Promise<{userId: string}>} context.params - Dynamic route parameters
 *
 * @returns {Promise<NextResponse>} User profile data with stats
 *
 * @throws {NotFoundError} When user is not found
 * @throws {ValidationError} When userId parameter is invalid
 *
 * @example
 * ```typescript
 * // Request
 * GET /api/users/johndoe/profile
 *
 * // Response
 * {
 *   "user": {
 *     "id": "user_123",
 *     "username": "johndoe",
 *     "displayName": "John Doe",
 *     "virtualBalance": 10000,
 *     "stats": {
 *       "followers": 150,
 *       "following": 75,
 *       "posts": 42
 *     }
 *   }
 * }
 * ```
 */
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
  ) => {
    const { error, rateLimitInfo } = await publicRateLimit(request);
    if (error) return error;

    const params = await context.params;
    const { userId } = UserIdParamSchema.parse(params);

    // Get user profile - use findUserByIdentifier to handle new Privy users gracefully
    const dbUser = await findUserByIdentifier(userId, {
      id: true,
      walletAddress: true,
      username: true,
      displayName: true,
      bio: true,
      profileImageUrl: true,
      coverImageUrl: true,
      isActor: true,
      isAgent: true,
      managedBy: true,
      profileComplete: true,
      hasUsername: true,
      hasBio: true,
      hasProfileImage: true,
      onChainRegistered: true,
      nftTokenId: true,
      virtualBalance: true,
      lifetimePnL: true,
      reputationPoints: true,
      totalPoints: true,
      earnedPoints: true,
      invitePoints: true,
      bonusPoints: true,
      referralCount: true,
      referralCode: true,
      hasFarcaster: true,
      hasTwitter: true,
      farcasterUsername: true,
      twitterUsername: true,
      usernameChangedAt: true,
      createdAt: true,
    });

    // If user doesn't exist yet (new Privy user who hasn't completed signup), return null
    if (!dbUser) {
      logger.info(
        "User not found - new Privy user who hasn't completed signup",
        { userId },
        'GET /api/users/[userId]/profile'
      );
      return successResponse({
        user: null,
      });
    }

    // Get cached profile stats (followers, following, posts, etc.)
    const stats = await cachedDb.getUserProfileStats(dbUser.id);

    logger.info(
      'User profile fetched successfully',
      { userId, stats },
      'GET /api/users/[userId]/profile'
    );

    const res = successResponse({
      user: {
        id: dbUser.id,
        walletAddress: dbUser.walletAddress,
        username: dbUser.username,
        displayName: dbUser.displayName,
        bio: dbUser.bio,
        profileImageUrl: dbUser.profileImageUrl,
        coverImageUrl: dbUser.coverImageUrl,
        isActor: dbUser.isActor,
        isAgent: dbUser.isAgent,
        managedBy: dbUser.managedBy,
        profileComplete: dbUser.profileComplete,
        hasUsername: dbUser.hasUsername,
        hasBio: dbUser.hasBio,
        hasProfileImage: dbUser.hasProfileImage,
        onChainRegistered: dbUser.onChainRegistered,
        nftTokenId: dbUser.nftTokenId,
        virtualBalance: Number(dbUser.virtualBalance ?? 0),
        lifetimePnL: Number(dbUser.lifetimePnL ?? 0),
        reputationPoints: dbUser.reputationPoints,
        totalPoints: Number(dbUser.totalPoints ?? 0),
        earnedPoints: dbUser.earnedPoints,
        invitePoints: dbUser.invitePoints,
        bonusPoints: dbUser.bonusPoints,
        referralCount: dbUser.referralCount,
        referralCode: dbUser.referralCode,
        hasFarcaster: dbUser.hasFarcaster,
        hasTwitter: dbUser.hasTwitter,
        farcasterUsername: dbUser.farcasterUsername,
        twitterUsername: dbUser.twitterUsername,
        usernameChangedAt: dbUser.usernameChangedAt?.toISOString() || null,
        createdAt: dbUser.createdAt.toISOString(),
        stats: stats || {
          positions: 0,
          comments: 0,
          reactions: 0,
          followers: 0,
          following: 0,
          posts: 0,
        },
      },
    });
    if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
    return res;
  }
);
