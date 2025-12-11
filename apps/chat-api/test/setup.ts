/**
 * Test Setup for Chat-API
 *
 * This module provides test infrastructure using:
 * - PGLite for in-memory PostgreSQL
 * - redis-memory-server for in-memory Redis (no Docker required)
 */

import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { RedisClient } from 'bun';
import pino from 'pino';
import type { Context } from '../src/context';
import { createDb, type Database } from '../src/db/db';
import {
  type ChatId,
  type MessageId,
  typeIdGenerator,
  typeIdToUuid,
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
 * Create PGLite instance and initialize schema
 */
async function createTestDatabase(): Promise<{
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

  // Create tables manually for tests (since we don't have migrations yet)
  await pgLite.exec(`
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Chats table
    CREATE TABLE IF NOT EXISTS chats (
      id UUID PRIMARY KEY,
      name TEXT,
      description TEXT,
      is_group BOOLEAN NOT NULL DEFAULT false,
      created_by TEXT,
      npc_admin_id TEXT,
      game_id TEXT,
      day_number INTEGER,
      related_question INTEGER,
      group_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Chat participants table
    CREATE TABLE IF NOT EXISTS chat_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      invited_by TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_message_at TIMESTAMPTZ DEFAULT NOW(),
      message_count INTEGER NOT NULL DEFAULT 0,
      quality_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      kicked_at TIMESTAMPTZ,
      kick_reason TEXT,
      added_by TEXT,
      UNIQUE(chat_id, user_id)
    );

    -- Chat admins table
    CREATE TABLE IF NOT EXISTS chat_admins (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      granted_by TEXT NOT NULL,
      UNIQUE(chat_id, user_id)
    );

    -- Chat invites table
    CREATE TABLE IF NOT EXISTS chat_invites (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      invited_user_id TEXT NOT NULL,
      invited_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      message TEXT,
      invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      responded_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(chat_id, invited_user_id)
    );

    -- Group chat memberships table
    CREATE TABLE IF NOT EXISTS group_chat_memberships (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      npc_admin_id TEXT NOT NULL,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_message_at TIMESTAMPTZ DEFAULT NOW(),
      message_count INTEGER NOT NULL DEFAULT 0,
      quality_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sweep_reason TEXT,
      removed_at TIMESTAMPTZ,
      UNIQUE(user_id, chat_id)
    );

    -- DM acceptances table
    CREATE TABLE IF NOT EXISTS dm_acceptances (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID NOT NULL UNIQUE REFERENCES chats(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      other_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      accepted_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ
    );

    -- Chat moderation log table
    CREATE TABLE IF NOT EXISTS chat_moderation_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      target_user_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      duration INTEGER,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS chats_game_id_day_idx ON chats(game_id, day_number);
    CREATE INDEX IF NOT EXISTS chats_is_group_idx ON chats(is_group);
    CREATE INDEX IF NOT EXISTS messages_chat_created_idx ON messages(chat_id, created_at);
    CREATE INDEX IF NOT EXISTS chat_participants_chat_idx ON chat_participants(chat_id);
    CREATE INDEX IF NOT EXISTS chat_participants_user_idx ON chat_participants(user_id);
    CREATE INDEX IF NOT EXISTS group_memberships_chat_active_idx ON group_chat_memberships(chat_id, is_active);
    CREATE INDEX IF NOT EXISTS group_memberships_user_active_idx ON group_chat_memberships(user_id, is_active);
  `);

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

  const { pgLite, db } = await createTestDatabase();
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

  // Test helpers
  const helpers: TestHelpers = {
    /**
     * Create a DM chat between two users
     */
    createDmChat: async (userAId: UserId, userBId: UserId): Promise<ChatId> => {
      // Sort user IDs to generate consistent chat ID
      const [u1, u2] = [userAId, userBId].sort();
      const chatId = typeIdGenerator('chat');
      const { uuid: chatUuid } = typeIdToUuid(chatId);

      await pgLite.exec(`
        INSERT INTO chats (id, is_group, created_at, updated_at)
        VALUES ('${chatUuid}', false, NOW(), NOW())
      `);

      // Add both participants
      await pgLite.exec(`
        INSERT INTO chat_participants (chat_id, user_id, joined_at)
        VALUES
          ('${chatUuid}', '${u1}', NOW()),
          ('${chatUuid}', '${u2}', NOW())
      `);

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
      const { uuid: chatUuid } = typeIdToUuid(chatId);

      await pgLite.exec(`
        INSERT INTO chats (id, name, is_group, created_at, updated_at)
        VALUES ('${chatUuid}', '${name}', true, NOW(), NOW())
      `);

      // Add members to group_chat_memberships
      // Convert TypeID to UUID for storage to match drizzle's typeId column
      for (const memberId of memberIds) {
        const { uuid: memberUuid } = typeIdToUuid(memberId);
        await pgLite.exec(`
          INSERT INTO group_chat_memberships (chat_id, user_id, npc_admin_id, joined_at, is_active)
          VALUES ('${chatUuid}', '${memberUuid}', '', NOW(), true)
        `);
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
      const { uuid: messageUuid } = typeIdToUuid(messageId);
      const { uuid: chatUuid } = typeIdToUuid(chatId);

      await pgLite.exec(`
        INSERT INTO messages (id, chat_id, sender_id, content, created_at, updated_at)
        VALUES ('${messageUuid}', '${chatUuid}', '${senderId}', '${content}', NOW(), NOW())
      `);

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
    // Clear test data in correct order (respecting foreign keys)
    await pgLite.exec(`
      DELETE FROM chat_moderation_log;
      DELETE FROM dm_acceptances;
      DELETE FROM chat_invites;
      DELETE FROM chat_admins;
      DELETE FROM group_chat_memberships;
      DELETE FROM chat_participants;
      DELETE FROM messages;
      DELETE FROM chats;
    `);
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
