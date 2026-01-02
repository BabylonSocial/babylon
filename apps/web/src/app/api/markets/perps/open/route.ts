import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { handlePlayerTrade } from '@babylon/engine';
import { logger, fireAndForgetWithRetry, PerpOpenPositionSchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { trackServerEvent } from '@/lib/posthog/server';
import {
  applyUserTradePriceImpact,
  createPerpMarketService,
} from '../_adapters';

/**
 * POST /api/markets/perps/open
 * Open a new perpetual futures position.
 *
 * Uses PerpMarketService with SSE broadcast enabled for real-time UI updates.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  const body = await request.json();
  const { ticker, side, size, leverage } = PerpOpenPositionSchema.parse(body);

  const normalizedSide = side.toLowerCase() as 'long' | 'short';
  const numericSize = typeof size === 'string' ? Number(size) : size;

  // Create service with fee processor and broadcast for real-time updates
  const service = createPerpMarketService({
    withFeeProcessor: true,
    withBroadcast: true,
  });

  const result = await service.openPosition({
    userId: user.userId,
    ticker,
    side: normalizedSide,
    size: numericSize,
    leverage,
  });

  // Apply price impact from the trade
  // Wait for it to complete to ensure price is updated before response
  try {
    await applyUserTradePriceImpact(ticker);
  } catch (error) {
    // Log but don't fail the trade - price impact is enhancement
    logger.error(
      'Price impact failed',
      { ticker, error: error instanceof Error ? error.message : String(error) },
      'PerpOpen'
    );
  }

  // Track analytics event (fire and forget)
  trackServerEvent(user.userId, 'trade_opened', {
    type: 'perp',
    ticker,
    side: normalizedSide,
    size: numericSize,
    leverage,
    entryPrice: result.entryPrice ?? 0,
    marginPaid: result.marginPaid ?? 0,
    feeCharged: result.feePaid,
    positionId: result.positionId,
  }).catch((error) => {
    logger.warn(
      'Failed to track trade_opened event',
      { error: error instanceof Error ? error.message : String(error) },
      'PerpOpen'
    );
  });

  // Handle player influence - significant trades affect NPC memory
  // This adds the trade to NPC memories of affiliated actors
  fireAndForgetWithRetry(
    () => handlePlayerTrade(user.userId, ticker, normalizedSide, numericSize),
    {
      logContext: 'PerpOpen',
      metadata: { userId: user.userId, ticker, side: normalizedSide, size: numericSize },
    }
  );

  return successResponse(
    {
      position: result,
      marginPaid: result.marginPaid,
      fee: {
        amount: result.feePaid,
        referrerPaid: 0,
      },
      newBalance: result.balance,
    },
    201
  );
});
