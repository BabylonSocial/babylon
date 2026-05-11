import { afterEach, describe, expect, test } from 'bun:test';
import { getAutonomousBatchTickConfig } from './autonomous-batch-tick-config';

const ENV_KEYS = [
  'AUTONOMOUS_BATCH_TICK_PLANNER_SHADOW',
  'AUTONOMOUS_BATCH_TICK_PLANNER',
  'AUTONOMOUS_BATCH_TICK_PLANNER_FALLBACK',
  'AUTONOMOUS_BATCH_TICK_PLANNER_MAX_AGENTS',
  'AUTONOMOUS_BATCH_TICK_PLANNER_MAX_OPPORTUNITIES',
  'AUTONOMOUS_BATCH_TICK_MIN_INTERVAL_MS',
  'AUTONOMOUS_BATCH_TICK_MAX_ACTIONS',
  'AUTONOMOUS_BATCH_TICK_EVENT_WINDOW_MS',
] as const;

const originalEnv = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

describe('getAutonomousBatchTickConfig', () => {
  test('shadow mode wins when shadow and execute flags are both enabled', () => {
    process.env.AUTONOMOUS_BATCH_TICK_PLANNER_SHADOW = 'true';
    process.env.AUTONOMOUS_BATCH_TICK_PLANNER = 'true';

    const config = getAutonomousBatchTickConfig();

    expect(config.shadowPlanner).toBe(true);
    expect(config.executePlanner).toBe(false);
  });

  test('uses conservative phase 1 defaults when env is unset', () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }

    const config = getAutonomousBatchTickConfig();

    expect(config.shadowPlanner).toBe(false);
    expect(config.executePlanner).toBe(false);
    expect(config.fallbackToMultiStep).toBe(true);
    expect(config.maxAgents).toBe(50);
    expect(config.maxOpportunities).toBe(40);
    expect(config.minIntervalMs).toBe(300_000);
    expect(config.maxActionsPerTick).toBe(12);
    expect(config.eventWindowMs).toBe(180_000);
  });
});
