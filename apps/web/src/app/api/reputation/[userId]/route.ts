/**
 * User Reputation API
 *
 * @route GET /api/reputation/[userId] - Get user reputation
 * @access Public
 *
 * @description
 * Returns comprehensive reputation data for a user including overall reputation score,
 * trust level, feedback statistics, game performance metrics, and trading performance.
 * Includes ranking information and recent trends.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/reputation/user_123');
 * const { reputationPoints, rank, performance } = await response.json();
 * console.log(`Rank: #${rank} with ${reputationPoints} points`);
 * ```
 *
 * @see {@link /lib/reputation/reputation-service} Reputation service
 */

import {
  addPublicReadHeaders,
  publicRateLimit,
  requireUserByIdentifier,
} from '@babylon/api';
import { db } from '@babylon/db';
import { getReputationBreakdown } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error, rateLimitInfo } = await publicRateLimit(request);
  if (error) return error;

  const { userId } = await params;

  const user = await requireUserByIdentifier(userId);

  await getReputationBreakdown(user.id);

  const metrics = await db.agentPerformanceMetrics.findUnique({
    where: { userId: user.id },
    select: {
      gamesPlayed: true,
      gamesWon: true,
      averageGameScore: true,
      winRate: true,
      totalFeedbackCount: true,
      averageFeedbackScore: true,
      reputationScore: true,
      trustLevel: true,
      lastActivityAt: true,
    },
  });

  const rank = await db.agentPerformanceMetrics.count({
    where: {
      reputationScore: {
        gt: metrics!.reputationScore,
      },
    },
  });

  const totalUsers = await db.agentPerformanceMetrics.count();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentTrend = 0;

  const res = NextResponse.json({
    success: true,
    userId: user.id,
    reputationPoints: Math.round(metrics!.reputationScore),
    averageFeedbackScore: metrics!.averageFeedbackScore,
    totalFeedbackReceived: metrics!.totalFeedbackCount,
    performance: {
      gamesPlayed: metrics!.gamesPlayed,
      gamesWon: metrics!.gamesWon,
      averageGameScore: metrics!.averageGameScore,
      winRate: metrics!.winRate,
    },
    recentTrend,
    trustLevel: metrics!.trustLevel,
    rank: rank + 1,
    totalUsers,
  });
  if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
  return res;
}
