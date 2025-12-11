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

describe('Group Service - Add Members', () => {
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

  test('adds members to group chat', async () => {
    const { users, deps, helpers } = testSetup;

    // Create group with userA
    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);

    // Add userB
    const userCId = typeIdGenerator('user');
    const result = await deps.groupService.addMembers(users.userA.id, chatId, [
      users.userB.id,
      userCId,
    ]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.added).toContain(users.userB.id);
      expect(result.value.added).toContain(userCId);
    }
  });

  test('prevents adding to non-group chat', async () => {
    const { users, deps } = testSetup;

    // Create DM instead of group
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const userCId = typeIdGenerator('user');
    const result = await deps.groupService.addMembers(
      users.userA.id,
      dmResult.value.id,
      [userCId]
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('NOT_GROUP_CHAT');
    }
  });

  test('skips already existing members', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
      users.userB.id,
    ]);

    // Try to add userB again
    const result = await deps.groupService.addMembers(users.userA.id, chatId, [
      users.userB.id,
    ]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.added.length).toBe(0); // Already exists
    }
  });
});

describe('Group Service - Remove Member', () => {
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

  test('removes member from group', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
      users.userB.id,
    ]);

    const result = await deps.groupService.removeMember(
      users.userA.id,
      chatId,
      users.userB.id,
      'Test removal'
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.removed).toBe(true);
    }
  });

  test('fails to remove non-member', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);
    const userCId = typeIdGenerator('user');

    const result = await deps.groupService.removeMember(
      users.userA.id,
      chatId,
      userCId,
      'Test removal'
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('USER_NOT_MEMBER');
    }
  });
});

describe('Group Service - Invites', () => {
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

  test('creates invite for user', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);

    const result = await deps.groupService.inviteUser(
      users.userA.id,
      chatId,
      users.userB.id,
      'Join us!'
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.invitedUserId).toBe(users.userB.id);
      expect(result.value.status).toBe('pending');
      expect(result.value.message).toBe('Join us!');
    }
  });

  test('prevents duplicate invite', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);

    // First invite
    await deps.groupService.inviteUser(users.userA.id, chatId, users.userB.id);

    // Second invite should fail
    const result = await deps.groupService.inviteUser(
      users.userA.id,
      chatId,
      users.userB.id
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('INVITE_ALREADY_EXISTS');
    }
  });

  test('prevents invite for existing member', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
      users.userB.id,
    ]);

    const result = await deps.groupService.inviteUser(
      users.userA.id,
      chatId,
      users.userB.id
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('USER_ALREADY_MEMBER');
    }
  });

  test('accepts invite and joins group', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);

    // Create invite
    const inviteResult = await deps.groupService.inviteUser(
      users.userA.id,
      chatId,
      users.userB.id
    );
    expect(inviteResult.isOk()).toBe(true);
    if (!inviteResult.isOk()) return;

    // Accept invite
    const result = await deps.groupService.respondToInvite(
      users.userB.id,
      inviteResult.value.id,
      true
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.accepted).toBe(true);
      expect(result.value.chatId).toBe(chatId);
    }

    // Verify user is now a member
    const membersResult = await deps.groupService.listMembers(
      users.userB.id,
      chatId
    );
    expect(membersResult.isOk()).toBe(true);
  });

  test('rejects invite', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);

    const inviteResult = await deps.groupService.inviteUser(
      users.userA.id,
      chatId,
      users.userB.id
    );
    expect(inviteResult.isOk()).toBe(true);
    if (!inviteResult.isOk()) return;

    const result = await deps.groupService.respondToInvite(
      users.userB.id,
      inviteResult.value.id,
      false
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.accepted).toBe(false);
    }
  });

  test('lists pending invites', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);

    await deps.groupService.inviteUser(users.userA.id, chatId, users.userB.id);

    const result = await deps.groupService.listInvites(users.userB.id);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]!.chatId).toBe(chatId);
    }
  });
});

describe('Group Service - List Members', () => {
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

  test('lists group members', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
      users.userB.id,
    ]);

    const result = await deps.groupService.listMembers(users.userA.id, chatId);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
      const memberIds = result.value.map((m) => m.userId);
      expect(memberIds).toContain(users.userA.id);
      expect(memberIds).toContain(users.userB.id);
    }
  });

  test('denies access to non-members', async () => {
    const { users, deps, helpers } = testSetup;

    const chatId = await helpers.createGroupChat('Test Group', [
      users.userA.id,
    ]);
    const userCId = typeIdGenerator('user');

    const result = await deps.groupService.listMembers(userCId, chatId);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('ACCESS_DENIED');
    }
  });
});
