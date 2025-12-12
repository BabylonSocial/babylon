/**
 * MCP Server Tests
 *
 * Tests MCP tools using InMemoryTransport from the official SDK.
 * This allows testing the full MCP protocol without network overhead.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { typeIdGenerator } from '../src/db/typeid';
import { type ChatMcpServer, createChatMcpServer } from '../src/mcp/server';
import { createTestSetup, type TestSetup } from './setup';

// Redis memory server can take time to start
setDefaultTimeout(30_000);

/**
 * Helper to create MCP test context with proper lifecycle management.
 * Returns getters to access test fixtures after beforeAll runs.
 */
function createMcpTestContext() {
  let testSetup: TestSetup;
  let mcpServer: ChatMcpServer;
  let client: Client;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    mcpServer = createChatMcpServer({
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      logger: testSetup.deps.logger,
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await mcpServer.server.connect(serverTransport);

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.server.close();
    await testSetup.close();
  });

  return {
    get setup() {
      return testSetup;
    },
    get mcp() {
      return mcpServer;
    },
    get client() {
      return client;
    },
  };
}

describe('MCP Server - Tool Discovery', () => {
  let testSetup: TestSetup;
  let mcpServer: ChatMcpServer;
  let client: Client;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    // Create MCP server with real services
    mcpServer = createChatMcpServer({
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      logger: testSetup.deps.logger,
    });

    // Create linked transports for in-memory communication
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    // Connect server and client
    await mcpServer.server.connect(serverTransport);

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.server.close();
    await testSetup.close();
  });

  test('lists all available tools', async () => {
    const result = await client.listTools();

    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBe(8);

    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain('list_chats');
    expect(toolNames).toContain('get_chat');
    expect(toolNames).toContain('create_chat');
    expect(toolNames).toContain('leave_chat');
    expect(toolNames).toContain('create_dm');
    expect(toolNames).toContain('list_dms');
    expect(toolNames).toContain('list_messages');
    expect(toolNames).toContain('send_message');
  });

  test('tool schemas have correct structure', async () => {
    const result = await client.listTools();

    const sendMessageTool = result.tools.find((t) => t.name === 'send_message');
    expect(sendMessageTool).toBeDefined();
    expect(sendMessageTool?.inputSchema).toBeDefined();
    expect(sendMessageTool?.inputSchema.properties).toHaveProperty('chatId');
    expect(sendMessageTool?.inputSchema.properties).toHaveProperty('content');
    expect(sendMessageTool?.inputSchema.required).toContain('chatId');
    expect(sendMessageTool?.inputSchema.required).toContain('content');
  });
});

describe('MCP Server - Authentication', () => {
  let testSetup: TestSetup;
  let mcpServer: ChatMcpServer;
  let client: Client;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    mcpServer = createChatMcpServer({
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      logger: testSetup.deps.logger,
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await mcpServer.server.connect(serverTransport);

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.server.close();
    await testSetup.close();
  });

  test('rejects unauthenticated tool calls', async () => {
    // Clear any authenticated user
    mcpServer.setAuthenticatedUser(null);

    const result = await client.callTool({
      name: 'list_chats',
      arguments: {},
    });

    expect(result.isError).toBe(true);
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    expect(content.type).toBe('text');
    if (content.type === 'text') {
      expect(content.text).toContain('Authentication required');
    }
  });

  test('accepts authenticated tool calls', async () => {
    const { users } = testSetup;

    // Set authenticated user
    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'list_chats',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    expect(content.type).toBe('text');
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data).toHaveProperty('groupChats');
      expect(data).toHaveProperty('directChats');
    }
  });
});

describe('MCP Server - Chat Tools', () => {
  let testSetup: TestSetup;
  let mcpServer: ChatMcpServer;
  let client: Client;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    mcpServer = createChatMcpServer({
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      logger: testSetup.deps.logger,
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await mcpServer.server.connect(serverTransport);

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.server.close();
    await testSetup.close();
  });

  test('list_chats returns empty lists for new user', async () => {
    const { users } = testSetup;
    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'list_chats',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.groupChats).toEqual([]);
      expect(data.directChats).toEqual([]);
    }
  });

  test('create_dm creates a new DM chat', async () => {
    const { users } = testSetup;
    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'create_dm',
      arguments: {
        targetUserId: users.userB.id,
      },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.id).toBeDefined();
      expect(data.id).toMatch(/^cht_/); // TypeID format
      expect(data.isGroup).toBe(false);
      expect(data.otherUserId).toBe(users.userB.id);
      expect(data.isNewChat).toBe(true);
    }
  });

  test('create_dm returns existing chat on second call', async () => {
    const { users } = testSetup;
    mcpServer.setAuthenticatedUser(users.userA.id);

    // First call - creates new DM
    const result1 = await client.callTool({
      name: 'create_dm',
      arguments: { targetUserId: users.userB.id },
    });

    // Second call - returns existing DM
    const result2 = await client.callTool({
      name: 'create_dm',
      arguments: { targetUserId: users.userB.id },
    });

    expect(result1.isError).toBeFalsy();
    expect(result2.isError).toBeFalsy();

    if (!('content' in result1)) throw new Error('Expected content');
    if (!('content' in result2)) throw new Error('Expected content');
    const content1 = result1.content[0];
    const content2 = result2.content[0];

    if (content1.type === 'text' && content2.type === 'text') {
      const data1 = JSON.parse(content1.text);
      const data2 = JSON.parse(content2.text);

      expect(data1.id).toBe(data2.id); // Same chat
      expect(data1.isNewChat).toBe(true);
      expect(data2.isNewChat).toBe(false);
    }
  });

  test('create_dm rejects self-DM', async () => {
    const { users } = testSetup;
    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'create_dm',
      arguments: {
        targetUserId: users.userA.id, // Same user
      },
    });

    expect(result.isError).toBe(true);
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      expect(content.text).toContain('Cannot DM yourself');
    }
  });
});

describe('MCP Server - Message Tools', () => {
  let testSetup: TestSetup;
  let mcpServer: ChatMcpServer;
  let client: Client;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    mcpServer = createChatMcpServer({
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      logger: testSetup.deps.logger,
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await mcpServer.server.connect(serverTransport);

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.server.close();
    await testSetup.close();
  });

  test('send_message creates message in chat', async () => {
    const { users, deps } = testSetup;

    // Create a DM first using service directly
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Send message via MCP
    mcpServer.setAuthenticatedUser(users.userA.id);
    const result = await client.callTool({
      name: 'send_message',
      arguments: {
        chatId,
        content: 'Hello from MCP!',
      },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.message).toBeDefined();
      expect(data.message.content).toBe('Hello from MCP!');
      expect(data.message.senderId).toBe(users.userA.id);
      expect(data.message.chatId).toBe(chatId);
    }
  });

  test('list_messages returns messages with pagination', async () => {
    const { users, deps } = testSetup;

    // Create chat and send messages
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Send messages via service
    await deps.messageService.sendMessage(users.userA.id, chatId, 'Message 1');
    await deps.messageService.sendMessage(users.userB.id, chatId, 'Message 2');
    await deps.messageService.sendMessage(users.userA.id, chatId, 'Message 3');

    // List via MCP
    mcpServer.setAuthenticatedUser(users.userA.id);
    const result = await client.callTool({
      name: 'list_messages',
      arguments: {
        chatId,
        limit: 10,
      },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.messages).toBeDefined();
      expect(data.messages.length).toBe(3);
      expect(data.pagination).toBeDefined();
    }
  });

  test('send_message denies access to non-participant', async () => {
    const { users, deps } = testSetup;

    // Create chat between A and B
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Try to send as userC (not a participant)
    const userCId = typeIdGenerator('user');
    mcpServer.setAuthenticatedUser(userCId);

    const result = await client.callTool({
      name: 'send_message',
      arguments: {
        chatId,
        content: 'Should fail',
      },
    });

    expect(result.isError).toBe(true);
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      expect(content.text).toContain('Access denied');
    }
  });

  test('get_chat returns chat details', async () => {
    const { users, deps } = testSetup;

    // Create DM
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    expect(dmResult.isOk()).toBe(true);
    if (!dmResult.isOk()) return;

    const chatId = dmResult.value.id;

    // Get chat via MCP
    mcpServer.setAuthenticatedUser(users.userA.id);
    const result = await client.callTool({
      name: 'get_chat',
      arguments: { chatId },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.id).toBe(chatId);
      expect(data.isGroup).toBe(false);
      expect(data.participantIds).toContain(users.userA.id);
      expect(data.participantIds).toContain(users.userB.id);
    }
  });
});

describe('MCP Server - Input Validation', () => {
  let testSetup: TestSetup;
  let mcpServer: ChatMcpServer;
  let client: Client;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    mcpServer = createChatMcpServer({
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      logger: testSetup.deps.logger,
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await mcpServer.server.connect(serverTransport);

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await mcpServer.server.close();
    await testSetup.close();
  });

  test('rejects invalid chatId format', async () => {
    const { users } = testSetup;
    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'get_chat',
      arguments: {
        chatId: 'invalid-format', // Not a TypeID
      },
    });

    // Should error due to Zod validation
    expect(result.isError).toBe(true);
  });

  test('rejects empty message content', async () => {
    const { users, deps } = testSetup;

    // Create chat
    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    if (!dmResult.isOk()) return;

    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'send_message',
      arguments: {
        chatId: dmResult.value.id,
        content: '', // Empty content
      },
    });

    expect(result.isError).toBe(true);
  });

  test('rejects message content over 5000 chars', async () => {
    const { users, deps } = testSetup;

    const dmResult = await deps.dmService.createOrGetDm(
      users.userA.id,
      users.userB.id
    );
    if (!dmResult.isOk()) return;

    mcpServer.setAuthenticatedUser(users.userA.id);

    const result = await client.callTool({
      name: 'send_message',
      arguments: {
        chatId: dmResult.value.id,
        content: 'x'.repeat(5001), // Over limit
      },
    });

    expect(result.isError).toBe(true);
  });
});

describe('MCP Server - Group Management', () => {
  const ctx = createMcpTestContext();

  test('create_chat creates group with name', async () => {
    const { users } = ctx.setup;
    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'create_chat',
      arguments: { name: 'Test Group' },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.name).toBe('Test Group');
      expect(data.isGroup).toBe(true);
      expect(data.id).toMatch(/^cht_/);
    }
  });

  test('create_chat creates group with participants', async () => {
    const { users } = ctx.setup;
    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'create_chat',
      arguments: {
        name: 'Group with Friends',
        participantIds: [users.userB.id],
      },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.name).toBe('Group with Friends');
      expect(data.isGroup).toBe(true);
    }
  });

  test('create_chat rejects empty name', async () => {
    ctx.mcp.setAuthenticatedUser(ctx.setup.users.userA.id);

    const result = await ctx.client.callTool({
      name: 'create_chat',
      arguments: { name: '' },
    });

    expect(result.isError).toBe(true);
  });

  test('create_chat rejects name over 100 chars', async () => {
    ctx.mcp.setAuthenticatedUser(ctx.setup.users.userA.id);

    const result = await ctx.client.callTool({
      name: 'create_chat',
      arguments: { name: 'a'.repeat(101) },
    });

    expect(result.isError).toBe(true);
  });

  test('leave_chat removes user from group', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createGroupChat('Leave Test', [
      users.userA.id,
    ]);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'leave_chat',
      arguments: { chatId },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      expect(content.text).toContain('Successfully left');
    }
  });

  test('leave_chat fails for non-member', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createGroupChat('Private Group', [
      users.userA.id,
    ]);

    ctx.mcp.setAuthenticatedUser(users.userB.id);

    const result = await ctx.client.callTool({
      name: 'leave_chat',
      arguments: { chatId },
    });

    expect(result.isError).toBe(true);
  });
});

describe('MCP Server - DM Tools', () => {
  const ctx = createMcpTestContext();

  test('list_dms returns empty for new user', async () => {
    ctx.mcp.setAuthenticatedUser(ctx.setup.users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_dms',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    }
  });

  test('list_dms returns created DMs', async () => {
    const { users, deps } = ctx.setup;
    await deps.dmService.createOrGetDm(users.userA.id, users.userB.id);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_dms',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
    }
  });

  test('list_dms excludes group chats', async () => {
    const { users, deps, helpers } = ctx.setup;
    await deps.dmService.createOrGetDm(users.userA.id, users.userB.id);
    await helpers.createGroupChat('Test Group', [users.userA.id]);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_dms',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.length).toBe(1);
    }
  });

  test('list_chats returns both groups and DMs', async () => {
    const { users, deps, helpers } = ctx.setup;
    await helpers.createGroupChat('Test Group', [users.userA.id]);
    await deps.dmService.createOrGetDm(users.userA.id, users.userB.id);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_chats',
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.groupChats.length).toBe(1);
      expect(data.directChats.length).toBe(1);
    }
  });
});

describe('MCP Server - Message Pagination', () => {
  const ctx = createMcpTestContext();

  test('list_messages returns empty for new chat', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_messages',
      arguments: { chatId },
    });

    expect(result.isError).toBeFalsy();
    if (!('content' in result)) throw new Error('Expected content');
    const content = result.content[0];
    if (content.type === 'text') {
      const data = JSON.parse(content.text);
      expect(data.messages).toEqual([]);
      expect(data.pagination.hasMore).toBe(false);
    }
  });

  test('list_messages handles cursor pagination', async () => {
    const { users, deps, helpers } = ctx.setup;
    const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);

    // Create 5 messages
    for (let i = 1; i <= 5; i++) {
      await deps.messageService.sendMessage(
        users.userA.id,
        chatId,
        `Message ${i}`
      );
    }

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const page1 = await ctx.client.callTool({
      name: 'list_messages',
      arguments: { chatId, limit: 2 },
    });

    expect(page1.isError).toBeFalsy();
    if (!('content' in page1)) throw new Error('Expected content');
    const content1 = page1.content[0];
    if (content1.type === 'text') {
      const data1 = JSON.parse(content1.text);
      expect(data1.messages.length).toBe(2);
      expect(data1.pagination.hasMore).toBe(true);
      expect(data1.pagination.nextCursor).toBeDefined();

      const page2 = await ctx.client.callTool({
        name: 'list_messages',
        arguments: { chatId, limit: 2, cursor: data1.pagination.nextCursor },
      });

      expect(page2.isError).toBeFalsy();
      if (!('content' in page2)) throw new Error('Expected content');
      const content2 = page2.content[0];
      if (content2.type === 'text') {
        const data2 = JSON.parse(content2.text);
        expect(data2.messages.length).toBe(2);
        expect(data2.messages[0].id).not.toBe(data1.messages[0].id);
      }
    }
  });

  test('list_messages rejects limit below 1', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_messages',
      arguments: { chatId, limit: 0 },
    });

    expect(result.isError).toBe(true);
  });

  test('list_messages rejects limit above 100', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);

    ctx.mcp.setAuthenticatedUser(users.userA.id);

    const result = await ctx.client.callTool({
      name: 'list_messages',
      arguments: { chatId, limit: 101 },
    });

    expect(result.isError).toBe(true);
  });
});

describe('MCP Server - Real-time Features', () => {
  const ctx = createMcpTestContext();

  test('send_message publishes to Redis channel', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);

    const subscriber = await helpers.createSubscriber();
    const channel = `chat:${chatId}`;

    // Use promise-based waiting for reliability
    const messagePromise = new Promise<string>((resolve) => {
      subscriber.subscribe(channel, (message: string) => resolve(message));
    });

    // Wait for subscription to be established before sending message
    await Bun.sleep(100);

    ctx.mcp.setAuthenticatedUser(users.userA.id);
    await ctx.client.callTool({
      name: 'send_message',
      arguments: { chatId, content: 'Test Redis pub/sub' },
    });

    const received = await messagePromise;
    const payload = JSON.parse(received);
    expect(payload.type).toBe('message');
    expect(payload.data.content).toBe('Test Redis pub/sub');

    await subscriber.close();
  });

  test('message payload includes expected fields', async () => {
    const { users, helpers } = ctx.setup;
    const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);

    const subscriber = await helpers.createSubscriber();
    const channel = `chat:${chatId}`;

    const messagePromise = new Promise<Record<string, unknown>>((resolve) => {
      subscriber.subscribe(channel, (message: string) =>
        resolve(JSON.parse(message))
      );
    });

    // Wait for subscription to be established before sending message
    await Bun.sleep(100);

    ctx.mcp.setAuthenticatedUser(users.userA.id);
    await ctx.client.callTool({
      name: 'send_message',
      arguments: { chatId, content: 'Payload test' },
    });

    const payload = await messagePromise;
    expect(payload.type).toBe('message');

    const data = payload.data as Record<string, unknown>;
    expect(data.id).toBeDefined();
    expect(data.chatId).toBe(chatId);
    expect(data.senderId).toBe(users.userA.id);
    expect(data.content).toBe('Payload test');
    expect(data.createdAt).toBeDefined();

    await subscriber.close();
  });
});
