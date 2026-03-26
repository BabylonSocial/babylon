/**
 * Agent0 Reputation Cache Service
 *
 * Caches ERC-8004/Agent0 reputation scores with 24-hour staleness check.
 * Recalculates reputation when cache is stale.
 */

import { and, eq } from '@babylon/db';
import {
  agentPerformanceMetrics,
  db,
  pointsTransactions,
  users,
} from '@babylon/db/runtime';

import { recalculateReputation } from '@babylon/engine';
import { logger } from '@babylon/shared';

const CACHE_STALE_HOURS = 24;
const CACHE_STALE_MS = CACHE_STALE_HOURS * 60 * 60 * 1000;

/**
 * Get cached reputation score for a user/agent
 * Returns cached value if fresh, otherwise recalculates
 */
export async function getCachedAgent0ReputationScore(
  userId: string
): Promise<number> {
  const userResult = await db
    .select({
      id: users.id,
      agent0TokenId: users.agent0TokenId,
      isBanned: users.isBanned,
      isScammer: users.isScammer,
      isCSAM: users.isCSAM,
      earnedPoints: users.earnedPoints,
      reputationPoints: users.reputationPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    logger.warn(
      'User not found for reputation cache',
      { userId },
      'Agent0ReputationCache'
    );
    return 50; // Neutral default
  }

  // If banned, return 0
  if (user.isBanned) {
    return 0;
  }

  // If scammer or CSAM, return very low score (but not 0, to distinguish from banned)
  if (user.isScammer || user.isCSAM) {
    return 5; // Very low but not zero
  }

  // Get performance metrics separately
  const metricsResult = await db
    .select({
      reputationScore: agentPerformanceMetrics.reputationScore,
      lastActivityAt: agentPerformanceMetrics.lastActivityAt,
      updatedAt: agentPerformanceMetrics.updatedAt,
    })
    .from(agentPerformanceMetrics)
    .where(eq(agentPerformanceMetrics.userId, userId))
    .limit(1);

  const metrics = metricsResult[0];

  // Check if we have cached data
  if (metrics) {
    const cacheAge = Date.now() - metrics.updatedAt.getTime();

    // If cache is fresh (< 24 hours), return cached score
    if (cacheAge < CACHE_STALE_MS) {
      logger.debug(
        'Using cached reputation score',
        {
          userId,
          score: metrics.reputationScore,
          cacheAgeHours: cacheAge / (60 * 60 * 1000),
        },
        'Agent0ReputationCache'
      );
      return metrics.reputationScore;
    }
  }

  // Cache is stale or missing, recalculate
  logger.info(
    'Recalculating stale reputation score',
    {
      userId,
      agent0TokenId: user.agent0TokenId,
      hasMetrics: !!metrics,
    },
    'Agent0ReputationCache'
  );

  await recalculateReputation(userId);
  if (user.agent0TokenId) {
    logger.debug(
      'Agent0 token ID found, using local reputation calculation',
      {
        userId,
        agent0TokenId: user.agent0TokenId,
      },
      'Agent0ReputationCache'
    );
    // To fetch on-chain Agent0 reputation, use ReputationBridge or Agent0FeedbackService
  }

  // Return local reputation if Agent0 fetch failed or no token ID
  const updatedMetricsResult = await db
    .select({ reputationScore: agentPerformanceMetrics.reputationScore })
    .from(agentPerformanceMetrics)
    .where(eq(agentPerformanceMetrics.userId, userId))
    .limit(1);

  return updatedMetricsResult[0]?.reputationScore ?? 50; // Neutral default
}

/**
 * Invalidate reputation cache for a user
 * Forces recalculation on next access
 */
export async function invalidateReputationCache(userId: string): Promise<void> {
  await db
    .update(agentPerformanceMetrics)
    .set({
      updatedAt: new Date(Date.now() - CACHE_STALE_MS - 1), // Make it stale
    })
    .where(eq(agentPerformanceMetrics.userId, userId));

  logger.info(
    'Invalidated reputation cache',
    { userId },
    'Agent0ReputationCache'
  );
}

/**
 * Check if user has sent more points than earned (reputation loss condition)
 */
export async function checkOverspending(userId: string): Promise<boolean> {
  const userResult = await db
    .select({
      earnedPoints: users.earnedPoints,
      reputationPoints: users.reputationPoints,
      invitePoints: users.invitePoints,
      bonusPoints: users.bonusPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    return false;
  }

  // Get points transactions for transfer_sent
  const transactionsResult = await db
    .select({ amount: pointsTransactions.amount })
    .from(pointsTransactions)
    .where(
      and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.reason, 'transfer_sent')
      )
    );

  // Calculate total points sent (negative amounts)
  const totalSent = Math.abs(
    transactionsResult.reduce((sum, tx) => sum + Math.min(0, tx.amount), 0)
  );

  // Total earned = earnedPoints + invitePoints + bonusPoints
  const totalEarned = user.earnedPoints + user.invitePoints + user.bonusPoints;

  // If sent more than earned, they're overspending
  return totalSent > totalEarned;
}

/**
 * Calculate reputation score based on activity and behavior
 *
 * Rules:
 * - Neutral (50) for inactivity
 * - Loss for overspending (sending more than earned)
 * - 0 for bans
 * - Very low (5) for scammers/CSAM
 */
export async function calculateAgent0ReputationScore(
  userId: string
): Promise<number> {
  const userResult = await db
    .select({
      id: users.id,
      isBanned: users.isBanned,
      isScammer: users.isScammer,
      isCSAM: users.isCSAM,
      earnedPoints: users.earnedPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    return 50; // Neutral default
  }

  // Banned users get 0
  if (user.isBanned) {
    return 0;
  }

  // Scammers/CSAM get very low score (but not 0)
  if (user.isScammer || user.isCSAM) {
    return 5;
  }

  // Get performance metrics
  const metricsResult = await db
    .select({
      gamesPlayed: agentPerformanceMetrics.gamesPlayed,
      totalFeedbackCount: agentPerformanceMetrics.totalFeedbackCount,
      averageFeedbackScore: agentPerformanceMetrics.averageFeedbackScore,
      normalizedPnL: agentPerformanceMetrics.normalizedPnL,
      lastActivityAt: agentPerformanceMetrics.lastActivityAt,
    })
    .from(agentPerformanceMetrics)
    .where(eq(agentPerformanceMetrics.userId, userId))
    .limit(1);

  const metrics = metricsResult[0];
  const hasActivity =
    metrics &&
    (metrics.gamesPlayed > 0 ||
      metrics.totalFeedbackCount > 0 ||
      metrics.lastActivityAt !== null);

  // No activity = neutral score (50)
  if (!hasActivity) {
    return 50;
  }

  // Check for overspending
  const isOverspending = await checkOverspending(userId);
  if (isOverspending) {
    // Reduce reputation based on overspending ratio
    const overspendingRatio = await calculateOverspendingRatio(userId);
    // Penalty: reduce score by up to 30 points based on overspending
    const penalty = Math.min(30, overspendingRatio * 30);
    const baseScore = metrics?.averageFeedbackScore ?? 50;
    return Math.max(0, baseScore - penalty);
  }

  // Use standard reputation calculation
  const updatedMetrics = await recalculateReputation(userId);
  return updatedMetrics?.reputationScore ?? 50;
}

/**
 * Calculate overspending ratio (0-1)
 */
async function calculateOverspendingRatio(userId: string): Promise<number> {
  const userResult = await db
    .select({
      earnedPoints: users.earnedPoints,
      invitePoints: users.invitePoints,
      bonusPoints: users.bonusPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    return 0;
  }

  // Get points transactions for transfer_sent
  const transactionsResult = await db
    .select({ amount: pointsTransactions.amount })
    .from(pointsTransactions)
    .where(
      and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.reason, 'transfer_sent')
      )
    );

  const totalSent = Math.abs(
    transactionsResult.reduce((sum, tx) => sum + Math.min(0, tx.amount), 0)
  );
  const totalEarned = user.earnedPoints + user.invitePoints + user.bonusPoints;

  if (totalEarned === 0) {
    return totalSent > 0 ? 1 : 0; // If they sent anything without earning, ratio is 1
  }

  return Math.min(1, totalSent / totalEarned);
}
