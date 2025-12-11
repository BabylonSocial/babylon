import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { ChatId, UserId } from '../db/typeid';
import { protectedProcedure, publicProcedure } from '../procedures';

// Input schemas
const ListChatsInputSchema = z.object({
  all: z.boolean().optional().default(false),
});

const GetChatInputSchema = z.object({
  chatId: z.string().min(1),
});

const CreateChatInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isGroup: z.boolean().optional().default(false),
  participantIds: z.array(z.string()).optional(),
});

const LeaveChatInputSchema = z.object({
  chatId: z.string().min(1),
});

const GetGroupIdInputSchema = z.object({
  chatId: z.string().min(1),
});

const GetParticipantsInputSchema = z.object({
  chatId: z.string().min(1),
});

export const chatRouter = {
  /**
   * List chats for authenticated user, or all game chats if all=true
   */
  list: publicProcedure
    .input(ListChatsInputSchema)
    .handler(async ({ input, context }) => {
      if (input.all) {
        // Public endpoint - list game chats
        const result = await context.chatService.listGameChats();
        return result.match(
          (gameChats) => ({ chats: gameChats }),
          (error) => {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              message: error.message,
            });
          }
        );
      }

      // Protected endpoint - requires auth
      if (!context.user) {
        throw new ORPCError('UNAUTHORIZED', {
          message: 'Authentication required',
        });
      }

      const result = await context.chatService.listChats(context.user.userId);

      return result.match(
        ({ groupChats, directChats }) => ({
          groupChats,
          directChats,
          total: groupChats.length + directChats.length,
        }),
        (error) => {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  /**
   * Get chat details by ID
   */
  get: protectedProcedure
    .input(GetChatInputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.chatService.getChatById(
        context.user.userId,
        input.chatId as ChatId
      );

      return result.match(
        (chat) => chat,
        (error) => {
          if (
            error.type === 'CHAT_NOT_FOUND' ||
            error.type === 'ACCESS_DENIED'
          ) {
            throw new ORPCError('NOT_FOUND', {
              message: 'Chat not found or access denied',
            });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  /**
   * Create a new chat
   */
  create: protectedProcedure
    .input(CreateChatInputSchema)
    .handler(async ({ input, context }) => {
      // Validate group chat has name
      if (input.isGroup && !input.name) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Group chats require a name',
        });
      }

      const result = await context.chatService.createChat(context.user.userId, {
        name: input.name,
        isGroup: input.isGroup,
        participantIds: input.participantIds as UserId[] | undefined,
      });

      return result.match(
        (chat) => {
          context.logger.info({
            msg: 'Chat created',
            chatId: chat.id,
            userId: context.user.userId,
            isGroup: input.isGroup,
          });
          return chat;
        },
        (error) => {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  /**
   * Leave a chat
   */
  leave: protectedProcedure
    .input(LeaveChatInputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.chatService.leaveChat(
        context.user.userId,
        input.chatId as ChatId
      );

      return result.match(
        (data) => {
          context.logger.info({
            msg: 'User left chat',
            chatId: input.chatId,
            userId: context.user.userId,
          });
          return data;
        },
        (error) => {
          if (error.type === 'CHAT_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', {
              message: 'Chat not found',
            });
          }
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', {
              message: error.message,
            });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  /**
   * Get group ID for a chat (for group management)
   */
  getGroupId: protectedProcedure
    .input(GetGroupIdInputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.chatService.getGroupId(
        context.user.userId,
        input.chatId as ChatId
      );

      return result.match(
        (data) => data,
        (error) => {
          if (error.type === 'CHAT_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', {
              message: 'Chat not found',
            });
          }
          if (error.type === 'NOT_GROUP_CHAT') {
            throw new ORPCError('BAD_REQUEST', {
              message: 'Not a group chat',
            });
          }
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', {
              message: error.message,
            });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  /**
   * Get unread message counts for authenticated user
   */
  getUnreadCount: protectedProcedure.handler(async ({ context }) => {
    const result = await context.chatService.getUnreadCount(
      context.user.userId
    );

    return result.match(
      (data) => data,
      (error) => {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
    );
  }),

  /**
   * Get participants of a chat
   */
  getParticipants: protectedProcedure
    .input(GetParticipantsInputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.chatService.getParticipants(
        context.user.userId,
        input.chatId as ChatId
      );

      return result.match(
        (participants) => ({ participants }),
        (error) => {
          if (error.type === 'CHAT_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', {
              message: 'Chat not found',
            });
          }
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', {
              message: error.message,
            });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),
};
