/**
 * Server-side portfolio breakdown (wallet + agents + positions) for consistent P/L.
 */

import { isOpenPerpPositionStateValid } from '@babylon/core/markets/perps';
import { PredictionPricing } from '@babylon/core/markets/prediction';
import {
  db,
  markets,
  perpPositions,
  pointsTransactions,
  positions,
  users,
} from '@babylon/db/runtime';

import { logger, resolveUserIdentifierKind } from '@babylon/shared';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { FEE_CONFIG } from '../config/fees';
import {
  calculatePerpPositionMarketValue,
  toNumber,
} from '../portfolio-valuation';

export interface PortfolioBreakdownSnapshot {
  wallet: number;
  agents: number;
  positions: number;
  available: number;
  originalAmount: number;
  totalAssets: number;
  totalPnL: number;
  agentCount: number;
  totalPoints: number;
  members: PortfolioBreakdownMember[];
}

export interface PortfolioBreakdownMember {
  id: string;
  name: string;
  wallet: number;
  isAgent: boolean;
}

function clampFeeRate(rate: number): number {
  return rate > 0 && rate < 1 ? rate : 0;
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
 * where originalAmount includes net peer transfers.
 *
 * **WHY classification-based routing on the initial user row?**
 * - Previously: `or(eq(users.id, userId), eq(users.privyId, userId))` forced the planner to merge predicates and often blocked a clean single-index plan.
 * - Now: `resolveUserIdentifierKind` from `@babylon/shared` picks one branch (PK, unique privyId, or case-insensitive username) so each lookup uses one optimal index.
 * - **WHY `lower(username)` for the username branch?** Matches `idx_users_username_lower` and stays consistent with `findUserByIdentifier` (case-insensitive usernames).
 *
 * Further detail: `packages/engine/src/services/PORTFOLIO_BREAKDOWN_OPTIMIZATION.md`.
 *
 * @param userId - User identifier (UUID, snowflake ID, privyId, or username)
 * @returns Portfolio snapshot or null if user not found
 */
export async function calculatePortfolioBreakdown(
  userId: string
): Promise<PortfolioBreakdownSnapshot | null> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return null;
  }

  // User IDs may come in as either the canonical `users.id` or `users.privyId`.
  // To keep portfolio totals stable across migrations, we treat both as aliases
  // for the same user when present.
  // Classify identifier to determine optimal query route
  // WHY: Eliminates OR condition that prevents optimal index usage.
  // Same optimization pattern as markDirty and recomputeTotalPoints.
  const kind = resolveUserIdentifierKind(normalizedUserId);

  // Route to single WHERE condition based on classification
  // WHY sql template for username? Username matching must be case-insensitive to use
  // the functional index idx_users_username_lower. Using eq() would be case-sensitive.
  const portfolioSelect = {
    id: users.id,
    privyId: users.privyId,
    displayName: users.displayName,
    username: users.username,
    virtualBalance: users.virtualBalance,
    totalDeposited: users.totalDeposited,
    totalWithdrawn: users.totalWithdrawn,
    reputationPoints: users.reputationPoints,
  };

  const whereClause =
    kind === 'id'
      ? eq(users.id, normalizedUserId)
      : kind === 'privyId'
        ? eq(users.privyId, normalizedUserId)
        : sql`lower(${users.username}) = lower(${normalizedUserId})`; // Case-insensitive for functional index

  const userResult = await db
    .select(portfolioSelect)
    .from(users)
    .where(whereClause)
    .limit(1);

  type PortfolioUserRow = {
    id: string;
    privyId: string | null;
    displayName: string | null;
    username: string | null;
    virtualBalance: unknown;
    totalDeposited: unknown;
    totalWithdrawn: unknown;
    reputationPoints: number;
  };

  let user = userResult[0] as PortfolioUserRow | undefined;

  // Fallback: did:privy: identifiers may be stored as the primary key
  // instead of in the privyId column. PK lookup is O(1).
  if (!user && kind === 'privyId') {
    const fallbackResult = await db
      .select(portfolioSelect)
      .from(users)
      .where(eq(users.id, normalizedUserId))
      .limit(1);
    user = fallbackResult[0] as PortfolioUserRow | undefined;
  }

  if (!user) return null;

  const canonicalUserId = user.id;
  const positionUserIds = Array.from(
    new Set([canonicalUserId, user.privyId].filter(Boolean))
  ) as string[];

  const agentRows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      virtualBalance: users.virtualBalance,
    })
    .from(users)
    .where(and(eq(users.managedBy, canonicalUserId), eq(users.isAgent, true)));

  const agentIds = agentRows.map((a) => a.id);
  const agentCount = agentIds.length;

  const wallet = toNumber(user.virtualBalance);
  const agents = agentRows.reduce(
    (sum, agent) => sum + toNumber(agent.virtualBalance),
    0
  );

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

  const invalidPerpRows = perpRows.filter(
    (position) => !isOpenPerpPositionStateValid(position)
  );
  if (invalidPerpRows.length > 0) {
    logger.warn(
      'Excluding invalid open perp positions from portfolio breakdown',
      {
        userId: canonicalUserId,
        invalidPerpPositions: invalidPerpRows.length,
      },
      'PortfolioBreakdown'
    );
  }

  const perpsValue = perpRows.reduce(
    (sum, p) => sum + calculatePerpPositionMarketValue(p),
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

  // Exclude peer-to-peer point transfers from PnL baseline.
  const transferResult = await db
    .select({
      netTransfers: sql<number>`COALESCE(SUM(${pointsTransactions.amount}), 0)`,
    })
    .from(pointsTransactions)
    .where(
      and(
        inArray(pointsTransactions.userId, positionUserIds),
        inArray(pointsTransactions.reason, [
          'transfer_sent',
          'transfer_received',
        ])
      )
    )
    .limit(1);

  const netTransfers = toNumber(transferResult[0]?.netTransfers);
  const originalAmount = totalDeposited - totalWithdrawn + netTransfers;

  const available = wallet + agents;
  const totalAssets = wallet + agents + positionsValue;
  const totalPnL = totalAssets - originalAmount;
  const totalPoints = wallet + positionsValue + user.reputationPoints;
  const members: PortfolioBreakdownMember[] = [
    {
      id: canonicalUserId,
      name: user.displayName || user.username || 'You (Owner)',
      wallet,
      isAgent: false,
    },
    ...agentRows.map((agent) => ({
      id: agent.id,
      name: agent.displayName || agent.username || 'Agent',
      wallet: toNumber(agent.virtualBalance),
      isAgent: true,
    })),
  ];

  return {
    wallet,
    agents,
    positions: positionsValue,
    available,
    originalAmount,
    totalAssets,
    totalPnL,
    agentCount,
    totalPoints,
    members,
  };
}
