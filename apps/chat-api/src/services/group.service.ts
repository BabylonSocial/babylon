/**
 * Group Service
 *
 * Business logic for group chat member management.
 * Handles adding/removing members, invites, and member listing.
 */

import { and, eq, inArray } from 'drizzle-orm';
import { err, ok, type Result } from 'neverthrow';
import type { Database } from '../db/db';
import {
  chatInvitesTable,
  chatsTable,
  groupChatMembershipsTable,
} from '../db/schema/chat.db';
import {
  type ChatId,
  type ChatInviteId,
  typeIdGenerator,
  type UserId,
} from '../db/typeid';
import type { Logger } from '../logger';
import type { GroupServiceError } from './errors';

export type GroupServiceDeps = {
  db: Database;
  logger: Logger;
};

export type GroupMember = {
  userId: UserId;
  joinedAt: Date;
  messageCount: number;
  qualityScore: number;
  isActive: boolean;
};

export type InviteResult = {
  id: ChatInviteId;
  chatId: ChatId;
  invitedUserId: UserId;
  invitedBy: UserId;
  status: string;
  message: string | null;
};

export type GroupService = ReturnType<typeof createGroupService>;

export function createGroupService(deps: GroupServiceDeps) {
  const { db, logger } = deps;

  async function verifyGroupChat(chatId: ChatId): Promise<boolean> {
    const [chat] = await db
      .select()
      .from(chatsTable)
      .where(and(eq(chatsTable.id, chatId), eq(chatsTable.isGroup, true)))
      .limit(1);
    return !!chat;
  }

  async function isMember(userId: UserId, chatId: ChatId): Promise<boolean> {
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
    return !!membership;
  }

  return {
    /**
     * Add members to a group chat directly (no invite)
     */
    async addMembers(
      actorId: UserId,
      chatId: ChatId,
      userIds: UserId[]
    ): Promise<Result<{ added: UserId[] }, GroupServiceError>> {
      logger.debug({
        msg: 'Adding members to group',
        actorId,
        chatId,
        userIds,
      });

      try {
        // Verify it's a group chat
        const isGroup = await verifyGroupChat(chatId);
        if (!isGroup) {
          return err({ type: 'NOT_GROUP_CHAT', message: 'Not a group chat' });
        }

        // Verify actor is a member
        const actorIsMember = await isMember(actorId, chatId);
        if (!actorIsMember) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Not a member of this group',
          });
        }

        // Check existing members
        const existingMembers = await db
          .select({ userId: groupChatMembershipsTable.userId })
          .from(groupChatMembershipsTable)
          .where(
            and(
              eq(groupChatMembershipsTable.chatId, chatId),
              inArray(groupChatMembershipsTable.userId, userIds)
            )
          );

        const existingIds = new Set(existingMembers.map((m) => m.userId));
        const newUserIds = userIds.filter((id) => !existingIds.has(id));

        // Add new members
        const added: UserId[] = [];
        for (const userId of newUserIds) {
          await db.insert(groupChatMembershipsTable).values({
            userId,
            chatId,
            npcAdminId: '', // Will be set if NPC-managed
            isActive: true,
          });
          added.push(userId);
        }

        return ok({ added });
      } catch (error) {
        logger.error({
          msg: 'Error adding members',
          error,
          actorId,
          chatId,
          userIds,
        });
        return err({
          type: 'GROUP_ERROR',
          message: 'Failed to add members',
          cause: error,
        });
      }
    },

    /**
     * Remove a member from a group chat
     */
    async removeMember(
      actorId: UserId,
      chatId: ChatId,
      targetUserId: UserId,
      reason?: string
    ): Promise<Result<{ removed: boolean }, GroupServiceError>> {
      logger.debug({
        msg: 'Removing member from group',
        actorId,
        chatId,
        targetUserId,
      });

      try {
        const isGroup = await verifyGroupChat(chatId);
        if (!isGroup) {
          return err({ type: 'NOT_GROUP_CHAT', message: 'Not a group chat' });
        }

        const actorIsMember = await isMember(actorId, chatId);
        if (!actorIsMember) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Not a member of this group',
          });
        }

        const targetIsMember = await isMember(targetUserId, chatId);
        if (!targetIsMember) {
          return err({
            type: 'USER_NOT_MEMBER',
            message: 'User is not a member',
          });
        }

        // Soft delete - mark as inactive
        await db
          .update(groupChatMembershipsTable)
          .set({
            isActive: false,
            sweepReason: reason || 'Removed by member',
            removedAt: new Date(),
          })
          .where(
            and(
              eq(groupChatMembershipsTable.chatId, chatId),
              eq(groupChatMembershipsTable.userId, targetUserId)
            )
          );

        return ok({ removed: true });
      } catch (error) {
        logger.error({
          msg: 'Error removing member',
          error,
          actorId,
          chatId,
          targetUserId,
        });
        return err({
          type: 'GROUP_ERROR',
          message: 'Failed to remove member',
          cause: error,
        });
      }
    },

    /**
     * Invite a user to join a group chat
     */
    async inviteUser(
      invitedBy: UserId,
      chatId: ChatId,
      invitedUserId: UserId,
      message?: string
    ): Promise<Result<InviteResult, GroupServiceError>> {
      logger.debug({
        msg: 'Inviting user to group',
        invitedBy,
        chatId,
        invitedUserId,
      });

      try {
        const isGroup = await verifyGroupChat(chatId);
        if (!isGroup) {
          return err({ type: 'NOT_GROUP_CHAT', message: 'Not a group chat' });
        }

        const actorIsMember = await isMember(invitedBy, chatId);
        if (!actorIsMember) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Not a member of this group',
          });
        }

        // Check if already a member
        const alreadyMember = await isMember(invitedUserId, chatId);
        if (alreadyMember) {
          return err({
            type: 'USER_ALREADY_MEMBER',
            message: 'User is already a member',
          });
        }

        // Check for existing pending invite
        const [existingInvite] = await db
          .select()
          .from(chatInvitesTable)
          .where(
            and(
              eq(chatInvitesTable.chatId, chatId),
              eq(chatInvitesTable.invitedUserId, invitedUserId),
              eq(chatInvitesTable.status, 'pending')
            )
          )
          .limit(1);

        if (existingInvite) {
          return err({
            type: 'INVITE_ALREADY_EXISTS',
            message: 'Pending invite already exists',
          });
        }

        // Create invite
        const inviteId = typeIdGenerator('chatInvite');
        const [invite] = await db
          .insert(chatInvitesTable)
          .values({
            id: inviteId,
            chatId,
            invitedUserId,
            invitedBy,
            status: 'pending',
            message: message || null,
          })
          .returning();

        return ok({
          id: invite!.id,
          chatId: invite!.chatId,
          invitedUserId: invite!.invitedUserId,
          invitedBy: invite!.invitedBy,
          status: invite!.status,
          message: invite!.message,
        });
      } catch (error) {
        logger.error({
          msg: 'Error inviting user',
          error,
          invitedBy,
          chatId,
          invitedUserId,
        });
        return err({
          type: 'GROUP_ERROR',
          message: 'Failed to invite user',
          cause: error,
        });
      }
    },

    /**
     * Respond to a group invite (accept or reject)
     */
    async respondToInvite(
      userId: UserId,
      inviteId: ChatInviteId,
      accept: boolean
    ): Promise<
      Result<{ chatId: ChatId; accepted: boolean }, GroupServiceError>
    > {
      logger.debug({ msg: 'Responding to invite', userId, inviteId, accept });

      try {
        // Get invite
        const [invite] = await db
          .select()
          .from(chatInvitesTable)
          .where(eq(chatInvitesTable.id, inviteId))
          .limit(1);

        if (!invite) {
          return err({ type: 'INVITE_NOT_FOUND', message: 'Invite not found' });
        }

        if (invite.invitedUserId !== userId) {
          return err({ type: 'ACCESS_DENIED', message: 'Not your invite' });
        }

        if (invite.status !== 'pending') {
          return err({
            type: 'INVITE_ALREADY_RESPONDED',
            message: 'Invite already responded to',
          });
        }

        // Update invite status
        await db
          .update(chatInvitesTable)
          .set({
            status: accept ? 'accepted' : 'rejected',
            respondedAt: new Date(),
          })
          .where(eq(chatInvitesTable.id, inviteId));

        // If accepted, add to group
        if (accept) {
          await db.insert(groupChatMembershipsTable).values({
            userId,
            chatId: invite.chatId,
            npcAdminId: '',
            isActive: true,
          });
        }

        return ok({ chatId: invite.chatId, accepted: accept });
      } catch (error) {
        logger.error({
          msg: 'Error responding to invite',
          error,
          userId,
          inviteId,
        });
        return err({
          type: 'GROUP_ERROR',
          message: 'Failed to respond to invite',
          cause: error,
        });
      }
    },

    /**
     * List pending invites for a user
     */
    async listInvites(
      userId: UserId
    ): Promise<Result<InviteResult[], GroupServiceError>> {
      logger.debug({ msg: 'Listing invites', userId });

      try {
        const invites = await db
          .select()
          .from(chatInvitesTable)
          .where(
            and(
              eq(chatInvitesTable.invitedUserId, userId),
              eq(chatInvitesTable.status, 'pending')
            )
          );

        return ok(
          invites.map((i) => ({
            id: i.id,
            chatId: i.chatId,
            invitedUserId: i.invitedUserId,
            invitedBy: i.invitedBy,
            status: i.status,
            message: i.message,
          }))
        );
      } catch (error) {
        logger.error({ msg: 'Error listing invites', error, userId });
        return err({
          type: 'GROUP_ERROR',
          message: 'Failed to list invites',
          cause: error,
        });
      }
    },

    /**
     * List members of a group chat
     */
    async listMembers(
      userId: UserId,
      chatId: ChatId
    ): Promise<Result<GroupMember[], GroupServiceError>> {
      logger.debug({ msg: 'Listing group members', userId, chatId });

      try {
        const isGroup = await verifyGroupChat(chatId);
        if (!isGroup) {
          return err({ type: 'NOT_GROUP_CHAT', message: 'Not a group chat' });
        }

        const actorIsMember = await isMember(userId, chatId);
        if (!actorIsMember) {
          return err({
            type: 'ACCESS_DENIED',
            message: 'Not a member of this group',
          });
        }

        const members = await db
          .select()
          .from(groupChatMembershipsTable)
          .where(eq(groupChatMembershipsTable.chatId, chatId));

        return ok(
          members.map((m) => ({
            userId: m.userId,
            joinedAt: m.joinedAt,
            messageCount: m.messageCount,
            qualityScore: m.qualityScore,
            isActive: m.isActive,
          }))
        );
      } catch (error) {
        logger.error({ msg: 'Error listing members', error, userId, chatId });
        return err({
          type: 'GROUP_ERROR',
          message: 'Failed to list members',
          cause: error,
        });
      }
    },
  };
}
