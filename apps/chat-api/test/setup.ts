/**
 * Test Setup for Chat-API
 *
 * This module provides test infrastructure using:
 * - PGLite for in-memory PostgreSQL
 * - Drizzle migrations for schema
 * - redis-memory-server for in-memory Redis (no Docker required)
 */

import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { RedisClient } from 'bun';
import pino from 'pino';
import type { Context } from '../src/context';
import { createDb, type Database, runMigrations } from '../src/db/db';
import {
  chatAdminsTable,
  chatInvitesTable,
  chatModerationLogTable,
  chatParticipantsTable,
  chatsTable,
  dmAcceptancesTable,
  groupChatMembershipsTable,
  messagesTable,
} from '../src/db/schema/chat.db';
import {
  type ChatId,
  type MessageId,
  typeIdGenerator,
  type UserId,
} from '../src/db/typeid';
import type { Logger } from '../src/logger';
import {
  type ChatService,
  createChatService,
} from '../src/services/chat.service';
import { createDmService, type DmService } from '../src/services/dm.service';
import {
  createGroupService,
  type GroupService,
} from '../src/services/group.service';
import {
  createMessageService,
  type MessageService,
} from '../src/services/message.service';
import {
  createModerationService,
  type ModerationService,
} from '../src/services/moderation.service';
import { createTestRedisSetup, type RedisTestSetup } from './redis-test-server';

export type TestUser = {
  id: UserId;
  displayName: string;
  username: string;
};

export type TestSetup = {
  deps: {
    db: Database;
    pgLite: PGlite;
    logger: Logger;
    chatService: ChatService;
    dmService: DmService;
    messageService: MessageService;
    moderationService: ModerationService;
    groupService: GroupService;
    redisSetup: RedisTestSetup;
    redisClient: RedisClient;
  };
  users: {
    userA: TestUser;
    userB: TestUser;
  };
  helpers: TestHelpers;
  cleanup: () => Promise<void>;
  close: () => Promise<void>;
};

export type TestHelpers = {
  createDmChat: (userAId: UserId, userBId: UserId) => Promise<ChatId>;
  createGroupChat: (name: string, memberIds: UserId[]) => Promise<ChatId>;
  createMessage: (
    chatId: ChatId,
    senderId: UserId,
    content: string
  ) => Promise<MessageId>;
  createSubscriber: () => Promise<RedisClient>;
};

/**
 * Create a test logger (silent)
 */
function createTestLogger(): Logger {
  return pino({ level: 'silent' });
}

/**
 * Generate a test user ID
 */
function generateTestUserId(): UserId {
  return typeIdGenerator('user');
}

/**
 * Create PGLite instance and run Drizzle migrations
 */
async function createTestDatabase(logger: Logger): Promise<{
  pgLite: PGlite;
  db: Database;
}> {
  const pgLite = new PGlite({
    extensions: { uuid_ossp },
  });

  // Create drizzle instance with PGLite
  const db = createDb({
    config: {
      type: 'pglite',
      db: pgLite,
    },
  });

  // Run Drizzle migrations (creates all tables with correct schema)
  await runMigrations(db, logger);

  return { pgLite, db };
}

/**
 * Create test users
 */
function createTestUsers(): TestSetup['users'] {
  const userA: TestUser = {
    id: generateTestUserId(),
    displayName: 'Test User A',
    username: 'test_user_a',
  };

  const userB: TestUser = {
    id: generateTestUserId(),
    displayName: 'Test User B',
    username: 'test_user_b',
  };

  return { userA, userB };
}

/**
 * Create complete test setup
 */
export async function createTestSetup(): Promise<TestSetup> {
  const logger = createTestLogger();

  // Create in-memory Redis server (no Docker required)
  const redisSetup = await createTestRedisSetup();
  const redisClient = new RedisClient(redisSetup.url);
  await redisClient.connect();

  const { pgLite, db } = await createTestDatabase(logger);
  const users = createTestUsers();

  // Create services
  const chatService = createChatService({ db, logger });
  const dmService = createDmService({ db, logger });
  const messageService = createMessageService({
    db,
    logger,
    redis: redisClient,
  });
  const moderationService = createModerationService({ db, logger });
  const groupService = createGroupService({ db, logger });

  // Test helpers using Drizzle ORM (handles TypeID <-> UUID automatically)
  const helpers: TestHelpers = {
    /**
     * Create a DM chat between two users
     */
    createDmChat: async (userAId: UserId, userBId: UserId): Promise<ChatId> => {
      const chatId = typeIdGenerator('chat');

      // Create chat
      await db.insert(chatsTable).values({
        id: chatId,
        isGroup: false,
      });

      // Add both participants
      await db.insert(chatParticipantsTable).values([
        { chatId, userId: userAId },
        { chatId, userId: userBId },
      ]);

      return chatId;
    },

    /**
     * Create a group chat with members
     */
    createGroupChat: async (
      name: string,
      memberIds: UserId[]
    ): Promise<ChatId> => {
      const chatId = typeIdGenerator('chat');

      // Create chat
      await db.insert(chatsTable).values({
        id: chatId,
        name,
        isGroup: true,
      });

      // Add members to group_chat_memberships
      if (memberIds.length > 0) {
        await db.insert(groupChatMembershipsTable).values(
          memberIds.map((userId) => ({
            chatId,
            userId,
            npcAdminId: '',
          }))
        );
      }

      return chatId;
    },

    /**
     * Create a message in a chat
     */
    createMessage: async (
      chatId: ChatId,
      senderId: UserId,
      content: string
    ): Promise<MessageId> => {
      const messageId = typeIdGenerator('message');

      await db.insert(messagesTable).values({
        id: messageId,
        chatId,
        senderId,
        content,
      });

      return messageId;
    },

    /**
     * Create a Redis subscriber connection for testing pub/sub
     */
    createSubscriber: async (): Promise<RedisClient> => {
      return redisClient.duplicate();
    },
  };

  const cleanup = async () => {
    // Clear test data using Drizzle (respecting foreign keys)
    await db.delete(chatModerationLogTable);
    await db.delete(dmAcceptancesTable);
    await db.delete(chatInvitesTable);
    await db.delete(chatAdminsTable);
    await db.delete(groupChatMembershipsTable);
    await db.delete(chatParticipantsTable);
    await db.delete(messagesTable);
    await db.delete(chatsTable);
  };

  const close = async () => {
    redisClient.close();
    await redisSetup.shutdown();
    await pgLite.close();
  };

  return {
    deps: {
      db,
      pgLite,
      logger,
      chatService,
      dmService,
      messageService,
      moderationService,
      groupService,
      redisSetup,
      redisClient,
    },
    users,
    helpers,
    cleanup,
    close,
  };
}

/**
 * Create test context for oRPC handlers
 */
export async function createTestContext(options: {
  testSetup: TestSetup;
  userId?: string;
}): Promise<Context> {
  const { testSetup, userId } = options;
  const { deps } = testSetup;

  return {
    requestId: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    headers: new Headers(),
    user: userId
      ? {
          userId: userId as UserId,
          privyId: `test-privy-${userId}`,
          isAgent: false,
        }
      : null,
    db: deps.db,
    logger: deps.logger,
    redis: deps.redisClient,
    chatService: deps.chatService,
    dmService: deps.dmService,
    messageService: deps.messageService,
    moderationService: deps.moderationService,
    groupService: deps.groupService,
  };
}
