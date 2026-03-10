/**
 * Unit Tests for POST /api/agents/team-chat/coordinator
 *
 * Tests the coordinator route handler that accepts user messages and
 * optionally dispatches to child agents via the DISPATCH_TO_AGENT action.
 *
 * Strategy: real @elizaos/core (parseKeyValueXml, composePromptFromState) —
 * useModel returns well-formed XML that the real parser can process.
 * This avoids module-cache issues with @elizaos/core mocking and makes
 * tests exercise real parsing paths.
 *
 * Coverage:
 * - maxDuration=120 is exported (Vercel timeout guard — 120s for parallel multi-agent dispatch)
 * - Unsafe input returns 400 before auth or DB call
 * - Auth errors propagate without hitting LLM
 * - Rate limit exceeded returns 429 with Retry-After header
 * - Invalid team chat ownership returns 403
 * - broadcastChatMessage injected into state.data.broadcastFn during action phase
 * - Successful response written to DB with correct chatId
 * - broadcastChatMessage called for coordinator response (fire-and-forget)
 * - LLM parse failure returns fallback response (200, not 500)
 * - Action execution path: one action, then summary
 * - JSON string parameters parsed to object before processActions
 * - Array parameters trigger fail-fast error
 * - User profile fallback when DB returns no rows
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { NextRequest } from 'next/server';
import * as apiActual from '../../../api/src';
import * as sharedActual from '../../../shared/src';

// ─── XML helpers — real XML that parseKeyValueXml can parse ───────────────────

/** Decision LLM response: no action, immediately finish */
const DECISION_NO_ACTION = `<output><response><thought>I can answer directly</thought><action></action><parameters>{}</parameters><isFinish>true</isFinish></response></output>`;

/** Decision LLM response: one action, not yet finished */
const DECISION_CHECK_PNL = `<output><response><thought>Fetching PnL</thought><action>CHECK_USER_PNL</action><parameters>{}</parameters><isFinish>false</isFinish></response></output>`;

/** Decision LLM response: take action and finish */
const DECISION_ACTION_FINISH = `<output><response><thought>Dispatch and finish</thought><action>DISPATCH_TO_AGENT</action><parameters>{"agentId": "agent-test-id", "command": "buy TSLAI"}</parameters><isFinish>true</isFinish></response></output>`;

/** Decision LLM response: finish after action */
const DECISION_FINISH_AFTER_ACTION = `<output><response><thought>Done</thought><action></action><parameters>{}</parameters><isFinish>true</isFinish></response></output>`;

/** Summary LLM response */
const SUMMARY_HERE_IS_YOUR_ANSWER = `<response><thought>Summarizing</thought><text>Here is your answer.</text></response>`;
const SUMMARY_YOUR_PNL = `<response><thought>done</thought><text>Your PnL is +$42.</text></response>`;
const SUMMARY_DISPATCHED = `<response><thought>done</thought><text>I dispatched to your agent.</text></response>`;

// ─── Mock Setup ───────────────────────────────────────────────────────────────

// @babylon/agents
const mockGetCoordinatorRuntime = mock();
const mockComposeState = mock(async () => ({ values: {}, data: {} }));
const mockUseModel = mock(async () => DECISION_NO_ACTION);
const mockProcessActions = mock<
  (
    msg: unknown,
    actions: unknown,
    state: { data?: Record<string, unknown> },
    callback: (results: unknown) => Promise<unknown[]>
  ) => Promise<void>
>(async () => {});
const mockValidateTeamChatOwnership = mock(async () => true);

const mockRuntime = {
  agentId: 'coordinator-runtime-id',
  composeState: mockComposeState,
  useModel: mockUseModel,
  processActions: mockProcessActions,
  stateCache: new Map(),
};
mockGetCoordinatorRuntime.mockResolvedValue(mockRuntime);

mock.module('@babylon/agents', () => ({
  agentRuntimeManager: { getCoordinatorRuntime: mockGetCoordinatorRuntime },
  teamChatService: { validateTeamChatOwnership: mockValidateTeamChatOwnership },
}));

// @babylon/api
const mockAuthenticateUser = mock();
const mockBroadcastChatMessage = mock<
  (chatId: string, msg: Record<string, unknown>) => Promise<void>
>(async () => {});
const mockCheckRateLimitAsync = mock<
  () => Promise<{ allowed: boolean; retryAfter?: number | null }>
>(async () => ({ allowed: true, retryAfter: null }));

mock.module('@babylon/api', () => ({
  ...apiActual,
  authenticateUser: mockAuthenticateUser,
  broadcastChatMessage: mockBroadcastChatMessage,
  checkRateLimitAsync: mockCheckRateLimitAsync,
  RATE_LIMIT_CONFIGS: { SEND_MESSAGE: 'SEND_MESSAGE' },
  withErrorHandling: (handler: (req: NextRequest) => Promise<unknown>) =>
    handler,
}));

// @babylon/db — Route calls: db.select({...}).from(users).where(eq(...)).limit(1)
const mockDbSelectLimit = mock(async () => [
  { displayName: 'Alice', username: 'alice' },
]);
const mockDbSelectWhere = mock(() => ({ limit: mockDbSelectLimit }));
const mockDbSelectFrom = mock(() => ({ where: mockDbSelectWhere }));
const mockDbSelect = mock(() => ({ from: mockDbSelectFrom }));
const mockDbInsertValues = mock<
  (vals: Record<string, unknown>) => Promise<unknown[]>
>(async () => []);
const mockDbInsert = mock(() => ({ values: mockDbInsertValues }));

mock.module('@babylon/db', () => ({
  db: { select: mockDbSelect, insert: mockDbInsert },
  eq: (_a: unknown, _b: unknown) => ({ type: 'eq' }),
  messages: {
    id: 'messages.id',
    chatId: 'messages.chatId',
    senderId: 'messages.senderId',
  },
  users: {
    id: 'users.id',
    displayName: 'users.displayName',
    username: 'users.username',
  },
}));

// @babylon/shared
const mockCheckUserInput = mock<
  () => { safe: boolean; reason?: string; category?: string }
>(() => ({ safe: true }));
const mockGenerateSnowflakeId = mock(async () => 'snowflake-coord-123');
const mockLogger = { info: mock(), warn: mock(), error: mock(), debug: mock() };

mock.module('@babylon/shared', () => ({
  ...sharedActual,
  COORDINATOR_SENDER_ID: 'coordinator-sender-id',
  checkUserInput: mockCheckUserInput,
  GROQ_MODELS: { FREE: { displayName: 'llama-free' } },
  generateSnowflakeId: mockGenerateSnowflakeId,
  logger: mockLogger,
  MessageTypeEnum: { COORDINATOR: 'COORDINATOR' },
}));

// uuid
mock.module('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000abc',
}));

// ─── Import route after mocks ─────────────────────────────────────────────────

const routeModule = await import(
  '@/app/api/agents/team-chat/coordinator/route'
);
let POST = routeModule.POST as (req: NextRequest) => Promise<Response>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEAM_CHAT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const MOCK_USER = {
  id: USER_ID,
  userId: USER_ID,
  privyId: 'privy-user-id',
  isAgent: false,
};

const createRequest = (body: Record<string, unknown>): NextRequest =>
  ({
    url: 'https://example.com/api/agents/team-chat/coordinator',
    method: 'POST',
    json: () => Promise.resolve(body),
    headers: {
      get: (n: string) =>
        n.toLowerCase() === 'authorization' ? 'Bearer test-token' : null,
    },
  }) as unknown as NextRequest;

/** Configure mocks for a happy-path run: no actions, immediate finish. */
function setupSuccessfulRun() {
  mockAuthenticateUser.mockResolvedValue(MOCK_USER);
  mockCheckUserInput.mockReturnValue({ safe: true });
  mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
  mockValidateTeamChatOwnership.mockResolvedValue(true);
  mockUseModel
    .mockResolvedValueOnce(DECISION_NO_ACTION)
    .mockResolvedValueOnce(SUMMARY_HERE_IS_YOUR_ANSWER);
}

// ─── Reset between tests ──────────────────────────────────────────────────────

beforeEach(async () => {
  mockAuthenticateUser.mockReset();
  mockBroadcastChatMessage.mockReset();
  mockBroadcastChatMessage.mockResolvedValue(undefined);
  mockCheckRateLimitAsync.mockReset();
  mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
  mockCheckUserInput.mockReset();
  mockCheckUserInput.mockReturnValue({ safe: true });
  mockValidateTeamChatOwnership.mockReset();
  mockValidateTeamChatOwnership.mockResolvedValue(true);
  mockGetCoordinatorRuntime.mockReset();
  mockGetCoordinatorRuntime.mockResolvedValue(mockRuntime);
  mockComposeState.mockReset();
  mockComposeState.mockResolvedValue({ values: {}, data: {} });
  mockUseModel.mockReset();
  mockProcessActions.mockReset();
  mockProcessActions.mockResolvedValue(undefined);
  mockDbSelect.mockReset();
  mockDbSelectFrom.mockReset();
  mockDbSelectWhere.mockReset();
  mockDbSelectLimit.mockReset();
  mockDbSelectWhere.mockImplementation(() => ({ limit: mockDbSelectLimit }));
  mockDbSelectFrom.mockImplementation(() => ({ where: mockDbSelectWhere }));
  mockDbSelect.mockImplementation(() => ({ from: mockDbSelectFrom }));
  mockDbSelectLimit.mockResolvedValue([
    { displayName: 'Alice', username: 'alice' },
  ]);
  mockDbInsert.mockReset();
  mockDbInsert.mockImplementation(() => ({ values: mockDbInsertValues }));
  mockDbInsertValues.mockReset();
  mockDbInsertValues.mockResolvedValue([]);
  mockGenerateSnowflakeId.mockClear();
  mockGenerateSnowflakeId.mockResolvedValue('snowflake-coord-123');
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.debug.mockClear();

  const isolatedModule = await import(
    `@/app/api/agents/team-chat/coordinator/route?isolation=${Date.now()}-${Math.random()}`
  );
  POST = isolatedModule.POST as typeof POST;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/agents/team-chat/coordinator', () => {
  // ── maxDuration export ──────────────────────────────────────────────────

  describe('Vercel timeout guard', () => {
    it('exports maxDuration = 120', () => {
      const { maxDuration } = routeModule as { maxDuration?: number };
      expect(maxDuration).toBe(120);
    });
  });

  // ── Input validation ────────────────────────────────────────────────────

  describe('input validation (checkUserInput)', () => {
    it('returns 400 for unsafe input — before auth or any DB call', async () => {
      mockCheckUserInput.mockReturnValue({
        safe: false,
        reason: 'Prompt injection detected',
        category: 'injection',
      });

      const req = createRequest({
        content: '<script>evil</script>',
        teamChatId: TEAM_CHAT_ID,
      });
      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(mockAuthenticateUser).not.toHaveBeenCalled();
      expect(mockGetCoordinatorRuntime).not.toHaveBeenCalled();
    });

    it('400 body contains the unsafe reason', async () => {
      mockCheckUserInput.mockReturnValue({
        safe: false,
        reason: 'Spam detected',
        category: 'spam',
      });

      const response = await POST(
        createRequest({ content: 'SPAM', teamChatId: TEAM_CHAT_ID })
      );
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error).toContain('Spam detected');
    });

    it('allows safe content through to auth and LLM', async () => {
      setupSuccessfulRun();
      const response = await POST(
        createRequest({ content: 'what is TSLAI?', teamChatId: TEAM_CHAT_ID })
      );

      expect(response.status).toBe(200);
      expect(mockAuthenticateUser).toHaveBeenCalled();
    });
  });

  // ── Authentication ──────────────────────────────────────────────────────

  describe('authentication', () => {
    it('calls authenticateUser on every request after input check', async () => {
      setupSuccessfulRun();
      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));
      expect(mockAuthenticateUser).toHaveBeenCalledTimes(1);
    });

    it('propagates auth errors without hitting the runtime', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockRejectedValue(
        Object.assign(new Error('Unauthorized'), { status: 401 })
      );

      const req = createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID });
      await expect(POST(req)).rejects.toThrow('Unauthorized');
      expect(mockGetCoordinatorRuntime).not.toHaveBeenCalled();
    });
  });

  // ── Rate limiting ───────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({
        allowed: false,
        retryAfter: 30,
      });

      const response = await POST(
        createRequest({ content: 'buy BTC', teamChatId: TEAM_CHAT_ID })
      );

      expect(response.status).toBe(429);
      expect(mockGetCoordinatorRuntime).not.toHaveBeenCalled();
    });

    it('429 includes Retry-After header', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({
        allowed: false,
        retryAfter: 45,
      });

      const response = await POST(
        createRequest({ content: 'buy', teamChatId: TEAM_CHAT_ID })
      );
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('429 body has success=false and rate-limit error message', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({
        allowed: false,
        retryAfter: 60,
      });

      const response = await POST(
        createRequest({ content: 'x', teamChatId: TEAM_CHAT_ID })
      );
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error).toContain('Rate limit');
    });

    it('passes user.id and SEND_MESSAGE config to checkRateLimitAsync', async () => {
      setupSuccessfulRun();
      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));
      expect(mockCheckRateLimitAsync).toHaveBeenCalledWith(
        USER_ID,
        'SEND_MESSAGE'
      );
    });
  });

  // ── Team chat ownership ─────────────────────────────────────────────────

  describe('team chat ownership', () => {
    it('returns 403 when team chat does not belong to the user', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(false);

      const response = await POST(
        createRequest({ content: 'hello', teamChatId: 'someone-elses-chat' })
      );

      expect(response.status).toBe(403);
      expect(mockGetCoordinatorRuntime).not.toHaveBeenCalled();
    });

    it('403 body has success=false', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(false);

      const response = await POST(
        createRequest({ content: 'hello', teamChatId: 'other-id' })
      );
      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    it('calls validateTeamChatOwnership with user.id and teamChatId', async () => {
      setupSuccessfulRun();
      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));
      expect(mockValidateTeamChatOwnership).toHaveBeenCalledWith(
        USER_ID,
        TEAM_CHAT_ID
      );
    });
  });

  // ── Successful run ───────────────────────────────────────────────────────

  describe('successful run (no actions)', () => {
    it('returns 200', async () => {
      setupSuccessfulRun();
      const response = await POST(
        createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID })
      );
      expect(response.status).toBe(200);
    });

    it('response body contains success=true and coordinator text', async () => {
      setupSuccessfulRun();
      const response = await POST(
        createRequest({ content: 'help with this', teamChatId: TEAM_CHAT_ID })
      );
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.response).toBe('Here is your answer.');
    });

    it('writes coordinator response to DB with correct chatId', async () => {
      setupSuccessfulRun();

      let capturedInsert: Record<string, unknown> | undefined;
      mockDbInsertValues.mockImplementation(
        async (vals: Record<string, unknown>) => {
          capturedInsert = vals;
          return [];
        }
      );

      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));

      expect(mockDbInsert).toHaveBeenCalled();
      expect(capturedInsert).toBeDefined();
      expect(capturedInsert!.chatId).toBe(TEAM_CHAT_ID);
    });

    it('DB insert uses generated snowflake ID', async () => {
      setupSuccessfulRun();
      mockGenerateSnowflakeId.mockResolvedValue('snowflake-unique-xyz');

      let capturedId: unknown;
      mockDbInsertValues.mockImplementation(
        async (vals: Record<string, unknown>) => {
          capturedId = vals.id;
          return [];
        }
      );

      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));
      expect(capturedId).toBe('snowflake-unique-xyz');
    });

    it('calls broadcastChatMessage with teamChatId and response content', async () => {
      setupSuccessfulRun();
      await POST(
        createRequest({ content: 'help with this', teamChatId: TEAM_CHAT_ID })
      );

      expect(mockBroadcastChatMessage).toHaveBeenCalledTimes(1);
      const [calledChatId, calledMsg] = mockBroadcastChatMessage.mock.calls[0]!;
      expect(calledChatId).toBe(TEAM_CHAT_ID);
      expect(calledMsg.content).toBe('Here is your answer.');
    });

    it('broadcast message has chatId, content, and ISO createdAt', async () => {
      setupSuccessfulRun();
      await POST(createRequest({ content: 'test', teamChatId: TEAM_CHAT_ID }));

      const [, msg] = mockBroadcastChatMessage.mock.calls[0]!;
      expect(msg.chatId).toBe(TEAM_CHAT_ID);
      expect(msg.content).toBe('Here is your answer.');
      expect(typeof msg.createdAt).toBe('string');
    });

    it('uses getCoordinatorRuntime (not per-agent)', async () => {
      setupSuccessfulRun();
      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));
      expect(mockGetCoordinatorRuntime).toHaveBeenCalled();
    });
  });

  // ── LLM parse failure ────────────────────────────────────────────────────

  describe('LLM parse failure', () => {
    it('returns 200 with fallback text instead of throwing (not a 500)', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);
      // Return completely unparseable text for all LLM calls
      mockUseModel.mockResolvedValue('no xml here at all');

      const response = await POST(
        createRequest({ content: 'analyze BTC', teamChatId: TEAM_CHAT_ID })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.response.length).toBeGreaterThan(0);
    });

    it('sets isLLMFailure=true in response when all parse retries fail', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);
      mockUseModel.mockResolvedValue('garbage response no xml');

      const response = await POST(
        createRequest({ content: 'test', teamChatId: TEAM_CHAT_ID })
      );
      const body = await response.json();

      expect(body.isLLMFailure).toBe(true);
    });

    it('still writes fallback response to DB on parse failure', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);
      mockUseModel.mockResolvedValue('no xml');

      await POST(createRequest({ content: 'test', teamChatId: TEAM_CHAT_ID }));
      expect(mockDbInsert).toHaveBeenCalled();
    });
  });

  // ── broadcastFn injection ────────────────────────────────────────────────

  describe('broadcastChatMessage injection into state.data', () => {
    it('injects broadcastChatMessage as broadcastFn into state.data during action phase', async () => {
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);

      // Iteration 1: execute DISPATCH_TO_AGENT and finish
      mockUseModel
        .mockResolvedValueOnce(DECISION_ACTION_FINISH) // action + isFinish=true
        .mockResolvedValueOnce(SUMMARY_DISPATCHED);

      let capturedBroadcastFn: unknown;
      mockProcessActions.mockImplementation(
        async (
          _msg: unknown,
          _actions: unknown,
          state: { data?: Record<string, unknown> },
          cb: (r: unknown) => Promise<unknown[]>
        ) => {
          capturedBroadcastFn = state.data?.broadcastFn;
          await cb([{ content: { success: true, text: 'dispatched' } }]);
        }
      );

      await POST(
        createRequest({ content: 'buy TSLAI', teamChatId: TEAM_CHAT_ID })
      );

      expect(capturedBroadcastFn).toBeDefined();
      expect(typeof capturedBroadcastFn).toBe('function');
      // The injected function should be the same as broadcastChatMessage from @babylon/api
      expect(capturedBroadcastFn).toBe(mockBroadcastChatMessage);
    });
  });

  // ── Action execution ─────────────────────────────────────────────────────

  describe('action execution', () => {
    it('executes one action then returns summary response', async () => {
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);

      // Iteration 1: take action, not finish
      // Iteration 2: finish
      // Summary
      mockUseModel
        .mockResolvedValueOnce(DECISION_CHECK_PNL)
        .mockResolvedValueOnce(DECISION_FINISH_AFTER_ACTION)
        .mockResolvedValueOnce(SUMMARY_YOUR_PNL);

      mockProcessActions.mockImplementation(
        async (
          _m: unknown,
          _a: unknown,
          _s: unknown,
          cb: (r: unknown) => Promise<unknown[]>
        ) => {
          await cb([{ content: { success: true, text: 'PnL: +$42' } }]);
        }
      );

      const response = await POST(
        createRequest({ content: 'PnL?', teamChatId: TEAM_CHAT_ID })
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.response).toBe('Your PnL is +$42.');
      expect(mockProcessActions).toHaveBeenCalledTimes(1);
    });

    it('parses JSON string parameters to object before passing to processActions', async () => {
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);

      // DISPATCH_TO_AGENT with JSON string params, isFinish=true
      mockUseModel
        .mockResolvedValueOnce(DECISION_ACTION_FINISH)
        .mockResolvedValueOnce(SUMMARY_DISPATCHED);

      let capturedActionParams: unknown;
      mockProcessActions.mockImplementation(
        async (
          _m: unknown,
          _a: unknown,
          state: { data?: { actionParams?: unknown } },
          cb: (r: unknown) => Promise<unknown[]>
        ) => {
          capturedActionParams = state.data?.actionParams;
          await cb([{ content: { success: true, text: 'ok' } }]);
        }
      );

      await POST(
        createRequest({ content: 'buy TSLAI', teamChatId: TEAM_CHAT_ID })
      );

      // JSON string `{"agentId": "agent-test-id", "command": "buy TSLAI"}` was parsed to object
      expect(capturedActionParams).toMatchObject({
        agentId: 'agent-test-id',
        command: 'buy TSLAI',
      });
    });

    it('throws when LLM returns parameters as array (fail-fast validation)', async () => {
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);

      // XML with array parameters (invalid)
      const DECISION_ARRAY_PARAMS = `<output><response><thought>bad</thought><action>CHECK_PERPS</action><parameters>["a","b"]</parameters><isFinish>false</isFinish></response></output>`;
      mockUseModel.mockResolvedValueOnce(DECISION_ARRAY_PARAMS);

      const req = createRequest({ content: 'test', teamChatId: TEAM_CHAT_ID });
      await expect(POST(req)).rejects.toThrow(/Invalid parameters.*array/i);
    });
  });

  // ── User profile fetching ─────────────────────────────────────────────────

  describe('user profile DB query', () => {
    it('queries DB for user displayName and username', async () => {
      setupSuccessfulRun();

      let dbSelectCalled = false;
      mockDbSelectFrom.mockImplementation(() => {
        dbSelectCalled = true;
        return { where: mockDbSelectWhere };
      });

      await POST(createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID }));
      expect(dbSelectCalled).toBe(true);
    });

    it('completes successfully when user profile returns no rows (fallback to "User")', async () => {
      mockCheckUserInput.mockReturnValue({ safe: true });
      mockAuthenticateUser.mockResolvedValue(MOCK_USER);
      mockCheckRateLimitAsync.mockResolvedValue({ allowed: true });
      mockValidateTeamChatOwnership.mockResolvedValue(true);
      mockDbSelectLimit.mockResolvedValue([]); // no profile rows

      mockUseModel
        .mockResolvedValueOnce(DECISION_NO_ACTION)
        .mockResolvedValueOnce(SUMMARY_HERE_IS_YOUR_ANSWER);

      const response = await POST(
        createRequest({ content: 'hello', teamChatId: TEAM_CHAT_ID })
      );
      expect(response.status).toBe(200);
    });
  });
});
