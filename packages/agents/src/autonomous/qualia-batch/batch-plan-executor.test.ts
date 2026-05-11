import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type {
  BatchTickPlan,
  TickSimulationEvent,
} from './tick-simulation-types';

const executeDirectTradeMock = mock(async (params: { agentUserId: string }) => {
  if (params.agentUserId === 'trade-fail') {
    return { error: 'insufficient', success: false, ticker: 'AAA' };
  }
  if (params.agentUserId === 'trade-throw') {
    throw new Error('simulated network failure');
  }
  return { success: true, ticker: 'AAA' };
});

const executeDirectPostMock = mock(async () => ({
  postId: 'post-1',
  success: true,
}));

const executeDirectCommentMock = mock(async () => ({
  commentId: 'c-1',
  success: true,
}));

const callGroqDirectMock = mock(async () => 'generated body text');

mock.module('../../shared/logger', () => ({
  logger: {
    debug: mock(),
    error: mock(),
    info: mock(),
    warn: mock(),
  },
}));

mock.module('../../llm/direct-groq', () => ({
  callGroqDirect: callGroqDirectMock,
}));

mock.module('../DirectExecutors', () => ({
  executeDirectComment: executeDirectCommentMock,
  executeDirectPost: executeDirectPostMock,
  executeDirectTrade: executeDirectTradeMock,
}));

const { executeValidatedBatchPlans } = await import('./batch-plan-executor');

const mktEvent = (id: string, ticker: string): TickSimulationEvent => ({
  id,
  kind: 'market_move',
  metadata: { marketSignature: `${ticker}:1.0`, ticker },
  summary: `${ticker} move`,
  urgency: 50,
  visibility: 'public',
});

beforeEach(() => {
  executeDirectTradeMock.mockClear();
  executeDirectPostMock.mockClear();
  executeDirectCommentMock.mockClear();
  callGroqDirectMock.mockClear();
});

describe('executeValidatedBatchPlans', () => {
  test('does not abort the batch when one TRADE fails', async () => {
    const events = [mktEvent('mkt:A', 'A'), mktEvent('mkt:B', 'B')];
    const eventsById = new Map(events.map((e) => [e.id, e]));

    const plans: BatchTickPlan[] = [
      {
        action: 'TRADE',
        agentId: 'trade-fail',
        direction: 'BUY',
        eventId: 'mkt:A',
        needsText: false,
        priority: 100,
        reason: 'first',
        sizeHint: 'SMALL',
      },
      {
        action: 'TRADE',
        agentId: 'trade-ok',
        direction: 'BUY',
        eventId: 'mkt:B',
        needsText: false,
        priority: 10,
        reason: 'second',
        sizeHint: 'SMALL',
      },
    ];

    const out = await executeValidatedBatchPlans({
      displayNameByAgentId: new Map(),
      eventsById,
      moodByAgentId: new Map(),
      plans,
    });

    expect(out.results).toHaveLength(2);
    expect(out.results[0]?.success).toBe(false);
    expect(out.results[0]?.agentId).toBe('trade-fail');
    expect(out.results[1]?.success).toBe(true);
    expect(out.results[1]?.agentId).toBe('trade-ok');
    expect(out.actionsExecuted).toBe(1);
    expect(executeDirectTradeMock.mock.calls.length).toBe(2);
  });

  test('captures thrown errors per row and still runs later plans', async () => {
    const events = [
      mktEvent('mkt:A', 'A'),
      mktEvent('mkt:B', 'B'),
      mktEvent('mkt:C', 'C'),
    ];
    const eventsById = new Map(events.map((e) => [e.id, e]));

    const plans: BatchTickPlan[] = [
      {
        action: 'TRADE',
        agentId: 'trade-ok',
        direction: 'BUY',
        eventId: 'mkt:A',
        needsText: false,
        priority: 100,
        reason: 'first',
        sizeHint: 'SMALL',
      },
      {
        action: 'TRADE',
        agentId: 'trade-throw',
        direction: 'BUY',
        eventId: 'mkt:B',
        needsText: false,
        priority: 50,
        reason: 'second',
        sizeHint: 'SMALL',
      },
      {
        action: 'TRADE',
        agentId: 'trade-ok-after-throw',
        direction: 'BUY',
        eventId: 'mkt:C',
        needsText: false,
        priority: 10,
        reason: 'third after throw',
        sizeHint: 'SMALL',
      },
    ];

    const out = await executeValidatedBatchPlans({
      displayNameByAgentId: new Map(),
      eventsById,
      moodByAgentId: new Map(),
      plans,
    });

    expect(out.results).toHaveLength(3);
    expect(out.results[0]?.success).toBe(true);
    expect(out.results[0]?.agentId).toBe('trade-ok');
    expect(out.results[1]?.success).toBe(false);
    expect(out.results[1]?.agentId).toBe('trade-throw');
    expect(out.results[1]?.detail).toContain('simulated network failure');
    expect(out.results[2]?.success).toBe(true);
    expect(out.results[2]?.agentId).toBe('trade-ok-after-throw');
    expect(out.actionsExecuted).toBe(2);
    expect(executeDirectTradeMock.mock.calls.length).toBe(3);
  });
});
