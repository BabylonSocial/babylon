/**
 * Stats Widget API
 *
 * @route GET /api/feed/widgets/stats - Get platform statistics
 * @access Public
 *
 * @description
 * Returns platform-wide statistics including active players, AI agents, total posts,
 * and points in circulation. Aggregates data from users and actors with RLS support.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/feed/widgets/stats');
 * const { stats } = await response.json();
 * ```
 *
 * @see {@link /lib/db/context} RLS context
 */

import { optionalAuth, successResponse, withErrorHandling } from '@babylon/api';
import {
  actorState,
  asPublic,
  asUser,
  count,
  eq,
  posts,
  sum,
  users,
} from '@babylon/db';
import { StaticDataRegistry } from '@babylon/engine';
import { logger, StatsQuerySchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';

interface BabylonStats {
  activePlayers: number;
  aiAgents: number;
  totalHoots: number;
  pointsInCirculation: string;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    includeMarkets: searchParams.get('includeMarkets') || 'true',
    includeUsers: searchParams.get('includeUsers') || 'true',
    includePools: searchParams.get('includePools') || 'true',
    includeVolume: searchParams.get('includeVolume') || 'true',
  };
  StatsQuerySchema.parse(queryParams);

  const authUser = await optionalAuth(request).catch(() => null);

  const queryStats = async (
    db: Parameters<Parameters<typeof asUser>[1]>[0]
  ) => {
    const [
      activePlayersResult,
      totalHootsResult,
      userPointsResult,
      actorPointsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users).where(eq(users.isActor, false)),
      db.select({ count: count() }).from(posts),
      db
        .select({ total: sum(users.virtualBalance) })
        .from(users)
        .where(eq(users.isActor, false)),
      db.select({ total: sum(actorState.tradingBalance) }).from(actorState),
    ]);

    return {
      activePlayers: Number(activePlayersResult[0]?.count ?? 0),
      aiAgents: StaticDataRegistry.getAllActors().length,
      totalHoots: Number(totalHootsResult[0]?.count ?? 0),
      userPoints: userPointsResult[0]?.total ?? '0',
      actorPoints: actorPointsResult[0]?.total ?? '0',
    };
  };

  const statsResult = authUser?.userId
    ? await asUser(authUser, queryStats)
    : await asPublic(queryStats);

  const totalPoints =
    Number(statsResult.userPoints) + Number(statsResult.actorPoints);
  const pointsInCirculation = formatPoints(BigInt(totalPoints));

  const finalStats: BabylonStats = {
    activePlayers: statsResult.activePlayers,
    aiAgents: statsResult.aiAgents,
    totalHoots: statsResult.totalHoots,
    pointsInCirculation,
  };

  logger.info(
    'Babylon stats fetched successfully',
    finalStats,
    'GET /api/feed/widgets/stats'
  );

  return successResponse({
    success: true,
    stats: finalStats,
  });
});

function formatPoints(points: bigint): string {
  const num = Number(points);

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M pts`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K pts`;
  }

  return `${num.toLocaleString()} pts`;
}
