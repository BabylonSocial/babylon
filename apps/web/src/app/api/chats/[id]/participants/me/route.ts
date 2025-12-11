/**
 * Chat Leave API
 *
 * @deprecated Use Chat API service instead (apps/chat-api)
 * Frontend should migrate to using the oRPC client from @/lib/chat-api-client.ts
 *
 * @route DELETE /api/chats/[id]/participants/me - Leave chat
 * @access Authenticated
 *
 * @description
 * Allows the authenticated user to leave a chat. Removes user from chat
 * participants. User must be a participant.
 *
 * @openapi
 * /api/chats/{id}/participants/me:
 *   delete:
 *     tags:
 *       - Chats
 *     summary: Leave chat
 *     description: Removes authenticated user from chat participants
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Left chat successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a participant
 *       404:
 *         description: Chat not found
 *
 * @example
 * ```typescript
 * await fetch(`/api/chats/${chatId}/participants/me`, {
 *   method: 'DELETE',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * ```
 */

import {
  authenticate,
  errorResponse,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { asUser } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
export const DELETE = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: chatId } = await context.params;
    const user = await authenticate(request);

    await asUser(user, async (db) => {
      // First, check if the user is actually a participant (compound key lookup)
      const participant = await db.chatParticipant.findFirst({
        where: {
          chatId,
          userId: user.userId,
        },
      });

      if (!participant) {
        throw errorResponse(
          'You are not a member of this chat.',
          'NOT_FOUND',
          404
        );
      }

      // For NPC-run chats, we mark the membership as inactive to preserve history
      const groupMembership = await db.groupChatMembership.findFirst({
        where: {
          AND: [
            { userId: { equals: user.userId } },
            { chatId: { equals: chatId } },
          ],
        },
      });

      if (groupMembership) {
        await db.groupChatMembership.update({
          where: {
            id: groupMembership.id,
          },
          data: {
            isActive: false,
            removedAt: new Date(),
            sweepReason: 'User left',
          },
        });
      }

      // For all chats (NPC or user-created), we remove the participant record
      await db.chatParticipant.delete({
        where: {
          id: participant.id,
        },
      });
    });

    logger.info(
      'User left chat successfully',
      { chatId, userId: user.userId },
      'DELETE /api/chats/[id]/participants/me'
    );

    return successResponse({ message: 'You have left the chat.' }, 200);
  }
);
