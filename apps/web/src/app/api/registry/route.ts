/**
 * User Registry API
 *
 * @description
 * Public registry of all registered users and agents on the Babylon platform.
 * Provides comprehensive user listings with filtering, sorting, pagination,
 * and optional on-chain verification filtering. Includes reputation scores
 * and activity statistics.
 *
 * **Features:**
 * - Public user directory
 * - On-chain verification filtering
 * - Flexible sorting (by reputation, PnL, creation date)
 * - Pagination support
 * - Activity statistics (positions, comments, reactions)
 * - On-chain reputation scores (when applicable)
 * - RLS-compatible (respects user visibility settings)
 *
 * **Use Cases:**
 * - User discovery and networking
 * - Reputation leaderboards
 * - On-chain verification lookup
 * - Community member browsing
 * - Agent/user directory
 *
 * @example
 * ```typescript
 * // Get all users
 * const response = await fetch('/api/registry?limit=50&sortBy=reputationPoints');
 * const { users, pagination } = await response.json();
 *
 * // Get only on-chain users
 * const onChainUsers = await fetch('/api/registry?onChainOnly=true&sortBy=lifetimePnL');
 *
 * // Display top traders
 * users.forEach(user => {
 *   console.log(`${user.displayName}: ${user.lifetimePnL} PnL, Rep: ${user.reputation}`);
 * });
 * ```
 *
 * @see {@link /lib/services/reputation-service} Reputation service
 * @see {@link /lib/db/context} RLS context
 */

import {
  addPublicReadHeaders,
  publicRateLimit,
  ReputationService,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import type { DrizzleClient } from '@babylon/db';
import { asPublic, asUser } from '@babylon/db';
import { logger, RegistryQuerySchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';
/**
 * GET /api/registry
 * Fetch all registered users with optional filtering
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const queryParams = {
    onChainOnly: searchParams.get('onChainOnly'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  };
  const filters = RegistryQuerySchema.parse(queryParams);

  const {
    error,
    user: authUser,
    rateLimitInfo,
  } = await publicRateLimit(request);
  if (error) return error;

  // Build where clause
  const where = filters.onChainOnly ? { onChainRegistered: true } : {};

  // Build order by clause
  const orderBy = filters.sortBy
    ? {
        [filters.sortBy]: filters.sortOrder,
      }
    : { createdAt: 'desc' as const };

  // Fetch users from database with RLS (public registry, no auth required)
  const dbOperation = async (db: DrizzleClient) => {
    const usersList = await db.user.findMany({
      where,
      orderBy,
      take: filters.limit,
      skip: filters.offset,
    });

    // Get total count for pagination
    const count = await db.user.count({ where });

    // Get counts for each user
    const userIds = usersList.map((u) => u.id);
    const [positionCounts, commentCounts, reactionCounts] = await Promise.all([
      Promise.all(
        userIds.map((id) => db.position.count({ where: { userId: id } }))
      ),
      Promise.all(
        userIds.map((id) => db.comment.count({ where: { authorId: id } }))
      ),
      Promise.all(
        userIds.map((id) => db.reaction.count({ where: { userId: id } }))
      ),
    ]);

    const usersWithCounts = usersList.map((user, index) => ({
      ...user,
      _counts: {
        positions: positionCounts[index] ?? 0,
        comments: commentCounts[index] ?? 0,
        reactions: reactionCounts[index] ?? 0,
      },
    }));

    return { users: usersWithCounts, totalCount: count };
  };

  const { users, totalCount } =
    authUser && authUser.userId
      ? await asUser(authUser, dbOperation)
      : await asPublic(dbOperation);

  const usersWithReputation = await Promise.all(
    users.map(async (user) => {
      let reputation: number | null = null;
      if (user.onChainRegistered && user.nftTokenId) {
        reputation = await ReputationService.getOnChainReputation(user.id);
      }

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        walletAddress: user.walletAddress,
        isActor: user.isActor,
        onChainRegistered: user.onChainRegistered,
        nftTokenId: user.nftTokenId,
        registrationTxHash: user.registrationTxHash,
        createdAt: user.createdAt,
        virtualBalance: user.virtualBalance.toString(),
        lifetimePnL: user.lifetimePnL.toString(),
        reputation,
        stats: {
          positions: user._counts.positions,
          comments: user._counts.comments,
          reactions: user._counts.reactions,
        },
      };
    })
  );

  logger.info(
    'Registry fetched successfully',
    {
      total: totalCount,
      returned: usersWithReputation.length,
      onChainOnly: filters.onChainOnly,
    },
    'GET /api/registry'
  );

  const res = successResponse({
    users: usersWithReputation,
    pagination: {
      total: totalCount,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
      hasMore: (filters.offset || 0) + usersWithReputation.length < totalCount,
    },
  });
  if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
  return res;
});
