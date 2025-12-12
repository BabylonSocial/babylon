import { and, count, desc, eq, gt, inArray, ne } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';
import type { Database } from '../db/db';
import {
  chatParticipantsTable,
  chatsTable,
  dmAcceptancesTable,
  groupChatMembershipsTable,
  messagesTable,
} from '../db/schema/chat.db';
import type { ChatId, MessageId, UserId } from '../db/typeid';
import { typeIdGenerator } from '../db/typeid';
import type { Logger } from '../logger';
import type { ChatServiceError } from './errors';

export type ChatServiceDeps = {
  db: Database;
  logger: Logger;
};

export type ChatListItem = {
  id: ChatId;
  name: string | null;
  isGroup: boolean;
  lastMessage: {
    id: MessageId;
    content: string;
    senderId: UserId;
    createdAt: Date;
  } | null;
  messageCount: number;
  qualityScore?: number;
  lastMessageAt: Date | null;
  updatedAt: Date;
  otherUser?: {
    id: UserId;
    displayName: string | null;
    username: string | null;
    profileImageUrl: string | null;
  };
};

export type ChatDetails = {
  id: ChatId;
  name: string | null;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  participantIds: UserId[];
};

export type CreateChatInput = {
  name?: string;
  isGroup?: boolean;
  participantIds?: UserId[];
};

export type UnreadCountResult = {
  pendingDms: number;
  hasNewMessages: boolean;
};

export type ChatParticipant = {
  id: UserId;
  displayName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  joinedAt: Date;
  isActive: boolean;
};

export type ChatService = ReturnType<typeof createChatService>;

export function createChatService(deps: ChatServiceDeps) {
  const { db, logger } = deps;

  return {
    async listChats(
      userId: UserId
    ): Promise<
      Result<
        { groupChats: ChatListItem[]; directChats: ChatListItem[] },
        ChatServiceError
      >
    > {
      logger.debug({ msg: 'Listing chats', userId });

      try {
        const memberships = await db
          .select()
          .from(groupChatMembershipsTable)
          .where(
            and(
              eq(groupChatMembershipsTable.userId, userId),
              eq(groupChatMembershipsTable.isActive, true)
            )
          )
          .orderBy(desc(groupChatMembershipsTable.lastMessageAt));

        const groupChatIds = memberships.map((m) => m.chatId);
        const groupChatDetails =
          groupChatIds.length > 0
            ? await db
                .select()
                .from(chatsTable)
                .where(inArray(chatsTable.id, groupChatIds))
            : [];

        const groupChatMessages = await Promise.all(
          groupChatIds.map(async (chatId) => {
            const msgs = await db
              .select()
              .from(messagesTable)
              .where(eq(messagesTable.chatId, chatId))
              .orderBy(desc(messagesTable.createdAt))
              .limit(1);
            return { chatId, messages: msgs };
          })
        );

        const groupMessagesMap = new Map(
          groupChatMessages.map(({ chatId, messages: msgs }) => [chatId, msgs])
        );
        const chatDetailsMap = new Map(groupChatDetails.map((c) => [c.id, c]));

        const dmParticipantsList = await db
          .select()
          .from(chatParticipantsTable)
          .where(eq(chatParticipantsTable.userId, userId));

        const dmChatIds = dmParticipantsList.map((p) => p.chatId);
        const dmChatsDetails =
          dmChatIds.length > 0
            ? await db
                .select()
                .from(chatsTable)
                .where(
                  and(
                    inArray(chatsTable.id, dmChatIds),
                    eq(chatsTable.isGroup, false)
                  )
                )
            : [];

        const allParticipants =
          dmChatIds.length > 0
            ? await db
                .select()
                .from(chatParticipantsTable)
                .where(inArray(chatParticipantsTable.chatId, dmChatIds))
            : [];

        const participantsByChatId = new Map<ChatId, typeof allParticipants>();
        for (const p of allParticipants) {
          if (!participantsByChatId.has(p.chatId)) {
            participantsByChatId.set(p.chatId, []);
          }
          participantsByChatId.get(p.chatId)!.push(p);
        }

        const dmMessages = await Promise.all(
          dmChatIds.map(async (chatId) => {
            const msgs = await db
              .select()
              .from(messagesTable)
              .where(eq(messagesTable.chatId, chatId))
              .orderBy(desc(messagesTable.createdAt))
              .limit(1);
            return { chatId, messages: msgs };
          })
        );

        const dmMessagesMap = new Map(
          dmMessages.map(({ chatId, messages: msgs }) => [chatId, msgs])
        );

        const groupChats: ChatListItem[] = memberships
          .map((membership): ChatListItem | null => {
            const chat = chatDetailsMap.get(membership.chatId);
            if (!chat) return null;
            const lastMessage = groupMessagesMap.get(membership.chatId)?.[0];
            return {
              id: membership.chatId,
              name: chat.name,
              isGroup: true,
              lastMessage: lastMessage
                ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    senderId: lastMessage.senderId,
                    createdAt: lastMessage.createdAt,
                  }
                : null,
              messageCount: membership.messageCount,
              qualityScore: membership.qualityScore,
              lastMessageAt: membership.lastMessageAt,
              updatedAt: chat.updatedAt,
            };
          })
          .filter((c): c is ChatListItem => c !== null);

        const directChats: ChatListItem[] = dmChatsDetails.map((chat) => {
          const chatParticipantsList = participantsByChatId.get(chat.id) || [];
          const otherParticipant = chatParticipantsList.find(
            (p) => p.userId !== userId
          );
          const lastMessage = dmMessagesMap.get(chat.id)?.[0] || null;

          return {
            id: chat.id,
            name: chat.name,
            isGroup: false,
            lastMessage: lastMessage
              ? {
                  id: lastMessage.id,
                  content: lastMessage.content,
                  senderId: lastMessage.senderId,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            messageCount: chatParticipantsList.length,
            lastMessageAt: lastMessage?.createdAt || null,
            updatedAt: chat.updatedAt,
            otherUser: otherParticipant
              ? {
                  id: otherParticipant.userId,
                  displayName: null,
                  username: null,
                  profileImageUrl: null,
                }
              : undefined,
          };
        });

        return ok({ groupChats, directChats });
      } catch (error) {
        logger.error({ msg: 'Error listing chats', error, userId });
        return err({
          type: 'LIST_CHATS_ERROR',
          message: 'Failed to list chats',
          cause: error,
        });
      }
    },

    async getChatById(
      userId: UserId,
      chatId: ChatId
    ): Promise<Result<ChatDetails, ChatServiceError>> {
      logger.debug({ msg: 'Getting chat', userId, chatId });

      try {
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

        if (chat.isGroup) {
          const [membership] = await db
            .select()
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
          const [participant] = await db
            .select()
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

        const participantRecords = await db
          .select()
          .from(chatParticipantsTable)
          .where(eq(chatParticipantsTable.chatId, chatId));

        return ok({
          id: chat.id,
          name: chat.name,
          isGroup: chat.isGroup,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          participantIds: participantRecords.map((p) => p.userId),
        });
      } catch (error) {
        logger.error({ msg: 'Error getting chat', error, userId, chatId });
        return err({
          type: 'LIST_CHATS_ERROR',
          message: 'Failed to get chat',
          cause: error,
        });
      }
    },

    async createChat(
      userId: UserId,
      input: CreateChatInput
    ): Promise<Result<ChatDetails, ChatServiceError>> {
      logger.debug({ msg: 'Creating chat', userId, input });

      try {
        const chatId = typeIdGenerator('chat');
        const [newChat] = await db
          .insert(chatsTable)
          .values({
            id: chatId,
            name: input.name || null,
            isGroup: input.isGroup || false,
            createdBy: userId,
          })
          .returning();

        if (!newChat) {
          return err({
            type: 'CREATE_CHAT_ERROR',
            message: 'Failed to create chat',
          });
        }

        await db.insert(chatParticipantsTable).values({
          chatId: newChat.id,
          userId,
        });

        const participantIds = [userId];
        if (input.participantIds?.length) {
          for (const participantId of input.participantIds) {
            await db.insert(chatParticipantsTable).values({
              chatId: newChat.id,
              userId: participantId,
            });
            participantIds.push(participantId);
          }
        }

        return ok({
          id: newChat.id,
          name: newChat.name,
          isGroup: newChat.isGroup,
          createdAt: newChat.createdAt,
          updatedAt: newChat.updatedAt,
          participantIds,
        });
      } catch (error) {
        logger.error({ msg: 'Error creating chat', error, userId, input });
        return err({
          type: 'CREATE_CHAT_ERROR',
          message: 'Failed to create chat',
          cause: error,
        });
      }
    },

    async listGameChats(): Promise<Result<ChatListItem[], ChatServiceError>> {
      logger.debug({ msg: 'Listing game chats' });

      try {
        const gameChatsList = await db
          .select()
          .from(chatsTable)
          .where(
            and(
              eq(chatsTable.isGroup, true),
              eq(chatsTable.gameId, 'continuous')
            )
          )
          .orderBy(chatsTable.createdAt);

        const chatIds = gameChatsList.map((c) => c.id);
        const messageCounts =
          chatIds.length > 0
            ? await db
                .select({
                  chatId: messagesTable.chatId,
                  count: count(messagesTable.id),
                })
                .from(messagesTable)
                .where(inArray(messagesTable.chatId, chatIds))
                .groupBy(messagesTable.chatId)
            : [];

        const countMap = new Map(
          messageCounts.map((mc) => [mc.chatId, mc.count])
        );

        const latestMessages = await Promise.all(
          chatIds.map(async (chatId) => {
            const msgs = await db
              .select()
              .from(messagesTable)
              .where(eq(messagesTable.chatId, chatId))
              .orderBy(desc(messagesTable.createdAt))
              .limit(1);
            return { chatId, messages: msgs };
          })
        );

        const messagesMap = new Map(
          latestMessages.map(({ chatId, messages: msgs }) => [chatId, msgs])
        );

        const result: ChatListItem[] = gameChatsList.map((chat) => {
          const lastMessage = messagesMap.get(chat.id)?.[0] || null;
          return {
            id: chat.id,
            name: chat.name,
            isGroup: true,
            lastMessage: lastMessage
              ? {
                  id: lastMessage.id,
                  content: lastMessage.content,
                  senderId: lastMessage.senderId,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            messageCount: countMap.get(chat.id) ?? 0,
            lastMessageAt: lastMessage?.createdAt || null,
            updatedAt: chat.updatedAt,
          };
        });

        return ok(result);
      } catch (error) {
        logger.error({ msg: 'Error listing game chats', error });
        return err({
          type: 'LIST_CHATS_ERROR',
          message: 'Failed to list game chats',
          cause: error,
        });
      }
    },

    /**
     * Leave a chat (removes user from group membership or DM participants)
     */
    async leaveChat(
      userId: UserId,
      chatId: ChatId
    ): Promise<Result<{ success: boolean }, ChatServiceError>> {
      logger.debug({ msg: 'Leaving chat', userId, chatId });

      try {
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

        if (chat.isGroup) {
          const [membership] = await db
            .select()
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
              message: 'Not a member of this chat',
            });
          }

          await db
            .update(groupChatMembershipsTable)
            .set({
              isActive: false,
              removedAt: new Date(),
            })
            .where(
              and(
                eq(groupChatMembershipsTable.chatId, chatId),
                eq(groupChatMembershipsTable.userId, userId)
              )
            );
        } else {
          const [participant] = await db
            .select()
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
              message: 'Not a participant in this chat',
            });
          }

          await db
            .delete(chatParticipantsTable)
            .where(
              and(
                eq(chatParticipantsTable.chatId, chatId),
                eq(chatParticipantsTable.userId, userId)
              )
            );
        }

        return ok({ success: true });
      } catch (error) {
        logger.error({ msg: 'Error leaving chat', error, userId, chatId });
        return err({
          type: 'LEAVE_CHAT_ERROR',
          message: 'Failed to leave chat',
          cause: error,
        });
      }
    },

    async getGroupId(
      userId: UserId,
      chatId: ChatId
    ): Promise<Result<{ groupId: string | null }, ChatServiceError>> {
      logger.debug({ msg: 'Getting group ID', userId, chatId });

      try {
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

        if (!chat.isGroup) {
          return err({
            type: 'NOT_GROUP_CHAT',
            message: 'Not a group chat',
          });
        }

        const [membership] = await db
          .select()
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

        return ok({ groupId: chat.groupId });
      } catch (error) {
        logger.error({ msg: 'Error getting group ID', error, userId, chatId });
        return err({
          type: 'GET_GROUP_ID_ERROR',
          message: 'Failed to get group ID',
          cause: error,
        });
      }
    },

    async getUnreadCount(
      userId: UserId
    ): Promise<Result<UnreadCountResult, ChatServiceError>> {
      logger.debug({ msg: 'Getting unread count', userId });

      try {
        const pendingDmResults = await db
          .select({ count: count() })
          .from(dmAcceptancesTable)
          .where(
            and(
              eq(dmAcceptancesTable.userId, userId),
              eq(dmAcceptancesTable.status, 'pending')
            )
          );

        const pendingDms = pendingDmResults[0]?.count ?? 0;

        const participations = await db
          .select({ chatId: chatParticipantsTable.chatId })
          .from(chatParticipantsTable)
          .where(eq(chatParticipantsTable.userId, userId));

        const chatIds = participations.map((p) => p.chatId);

        let hasNewMessages = false;

        if (chatIds.length > 0) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          const recentMessages = await db
            .select({ count: count() })
            .from(messagesTable)
            .where(
              and(
                inArray(messagesTable.chatId, chatIds),
                ne(messagesTable.senderId, userId),
                gt(messagesTable.createdAt, twentyFourHoursAgo)
              )
            );

          hasNewMessages = (recentMessages[0]?.count ?? 0) > 0;
        }

        return ok({ pendingDms, hasNewMessages });
      } catch (error) {
        logger.error({ msg: 'Error getting unread count', error, userId });
        return err({
          type: 'GET_UNREAD_COUNT_ERROR',
          message: 'Failed to get unread count',
          cause: error,
        });
      }
    },

    async getParticipants(
      userId: UserId,
      chatId: ChatId
    ): Promise<Result<ChatParticipant[], ChatServiceError>> {
      logger.debug({ msg: 'Getting chat participants', userId, chatId });

      try {
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

        if (chat.isGroup) {
          const [membership] = await db
            .select()
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

          const members = await db
            .select()
            .from(groupChatMembershipsTable)
            .where(
              and(
                eq(groupChatMembershipsTable.chatId, chatId),
                eq(groupChatMembershipsTable.isActive, true)
              )
            );

          const participants: ChatParticipant[] = members.map((m) => ({
            id: m.userId,
            displayName: null,
            username: null,
            profileImageUrl: null,
            joinedAt: m.joinedAt,
            isActive: m.isActive,
          }));

          return ok(participants);
        }

        const [participation] = await db
          .select()
          .from(chatParticipantsTable)
          .where(
            and(
              eq(chatParticipantsTable.chatId, chatId),
              eq(chatParticipantsTable.userId, userId)
            )
          )
          .limit(1);

        if (!participation) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Access denied to chat',
          });
        }

        const participantRecords = await db
          .select()
          .from(chatParticipantsTable)
          .where(eq(chatParticipantsTable.chatId, chatId));

        const participants: ChatParticipant[] = participantRecords.map((p) => ({
          id: p.userId,
          displayName: null,
          username: null,
          profileImageUrl: null,
          joinedAt: p.joinedAt,
          isActive: p.isActive,
        }));

        return ok(participants);
      } catch (error) {
        logger.error({
          msg: 'Error getting participants',
          error,
          userId,
          chatId,
        });
        return err({
          type: 'GET_PARTICIPANTS_ERROR',
          message: 'Failed to get participants',
          cause: error,
        });
      }
    },
  };
}
