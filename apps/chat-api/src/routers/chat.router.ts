import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { ChatId, UserId } from '../db/typeid';
import { protectedProcedure, publicProcedure } from '../procedures';
import {
  CreateChatOutputSchema,
  EmptyInputSchema,
  GetChatOutputSchema,
  GetGroupIdOutputSchema,
  GetParticipantsOutputSchema,
  GetUnreadCountOutputSchema,
  LeaveChatOutputSchema,
  ListChatsOutputSchema,
} from './schemas.zod';

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
  list: publicProcedure
    .route({
      method: 'GET',
      path: '/chats',
      tags: ['Chats'],
      successStatus: 200,
    })
    .input(ListChatsInputSchema)
    .output(ListChatsOutputSchema)
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

  get: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}',
      tags: ['Chats'],
      successStatus: 200,
    })
    .input(GetChatInputSchema)
    .output(GetChatOutputSchema)
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

  create: protectedProcedure
    .route({
      method: 'POST',
      path: '/chats',
      tags: ['Chats'],
      successStatus: 201,
    })
    .input(CreateChatInputSchema)
    .output(CreateChatOutputSchema)
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

  leave: protectedProcedure
    .route({
      method: 'POST',
      path: '/chats/{chatId}/leave',
      tags: ['Chats'],
      successStatus: 200,
    })
    .input(LeaveChatInputSchema)
    .output(LeaveChatOutputSchema)
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

  getGroupId: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}/group-id',
      tags: ['Chats'],
      successStatus: 200,
    })
    .input(GetGroupIdInputSchema)
    .output(GetGroupIdOutputSchema)
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

  getUnreadCount: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/unread-count',
      tags: ['Chats'],
      successStatus: 200,
    })
    .input(EmptyInputSchema)
    .output(GetUnreadCountOutputSchema)
    .handler(async ({ context }) => {
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

  getParticipants: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}/participants',
      tags: ['Chats'],
      successStatus: 200,
    })
    .input(GetParticipantsInputSchema)
    .output(GetParticipantsOutputSchema)
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
