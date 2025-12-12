import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { ChatId, ChatInviteId, UserId } from '../db/typeid';
import { protectedProcedure } from '../procedures';
import {
  AddMembersOutputSchema,
  EmptyInputSchema,
  InviteUserOutputSchema,
  ListInvitesOutputSchema,
  ListMembersOutputSchema,
  RemoveMemberOutputSchema,
  RespondToInviteOutputSchema,
} from './schemas.zod';

const AddMembersInputSchema = z.object({
  chatId: z.string().min(1).describe('The group chat ID'),
  userIds: z
    .array(z.string().min(1))
    .min(1)
    .describe('User IDs to add to the group'),
});

const RemoveMemberInputSchema = z.object({
  chatId: z.string().min(1).describe('The group chat ID'),
  userId: z.string().min(1).describe('User ID to remove from the group'),
  reason: z.string().optional().describe('Optional reason for removal'),
});

const InviteUserInputSchema = z.object({
  chatId: z.string().min(1).describe('The group chat ID'),
  userId: z.string().min(1).describe('User ID to invite'),
  message: z.string().optional().describe('Optional invite message'),
});

const RespondToInviteInputSchema = z.object({
  inviteId: z.string().min(1).describe('The invite ID'),
  accept: z.boolean().describe('Whether to accept or reject the invite'),
});

const ListMembersInputSchema = z.object({
  chatId: z.string().min(1).describe('The group chat ID'),
});

export const groupRouter = {
  addMembers: protectedProcedure
    .route({
      method: 'POST',
      path: '/groups/{chatId}/members',
      tags: ['Groups'],
      successStatus: 200,
    })
    .input(AddMembersInputSchema)
    .output(AddMembersOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.groupService.addMembers(
        context.user.userId,
        input.chatId as ChatId,
        input.userIds as UserId[]
      );

      return result.match(
        (data) => {
          context.logger.info({
            msg: 'Members added to group',
            chatId: input.chatId,
            addedCount: data.added.length,
          });
          return { success: true, added: data.added };
        },
        (error) => {
          if (error.type === 'NOT_GROUP_CHAT') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
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

  removeMember: protectedProcedure
    .route({
      method: 'DELETE',
      path: '/groups/{chatId}/members/{userId}',
      tags: ['Groups'],
      successStatus: 200,
    })
    .input(RemoveMemberInputSchema)
    .output(RemoveMemberOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.groupService.removeMember(
        context.user.userId,
        input.chatId as ChatId,
        input.userId as UserId,
        input.reason
      );

      return result.match(
        (data) => {
          context.logger.info({
            msg: 'Member removed from group',
            chatId: input.chatId,
            removedUserId: input.userId,
          });
          return { success: true, removed: data.removed };
        },
        (error) => {
          if (
            error.type === 'NOT_GROUP_CHAT' ||
            error.type === 'USER_NOT_MEMBER'
          ) {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
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

  invite: protectedProcedure
    .route({
      method: 'POST',
      path: '/groups/{chatId}/invites',
      tags: ['Groups'],
      successStatus: 201,
    })
    .input(InviteUserInputSchema)
    .output(InviteUserOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.groupService.inviteUser(
        context.user.userId,
        input.chatId as ChatId,
        input.userId as UserId,
        input.message
      );

      return result.match(
        (invite) => {
          context.logger.info({
            msg: 'User invited to group',
            inviteId: invite.id,
            chatId: input.chatId,
            invitedUserId: input.userId,
          });
          return { success: true, invite };
        },
        (error) => {
          if (
            error.type === 'NOT_GROUP_CHAT' ||
            error.type === 'USER_ALREADY_MEMBER' ||
            error.type === 'INVITE_ALREADY_EXISTS'
          ) {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
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

  respondToInvite: protectedProcedure
    .route({
      method: 'POST',
      path: '/invites/{inviteId}/respond',
      tags: ['Groups'],
      successStatus: 200,
    })
    .input(RespondToInviteInputSchema)
    .output(RespondToInviteOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.groupService.respondToInvite(
        context.user.userId,
        input.inviteId as ChatInviteId,
        input.accept
      );

      return result.match(
        (data) => {
          context.logger.info({
            msg: data.accepted ? 'Invite accepted' : 'Invite rejected',
            inviteId: input.inviteId,
            chatId: data.chatId,
          });
          return {
            success: true,
            chatId: data.chatId,
            accepted: data.accepted,
          };
        },
        (error) => {
          if (error.type === 'INVITE_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', { message: error.message });
          }
          if (error.type === 'INVITE_ALREADY_RESPONDED') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
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

  listInvites: protectedProcedure
    .route({
      method: 'GET',
      path: '/invites',
      tags: ['Groups'],
      successStatus: 200,
    })
    .input(EmptyInputSchema)
    .output(ListInvitesOutputSchema)
    .handler(async ({ context }) => {
      const result = await context.groupService.listInvites(
        context.user.userId
      );

      return result.match(
        (invites) => ({ invites }),
        (error) => {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  listMembers: protectedProcedure
    .route({
      method: 'GET',
      path: '/groups/{chatId}/members',
      tags: ['Groups'],
      successStatus: 200,
    })
    .input(ListMembersInputSchema)
    .output(ListMembersOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.groupService.listMembers(
        context.user.userId,
        input.chatId as ChatId
      );

      return result.match(
        (members) => ({ members }),
        (error) => {
          if (error.type === 'NOT_GROUP_CHAT') {
            throw new ORPCError('BAD_REQUEST', { message: error.message });
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
};
