/**
 * Waitlist Wallet Bonus API
 *
 * @route POST /api/waitlist/bonus/wallet - Award wallet bonus
 * @access Public
 *
 * @description
 * Awards waitlist bonus points (25 points) for linking a wallet address. One-time
 * bonus per user. Returns whether bonus was awarded or already claimed.
 *
 * @example
 * ```typescript
 * await fetch('/api/waitlist/bonus/wallet', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     userId: 'user-id',
 *     walletAddress: '0x...'
 *   })
 * });
 * ```
 *
 * @see {@link /lib/services/waitlist-service} Waitlist service
 */

import {
  authenticate,
  successResponse,
  WaitlistService,
  withErrorHandling,
} from '@babylon/api';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const WalletBonusSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);
  const userId = authUser.userId;

  const body = await request.json();
  const { walletAddress } = WalletBonusSchema.parse(body);

  logger.info(
    'Wallet bonus request',
    { userId, walletAddress },
    'POST /api/waitlist/bonus/wallet'
  );

  const awarded = await WaitlistService.awardWalletBonus(userId, walletAddress);

  return successResponse({
    awarded,
    bonusAmount: awarded ? 25 : 0,
    message: awarded
      ? 'Wallet bonus awarded'
      : 'Wallet bonus already awarded or user not found',
  });
});
