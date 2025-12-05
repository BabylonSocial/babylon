/**
 * Redis Module Exports
 *
 * @description Exports Redis client and utilities for use across the application.
 */

export {
  redis,
  getRedis,
  getRedisClient,
  isRedisAvailable,
  safePublish,
  safePoll,
  closeRedis,
  type RedisInstance,
} from './client';

export { streamAdd, streamRead, type StreamMessage } from './streams';
