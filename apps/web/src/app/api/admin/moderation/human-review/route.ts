/**
 * Admin Moderation Human Review API
 *
 * @route GET /api/admin/moderation/human-review - Get appeals for review
 * @access Admin
 *
 * @description
 * Returns list of user appeals that need human review. Shows banned users
 * with appeal status 'human_review' and their appeal details.
 *
 * @example
 * ```typescript
 * const { appeals } = await fetch('/api/admin/moderation/human-review', {
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * }).then(r => r.json());
 * ```
 */

import { requireAdmin, successResponse, withErrorHandling } from '@babylon/api';
import { db } from '@babylon/db';
import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const appeals = await db.user.findMany({
    where: {
      appealStatus: 'human_review',
      isBanned: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
      bannedAt: true,
      bannedReason: true,
      bannedBy: true,
      isScammer: true,
      isCSAM: true,
      appealCount: true,
      appealStaked: true,
      appealStakeAmount: true,
      appealStakeTxHash: true,
      appealSubmittedAt: true,
      falsePositiveHistory: true,
      earnedPoints: true,
      totalDeposited: true,
      totalWithdrawn: true,
      lifetimePnL: true,
    },
    orderBy: {
      appealSubmittedAt: 'asc', // Oldest first
    },
  });

  return successResponse({ appeals });
});
