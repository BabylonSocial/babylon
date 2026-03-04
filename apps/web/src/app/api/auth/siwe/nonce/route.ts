/**
 * SIWE Nonce Endpoint
 *
 * @route GET /api/auth/siwe/nonce
 * @access Public (rate limited)
 *
 * @description
 * Generates a time-limited nonce for SIWE (Sign-In With Ethereum) authentication.
 * The nonce is single-use and expires after 5 minutes.
 *
 * @example
 * ```bash
 * curl https://babylon.market/api/auth/siwe/nonce
 * ```
 */

import {
  checkRateLimitAsync,
  generateNonce,
  getClientIp,
  RATE_LIMIT_CONFIGS,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { logger } from '@babylon/shared';
import { type NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Rate limit by IP
  const clientIp = getClientIp(request.headers) || 'unknown';
  const rateLimitResult = await checkRateLimitAsync(
    clientIp,
    RATE_LIMIT_CONFIGS.SIWE_NONCE
  );

  if (!rateLimitResult.allowed) {
    logger.warn(
      'SIWE nonce rate limit exceeded',
      { ip: clientIp.slice(0, 10) + '...' },
      'SIWE'
    );
    const retryAfterSeconds = Math.max(1, rateLimitResult.retryAfter ?? 60);
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  const nonceResponse = await generateNonce();

  return successResponse({
    nonce: nonceResponse.nonce,
    issuedAt: nonceResponse.issuedAt.toISOString(),
    expiresAt: nonceResponse.expiresAt.toISOString(),
    domain: nonceResponse.domain,
  });
});
