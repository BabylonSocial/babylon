/**
 * Env-driven limits for {@link MultiStepExecutor} (NPC iteration cap + shared retry caps).
 *
 * **Why this module exists:** Parsing lived only inside `MultiStepExecutor`, baseline estimates in
 * `autonomous-tick-baseline.ts` would drift from runtime, and operators had no single place documenting
 * defaults. Centralizing parse + defaults keeps `computeNpcTickLlmBaseline()` honest when `NPC_MAX_ITERATIONS`
 * changes in staging or prod.
 *
 * **Why `getNpcMaxIterationsForBaseline()` re-reads env:** Cron and tests may mutate `process.env`; baseline
 * helpers should reflect current config when computing worst-case NPC tick estimates, not only at first import.
 *
 * Worst-case decision LLM calls per tick (no early exit): roughly
 * `effectiveMaxIterations × MULTISTEP_MAX_DECISION_VALIDATION_PASSES × MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION`
 *
 * **Doc:** `docs/autonomous-multistep-llm-caps.md`
 */

export const DEFAULT_NPC_MAX_ITERATIONS = 12;
export const DEFAULT_MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION = 3;
export const DEFAULT_MULTISTEP_MAX_DECISION_VALIDATION_PASSES = 2;

/** Default first ctor arg: max MultiStep iterations for user-controlled agents */
export const DEFAULT_USER_MAX_ITERATIONS = 5;

function parsePositiveIntEnv(
  raw: string | undefined,
  defaultValue: number,
  min: number
): number {
  if (raw === undefined || raw.trim() === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < min) {
    return defaultValue;
  }
  return n;
}

export interface MultistepExecutorLimits {
  npcMaxIterations: number;
  multistepMaxLlmAttemptsPerDecision: number;
  multistepMaxDecisionValidationPasses: number;
}

export function readMultistepExecutorLimitsFromEnv(): MultistepExecutorLimits {
  return {
    npcMaxIterations: parsePositiveIntEnv(
      process.env.NPC_MAX_ITERATIONS,
      DEFAULT_NPC_MAX_ITERATIONS,
      1
    ),
    multistepMaxLlmAttemptsPerDecision: parsePositiveIntEnv(
      process.env.MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION,
      DEFAULT_MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION,
      1
    ),
    multistepMaxDecisionValidationPasses: parsePositiveIntEnv(
      process.env.MULTISTEP_MAX_DECISION_VALIDATION_PASSES,
      DEFAULT_MULTISTEP_MAX_DECISION_VALIDATION_PASSES,
      1
    ),
  };
}

/** Same NPC iteration cap parsing as the MultiStepExecutor singleton (call for fresh `process.env`). */
export function getNpcMaxIterationsForBaseline(): number {
  return readMultistepExecutorLimitsFromEnv().npcMaxIterations;
}

/**
 * User iteration cap for baseline + cron metrics (same parse as `MultiStepExecutor` when ctor omits
 * explicit `userMaxIterations`).
 */
export function getUserMaxIterationsForBaseline(): number {
  return parsePositiveIntEnv(
    process.env.USER_MAX_ITERATIONS,
    DEFAULT_USER_MAX_ITERATIONS,
    1
  );
}

/** Whether to skip the first-iteration LLM when `getActionabilitySummary` reports no hooks. */
export function isMultistepSkipEmptyIterationsEnabled(): boolean {
  const raw = process.env.MULTISTEP_SKIP_EMPTY_ITERATIONS?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export interface MultistepEnvSnapshot {
  npcMaxIterations: number;
  userMaxIterations: number;
  llmAttemptsPerDecision: number;
  validationPasses: number;
}

/** Fresh env snapshot for cron JSON / logging (re-read each call). */
export function readMultistepEnvSnapshot(): MultistepEnvSnapshot {
  const limits = readMultistepExecutorLimitsFromEnv();
  return {
    npcMaxIterations: limits.npcMaxIterations,
    userMaxIterations: getUserMaxIterationsForBaseline(),
    llmAttemptsPerDecision: limits.multistepMaxLlmAttemptsPerDecision,
    validationPasses: limits.multistepMaxDecisionValidationPasses,
  };
}

/**
 * Worst-case decision LLM calls for one autonomous tick slice (no early exit), per
 * `docs/autonomous-multistep-llm-caps.md`: `agents × iterations × passes × attempts`.
 */
export function computeMultistepWorstCaseDecisionCalls(
  agentCount: number,
  maxIterationsPerAgent: number,
  snapshot: Pick<
    MultistepEnvSnapshot,
    'llmAttemptsPerDecision' | 'validationPasses'
  >
): number {
  return (
    agentCount *
    maxIterationsPerAgent *
    snapshot.validationPasses *
    snapshot.llmAttemptsPerDecision
  );
}
