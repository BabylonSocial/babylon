/**
 * Points Leaderboard API
 *
 * @description
 * Returns platform-wide leaderboard ranking users by total points,
 * reputation, earned points, or referral points. Provides paginated results
 * with comprehensive user statistics and rankings.
 *
 * **Leaderboard Types:**
 * - **total:** Portfolio value: wallet + positions (default)
 * - **all:** Total reputation points
 * - **earned:** Points earned through activity
 * - **referral:** Points earned from referrals
 *
 * **Features:**
 * - Configurable minimum points threshold
 * - Pagination support
 * - Multiple sorting categories
 * - User statistics and metadata
 * - Real-time rankings
 *
 * **User Stats Include:**
 * - Total points and breakdown
 * - Profile information
 * - Activity metrics
 * - Rank position
 *
 * @example
 * ```typescript
 * // Get top 50 users by reputation
 * const response = await fetch('/api/leaderboard?page=1&pageSize=50');
 * const { leaderboard, pagination } = await response.json();
 *
 * // Get referral leaders
 * const referralLeaders = await fetch('/api/leaderboard?pointsType=referral&minPoints=1000');
 *
 * // Display leaderboard
 * leaderboard.forEach(user => {
 *   console.log(`#${user.rank}: ${user.displayName} - ${user.points} points`);
 * });
 * ```
 *
 * @see {@link /lib/services/points-service} Points calculation
 * @see {@link /src/app/leaderboard/page.tsx} Leaderboard UI
 */

import {
  getCache,
  PointsService,
  setCache,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { LeaderboardQuerySchema, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

const CACHE_KEY_NAMESPACE = 'leaderboard';
// Cache for 2 minutes - balances freshness with performance
const CACHE_TTL_MS = Number(process.env.LEADERBOARD_CACHE_MS) || 120_000;
const CACHE_TTL_SECONDS = Math.floor(CACHE_TTL_MS / 1000);
const STALE_SECONDS = CACHE_TTL_SECONDS * 3;

interface LeaderboardResponse {
  leaderboard: Awaited<
    ReturnType<typeof PointsService.getLeaderboard>
  >['users'];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  minPoints: number;
  pointsCategory: string;
}

/**
 * GET /api/leaderboard
 * Get leaderboard with pagination and filtering
 * Query params:
 *  - page: number (default 1)
 *  - pageSize: number (default 100, max 100)
 *  - minPoints: number (default 500)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const queryParams = Object.fromEntries(searchParams.entries());
  const validationResult = LeaderboardQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    // Throw ZodError so error handler can catch it and return 400
    throw validationResult.error;
  }

  const { page, pageSize, minPoints, pointsType } = validationResult.data;

  const pointsCategory = (pointsType ?? 'total') as
    | 'all'
    | 'earned'
    | 'referral'
    | 'total';

  // Cache key includes all query parameters
  const cacheKey = `${pointsCategory}-${page}-${pageSize}-${minPoints}`;

  // Check cache first
  if (CACHE_TTL_MS > 0) {
    const cached = await getCache<LeaderboardResponse>(cacheKey, {
      namespace: CACHE_KEY_NAMESPACE,
    });
    if (cached) {
      return successResponse(cached, 200, {
        'x-cache': 'leaderboard-hit',
        'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        Vary: 'Accept-Encoding',
      });
    }
  }

  const leaderboard = await PointsService.getLeaderboard(
    page,
    pageSize,
    minPoints,
    pointsCategory
  );

  logger.info(
    'Leaderboard fetched successfully',
    {
      page,
      pageSize,
      minPoints,
      pointsCategory,
      totalCount: leaderboard.totalCount,
    },
    'GET /api/leaderboard'
  );

  const responseBody: LeaderboardResponse = {
    leaderboard: leaderboard.users,
    pagination: {
      page: leaderboard.page,
      pageSize: leaderboard.pageSize,
      totalCount: leaderboard.totalCount,
      totalPages: leaderboard.totalPages,
    },
    minPoints: pointsCategory === 'all' ? minPoints : 0,
    pointsCategory: leaderboard.pointsCategory,
  };

  // Store in cache
  if (CACHE_TTL_MS > 0) {
    await setCache(cacheKey, responseBody, {
      namespace: CACHE_KEY_NAMESPACE,
      ttl: CACHE_TTL_SECONDS,
    });
  }

  return successResponse(responseBody, 200, {
    'x-cache': 'leaderboard-miss',
    'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
    Vary: 'Accept-Encoding',
  });
});
