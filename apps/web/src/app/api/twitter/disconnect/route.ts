/**
 * Twitter Disconnect API
 *
 * @route POST /api/twitter/disconnect - Disconnect Twitter account
 * @access Authenticated
 *
 * @description
 * Disconnects user's Twitter account by removing OAuth 2.0 credentials from
 * user profile. Clears all Twitter-related fields.
 *
 * @example
 * ```typescript
 * await fetch('/api/twitter/disconnect', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * ```
 */

import { authenticate, requireUserByIdentifier } from '@babylon/api';
import { db } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authUser = await authenticate(request);
  const user = await requireUserByIdentifier(authUser.userId, { id: true });

  // Clear Twitter OAuth 2.0 credentials from user
  await db.user.update({
    where: { id: user.id },
    data: {
      twitterAccessToken: null,
      twitterRefreshToken: null,
      twitterTokenExpiresAt: null,
      twitterId: null,
      twitterUsername: null,
      twitterVerifiedAt: null,
      hasTwitter: false,
    },
  });

  logger.info(
    'Twitter account disconnected',
    { userId: user.id },
    'TwitterDisconnect'
  );

  return NextResponse.json({ success: true });
}
