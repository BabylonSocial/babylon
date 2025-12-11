import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from 'bun:test';
import { createTestSetup, type TestSetup } from './setup';

// Redis memory server can take time to start
setDefaultTimeout(30_000);

describe('DM Service', () => {
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

  test('creates a new DM chat between two users', async () => {
    const result = await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userA.id,
      testSetup.users.userB.id
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBeDefined();
      expect(result.value.isGroup).toBe(false);
      expect(result.value.isNewChat).toBe(true);
      expect(result.value.otherUserId).toBe(testSetup.users.userB.id);
    }
  });

  test('returns existing DM chat for same participants (idempotent)', async () => {
    // First call creates the chat
    const result1 = await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userA.id,
      testSetup.users.userB.id
    );

    expect(result1.isOk()).toBe(true);
    if (result1.isOk()) {
      expect(result1.value.isNewChat).toBe(true);
    }

    // Second call returns existing chat
    const result2 = await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userA.id,
      testSetup.users.userB.id
    );

    expect(result2.isOk()).toBe(true);
    if (result1.isOk() && result2.isOk()) {
      expect(result2.value.isNewChat).toBe(false);
      expect(result2.value.id).toBe(result1.value.id);
    }
  });

  test('generates consistent chat ID regardless of who initiates', async () => {
    // User A initiates
    const resultA = await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userA.id,
      testSetup.users.userB.id
    );

    // User B initiates with same pair
    const resultB = await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userB.id,
      testSetup.users.userA.id
    );

    expect(resultA.isOk()).toBe(true);
    expect(resultB.isOk()).toBe(true);
    if (resultA.isOk() && resultB.isOk()) {
      // Should be the same chat
      expect(resultA.value.id).toBe(resultB.value.id);
    }
  });

  test('prevents self-DM', async () => {
    const result = await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userA.id,
      testSetup.users.userA.id
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('SELF_DM_ERROR');
    }
  });

  test('lists DM chats for user', async () => {
    // Create a DM first
    await testSetup.deps.dmService.createOrGetDm(
      testSetup.users.userA.id,
      testSetup.users.userB.id
    );

    // List DMs
    const result = await testSetup.deps.dmService.listDms(
      testSetup.users.userA.id
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeDefined();
      expect(result.value.length).toBeGreaterThanOrEqual(1);
      expect(result.value[0]!.otherUserId).toBe(testSetup.users.userB.id);
    }
  });
});
