import { RedisClient } from 'bun';
import { eq } from 'drizzle-orm';
import { createApp } from './app';
import type { UserLookupFn } from './context';
import { createDb, type Database } from './db/db';
import { chatUsersTable } from './db/schema';
import { typeIdGenerator, type UserId } from './db/typeid';
import { env } from './env';
import { logger } from './logger';
import { createChatService } from './services/chat.service';
import { createDmService } from './services/dm.service';
import { createGroupService } from './services/group.service';
import { createMessageService } from './services/message.service';
import { createModerationService } from './services/moderation.service';

/**
 * Create user lookup function for Privy auth
 * Queries the local chat_users table and creates user if not exists
 */
function createUserLookup(db: Database): UserLookupFn {
  return async (privyId: string, walletAddress?: string) => {
    // Try to find existing user
    const existing = await db.query.chatUsersTable.findFirst({
      where: eq(chatUsersTable.privyId, privyId),
    });

    if (existing) {
      return {
        id: existing.id,
        walletAddress: existing.walletAddress,
        isAgent: false, // chat-api users are always human for now
      };
    }

    // Create new user if not found
    const newUserId = typeIdGenerator('user');
    const result = await db
      .insert(chatUsersTable)
      .values({
        id: newUserId as UserId,
        privyId,
        walletAddress: walletAddress ?? null,
      })
      .returning();

    const created = result[0];
    if (!created) {
      throw new Error('Failed to create user');
    }

    logger.info({
      msg: 'Created new chat user',
      userId: created.id,
      privyId,
    });

    return {
      id: created.id,
      walletAddress: created.walletAddress,
      isAgent: false,
    };
  };
}

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

  // Create user lookup function (uses local chat DB)
  const lookupUserByPrivyId = createUserLookup(db);

  // Create services
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
    chatService,
    dmService,
    messageService,
    moderationService,
    groupService,
    lookupUserByPrivyId,
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
export type { AppRouter, AppRouterClient } from './routers';
