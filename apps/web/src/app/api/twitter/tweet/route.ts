/**
 * Twitter Tweet API
 *
 * @route POST /api/twitter/tweet - Post tweet
 * @access Authenticated
 *
 * @description
 * Posts a tweet to Twitter/X using OAuth 2.0. Requires user to have connected
 * their Twitter account. Supports optional content type and content ID for tracking.
 *
 * @example
 * ```typescript
 * await fetch('/api/twitter/tweet', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     text: 'Check out this market!',
 *     contentType: 'market',
 *     contentId: 'market-id'
 *   })
 * });
 * ```
 */

import { authenticate, requireUserByIdentifier } from '@babylon/api';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authUser = await authenticate(request);
  const user = await requireUserByIdentifier(authUser.userId, {
    id: true,
    username: true,
    twitterAccessToken: true,
    twitterUsername: true,
  });

  if (!user.twitterAccessToken) {
    return NextResponse.json(
      {
        error:
          'Twitter account not connected. Please connect your X account first.',
      },
      { status: 401 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { text, contentType, contentId } = body as {
    text: string;
    contentType?: 'market' | 'profile' | 'referral';
    contentId?: string;
  };

  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Missing tweet text' }, { status: 400 });
  }

  logger.info(
    'Posting tweet via OAuth 2.0',
    {
      userId: user.id,
      textLength: text.length,
    },
    'TwitterPost'
  );

  // Create tweet payload
  const tweetPayload = { text };

  // Post the tweet using OAuth 2.0 Bearer token
  const tweetResponse = await fetch('https://api.twitter.com/2/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.twitterAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetPayload),
  });

  if (!tweetResponse.ok) {
    const errorText = await tweetResponse.text();
    logger.error(
      'Tweet creation failed',
      { error: errorText, status: tweetResponse.status },
      'TwitterPost'
    );
    return NextResponse.json(
      { error: 'Failed to post tweet', details: errorText },
      { status: tweetResponse.status }
    );
  }

  const responseData = (await tweetResponse.json()) as {
    data?: { id: string; text: string };
  };

  logger.info(
    'Tweet posted successfully via OAuth 2.0',
    { userId: user.id, tweetId: responseData.data?.id },
    'TwitterPost'
  );

  // Track the share if contentType provided
  if (contentType && responseData.data?.id) {
    const token = request.headers.get('authorization')!.replace('Bearer ', '');
    const tweetUrl = `https://x.com/${user.twitterUsername}/status/${responseData.data.id}`;

    const shareResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/users/${user.id}/share`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'twitter',
          contentType,
          contentId,
          url: tweetUrl,
        }),
      }
    );

    if (!shareResponse.ok) {
      logger.warn(
        'Failed to track share',
        { status: shareResponse.status },
        'TwitterPost'
      );
    }
  }

  return NextResponse.json({
    success: true,
    tweet: responseData,
    tweetUrl: `https://x.com/${user.twitterUsername || 'i'}/status/${responseData.data?.id}`,
  });
}
