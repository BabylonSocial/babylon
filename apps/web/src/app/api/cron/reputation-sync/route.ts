/**
 * Reputation Sync Cron Job API
 *
 * @route POST /api/cron/reputation-sync - Sync reputation to ERC-8004
 * @access Cron (CRON_SECRET required)
 *
 * @description
 * Scheduled cron job that syncs reputation scores to ERC-8004 via Agent0 SDK.
 * Publishes reputation as feedback signals on-chain and updates local metrics.
 * Runs daily with more frequent updates for new accounts. Max execution time: 300s.
 *
 * @example
 * ```typescript
 * await fetch('/api/cron/reputation-sync', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
 * });
 * ```
 *
 * @see {@link /lib/reputation/erc8004-reputation-sync} ERC-8004 sync service
 */

import {
  batchSyncReputationsToERC8004,
  syncAllReputationsToERC8004,
} from '@babylon/agents';
import {
  relayCronToStaging,
  requireCronAuth,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Security: Verify cron authorization (fail-closed in production)
  requireCronAuth(request, { jobName: 'ReputationSyncCron' });

  const startTime = Date.now();
  logger.info(
    '🔄 Starting reputation sync cron job',
    undefined,
    'ReputationSyncCron'
  );

  await relayCronToStaging(request, 'reputation-sync');

  // Parse query parameters for batch processing
  const { searchParams } = new URL(request.url);
  const batchMode = searchParams.get('batch') === 'true';
  const limit = Number.parseInt(searchParams.get('limit') || '100', 10);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
  const forceRecalculate = searchParams.get('force') === 'true';

  let result;

  if (batchMode) {
    // Process a specific batch (useful for large syncs)
    logger.info(
      `Processing batch: limit=${limit}, offset=${offset}`,
      undefined,
      'ReputationSyncCron'
    );
    result = await batchSyncReputationsToERC8004({
      limit,
      offset,
      forceRecalculate,
      prioritizeNew: offset === 0,
    });
  } else {
    // Full sync (processes all users)
    logger.info(
      'Processing full reputation sync',
      undefined,
      'ReputationSyncCron'
    );
    result = await syncAllReputationsToERC8004();
  }

  const duration = Date.now() - startTime;

  logger.info(
    '✅ Reputation sync completed',
    {
      duration,
      total: result.total,
      synced: result.synced,
      failed: result.failed,
      skipped: result.skipped,
    },
    'ReputationSyncCron'
  );

  return successResponse({
    success: true,
    duration,
    result: {
      total: result.total,
      synced: result.synced,
      failed: result.failed,
      skipped: result.skipped,
    },
    batchMode,
    limit: batchMode ? limit : undefined,
    offset: batchMode ? offset : undefined,
  });
});
