import { eventIterator, ORPCError } from '@orpc/server';
import { z } from 'zod';
import type { ChatId } from '../db/typeid';
import { protectedProcedure } from '../procedures';
import {
  ListMessagesOutputSchema,
  SendMessageOutputSchema,
} from './schemas.zod';

// Input schemas
const ListMessagesInputSchema = z.object({
  chatId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  sinceMessageId: z.string().optional(), // For client cache sync
});

const SendMessageInputSchema = z.object({
  chatId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

const SubscribeMessagesInputSchema = z.object({
  chatId: z.string().min(1),
});

// Message event schema for SSE
const MessageEventSchema = z.object({
  type: z.enum(['message', 'typing', 'read', 'ping']),
  data: z.object({
    id: z.string().optional(),
    chatId: z.string(),
    senderId: z.string().optional(),
    content: z.string().optional(),
    createdAt: z.string().optional(),
  }),
});

export const messageRouter = {
  list: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}/messages',
      tags: ['Messages'],
      successStatus: 200,
    })
    .input(ListMessagesInputSchema)
    .output(ListMessagesOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.messageService.listMessages(
        context.user.userId,
        input.chatId as ChatId,
        {
          cursor: input.cursor,
          limit: input.limit,
          sinceMessageId: input.sinceMessageId,
        }
      );

      return result.match(
        (data) => data,
        (error) => {
          if (
            error.type === 'CHAT_NOT_FOUND' ||
            error.type === 'ACCESS_DENIED'
          ) {
            throw new ORPCError('NOT_FOUND', {
              message: error.message,
            });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
      );
    }),

  send: protectedProcedure
    .route({
      method: 'POST',
      path: '/chats/{chatId}/messages',
      tags: ['Messages'],
      successStatus: 201,
    })
    .input(SendMessageInputSchema)
    .output(SendMessageOutputSchema)
    .handler(async ({ input, context }) => {
      const result = await context.messageService.sendMessage(
        context.user.userId,
        input.chatId as ChatId,
        input.content
      );

      return result.match(
        (data) => {
          context.logger.info({
            msg: 'Message sent',
            messageId: data.message.id,
            chatId: input.chatId,
            userId: context.user.userId,
          });
          return data;
        },
        (error) => {
          if (error.type === 'CHAT_NOT_FOUND') {
            throw new ORPCError('NOT_FOUND', {
              message: error.message,
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

  subscribe: protectedProcedure
    .route({
      method: 'GET',
      path: '/chats/{chatId}/messages/subscribe',
      tags: ['Messages'],
      successStatus: 200,
    })
    .input(SubscribeMessagesInputSchema)
    .output(eventIterator(MessageEventSchema))
    .handler(async function* ({ input, context }) {
      const chatId = input.chatId as ChatId;

      // Verify user has access to this chat
      const accessResult = await context.messageService.verifyAccess(
        context.user.userId,
        chatId
      );

      if (accessResult.isErr()) {
        throw new ORPCError('FORBIDDEN', {
          message: 'Access denied to this chat',
        });
      }

      context.logger.info({
        msg: 'SSE subscription started',
        chatId,
        userId: context.user.userId,
      });

      // Send initial ping to confirm connection
      yield {
        type: 'ping' as const,
        data: {
          chatId: input.chatId,
        },
      };

      // Create dedicated subscriber connection
      const subscriber = await context.redis.duplicate();

      // Async queue to bridge Redis callback → async generator
      const queue: Array<z.infer<typeof MessageEventSchema>> = [];
      let resolver: (() => void) | null = null;
      let closed = false;

      const channel = `chat:${chatId}`;

      try {
        await subscriber.subscribe(channel, (payload: string) => {
          if (closed) return;

          try {
            const event = JSON.parse(payload) as z.infer<
              typeof MessageEventSchema
            >;
            queue.push(event);
            resolver?.();
          } catch (e) {
            context.logger.error({
              msg: 'Failed to parse Redis message',
              error: e,
            });
          }
        });

        // Yield messages as they arrive
        const PING_INTERVAL = 30000;
        let lastPing = Date.now();

        while (!closed) {
          // Wait for message or timeout for ping
          if (queue.length === 0) {
            await Promise.race([
              new Promise<void>((resolve) => {
                resolver = resolve;
              }),
              new Promise<void>((resolve) =>
                setTimeout(resolve, PING_INTERVAL)
              ),
            ]);
            resolver = null;
          }

          // Yield all queued messages
          while (queue.length > 0) {
            const event = queue.shift()!;
            yield event;
          }

          // Send periodic ping
          if (Date.now() - lastPing > PING_INTERVAL) {
            yield {
              type: 'ping' as const,
              data: { chatId: input.chatId },
            };
            lastPing = Date.now();
          }
        }
      } finally {
        closed = true;
        subscriber.close();
        context.logger.info({
          msg: 'SSE subscription ended',
          chatId,
          userId: context.user.userId,
        });
      }
    }),
};
