import { getRedisClient, isRedisAvailable } from '@babylon/api';
import { logger } from '../../shared/logger';

const REDIS_KEY = 'cron:npc-qualia-planner:last-llm-ms';
const REDIS_KEY_TTL_SECONDS = 60 * 60 * 24;

/**
 * Returns whether an LLM-backed qualia planner call is allowed by min-interval.
 * When Redis is unavailable and interval > 0, allows the call (operational default).
 */
export async function canInvokeNpcQualiaPlanner(
  minIntervalMs: number
): Promise<{ allowed: boolean; reason: 'disabled' | 'throttled' | 'ok' }> {
  if (minIntervalMs <= 0) {
    return { allowed: true, reason: 'ok' };
  }

  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    logger.warn(
      'AUTONOMOUS_BATCH_TICK_MIN_INTERVAL_MS set but Redis unavailable — allowing planner',
      { minIntervalMs },
      'NpcQualiaPlannerCadence'
    );
    return { allowed: true, reason: 'ok' };
  }

  const now = Date.now();
  const prev = await client.get(REDIS_KEY);
  if (prev) {
    const t = Number(prev);
    if (Number.isFinite(t) && now - t < minIntervalMs) {
      return { allowed: false, reason: 'throttled' };
    }
  }
  return { allowed: true, reason: 'ok' };
}

/** Call after a planner LLM request completes (success or parse failure after response). */
export async function markNpcQualiaPlannerRan(): Promise<void> {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return;
  }
  await client.set(REDIS_KEY, String(Date.now()), 'EX', REDIS_KEY_TTL_SECONDS);
}
