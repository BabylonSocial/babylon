/**
 * Rate Limiting Module
 *
 * User-level rate limiting and duplicate content detection utilities.
 * Re-exports from @babylon/api for backward compatibility.
 */

// Rate limiting (moved to @babylon/api)
// Duplicate detection (in @babylon/api)
export {
  checkDuplicate,
  checkRateLimit,
  checkRateLimitAsync,
  cleanupDuplicates,
  cleanupMemoryRateLimits,
  clearAllDuplicates,
  clearAllRateLimits,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from '@babylon/api';
