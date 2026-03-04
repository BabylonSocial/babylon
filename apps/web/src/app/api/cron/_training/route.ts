/**
 * Internal Training Cron API (Disabled)
 *
 * @route GET /api/cron/_training - Training cron (disabled)
 * @access Cron (CRON_SECRET)
 *
 * @description
 * Scheduled training cycle cron job. Currently disabled as training
 * functionality is handled by separate Eliza agent processes. Kept for
 * future integration.
 *
 * @example
 * ```typescript
 * // Called by Vercel Cron
 * await fetch('/api/cron/_training', {
 *   headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
 * });
 * ```
 */

import { verifyCronAuth } from '@babylon/api';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Security: Verify cron authorization even for disabled endpoints
  if (!verifyCronAuth(request, { jobName: 'TrainingCron' })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  logger.info('Training cron endpoint called (currently disabled)');

  return NextResponse.json({
    success: false,
    message: 'Training automation is currently disabled',
    hint: 'Training is handled by separate Eliza agent processes',
  });
}
