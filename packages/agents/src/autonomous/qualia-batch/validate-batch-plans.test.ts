import { describe, expect, test } from 'bun:test';
import { validateAndCapBatchPlans } from './batch-qualia-planner';
import type {
  AgentQualiaRow,
  BatchTickPlan,
  TickSimulationEvent,
} from './tick-simulation-types';

describe('validateAndCapBatchPlans', () => {
  const events: TickSimulationEvent[] = [
    {
      id: 'mkt:AAA',
      kind: 'market_move',
      summary: 'AAA +2%',
      visibility: 'public',
      urgency: 50,
      metadata: { ticker: 'AAA' },
    },
    {
      id: 'post:p1',
      kind: 'post',
      summary: 'Hello',
      visibility: 'public',
      urgency: 40,
      metadata: { postId: 'p1', actorIds: ['a1'] },
    },
  ];
  const evMap = new Map(events.map((e) => [e.id, e]));

  const qualia: AgentQualiaRow[] = [
    {
      agentId: 'npc1',
      displayName: 'One',
      perceivedEventIds: ['mkt:AAA', 'post:p1'],
      mood: 'calm',
      exposureLabel: 'low',
      cooldownSummary: 'ready',
    },
    {
      agentId: 'npc2',
      displayName: 'Two',
      perceivedEventIds: ['mkt:AAA', 'post:p1'],
      mood: 'calm',
      exposureLabel: 'low',
      cooldownSummary: 'ready',
    },
  ];

  test('accepts valid TRADE + COMMENT pair', () => {
    const plans: BatchTickPlan[] = [
      {
        agentId: 'npc1',
        action: 'TRADE',
        eventId: 'mkt:AAA',
        priority: 90,
        needsText: false,
        direction: 'BUY',
        sizeHint: 'SMALL',
        reason: 'momentum',
      },
      {
        agentId: 'npc2',
        action: 'COMMENT',
        eventId: 'post:p1',
        priority: 80,
        needsText: true,
        reason: 'engage',
      },
    ];
    const cohortIds = new Set(['npc1', 'npc2']);
    const v = validateAndCapBatchPlans({
      plans,
      cohortIds,
      eventsById: evMap,
      qualia,
      maxActionsPerTick: 12,
    });
    expect(v.ok).toBe(true);
  });

  test('rejects TRADE with wrong event kind', () => {
    const plans: BatchTickPlan[] = [
      {
        agentId: 'npc1',
        action: 'TRADE',
        eventId: 'post:p1',
        priority: 90,
        needsText: false,
        direction: 'BUY',
        reason: 'bad',
      },
      {
        agentId: 'npc2',
        action: 'SKIP',
        eventId: null,
        priority: 0,
        needsText: false,
        reason: 'none',
      },
    ];
    const cohortIds = new Set(['npc1', 'npc2']);
    const v = validateAndCapBatchPlans({
      plans,
      cohortIds,
      eventsById: evMap,
      qualia,
      maxActionsPerTick: 12,
    });
    expect(v.ok).toBe(false);
  });
});
