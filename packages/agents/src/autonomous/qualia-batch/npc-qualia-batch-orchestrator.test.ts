import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { StaticActor } from '@babylon/engine';
import type { AutonomousBatchTickConfig } from './autonomous-batch-tick-config';
import type { BatchPlanExecutionRowResult } from './batch-plan-executor';
import type {
  AgentQualiaRow,
  BatchTickPlan,
  PrunedOpportunity,
  TickSimulationEvent,
} from './tick-simulation-types';

let eventRows: TickSimulationEvent[] = [];
let qualiaRows: AgentQualiaRow[] = [];
let opportunityRows: PrunedOpportunity[] = [];
let plannerRawText = '';
let cadenceResult: {
  allowed: boolean;
  reason: 'disabled' | 'throttled' | 'ok';
};
let executionResult: {
  results: BatchPlanExecutionRowResult[];
  actionsExecuted: number;
};

const loggerMock = {
  debug: mock(),
  error: mock(),
  info: mock(),
  warn: mock(),
};

const buildTickSimulationEventBatchMock = mock(async () => eventRows);
const commitMarketMoveSignaturesMock = mock(async () => undefined);
const buildAgentQualiaRowsMock = mock(async () => qualiaRows);
const pruneAgentEventOpportunitiesMock = mock(() => opportunityRows);
const canInvokeNpcQualiaPlannerMock = mock(async () => cadenceResult);
const markNpcQualiaPlannerRanMock = mock(async () => undefined);
const callGroqDirectMock = mock(async () => plannerRawText);
const executeValidatedBatchPlansMock = mock(async () => executionResult);

mock.module('../../shared/logger', () => ({
  logger: loggerMock,
}));

mock.module('./tick-event-batch-builder', () => ({
  buildTickSimulationEventBatch: buildTickSimulationEventBatchMock,
  commitMarketMoveSignatures: commitMarketMoveSignaturesMock,
}));

mock.module('./tick-qualia-builder', () => ({
  buildAgentQualiaRows: buildAgentQualiaRowsMock,
}));

mock.module('./tick-opportunity-pruner', () => ({
  pruneAgentEventOpportunities: pruneAgentEventOpportunitiesMock,
}));

mock.module('./npc-qualia-planner-cadence', () => ({
  canInvokeNpcQualiaPlanner: canInvokeNpcQualiaPlannerMock,
  markNpcQualiaPlannerRan: markNpcQualiaPlannerRanMock,
}));

mock.module('../../llm/direct-groq', () => ({
  callGroqDirect: callGroqDirectMock,
}));

mock.module('./batch-plan-executor', () => ({
  executeValidatedBatchPlans: executeValidatedBatchPlansMock,
}));

const { runNpcQualiaBatchOrchestrator } = await import(
  './npc-qualia-batch-orchestrator'
);

function npc(id: string, name: string): StaticActor {
  return {
    id,
    name,
    personality: 'calm and opportunistic',
  } as StaticActor;
}

function marketEvent(ticker: string): TickSimulationEvent {
  return {
    id: `mkt:${ticker}`,
    kind: 'market_move',
    summary: `${ticker} moved`,
    visibility: 'public',
    urgency: 70,
    metadata: {
      marketSignature: `${ticker}:2.0`,
      ticker,
    },
  };
}

function qualia(agentId: string, eventIds: string[]): AgentQualiaRow {
  return {
    agentId,
    cooldownSummary: 'trade:ready post:ready comment:ready',
    displayName: agentId,
    exposureLabel: 'low',
    mood: 'calm',
    perceivedEventIds: eventIds,
  };
}

function tradePlan(agentId: string, eventId: string): BatchTickPlan {
  return {
    action: 'TRADE',
    agentId,
    direction: 'BUY',
    eventId,
    needsText: false,
    priority: 90,
    reason: 'market moved',
    sizeHint: 'SMALL',
  };
}

function baseConfig(
  overrides: Partial<AutonomousBatchTickConfig> = {}
): AutonomousBatchTickConfig {
  return {
    eventWindowMs: 180_000,
    executePlanner: false,
    fallbackToMultiStep: true,
    maxActionsPerTick: 12,
    maxAgents: 50,
    maxOpportunities: 40,
    minIntervalMs: 0,
    shadowPlanner: true,
    ...overrides,
  };
}

beforeEach(() => {
  const event = marketEvent('AAA');
  const plans = [tradePlan('npc1', event.id)];

  eventRows = [event];
  qualiaRows = [qualia('npc1', [event.id])];
  opportunityRows = [{ agentId: 'npc1', eventId: event.id, score: 90 }];
  plannerRawText = JSON.stringify({ plans });
  cadenceResult = { allowed: true, reason: 'ok' };
  executionResult = { actionsExecuted: 0, results: [] };

  buildTickSimulationEventBatchMock.mockClear();
  commitMarketMoveSignaturesMock.mockClear();
  buildAgentQualiaRowsMock.mockClear();
  pruneAgentEventOpportunitiesMock.mockClear();
  canInvokeNpcQualiaPlannerMock.mockClear();
  markNpcQualiaPlannerRanMock.mockClear();
  callGroqDirectMock.mockClear();
  executeValidatedBatchPlansMock.mockClear();
});

describe('runNpcQualiaBatchOrchestrator phase 1 behavior', () => {
  test('shadow mode validates plans without execution or market dedupe side effects', async () => {
    const result = await runNpcQualiaBatchOrchestrator({
      config: baseConfig({ executePlanner: false, shadowPlanner: true }),
      npcs: [npc('npc1', 'One')],
      windowEnd: new Date('2026-04-28T08:00:00.000Z'),
    });

    expect(result.enabled).toBe(true);
    expect(result.shadow).toBe(true);
    expect(result.execute).toBe(false);
    expect(result.validatedPlans?.length).toBe(1);
    expect(result.executionResults).toBeUndefined();
    expect(executeValidatedBatchPlansMock.mock.calls.length).toBe(0);
    expect(commitMarketMoveSignaturesMock.mock.calls.length).toBe(0);
    expect(markNpcQualiaPlannerRanMock.mock.calls.length).toBe(1);
  });

  test('quiet windows skip planner invocation entirely', async () => {
    eventRows = [];

    const result = await runNpcQualiaBatchOrchestrator({
      config: baseConfig(),
      npcs: [npc('npc1', 'One')],
      windowEnd: new Date('2026-04-28T08:00:00.000Z'),
    });

    expect(result.skippedReason).toBe('quiet_window');
    expect(result.plannerLlmCalls).toBe(0);
    expect(callGroqDirectMock.mock.calls.length).toBe(0);
    expect(markNpcQualiaPlannerRanMock.mock.calls.length).toBe(0);
    expect(executeValidatedBatchPlansMock.mock.calls.length).toBe(0);
  });

  test('throttled windows skip planner invocation and cadence marking', async () => {
    cadenceResult = { allowed: false, reason: 'throttled' };

    const result = await runNpcQualiaBatchOrchestrator({
      config: baseConfig({ minIntervalMs: 300_000 }),
      npcs: [npc('npc1', 'One')],
      windowEnd: new Date('2026-04-28T08:00:00.000Z'),
    });

    expect(result.skippedReason).toBe('throttled');
    expect(result.plannerLlmCalls).toBe(0);
    expect(callGroqDirectMock.mock.calls.length).toBe(0);
    expect(markNpcQualiaPlannerRanMock.mock.calls.length).toBe(0);
    expect(executeValidatedBatchPlansMock.mock.calls.length).toBe(0);
  });

  test('execute mode commits market dedupe only for successful trade tickers', async () => {
    const aaa = marketEvent('AAA');
    const bbb = marketEvent('BBB');
    const plans = [tradePlan('npc1', aaa.id), tradePlan('npc2', bbb.id)];

    eventRows = [aaa, bbb];
    qualiaRows = [
      qualia('npc1', [aaa.id, bbb.id]),
      qualia('npc2', [aaa.id, bbb.id]),
    ];
    opportunityRows = [
      { agentId: 'npc1', eventId: aaa.id, score: 90 },
      { agentId: 'npc2', eventId: bbb.id, score: 85 },
    ];
    plannerRawText = JSON.stringify({ plans });
    executionResult = {
      actionsExecuted: 1,
      results: [
        { action: 'TRADE', agentId: 'npc1', success: true },
        {
          action: 'TRADE',
          agentId: 'npc2',
          detail: 'trade failed',
          success: false,
        },
      ],
    };

    const result = await runNpcQualiaBatchOrchestrator({
      config: baseConfig({ executePlanner: true, shadowPlanner: false }),
      npcs: [npc('npc1', 'One'), npc('npc2', 'Two')],
      windowEnd: new Date('2026-04-28T08:00:00.000Z'),
    });

    expect(result.execute).toBe(true);
    expect(result.actionsExecuted).toBe(1);
    expect(commitMarketMoveSignaturesMock.mock.calls.length).toBe(1);
    const committedEvents = commitMarketMoveSignaturesMock.mock.calls[0]?.[0];
    expect(committedEvents?.map((event) => event.metadata.ticker)).toEqual([
      'AAA',
    ]);
  });
});
