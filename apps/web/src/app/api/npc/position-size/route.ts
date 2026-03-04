/**
 * NPC Position Size Recommendation API
 *
 * @route GET /api/npc/position-size - Get position size recommendation
 * @access Public
 *
 * @description
 * Calculates recommended position size based on portfolio metrics, strategy,
 * and reputation. Returns position size as decimal (0.10 = 10%).
 *
 * @example
 * ```typescript
 * const { positionSize } = await fetch('/api/npc/position-size?npcUserId=id&poolId=pool&strategy=balanced')
 *   .then(r => r.json());
 * ```
 */

import { verifyCronAuth, withErrorHandling } from '@babylon/api';
import { getReputationBreakdown, NPCInvestmentManager } from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!verifyCronAuth(request, { jobName: 'NPCPositionSize' })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const npcUserId = searchParams.get('npcUserId')!;
  const poolId = searchParams.get('poolId')!;
  const strategy = searchParams.get('strategy')! as
    | 'aggressive'
    | 'conservative'
    | 'balanced';

  const positionSize = await NPCInvestmentManager.getRecommendedPositionSize(
    poolId,
    npcUserId,
    strategy
  );

  const metrics = await NPCInvestmentManager.getPortfolioMetrics(poolId);

  const riskAdjusted = metrics.riskScore > 0.6 || metrics.utilization > 70;

  const reputation = await getReputationBreakdown(npcUserId);
  const reputationBoost = reputation!.reputationScore >= 70;

  logger.debug('Could not check reputation for position size');

  logger.info('Position size calculated', {
    npcUserId,
    poolId,
    strategy,
    positionSize,
    riskAdjusted,
    reputationBoost,
  });

  return NextResponse.json({
    success: true,
    positionSize,
    strategy,
    riskAdjusted,
    reputationBoost,
    portfolioMetrics: {
      utilization: metrics.utilization,
      riskScore: metrics.riskScore,
      positionCount: metrics.positionCount,
      unrealizedPnL: metrics.unrealizedPnL,
    },
  });
});
