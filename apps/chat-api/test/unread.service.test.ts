import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from 'bun:test';
import { chatsTable, dmAcceptancesTable } from '../src/db/schema/chat.db';
import { typeIdGenerator } from '../src/db/typeid';
import { createTestSetup, type TestSetup } from './setup';

// Redis memory server can take time to start
setDefaultTimeout(30_000);

describe('Chat Service - Unread Count', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await createTestSetup();
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.close();
  });

  test('returns zero counts for user with no chats', async () => {
    const { users, deps } = testSetup;

    const result = await deps.chatService.getUnreadCount(users.userA.id);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.pendingDms).toBe(0);
      expect(result.value.hasNewMessages).toBe(false);
    }
  });

  test('returns hasNewMessages when there are recent messages from others', async () => {
    const { users, deps } = testSetup;

    // Create a DM chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Send a message from userB to userA
    await deps.messageService.sendMessage(
      users.userB.id,
      chatId,
      'Hello from B!'
    );

    // Check unread count for userA
    const result = await deps.chatService.getUnreadCount(users.userA.id);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.hasNewMessages).toBe(true);
    }
  });

  test('does not count own messages as unread', async () => {
    const { users, deps } = testSetup;

    // Create a DM chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Send a message from userA (to themselves essentially in the chat)
    await deps.messageService.sendMessage(
      users.userA.id,
      chatId,
      'Message from A'
    );

    // Check unread count for userA - should not count own messages
    const result = await deps.chatService.getUnreadCount(users.userA.id);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.hasNewMessages).toBe(false);
    }
  });

  test('counts pending DM acceptances', async () => {
    const { users, deps } = testSetup;

    // Create a pending DM acceptance directly in the database
    const chatId = typeIdGenerator('chat');

    // Create the chat first using Drizzle ORM
    await deps.db.insert(chatsTable).values({
      id: chatId,
      isGroup: false,
    });

    // Create a pending DM acceptance where userA is the recipient
    await deps.db.insert(dmAcceptancesTable).values({
      chatId,
      userId: users.userA.id,
      otherUserId: users.userB.id,
      status: 'pending',
    });

    // Check unread count for userA
    const result = await deps.chatService.getUnreadCount(users.userA.id);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.pendingDms).toBe(1);
    }
  });

  test('does not count accepted DM acceptances', async () => {
    const { users, deps } = testSetup;

    // Create an accepted DM acceptance
    const chatId = typeIdGenerator('chat');

    // Create the chat first using Drizzle ORM
    await deps.db.insert(chatsTable).values({
      id: chatId,
      isGroup: false,
    });

    // Create an accepted DM acceptance
    await deps.db.insert(dmAcceptancesTable).values({
      chatId,
      userId: users.userA.id,
      otherUserId: users.userB.id,
      status: 'accepted',
    });

    // Check unread count for userA
    const result = await deps.chatService.getUnreadCount(users.userA.id);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.pendingDms).toBe(0);
    }
  });
});

describe('Chat Service - Get Participants', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await createTestSetup();
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.close();
  });

  test('returns participants for DM chat', async () => {
    const { users, deps } = testSetup;

    // Create a DM chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Get participants as userA
    const result = await deps.chatService.getParticipants(
      users.userA.id,
      chatId
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
      const ids = result.value.map((p) => p.id);
      expect(ids).toContain(users.userA.id);
      expect(ids).toContain(users.userB.id);
    }
  });

  test('denies access to non-participant', async () => {
    const { users, deps } = testSetup;

    // Create a DM chat between userA and userB
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Try to get participants as a third user
    const userCId = typeIdGenerator('user');
    const result = await deps.chatService.getParticipants(userCId, chatId);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('ACCESS_DENIED');
    }
  });

  test('returns 404 for non-existent chat', async () => {
    const { users, deps } = testSetup;

    const fakeChatId = typeIdGenerator('chat');

    const result = await deps.chatService.getParticipants(
      users.userA.id,
      fakeChatId
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('CHAT_NOT_FOUND');
    }
  });

  test('returns participants for group chat', async () => {
    const { users, deps, helpers } = testSetup;

    // Create a group chat with both users
    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
      users.userB.id,
    ]);

    // Get participants as userA
    const result = await deps.chatService.getParticipants(
      users.userA.id,
      chatId
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
    }
  });
});
