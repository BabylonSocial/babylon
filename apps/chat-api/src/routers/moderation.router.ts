import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { ChatId, UserId } from '../db/typeid';
import { protectedProcedure } from '../procedures';
import {
  CheckBanOutputSchema,
  GetModerationLogOutputSchema,
  ModerationResultOutputSchema,
} from './schemas.zod';

const KickUserInputSchema = z.object({
  chatId: z.string().min(1).describe('The chat ID to kick the user from'),
  targetUserId: z.string().min(1).describe('The user ID to kick'),
  reason: z.string().optional().describe('Optional reason for the kick'),
});

const BanUserInputSchema = z.object({
  chatId: z.string().min(1).describe('The chat ID to ban the user from'),
  targetUserId: z.string().min(1).describe('The user ID to ban'),
  reason: z.string().optional().describe('Optional reason for the ban'),
  durationSeconds: z
    .number()
    .positive()
    .optional()
    .describe('Ban duration in seconds (omit for permanent)'),
});

const UnbanUserInputSchema = z.object({
  chatId: z.string().min(1).describe('The chat ID to unban the user from'),
  targetUserId: z.string().min(1).describe('The user ID to unban'),
});

const CheckBanInputSchema = z.object({
  chatId: z.string().min(1).describe('The chat ID to check'),
  userId: z.string().min(1).describe('The user ID to check ban status for'),
});

const GetModerationLogInputSchema = z.object({
  chatId: z.string().min(1).describe('The chat ID to get moderation log for'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of log entries to return'),
});

export const moderationRouter = {
  kick: protectedProcedure
    .route({
      method: 'POST',
      path: '/chats/{chatId}/kick',
      tags: ['Moderation'],
      successStatus: 200,
    })
    .input(KickUserInputSchema)
    .output(ModerationResultOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.moderationService.kickUser(
        context.user.userId,
        input.chatId as ChatId,
        input.targetUserId as UserId,
        input.reason
      );

      return result.match(
        (mod) => {
          context.logger.info({
            msg: 'User kicked',
            logId: mod.logId,
            chatId: mod.chatId,
            actorId: context.user.userId,
            targetUserId: mod.targetUserId,
          });
          return { success: true, logId: mod.logId };
        },
        (error) => {
          if (error.type === 'CANNOT_MODERATE_SELF') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
          }
          if (
            error.type === 'CHAT_NOT_FOUND' ||
            error.type === 'TARGET_NOT_FOUND'
          ) {
            throw new ORPCError('NOT_FOUND', { message: error.message });
          }
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', { message: error.message });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  ban: protectedProcedure
    .route({
      method: 'POST',
      path: '/chats/{chatId}/ban',
      tags: ['Moderation'],
      successStatus: 200,
    })
    .input(BanUserInputSchema)
    .output(ModerationResultOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.moderationService.banUser(
        context.user.userId,
        input.chatId as ChatId,
        input.targetUserId as UserId,
        input.reason,
        input.durationSeconds
      );

      return result.match(
        (mod) => {
          context.logger.info({
            msg: 'User banned',
            logId: mod.logId,
            chatId: mod.chatId,
            actorId: context.user.userId,
            targetUserId: mod.targetUserId,
          });
          return { success: true, logId: mod.logId };
        },
        (error) => {
          if (error.type === 'CANNOT_MODERATE_SELF') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
          }
          if (error.type === 'ALREADY_BANNED') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
          }
          if (error.type === 'CHAT_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', { message: error.message });
          }
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', { message: error.message });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  unban: protectedProcedure
    .route({
      method: 'POST',
      path: '/chats/{chatId}/unban',
      tags: ['Moderation'],
      successStatus: 200,
    })
    .input(UnbanUserInputSchema)
    .output(ModerationResultOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.moderationService.unbanUser(
        context.user.userId,
        input.chatId as ChatId,
        input.targetUserId as UserId
      );

      return result.match(
        (mod) => {
          context.logger.info({
            msg: 'User unbanned',
            logId: mod.logId,
            chatId: mod.chatId,
            actorId: context.user.userId,
            targetUserId: mod.targetUserId,
          });
          return { success: true, logId: mod.logId };
        },
        (error) => {
          if (error.type === 'NOT_BANNED') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
          }
          if (error.type === 'CHAT_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', { message: error.message });
          }
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', { message: error.message });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  checkBan: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}/bans/{userId}',
      tags: ['Moderation'],
      successStatus: 200,
    })
    .input(CheckBanInputSchema)
    .output(CheckBanOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.moderationService.isUserBanned(
        input.userId as UserId,
        input.chatId as ChatId
      );

      return result.match(
        (isBanned) => ({ isBanned }),
        (error) => {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  log: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}/moderation-log',
      tags: ['Moderation'],
      successStatus: 200,
    })
    .input(GetModerationLogInputSchema)
    .output(GetModerationLogOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.moderationService.getModerationLog(
        input.chatId as ChatId,
        { limit: input.limit }
      );

      return result.match(
        (logs) => ({
          logs: logs.map((log) => ({
            id: log.id,
            chatId: log.chatId,
            targetUserId: log.targetUserId,
            actorId: log.actorId,
            action: log.action,
            reason: log.reason,
            duration: log.duration,
            expiresAt: log.expiresAt?.toISOString() ?? null,
            createdAt: log.createdAt.toISOString(),
          })),
        }),
        (error) => {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),
};
