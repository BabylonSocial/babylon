/**
 * Rate Limiting Module
 *
 * User-level rate limiting and duplicate content detection utilities.
 * Re-exports from @babylon/api for backward compatibility.
 */

// Rate limiting (moved to @babylon/api)
export {
  checkRateLimit,
  cleanupRateLimits,
  clearAllRateLimits,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from '@babylon/api';

// Duplicate detection (in @babylon/api)
export {
  checkDuplicate,
  cleanupDuplicates,
  clearAllDuplicates,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
} from '@babylon/api';
