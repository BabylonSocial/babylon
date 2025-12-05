/**
 * Perpetual Futures Trade Service
 *
 * @description Service for opening and closing perpetual futures positions.
 * Handles position validation, margin calculations, fee processing, wallet updates,
 * and trade impact application. Integrates with perps engine, wallet service, and fee service.
 */

import {
  balanceTransactions,
  db,
  eq,
  organizations,
  perpPositions,
  users,
} from '@babylon/db';
import {
  type AuthenticatedUser,
  InsufficientFundsError,
  logger,
  AuthorizationError,
  BusinessLogicError,
  InternalServerError,
  NotFoundError,
  generateSnowflakeId,
} from '@babylon/shared';
import type { PerpPosition } from '@babylon/shared';
import { FEE_CONFIG } from '@babylon/engine';
import { asUser } from '@babylon/db';
import { getReadyPerpsEngine } from '@babylon/engine';
import { FeeService } from './fee-service';
import type { TradeImpactInput } from './market-impact-service';
import { WalletService } from './wallet-service';

/**
 * Applies trade impacts for perpetual futures positions.
 *
 * This is a no-op function because perpetuals are synthetic derivatives.
 * User trades create positions that track the underlying spot price (set by NPC trading)
 * and are settled via funding rate payments, but do not influence the underlying
 * organization price. Only NPC spot trading affects prices.
 *
 * @param _trades - Trade impact inputs (unused, as this is a no-op)
 */
async function applyPerpTradeImpacts(_trades: TradeImpactInput[]): Promise<void> {
  logger.debug(
    'Perpetual trade impacts are synthetic and do not affect spot prices',
    undefined,
    'PerpTradeService'
  );
}

/**
 * Trade side type
 */
type TradeSide = 'long' | 'short';

/**
 * Input for opening a perpetual futures position
 *
 * @description Contains ticker, side, size, and leverage for opening a position.
 */
export interface OpenPerpPositionInput {
  ticker: string;
  side: TradeSide;
  size: number;
  leverage: number;
}

/**
 * Result of opening a perpetual futures position
 *
 * @description Contains position details, margin paid, fee breakdown, and new balance.
 */
export interface OpenPerpPositionResult {
  position: PerpPosition;
  marginPaid: number;
  fee: {
    feeCharged: number;
    referrerPaid: number;
    platformReceived: number;
    referrerId: string | null;
  };
  newBalance: number;
}

/**
 * Result of closing a perpetual futures position
 *
 * @description Contains position details, realized P&L, margin returned, settlement amounts,
 * liquidation status, fee breakdown, and new balance.
 */
export interface ClosePerpPositionResult {
  position: PerpPosition;
  realizedPnL: number;
  marginReturned: number;
  grossSettlement: number;
  netSettlement: number;
  wasLiquidated: boolean;
  fee: {
    feeCharged: number;
    referrerPaid: number;
    platformReceived: number;
    referrerId: string | null;
  };
  newBalance: number;
}

/**
 * Resolve exit price for closing a position
 *
 * @description Determines exit price from multiple sources with fallback priority:
 * 1. Engine price (most accurate)
 * 2. Position price (from database)
 * 3. Organization price (from organization record)
 * 4. Entry price (fallback)
 *
 * @param {object} options - Price resolution options
 * @param {number | null} [options.enginePrice] - Price from perps engine
 * @param {number | null} [options.organizationPrice] - Price from organization record
 * @param {number | null} [options.positionPrice] - Price from position record
 * @param {number} options.entryPrice - Entry price (fallback)
 * @returns {number} Resolved exit price
 */
export function resolveExitPrice(options: {
  enginePrice?: number | null;
  organizationPrice?: number | null;
  positionPrice?: number | null;
  entryPrice: number;
}): number {
  const normalize = (value?: number | null): number | null => {
    if (value === undefined || value === null) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  return (
    normalize(options.enginePrice) ??
    normalize(options.positionPrice) ??
    normalize(options.organizationPrice) ??
    options.entryPrice
  );
}

/**
 * Perpetual Futures Trade Service Class
 *
 * @description Static service class for opening and closing perpetual futures positions.
 * Provides methods for position management, validation, and settlement.
 */
export class PerpTradeService {
  /**
   * Open a perpetual futures position
   *
   * @description Opens a new perpetual futures position. Validates market exists,
   * checks position size limits, verifies sufficient funds, opens position in engine,
   * updates database, processes fees, applies trade impacts, and returns result.
   *
   * @param {AuthenticatedUser} authUser - Authenticated user
   * @param {OpenPerpPositionInput} input - Position opening parameters
   * @returns {Promise<OpenPerpPositionResult>} Position opening result
   * @throws {NotFoundError} If market not found
   * @throws {BusinessLogicError} If position size invalid
   * @throws {InsufficientFundsError} If insufficient funds
   */
  static async openPosition(
    authUser: AuthenticatedUser,
    input: OpenPerpPositionInput
  ): Promise<OpenPerpPositionResult> {
    const perpsEngine = await getReadyPerpsEngine();

    const markets = perpsEngine.getMarkets();
    const market = markets.find((m) => m.ticker === input.ticker);

    if (!market) {
      throw new NotFoundError('Market', input.ticker);
    }

    const minPositionSize = market.minOrderSize;
    const maxPositionSize = market.maxPositionSize; // Calculated by engine based on open interest
    const size = input.size;

    if (size < minPositionSize) {
      throw new BusinessLogicError(
        `Position size too small. Minimum: $${minPositionSize}`,
        'POSITION_SIZE_TOO_SMALL',
        { min: minPositionSize, requested: size }
      );
    }

    if (size > maxPositionSize) {
      throw new BusinessLogicError(
        `Position size exceeds market limit. Maximum: $${maxPositionSize.toLocaleString()} (based on market liquidity)`,
        'POSITION_SIZE_TOO_LARGE',
        { max: maxPositionSize, requested: size, openInterest: market.openInterest }
      );
    }

    const marginRequired = size / input.leverage;
    const feeCalc = FeeService.calculateFee(size);
    const totalCost = marginRequired + feeCalc.feeAmount;

    const hasFunds = await WalletService.hasSufficientBalance(
      authUser.userId,
      totalCost
    );
    if (!hasFunds) {
      const balance = await WalletService.getBalance(authUser.userId);
      throw new InsufficientFundsError(
        totalCost,
        Number(balance.balance),
        'USD'
      );
    }

    const position = perpsEngine.openPosition(authUser.userId, {
      ticker: input.ticker,
      side: input.side,
      size,
      leverage: input.leverage,
      orderType: 'market',
    });

    try {
      await asUser(authUser.userId, async (txDb) => {
        const [dbUser] = await txDb
          .select({ id: users.id, virtualBalance: users.virtualBalance })
          .from(users)
          .where(eq(users.id, authUser.userId))
          .limit(1);

        if (!dbUser) {
          throw new NotFoundError('User', authUser.userId);
        }

        if (dbUser.virtualBalance === null) {
          throw new InternalServerError('User balance not initialized', {
            userId: authUser.userId,
          });
        }

        const currentBalance = Number(dbUser.virtualBalance);
        if (currentBalance < totalCost) {
          throw new InsufficientFundsError(totalCost, currentBalance, 'USD');
        }

        const newBalance = currentBalance - totalCost;

        await txDb
          .update(users)
          .set({
            virtualBalance: newBalance.toString(),
          })
          .where(eq(users.id, authUser.userId));

        await txDb.insert(balanceTransactions).values({
          id: await generateSnowflakeId(),
          userId: authUser.userId,
          type: 'perp_open',
          amount: (-totalCost).toString(),
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString(),
          relatedId: position.id,
          description: `Opened ${input.leverage}x ${input.side} position on ${input.ticker} (incl. $${feeCalc.feeAmount.toFixed(2)} fee)`,
        });

        await txDb.insert(perpPositions).values({
          id: position.id,
          userId: authUser.userId,
          ticker: position.ticker,
          organizationId: position.organizationId,
          side: position.side,
          entryPrice: position.entryPrice,
          currentPrice: position.currentPrice,
          size: position.size,
          leverage: position.leverage,
          liquidationPrice: position.liquidationPrice,
          unrealizedPnL: position.unrealizedPnL,
          unrealizedPnLPercent: position.unrealizedPnLPercent,
          fundingPaid: position.fundingPaid,
          lastUpdated: new Date(),
        });
      });
    } catch (error) {
      perpsEngine.closePosition(position.id);
      throw error;
    }

    const feeResult = await FeeService.processTradingFee(
      authUser.userId,
      FEE_CONFIG.FEE_TYPES.PERP_OPEN,
      size,
      position.id,
      input.ticker
    );

    // Cache invalidation is handled by the API layer, not the engine
    logger.debug(
      'Perp position opened, cache invalidation handled by API layer',
      { userId: authUser.userId },
      'PerpTradeService.openPosition'
    );

    const tradeImpact: TradeImpactInput = {
      marketType: 'perp',
      ticker: input.ticker,
      side: input.side,
      size,
    };

    await applyPerpTradeImpacts([tradeImpact]);

    const newBalance = (await WalletService.getBalance(authUser.userId))
      .balance;

    return {
      position,
      marginPaid: marginRequired,
      fee: feeResult,
      newBalance,
    };
  }

  /**
   * Close a perpetual futures position
   *
   * @description Closes an existing perpetual futures position. Validates position
   * exists and belongs to user, resolves exit price, closes position in engine, calculates
   * P&L, updates wallet, processes fees, applies trade impacts, and returns result.
   *
   * @param {AuthenticatedUser} authUser - Authenticated user
   * @param {string} positionId - Position ID to close
   * @returns {Promise<ClosePerpPositionResult>} Position closing result
   * @throws {NotFoundError} If position not found
   * @throws {AuthorizationError} If position does not belong to user
   * @throws {BusinessLogicError} If position already closed
   */
  static async closePosition(
    authUser: AuthenticatedUser,
    positionId: string
  ): Promise<ClosePerpPositionResult> {
    const perpsEngine = await getReadyPerpsEngine();

    const dbPosition = await asUser(authUser.userId, async (txDb) => {
      const [result] = await txDb
        .select()
        .from(perpPositions)
        .where(eq(perpPositions.id, positionId))
        .limit(1);
      return result || null;
    });

    if (!dbPosition) {
      throw new NotFoundError('Position', positionId);
    }

    if (dbPosition.userId !== authUser.userId) {
      throw new AuthorizationError('Not your position', 'position', 'close');
    }

    if (dbPosition.closedAt) {
      throw new BusinessLogicError(
        'Position already closed',
        'POSITION_CLOSED',
        { positionId, closedAt: dbPosition.closedAt.toISOString() }
      );
    }

    if (!perpsEngine.hasPosition(positionId)) {
      perpsEngine.hydratePosition({
        id: dbPosition.id,
        userId: dbPosition.userId,
        ticker: dbPosition.ticker,
        organizationId: dbPosition.organizationId,
        side: dbPosition.side as 'long' | 'short',
        entryPrice: Number(dbPosition.entryPrice),
        currentPrice: Number(dbPosition.currentPrice),
        size: Number(dbPosition.size),
        leverage: Number(dbPosition.leverage),
        liquidationPrice: Number(dbPosition.liquidationPrice),
        unrealizedPnL: Number(dbPosition.unrealizedPnL),
        unrealizedPnLPercent: Number(dbPosition.unrealizedPnLPercent),
        fundingPaid: Number(dbPosition.fundingPaid),
        openedAt: dbPosition.openedAt,
        lastUpdated: dbPosition.lastUpdated ?? dbPosition.openedAt,
      });
    }

    const [latestOrganization] = await db
      .select({ currentPrice: organizations.currentPrice })
      .from(organizations)
      .where(eq(organizations.id, dbPosition.organizationId))
      .limit(1);

    const enginePosition = perpsEngine.getPosition(positionId);

    const exitPrice = resolveExitPrice({
      enginePrice: enginePosition?.currentPrice ?? null,
      organizationPrice: latestOrganization?.currentPrice
        ? Number(latestOrganization.currentPrice)
        : null,
      positionPrice: dbPosition.currentPrice
        ? Number(dbPosition.currentPrice)
        : null,
      entryPrice: Number(dbPosition.entryPrice),
    });

    if (!enginePosition) {
      logger.warn(
        'Engine position missing during close, relying on DB snapshot',
        { positionId },
        'PerpTradeService.closePosition'
      );
    }

    const { position, realizedPnL } = perpsEngine.closePosition(
      positionId,
      exitPrice
    );

    logger.debug(
      'Resolved exit price for perp close',
      {
        positionId,
        enginePrice: enginePosition?.currentPrice ?? null,
        dbPositionPrice: dbPosition.currentPrice
          ? Number(dbPosition.currentPrice)
          : null,
        organizationPrice: latestOrganization?.currentPrice
          ? Number(latestOrganization.currentPrice)
          : null,
        exitPrice,
      },
      'PerpTradeService.closePosition'
    );

    const marginPaid = position.size / position.leverage;
    const grossSettlement = marginPaid + realizedPnL;

    const feeCalc = FeeService.calculateFee(position.size);
    const netSettlement = Math.max(0, grossSettlement - feeCalc.feeAmount);

    if (netSettlement > 0) {
      await WalletService.credit(
        authUser.userId,
        netSettlement,
        'perp_close',
        `Closed ${position.leverage}x ${position.side} ${position.ticker} - PnL: ${realizedPnL >= 0 ? '+' : ''}$${realizedPnL.toFixed(2)} (fee: $${feeCalc.feeAmount.toFixed(2)})`,
        position.id
      );
    } else {
      logger.info(
        'Position closed with total loss or fees exceeded settlement',
        {
          positionId,
          marginPaid,
          realizedPnL,
          grossSettlement,
          fee: feeCalc.feeAmount,
          netSettlement,
          userId: authUser.userId,
        },
        'PerpTradeService.closePosition'
      );
    }

    await WalletService.recordPnL(
      authUser.userId,
      realizedPnL,
      'perp_close',
      position.id
    );

    await asUser(authUser.userId, async (txDb) => {
      try {
        const result = await txDb
          .update(perpPositions)
          .set({
            closedAt: new Date(),
            realizedPnL: realizedPnL,
            currentPrice: position.currentPrice,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            lastUpdated: new Date(),
          })
          .where(eq(perpPositions.id, positionId))
          .returning({ id: perpPositions.id });

        // Check if position was found
        if (result.length === 0) {
          logger.warn(
            'Position not found during update (may have been deleted)',
            { positionId, userId: authUser.userId },
            'PerpTradeService.closePosition'
          );
          // Position doesn't exist - this is okay, it may have been deleted
          // The position was already closed in the engine, so we can continue
          return;
        }
      } catch (error) {
        throw error;
      }
    });

    const feeResult =
      grossSettlement > 0
        ? await FeeService.processTradingFee(
            authUser.userId,
            FEE_CONFIG.FEE_TYPES.PERP_CLOSE,
            position.size,
            position.id,
            position.ticker
          )
        : {
            feeCharged: 0,
            referrerPaid: 0,
            platformReceived: 0,
            referrerId: null,
          };

    const closingImpact: TradeImpactInput = {
      marketType: 'perp',
      ticker: position.ticker,
      side: position.side === 'long' ? 'short' : 'long',
      size: position.size,
    };

    await applyPerpTradeImpacts([closingImpact]);

    const newBalance = (await WalletService.getBalance(authUser.userId))
      .balance;

    return {
      position,
      realizedPnL,
      marginReturned: marginPaid,
      grossSettlement,
      netSettlement,
      wasLiquidated: netSettlement === 0,
      fee: feeResult,
      newBalance,
    };
  }
}
