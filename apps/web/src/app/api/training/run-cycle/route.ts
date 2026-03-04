/**
 * Training Cycle API
 *
 * @route GET /api/training/run-cycle - Get training cycle status
 * @route POST /api/training/run-cycle - Run training cycle (disabled)
 * @access Public
 *
 * @description
 * Training functionality is handled by separate Eliza agent processes.
 * This endpoint is kept for future integration but currently returns disabled status.
 *
 * @example
 * ```typescript
 * const status = await fetch('/api/training/run-cycle')
 *   .then(r => r.json());
 * ```
 */

import { logger } from '@babylon/shared';
import { NextResponse } from 'next/server';

export async function POST() {
  logger.info('Training cycle endpoint called (currently disabled)');

  return NextResponse.json({
    success: false,
    message: 'Manual training cycles are currently disabled',
    hint: 'Training is handled by separate Eliza agent processes',
  });
}

export async function GET() {
  return NextResponse.json({
    enabled: false,
    message: 'Training automation is currently disabled',
    hint: 'Training is handled by separate Eliza agent processes',
  });
}
