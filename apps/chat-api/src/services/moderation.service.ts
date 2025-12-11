/**
 * Moderation Service
 *
 * Business logic for chat moderation operations (kick, ban, unban, mute, unmute).
 * Maintains an audit log of all moderation actions.
 */

import { and, desc, eq, gt } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';
import type { Database } from '../db/db';
import {
  type ChatModerationLog,
  chatModerationLogTable,
  chatParticipantsTable,
  chatsTable,
} from '../db/schema/chat.db';
import {
  type ChatId,
  type ModerationLogId,
  typeIdGenerator,
  type UserId,
} from '../db/typeid';
import type { Logger } from '../logger';
import type { ModerationServiceError } from './errors';

export type ModerationAction = 'kick' | 'ban' | 'unban' | 'mute' | 'unmute';

export type ModerationServiceDeps = {
  db: Database;
  logger: Logger;
};

export type ModerationResult = {
  logId: ModerationLogId;
  action: ModerationAction;
  targetUserId: UserId;
  chatId: ChatId;
};

export type ModerationService = ReturnType<typeof createModerationService>;

export function createModerationService(deps: ModerationServiceDeps) {
  const { db, logger } = deps;

  async function verifyParticipant(
    userId: UserId,
    chatId: ChatId
  ): Promise<boolean> {
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
    return !!participant;
  }

  async function getActiveBan(
    userId: UserId,
    chatId: ChatId
  ): Promise<ChatModerationLog | null> {
    const [ban] = await db
      .select()
      .from(chatModerationLogTable)
      .where(
        and(
          eq(chatModerationLogTable.chatId, chatId),
          eq(chatModerationLogTable.targetUserId, userId),
          eq(chatModerationLogTable.action, 'ban')
        )
      )
      .orderBy(desc(chatModerationLogTable.createdAt))
      .limit(1);

    if (!ban) return null;

    // Check if ban has expired
    if (ban.expiresAt && ban.expiresAt < new Date()) {
      return null;
    }

    // Check if there's a more recent unban
    const [unban] = await db
      .select()
      .from(chatModerationLogTable)
      .where(
        and(
          eq(chatModerationLogTable.chatId, chatId),
          eq(chatModerationLogTable.targetUserId, userId),
          eq(chatModerationLogTable.action, 'unban'),
          gt(chatModerationLogTable.createdAt, ban.createdAt)
        )
      )
      .limit(1);

    return unban ? null : ban;
  }

  return {
    /**
     * Kick a user from a chat
     */
    async kickUser(
      actorId: UserId,
      chatId: ChatId,
      targetUserId: UserId,
      reason?: string
    ): Promise<Result<ModerationResult, ModerationServiceError>> {
      logger.debug({ msg: 'Kicking user', actorId, chatId, targetUserId });

      if (actorId === targetUserId) {
        return err({
          type: 'CANNOT_MODERATE_SELF',
          message: 'Cannot kick yourself',
        });
      }

      try {
        // Verify chat exists
        const [chat] = await db
          .select()
          .from(chatsTable)
          .where(eq(chatsTable.id, chatId))
          .limit(1);

        if (!chat) {
          return err({ type: 'CHAT_NOT_FOUND', message: 'Chat not found' });
        }

        // Verify target is a participant
        const isTargetParticipant = await verifyParticipant(
          targetUserId,
          chatId
        );
        if (!isTargetParticipant) {
          return err({
            type: 'TARGET_NOT_FOUND',
            message: 'Target user is not in this chat',
          });
        }

        // Remove from participants
        await db
          .delete(chatParticipantsTable)
          .where(
            and(
              eq(chatParticipantsTable.chatId, chatId),
              eq(chatParticipantsTable.userId, targetUserId)
            )
          );

        // Log the action
        const logId = typeIdGenerator('moderationLog');
        await db.insert(chatModerationLogTable).values({
          id: logId,
          chatId,
          targetUserId,
          actorId,
          action: 'kick',
          reason,
        });

        return ok({ logId, action: 'kick', targetUserId, chatId });
      } catch (error) {
        logger.error({
          msg: 'Error kicking user',
          error,
          actorId,
          chatId,
          targetUserId,
        });
        return err({
          type: 'MODERATION_ERROR',
          message: 'Failed to kick user',
          cause: error,
        });
      }
    },

    /**
     * Ban a user from a chat (with optional duration)
     */
    async banUser(
      actorId: UserId,
      chatId: ChatId,
      targetUserId: UserId,
      reason?: string,
      durationSeconds?: number
    ): Promise<Result<ModerationResult, ModerationServiceError>> {
      logger.debug({
        msg: 'Banning user',
        actorId,
        chatId,
        targetUserId,
        durationSeconds,
      });

      if (actorId === targetUserId) {
        return err({
          type: 'CANNOT_MODERATE_SELF',
          message: 'Cannot ban yourself',
        });
      }

      try {
        // Verify chat exists
        const [chat] = await db
          .select()
          .from(chatsTable)
          .where(eq(chatsTable.id, chatId))
          .limit(1);

        if (!chat) {
          return err({ type: 'CHAT_NOT_FOUND', message: 'Chat not found' });
        }

        // Check if already banned
        const activeBan = await getActiveBan(targetUserId, chatId);
        if (activeBan) {
          return err({
            type: 'ALREADY_BANNED',
            message: 'User is already banned',
          });
        }

        // Remove from participants if present
        await db
          .delete(chatParticipantsTable)
          .where(
            and(
              eq(chatParticipantsTable.chatId, chatId),
              eq(chatParticipantsTable.userId, targetUserId)
            )
          );

        // Calculate expiry
        const expiresAt = durationSeconds
          ? new Date(Date.now() + durationSeconds * 1000)
          : null;

        // Log the action
        const logId = typeIdGenerator('moderationLog');
        await db.insert(chatModerationLogTable).values({
          id: logId,
          chatId,
          targetUserId,
          actorId,
          action: 'ban',
          reason,
          duration: durationSeconds ?? null,
          expiresAt,
        });

        return ok({ logId, action: 'ban', targetUserId, chatId });
      } catch (error) {
        logger.error({
          msg: 'Error banning user',
          error,
          actorId,
          chatId,
          targetUserId,
        });
        return err({
          type: 'MODERATION_ERROR',
          message: 'Failed to ban user',
          cause: error,
        });
      }
    },

    /**
     * Unban a user from a chat
     */
    async unbanUser(
      actorId: UserId,
      chatId: ChatId,
      targetUserId: UserId
    ): Promise<Result<ModerationResult, ModerationServiceError>> {
      logger.debug({ msg: 'Unbanning user', actorId, chatId, targetUserId });

      try {
        // Verify chat exists
        const [chat] = await db
          .select()
          .from(chatsTable)
          .where(eq(chatsTable.id, chatId))
          .limit(1);

        if (!chat) {
          return err({ type: 'CHAT_NOT_FOUND', message: 'Chat not found' });
        }

        // Check if currently banned
        const activeBan = await getActiveBan(targetUserId, chatId);
        if (!activeBan) {
          return err({ type: 'NOT_BANNED', message: 'User is not banned' });
        }

        // Log the unban
        const logId = typeIdGenerator('moderationLog');
        await db.insert(chatModerationLogTable).values({
          id: logId,
          chatId,
          targetUserId,
          actorId,
          action: 'unban',
        });

        return ok({ logId, action: 'unban', targetUserId, chatId });
      } catch (error) {
        logger.error({
          msg: 'Error unbanning user',
          error,
          actorId,
          chatId,
          targetUserId,
        });
        return err({
          type: 'MODERATION_ERROR',
          message: 'Failed to unban user',
          cause: error,
        });
      }
    },

    /**
     * Check if a user is banned from a chat
     */
    async isUserBanned(
      userId: UserId,
      chatId: ChatId
    ): Promise<Result<boolean, ModerationServiceError>> {
      try {
        const activeBan = await getActiveBan(userId, chatId);
        return ok(!!activeBan);
      } catch (error) {
        logger.error({
          msg: 'Error checking ban status',
          error,
          userId,
          chatId,
        });
        return err({
          type: 'MODERATION_ERROR',
          message: 'Failed to check ban status',
          cause: error,
        });
      }
    },

    /**
     * Get moderation log for a chat
     */
    async getModerationLog(
      chatId: ChatId,
      options: { limit?: number } = {}
    ): Promise<Result<ChatModerationLog[], ModerationServiceError>> {
      const { limit = 50 } = options;

      try {
        const logs = await db
          .select()
          .from(chatModerationLogTable)
          .where(eq(chatModerationLogTable.chatId, chatId))
          .orderBy(desc(chatModerationLogTable.createdAt))
          .limit(limit);

        return ok(logs);
      } catch (error) {
        logger.error({ msg: 'Error getting moderation log', error, chatId });
        return err({
          type: 'MODERATION_ERROR',
          message: 'Failed to get moderation log',
          cause: error,
        });
      }
    },
  };
}
