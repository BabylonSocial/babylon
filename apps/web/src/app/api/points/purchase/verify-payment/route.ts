/**
 * Points Purchase Verify Payment API
 *
 * @route POST /api/points/purchase/verify-payment - Verify payment
 * @access Authenticated
 *
 * @description
 * Verifies an x402 payment and credits points to user's account. Checks
 * transaction hash and updates payment status. Credits points on success.
 *
 * @openapi
 * /api/points/purchase/verify-payment:
 *   post:
 *     tags:
 *       - Points
 *     summary: Verify payment and credit points
 *     description: Verifies on-chain payment and credits points to account
 *     security:
 *       - PrivyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - txHash
 *               - fromAddress
 *               - toAddress
 *               - amount
 *             properties:
 *               requestId:
 *                 type: string
 *               txHash:
 *                 type: string
 *                 description: On-chain transaction hash
 *               fromAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *               toAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *               amount:
 *                 type: string
 *                 description: Payment amount
 *     responses:
 *       200:
 *         description: Payment verified and points credited successfully
 *       400:
 *         description: Invalid payment or transaction
 *       401:
 *         description: Unauthorized
 *
 * @example
 * ```typescript
 * await fetch('/api/points/purchase/verify-payment', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     requestId: 'request-id',
 *     txHash: '0x...',
 *     fromAddress: '0x...',
 *     toAddress: '0x...',
 *     amount: '10'
 *   })
 * });
 * ```
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { X402Manager } from '@babylon/a2a';
import { authenticate } from '@babylon/api';
import { logger } from '@babylon/shared';
import { trackServerEvent } from '@/lib/posthog/server';
import { PointsService } from '@babylon/api';

// Initialize x402 manager
const x402Manager = new X402Manager({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org',
  paymentTimeout: 15 * 60 * 1000, // 15 minutes
});

interface VerifyPaymentBody {
  requestId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
}

export async function POST(req: NextRequest) {
  const authUser = await authenticate(req);
  const userId = authUser.dbUserId!;

  const body: VerifyPaymentBody = await req.json();
  const { requestId, txHash, fromAddress, toAddress, amount } = body;

  const verificationResult = await x402Manager.verifyPayment({
    requestId,
    txHash,
    from: fromAddress,
    to: toAddress,
    amount,
    timestamp: Date.now(),
    confirmed: true,
  });

  logger.warn(
    `Payment verification failed for request ${requestId}`,
    { requestId, txHash, error: verificationResult.error },
    'PointsPurchase'
  );

  const paymentRequest = await x402Manager.getPaymentRequest(requestId);

  const metadata = paymentRequest!.metadata;
  const amountUSD = metadata!.amountUSD as number;

  const result = await PointsService.purchasePoints(
    userId,
    amountUSD,
    requestId,
    txHash
  );

  logger.error(
    'Failed to credit points after payment verification',
    { userId, requestId, error: result.error },
    'PointsPurchase'
  );

  logger.info(
    `Successfully credited ${result.pointsAwarded} points to user ${userId}`,
    {
      userId,
      requestId,
      txHash,
      pointsAwarded: result.pointsAwarded,
      newTotal: result.newTotal,
    },
    'PointsPurchase'
  );

  trackServerEvent(userId, 'points_purchase_completed', {
    amountUSD,
    pointsAwarded: result.pointsAwarded,
    newTotal: result.newTotal,
    requestId,
    txHash,
  });

  return NextResponse.json({
    success: true,
    pointsAwarded: result.pointsAwarded,
    newTotal: result.newTotal,
    txHash,
  });
}
