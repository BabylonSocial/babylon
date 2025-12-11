/**
 * Message Service
 *
 * Business logic for message operations including sending and listing messages.
 */

import type { RedisClient } from 'bun';
import { and, desc, eq, gt, lt, sql } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';
import type { Database } from '../db/db';
import {
  chatParticipantsTable,
  chatsTable,
  groupChatMembershipsTable,
  messagesTable,
} from '../db/schema/chat.db';
import type { ChatId, MessageId, UserId } from '../db/typeid';
import { typeIdGenerator } from '../db/typeid';
import type { Logger } from '../logger';
import { createCursor, parseCursor } from '../utils';
import type { MessageServiceError } from './errors';

export type MessageServiceDeps = {
  db: Database;
  logger: Logger;
  redis: RedisClient;
};

export type Message = {
  id: MessageId;
  chatId: ChatId;
  senderId: UserId;
  content: string;
  createdAt: Date;
};

export type MessageListResult = {
  messages: Message[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

export type SendMessageResult = {
  message: Message;
  chat: {
    id: ChatId;
    name: string | null;
    isGroup: boolean;
  };
};

export type MessageService = ReturnType<typeof createMessageService>;

export function createMessageService(deps: MessageServiceDeps) {
  const { db, logger, redis } = deps;

  /**
   * Publish a message to Redis for real-time SSE delivery
   */
  async function publishToRedis(
    chatId: ChatId,
    message: Message
  ): Promise<void> {
    try {
      const channel = `chat:${chatId}`;
      const payload = JSON.stringify({
        type: 'message',
        data: {
          id: message.id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        },
      });
      await redis.publish(channel, payload);
    } catch (error) {
      logger.error({
        msg: 'Failed to publish message to Redis',
        error,
        chatId,
      });
    }
  }

  /**
   * Verify user has access to a chat
   */
  async function verifyAccess(
    userId: UserId,
    chatId: ChatId
  ): Promise<Result<{ isGroup: boolean }, MessageServiceError>> {
    try {
      // Check chat exists
      const [chat] = await db
        .select({ isGroup: chatsTable.isGroup })
        .from(chatsTable)
        .where(eq(chatsTable.id, chatId))
        .limit(1);

      if (!chat) {
        return err({
          type: 'CHAT_NOT_FOUND',
          message: 'Chat not found',
        });
      }

      if (chat.isGroup) {
        // Check group membership
        const [membership] = await db
          .select({ id: groupChatMembershipsTable.id })
          .from(groupChatMembershipsTable)
          .where(
            and(
              eq(groupChatMembershipsTable.chatId, chatId),
              eq(groupChatMembershipsTable.userId, userId),
              eq(groupChatMembershipsTable.isActive, true)
            )
          )
          .limit(1);

        if (!membership) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Access denied to chat',
          });
        }
      } else {
        // Check DM participation
        const [participant] = await db
          .select({ id: chatParticipantsTable.id })
          .from(chatParticipantsTable)
          .where(
            and(
              eq(chatParticipantsTable.chatId, chatId),
              eq(chatParticipantsTable.userId, userId)
            )
          )
          .limit(1);

        if (!participant) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Access denied to chat',
          });
        }
      }

      return ok({ isGroup: chat.isGroup });
    } catch (error) {
      logger.error({ msg: 'Error verifying access', error, userId, chatId });
      return err({
        type: 'CHAT_NOT_FOUND',
        message: 'Failed to verify access',
        cause: error,
      });
    }
  }

  return {
    /**
     * Verify user has access to a chat (exposed for SSE subscription)
     */
    verifyAccess,

    /**
     * Get new messages since a given message ID (for SSE polling)
     */
    async getNewMessages(
      userId: UserId,
      chatId: ChatId,
      sinceMessageId?: string
    ): Promise<Result<Message[], MessageServiceError>> {
      try {
        // Build query - get messages after sinceMessageId if provided
        let query = db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.chatId, chatId))
          .orderBy(messagesTable.createdAt)
          .limit(50);

        if (sinceMessageId) {
          // Get the timestamp of the reference message
          const [refMessage] = await db
            .select({ createdAt: messagesTable.createdAt })
            .from(messagesTable)
            .where(eq(messagesTable.id, sinceMessageId as MessageId))
            .limit(1);

          if (refMessage) {
            query = db
              .select()
              .from(messagesTable)
              .where(
                and(
                  eq(messagesTable.chatId, chatId),
                  sql`${messagesTable.createdAt} > ${refMessage.createdAt}`
                )
              )
              .orderBy(messagesTable.createdAt)
              .limit(50);
          }
        }

        const messageList = await query;

        const formattedMessages: Message[] = messageList.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt,
        }));

        return ok(formattedMessages);
      } catch (error) {
        logger.error({
          msg: 'Error getting new messages',
          error,
          userId,
          chatId,
          sinceMessageId,
        });
        return err({
          type: 'LIST_MESSAGES_ERROR',
          message: 'Failed to get new messages',
          cause: error,
        });
      }
    },

    /**
     * List messages in a chat with cursor pagination
     * Supports sinceMessageId for client cache synchronization
     */
    async listMessages(
      userId: UserId,
      chatId: ChatId,
      options: { cursor?: string; limit?: number; sinceMessageId?: string } = {}
    ): Promise<Result<MessageListResult, MessageServiceError>> {
      const { cursor, limit = 50, sinceMessageId } = options;
      const cursorDate = parseCursor(cursor);

      logger.debug({
        msg: 'Listing messages',
        userId,
        chatId,
        cursor,
        limit,
        sinceMessageId,
      });

      // Verify user has access to chat
      const accessResult = await verifyAccess(userId, chatId);
      if (accessResult.isErr()) {
        return err(accessResult.error);
      }

      try {
        // If sinceMessageId provided, fetch only newer messages (for cache sync)
        if (sinceMessageId) {
          // Get the reference message timestamp
          const [refMessage] = await db
            .select({ createdAt: messagesTable.createdAt })
            .from(messagesTable)
            .where(eq(messagesTable.id, sinceMessageId as MessageId))
            .limit(1);

          if (refMessage) {
            const messageList = await db
              .select()
              .from(messagesTable)
              .where(
                and(
                  eq(messagesTable.chatId, chatId),
                  gt(messagesTable.createdAt, refMessage.createdAt)
                )
              )
              .orderBy(messagesTable.createdAt) // ASC for since queries
              .limit(limit);

            const formattedMessages: Message[] = messageList.map((m) => ({
              id: m.id,
              chatId: m.chatId,
              senderId: m.senderId,
              content: m.content,
              createdAt: m.createdAt,
            }));

            return ok({
              messages: formattedMessages,
              pagination: {
                hasMore: messageList.length === limit,
                nextCursor: null, // No cursor for since queries
              },
            });
          }
        }

        // Standard cursor pagination (newest first)
        const whereClause = cursorDate
          ? and(
              eq(messagesTable.chatId, chatId),
              lt(messagesTable.createdAt, cursorDate)
            )
          : eq(messagesTable.chatId, chatId);

        const messageList = await db
          .select()
          .from(messagesTable)
          .where(whereClause)
          .orderBy(desc(messagesTable.createdAt))
          .limit(limit + 1); // +1 to check if there are more

        // Check if there are more messages
        const hasMore = messageList.length > limit;
        const resultMessages = hasMore
          ? messageList.slice(0, limit)
          : messageList;

        // Format messages
        const formattedMessages: Message[] = resultMessages.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt,
        }));

        // Generate next cursor
        const lastMessage = resultMessages[resultMessages.length - 1];
        const nextCursor =
          hasMore && lastMessage ? createCursor(lastMessage.createdAt) : null;

        return ok({
          messages: formattedMessages,
          pagination: {
            hasMore,
            nextCursor,
          },
        });
      } catch (error) {
        logger.error({ msg: 'Error listing messages', error, userId, chatId });
        return err({
          type: 'LIST_MESSAGES_ERROR',
          message: 'Failed to list messages',
          cause: error,
        });
      }
    },

    /**
     * Send a message to a chat
     */
    async sendMessage(
      userId: UserId,
      chatId: ChatId,
      content: string
    ): Promise<Result<SendMessageResult, MessageServiceError>> {
      logger.debug({
        msg: 'Sending message',
        userId,
        chatId,
        contentLength: content.length,
      });

      // Verify access
      const accessResult = await verifyAccess(userId, chatId);
      if (accessResult.isErr()) {
        return err(accessResult.error);
      }

      try {
        // Get chat details
        const [chat] = await db
          .select()
          .from(chatsTable)
          .where(eq(chatsTable.id, chatId))
          .limit(1);

        if (!chat) {
          return err({
            type: 'CHAT_NOT_FOUND',
            message: 'Chat not found',
          });
        }

        // Create message
        const messageId = typeIdGenerator('message');

        const [newMessage] = await db
          .insert(messagesTable)
          .values({
            id: messageId,
            chatId,
            senderId: userId,
            content,
          })
          .returning();

        if (!newMessage) {
          return err({
            type: 'SEND_FAILED',
            message: 'Failed to send message',
          });
        }

        // Update chat timestamp
        await db
          .update(chatsTable)
          .set({ updatedAt: new Date() })
          .where(eq(chatsTable.id, chatId));

        // Update participant stats
        if (chat.isGroup) {
          await db
            .update(groupChatMembershipsTable)
            .set({
              lastMessageAt: new Date(),
              messageCount: sql`${groupChatMembershipsTable.messageCount} + 1`,
            })
            .where(
              and(
                eq(groupChatMembershipsTable.chatId, chatId),
                eq(groupChatMembershipsTable.userId, userId)
              )
            );
        } else {
          await db
            .update(chatParticipantsTable)
            .set({
              lastMessageAt: new Date(),
              messageCount: sql`${chatParticipantsTable.messageCount} + 1`,
            })
            .where(
              and(
                eq(chatParticipantsTable.chatId, chatId),
                eq(chatParticipantsTable.userId, userId)
              )
            );
        }

        const message: Message = {
          id: newMessage.id,
          chatId: newMessage.chatId,
          senderId: newMessage.senderId,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
        };

        // Publish to Redis for real-time SSE delivery
        // Fire-and-forget: don't block on Redis, message is already in DB
        publishToRedis(chatId, message);

        return ok({
          message,
          chat: {
            id: chat.id,
            name: chat.name,
            isGroup: chat.isGroup,
          },
        });
      } catch (error) {
        logger.error({ msg: 'Error sending message', error, userId, chatId });
        return err({
          type: 'SEND_FAILED',
          message: 'Failed to send message',
          cause: error,
        });
      }
    },
  };
}
