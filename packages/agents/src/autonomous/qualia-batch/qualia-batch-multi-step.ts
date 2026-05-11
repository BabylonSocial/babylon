import type { AutonomousBatchTickConfig } from './autonomous-batch-tick-config';
import type { NpcQualiaBatchOrchestratorResult } from './npc-qualia-batch-orchestrator';

/**
 * Computes which NPCs should still run `MultiStepExecutor` after a qualia batch pass.
 *
 * Why extracted: Phase 2 execute must only skip MultiStep when batch work actually ran.
 * Quiet/throttled/parse/validation paths must not strand NPCs that still need DMs, follows,
 * and other non-batch actions — the route used to inline this logic; tests now lock it in.
 */
export function computeMultiStepNpcsAfterQualiaBatch<
  T extends { id: string },
>(params: {
  npcsThisTick: readonly T[];
  batchCohortIds: ReadonlySet<string>;
  qualiaBatch: NpcQualiaBatchOrchestratorResult | undefined;
  batchTickConfig: Pick<
    AutonomousBatchTickConfig,
    'executePlanner' | 'shadowPlanner' | 'fallbackToMultiStep'
  >;
}): T[] {
  const { npcsThisTick, batchCohortIds, qualiaBatch, batchTickConfig } = params;

  if (
    !batchTickConfig.executePlanner ||
    batchTickConfig.shadowPlanner ||
    !qualiaBatch
  ) {
    return [...npcsThisTick];
  }

  if (qualiaBatch.executionResults !== undefined) {
    return npcsThisTick.filter((n) => !batchCohortIds.has(n.id));
  }

  if (
    qualiaBatch.skippedReason === 'validation_failed' ||
    qualiaBatch.skippedReason === 'planner_parse_failed' ||
    qualiaBatch.skippedReason === 'planner_invoke_failed'
  ) {
    return batchTickConfig.fallbackToMultiStep
      ? [...npcsThisTick]
      : npcsThisTick.filter((n) => !batchCohortIds.has(n.id));
  }

  return [...npcsThisTick];
}
