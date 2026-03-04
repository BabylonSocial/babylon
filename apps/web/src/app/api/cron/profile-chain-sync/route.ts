/**
 * Profile Chain Sync Status Cron Job
 *
 * @route POST /api/cron/profile-chain-sync - Monitor profiles needing chain sync
 * @access Cron (CRON_SECRET required)
 *
 * @description
 * Scheduled cron job that monitors profiles with pending on-chain sync.
 * Reports metrics on profiles that have database changes not yet synced to chain.
 * Actual sync is user-initiated via wallet signature (not backend-signed).
 *
 * Architecture Decision:
 * - Profile updates are database-first for instant UX
 * - On-chain sync is optional and user-initiated (requires wallet signature)
 * - This job provides visibility into sync status for monitoring
 */

import {
  relayCronToStaging,
  requireCronAuth,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { and, count, db, eq, isNotNull, users } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

// Vercel function configuration
export const maxDuration = 60; // 1 minute max (monitoring only)

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Security: Verify cron authorization (fail-closed in production)
  requireCronAuth(request, { jobName: 'ProfileChainSyncCron' });

  const startTime = Date.now();
  logger.info(
    '📊 Starting profile chain sync status check',
    undefined,
    'ProfileChainSyncCron'
  );

  await relayCronToStaging(request, 'profile-chain-sync');

  // Get counts for monitoring
  const [totalOnChainResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.onChainRegistered, true));

  const [pendingSyncResult] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.onChainRegistered, true),
        eq(users.profileChainSyncNeeded, true)
      )
    );

  const [syncErrorResult] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.onChainRegistered, true),
        eq(users.profileChainSyncNeeded, true),
        isNotNull(users.profileChainSyncError)
      )
    );

  const totalOnChainUsers = totalOnChainResult?.count ?? 0;
  const pendingSyncCount = pendingSyncResult?.count ?? 0;
  const syncErrorCount = syncErrorResult?.count ?? 0;
  const syncedCount = totalOnChainUsers - pendingSyncCount;

  const duration = Date.now() - startTime;

  const metrics = {
    totalOnChainUsers,
    pendingSyncCount,
    syncedCount,
    syncErrorCount,
    syncRate:
      totalOnChainUsers > 0
        ? ((syncedCount / totalOnChainUsers) * 100).toFixed(1)
        : '100.0',
  };

  logger.info(
    '✅ Profile chain sync status check completed',
    {
      duration,
      ...metrics,
    },
    'ProfileChainSyncCron'
  );

  // Log warning if many profiles need sync
  if (pendingSyncCount > 100) {
    logger.warn(
      `⚠️ High number of profiles pending chain sync: ${pendingSyncCount}`,
      { pendingSyncCount, totalOnChainUsers },
      'ProfileChainSyncCron'
    );
  }

  return successResponse({
    success: true,
    duration,
    metrics,
  });
});
