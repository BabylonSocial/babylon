import { RedisClient } from 'bun';
import { createApp } from './app';
import { createDb } from './db/db';
import { env } from './env';
import { logger } from './logger';
import { createChatService } from './services/chat.service';
import { createDmService } from './services/dm.service';
import { createGroupService } from './services/group.service';
import { createMessageService } from './services/message.service';
import { createModerationService } from './services/moderation.service';
import { createUserService } from './services/user.service';

async function main() {
  logger.info({ msg: 'Starting chat-api', env: env.NODE_ENV, port: env.PORT });

  // Create database connection (for chat tables)
  const db = createDb({
    config: {
      type: 'pg',
      databaseUrl: env.DATABASE_URL,
    },
  });

  // Create Redis client (required for pub/sub)
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is required');
  }
  const redis = new RedisClient(env.REDIS_URL);
  await redis.connect();
  logger.info({ msg: 'Redis connected', url: env.REDIS_URL });

  // Create services
  const userService = createUserService({ db, logger });
  const chatService = createChatService({ db, logger });
  const dmService = createDmService({ db, logger });
  const messageService = createMessageService({ db, logger, redis });
  const moderationService = createModerationService({ db, logger });
  const groupService = createGroupService({ db, logger });

  // Create app with dependencies
  const app = await createApp({
    db,
    logger,
    redis,
    userService,
    chatService,
    dmService,
    messageService,
    moderationService,
    groupService,
  });

  // Start server
  const server = Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  });

  logger.info({
    msg: 'Chat-api server started',
    url: `http://localhost:${server.port}`,
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info({ msg: 'Shutting down chat-api' });
    server.stop();
    redis.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error({ msg: 'Failed to start chat-api', error });
  process.exit(1);
});

export type { Context } from './context';
// Re-export types for client usage
export type { AppRouter, AppRouterClient } from './routers/routers';
