/**
 * Reputation Synchronization API
 *
 * @route POST /api/reputation/sync - Sync reputation with Agent0 network
 * @route GET /api/reputation/sync - Get sync status for a user
 * @access Public (admin recommended)
 *
 * @description
 * Manual reputation synchronization with Agent0 network. Supports syncing specific
 * users or bulk syncing all users. Automatic periodic sync runs every 3 hours
 * via cron job - this endpoint is for manual/on-demand syncs only.
 *
 * @example
 * ```typescript
 * // Sync specific user
 * await fetch('/api/reputation/sync', {
 *   method: 'POST',
 *   body: JSON.stringify({ userId: 'user_123' })
 * });
 *
 * // Get sync status
 * const status = await fetch('/api/reputation/sync?userId=user_123');
 * ```
 *
 * @see {@link /lib/reputation/agent0-reputation-sync} Agent0 sync service
 */

import { periodicReputationSync, syncUserReputationNow } from '@babylon/agents';
import {
  requireAdmin,
  requireUserByIdentifier,
  withErrorHandling,
} from '@babylon/api';
import { db } from '@babylon/db';
import { getReputationBreakdown } from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface SyncRequest {
  userId?: string;
  force?: boolean;
}

/**
 * POST /api/reputation/sync
 * Sync reputation data with Agent0 network
 * SECURITY: Requires admin - bulk sync can be resource-intensive and manipulate reputation
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // SECURITY: Only admins can trigger reputation syncs
  await requireAdmin(request);

  let body: SyncRequest = {};
  body = (await request.json()) as SyncRequest;

  if (body.userId) {
    const user = await requireUserByIdentifier(body.userId);

    const metrics = await syncUserReputationNow(user.id);

    logger.info('Manual reputation sync completed', {
      userId: user.id,
      force: body.force,
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      metrics,
      message: 'User reputation synced successfully',
    });
  }
  const results = await periodicReputationSync();

  logger.info('Bulk reputation sync completed', {
    total: results.total,
    successful: results.results.filter((r) => r.success).length,
    failed: results.results.filter((r) => !r.success).length,
  });

  return NextResponse.json({
    success: true,
    ...results,
    message: `Synced ${results.results.filter((r) => r.success).length} of ${results.total} agents`,
  });
});

/**
 * GET /api/reputation/sync/status
 * Get sync status and current reputation for a user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId')!;

  const user = await requireUserByIdentifier(userId);

  const reputation = await getReputationBreakdown(user.id);

  const metrics = await db.agentPerformanceMetrics.findUnique({
    where: { userId: user.id },
    select: {
      onChainReputationSync: true,
      lastSyncedAt: true,
      onChainTrustScore: true,
      onChainAccuracyScore: true,
    },
  });

  return NextResponse.json({
    userId: user.id,
    synced: metrics!.onChainReputationSync,
    lastSyncedAt: metrics!.lastSyncedAt,
    reputation: {
      score: reputation!.reputationScore,
      trustLevel: reputation!.trustLevel,
      confidence: reputation!.confidenceScore,
      onChainTrustScore: metrics!.onChainTrustScore,
      onChainAccuracyScore: metrics!.onChainAccuracyScore,
    },
    metrics: {
      gamesPlayed: reputation!.metrics.gamesPlayed,
      winRate: reputation!.metrics.winRate,
      normalizedPnL: reputation!.metrics.normalizedPnL,
      averageFeedbackScore: reputation!.metrics.averageFeedbackScore,
      totalFeedback: reputation!.metrics.totalFeedbackCount,
    },
  });
}
