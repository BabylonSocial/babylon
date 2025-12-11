import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { ChatId, UserId } from '../db/typeid';
import { protectedProcedure } from '../procedures';

// Input schemas with AI SDK-friendly descriptions
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
  /**
   * Kick a user from a chat
   * Removes them from participants but doesn't prevent re-joining
   */
  kick: protectedProcedure
    .input(KickUserInputSchema)
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

  /**
   * Ban a user from a chat
   * Removes them and prevents re-joining until unbanned or ban expires
   */
  ban: protectedProcedure
    .input(BanUserInputSchema)
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

  /**
   * Unban a user from a chat
   * Allows them to re-join
   */
  unban: protectedProcedure
    .input(UnbanUserInputSchema)
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

  /**
   * Check if a user is banned from a chat
   */
  checkBan: protectedProcedure
    .input(CheckBanInputSchema)
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

  /**
   * Get the moderation log for a chat
   * Returns recent kick/ban/unban actions
   */
  log: protectedProcedure
    .input(GetModerationLogInputSchema)
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
