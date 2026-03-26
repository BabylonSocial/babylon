/**
 * Server-side portfolio P&L calculation
 */

import {
  db,
  markets,
  perpPositions,
  positions,
  users,
} from '@babylon/db/runtime';

import { and, eq, isNull } from 'drizzle-orm';

export interface PortfolioPnLSnapshot {
  lifetimePnL: number;
  netContributions: number;
  totalDeposited: number;
  totalWithdrawn: number;
  availableBalance: number;
  unrealizedPerpPnL: number;
  unrealizedPredictionPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  accountEquity: number;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export async function calculatePortfolioPnL(
  userId: string
): Promise<PortfolioPnLSnapshot | null> {
  const userResult = await db
    .select({
      virtualBalance: users.virtualBalance,
      totalDeposited: users.totalDeposited,
      totalWithdrawn: users.totalWithdrawn,
      lifetimePnL: users.lifetimePnL,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];
  if (!user) return null;

  const perpPositionResults = await db
    .select({
      unrealizedPnL: perpPositions.unrealizedPnL,
    })
    .from(perpPositions)
    .where(
      and(eq(perpPositions.userId, userId), isNull(perpPositions.closedAt))
    );

  // For prediction positions, we need to join with markets
  const predictionPositionResults = await db
    .select({
      shares: positions.shares,
      avgPrice: positions.avgPrice,
      side: positions.side,
      marketYesShares: markets.yesShares,
      marketNoShares: markets.noShares,
    })
    .from(positions)
    .innerJoin(markets, eq(positions.marketId, markets.id))
    .where(and(eq(positions.userId, userId), eq(markets.resolved, false)));

  const totalDeposited = toNumber(user.totalDeposited);
  const totalWithdrawn = toNumber(user.totalWithdrawn);
  const lifetimePnL = toNumber(user.lifetimePnL);
  const availableBalance = toNumber(user.virtualBalance);

  const perpUnrealized = perpPositionResults.reduce(
    (sum, position) => sum + toNumber(position.unrealizedPnL),
    0
  );

  const predictionUnrealized = predictionPositionResults.reduce(
    (sum, position) => {
      const shares = toNumber(position.shares);
      const avgPrice = toNumber(position.avgPrice);

      // Calculate current price from shares (CPMM pricing)
      const yesShares = toNumber(position.marketYesShares);
      const noShares = toNumber(position.marketNoShares);
      const totalShares = yesShares + noShares;

      const currentPrice =
        totalShares > 0
          ? position.side === true
            ? noShares / totalShares // Yes price = noShares / total
            : yesShares / totalShares // No price = yesShares / total
          : avgPrice;

      return sum + shares * (currentPrice - avgPrice);
    },
    0
  );

  const totalUnrealizedPnL = perpUnrealized + predictionUnrealized;
  const totalPnL = lifetimePnL + totalUnrealizedPnL;
  const netContributions = totalDeposited - totalWithdrawn;
  const accountEquity = netContributions + totalPnL;

  return {
    lifetimePnL,
    netContributions,
    totalDeposited,
    totalWithdrawn,
    availableBalance,
    unrealizedPerpPnL: perpUnrealized,
    unrealizedPredictionPnL: predictionUnrealized,
    totalUnrealizedPnL,
    totalPnL,
    accountEquity,
  };
}
