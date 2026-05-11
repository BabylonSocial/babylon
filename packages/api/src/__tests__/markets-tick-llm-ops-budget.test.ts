import { afterEach, describe, expect, it } from 'bun:test';
import {
  createMarketsTickLlmOpsBudget,
  parseMarketsTickMaxLlmMarketOpsPerRun,
} from '../cron/markets-tick-llm-ops-budget';

describe('markets-tick LLM ops budget', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('parseMarketsTickMaxLlmMarketOpsPerRun returns 0 when unset (unlimited)', () => {
    delete process.env.MARKETS_TICK_MAX_LLM_MARKET_OPS_PER_RUN;
    expect(parseMarketsTickMaxLlmMarketOpsPerRun()).toBe(0);
  });

  it('createMarketsTickLlmOpsBudget caps consumption when cap > 0', () => {
    process.env.MARKETS_TICK_MAX_LLM_MARKET_OPS_PER_RUN = '2';
    const b = createMarketsTickLlmOpsBudget();
    expect(b.cap).toBe(2);
    expect(b.getUsed()).toBe(0);
    expect(b.consumeIfAvailable()).toBe(true);
    expect(b.getUsed()).toBe(1);
    expect(b.consumeIfAvailable()).toBe(true);
    expect(b.getUsed()).toBe(2);
    expect(b.consumeIfAvailable()).toBe(false);
    expect(b.getUsed()).toBe(2);
  });

  it('createMarketsTickLlmOpsBudget tracks usage when unlimited', () => {
    delete process.env.MARKETS_TICK_MAX_LLM_MARKET_OPS_PER_RUN;
    const b = createMarketsTickLlmOpsBudget();
    expect(b.cap).toBe(0);
    expect(b.consumeIfAvailable()).toBe(true);
    expect(b.consumeIfAvailable()).toBe(true);
    expect(b.getUsed()).toBe(2);
  });
});
