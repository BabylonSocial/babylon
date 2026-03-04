/**
 * Training Status Cron Job API
 *
 * @route GET /api/cron/training - Check training readiness
 * @access Cron (CRON_SECRET required)
 *
 * @description
 * Daily cron job that checks training system readiness, reports status, and logs
 * metrics. Training is triggered by GitHub Actions; this endpoint monitors readiness.
 * Max execution time: 60s.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/cron/training', {
 *   headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
 * });
 * const { ready, stats } = await response.json();
 * ```
 *
 * @see {@link /lib/training/AutomationPipeline} Automation pipeline
 */

import { verifyCronAuth } from '@babylon/api';
import { logger } from '@babylon/shared';
import { automationPipeline } from '@babylon/training';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute

/**
 * Daily training status check and reporting
 */
export async function GET(request: NextRequest) {
  // Security: Verify cron authorization
  if (!verifyCronAuth(request, { jobName: 'TrainingStatusCron' })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  logger.info(
    'Checking training system status',
    undefined,
    'TrainingStatusCron'
  );

  // 1. Check if ready to train
  const readiness = await automationPipeline.checkTrainingReadiness();

  // 2. Get overall system status
  const status = await automationPipeline.getStatus();

  // 3. Log readiness status
  if (readiness.ready) {
    logger.info(
      '✅ System ready for training',
      {
        trajectories: readiness.stats.totalTrajectories,
        scenarioGroups: readiness.stats.scenarioGroups,
        dataQuality: readiness.stats.dataQuality,
      },
      'TrainingStatusCron'
    );
  } else {
    logger.info(
      '⏳ System not ready for training',
      {
        reason: readiness.reason,
        stats: readiness.stats,
      },
      'TrainingStatusCron'
    );
  }

  // 4. Log recent activity
  logger.info(
    'Training system metrics',
    {
      dataCollection: status.dataCollection,
      latestModel: status.models.latest,
      deployedModels: status.models.deployed,
      lastTraining: status.training.lastCompleted,
    },
    'TrainingStatusCron'
  );

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    readiness,
    status,
    message: readiness.ready
      ? '✅ Ready for training - will run via GitHub Actions at 2 AM UTC'
      : `⏳ Not ready: ${readiness.reason}`,
  });
}
