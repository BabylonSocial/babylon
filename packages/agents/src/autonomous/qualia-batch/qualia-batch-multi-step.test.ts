import { describe, expect, test } from 'bun:test';
import type { AutonomousBatchTickConfig } from './autonomous-batch-tick-config';
import { computeNpcTickLlmBaseline } from './autonomous-tick-baseline';
import type { NpcQualiaBatchOrchestratorResult } from './npc-qualia-batch-orchestrator';
import { computeMultiStepNpcsAfterQualiaBatch } from './qualia-batch-multi-step';

function cfg(
  overrides: Partial<AutonomousBatchTickConfig> = {}
): AutonomousBatchTickConfig {
  return {
    eventWindowMs: 180_000,
    executePlanner: true,
    fallbackToMultiStep: true,
    maxActionsPerTick: 12,
    maxAgents: 50,
    maxOpportunities: 40,
    minIntervalMs: 0,
    shadowPlanner: false,
    ...overrides,
  };
}

function baseResult(
  overrides: Partial<NpcQualiaBatchOrchestratorResult> = {}
): NpcQualiaBatchOrchestratorResult {
  return {
    actionsExecuted: 0,
    baseline: computeNpcTickLlmBaseline(2),
    cohortSize: 2,
    enabled: true,
    eventCount: 1,
    execute: true,
    estimatedMaxTextCalls: 0,
    opportunityCount: 1,
    plannerLlmCalls: 1,
    shadow: false,
    windowEnd: new Date().toISOString(),
    windowStart: new Date().toISOString(),
    ...overrides,
  };
}

describe('computeMultiStepNpcsAfterQualiaBatch', () => {
  const npcs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const cohort = new Set(['a', 'b']);

  test('returns all NPCs when batch execute is off or shadow', () => {
    expect(
      computeMultiStepNpcsAfterQualiaBatch({
        batchCohortIds: cohort,
        batchTickConfig: cfg({ executePlanner: false }),
        npcsThisTick: npcs,
        qualiaBatch: baseResult({ executionResults: [] }),
      })
    ).toEqual(npcs);

    expect(
      computeMultiStepNpcsAfterQualiaBatch({
        batchCohortIds: cohort,
        batchTickConfig: cfg({ shadowPlanner: true, executePlanner: false }),
        npcsThisTick: npcs,
        qualiaBatch: baseResult(),
      })
    ).toEqual(npcs);
  });

  test('returns all NPCs when qualia batch did not run', () => {
    expect(
      computeMultiStepNpcsAfterQualiaBatch({
        batchCohortIds: cohort,
        batchTickConfig: cfg(),
        npcsThisTick: npcs,
        qualiaBatch: undefined,
      })
    ).toEqual(npcs);
  });

  test('after successful execution, removes batch cohort from MultiStep', () => {
    const out = computeMultiStepNpcsAfterQualiaBatch({
      batchCohortIds: cohort,
      batchTickConfig: cfg(),
      npcsThisTick: npcs,
      qualiaBatch: baseResult({
        executionResults: [
          { action: 'SKIP', agentId: 'a', success: true },
          { action: 'SKIP', agentId: 'b', success: true },
        ],
      }),
    });
    expect(out.map((n) => n.id)).toEqual(['c']);
  });

  test('quiet_window keeps full MultiStep list', () => {
    const out = computeMultiStepNpcsAfterQualiaBatch({
      batchCohortIds: cohort,
      batchTickConfig: cfg(),
      npcsThisTick: npcs,
      qualiaBatch: baseResult({ skippedReason: 'quiet_window' }),
    });
    expect(out).toEqual(npcs);
  });

  test('validation_failed with fallback keeps all NPCs on MultiStep', () => {
    const out = computeMultiStepNpcsAfterQualiaBatch({
      batchCohortIds: cohort,
      batchTickConfig: cfg({ fallbackToMultiStep: true }),
      npcsThisTick: npcs,
      qualiaBatch: baseResult({ skippedReason: 'validation_failed' }),
    });
    expect(out).toEqual(npcs);
  });

  test('validation_failed without fallback removes cohort from MultiStep', () => {
    const out = computeMultiStepNpcsAfterQualiaBatch({
      batchCohortIds: cohort,
      batchTickConfig: cfg({ fallbackToMultiStep: false }),
      npcsThisTick: npcs,
      qualiaBatch: baseResult({ skippedReason: 'planner_parse_failed' }),
    });
    expect(out.map((n) => n.id)).toEqual(['c']);
  });
});
