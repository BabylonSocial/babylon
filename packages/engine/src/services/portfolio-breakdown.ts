/**
 * Server-side portfolio breakdown (wallet + agents + positions) for consistent P/L.
 */

import { PredictionPricing } from '@babylon/core/markets/prediction';
import { db, markets, perpPositions, positions, users } from '@babylon/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { FEE_CONFIG } from '../config/fees';

export interface PortfolioBreakdownSnapshot {
  wallet: number;
  agents: number;
  positions: number;
  available: number;
  originalAmount: number;
  totalAssets: number;
  totalPnL: number;
  agentCount: number;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function clampFeeRate(rate: number): number {
  return rate > 0 && rate < 1 ? rate : 0;
}

function calculatePerpPositionValue(position: {
  size: unknown;
  leverage: unknown;
  unrealizedPnL: unknown;
}): number {
  const size = toNumber(position.size);
  const leverage = toNumber(position.leverage);
  const unrealizedPnL = toNumber(position.unrealizedPnL);

  const effectiveLeverage =
    Number.isFinite(leverage) && leverage > 0 ? leverage : 1;
  const margin = Math.abs(size / effectiveLeverage);
  return margin + unrealizedPnL;
}

function calculatePredictionPositionValue(position: {
  shares: unknown;
  avgPrice: unknown;
  side: boolean | null;
  marketYesShares: unknown;
  marketNoShares: unknown;
}): number {
  const shares = toNumber(position.shares);
  const avgPrice = toNumber(position.avgPrice);

  const yesShares = toNumber(position.marketYesShares);
  const noShares = toNumber(position.marketNoShares);

  const feeRate = clampFeeRate(FEE_CONFIG.TRADING_FEE_RATE);
  const costBasisNet = shares * avgPrice;
  const costBasis = feeRate > 0 ? costBasisNet / (1 - feeRate) : costBasisNet;

  if (shares <= 0 || yesShares <= 0 || noShares <= 0) {
    return costBasis;
  }

  const sideKey = position.side ? 'yes' : 'no';
  const sellPreview = PredictionPricing.calculateSellWithFees(
    yesShares,
    noShares,
    sideKey,
    shares,
    feeRate
  );

  return sellPreview.netProceeds ?? sellPreview.totalCost;
}

/**
 * Canonical portfolio breakdown used across Profile, Dashboard, OG, etc.
 *
 * Total P/L formula:
 *   totalPnL = (agents + positions + wallet) - originalAmount
 */
export async function calculatePortfolioBreakdown(
  userId: string
): Promise<PortfolioBreakdownSnapshot | null> {
  const userResult = await db
    .select({
      virtualBalance: users.virtualBalance,
      totalDeposited: users.totalDeposited,
      totalWithdrawn: users.totalWithdrawn,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];
  if (!user) return null;

  const agentRows = await db
    .select({
      id: users.id,
      virtualBalance: users.virtualBalance,
    })
    .from(users)
    .where(and(eq(users.managedBy, userId), eq(users.isAgent, true)));

  const agentIds = agentRows.map((a) => a.id);
  const agentCount = agentIds.length;

  const wallet = toNumber(user.virtualBalance);
  const agents = agentRows.reduce(
    (sum, agent) => sum + toNumber(agent.virtualBalance),
    0
  );

  const positionUserIds = [userId, ...agentIds];

  const [perpRows, predictionRows] = await Promise.all([
    db
      .select({
        size: perpPositions.size,
        leverage: perpPositions.leverage,
        unrealizedPnL: perpPositions.unrealizedPnL,
      })
      .from(perpPositions)
      .where(
        and(
          inArray(perpPositions.userId, positionUserIds),
          isNull(perpPositions.closedAt)
        )
      ),
    db
      .select({
        shares: positions.shares,
        avgPrice: positions.avgPrice,
        side: positions.side,
        marketYesShares: markets.yesShares,
        marketNoShares: markets.noShares,
      })
      .from(positions)
      .innerJoin(markets, eq(positions.marketId, markets.id))
      .where(
        and(
          inArray(positions.userId, positionUserIds),
          eq(markets.resolved, false)
        )
      ),
  ]);

  const perpsValue = perpRows.reduce(
    (sum, p) => sum + calculatePerpPositionValue(p),
    0
  );

  const predictionsValue = predictionRows.reduce(
    (sum, p) =>
      sum +
      calculatePredictionPositionValue({
        shares: p.shares,
        avgPrice: p.avgPrice,
        side: p.side,
        marketYesShares: p.marketYesShares,
        marketNoShares: p.marketNoShares,
      }),
    0
  );

  const positionsValue = perpsValue + predictionsValue;

  const totalDeposited = toNumber(user.totalDeposited);
  const totalWithdrawn = toNumber(user.totalWithdrawn);
  const originalAmount = totalDeposited - totalWithdrawn;

  const available = wallet + agents;
  const totalAssets = wallet + agents + positionsValue;
  const totalPnL = totalAssets - originalAmount;

  return {
    wallet,
    agents,
    positions: positionsValue,
    available,
    originalAmount,
    totalAssets,
    totalPnL,
    agentCount,
  };
}
