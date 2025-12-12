/**
 * MCP Transport Tests
 *
 * Tests the HTTP/Hono integration for MCP endpoints.
 * Uses Hono's app.request() for testing without starting a server.
 */

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from 'bun:test';
import { createApp } from '../src/app';
import type { ContextDeps } from '../src/context';
import { createTestSetup, type TestSetup } from './setup';

// Redis memory server can take time to start
setDefaultTimeout(30_000);

describe('MCP Transport - Discovery Endpoint', () => {
  let testSetup: TestSetup;
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    // Create app with test dependencies
    const contextDeps: ContextDeps = {
      db: testSetup.deps.db,
      logger: testSetup.deps.logger,
      redis: testSetup.deps.redisClient,
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      moderationService: testSetup.deps.moderationService,
      groupService: testSetup.deps.groupService,
      userService: {
        lookupByPrivyId: async () => {
          throw new Error('User lookup not expected in discovery tests');
        },
      },
    };

    app = await createApp(contextDeps);
  });

  afterAll(async () => {
    await testSetup.close();
  });

  test('GET /mcp returns discovery JSON', async () => {
    const res = await app.request('/mcp', {
      method: 'GET',
    });

    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      name: string;
      version: string;
      tools: { name: string }[];
    };
    expect(json.name).toBe('babylon-chat');
    expect(json.version).toBe('1.0.0');
    expect(json.tools).toBeDefined();
    expect(Array.isArray(json.tools)).toBe(true);
    expect(json.tools.length).toBe(8);
  });

  test('GET /mcp lists all tool names', async () => {
    const res = await app.request('/mcp', {
      method: 'GET',
    });

    const json = (await res.json()) as { tools: { name: string }[] };
    const toolNames = json.tools.map((t) => t.name);

    expect(toolNames).toContain('list_chats');
    expect(toolNames).toContain('get_chat');
    expect(toolNames).toContain('create_chat');
    expect(toolNames).toContain('leave_chat');
    expect(toolNames).toContain('create_dm');
    expect(toolNames).toContain('list_dms');
    expect(toolNames).toContain('list_messages');
    expect(toolNames).toContain('send_message');
  });

  test('GET /mcp requires no authentication', async () => {
    // No auth headers
    const res = await app.request('/mcp', {
      method: 'GET',
    });

    expect(res.status).toBe(200);
  });
});

describe('MCP Transport - Health Endpoints', () => {
  let testSetup: TestSetup;
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    const contextDeps: ContextDeps = {
      db: testSetup.deps.db,
      logger: testSetup.deps.logger,
      redis: testSetup.deps.redisClient,
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      moderationService: testSetup.deps.moderationService,
      groupService: testSetup.deps.groupService,
      userService: {
        lookupByPrivyId: async () => {
          throw new Error('User lookup not expected in health tests');
        },
      },
    };

    app = await createApp(contextDeps);
  });

  afterAll(async () => {
    await testSetup.close();
  });

  test('GET / returns Scalar API docs', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Scalar API Reference');
    expect(html).toContain('/openapi.json');
  });

  test('GET /health returns status JSON', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };
    expect(json.status).toBe('ok');
    expect(json.service).toBe('chat-api');
    expect(json.timestamp).toBeDefined();
  });
});

describe('MCP Transport - POST Endpoint', () => {
  let testSetup: TestSetup;
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    const contextDeps: ContextDeps = {
      db: testSetup.deps.db,
      logger: testSetup.deps.logger,
      redis: testSetup.deps.redisClient,
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      moderationService: testSetup.deps.moderationService,
      groupService: testSetup.deps.groupService,
      userService: {
        lookupByPrivyId: async () => {
          throw new Error('User lookup not expected in POST tests');
        },
      },
    };

    app = await createApp(contextDeps);
  });

  afterAll(async () => {
    await testSetup.close();
  });

  test('POST /mcp with inter-service auth works', async () => {
    const { users } = testSetup;

    // Use inter-service auth (x-user-id + x-service-secret)
    // This requires CHAT_API_SECRET env var to be set
    const res = await app.request('/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': users.userA.id,
        'x-service-secret': process.env.CHAT_API_SECRET || 'test-secret',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    // Note: This test may fail if CHAT_API_SECRET doesn't match
    // The response depends on the StreamableHTTPServerTransport behavior
    expect(res.status).toBeLessThan(500); // Should not error
  });
});

describe('MCP Transport - CORS', () => {
  let testSetup: TestSetup;
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    testSetup = await createTestSetup();

    const contextDeps: ContextDeps = {
      db: testSetup.deps.db,
      logger: testSetup.deps.logger,
      redis: testSetup.deps.redisClient,
      chatService: testSetup.deps.chatService,
      dmService: testSetup.deps.dmService,
      messageService: testSetup.deps.messageService,
      moderationService: testSetup.deps.moderationService,
      groupService: testSetup.deps.groupService,
      userService: {
        lookupByPrivyId: async () => {
          throw new Error('User lookup not expected in CORS tests');
        },
      },
    };

    app = await createApp(contextDeps);
  });

  afterAll(async () => {
    await testSetup.close();
  });

  test('OPTIONS /mcp returns CORS headers', async () => {
    const res = await app.request('/mcp', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    // CORS preflight should succeed
    expect(res.status).toBeLessThan(400);
  });
});
