/**
 * User-level Rate Limiting Utility
 *
 * Implements a sliding window rate limiter with per-user tracking.
 * Uses Redis for distributed rate limiting in production (serverless-compatible).
 * Falls back to in-memory storage when Redis is unavailable.
 */

import { logger } from '@babylon/shared';
import { getRedisClient, isRedisAvailable } from '../redis/client';

interface RateLimitRecord {
  count: number;
  windowStart: number;
  recentActions: number[]; // Timestamps of recent actions for sliding window
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  actionType: string;
}

// In-memory fallback store for when Redis is unavailable
// This is NOT suitable for production serverless environments
const memoryFallbackStore = new Map<string, RateLimitRecord>();

/**
 * Predefined rate limit configurations for different actions
 */
export const RATE_LIMIT_CONFIGS = {
  // Content creation
  CREATE_POST: { maxRequests: 3, windowMs: 60000, actionType: 'create_post' }, // 3 posts per minute
  CREATE_COMMENT: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'create_comment',
  }, // 10 comments per minute

  // Interactions
  LIKE_POST: { maxRequests: 20, windowMs: 60000, actionType: 'like_post' }, // 20 likes per minute
  LIKE_COMMENT: {
    maxRequests: 20,
    windowMs: 60000,
    actionType: 'like_comment',
  }, // 20 likes per minute
  SHARE_POST: { maxRequests: 5, windowMs: 60000, actionType: 'share_post' }, // 5 shares per minute

  // Social actions
  FOLLOW_USER: { maxRequests: 10, windowMs: 60000, actionType: 'follow_user' }, // 10 follows per minute
  UNFOLLOW_USER: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'unfollow_user',
  }, // 10 unfollows per minute

  // Messages
  SEND_MESSAGE: {
    maxRequests: 20,
    windowMs: 60000,
    actionType: 'send_message',
  }, // 20 messages per minute

  // Uploads
  UPLOAD_IMAGE: { maxRequests: 5, windowMs: 60000, actionType: 'upload_image' }, // 5 uploads per minute

  // Feedback
  SUBMIT_FEEDBACK: {
    maxRequests: 5,
    windowMs: 60000,
    actionType: 'submit_feedback',
  }, // 5 feedback submissions per minute

  // Profile updates
  UPDATE_PROFILE: {
    maxRequests: 5,
    windowMs: 60000,
    actionType: 'update_profile',
  }, // 5 updates per minute

  // Agent actions
  GENERATE_AGENT_PROFILE: {
    maxRequests: 5,
    windowMs: 60000,
    actionType: 'generate_agent_profile',
  }, // 5 generations per minute
  GENERATE_AGENT_FIELD: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'generate_agent_field',
  }, // 10 field generations per minute

  // Market actions
  OPEN_POSITION: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'open_position',
  }, // 10 positions per minute
  CLOSE_POSITION: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'close_position',
  }, // 10 positions per minute
  BUY_PREDICTION: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'buy_prediction',
  }, // 10 buys per minute
  SELL_PREDICTION: {
    maxRequests: 10,
    windowMs: 60000,
    actionType: 'sell_prediction',
  }, // 10 sells per minute

  // Admin actions (more generous limits)
  ADMIN_ACTION: {
    maxRequests: 100,
    windowMs: 60000,
    actionType: 'admin_action',
  }, // 100 admin actions per minute

  // Admin stats queries (expensive operations, stricter limits)
  ADMIN_STATS: {
    maxRequests: 30,
    windowMs: 60000,
    actionType: 'admin_stats',
  }, // 30 stats queries per minute (expensive database operations)

  // Public endpoints (IP-based rate limiting)
  PUBLIC_BALANCE_FETCH: {
    maxRequests: 60,
    windowMs: 60000,
    actionType: 'public_balance_fetch',
  }, // 60 balance fetches per minute per IP (prevent enumeration)

  // Default fallback
  DEFAULT: { maxRequests: 30, windowMs: 60000, actionType: 'default' }, // 30 requests per minute
} as const;

// Redis key prefix for rate limiting
const RATE_LIMIT_KEY_PREFIX = 'ratelimit';

/**
 * Check if user has exceeded rate limit for a specific action.
 * Uses Redis for distributed rate limiting when available,
 * falls back to in-memory for development/local testing.
 *
 * Uses sliding window algorithm for accurate rate limiting.
 */
export async function checkRateLimitAsync(
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  const redis = getRedisClient();

  // Use Redis if available for distributed rate limiting
  if (redis && isRedisAvailable()) {
    return checkRateLimitRedis(userId, config);
  }

  // Fall back to in-memory (not suitable for serverless production)
  logger.debug(
    'Using in-memory rate limiting fallback',
    { userId, actionType: config.actionType },
    'RateLimiter'
  );
  return checkRateLimitMemory(userId, config);
}

/**
 * Synchronous rate limit check using in-memory fallback.
 * Kept for backwards compatibility with existing code.
 * @deprecated Use checkRateLimitAsync for proper Redis-backed rate limiting
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  // If Redis is available, we should be using the async version
  // Log a warning in production to encourage migration
  if (isRedisAvailable()) {
    logger.warn(
      'Using synchronous rate limit check with Redis available - consider using checkRateLimitAsync',
      { userId, actionType: config.actionType },
      'RateLimiter'
    );
  }
  return checkRateLimitMemory(userId, config);
}

/**
 * Redis-backed rate limiting using sorted sets for sliding window.
 * Each action is stored with its timestamp as score, allowing efficient
 * window-based counting and cleanup.
 */
async function checkRateLimitRedis(
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  const redis = getRedisClient();
  if (!redis) {
    return checkRateLimitMemory(userId, config);
  }

  const key = `${RATE_LIMIT_KEY_PREFIX}:${config.actionType}:${userId}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use a pipeline for atomic operations
    const pipeline = redis.pipeline();

    // Remove expired entries (outside current window)
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count remaining entries in the window
    pipeline.zcard(key);

    // Get the oldest entry (for retry-after calculation)
    pipeline.zrange(key, 0, 0, 'WITHSCORES');

    const results = await pipeline.exec();

    if (!results) {
      logger.warn(
        'Redis pipeline returned null',
        { userId, actionType: config.actionType },
        'RateLimiter'
      );
      return checkRateLimitMemory(userId, config);
    }

    // results[1] is the zcard result: [error, count]
    const countResult = results[1];
    const count =
      countResult && countResult[1] !== null
        ? (countResult[1] as number)
        : 0;

    // Check if limit exceeded
    if (count >= config.maxRequests) {
      // results[2] is the zrange result: [error, [[timestamp, score]]]
      const oldestResult = results[2];
      const oldestEntries =
        oldestResult && oldestResult[1]
          ? (oldestResult[1] as string[])
          : [];
      const oldestTimestampStr = oldestEntries[1];
      const oldestTimestamp =
        oldestTimestampStr !== undefined
          ? Number.parseInt(oldestTimestampStr, 10)
          : now;
      const retryAfter = Math.ceil(
        (oldestTimestamp + config.windowMs - now) / 1000
      );

      logger.warn(
        'Rate limit exceeded (Redis)',
        {
          userId,
          actionType: config.actionType,
          count,
          maxRequests: config.maxRequests,
          retryAfter,
        },
        'RateLimiter'
      );

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
      };
    }

    // Record this action
    await redis.zadd(key, now, `${now}-${Math.random().toString(36).slice(2)}`);
    // Set key expiration to window duration + buffer
    await redis.expire(key, Math.ceil(config.windowMs / 1000) + 10);

    const remaining = config.maxRequests - count - 1;

    logger.debug(
      'Rate limit check passed (Redis)',
      {
        userId,
        actionType: config.actionType,
        count: count + 1,
        maxRequests: config.maxRequests,
        remaining,
      },
      'RateLimiter'
    );

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
    };
  } catch (error) {
    logger.error(
      'Redis rate limit check failed, falling back to memory',
      {
        error: error instanceof Error ? error.message : String(error),
        userId,
        actionType: config.actionType,
      },
      'RateLimiter'
    );
    return checkRateLimitMemory(userId, config);
  }
}

/**
 * In-memory rate limiting fallback.
 * Not suitable for serverless production (each instance has separate memory).
 */
function checkRateLimitMemory(
  userId: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const key = `${userId}:${config.actionType}`;
  const now = Date.now();

  // Get or create rate limit record
  let record = memoryFallbackStore.get(key);

  if (!record) {
    record = {
      count: 0,
      windowStart: now,
      recentActions: [],
    };
    memoryFallbackStore.set(key, record);
  }

  // Remove actions outside the current window (sliding window)
  const windowStart = now - config.windowMs;
  record.recentActions = record.recentActions.filter(
    (timestamp) => timestamp > windowStart
  );

  // Check if user has exceeded the limit
  if (record.recentActions.length >= config.maxRequests) {
    const oldestAction = record.recentActions[0];
    const retryAfter = oldestAction
      ? Math.ceil((oldestAction + config.windowMs - now) / 1000)
      : Math.ceil(config.windowMs / 1000);

    logger.warn(
      'Rate limit exceeded (memory)',
      {
        userId,
        actionType: config.actionType,
        attempts: record.recentActions.length,
        maxRequests: config.maxRequests,
        retryAfter,
      },
      'RateLimiter'
    );

    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    };
  }

  // Record this action
  record.recentActions.push(now);
  record.count = record.recentActions.length;
  record.windowStart = now;

  const remaining = config.maxRequests - record.recentActions.length;

  logger.debug(
    'Rate limit check passed (memory)',
    {
      userId,
      actionType: config.actionType,
      count: record.recentActions.length,
      maxRequests: config.maxRequests,
      remaining,
    },
    'RateLimiter'
  );

  return {
    allowed: true,
    remaining,
  };
}

/**
 * Reset rate limit for a specific user and action
 * Useful for testing or manual intervention
 */
export async function resetRateLimit(
  userId: string,
  actionType: string
): Promise<void> {
  // Clear from Redis if available
  const redis = getRedisClient();
  if (redis && isRedisAvailable()) {
    const key = `${RATE_LIMIT_KEY_PREFIX}:${actionType}:${userId}`;
    await redis.del(key);
  }

  // Also clear from memory fallback
  const memoryKey = `${userId}:${actionType}`;
  memoryFallbackStore.delete(memoryKey);

  logger.info('Rate limit reset', { userId, actionType }, 'RateLimiter');
}

/**
 * Clear all rate limit records
 * Useful for testing
 */
export async function clearAllRateLimits(): Promise<void> {
  // Clear from Redis if available
  const redis = getRedisClient();
  if (redis && isRedisAvailable()) {
    try {
      // Use SCAN to find and delete all rate limit keys
      let cursor = '0';
      do {
        const [newCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          `${RATE_LIMIT_KEY_PREFIX}:*`,
          'COUNT',
          100
        );
        cursor = newCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.error(
        'Failed to clear Redis rate limits',
        { error: error instanceof Error ? error.message : String(error) },
        'RateLimiter'
      );
    }
  }

  // Clear memory fallback
  memoryFallbackStore.clear();
  logger.info('All rate limits cleared', {}, 'RateLimiter');
}

/**
 * Get current rate limit status for a user and action
 */
export async function getRateLimitStatus(
  userId: string,
  config: RateLimitConfig
): Promise<{ count: number; remaining: number; resetAt: Date }> {
  const redis = getRedisClient();
  const now = Date.now();

  // Use Redis if available
  if (redis && isRedisAvailable()) {
    const key = `${RATE_LIMIT_KEY_PREFIX}:${config.actionType}:${userId}`;
    const windowStart = now - config.windowMs;

    try {
      // Remove expired and count remaining
      await redis.zremrangebyscore(key, 0, windowStart);
      const count = await redis.zcard(key);
      const oldestEntries = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestampStr = oldestEntries[1];
      const oldestTimestamp =
        oldestTimestampStr !== undefined
          ? Number.parseInt(oldestTimestampStr, 10)
          : now;

      return {
        count,
        remaining: Math.max(0, config.maxRequests - count),
        resetAt: new Date(oldestTimestamp + config.windowMs),
      };
    } catch {
      // Fall through to memory fallback
    }
  }

  // Memory fallback
  const memoryKey = `${userId}:${config.actionType}`;
  const record = memoryFallbackStore.get(memoryKey);

  if (!record) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
    };
  }

  // Remove expired actions
  const windowStart = now - config.windowMs;
  const validActions = record.recentActions.filter(
    (timestamp) => timestamp > windowStart
  );

  const oldestAction = validActions[0] || now;

  return {
    count: validActions.length,
    remaining: Math.max(0, config.maxRequests - validActions.length),
    resetAt: new Date(oldestAction + config.windowMs),
  };
}

/**
 * Cleanup old rate limit records from memory fallback.
 * Redis handles this automatically via key expiration.
 * Call periodically to prevent memory leaks when using fallback.
 */
export function cleanupMemoryRateLimits(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  let cleanedCount = 0;

  for (const [key, record] of memoryFallbackStore.entries()) {
    // Remove records where all actions are older than maxAge
    const hasRecentActions = record.recentActions.some(
      (timestamp) => now - timestamp < maxAge
    );

    if (!hasRecentActions) {
      memoryFallbackStore.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.info(
      'Cleaned up old rate limit records (memory)',
      {
        cleanedCount,
        totalRemaining: memoryFallbackStore.size,
      },
      'RateLimiter'
    );
  }
}

// Run memory cleanup every 5 minutes (only in environments that support setInterval)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryRateLimits, 5 * 60 * 1000);
}
