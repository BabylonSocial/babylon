/**
 * Worst-case LLM call estimates for autonomous cron ticks.
 *
 * Decision calls scale with MultiStepExecutor iterations per agent.
 * Text-generation calls are additional (post/comment/DM etc. inside executor).
 */

import {
  computeMultistepWorstCaseDecisionCalls,
  getNpcMaxIterationsForBaseline,
  getUserMaxIterationsForBaseline,
  readMultistepEnvSnapshot,
} from '../multistep-executor-limits';

/**
 * Baseline helpers re-read `process.env` on each call so tests and long-lived workers see current caps.
 * Use {@link getNpcMaxIterationsForBaseline} / {@link getUserMaxIterationsForBaseline} from
 * `multistep-executor-limits` if you need a one-off snapshot outside these functions.
 */

/** Env snapshot for cron JSON (`multistepEnv`). */
export type MultistepEnvForCron = ReturnType<typeof readMultistepEnvSnapshot>;

export interface NpcTickLlmBaseline {
  npcsSelected: number;
  maxLlmDecisionIterationsPerNpc: number;
  /**
   * Worst-case decision LLM calls for this NPC slice: npcs × iterations × validationPasses ×
   * llmAttemptsPerDecision (aligned with `docs/autonomous-multistep-llm-caps.md`).
   */
  worstCaseDecisionCalls: number;
  /** Rough upper bound if every iteration also generated text (not typical). */
  worstCaseDecisionPlusTextCalls: number;
  multistepEnv: MultistepEnvForCron;
  /** Alias for worst-case decision calls (cron contract name). */
  multistepWorstCaseDecisionCalls: number;
}

export function computeNpcTickLlmBaseline(
  npcsSelected: number
): NpcTickLlmBaseline {
  const maxIter = getNpcMaxIterationsForBaseline();
  const multistepEnv = readMultistepEnvSnapshot();
  const worstCaseDecisionCalls = computeMultistepWorstCaseDecisionCalls(
    npcsSelected,
    maxIter,
    multistepEnv
  );
  return {
    npcsSelected,
    maxLlmDecisionIterationsPerNpc: maxIter,
    worstCaseDecisionCalls,
    worstCaseDecisionPlusTextCalls: worstCaseDecisionCalls * 2,
    multistepEnv,
    multistepWorstCaseDecisionCalls: worstCaseDecisionCalls,
  };
}

export interface AgentTickLlmBaseline {
  eligibleUserAgents: number;
  maxLlmDecisionIterationsPerAgent: number;
  worstCaseDecisionCalls: number;
  multistepEnv: MultistepEnvForCron;
  multistepWorstCaseDecisionCalls: number;
}

export function computeAgentTickLlmBaseline(
  eligibleUserAgents: number
): AgentTickLlmBaseline {
  const maxIter = getUserMaxIterationsForBaseline();
  const multistepEnv = readMultistepEnvSnapshot();
  const worstCaseDecisionCalls = computeMultistepWorstCaseDecisionCalls(
    eligibleUserAgents,
    maxIter,
    multistepEnv
  );
  return {
    eligibleUserAgents,
    maxLlmDecisionIterationsPerAgent: maxIter,
    worstCaseDecisionCalls,
    multistepEnv,
    multistepWorstCaseDecisionCalls: worstCaseDecisionCalls,
  };
}
