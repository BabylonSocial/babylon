/**
 * NPC Performance Leaderboard API
 *
 * @route GET /api/npc/performance/leaderboard - Get NPC leaderboard
 * @access Public
 *
 * @description
 * Returns ranked list of NPC actors by portfolio performance. Includes
 * filtering options for minimum portfolio value and result limit.
 *
 * @example
 * ```typescript
 * const { leaderboard } = await fetch('/api/npc/performance/leaderboard?limit=10')
 *   .then(r => r.json());
 * ```
 */

import { addPublicReadHeaders, publicRateLimit } from '@babylon/api';
import {
  and,
  db,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  poolPositions,
  pools,
} from '@babylon/db';
import { StaticDataRegistry } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { error, rateLimitInfo } = await publicRateLimit(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get('limit');
  const minValueParam = searchParams.get('minValue');

  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const minValue = minValueParam ? Number.parseFloat(minValueParam) : 0;

  // Fetch pools with filter
  const poolsList = await db
    .select()
    .from(pools)
    .where(
      and(eq(pools.isActive, true), gte(pools.totalValue, String(minValue)))
    )
    .orderBy(desc(pools.totalValue))
    .limit(limit);

  const actorIds = poolsList.map((p) => p.npcActorId);
  const actorsMap = new Map(
    actorIds
      .map((id) => StaticDataRegistry.getActor(id))
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map((a) => [
        a.id,
        {
          id: a.id,
          name: a.name,
          profileImageUrl: a.profileImageUrl,
          personality: a.personality,
        },
      ])
  );

  // Fetch open positions for all pools
  const poolIds = poolsList.map((p) => p.id);
  const positionsList =
    poolIds.length > 0
      ? await db
          .select({
            poolId: poolPositions.poolId,
            unrealizedPnL: poolPositions.unrealizedPnL,
          })
          .from(poolPositions)
          .where(
            and(
              inArray(poolPositions.poolId, poolIds),
              isNull(poolPositions.closedAt)
            )
          )
      : [];
  const positionsByPool = new Map<string, typeof positionsList>();
  for (const pos of positionsList) {
    const existing = positionsByPool.get(pos.poolId) || [];
    existing.push(pos);
    positionsByPool.set(pos.poolId, existing);
  }

  const leaderboard = poolsList.map((pool, index) => {
    const totalValue = Number.parseFloat(pool.totalValue?.toString() || '0');
    const availableBalance = Number.parseFloat(
      pool.availableBalance?.toString() || '0'
    );
    const initialValue = Number.parseFloat(
      pool.totalDeposits?.toString() || '0'
    );

    const poolPositionsList = positionsByPool.get(pool.id) || [];
    const unrealizedPnL = poolPositionsList.reduce((sum: number, pos) => {
      return sum + Number.parseFloat(pos.unrealizedPnL?.toString() || '0');
    }, 0);

    const roi =
      initialValue > 0 ? ((totalValue - initialValue) / initialValue) * 100 : 0;

    const invested = totalValue - availableBalance;
    const utilization = totalValue > 0 ? (invested / totalValue) * 100 : 0;

    const actor = actorsMap.get(pool.npcActorId);

    return {
      rank: index + 1,
      actorId: actor?.id || pool.npcActorId,
      actorName: actor?.name || 'Unknown',
      personality: actor?.personality || null,
      profileImageUrl: actor?.profileImageUrl || null,
      poolId: pool.id,
      performance: {
        totalValue: Math.round(totalValue),
        roi: Number.parseFloat(roi.toFixed(2)),
        unrealizedPnL: Math.round(unrealizedPnL),
        positionCount: poolPositionsList.length,
        utilization: Number.parseFloat(utilization.toFixed(1)),
      },
    };
  });

  const res = NextResponse.json({
    success: true,
    leaderboard,
    metadata: {
      count: leaderboard.length,
      limit,
      minValue,
    },
  });
  if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
  return res;
}
