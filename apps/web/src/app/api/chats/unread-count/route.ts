/**
 * Chat Unread Count API
 *
 * @route GET /api/chats/unread-count - Get unread message counts
 * @access Authenticated
 *
 * @description
 * Lightweight endpoint for polling unread message counts. Returns pending DM
 * requests and new message indicators. Optimized for frequent polling.
 *
 * @example
 * ```typescript
 * // Poll for unread counts
 * const response = await fetch('/api/chats/unread-count', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * const { pendingDMs, hasNewMessages } = await response.json();
 * ```
 *
 * @see {@link /lib/db/context} RLS context
 */

import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { asUser } from '@babylon/db';
import type { NextRequest } from 'next/server';

/**
 * GET /api/chats/unread-count
 * Get counts of pending DMs and unread messages
 *
 * Returns:
 * - pendingDMs: Number of DM requests from anons awaiting acceptance
 * - hasNewMessages: Boolean indicating if there are any new messages
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  const counts = await asUser(user, async (db) => {
    let pendingDMCount = 0;
    pendingDMCount = await db.dmAcceptance.count({
      where: {
        userId: user.userId,
        status: 'pending',
      },
    });

    const chatsWithParticipation = await db.chatParticipant.findMany({
      where: {
        userId: user.userId,
      },
      select: {
        chatId: true,
      },
    });

    const chatIds = chatsWithParticipation.map((cp) => cp.chatId);

    let recentMessageCount = 0;
    if (chatIds.length > 0) {
      recentMessageCount = await db.message.count({
        where: {
          chatId: {
            in: chatIds,
          },
          senderId: {
            not: user.userId,
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
    }

    return {
      pendingDMs: pendingDMCount,
      hasNewMessages: recentMessageCount > 0,
    };
  });

  return successResponse(counts);
});
