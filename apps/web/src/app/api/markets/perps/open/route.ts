/**
 * Perpetual Futures Open Position API
 *
 * @route POST /api/markets/perps/open - Open perpetual futures position
 * @access Authenticated
 *
 * @description
 * Opens a new perpetual futures position with specified ticker, side (long/short),
 * size, and leverage. Calculates margin requirements, fees, and entry price.
 * Tracks trade events for analytics.
 *
 * @openapi
 * /api/markets/perps/open:
 *   post:
 *     tags:
 *       - Markets
 *     summary: Open perpetual futures position
 *     description: Opens a new perpetual futures position with margin and leverage
 *     security:
 *       - PrivyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticker
 *               - side
 *               - size
 *               - leverage
 *             properties:
 *               ticker:
 *                 type: string
 *                 description: Ticker symbol (e.g., AAPL, TSLA)
 *               side:
 *                 type: string
 *                 enum: [long, short]
 *               size:
 *                 type: number
 *                 description: Position size
 *               leverage:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Leverage multiplier
 *     responses:
 *       200:
 *         description: Position opened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   type: object
 *                 marginPaid:
 *                   type: number
 *                 fee:
 *                   type: object
 *       400:
 *         description: Invalid input or insufficient balance
 *       401:
 *         description: Unauthorized
 *
 * @example
 * ```typescript
 * await fetch('/api/markets/perps/open', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     ticker: 'AAPL',
 *     side: 'long',
 *     size: 100,
 *     leverage: 10
 *   })
 * });
 * ```
 *
 * @see {@link /lib/services/perp-trade-service} Perp trade service
 */

import type { NextRequest } from 'next/server';

import { authenticate } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { trackServerEvent } from '@/lib/posthog/server';
import { PerpTradeService } from '@babylon/engine';
import { PerpOpenPositionSchema } from '@babylon/shared';

/**
 * POST /api/markets/perps/open
 * Open a new perpetual futures position
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  const body = await request.json();
  const { ticker, side, size, leverage } = PerpOpenPositionSchema.parse(body);

  const normalizedSide = side.toLowerCase() as 'long' | 'short';
  const numericSize = typeof size === 'string' ? Number(size) : size;

  const result = await PerpTradeService.openPosition(user, {
    ticker,
    side: normalizedSide,
    size: numericSize,
    leverage,
  });

  trackServerEvent(user.userId, 'trade_opened', {
    type: 'perp',
    ticker,
    side: normalizedSide,
    size: numericSize,
    leverage,
    entryPrice: result.position.entryPrice,
    marginPaid: result.marginPaid,
    feeCharged: result.fee.feeCharged,
    positionId: result.position.id,
  }).catch((error) => {
    console.warn('Failed to track trade_opened event', { error });
  });

  return successResponse(
    {
      position: {
        id: result.position.id,
        ticker: result.position.ticker,
        side: result.position.side,
        entryPrice: result.position.entryPrice,
        currentPrice: result.position.currentPrice,
        size: result.position.size,
        leverage: result.position.leverage,
        liquidationPrice: result.position.liquidationPrice,
        unrealizedPnL: result.position.unrealizedPnL,
        unrealizedPnLPercent: result.position.unrealizedPnLPercent,
        fundingPaid: result.position.fundingPaid,
        openedAt: result.position.openedAt,
      },
      marginPaid: result.marginPaid,
      fee: {
        amount: result.fee.feeCharged,
        referrerPaid: result.fee.referrerPaid,
      },
      newBalance: result.newBalance,
    },
    201
  );
});
