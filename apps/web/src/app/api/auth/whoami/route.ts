/**
 * API Key User Info Endpoint
 *
 * @route GET /api/auth/whoami
 * @access Requires API Key (X-Babylon-Api-Key header)
 *
 * @description
 * Returns the authenticated user's ID based on their API key.
 * Used by external agents/clients to discover their user ID for A2A requests.
 *
 * @example
 * ```bash
 * curl -H "X-Babylon-Api-Key: YOUR_API_KEY_HERE" https://babylon.market/api/auth/whoami
 * ```
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/whoami', {
 *   headers: { 'X-Babylon-Api-Key': apiKey }
 * });
 * const { userId } = await response.json();
 * // Use userId as contextId in A2A requests
 * ```
 */

import { validateUserApiKey } from '@babylon/api';
import { db, eq, users } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-babylon-api-key');

  // Headers for auth responses - prevent caching of sensitive identity data
  const noCacheHeaders = { 'Cache-Control': 'no-store' };

  if (!apiKey) {
    return NextResponse.json(
      { error: 'X-Babylon-Api-Key header is required' },
      { status: 401, headers: noCacheHeaders }
    );
  }

  // Validate API key and get user ID
  const result = await validateUserApiKey(apiKey);

  if (!result) {
    return NextResponse.json(
      { error: 'Invalid or expired API key' },
      { status: 401, headers: noCacheHeaders }
    );
  }

  // Fetch user details (minimal: only id and username for debugging)
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
    })
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);

  if (!user) {
    logger.warn(
      'API key valid but user not found',
      { userId: result.userId },
      'whoami'
    );
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404, headers: noCacheHeaders }
    );
  }

  logger.debug('Whoami request', { userId: user.id }, 'whoami');

  return NextResponse.json(
    { userId: user.id, username: user.username },
    { headers: noCacheHeaders }
  );
}
