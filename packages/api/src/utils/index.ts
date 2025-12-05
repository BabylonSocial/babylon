/**
 * API Utilities
 *
 * Server-side utilities that require Node.js crypto module.
 * These are exported from @babylon/api for server-side use only.
 */

export {
  generateApiKey,
  generateTestApiKey,
  hashApiKey,
  verifyApiKey,
} from './api-keys';

export {
  getClientIp,
  getHashedClientIp,
  hashIpAddress,
} from './ip-utils';

export {
  checkDuplicate,
  cleanupDuplicates,
  clearAllDuplicates,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
} from './duplicate-detector';

// Token counter utilities (moved from @babylon/shared)
export {
  countTokens,
  countTokensSync,
  truncateToTokenLimit,
  truncateToTokenLimitSync,
  MODEL_TOKEN_LIMITS,
  getModelTokenLimit,
  getSafeContextLimit,
  budgetTokens,
} from './token-counter';
