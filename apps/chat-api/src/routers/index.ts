import type { RouterClient } from '@orpc/server';
import { publicProcedure } from '../procedures';
import { chatRouter } from './chat.router';
import { dmRouter } from './dm.router';
import { groupRouter } from './group.router';
import { messageRouter } from './message.router';
import { moderationRouter } from './moderation.router';

export const appRouter = {
  // Health check
  healthCheck: publicProcedure.handler(() => ({
    status: 'ok',
    service: 'chat-api',
    timestamp: new Date().toISOString(),
  })),

  // Chat operations
  chat: chatRouter,

  // DM operations
  dm: dmRouter,

  // Message operations
  message: messageRouter,

  // Moderation operations
  moderation: moderationRouter,

  // Group operations
  group: groupRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
