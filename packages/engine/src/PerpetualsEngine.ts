/**
 * Perpetuals Trading Engine
 *
 * @module engine/PerpetualsEngine
 *
 * @description
 * Manages perpetual futures contracts trading system for Babylon. Handles position
 * lifecycle, funding rate calculations, liquidations, PnL tracking, and market data.
 *
 * **Core Functionality:**
 * - Open/close leveraged long/short positions
 * - Calculate funding payments every 8 hours
 * - Monitor and execute liquidations
 * - Track unrealized and realized PnL
 * - Record daily price snapshots
 * - Sync position state to database
 *
 * **Key Concepts:**
 *
 * **Perpetual Futures:**
 * - Derivative contracts with no expiry date
 * - Track underlying company stock prices
 * - Leverage: 1-100x (configurable per market)
 * - Two sides: Long (bet price up) or Short (bet price down)
 *
 * **Funding Rates:**
 * - Periodic payments between longs and shorts (every 8 hours)
 * - Keeps perpetual price aligned with spot price
 * - Longs pay shorts when funding positive
 * - Shorts pay longs when funding negative
 *
 * **Liquidations:**
 * - Triggered when position reaches liquidation price
 * - Trader loses entire margin (collateral)
 * - Position automatically closed
 * - Liquidation price depends on leverage and side
 *
 * **Position Sizing:**
 * - Size measured in USD notional value
 * - Margin = Size / Leverage
 * - Example: $1000 position at 10x = $100 margin
 *
 * **Database Sync:**
 * - Periodic sync of dirty positions (every 10 seconds)
 * - Tracks which positions changed since last sync
 * - Batch updates for efficiency
 * - Final sync on engine stop
 *
 * **Events Emitted:**
 * - `position:opened` - New position created
 * - `position:closed` - Position closed manually
 * - `position:liquidated` - Position liquidated
 * - `funding:processed` - Funding payments processed
 * - `funding:rate:updated` - Funding rate updated
 * - `market:updated` - Market price updated
 * - `daily:snapshot` - Daily snapshot recorded
 *
 * @see {@link /shared/perps-types.ts} - Core perpetuals types and calculations
 * @see {@link TradeExecutionService} - Executes NPC perp trades
 * @see {@link GameEngine} - Uses PerpetualsEngine for price updates
 *
 * @example
 * ```typescript
 * const perps = new PerpetualsEngine();
 *
 * // Initialize markets
 * perps.initializeMarkets(organizations);
 *
 * // Open position
 * const position = perps.openPosition('user-1', {
 *   ticker: 'TECH',
 *   side: 'long',
 *   size: 1000,
 *   leverage: 10,
 *   orderType: 'market'
 * });
 *
 * // Update prices
 * perps.updatePositions(new Map([['org-tech', 105]]));
 *
 * // Process funding
 * perps.processFunding();
 *
 * // Close position
 * const { realizedPnL } = perps.closePosition(position.id);
 * ```
 */
import { EventEmitter } from 'events';
import type { PerpPosition as DbPerpPosition } from '@babylon/db';
import { db, eq, perpPositions } from '@babylon/db';
import { logger, NotFoundError, BusinessLogicError } from '@babylon/shared';

import type {
  DailyPriceSnapshot,
  FundingRate,
  Liquidation,
  OrderRequest,
  PerpMarket,
  PerpPosition,
  TradingStats,
} from './types/perps';
import {
  calculateFundingPayment,
  calculateLiquidationPrice,
  calculateMarkPrice,
  calculateMaxPositionSize,
  calculateUnrealizedPnL,
  shouldLiquidate,
} from './types/perps';
import type { Organization } from './types/shared';

interface ClosedPosition {
  userId: string;
  ticker: string;
  side: 'long' | 'short';
  size: number;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnL: number;
  fundingPaid: number;
  timestamp: string;
  reason: 'manual' | 'liquidation';
}

interface TradeRecord {
  userId: string;
  ticker: string;
  type: 'open' | 'close' | 'liquidation';
  size: number;
  price: number;
  volume: number;
  timestamp: string;
}

interface HydratablePerpPosition {
  id: string;
  userId: string;
  ticker: string;
  organizationId: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  liquidationPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  fundingPaid: number;
  openedAt: Date | string;
  lastUpdated: Date | string;
}

type PriceUpdateMap = Map<string, number>;

/**
 * Perpetuals Trading Engine
 *
 * @class PerpetualsEngine
 * @extends EventEmitter
 *
 * @description
 * Complete perpetual futures trading system with position management, funding
 * rates, liquidation engine, and database persistence. Handles all aspects of
 * leveraged trading for both players and NPCs.
 *
 * **State Management:**
 * - In-memory state for fast operations
 * - Periodic database sync (every 10 seconds)
 * - Dirty tracking for efficient updates
 * - Hydration from database on startup
 *
 * **Position Lifecycle:**
 * 1. Open: Create position with entry price and leverage
 * 2. Update: Price changes update unrealized PnL
 * 3. Funding: Periodic payments every 8 hours
 * 4. Close/Liquidate: Realize PnL and settle position
 *
 * **Risk Management:**
 * - Automatic liquidation monitoring on price updates
 * - Liquidation price calculated on open
 * - Margin loss on liquidation (full collateral)
 * - Position limits via min order size
 *
 * **Market Data:**
 * - Current price, 24h change, high/low
 * - Volume and open interest tracking
 * - Funding rate and next funding time
 * - Mark price vs index price
 *
 * @usage
 * Instantiated once by GameEngine and persists for entire game lifecycle.
 */
export class PerpetualsEngine extends EventEmitter {
  private positions: Map<string, PerpPosition> = new Map();
  private markets: Map<string, PerpMarket> = new Map();
  private fundingRates: Map<string, FundingRate> = new Map();
  private dailySnapshots: Map<string, DailyPriceSnapshot[]> = new Map();
  private liquidations: Liquidation[] = [];
  private closedPositions: ClosedPosition[] = [];
  private tradeHistory: TradeRecord[] = [];
  private lastFundingTime: string = new Date().toISOString();
  private currentDate: string = new Date().toISOString().split('T')[0]!;
  private syncInterval = 10000;
  private syncTimer: NodeJS.Timeout | null = null;
  private dirtyPositions: Set<string> = new Set();

  /**
   * Create a new PerpetualsEngine
   *
   * @description
   * Initializes the engine and starts periodic database synchronization.
   *
   * **Automatic Processes:**
   * - Starts 10-second sync timer for position updates
   * - Initializes all state maps
   * - Sets up event emitter
   *
   * @example
   * ```typescript
   * const perps = new PerpetualsEngine();
   * perps.on('position:liquidated', (liq) => {
   *   console.log(`Liquidation: ${liq.ticker} at $${liq.actualPrice}`);
   * });
   * ```
   */
  constructor() {
    super();
    this.startPeriodicSync();
  }

  /**
   * Initialize perpetual futures markets from organizations
   *
   * @param organizations - Array of organizations (filters to companies with prices)
   *
   * @description
   * Creates perpetual futures markets for all companies with initial prices.
   * Sets up market data, funding rates, and initial state.
   *
   * **Market Initialization:**
   * - Filters to organizations with type='company' and initialPrice
   * - Generates ticker symbols (max 12 chars, uppercase, no dashes)
   * - Sets current price from organization's current or initial price
   * - Initializes 24h stats (change, high, low, volume)
   * - Sets default funding rate (1% annual)
   * - Configures max leverage (100x) and min order size
   *
   * **Funding Schedule:**
   * - Every 8 hours: 00:00, 08:00, 16:00 UTC
   * - Next funding time calculated and set
   *
   * @usage
   * Called once by GameEngine during initialization.
   *
   * @example
   * ```typescript
   * const orgs = [
   *   { id: 'tech-corp', type: 'company', initialPrice: 100, ... },
   *   { id: 'mega-inc', type: 'company', currentPrice: 250, ... }
   * ];
   *
   * perps.initializeMarkets(orgs);
   * // Creates markets: TECHCORP, MEGAINC
   *
   * const markets = perps.getMarkets();
   * console.log(`Initialized ${markets.length} markets`);
   * ```
   */
  initializeMarkets(organizations: Organization[]): void {
    // Accept companies with either currentPrice OR initialPrice
    // A market is tradeable if it has any valid price
    const companies = organizations.filter(
      (o) => o.type === 'company' && (o.currentPrice || o.initialPrice)
    );

    for (const company of companies) {
      // Use ticker from organization if available, otherwise generate from ID
      const ticker =
        'ticker' in company && company.ticker
          ? company.ticker
          : this.generateTicker(company.id);

      const initialOpenInterest = 0;
      const market: PerpMarket = {
        ticker,
        organizationId: company.id,
        name: company.name,
        currentPrice: company.currentPrice || company.initialPrice || 100,
        change24h: 0,
        changePercent24h: 0,
        high24h: company.currentPrice || company.initialPrice || 100,
        low24h: company.currentPrice || company.initialPrice || 100,
        volume24h: 0,
        openInterest: initialOpenInterest,
        fundingRate: {
          ticker,
          rate: 0.01, // 1% annual default
          nextFundingTime: this.getNextFundingTime(),
          predictedRate: 0.01,
        },
        maxLeverage: 100,
        minOrderSize: 10,
        maxPositionSize: calculateMaxPositionSize(initialOpenInterest),
        markPrice: company.currentPrice || company.initialPrice || 100,
        indexPrice: company.currentPrice || company.initialPrice || 100,
      };

      this.markets.set(ticker, market);
      this.fundingRates.set(ticker, market.fundingRate);
    }

    logger.info(
      `Initialized ${this.markets.size} perpetual markets`,
      undefined,
      'PerpetualsEngine'
    );
  }

  /**
   * Open a new position
   */
  openPosition(userId: string, order: OrderRequest): PerpPosition {
    const market = this.markets.get(order.ticker);
    if (!market) {
      throw new NotFoundError('Market', order.ticker);
    }

    if (order.size < market.minOrderSize) {
      throw new BusinessLogicError(
        `Order size below minimum (${market.minOrderSize} USD)`,
        'ORDER_SIZE_TOO_SMALL',
        { min: market.minOrderSize, requested: order.size }
      );
    }

    if (order.leverage > market.maxLeverage || order.leverage < 1) {
      throw new BusinessLogicError(
        `Invalid leverage (1-${market.maxLeverage}x)`,
        'INVALID_LEVERAGE',
        { min: 1, max: market.maxLeverage, requested: order.leverage }
      );
    }

    const entryPrice =
      order.orderType === 'market' ? market.currentPrice : order.limitPrice!;
    const liquidationPrice = calculateLiquidationPrice(
      entryPrice,
      order.side,
      order.leverage
    );

    const timestamp = new Date().toISOString();
    const position: PerpPosition = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ticker: order.ticker,
      organizationId: market.organizationId,
      side: order.side,
      entryPrice,
      currentPrice: market.currentPrice,
      size: order.size,
      leverage: order.leverage,
      liquidationPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      fundingPaid: 0,
      openedAt: timestamp,
      lastUpdated: timestamp,
    };

    this.positions.set(position.id, position);

    // Record trade history
    this.tradeHistory.push({
      userId,
      ticker: order.ticker,
      type: 'open',
      size: order.size,
      price: entryPrice,
      volume: order.size, // Volume in USD (size is already in USD)
      timestamp,
    });

    // Update market open interest and recalculate max position size
    market.openInterest += order.size * order.leverage;
    market.maxPositionSize = calculateMaxPositionSize(market.openInterest);
    market.volume24h += order.size;

    this.emit('position:opened', position);
    return position;
  }

  /**
   * Close a position
   */
  closePosition(
    positionId: string,
    exitPriceOverride?: number
  ): {
    position: PerpPosition;
    realizedPnL: number;
  } {
    const position = this.positions.get(positionId);
    if (!position) {
      throw new NotFoundError('Position', positionId);
    }

    const market = this.markets.get(position.ticker);
    if (!market) {
      throw new NotFoundError('Market', position.ticker);
    }

    if (exitPriceOverride !== undefined) {
      const priceUpdates: PriceUpdateMap = new Map();
      priceUpdates.set(market.organizationId, exitPriceOverride);
      this.updatePositions(priceUpdates);
    }

    const effectiveExitPrice = exitPriceOverride ?? market.currentPrice;
    position.currentPrice = effectiveExitPrice;
    position.lastUpdated = new Date().toISOString();

    // Calculate final PnL
    const { pnl } = calculateUnrealizedPnL(
      position.entryPrice,
      effectiveExitPrice,
      position.side,
      position.size
    );

    const realizedPnL = pnl - position.fundingPaid;
    const timestamp = new Date().toISOString();

    // Record closed position for statistics
    this.closedPositions.push({
      userId: position.userId,
      ticker: position.ticker,
      side: position.side,
      size: position.size,
      leverage: position.leverage,
      entryPrice: position.entryPrice,
      exitPrice: effectiveExitPrice,
      realizedPnL,
      fundingPaid: position.fundingPaid,
      timestamp,
      reason: 'manual',
    });

    // Record trade history
    this.tradeHistory.push({
      userId: position.userId,
      ticker: position.ticker,
      type: 'close',
      size: position.size,
      price: effectiveExitPrice,
      volume: position.size, // Volume in USD (size is already in USD)
      timestamp,
    });

    // Update market and recalculate max position size
    market.openInterest -= position.size * position.leverage;
    market.maxPositionSize = calculateMaxPositionSize(market.openInterest);
    market.volume24h += position.size;

    // Remove position
    this.positions.delete(positionId);

    this.emit('position:closed', { position, realizedPnL });
    return { position, realizedPnL };
  }

  /**
   * Update all positions with new prices
   * Marks positions as dirty for periodic database sync
   */
  updatePositions(priceUpdates: PriceUpdateMap): void {
    const now = new Date().toISOString();

    for (const [positionId, position] of this.positions) {
      const newPrice = priceUpdates.get(position.organizationId);

      if (newPrice !== undefined) {
        position.currentPrice = newPrice;
        position.lastUpdated = now;

        // Update PnL
        const { pnl, pnlPercent } = calculateUnrealizedPnL(
          position.entryPrice,
          newPrice,
          position.side,
          position.size
        );

        position.unrealizedPnL = pnl;
        position.unrealizedPnLPercent = pnlPercent;

        // Mark position as dirty for DB sync
        this.dirtyPositions.add(positionId);

        // Check for liquidation
        if (
          shouldLiquidate(newPrice, position.liquidationPrice, position.side)
        ) {
          this.liquidatePosition(positionId, newPrice);
        }
      }
    }

    // Update markets
    for (const [ticker, market] of this.markets) {
      const newPrice = priceUpdates.get(market.organizationId);
      if (newPrice !== undefined) {
        market.change24h = newPrice - market.currentPrice;
        market.changePercent24h =
          (market.change24h / market.currentPrice) * 100;
        market.currentPrice = newPrice;
        market.high24h = Math.max(market.high24h, newPrice);
        market.low24h = Math.min(market.low24h, newPrice);
        market.markPrice = calculateMarkPrice(
          market.indexPrice,
          newPrice,
          market.fundingRate.rate
        );

        // Emit market update event for ticker
        this.emit('market:updated', { ticker, market, newPrice });
      }
    }
  }

  /**
   * Hydrate engine state with existing open positions from database
   */
  hydrateOpenPositions(positions: HydratablePerpPosition[]): void {
    for (const position of positions) {
      const openedAt =
        typeof position.openedAt === 'string'
          ? position.openedAt
          : position.openedAt.toISOString();
      const lastUpdated =
        typeof position.lastUpdated === 'string'
          ? position.lastUpdated
          : position.lastUpdated.toISOString();

      this.positions.set(position.id, {
        id: position.id,
        userId: position.userId,
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
        openedAt,
        lastUpdated,
      });

      const market = this.markets.get(position.ticker);
      if (market) {
        market.openInterest += position.size * position.leverage;
      }
    }

    // Recalculate maxPositionSize for all markets after hydration
    for (const market of this.markets.values()) {
      market.maxPositionSize = calculateMaxPositionSize(market.openInterest);
    }

    if (positions.length > 0) {
      logger.info(
        `Hydrated ${positions.length} perp positions from database`,
        undefined,
        'PerpetualsEngine'
      );
    }
  }

  hydratePosition(position: HydratablePerpPosition) {
    this.hydrateOpenPositions([position]);
  }

  /**
   * Process funding payments (called every 8 hours)
   * Should be called at 00:00, 08:00, and 16:00 UTC
   */
  processFunding(): void {
    const now = new Date();
    const hoursSinceLastFunding =
      (now.getTime() - new Date(this.lastFundingTime).getTime()) /
      (1000 * 60 * 60);

    if (hoursSinceLastFunding < 8) {
      return; // Not time yet
    }

    let totalFundingPaid = 0;
    let positionsCharged = 0;

    for (const [_positionId, position] of this.positions) {
      const fundingRate = this.fundingRates.get(position.ticker);
      if (!fundingRate) continue;

      // Calculate funding for ONE 8-hour period only
      const fundingPayment = calculateFundingPayment(
        position.size,
        fundingRate.rate
      );

      // Longs pay shorts when funding is positive
      // Shorts pay longs when funding is negative
      const payment =
        position.side === 'long' ? fundingPayment : -fundingPayment;

      position.fundingPaid += payment;
      position.lastUpdated = now.toISOString();

      totalFundingPaid += Math.abs(payment);
      positionsCharged++;
    }

    this.lastFundingTime = now.toISOString();

    // Update next funding time for all markets
    const nextFundingTime = this.getNextFundingTime();
    for (const [ticker, fundingRate] of this.fundingRates) {
      fundingRate.nextFundingTime = nextFundingTime;

      // Emit funding rate update event
      this.emit('funding:rate:updated', {
        ticker,
        fundingRate,
        nextFundingTime,
      });
    }

    this.emit('funding:processed', {
      timestamp: now.toISOString(),
      positionsCharged,
      totalFundingPaid,
    });

    logger.info(
      `Processed funding: ${positionsCharged} positions, $${totalFundingPaid.toFixed(2)} total`,
      undefined,
      'PerpetualsEngine'
    );
  }

  /**
   * Liquidate a position
   * On liquidation, the user loses their entire margin (collateral)
   */
  private liquidatePosition(positionId: string, currentPrice: number): void {
    const position = this.positions.get(positionId);
    if (!position) return;

    const market = this.markets.get(position.ticker);
    if (!market) return;

    // Loss is the margin amount (not the full position size)
    const marginLoss = position.size / position.leverage;
    const timestamp = new Date().toISOString();

    const liquidation: Liquidation = {
      positionId,
      ticker: position.ticker,
      side: position.side,
      liquidationPrice: position.liquidationPrice,
      actualPrice: currentPrice,
      loss: marginLoss,
      timestamp,
    };

    this.liquidations.push(liquidation);

    // Record closed position for statistics (liquidation)
    this.closedPositions.push({
      userId: position.userId,
      ticker: position.ticker,
      side: position.side,
      size: position.size,
      leverage: position.leverage,
      entryPrice: position.entryPrice,
      exitPrice: currentPrice,
      realizedPnL: -marginLoss, // User loses their margin
      fundingPaid: position.fundingPaid,
      timestamp,
      reason: 'liquidation',
    });

    // Record trade history
    this.tradeHistory.push({
      userId: position.userId,
      ticker: position.ticker,
      type: 'liquidation',
      size: position.size,
      price: currentPrice,
      volume: position.size, // Volume in USD (size is already in USD)
      timestamp,
    });

    // Update market and recalculate max position size
    market.openInterest -= position.size * position.leverage;
    market.maxPositionSize = calculateMaxPositionSize(market.openInterest);

    // Remove position
    this.positions.delete(positionId);

    this.emit('position:liquidated', liquidation);
  }

  /**
   * Record end-of-day price snapshot
   */
  recordDailySnapshot(date?: string): void {
    const snapshotDate = date || new Date().toISOString().split('T')[0]!;

    for (const [ticker, market] of this.markets) {
      const snapshot: DailyPriceSnapshot = {
        date: snapshotDate,
        ticker,
        organizationId: market.organizationId,
        openPrice: market.low24h, // Approximation
        closePrice: market.currentPrice,
        highPrice: market.high24h,
        lowPrice: market.low24h,
        volume: market.volume24h,
        timestamp: new Date().toISOString(),
      };

      if (!this.dailySnapshots.has(ticker)) {
        this.dailySnapshots.set(ticker, []);
      }

      this.dailySnapshots.get(ticker)!.push(snapshot);

      // Reset 24h stats
      market.high24h = market.currentPrice;
      market.low24h = market.currentPrice;
      market.volume24h = 0;
    }

    this.currentDate = snapshotDate;
    this.emit('daily:snapshot', {
      date: snapshotDate,
      markets: this.markets.size,
    });
  }

  /**
   * Get daily snapshot for a ticker
   */
  getDailySnapshots(ticker: string, days = 30): DailyPriceSnapshot[] {
    const snapshots = this.dailySnapshots.get(ticker) || [];
    return snapshots.slice(-days);
  }

  /**
   * Get all markets
   */
  getMarkets(): PerpMarket[] {
    return Array.from(this.markets.values());
  }

  /**
   * Get user positions
   */
  getUserPositions(userId: string): PerpPosition[] {
    return Array.from(this.positions.values()).filter(
      (p) => p.userId === userId
    );
  }

  getPosition(positionId: string): PerpPosition | undefined {
    return this.positions.get(positionId);
  }

  hasPosition(positionId: string): boolean {
    return this.positions.has(positionId);
  }

  /**
   * Get trading stats
   */
  getTradingStats(userId: string): TradingStats {
    const userPositions = this.getUserPositions(userId);
    const userClosedPositions = this.closedPositions.filter(
      (p) => p.userId === userId
    );
    const userTrades = this.tradeHistory.filter((t) => t.userId === userId);

    // Calculate total volume from trade history
    const totalVolume = userTrades.reduce((sum, t) => sum + t.volume, 0);

    // Calculate current unrealized PnL from open positions
    const unrealizedPnL = userPositions.reduce(
      (sum, p) => sum + p.unrealizedPnL,
      0
    );

    // Calculate realized PnL from closed positions
    const realizedPnL = userClosedPositions.reduce(
      (sum, p) => sum + p.realizedPnL,
      0
    );

    // Total PnL = realized + unrealized
    const totalPnL = realizedPnL + unrealizedPnL;

    // Calculate win/loss statistics from closed positions
    const winningTrades = userClosedPositions.filter((p) => p.realizedPnL > 0);
    const losingTrades = userClosedPositions.filter((p) => p.realizedPnL <= 0);

    const winRate =
      userClosedPositions.length > 0
        ? (winningTrades.length / userClosedPositions.length) * 100
        : 0;

    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, p) => sum + p.realizedPnL, 0) /
          winningTrades.length
        : 0;

    const avgLoss =
      losingTrades.length > 0
        ? losingTrades.reduce((sum, p) => sum + p.realizedPnL, 0) /
          losingTrades.length
        : 0;

    const largestWin =
      winningTrades.length > 0
        ? Math.max(...winningTrades.map((p) => p.realizedPnL))
        : 0;

    const largestLoss =
      losingTrades.length > 0
        ? Math.min(...losingTrades.map((p) => p.realizedPnL))
        : 0;

    // Calculate total funding paid
    const totalFundingPaid =
      userPositions.reduce((sum, p) => sum + p.fundingPaid, 0) +
      userClosedPositions.reduce((sum, p) => sum + p.fundingPaid, 0);

    // Count liquidations
    const totalLiquidations = userClosedPositions.filter(
      (p) => p.reason === 'liquidation'
    ).length;

    return {
      totalVolume,
      totalTrades: userClosedPositions.length + userPositions.length,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      totalFundingPaid,
      totalLiquidations,
    };
  }

  /**
   * Start periodic database sync
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncDirtyPositions().catch((error: unknown) => {
        logger.error(
          'Error syncing positions to database:',
          error,
          'PerpetualsEngine'
        );
      });
    }, this.syncInterval);
  }

  /**
   * Sync dirty positions to database
   */
  async syncDirtyPositions(): Promise<void> {
    if (this.dirtyPositions.size === 0) return;

    const positionsToSync = Array.from(this.dirtyPositions);
    this.dirtyPositions.clear();

    // Batch update positions in database
    // Check existence first to avoid error logging for missing records
    const updates = await Promise.all(
      positionsToSync.map(async (positionId) => {
        const position = this.positions.get(positionId);
        if (!position) return null;

        // Check if position exists in database before updating
        const existingRows = await db
          .select({ id: perpPositions.id })
          .from(perpPositions)
          .where(eq(perpPositions.id, positionId))
          .limit(1);

        if (existingRows.length === 0) {
          // Position doesn't exist - remove from memory
          this.positions.delete(positionId);
          logger.debug(
            `Position ${positionId} not found in database, removed from memory`,
            undefined,
            'PerpetualsEngine'
          );
          return null;
        }

        // Position exists, proceed with update
        try {
          const result = await db
            .update(perpPositions)
            .set({
              currentPrice: position.currentPrice,
              unrealizedPnL: position.unrealizedPnL,
              unrealizedPnLPercent: position.unrealizedPnLPercent,
              fundingPaid: position.fundingPaid,
              lastUpdated: new Date(position.lastUpdated),
            })
            .where(eq(perpPositions.id, positionId))
            .returning();
          return result[0] || null;
        } catch (error: unknown) {
          // Handle not found error (shouldn't happen after existence check, but be safe)
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes('not found') ||
            errorMessage.includes('no rows')
          ) {
            this.positions.delete(positionId);
            logger.debug(
              `Position ${positionId} not found during update, removed from memory`,
              undefined,
              'PerpetualsEngine'
            );
            return null;
          }
          // Re-throw other errors
          throw error;
        }
      })
    );

    const successful = updates.filter(
      (update): update is DbPerpPosition => update !== null
    ).length;

    if (successful > 0) {
      logger.debug(
        `Synced ${successful} positions to database`,
        undefined,
        'PerpetualsEngine'
      );
    }
  }

  /**
   * Stop periodic sync (cleanup)
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    // Final sync before stopping
    this.syncDirtyPositions().catch((error: unknown) => {
      logger.error('Error in final sync:', error, 'PerpetualsEngine');
    });
  }

  /**
   * Generate ticker symbol from organization ID
   * Max 12 characters, handles dashes and truncation
   */
  private generateTicker(orgId: string): string {
    // Remove dashes and convert to uppercase
    let ticker = orgId.toUpperCase().replace(/-/g, '');

    // Truncate to max 12 characters
    if (ticker.length > 12) {
      ticker = ticker.substring(0, 12);
    }

    return ticker;
  }

  /**
   * Get next funding time (every 8 hours: 00:00, 08:00, 16:00 UTC)
   */
  private getNextFundingTime(): string {
    const now = new Date();
    const currentHour = now.getUTCHours();

    let nextHour: number;
    if (currentHour < 8) nextHour = 8;
    else if (currentHour < 16) nextHour = 16;
    else nextHour = 24; // Midnight next day

    const nextFunding = new Date(now);
    nextFunding.setUTCHours(nextHour % 24, 0, 0, 0);

    if (nextHour === 24) {
      nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
    }

    return nextFunding.toISOString();
  }

  /**
   * Save state to JSON
   */
  exportState() {
    return {
      positions: Array.from(this.positions.values()),
      markets: Array.from(this.markets.values()),
      fundingRates: Array.from(this.fundingRates.values()),
      dailySnapshots: Object.fromEntries(this.dailySnapshots),
      liquidations: this.liquidations,
      lastFundingTime: this.lastFundingTime,
      currentDate: this.currentDate,
    };
  }

  /**
   * Load state from JSON
   */
  importState(state: {
    positions: PerpPosition[];
    markets: PerpMarket[];
    fundingRates: FundingRate[];
    dailySnapshots: Record<string, DailyPriceSnapshot[]>;
    liquidations: Liquidation[];
    lastFundingTime: number | string;
    currentDate: string;
  }) {
    this.positions = new Map(
      state.positions.map((p: PerpPosition) => [p.id, p])
    );
    this.markets = new Map(state.markets.map((m: PerpMarket) => [m.ticker, m]));
    this.fundingRates = new Map(
      state.fundingRates.map((f: FundingRate) => [f.ticker, f])
    );
    this.dailySnapshots = new Map(
      Object.entries(state.dailySnapshots || {}).map(([ticker, snapshots]) => [
        ticker,
        snapshots ?? [],
      ])
    );
    this.liquidations = state.liquidations || [];
    this.lastFundingTime =
      typeof state.lastFundingTime === 'number'
        ? new Date(state.lastFundingTime).toISOString()
        : String(state.lastFundingTime);
    this.currentDate = state.currentDate;
  }
}
