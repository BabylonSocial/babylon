import { ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { UserId } from '../db/typeid';
import { protectedProcedure } from '../procedures';
import {
  CreateOrGetDmOutputSchema,
  EmptyInputSchema,
  ListDmsOutputSchema,
} from './schemas.zod';

// Input schemas
const CreateOrGetDmInputSchema = z.object({
  targetUserId: z.string().min(1),
});

export const dmRouter = {
  createOrGet: protectedProcedure
    .route({
      method: 'POST',
      path: '/dms',
      tags: ['Direct Messages'],
      successStatus: 200,
    })
    .input(CreateOrGetDmInputSchema)
    .output(CreateOrGetDmOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.dmService.createOrGetDm(
        context.user.userId,
        input.targetUserId as UserId
      );

      return result.match(
        (dm) => {
          context.logger.info({
            msg: dm.isNewChat ? 'DM created' : 'DM retrieved',
            chatId: dm.id,
            userId: context.user.userId,
            targetUserId: input.targetUserId,
          });

          return {
            chat: {
              id: dm.id,
              name: dm.name,
              isGroup: dm.isGroup,
              otherUserId: dm.otherUserId,
            },
            isNewChat: dm.isNewChat,
          };
        },
        (error) => {
          if (error.type === 'SELF_DM_ERROR') {
            throw new ORPCError('BAD_REQUEST', {
              message: error.message,
            });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/dms',
      tags: ['Direct Messages'],
      successStatus: 200,
    })
    .input(EmptyInputSchema)
    .output(ListDmsOutputSchema)
    .handler(async ({ context }) => {
      const result = await context.dmService.listDms(context.user.userId);

      return result.match(
        (dms) => ({
          chats: dms.map((dm) => ({
            id: dm.id,
            name: dm.name,
            isGroup: dm.isGroup,
            otherUserId: dm.otherUserId,
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
