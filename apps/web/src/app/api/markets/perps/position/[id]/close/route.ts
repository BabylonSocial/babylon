import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { handlePlayerTrade } from '@babylon/engine';
import { ClosePerpPositionSchema, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { trackServerEvent } from '@/lib/posthog/server';
import {
  applyUserTradePriceImpact,
  createPerpMarketService,
} from '../../../_adapters';

const IdParamSchema = z.object({
  id: z.string(),
});

/**
 * POST /api/markets/perps/position/[id]/close
 * Close an existing perpetual futures position.
 *
 * Uses PerpMarketService with SSE broadcast enabled for real-time UI updates.
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

    // Create service with fee processor and broadcast for real-time updates
    const service = createPerpMarketService({
      withFeeProcessor: true,
      withBroadcast: true,
    });

    const result = await service.closePosition({
      userId: user.userId,
      positionId,
    });

    // Apply price impact from the trade
    // Wait for it to complete to ensure price is updated before response
    try {
      await applyUserTradePriceImpact(result.ticker);
    } catch (error) {
      // Log but don't fail the trade - price impact is enhancement
      logger.error(
        'Price impact failed',
        {
          ticker: result.ticker,
          error: error instanceof Error ? error.message : String(error),
        },
        'PerpClose'
      );
    }

    // Track analytics event (fire and forget)
    trackServerEvent(user.userId, 'trade_closed', {
      type: 'perp',
      ticker: result.ticker,
      side: result.side,
      size: result.size,
      leverage: result.leverage,
      entryPrice: result.entryPrice ?? 0,
      exitPrice: result.exitPrice ?? 0,
      realizedPnL: result.realizedPnL ?? 0,
      pnlPercent:
        result.marginPaid && result.marginPaid > 0
          ? ((result.realizedPnL ?? 0) / result.marginPaid) * 100
          : 0,
      feeCharged: result.feePaid,
      wasLiquidated: false,
      positionId,
    }).catch((error) => {
      logger.warn(
        'Failed to track trade_closed event',
        { error: error instanceof Error ? error.message : String(error) },
        'PerpClose'
      );
    });

    // Handle player influence - closing positions also affects NPC memory
    // The opposite side represents the closing action
    // Fire-and-forget with retry logic for resilience
    const closingSide = result.side === 'long' ? 'short' : 'long';
    void (async () => {
      const maxRetries = 3;
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await handlePlayerTrade(
            user.userId,
            result.ticker,
            closingSide,
            result.size
          );
          return; // Success
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 100ms, 200ms, 400ms
            await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
          }
        }
      }

      // All retries failed - log as error for monitoring
      logger.error(
        'Failed to handle player trade influence after retries',
        {
          error: lastError?.message ?? 'Unknown error',
          userId: user.userId,
          ticker: result.ticker,
          side: closingSide,
          size: result.size,
          retriesAttempted: maxRetries,
        },
        'PerpClose'
      );
    })();

    return successResponse({
      position: result,
      grossSettlement:
        result.realizedPnL !== undefined && result.marginPaid !== undefined
          ? result.marginPaid + result.realizedPnL
          : undefined,
      netSettlement:
        result.realizedPnL !== undefined && result.marginPaid !== undefined
          ? Math.max(0, result.marginPaid + result.realizedPnL - result.feePaid)
          : undefined,
      marginReturned: result.marginPaid,
      pnl: result.realizedPnL,
      fee: {
        amount: result.feePaid,
        referrerPaid: 0,
      },
      wasLiquidated: false,
      newBalance: result.balance,
    });
  }
);
