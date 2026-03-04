/**
 * Training Check Cron API
 *
 * @route GET /api/cron/training-check - Training check cron
 * @access Cron (CRON_SECRET)
 *
 * @description
 * Runs hourly to score new trajectories with RULER, check training readiness,
 * and monitor system health. Triggered by Vercel Cron (hourly).
 *
 * @example
 * ```typescript
 * // Called by Vercel Cron (hourly)
 * await fetch('/api/cron/training-check', {
 *   headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
 * });
 * ```
 */

import { verifyCronAuth } from '@babylon/api';
import { logger } from '@babylon/shared';
import { automationPipeline, rulerScoringService } from '@babylon/training';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Hourly training check and RULER scoring
 */
export async function GET(request: NextRequest) {
  // Security: Verify cron authorization
  if (!verifyCronAuth(request, { jobName: 'TrainingCheckCron' })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startTime = Date.now();
  logger.info('Starting training check cycle', undefined, 'TrainingCheckCron');

  const results = {
    timestamp: new Date().toISOString(),
    scoring: {
      windowsScored: 0,
      trajectoriesScored: 0,
    },
    readiness: null as Awaited<
      ReturnType<typeof automationPipeline.checkTrainingReadiness>
    > | null,
    status: null as Awaited<
      ReturnType<typeof automationPipeline.getStatus>
    > | null,
  };

  // 1. Score trajectories with RULER (last 6 hours of windows)
  logger.info(
    'Scoring trajectories with RULER...',
    undefined,
    'TrainingCheckCron'
  );

  const now = new Date();
  for (let hoursAgo = 0; hoursAgo < 6; hoursAgo++) {
    const windowDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    const windowId = windowDate.toISOString().slice(0, 13) + ':00';

    const scored = await rulerScoringService.scoreWindow(windowId);
    if (scored > 0) {
      results.scoring.windowsScored++;
      results.scoring.trajectoriesScored += scored;
      logger.info(
        'Scored window with RULER',
        {
          windowId,
          trajectoriesScored: scored,
        },
        'TrainingCheckCron'
      );
    }
  }

  // 2. Check training readiness
  logger.info('Checking training readiness...', undefined, 'TrainingCheckCron');
  results.readiness = await automationPipeline.checkTrainingReadiness();

  if (results.readiness.ready) {
    logger.info(
      'System is ready for training!',
      results.readiness.stats,
      'TrainingCheckCron'
    );
  } else {
    logger.info(
      'System not ready for training',
      {
        reason: results.readiness.reason,
      },
      'TrainingCheckCron'
    );
  }

  // 3. Get system status
  results.status = await automationPipeline.getStatus();

  const duration = Date.now() - startTime;
  logger.info(
    'Training check cycle complete',
    {
      durationMs: duration,
      trajectoriesScored: results.scoring.trajectoriesScored,
      ready: results.readiness.ready,
    },
    'TrainingCheckCron'
  );

  return NextResponse.json({
    success: true,
    duration: `${duration}ms`,
    ...results,
  });
}
