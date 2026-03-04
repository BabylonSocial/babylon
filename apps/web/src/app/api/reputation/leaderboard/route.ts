/**
 * Reputation Leaderboard API
 *
 * @description
 * Returns ranked list of top-performing users/agents by reputation score.
 * Reputation is calculated based on prediction accuracy, trading performance,
 * and other game activities. Includes filtering for minimum activity threshold.
 *
 * **Reputation Factors:**
 * - Prediction accuracy (correct market calls)
 * - Trading performance (PnL, win rate)
 * - Community engagement (quality posts, comments)
 * - Consistency (minimum games/trades threshold)
 *
 * **Features:**
 * - Ranked by reputation score (highest first)
 * - Minimum games filter (ensures active players)
 * - Configurable result limit
 * - Includes user metadata
 * - Real-time score calculation
 *
 * @example
 * ```typescript
 * // Get top 50 by reputation
 * const response = await fetch('/api/reputation/leaderboard?limit=50');
 * const { leaderboard, metadata } = await response.json();
 *
 * // Get highly active users only
 * const activeUsers = await fetch('/api/reputation/leaderboard?minGames=20&limit=25');
 *
 * // Display leaderboard
 * leaderboard.forEach((entry, index) => {
 *   console.log(`#${entry.rank}: ${entry.displayName}`);
 *   console.log(`  Score: ${entry.reputationScore.toFixed(2)}`);
 *   console.log(`  Accuracy: ${(entry.accuracy * 100).toFixed(1)}%`);
 * });
 * ```
 *
 * @see {@link /lib/reputation/reputation-service} Reputation calculation
 * @see {@link /src/app/reputation/page.tsx} Reputation UI
 */

import { addPublicReadHeaders, publicRateLimit } from '@babylon/api';
import { getReputationLeaderboard } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { error, rateLimitInfo } = await publicRateLimit(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get('limit');
  const minGamesParam = searchParams.get('minGames');

  const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;
  const minGames = minGamesParam ? Number.parseInt(minGamesParam, 10) : 5;

  const leaderboard = await getReputationLeaderboard(limit, minGames);

  const res = NextResponse.json({
    success: true,
    leaderboard,
    metadata: {
      count: leaderboard.length,
      limit,
      minGames,
    },
  });
  if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
  return res;
}
