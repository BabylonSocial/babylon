/**
 * API Route: /api/chats/[id]
 * Methods: GET (get chat details and messages)
 *
 * @deprecated Use Chat API service instead (apps/chat-api)
 * Frontend should migrate to using the oRPC client from @/lib/chat-api-client.ts
 *
 * @openapi
 * /api/chats/{id}:
 *   get:
 *     tags:
 *       - Chats
 *     summary: Get chat details and messages
 *     description: Returns chat details with paginated messages. Supports cursor-based pagination.
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (message ID)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: Chat details with messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   type: object
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 */

import {
  AuthorizationError,
  authenticate,
  NotFoundError,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import {
  and,
  asSystem,
  asUser,
  chatParticipants,
  chats,
  desc,
  eq,
  inArray,
  lt,
  messages,
  users,
} from '@babylon/db';
import { StaticDataRegistry } from '@babylon/engine';
import { ChatQuerySchema, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * GET /api/chats/[id]
 * Get chat details and messages
 */
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: chatId } = await context.params;

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const query: Record<string, string> = {};

    const all = searchParams.get('all');
    const debug = searchParams.get('debug');
    const cursor = searchParams.get('cursor'); // Cursor for pagination (message ID)
    const limitParam = searchParams.get('limit');

    if (all) query.all = all;
    if (debug) query.debug = debug;

    const validatedQuery = ChatQuerySchema.parse(query);

    // Parse pagination parameters
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
    const effectiveLimit = Math.min(Math.max(limit, 1), 100); // Between 1 and 100

    // Check for debug mode (localhost access to game chats)
    const debugMode = validatedQuery.debug === 'true';

    logger.info(
      'GET /api/chats/[id]',
      {
        chatId,
        cursor,
        limit: effectiveLimit,
        debugMode,
      },
      'GET /api/chats/[id]'
    );

    // Get chat first to check if it's a game chat
    const [chat] = await asSystem(async (db) => {
      return await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    }, 'get-chat-by-id');

    if (!chat) {
      throw new NotFoundError('Chat', chatId);
    }

    // Allow debug access to game chats without auth
    const isGameChat = chat.isGroup && chat.gameId === 'continuous';
    let userId: string | undefined;
    let authUser: Awaited<ReturnType<typeof authenticate>> | null = null;

    if (isGameChat && debugMode) {
      // Debug mode: skip authentication for game chats
      logger.info(
        `Debug mode access to game chat: ${chatId}`,
        undefined,
        'GET /api/chats/[id]'
      );
    } else {
      // Normal mode: require authentication and membership
      authUser = await authenticate(request);
      userId = authUser.userId;

      const [isMember] = await asUser(authUser, async (db) => {
        return await db
          .select()
          .from(chatParticipants)
          .where(
            and(
              eq(chatParticipants.chatId, chatId),
              eq(chatParticipants.userId, authUser!.userId)
            )
          )
          .limit(1);
      });

      if (!isMember) {
        throw new AuthorizationError(
          'You do not have access to this chat',
          'chat',
          'read'
        );
      }
    }

    // Get chat with messages
    const fetchChatData = async (
      db: Parameters<Parameters<typeof asSystem>[0]>[0]
    ) => {
      // Get chat participants
      const participantsList = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.chatId, chatId));

      // Build message query with cursor-based pagination
      let messagesList;
      if (cursor) {
        // Get the cursor message to find its createdAt
        const [cursorMessage] = await db
          .select({ createdAt: messages.createdAt })
          .from(messages)
          .where(eq(messages.id, cursor))
          .limit(1);

        if (cursorMessage) {
          messagesList = await db
            .select()
            .from(messages)
            .where(
              and(
                eq(messages.chatId, chatId),
                lt(messages.createdAt, cursorMessage.createdAt)
              )
            )
            .orderBy(desc(messages.createdAt))
            .limit(effectiveLimit + 1);
        } else {
          messagesList = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(desc(messages.createdAt))
            .limit(effectiveLimit + 1);
        }
      } else {
        messagesList = await db
          .select()
          .from(messages)
          .where(eq(messages.chatId, chatId))
          .orderBy(desc(messages.createdAt))
          .limit(effectiveLimit + 1);
      }

      return { chat, participants: participantsList, messages: messagesList };
    };

    const fullChat = authUser
      ? await asUser(authUser, fetchChatData)
      : await asSystem(fetchChatData, 'get-chat-with-messages-debug');

    // Get participant details
    const fetchParticipantDetails = async (
      db: Parameters<Parameters<typeof asSystem>[0]>[0]
    ) => {
      const participantUserIds = fullChat.participants.map((p) => p.userId);
      const senderIds = [...new Set(fullChat.messages.map((m) => m.senderId))];

      const usersList =
        participantUserIds.length > 0
          ? await db
              .select({
                id: users.id,
                displayName: users.displayName,
                username: users.username,
                profileImageUrl: users.profileImageUrl,
              })
              .from(users)
              .where(inArray(users.id, participantUserIds))
          : [];

      const actorsList = (senderIds as string[])
        .map((id) => StaticDataRegistry.getActor(id))
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => ({
          id: a.id,
          name: a.name,
          profileImageUrl: a.profileImageUrl,
        }));

      return { users: usersList, actors: actorsList };
    };

    const { users: usersList, actors: actorsList } = authUser
      ? await asUser(authUser, fetchParticipantDetails)
      : await asSystem(fetchParticipantDetails, 'get-chat-participants-debug');

    const usersMap = new Map(usersList.map((u) => [u.id, u]));
    const actorsMap = new Map(actorsList.map((a) => [a.id, a]));

    // Get unique sender IDs from messages (for debug mode)
    const senderIds = [...new Set(fullChat.messages.map((m) => m.senderId))];

    // Build participants list from ChatParticipants or message senders (for debug mode)
    const participantsInfo =
      fullChat.participants.length > 0
        ? fullChat.participants.map((p) => {
            const user = usersMap.get(p.userId);
            const actor = actorsMap.get(p.userId);
            return {
              id: p.userId,
              displayName: user?.displayName || actor?.name || 'Unknown',
              username: user?.username,
              profileImageUrl: user?.profileImageUrl || actor?.profileImageUrl,
            };
          })
        : // In debug mode with no participants, use actors from messages
          (senderIds as string[]).map((senderId: string) => {
            const actor = actorsMap.get(senderId);
            const user = usersMap.get(senderId);
            return {
              id: senderId,
              displayName: actor?.name || user?.displayName || 'Unknown',
              username: user?.username,
              profileImageUrl: actor?.profileImageUrl || user?.profileImageUrl,
            };
          });

    // For DMs, get the other participant's name and details
    let displayName = chat.name;
    let otherUser: {
      id: string;
      displayName: string | null;
      username: string | null;
      profileImageUrl: string | null;
    } | null = null;
    if (!chat.isGroup && !chat.name && userId) {
      const otherParticipant = fullChat.participants.find(
        (p) => p.userId !== userId
      );
      if (otherParticipant) {
        const otherUserData = usersMap.get(otherParticipant.userId);
        if (otherUserData) {
          displayName =
            otherUserData.displayName || otherUserData.username || 'Unknown';
          otherUser = {
            id: otherParticipant.userId,
            displayName: otherUserData.displayName,
            username: otherUserData.username,
            profileImageUrl: otherUserData.profileImageUrl,
          };
        }
      }
    }

    // Check if there are more messages
    const hasMore = fullChat.messages.length > effectiveLimit;
    const messagesList = hasMore
      ? fullChat.messages.slice(0, effectiveLimit)
      : fullChat.messages;

    // Reverse to get chronological order (oldest first)
    const messagesInOrder = [...messagesList].reverse();

    // Get the cursor for the next page (oldest message ID in this batch)
    const nextCursor = hasMore
      ? fullChat.messages[effectiveLimit - 1]?.id
      : null;

    logger.info(
      'Chat fetched successfully',
      {
        chatId,
        isGameChat,
        isDM: !chat.isGroup,
        debugMode,
        messagesReturned: messagesList.length,
        hasMore,
        nextCursor,
      },
      'GET /api/chats/[id]'
    );

    return successResponse({
      chat: {
        id: chat.id,
        name: displayName || chat.name,
        isGroup: chat.isGroup,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        otherUser: otherUser,
      },
      messages: messagesInOrder.map((msg) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
      })),
      participants: participantsInfo,
      pagination: {
        hasMore,
        nextCursor,
        limit: effectiveLimit,
      },
    });
  }
);
