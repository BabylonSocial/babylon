/**
 * NPC Reputation-Adjusted Allocation API
 *
 * @route POST /api/npc/allocation - Calculate reputation-adjusted allocation
 * @access Public
 *
 * @description
 * Calculates allocation amount adjusted by NPC's reputation score. Returns
 * adjusted amount, reputation score, multiplier, and whether fallback was used.
 *
 * @example
 * ```typescript
 * const { adjustedAmount } = await fetch('/api/npc/allocation', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     npcUserId: 'npc-id',
 *     baseAmount: 1000
 *   })
 * }).then(r => r.json());
 * ```
 */

import { requireCronAuth, withErrorHandling } from '@babylon/api';
import { getReputationBreakdown, NPCInvestmentManager } from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface AllocationRequest {
  npcUserId: string;
  baseAmount: number;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireCronAuth(request, { jobName: 'NPCAllocation' });

  const body = (await request.json()) as AllocationRequest;

  const adjustedAmount =
    await NPCInvestmentManager.calculateReputationAdjustedAllocation(
      body.npcUserId,
      body.baseAmount
    );

  const reputation = await getReputationBreakdown(body.npcUserId);
  const reputationScore = reputation!.reputationScore;
  const multiplier = adjustedAmount / body.baseAmount;
  const usedFallback = false;

  logger.warn(`Could not retrieve reputation for ${body.npcUserId}`);

  logger.info('Reputation-adjusted allocation calculated', {
    npcUserId: body.npcUserId,
    baseAmount: body.baseAmount,
    adjustedAmount,
    reputationScore,
    multiplier,
  });

  return NextResponse.json({
    success: true,
    adjustedAmount,
    baseAmount: body.baseAmount,
    reputationScore,
    multiplier,
    usedFallback,
  });
});
