import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from 'bun:test';
import { typeIdGenerator } from '../src/db/typeid';
import { createTestSetup, type TestSetup } from './setup';

// Redis memory server can take time to start
setDefaultTimeout(30_000);

describe('Message Service - List', () => {
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

  test('list returns messages with pagination', async () => {
    const { users, deps } = testSetup;

    // Create a DM chat first
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Send some messages
    await deps.messageService.sendMessage(users.userA.id, chatId, 'Message 1');
    await deps.messageService.sendMessage(users.userA.id, chatId, 'Message 2');
    await deps.messageService.sendMessage(users.userB.id, chatId, 'Message 3');

    // List messages
    const result = await deps.messageService.listMessages(
      users.userA.id,
      chatId,
      { limit: 10 }
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.messages).toBeDefined();
      expect(result.value.messages.length).toBe(3);
      expect(result.value.pagination).toBeDefined();
    }
  });

  test('list denies access to non-participant', async () => {
    const { users, deps } = testSetup;

    // Create chat between userA and userB
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Create a third user who is not a participant (properly typed)
    const userCId = typeIdGenerator('user');

    // Try to list - should fail
    const result = await deps.messageService.listMessages(userCId, chatId, {});

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('ACCESS_DENIED');
    }
  });
});

describe('Message Service - Send', () => {
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

  test('send creates message in database', async () => {
    const { users, deps } = testSetup;

    // Create chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Send message
    const result = await deps.messageService.sendMessage(
      users.userA.id,
      chatId,
      'Hello from test!'
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBeDefined();
      expect(result.value.message.content).toBe('Hello from test!');
      expect(result.value.message.senderId).toBe(users.userA.id);
      expect(result.value.message.chatId).toBe(chatId);
      expect(result.value.chat).toBeDefined();
    }
  });

  test('send denies access to non-participant', async () => {
    const { users, deps } = testSetup;

    // Create chat between A and B
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Create a non-participant user (properly typed)
    const userCId = typeIdGenerator('user');

    // Try to send - should fail
    const result = await deps.messageService.sendMessage(
      userCId,
      chatId,
      'Should fail'
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('ACCESS_DENIED');
    }
  });
});

describe('Message Service - Access Verification', () => {
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

  test('verifyAccess allows participants', async () => {
    const { users, deps } = testSetup;

    // Create chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Both users should have access
    const resultA = await deps.messageService.verifyAccess(
      users.userA.id,
      chatId
    );
    const resultB = await deps.messageService.verifyAccess(
      users.userB.id,
      chatId
    );

    expect(resultA.isOk()).toBe(true);
    expect(resultB.isOk()).toBe(true);
  });

  test('verifyAccess denies non-participants', async () => {
    const { users, deps } = testSetup;

    // Create chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Create a non-participant user (properly typed)
    const userCId = typeIdGenerator('user');

    const result = await deps.messageService.verifyAccess(userCId, chatId);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('ACCESS_DENIED');
    }
  });
});
