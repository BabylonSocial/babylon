/**
 * Rate Limiting and Duplicate Detection
 *
 * Centralized exports for rate limiting functionality
 */

// Rate limiting (moved from @babylon/shared)
export {
  checkRateLimit,
  cleanupRateLimits,
  clearAllRateLimits,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from './user-rate-limiter';

// Duplicate detection (uses crypto, moved to api)
export {
  checkDuplicate,
  cleanupDuplicates,
  clearAllDuplicates,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
} from '../utils/duplicate-detector';

// Middleware
export {
  addRateLimitHeaders,
  applyDuplicateDetection,
  applyRateLimit,
  checkRateLimitAndDuplicates,
  duplicateContentError,
  rateLimitError,
} from './middleware';
