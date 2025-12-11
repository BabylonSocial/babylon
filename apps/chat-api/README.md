# Chat API

A standalone chat service built with **Hono**, **oRPC**, and **Bun** runtime. Provides type-safe RPC endpoints for real-time messaging with **Server-Sent Events (SSE)** powered by Redis pub/sub.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Hono + oRPC Integration](#hono--orpc-integration)
  - [Factory Pattern](#factory-pattern)
  - [Dependency Injection](#dependency-injection)
  - [Result Pattern with neverthrow](#result-pattern-with-neverthrow)
  - [Real-time Architecture](#real-time-architecture)
- [Testing](#testing)
  - [In-Memory Testing (No Docker!)](#in-memory-testing-no-docker)
  - [Testing Patterns](#testing-patterns)
  - [Test Structure Example](#test-structure-example)
- [Implementation Status](#implementation-status)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [MCP Integration](#mcp-integration)
- [Deployment](#deployment)

---

## Overview

The Chat API service provides:

- **Type-safe RPC endpoints** via oRPC with Zod schemas
- **Real-time messaging** via Server-Sent Events (SSE)
- **Direct messages (DMs)** and **group chats**
- **Moderation** (kick, ban/unban)
- **Group management** (invites, members)
- **MCP server** for AI agent access to chat operations
- **Functional error handling** with `neverthrow` (no exceptions)

**Design Philosophy:**
- Fail fast with explicit error types
- Pure dependency injection (no global state)
- In-memory testing (PGlite + redis-memory-server)
- Service layer owns business logic, routers are thin

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun (native APIs for HTTP, Redis, SQL) |
| **Framework** | Hono (lightweight web framework) |
| **RPC** | oRPC (type-safe RPC with Zod schemas) |
| **Database** | PostgreSQL (postgres-js) / PGlite (testing) |
| **ORM** | Drizzle ORM with TypeID pattern |
| **Real-time** | Redis pub/sub → SSE |
| **Auth** | Privy (@privy-io/server-auth) |
| **Error Handling** | neverthrow (Result<T, E>) |
| **Logging** | Pino (structured JSON logs) |
| **MCP** | Model Context Protocol for AI agents |

---

## Architecture

### Hono + oRPC Integration

**Hono** provides the HTTP server and middleware layer, while **oRPC** sits on top to provide type-safe RPC endpoints.

```typescript
// 1. Define oRPC router with Zod schemas
export const messageRouter = {
  send: protectedProcedure
    .input(z.object({ chatId: z.string(), content: z.string() }))
    .handler(async ({ input, context }) => {
      // Business logic delegated to service
      const result = await context.messageService.sendMessage(
        context.user.userId,
        input.chatId,
        input.content
      );

      // Unwrap Result and map to oRPC errors
      return result.match(
        (data) => data,
        (error) => {
          if (error.type === 'ACCESS_DENIED') {
            throw new ORPCError('FORBIDDEN', { message: error.message });
          }
          throw new ORPCError('INTERNAL_SERVER_ERROR');
        }
      );
    }),
};

// 2. Mount oRPC router onto Hono app
import { createApp } from './app';

const app = new Hono();
app.route('/rpc', orpcHandler); // oRPC endpoints at /rpc/*
app.get('/health', (c) => c.json({ status: 'ok' })); // Regular Hono routes

// 3. Bun serves the Hono app
Bun.serve({ port: 3001, fetch: app.fetch });
```

**Why this stack?**
- **Hono**: Fast, minimal HTTP layer (middleware, CORS, routing)
- **oRPC**: Type-safe contracts with automatic client generation
- **Zod**: Input validation + OpenAPI generation
- **Bun**: Fast runtime with built-in Redis/PostgreSQL clients

---

### Factory Pattern

All dependencies are created via **factory functions**, enabling easy testing and composition.

```typescript
// Database factory - supports PostgreSQL or PGlite
export function createDb(config: DbConfig): Database {
  if (config.type === 'pg') {
    return drizzle(postgres(config.databaseUrl), { schema });
  }
  if (config.type === 'pglite') {
    return drizzle(config.db, { schema }); // In-memory for tests
  }
  throw new Error('Invalid DB config');
}

// Service factories
export function createMessageService(deps: MessageServiceDeps) {
  const { db, logger, redis } = deps;

  return {
    async sendMessage(userId, chatId, content) { /* ... */ },
    async listMessages(userId, chatId, options) { /* ... */ },
  };
}

// Usage in production
const db = createDb({ type: 'pg', databaseUrl: env.DATABASE_URL });
const messageService = createMessageService({ db, logger, redis });

// Usage in tests
const db = createDb({ type: 'pglite', db: pgLiteInstance });
const messageService = createMessageService({ db, logger, redis });
```

**Benefits:**
- **No global state** - everything is passed explicitly
- **Easy mocking** - pass different implementations in tests
- **Type-safe** - TypeScript enforces dependency contracts

---

### Dependency Injection

Services and routers receive dependencies via **constructor injection**. The dependency tree is built in [src/index.ts](src/index.ts):

```typescript
// 1. Create infrastructure (DB, Redis, Logger)
const db = createDb({ type: 'pg', databaseUrl: env.DATABASE_URL });
const redis = new RedisClient(env.REDIS_URL);
const logger = createLogger({ level: env.LOG_LEVEL });

// 2. Create services (services depend on infrastructure)
const chatService = createChatService({ db, logger });
const messageService = createMessageService({ db, logger, redis });
const groupService = createGroupService({ db, logger });

// 3. Create app (routers depend on services)
const app = await createApp({
  db,
  logger,
  redis,
  chatService,
  messageService,
  groupService,
  lookupUserByPrivyId,
});
```

**Service dependencies flow downward:**

```
Infrastructure (DB, Redis, Logger)
         ↓
   Services (Chat, Message, Group, etc.)
         ↓
   Routers (thin oRPC handlers)
         ↓
     Hono App
```

**Example service with dependencies:**

```typescript
// From src/services/message.service.ts
export type MessageServiceDeps = {
  db: Database;
  logger: Logger;
  redis: RedisClient;
};

export function createMessageService(deps: MessageServiceDeps) {
  const { db, logger, redis } = deps;

  async function publishToRedis(chatId: ChatId, message: Message) {
    try {
      const channel = `chat:${chatId}`;
      await redis.publish(channel, JSON.stringify({ type: 'message', data: message }));
    } catch (error) {
      logger.error({ msg: 'Failed to publish to Redis', error });
    }
  }

  return {
    async sendMessage(userId, chatId, content): Promise<Result<SendMessageResult, MessageServiceError>> {
      // Business logic here...
      const result = await db.insert(messagesTable).values({ /* ... */ });

      // Publish to Redis for real-time delivery
      publishToRedis(chatId, message);

      return ok({ message, chat });
    },
  };
}
```

**Why dependency injection?**
- **Testability**: Swap real DB/Redis with in-memory versions
- **No mocking**: Tests use real implementations (just in-memory)
- **Composition**: Services can depend on other services
- **Clear contracts**: TypeScript enforces what each service needs

---

### Result Pattern with neverthrow

All service methods return `Result<T, E>` instead of throwing exceptions. This forces **explicit error handling** at every call site.

**Why neverthrow?**

- ✅ **Errors are values** - no hidden control flow
- ✅ **Type-safe error discrimination** - TypeScript knows error types
- ✅ **No try/catch soup** - errors handled functionally
- ✅ **Forces error handling** - can't ignore errors accidentally

#### Service Layer: Return Results

```typescript
// From src/services/message.service.ts
import { ok, err, type Result } from 'neverthrow';

export async function sendMessage(
  userId: UserId,
  chatId: ChatId,
  content: string
): Promise<Result<SendMessageResult, MessageServiceError>> {
  // Verify access (returns Result)
  const accessResult = await verifyAccess(userId, chatId);
  if (accessResult.isErr()) {
    return err(accessResult.error); // Propagate error
  }

  try {
    const [newMessage] = await db.insert(messagesTable).values({ /* ... */ });

    if (!newMessage) {
      return err({ type: 'SEND_FAILED', message: 'Failed to insert message' });
    }

    publishToRedis(chatId, newMessage); // Fire-and-forget

    return ok({ message: newMessage, chat }); // Success
  } catch (error) {
    logger.error({ msg: 'Error sending message', error });
    return err({ type: 'SEND_FAILED', message: 'Database error', cause: error });
  }
}
```

#### Router Layer: Unwrap Results

```typescript
// From src/routers/message.router.ts
send: protectedProcedure
  .input(SendMessageInputSchema)
  .handler(async ({ input, context }) => {
    const result = await context.messageService.sendMessage(
      context.user.userId,
      input.chatId,
      input.content
    );

    // Use .match() to handle both success and error cases
    return result.match(
      (data) => {
        context.logger.info({ msg: 'Message sent', messageId: data.message.id });
        return data; // Return success value
      },
      (error) => {
        // Map service errors to oRPC errors
        if (error.type === 'CHAT_NOT_FOUND') {
          throw new ORPCError('NOT_FOUND', { message: error.message });
        }
        if (error.type === 'ACCESS_DENIED') {
          throw new ORPCError('FORBIDDEN', { message: error.message });
        }
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
      }
    );
  }),
```

#### Error Types (Discriminated Unions)

```typescript
// From src/services/errors.ts
export type MessageServiceError =
  | { type: 'CHAT_NOT_FOUND'; message: string }
  | { type: 'ACCESS_DENIED'; message: string }
  | { type: 'SEND_FAILED'; message: string; cause?: unknown }
  | { type: 'LIST_MESSAGES_ERROR'; message: string; cause?: unknown };
```

**Pattern Benefits:**
- **Exhaustive error handling** - TypeScript ensures all error types are handled
- **No hidden control flow** - errors are explicit return values
- **Better than exceptions** - easier to reason about, no silent failures
- **Composable** - use `.andThen()`, `.map()`, `.mapErr()` for chaining

#### Chaining Results

```typescript
const result = await verifyAccess(userId, chatId)
  .andThen((access) => loadChatDetails(chatId))
  .andThen((chat) => checkPermissions(userId, chat))
  .map((chat) => formatChatResponse(chat));

// If any step fails, error propagates automatically
// Only success path continues to next step
```

---

### Real-time Architecture

**SSE (Server-Sent Events)** powered by **Redis pub/sub** for multi-instance deployments.

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ GET /rpc/message.subscribe?chatId=xxx
       │ (SSE connection)
       ↓
┌──────────────────┐
│   Chat API       │
│   Instance 1     │──────┐
└──────────────────┘      │
                          │ Redis SUBSCRIBE
┌──────────────────┐      │ channel: "chat:xxx"
│   Chat API       │      │
│   Instance 2     │──────┤
└──────────────────┘      │
                          ↓
                   ┌─────────────┐
                   │    Redis    │
                   │  (Pub/Sub)  │
                   └─────────────┘
                          ↑
                          │ Redis PUBLISH
┌──────────────────┐      │ channel: "chat:xxx"
│ POST /rpc/       │      │
│ message.send     │──────┘
└──────────────────┘
```

#### Publisher (Message Send)

```typescript
// From src/services/message.service.ts
async function publishToRedis(chatId: ChatId, message: Message): Promise<void> {
  try {
    const channel = `chat:${chatId}`;
    const payload = JSON.stringify({
      type: 'message',
      data: {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      },
    });
    await redis.publish(channel, payload);
  } catch (error) {
    logger.error({ msg: 'Failed to publish to Redis', error });
  }
}

// Called after message is saved to DB (fire-and-forget)
const [newMessage] = await db.insert(messagesTable).values({ /* ... */ });
publishToRedis(chatId, newMessage); // Don't await - non-blocking
```

#### Subscriber (SSE Stream)

```typescript
// From src/routers/message.router.ts
subscribe: protectedProcedure
  .input(SubscribeMessagesInputSchema)
  .output(eventIterator(MessageEventSchema)) // SSE stream
  .handler(async function* ({ input, context }) {
    const chatId = input.chatId;

    // Verify access before subscribing
    const accessResult = await context.messageService.verifyAccess(
      context.user.userId,
      chatId
    );
    if (accessResult.isErr()) {
      throw new ORPCError('FORBIDDEN');
    }

    // Create dedicated Redis subscriber connection
    const subscriber = await context.redis.duplicate();

    const queue: MessageEvent[] = [];
    let resolver: (() => void) | null = null;
    let closed = false;

    const channel = `chat:${chatId}`;
    await subscriber.subscribe(channel, (payload: string) => {
      const event = JSON.parse(payload);
      queue.push(event);
      resolver?.(); // Wake up async iterator
    });

    try {
      while (!closed) {
        // Wait for messages or timeout for ping
        if (queue.length === 0) {
          await Promise.race([
            new Promise<void>((resolve) => { resolver = resolve; }),
            new Promise<void>((resolve) => setTimeout(resolve, 30000)) // 30s ping
          ]);
          resolver = null;
        }

        // Yield all queued messages
        while (queue.length > 0) {
          yield queue.shift()!;
        }

        // Periodic ping to keep connection alive
        if (Date.now() - lastPing > 30000) {
          yield { type: 'ping', data: { chatId } };
          lastPing = Date.now();
        }
      }
    } finally {
      closed = true;
      subscriber.close();
    }
  }),
```

#### Client Usage (SSE)

```typescript
import { createUserChatApiClient } from '@babylon/chat-api/client';

const client = createUserChatApiClient({ /* ... */ });

// Subscribe to chat messages (returns async iterator)
const subscription = await client.message.subscribe({ chatId: 'cht_xxx' });

for await (const event of subscription) {
  if (event.type === 'message') {
    console.log('New message:', event.data.content);
  }
  if (event.type === 'ping') {
    console.log('Keep-alive ping');
  }
}
```

**Why SSE over WebSocket?**
- ✅ **Simpler** - one-way server→client (no complex handshake)
- ✅ **HTTP-friendly** - works with Vercel, Cloudflare, etc.
- ✅ **Automatic reconnection** - browsers handle reconnect logic
- ✅ **Redis pub/sub scales** - multi-instance deployments work out of the box

---

## Testing

### In-Memory Testing (No Docker!)

Tests run **entirely in-memory** using **PGlite** (PostgreSQL) and **redis-memory-server** (Redis). No Docker containers required.

**Why in-memory testing?**
- ✅ **Fast** - no container startup delay
- ✅ **Isolated** - each test gets fresh DB/Redis
- ✅ **CI-friendly** - no external dependencies
- ✅ **Realistic** - PGlite is real PostgreSQL (not mocks)

#### Test Setup

```typescript
// From test/setup.ts
import { PGlite } from '@electric-sql/pglite';
import { RedisClient } from 'bun';
import { createTestRedisSetup } from './redis-test-server';

export async function createTestSetup(): Promise<TestSetup> {
  // 1. Create in-memory PostgreSQL (PGlite)
  const pgLite = new PGlite({ extensions: { uuid_ossp } });
  const db = createDb({ type: 'pglite', db: pgLite });

  // 2. Create in-memory Redis (redis-memory-server)
  const redisSetup = await createTestRedisSetup();
  const redis = new RedisClient(redisSetup.url);
  await redis.connect();

  // 3. Create services with in-memory deps
  const chatService = createChatService({ db, logger });
  const messageService = createMessageService({ db, logger, redis });
  const groupService = createGroupService({ db, logger });

  // 4. Create test users
  const users = {
    userA: { id: typeIdGenerator('user'), displayName: 'User A' },
    userB: { id: typeIdGenerator('user'), displayName: 'User B' },
  };

  return {
    deps: { db, pgLite, logger, chatService, messageService, groupService, redis },
    users,
    cleanup: async () => { /* clear test data */ },
    close: async () => { /* shutdown DB/Redis */ },
  };
}
```

### Testing Patterns

#### 1. Arrange → Act → Assert

```typescript
// From test/message.router.test.ts
test('send creates message in database', async () => {
  const { users, deps } = testSetup;

  // ARRANGE: Create chat
  const dmResult = await deps.dmService.createOrGetDm(users.userA.id, users.userB.id);
  expect(dmResult.isOk()).toBe(true);
  const chatId = dmResult.value.id;

  // ACT: Send message
  const result = await deps.messageService.sendMessage(
    users.userA.id,
    chatId,
    'Hello from test!'
  );

  // ASSERT: Check result
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.message.content).toBe('Hello from test!');
    expect(result.value.message.senderId).toBe(users.userA.id);
  }
});
```

#### 2. Test Error Paths

```typescript
test('send denies access to non-participant', async () => {
  const { users, deps } = testSetup;

  // ARRANGE: Create chat between A and B
  const dmResult = await deps.dmService.createOrGetDm(users.userA.id, users.userB.id);
  const chatId = dmResult.value.id;

  // Create a non-participant user
  const userCId = typeIdGenerator('user');

  // ACT: Try to send from non-participant
  const result = await deps.messageService.sendMessage(userCId, chatId, 'Should fail');

  // ASSERT: Should return ACCESS_DENIED error
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error.type).toBe('ACCESS_DENIED');
  }
});
```

#### 3. Cleanup Pattern

```typescript
describe('Message Service', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await createTestSetup();
  });

  afterEach(async () => {
    await testSetup.cleanup(); // Clear test data between tests
  });

  afterAll(async () => {
    await testSetup.close(); // Shutdown DB/Redis after all tests
  });

  test('...', async () => { /* ... */ });
});
```

#### 4. Testing Real-time (Redis Pub/Sub)

```typescript
test('message is published to Redis', async () => {
  const { users, deps, helpers } = testSetup;

  // Create chat and subscriber
  const chatId = await helpers.createDmChat(users.userA.id, users.userB.id);
  const subscriber = await helpers.createSubscriber();

  const received: string[] = [];
  await subscriber.subscribe(`chat:${chatId}`, (payload: string) => {
    const event = JSON.parse(payload);
    received.push(event.data.content);
  });

  // Send message
  await deps.messageService.sendMessage(users.userA.id, chatId, 'Test message');

  // Wait for Redis to deliver
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(received).toContain('Test message');
});
```

### Test Structure Example

```
test/
├── setup.ts                    # createTestSetup() utility
├── redis-test-server.ts        # In-memory Redis setup
├── dm.router.test.ts           # DM endpoints
├── message.router.test.ts      # Message endpoints
├── group.service.test.ts       # Group service logic
├── moderation.service.test.ts  # Moderation logic
└── mcp-server.test.ts          # MCP tool testing
```

**Run tests:**

```bash
bun test                  # Run all tests
bun test --watch          # Watch mode
bun test message.router   # Run specific test file
```

---

## Implementation Status

### ✅ Complete & Production-Ready

#### Core Chat Operations
- ✅ List chats (user's groups + DMs)
- ✅ Get chat by ID (with access control)
- ✅ Create chat
- ✅ Leave chat
- ✅ Get group ID for chat

#### Direct Messages
- ✅ Create or get DM (idempotent)
- ✅ List DMs for user
- ✅ Prevents self-DM

#### Messages
- ✅ List messages with cursor pagination
- ✅ Send message
- ✅ SSE subscription for real-time messages
- ✅ Redis pub/sub integration
- ✅ Access verification
- ✅ `sinceMessageId` for cache sync
- ✅ Periodic ping (30s) to keep SSE alive

#### Group Management
- ✅ Add members to group
- ✅ Remove member from group
- ✅ Invite user (with pending status)
- ✅ Respond to invite (accept/reject)
- ✅ List invites for user
- ✅ List group members

#### Moderation
- ✅ Kick user from chat
- ✅ Ban user (with optional duration)
- ✅ Unban user
- ✅ Check ban status
- ✅ Get moderation log
- ✅ Prevents self-moderation

#### MCP (AI Agent) Integration
- ✅ MCP server with 8 tools exposed
- ✅ GET /mcp for tool discovery
- ✅ POST /mcp for authenticated tool calls
- ✅ Stateless transport (auth per-request)
- ✅ Tools: `list_chats`, `get_chat`, `create_chat`, `leave_chat`, `create_dm`, `list_dms`, `list_messages`, `send_message`

#### Infrastructure
- ✅ Privy token verification (cookie + Bearer)
- ✅ Inter-service auth (x-service-secret headers)
- ✅ Request ID tracking
- ✅ Structured logging (pino)
- ✅ Error handling middleware
- ✅ CORS configuration
- ✅ OpenAPI spec generation
- ✅ Type-safe client export
- ✅ In-memory testing (PGlite + redis-memory-server)

### ⚠️ Incomplete / In Progress

#### Database
- ⚠️ **Migrations not generated** - Need to run `bun run db:generate` + `db:migrate`
- ⚠️ Tests use manual SQL table creation (temporary workaround)

#### API Features
- ❌ **Unread count tracking** - Schema exists but not implemented
- ❌ **Typing indicators** - Schema defined but not published to Redis
- ❌ **Read receipts** - Schema exists but not implemented
- ❌ **Message editing/deletion** - Not yet implemented
- ❌ **File attachments** - Not yet implemented

#### Group Chat Features
- ❌ **Admin role enforcement** - `chat_admins` table exists but not checked
- ❌ **Group settings** - Avatar, permissions, max members, etc.
- ❌ **Invite expiration** - No background job to expire old invites

#### Moderation
- ❌ **Mute/unmute** - Listed in types but not implemented
- ❌ **Admin-only moderation checks** - Anyone can kick/ban currently
- ❌ **Ban expiration background job** - Manual unban required

#### Client Integration
- ⚠️ **Main app integration** - `lib/chat-api-client.ts` exists but not fully tested
- ❌ **Rate limiting** - No rate limiting on endpoints
- ❌ **Request retries** - Client doesn't retry failed requests

### 📋 Next Steps (Priority Order)

1. **Generate database migrations** - `bun run db:generate`, commit migrations
2. **Rate limiting** - Add rate limits to prevent abuse
3. **Admin role checks** - Enforce admin-only moderation
4. **Unread counts** - Implement tracking and API endpoint
5. **Integration tests** - Test main app → chat-api flow end-to-end
6. **Deployment config** - Add chat-api to production deployment

---

## Getting Started

### Prerequisites

- **Bun** >= 1.0
- **PostgreSQL** >= 14
- **Redis** >= 6.0

### Environment Variables

Create `.env` file:

```bash
# Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database (PostgreSQL connection string)
DATABASE_URL=postgres://user:pass@localhost:5432/babylon_chat

# Auth - Privy credentials (from Privy dashboard)
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Auth - Inter-service secret (min 32 chars, generate with: openssl rand -base64 32)
CHAT_API_SECRET=your_generated_secret_here

# Redis (for SSE pub/sub)
REDIS_URL=redis://localhost:6379
```

### Database Setup

```bash
# Generate migrations from schema
bun run db:generate

# Run migrations
bun run db:migrate

# (Optional) Push schema directly to dev DB
bun run db:push

# (Optional) Open Drizzle Studio UI
bun run db:studio
```

### Development

```bash
# Install dependencies
bun install

# Start dev server (hot reload)
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Type checking
bun run typecheck

# Linting
bun run lint
```

### Production Build

```bash
# Compile to standalone binary
bun run build

# Run binary
./chat-api
```

### Project Structure

```
apps/chat-api/
├── src/
│   ├── index.ts              # Entry point (creates app, starts server)
│   ├── app.ts                # Hono app factory
│   ├── env.ts                # Environment variable schema (Zod)
│   ├── logger.ts             # Pino logger setup
│   ├── procedures.ts         # oRPC procedures (public, protected)
│   ├── context.ts            # Request context type
│   ├── auth/                 # Privy authentication
│   │   └── privy-auth.ts
│   ├── db/                   # Database layer
│   │   ├── db.ts             # Drizzle client factory
│   │   ├── schema/           # Drizzle schema (tables)
│   │   └── typeid.ts         # TypeID utilities
│   ├── services/             # Business logic (fat domain services)
│   │   ├── chat.service.ts
│   │   ├── dm.service.ts
│   │   ├── message.service.ts
│   │   ├── group.service.ts
│   │   ├── moderation.service.ts
│   │   └── errors.ts         # Service error types
│   ├── routers/              # oRPC routers (thin handlers)
│   │   ├── index.ts          # Root router (combines all)
│   │   ├── chat.router.ts
│   │   ├── dm.router.ts
│   │   ├── message.router.ts
│   │   ├── group.router.ts
│   │   └── moderation.router.ts
│   ├── mcp/                  # Model Context Protocol server
│   │   ├── mcp-server.ts     # MCP tool definitions
│   │   └── mcp-transport.ts  # Custom transport (stateless auth)
│   ├── client/               # Type-safe client exports
│   │   └── index.ts
│   └── utils.ts              # Cursor pagination, etc.
├── test/                     # Test files
│   ├── setup.ts              # Test utilities (createTestSetup)
│   ├── redis-test-server.ts  # In-memory Redis setup
│   └── *.test.ts             # Test suites
├── drizzle/                  # Generated migrations (TODO)
├── package.json
├── tsconfig.json
└── README.md
```

---

## API Documentation

### Client Creation

```typescript
import { createUserChatApiClient } from '@babylon/chat-api/client';

// Create authenticated client
const client = createUserChatApiClient({
  baseUrl: 'http://localhost:3001',
  getAccessToken: async () => await privy.getAccessToken(), // Privy token
});

// Use type-safe methods
const { groupChats, directChats } = await client.chat.list({});
const result = await client.message.send({ chatId: 'cht_xxx', content: 'Hello!' });
```

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `chat.list` | Query | List user's chats (groups + DMs) |
| `chat.get` | Query | Get chat details by ID |
| `chat.create` | Mutation | Create new chat |
| `chat.leave` | Mutation | Leave a chat |
| `chat.getGroupId` | Query | Get group ID for chat (main app) |
| `dm.createOrGet` | Mutation | Create or get existing DM |
| `dm.list` | Query | List user's DMs |
| `message.list` | Query | List messages (cursor pagination) |
| `message.send` | Mutation | Send message to chat |
| `message.subscribe` | Subscription | Subscribe to chat messages (SSE) |
| `group.addMember` | Mutation | Add user to group |
| `group.removeMember` | Mutation | Remove user from group |
| `group.invite` | Mutation | Invite user to group |
| `group.respondToInvite` | Mutation | Accept/reject group invite |
| `group.listInvites` | Query | List pending invites |
| `moderation.kick` | Mutation | Kick user from chat |
| `moderation.ban` | Mutation | Ban user (with duration) |
| `moderation.unban` | Mutation | Unban user |

### Error Handling

```typescript
const result = await client.message.send({ chatId, content });

// oRPC errors are thrown (need try/catch)
try {
  const data = await client.message.send({ chatId, content });
  console.log('Message sent:', data.message.id);
} catch (error) {
  if (error.code === 'FORBIDDEN') {
    console.error('Access denied');
  } else if (error.code === 'NOT_FOUND') {
    console.error('Chat not found');
  }
}
```

### SSE Subscription Example

```typescript
// Subscribe to chat messages
const subscription = await client.message.subscribe({ chatId: 'cht_xxx' });

for await (const event of subscription) {
  switch (event.type) {
    case 'message':
      console.log('New message:', event.data.content);
      break;
    case 'typing':
      console.log('User typing:', event.data.senderId);
      break;
    case 'ping':
      console.log('Keep-alive ping');
      break;
  }
}
```

---

## MCP Integration

**Model Context Protocol (MCP)** allows AI agents to access chat operations as tools.

### Available Tools (8 total)

| Tool | Description |
|------|-------------|
| `list_chats` | List user's chats |
| `get_chat` | Get chat details by ID |
| `create_chat` | Create new chat |
| `leave_chat` | Leave a chat |
| `create_dm` | Create or get DM with user |
| `list_dms` | List user's DMs |
| `list_messages` | List messages in chat |
| `send_message` | Send message to chat |

### MCP Endpoints

- **GET `/mcp`** - Tool discovery (lists available tools)
- **POST `/mcp`** - Tool execution (authenticated with Privy token)

### Authentication Flow

1. Agent sends request with **Privy token** in `Authorization` header
2. Chat API verifies token with Privy
3. User ID extracted from token
4. Tool executes with user's permissions

### Example Agent Usage

```typescript
// Agent code (using MCP SDK)
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client({
  name: 'chat-agent',
  version: '1.0.0',
});

// Connect to chat-api MCP server
await client.connect({
  url: 'http://localhost:3001/mcp',
  headers: {
    Authorization: `Bearer ${privyToken}`,
  },
});

// List available tools
const tools = await client.listTools();

// Call tool
const result = await client.callTool({
  name: 'send_message',
  arguments: {
    chatId: 'cht_xxx',
    content: 'Hello from agent!',
  },
});
```

### Stateless Transport

MCP server uses **stateless transport** - each tool call includes authentication:

```typescript
// From src/mcp/mcp-transport.ts
async function handleMessage(message: JSONRPCMessage) {
  // Extract auth from message params
  const privyToken = message.params?.auth?.privyToken;

  // Verify token on every call
  const user = await verifyPrivyToken(privyToken);

  // Execute tool with user context
  return await executeTool(message, user);
}
```

**Why stateless?**
- No session management needed
- Works with serverless deployments
- Each tool call is independent

---

## Deployment

### Production Checklist

- [ ] Generate and commit database migrations (`bun run db:generate`)
- [ ] Set all environment variables in production
- [ ] Configure Redis (Upstash, AWS ElastiCache, etc.)
- [ ] Add rate limiting (TODO)
- [ ] Enable production logging (set `LOG_LEVEL=info`)
- [ ] Configure CORS for production domains
- [ ] Set up monitoring (error tracking, latency)
- [ ] Configure health checks (`GET /health`)

### Missing for Production

#### Critical
- ❌ **Rate limiting** - No rate limits on any endpoint (DDoS risk)
- ❌ **Database migrations** - Need to generate and run migrations

#### Important
- ❌ **Admin role checks** - Anyone can kick/ban users currently
- ❌ **Request retries** - Client should retry failed requests
- ❌ **Connection pooling** - Configure pg pool size for production load

#### Nice-to-Have
- ❌ **Metrics** - Prometheus/Grafana integration
- ❌ **Tracing** - OpenTelemetry for distributed tracing
- ❌ **Graceful degradation** - Fallback if Redis is down

### Scaling Strategy

**Horizontal scaling** with Redis pub/sub:

```
┌──────────────┐
│  Load Balancer │
└───────┬────────┘
        │
   ┌────┴────┐
   │         │
   ↓         ↓
┌─────┐   ┌─────┐
│ API │   │ API │  ← Multiple instances
│  #1 │   │  #2 │
└──┬──┘   └──┬──┘
   │         │
   └────┬────┘
        ↓
   ┌─────────┐
   │  Redis  │  ← Shared pub/sub
   └─────────┘
```

- **Stateless** - no session state, any instance can handle any request
- **Redis pub/sub** - SSE messages broadcast to all instances
- **Connection pooling** - DB pool per instance

### Monitoring Recommendations

**Key metrics to track:**
- Request rate (req/s) by endpoint
- Error rate (%) by error type
- Response time (p50, p95, p99)
- SSE connection count
- Redis pub/sub message rate
- Database query latency
- Active ban/kick count (moderation activity)

**Alerting thresholds:**
- Error rate > 5% for 5 minutes → **warning**
- Error rate > 20% for 2 minutes → **critical**
- p99 latency > 5s → **warning**
- SSE connections > 10k → **warning** (may need more Redis connections)
- Redis unavailable → **critical** (SSE will fail)

---

## Contributing

When adding new features:

1. **Define service method** - Add business logic to service
2. **Return Result<T, E>** - Use neverthrow for error handling
3. **Add error types** - Define discriminated union errors
4. **Create router handler** - Thin wrapper that unwraps Result
5. **Write tests** - Use `createTestSetup()` with in-memory DB/Redis
6. **Update client types** - Re-export types from service/router
7. **Document in README** - Add to implementation status

**Code style:**
- Use factory pattern for new services
- Inject dependencies explicitly (no globals)
- Keep routers thin (delegate to services)
- Test against real DB/Redis (in-memory)
- Log structured JSON (pino)

---