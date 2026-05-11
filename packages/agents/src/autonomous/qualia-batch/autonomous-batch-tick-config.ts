/**
 * Env-driven config for NPC qualia-batch planner (cron LLM reduction).
 */

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') {
    return true;
  }
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') {
    return false;
  }
  return defaultValue;
}

function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
  min: number,
  max: number
): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    return defaultValue;
  }
  return Math.min(max, Math.max(min, n));
}

export interface AutonomousBatchTickConfig {
  shadowPlanner: boolean;
  executePlanner: boolean;
  fallbackToMultiStep: boolean;
  maxAgents: number;
  maxOpportunities: number;
  minIntervalMs: number;
  maxActionsPerTick: number;
  eventWindowMs: number;
}

/**
 * Shadow wins: if both shadow and execute are true, only shadow runs (no batch execution).
 */
export function getAutonomousBatchTickConfig(): AutonomousBatchTickConfig {
  const shadowPlanner = parseBool(
    process.env.AUTONOMOUS_BATCH_TICK_PLANNER_SHADOW,
    false
  );
  const executePlannerRaw = parseBool(
    process.env.AUTONOMOUS_BATCH_TICK_PLANNER,
    false
  );
  const executePlanner = executePlannerRaw && !shadowPlanner;

  return {
    shadowPlanner,
    executePlanner,
    fallbackToMultiStep: parseBool(
      process.env.AUTONOMOUS_BATCH_TICK_PLANNER_FALLBACK,
      true
    ),
    maxAgents: parsePositiveInt(
      process.env.AUTONOMOUS_BATCH_TICK_PLANNER_MAX_AGENTS,
      50,
      1,
      200
    ),
    maxOpportunities: parsePositiveInt(
      process.env.AUTONOMOUS_BATCH_TICK_PLANNER_MAX_OPPORTUNITIES,
      40,
      4,
      500
    ),
    minIntervalMs: parsePositiveInt(
      process.env.AUTONOMOUS_BATCH_TICK_MIN_INTERVAL_MS,
      300_000,
      0,
      86_400_000
    ),
    maxActionsPerTick: parsePositiveInt(
      process.env.AUTONOMOUS_BATCH_TICK_MAX_ACTIONS,
      12,
      1,
      100
    ),
    eventWindowMs: parsePositiveInt(
      process.env.AUTONOMOUS_BATCH_TICK_EVENT_WINDOW_MS,
      180_000,
      30_000,
      3_600_000
    ),
  };
}

export function isQualiaBatchPlannerEnabled(): boolean {
  const c = getAutonomousBatchTickConfig();
  return c.shadowPlanner || c.executePlanner;
}
