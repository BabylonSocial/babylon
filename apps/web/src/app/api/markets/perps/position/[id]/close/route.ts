/**
 * Perpetual Futures Close Position API
 *
 * @route POST /api/markets/perps/position/[id]/close - Close perpetual position
 * @access Authenticated
 *
 * @description
 * Closes an existing perpetual futures position. Calculates final P&L, fees,
 * and updates user balance. Supports partial closes. Tracks trade events.
 *
 * @openapi
 * /api/markets/perps/position/{id}/close:
 *   post:
 *     tags:
 *       - Markets
 *     summary: Close perpetual position
 *     description: Closes an existing perpetual futures position with P&L calculation
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Position ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: number
 *                 description: Partial close size (optional, closes full position if omitted)
 *     responses:
 *       200:
 *         description: Position closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   type: object
 *                 realizedPnL:
 *                   type: number
 *                 fee:
 *                   type: object
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid position or insufficient size
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Position not found
 *
 * @example
 * ```typescript
 * // Close full position
 * await fetch(`/api/markets/perps/position/${positionId}/close`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 *
 * // Partial close
 * await fetch(`/api/markets/perps/position/${positionId}/close`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({ size: 50 })
 * });
 * ```
 *
 * @see {@link /lib/services/perp-trade-service} Perp trade service
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { trackServerEvent } from '@/lib/posthog/server';
import { PerpTradeService } from '@babylon/engine';
import { ClosePerpPositionSchema } from '@babylon/shared';

const IdParamSchema = z.object({
  id: z.string(),
});

/**
 * POST /api/markets/perps/position/[id]/close
 * Close an existing perpetual futures position
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await authenticate(request);
    const { id: positionId } = IdParamSchema.parse(await context.params);

    // Parse and validate request body (optional for partial close)
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional for this endpoint
    }
    if (Object.keys(body).length > 0) {
      ClosePerpPositionSchema.parse(body);
    }

    const result = await PerpTradeService.closePosition(user, positionId);

    const holdTimeMs =
      new Date().getTime() - new Date(result.position.openedAt).getTime();
    const holdTimeMinutes = Math.round(holdTimeMs / 60000);

    trackServerEvent(user.userId, 'trade_closed', {
      type: 'perp',
      ticker: result.position.ticker,
      side: result.position.side,
      size: result.position.size,
      leverage: result.position.leverage,
      entryPrice: result.position.entryPrice,
      exitPrice: result.position.currentPrice,
      realizedPnL: result.realizedPnL,
      pnlPercent:
        result.marginReturned > 0
          ? (result.realizedPnL / result.marginReturned) * 100
          : 0,
      holdTimeMinutes,
      feeCharged: result.fee.feeCharged,
      wasLiquidated: result.wasLiquidated,
      positionId,
    }).catch((error) => {
      console.warn('Failed to track trade_closed event', { error });
    });

    return successResponse({
      position: {
        id: result.position.id,
        ticker: result.position.ticker,
        side: result.position.side,
        entryPrice: result.position.entryPrice,
        exitPrice: result.position.currentPrice,
        size: result.position.size,
        leverage: result.position.leverage,
        realizedPnL: result.realizedPnL,
        fundingPaid: result.position.fundingPaid,
      },
      grossSettlement: result.grossSettlement,
      netSettlement: result.netSettlement,
      marginReturned: result.marginReturned,
      pnl: result.realizedPnL,
      fee: {
        amount: result.fee.feeCharged,
        referrerPaid: result.fee.referrerPaid,
      },
      wasLiquidated: result.wasLiquidated,
      newBalance: result.newBalance,
    });
  }
);
