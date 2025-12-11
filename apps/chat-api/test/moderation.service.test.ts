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

setDefaultTimeout(30_000);

describe('Moderation Service - Kick', () => {
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

  test('kicks user from chat', async () => {
    const { users, deps } = testSetup;

    // Create a DM chat first
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Kick user B
    const result = await deps.moderationService.kickUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Test kick'
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.action).toBe('kick');
      expect(result.value.targetUserId).toBe(users.userB.id);
    }
  });

  test('prevents self-kick', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    const result = await deps.moderationService.kickUser(
      users.userA.id,
      chatId,
      users.userA.id,
      'Self kick'
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('CANNOT_MODERATE_SELF');
    }
  });

  test('fails to kick non-participant', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;
    const userCId = typeIdGenerator('user');

    const result = await deps.moderationService.kickUser(
      users.userA.id,
      chatId,
      userCId,
      'Kick non-participant'
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('TARGET_NOT_FOUND');
    }
  });
});

describe('Moderation Service - Ban', () => {
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

  test('bans user from chat (permanent)', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    const result = await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Test ban'
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.action).toBe('ban');
    }

    // Verify user is banned
    const banCheck = await deps.moderationService.isUserBanned(
      users.userB.id,
      chatId
    );
    expect(banCheck.isOk()).toBe(true);
    if (banCheck.isOk()) {
      expect(banCheck.value).toBe(true);
    }
  });

  test('bans user with duration', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;
    const durationSeconds = 3600; // 1 hour

    const result = await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Timed ban',
      durationSeconds
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.action).toBe('ban');
    }
  });

  test('prevents double ban', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // First ban
    await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'First ban'
    );

    // Second ban should fail
    const result = await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Second ban'
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('ALREADY_BANNED');
    }
  });

  test('prevents self-ban', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    const result = await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userA.id,
      'Self ban'
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('CANNOT_MODERATE_SELF');
    }
  });
});

describe('Moderation Service - Unban', () => {
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

  test('unbans user from chat', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Ban first
    await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Test ban'
    );

    // Unban
    const result = await deps.moderationService.unbanUser(
      users.userA.id,
      chatId,
      users.userB.id
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.action).toBe('unban');
    }

    // Verify user is no longer banned
    const banCheck = await deps.moderationService.isUserBanned(
      users.userB.id,
      chatId
    );
    expect(banCheck.isOk()).toBe(true);
    if (banCheck.isOk()) {
      expect(banCheck.value).toBe(false);
    }
  });

  test('fails to unban non-banned user', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    const result = await deps.moderationService.unbanUser(
      users.userA.id,
      chatId,
      users.userB.id
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('NOT_BANNED');
    }
  });
});

describe('Moderation Service - Log', () => {
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

  test('retrieves moderation log', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Create some moderation actions
    await deps.moderationService.kickUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Kick 1'
    );

    // Re-add user B to chat for another kick
    await deps.dmService.createOrGetDm(users.userA.id, users.userB.id);
    await deps.moderationService.banUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Ban 1'
    );
    await deps.moderationService.unbanUser(
      users.userA.id,
      chatId,
      users.userB.id
    );

    // Get log
    const result = await deps.moderationService.getModerationLog(chatId);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(3);
      // Most recent first
      expect(result.value[0]!.action).toBe('unban');
      expect(result.value[1]!.action).toBe('ban');
      expect(result.value[2]!.action).toBe('kick');
    }
  });
});
