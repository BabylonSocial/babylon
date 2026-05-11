import { afterEach, describe, expect, it } from 'bun:test';
import {
  computeAgentTickLlmBaseline,
  computeNpcTickLlmBaseline,
} from './autonomous-tick-baseline';

describe('autonomous-tick-baseline', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('computeNpcTickLlmBaseline matches hand-calculated worst case', () => {
    process.env.NPC_MAX_ITERATIONS = '4';
    process.env.MULTISTEP_MAX_DECISION_VALIDATION_PASSES = '2';
    process.env.MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION = '3';

    const npcs = 5;
    const b = computeNpcTickLlmBaseline(npcs);
    // 5 × 4 × 2 × 3 = 120
    expect(b.worstCaseDecisionCalls).toBe(120);
    expect(b.multistepWorstCaseDecisionCalls).toBe(120);
    expect(b.multistepEnv.npcMaxIterations).toBe(4);
    expect(b.multistepEnv.validationPasses).toBe(2);
    expect(b.multistepEnv.llmAttemptsPerDecision).toBe(3);
    expect(b.worstCaseDecisionPlusTextCalls).toBe(240);
  });

  it('computeAgentTickLlmBaseline uses USER_MAX_ITERATIONS when set', () => {
    process.env.USER_MAX_ITERATIONS = '7';
    process.env.MULTISTEP_MAX_DECISION_VALIDATION_PASSES = '2';
    process.env.MULTISTEP_MAX_LLM_ATTEMPTS_PER_DECISION = '2';

    const agents = 3;
    const b = computeAgentTickLlmBaseline(agents);
    // 3 × 7 × 2 × 2 = 84
    expect(b.worstCaseDecisionCalls).toBe(84);
    expect(b.multistepWorstCaseDecisionCalls).toBe(84);
    expect(b.maxLlmDecisionIterationsPerAgent).toBe(7);
  });
});
