/**
 * Perpetual Futures Markets API
 *
 * @route GET /api/markets/perps
 * @access Public (optional authentication for user positions)
 *
 * @description
 * Returns all available perpetual futures markets with real-time pricing,
 * 24-hour statistics, open interest, funding rates, and user positions.
 * Perpetual futures allow leveraged trading on company valuations without
 * expiration dates.
 *
 * @openapi
 * /api/markets/perps:
 *   get:
 *     tags:
 *       - Trading
 *     summary: Get perpetual futures markets
 *     description: Returns all available perp markets with real-time pricing, 24h statistics, and funding rates.
 *     security:
 *       - PrivyAuth: []
 *     responses:
 *       200:
 *         description: Perp markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 markets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticker:
 *                         type: string
 *                       name:
 *                         type: string
 *                       currentPrice:
 *                         type: number
 *                       change24h:
 *                         type: number
 *                       changePercent24h:
 *                         type: number
 *                       volume24h:
 *                         type: number
 *                       openInterest:
 *                         type: number
 *                       fundingRate:
 *                         type: object
 *                 count:
 *                   type: integer
 *
 * **Market Data Includes:**
 * - **Current Price:** Real-time company valuation
 * - **24h Statistics:** Price change, volume, high/low
 * - **Open Interest:** Total notional value of all open positions
 * - **Funding Rate:** Periodic payment between long and short positions
 * - **Leverage Limits:** Maximum leverage available (up to 100x)
 * - **User Positions:** Active positions for authenticated users
 *
 * **Funding Rate Calculation:**
 * Funding rates balance long/short position imbalance:
 * - Base rate: 1% annual
 * - Adjusted by position imbalance: ±5%
 * - Paid every 8 hours
 * - Longs pay shorts when more longs, vice versa
 *
 * **24h Statistics:**
 * Calculated from minute-by-minute price history:
 * - Change: Current price vs 24h ago
 * - Change %: Percentage change
 * - High/Low: 24h price range
 * - Volume: Sum of notional values of positions opened
 *
 * **Open Interest:**
 * Total size of all open positions (long + short) representing
 * market liquidity and trader commitment.
 *
 * **Authentication:**
 * - Public access: Returns all markets without user positions
 * - Authenticated: Includes user's open positions for each market
 *
 * @returns {object} Markets list response
 * @property {boolean} success - Operation success
 * @property {array} markets - Array of market objects
 * @property {number} count - Total markets available
 *
 * **Market Object:**
 * @property {string} ticker - Trading symbol (e.g., 'AAPL', 'GOOGL')
 * @property {string} organizationId - Company/organization ID
 * @property {string} name - Company name
 * @property {number} currentPrice - Current market price
 * @property {number} change24h - 24h price change (absolute)
 * @property {number} changePercent24h - 24h price change (percentage)
 * @property {number} high24h - 24h high price
 * @property {number} low24h - 24h low price
 * @property {number} volume24h - 24h trading volume
 * @property {number} openInterest - Total open interest
 * @property {object} fundingRate - Funding rate information
 * @property {number} fundingRate.rate - Current rate (annual)
 * @property {string} fundingRate.nextFundingTime - Next funding timestamp
 * @property {number} fundingRate.predictedRate - Predicted next rate
 * @property {number} maxLeverage - Maximum leverage allowed (100x)
 * @property {number} minOrderSize - Minimum order size
 *
 * @throws {500} Internal server error
 *
 * @example
 * ```typescript
 * // Get all perp markets
 * const response = await fetch('/api/markets/perps');
 * const { markets } = await response.json();
 *
 * // Display market data
 * markets.forEach(market => {
 *   console.log(`${market.ticker}: $${market.currentPrice}`);
 *   console.log(`24h: ${market.changePercent24h.toFixed(2)}%`);
 *   console.log(`Open Interest: $${market.openInterest.toLocaleString()}`);
 *   console.log(`Funding: ${(market.fundingRate.rate * 100).toFixed(3)}%`);
 * });
 *
 * // Find most active market
 * const mostActive = markets.reduce((max, m) =>
 *   m.volume24h > max.volume24h ? m : max
 * );
 * ```
 *
 * @see {@link /lib/database-service} Database service
 * @see {@link /lib/db/context} RLS context for user positions
 * @see {@link /src/app/markets/perps/page.tsx} Perps trading UI
 */

import type { NextRequest } from 'next/server';
import type { Organization, StockPrice } from '@babylon/db';
import { db, getDbInstance, stockPrices, perpPositions, inArray, desc, isNull, gte, and } from '@babylon/db';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';

/**
 * Position data structure for internal processing
 */
interface PositionData {
  id: string;
  userId: string;
  organizationId: string;
  side: string;
  size: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
}

/**
 * Recent position data for volume calculation
 */
interface RecentPositionData {
  organizationId: string;
  size: number;
  entryPrice: number;
}

export const GET = withErrorHandling(async (_request: NextRequest) => {
  // Get ONLY companies (not media, government, think tanks)
  // Filter to only include companies with a valid price (currentPrice OR initialPrice),
  // which matches the PerpetualsEngine.initializeMarkets() filter.
  // Without this, the UI would show markets that users can't actually trade.
  const allCompanies = await getDbInstance().getCompanies();
  const companies = allCompanies.filter((c) => c.currentPrice !== null || c.initialPrice !== null);
  
  if (companies.length === 0) {
    return successResponse({
      success: true,
      markets: [],
      count: 0,
    });
  }

  const companyIds = companies.map((c: Organization) => c.id);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // BATCH QUERY 1: Get all price history for all companies in ONE query
  // We get recent prices (last 2 per org is enough for 24h change calculation)
  // For high/low, we use a window query approach
  const allPriceHistory = await db
    .select({
      organizationId: stockPrices.organizationId,
      price: stockPrices.price,
      timestamp: stockPrices.timestamp,
    })
    .from(stockPrices)
    .where(
      and(
        inArray(stockPrices.organizationId, companyIds),
        gte(stockPrices.timestamp, twentyFourHoursAgo)
      )
    )
    .orderBy(desc(stockPrices.timestamp));

  // BATCH QUERY 2: Get all open positions in ONE query
  const allOpenPositions = await db
    .select({
      id: perpPositions.id,
      userId: perpPositions.userId,
      organizationId: perpPositions.organizationId,
      side: perpPositions.side,
      size: perpPositions.size,
      leverage: perpPositions.leverage,
      entryPrice: perpPositions.entryPrice,
      currentPrice: perpPositions.currentPrice,
    })
    .from(perpPositions)
    .where(
      and(
        inArray(perpPositions.organizationId, companyIds),
        isNull(perpPositions.closedAt)
      )
    );

  // BATCH QUERY 3: Get all recent positions (for 24h volume) in ONE query
  const allRecentPositions = await db
    .select({
      organizationId: perpPositions.organizationId,
      size: perpPositions.size,
      entryPrice: perpPositions.entryPrice,
    })
    .from(perpPositions)
    .where(
      and(
        inArray(perpPositions.organizationId, companyIds),
        gte(perpPositions.openedAt, twentyFourHoursAgo)
      )
    );

  // Group data by organizationId in memory
  const priceHistoryByOrg = new Map<string, StockPrice[]>();
  for (const price of allPriceHistory) {
    const existing = priceHistoryByOrg.get(price.organizationId) || [];
    existing.push(price as StockPrice);
    priceHistoryByOrg.set(price.organizationId, existing);
  }

  const openPositionsByOrg = new Map<string, PositionData[]>();
  for (const pos of allOpenPositions) {
    const existing = openPositionsByOrg.get(pos.organizationId) || [];
    existing.push({
      id: pos.id,
      userId: pos.userId,
      organizationId: pos.organizationId,
      side: pos.side,
      size: pos.size,
      leverage: pos.leverage,
      entryPrice: pos.entryPrice,
      currentPrice: pos.currentPrice,
    });
    openPositionsByOrg.set(pos.organizationId, existing);
  }

  const recentPositionsByOrg = new Map<string, RecentPositionData[]>();
  for (const pos of allRecentPositions) {
    const existing = recentPositionsByOrg.get(pos.organizationId) || [];
    existing.push({
      organizationId: pos.organizationId,
      size: pos.size,
      entryPrice: pos.entryPrice,
    });
    recentPositionsByOrg.set(pos.organizationId, existing);
  }

  // Build markets from grouped data (no additional queries)
  const markets = companies.map((company: Organization) => {
    const ticker =
      company.ticker ||
      company.id.toUpperCase().replace(/-/g, '').substring(0, 12);

    const currentPrice =
      Number(company.currentPrice) || Number(company.initialPrice) || 100;

    // Get price history for this company from the grouped data
    const priceHistory = priceHistoryByOrg.get(company.id) || [];

    let change24h = 0;
    let changePercent24h = 0;
    let high24h = currentPrice;
    let low24h = currentPrice;

    if (priceHistory.length > 0) {
      // Calculate 24h change (oldest price in our 24h window)
      const price24hAgo = priceHistory[priceHistory.length - 1];
      if (price24hAgo) {
        change24h = currentPrice - price24hAgo.price;
        changePercent24h = (change24h / price24hAgo.price) * 100;
      }

      // Calculate high/low from price history
      const prices = priceHistory.map((p) => p.price);
      high24h = Math.max(...prices, currentPrice);
      low24h = Math.min(...prices, currentPrice);
    }

    // Get positions from grouped data
    const dbPositions = openPositionsByOrg.get(company.id) || [];
    const positions = dbPositions.map((p) => ({
      id: p.id,
      userId: p.userId,
      side: p.side as 'long' | 'short',
      size: p.size,
      leverage: p.leverage,
      entryPrice: p.entryPrice,
      currentPrice: p.currentPrice,
    }));

    // Open Interest = total notional value of all open positions
    const openInterest = positions.reduce(
      (sum, p) => sum + p.size * p.currentPrice,
      0
    );

    // Get recent positions for volume calculation
    const recentPositions = recentPositionsByOrg.get(company.id) || [];
    const volume24h = recentPositions.reduce((sum, p) => {
      return sum + p.size * p.entryPrice;
    }, 0);

    // Calculate funding rate from position imbalance
    const longs = positions.filter((p) => p.side === 'long');
    const shorts = positions.filter((p) => p.side === 'short');
    const longSize = longs.reduce((sum, p) => sum + p.size, 0);
    const shortSize = shorts.reduce((sum, p) => sum + p.size, 0);
    const totalSize = longSize + shortSize;

    let fundingRate = 0.01; // Default 1% annual
    if (totalSize > 0) {
      const imbalance = (longSize - shortSize) / totalSize;
      fundingRate = 0.01 + imbalance * 0.05; // ±5% based on imbalance
    }

    return {
      ticker,
      organizationId: company.id,
      name: company.name,
      currentPrice,
      change24h,
      changePercent24h,
      high24h,
      low24h,
      volume24h,
      openInterest,
      fundingRate: {
        rate: fundingRate,
        nextFundingTime: new Date(
          Date.now() + 8 * 60 * 60 * 1000
        ).toISOString(),
        predictedRate: fundingRate,
      },
      maxLeverage: 100,
      minOrderSize: 10,
    };
  });

  logger.info(
    'Perpetual markets fetched successfully',
    { count: markets.length },
    'GET /api/markets/perps'
  );

  return successResponse({
    success: true,
    markets,
    count: markets.length,
  });
});
