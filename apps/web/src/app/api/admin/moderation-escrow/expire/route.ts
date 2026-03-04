/**
 * Admin Moderation Escrow Expire API
 *
 * @route POST /api/admin/moderation-escrow/expire - Expire old payments
 * @access Admin
 *
 * @description
 * Marks expired escrow payments as expired. Can be called by cron job or
 * manually by admin. Finds all pending payments past expiration time.
 *
 * @example
 * ```typescript
 * await fetch('/api/admin/moderation-escrow/expire', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * });
 * ```
 */

import { requireAdmin } from '@babylon/api';
import { db } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  await requireAdmin(req);

  const now = new Date();

  // Find all pending escrows that have expired
  const expiredEscrows = await db.moderationEscrow.updateMany({
    where: {
      status: 'pending',
      expiresAt: {
        lt: now,
      },
    },
    data: {
      status: 'expired',
    },
  });

  logger.info(
    `Expired ${expiredEscrows.count} escrow payments`,
    { count: expiredEscrows.count },
    'ModerationEscrow'
  );

  return NextResponse.json({
    success: true,
    expiredCount: expiredEscrows.count,
  });
}
