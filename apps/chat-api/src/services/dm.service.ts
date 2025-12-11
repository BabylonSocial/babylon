/**
 * DM Service
 *
 * Business logic for direct message operations.
 * Note: User validation (existence, isActor) is expected to be done by the caller
 * since chat-api doesn't own the users table.
 */

import { and, eq } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';
import type { Database } from '../db/db';
import { chatParticipantsTable, chatsTable } from '../db/schema/chat.db';
import { type ChatId, typeIdGenerator, type UserId } from '../db/typeid';
import type { Logger } from '../logger';
import type { DmServiceError } from './errors';

export type DmServiceDeps = {
  db: Database;
  logger: Logger;
};

export type DmChatResult = {
  id: ChatId;
  name: string | null;
  isGroup: boolean;
  otherUserId: UserId;
  isNewChat: boolean;
};

export type DmService = ReturnType<typeof createDmService>;

export function createDmService(deps: DmServiceDeps) {
  const { db, logger } = deps;

  return {
    /**
     * Create or get an existing DM chat with another user
     * Idempotent - returns same chat for same participant pair
     *
     * Note: Blocking validation should be done by the caller (main API)
     */
    async createOrGetDm(
      userId: UserId,
      targetUserId: UserId
    ): Promise<Result<DmChatResult, DmServiceError>> {
      logger.debug({ msg: 'Creating/getting DM', userId, targetUserId });

      // Prevent self-DM
      if (userId === targetUserId) {
        return err({
          type: 'SELF_DM_ERROR',
          message: 'Cannot DM yourself',
        });
      }

      try {
        // Find existing DM by querying participants
        // Get all non-group chats where userId is a participant
        const userChats = await db
          .select({ chatId: chatParticipantsTable.chatId })
          .from(chatParticipantsTable)
          .innerJoin(
            chatsTable,
            eq(chatsTable.id, chatParticipantsTable.chatId)
          )
          .where(
            and(
              eq(chatParticipantsTable.userId, userId),
              eq(chatsTable.isGroup, false)
            )
          );

        // Check if targetUserId is also a participant in any of these chats
        for (const { chatId } of userChats) {
          const [hasTarget] = await db
            .select()
            .from(chatParticipantsTable)
            .where(
              and(
                eq(chatParticipantsTable.chatId, chatId),
                eq(chatParticipantsTable.userId, targetUserId)
              )
            )
            .limit(1);

          if (hasTarget) {
            // Found existing DM
            return ok({
              id: chatId,
              name: null,
              isGroup: false,
              otherUserId: targetUserId,
              isNewChat: false,
            });
          }
        }

        // No existing DM found, create new one with proper TypeID
        const chatId = typeIdGenerator('chat');

        await db.insert(chatsTable).values({
          id: chatId,
          name: null,
          isGroup: false,
        });

        // Add both participants
        await Promise.all([
          db.insert(chatParticipantsTable).values({
            chatId,
            userId,
          }),
          db.insert(chatParticipantsTable).values({
            chatId,
            userId: targetUserId,
          }),
        ]);

        return ok({
          id: chatId,
          name: null,
          isGroup: false,
          otherUserId: targetUserId,
          isNewChat: true,
        });
      } catch (error) {
        logger.error({
          msg: 'Error creating/getting DM',
          error,
          userId,
          targetUserId,
        });
        return err({
          type: 'CREATE_DM_ERROR',
          message: 'Failed to create or get DM',
          cause: error,
        });
      }
    },

    /**
     * List all DM chats for a user
     */
    async listDms(
      userId: UserId
    ): Promise<Result<DmChatResult[], DmServiceError>> {
      logger.debug({ msg: 'Listing DMs', userId });

      try {
        // Get all chat IDs where user is a participant
        const participations = await db
          .select({ chatId: chatParticipantsTable.chatId })
          .from(chatParticipantsTable)
          .where(eq(chatParticipantsTable.userId, userId));

        const chatIds = participations.map((p) => p.chatId);
        if (chatIds.length === 0) return ok([]);

        // Get DM chats (not group)
        const results: DmChatResult[] = [];

        for (const chatId of chatIds) {
          const [chat] = await db
            .select()
            .from(chatsTable)
            .where(
              and(eq(chatsTable.id, chatId), eq(chatsTable.isGroup, false))
            )
            .limit(1);

          if (!chat) continue;

          // Get other participant
          const participants = await db
            .select({ odUserId: chatParticipantsTable.userId })
            .from(chatParticipantsTable)
            .where(eq(chatParticipantsTable.chatId, chatId));

          const otherUserId = participants.find(
            (p) => p.odUserId !== userId
          )?.odUserId;
          if (!otherUserId) continue;

          results.push({
            id: chat.id,
            name: null,
            isGroup: false,
            otherUserId,
            isNewChat: false,
          });
        }

        return ok(results);
      } catch (error) {
        logger.error({ msg: 'Error listing DMs', error, userId });
        return err({
          type: 'LIST_DMS_ERROR',
          message: 'Failed to list DMs',
          cause: error,
        });
      }
    },
  };
}
