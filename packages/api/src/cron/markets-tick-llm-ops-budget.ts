/**
 * Optional per-run ceiling for LLM-backed market operations in `markets-tick`
 * (`MARKETS_TICK_MAX_LLM_MARKET_OPS_PER_RUN`). Slots are consumed only at call sites
 * that invoke question/proof generation (not on cached-proof paths).
 */

const ENV_KEY = 'MARKETS_TICK_MAX_LLM_MARKET_OPS_PER_RUN';

export function parseMarketsTickMaxLlmMarketOpsPerRun(): number {
  const raw = process.env[ENV_KEY]?.trim();
  if (raw === undefined || raw === '') {
    return 0;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return n;
}

export interface MarketsTickLlmOpsBudget {
  /** 0 means unlimited. */
  readonly cap: number;
  /** LLM market ops consumed this run (incremented at each generation site). */
  readonly getUsed: () => number;
  /**
   * Reserve one slot for an LLM generation. Returns false when `cap > 0` and the cap is already reached.
   * When `cap === 0`, always returns true and still increments usage for observability.
   */
  consumeIfAvailable(): boolean;
}

export function createMarketsTickLlmOpsBudget(): MarketsTickLlmOpsBudget {
  const cap = parseMarketsTickMaxLlmMarketOpsPerRun();
  let used = 0;
  return {
    cap,
    getUsed: () => used,
    consumeIfAvailable(): boolean {
      if (cap > 0 && used >= cap) {
        return false;
      }
      used += 1;
      return true;
    },
  };
}
