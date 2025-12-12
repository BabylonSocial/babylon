import type { RouterClient } from '@orpc/server';
import { publicProcedure } from '../procedures';
import { chatRouter } from './chat.router';
import { dmRouter } from './dm.router';
import { groupRouter } from './group.router';
import { messageRouter } from './message.router';
import { moderationRouter } from './moderation.router';
import { EmptyInputSchema, HealthCheckOutputSchema } from './schemas.zod';

export const appRouter = {
  healthCheck: publicProcedure
    .route({ method: 'GET', path: '/health', successStatus: 200 })
    .input(EmptyInputSchema)
    .output(HealthCheckOutputSchema)
    .handler(() => ({
      status: 'ok' as const,
      service: 'chat-api' as const,
      timestamp: new Date().toISOString(),
    })),

  chat: chatRouter,
  dm: dmRouter,
  message: messageRouter,
  moderation: moderationRouter,
  group: groupRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
