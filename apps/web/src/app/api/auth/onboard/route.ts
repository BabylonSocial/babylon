/**
 * On-Chain Registration API
 *
 * @route GET /api/auth/onboard - Get registration status
 * @route POST /api/auth/onboard - Register on-chain
 * @access Authenticated
 *
 * @description
 * Handles on-chain user registration and status checking. GET returns current
 * registration status. POST processes on-chain registration with NFT minting
 * and metadata storage. Legacy endpoint that delegates to shared onboarding service.
 *
 * @openapi
 * /api/auth/onboard:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get on-chain registration status
 *     description: Returns current on-chain registration status for authenticated user
 *     security:
 *       - PrivyAuth: []
 *     responses:
 *       200:
 *         description: Registration status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registered:
 *                   type: boolean
 *                 tokenId:
 *                   type: string
 *                   nullable: true
 *                 walletAddress:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register on-chain
 *     description: Processes on-chain registration with NFT minting
 *     security:
 *       - PrivyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - username
 *               - displayName
 *             properties:
 *               walletAddress:
 *                 type: string
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImageUrl:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               referralCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokenId:
 *                   type: string
 *                 alreadyRegistered:
 *                   type: boolean
 *                 txHash:
 *                   type: string
 *       400:
 *         description: Invalid input or already registered
 *       401:
 *         description: Unauthorized
 *
 * @example
 * ```typescript
 * // Check status
 * const status = await fetch('/api/auth/onboard', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 *
 * // Register
 * await fetch('/api/auth/onboard', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     walletAddress: '0x...',
 *     username: 'alice',
 *     displayName: 'Alice'
 *   })
 * });
 * ```
 *
 * @see {@link /lib/onboarding/onchain-service} On-chain service
 */

import type { NextRequest } from 'next/server';
import { authenticate } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import {
  getOnchainRegistrationStatus,
  processOnchainRegistration,
} from '@babylon/api';
import { trackServerEvent } from '@/lib/posthog/server';
import { OnChainRegistrationSchema } from '@babylon/shared';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);
  const status = await getOnchainRegistrationStatus(user);
  return successResponse(status);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);
  const body = await request.json();
  const payload = OnChainRegistrationSchema.parse(body);

  const result = await processOnchainRegistration({
    user,
    walletAddress: payload.walletAddress,
    username: payload.username,
    displayName: payload.displayName,
    bio: payload.bio,
    profileImageUrl: payload.profileImageUrl,
    coverImageUrl: payload.coverImageUrl,
    endpoint: payload.endpoint,
    referralCode: payload.referralCode,
  });

  logger.info(
    'On-chain registration completed',
    {
      userId: user.userId,
      tokenId: result.tokenId,
      alreadyRegistered: result.alreadyRegistered,
      isAgent: user.isAgent,
    },
    'POST /api/auth/onboard'
  );

  // Track onchain registration event
  trackServerEvent(user.userId, 'onchain_registration_completed', {
    ...(payload.username && { username: payload.username }),
    ...(result.tokenId !== undefined && { tokenId: result.tokenId }),
    wasAlreadyRegistered: result.alreadyRegistered ?? false,
    isAgent: user.isAgent ?? false,
    hadReferral: Boolean(payload.referralCode),
  }).catch((error) => {
    logger.warn('Failed to track onchain_registration_completed event', {
      error,
    });
  });

  return successResponse(result);
});
