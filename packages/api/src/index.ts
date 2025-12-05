/**
 * Babylon API Package
 *
 * Provides API middleware and utilities for authentication, authorization,
 * and common API patterns.
 */

// Types
export type { JsonValue, ErrorLike, StringRecord } from './types';

// Logger
export { logger, Logger, type LogData, type LogLevel } from '@babylon/shared';

// Errors
export {
  ApiError,
  BabylonError,
  AuthenticationError as AuthError,
  AuthorizationError,
  BadRequestError,
  BusinessLogicError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
  isAuthenticationError as isAuthError,
  isAuthorizationError,
} from './errors';

// Agent Authentication
export {
  type AgentSession,
  type SessionStore,
  setSessionStore,
  cleanupExpiredSessions,
  verifyAgentCredentials,
  createAgentSession,
  verifyAgentSession,
  getSessionDuration,
} from './agent-auth';

// Auth Middleware
export {
  type AuthenticationError,
  authenticate,
  authenticateUser,
  authenticateWithDbUser,
  optionalAuth,
  optionalAuthFromHeaders,
  isAuthenticationError,
  getPrivyClient,
  authErrorResponse,
} from './auth-middleware';

// Re-export auth types from shared
export type { AuthenticatedUser } from '@babylon/shared';
export { extractErrorMessage } from '@babylon/shared';

// Admin Middleware
export { requireAdmin, isUserAdmin } from './admin-middleware';

// Error Handler (Next.js specific)
export {
  asyncHandler,
  errorHandler,
  errorResponse,
  successResponse,
  withErrorHandling,
  type ErrorHandlerOptions,
  type RouteContext,
} from './error-handler';

// Fetch utilities
export { type ApiFetchOptions, apiFetch, getPrivyAccessToken } from './fetch';

// User management utilities
export {
  ensureUserForAuth,
  getCanonicalUserId,
  findUserByIdentifier,
  findUserByIdentifierWithSelect,
  requireUserByIdentifier,
  type CanonicalUser,
  type EnsureUserOptions,
} from './users';

// Redis
export {
  redis,
  getRedis,
  getRedisClient,
  isRedisAvailable,
  safePublish,
  safePoll,
  closeRedis,
  streamAdd,
  streamRead,
  type RedisInstance,
  type StreamMessage,
} from './redis';

// Cache
export {
  CACHE_KEYS,
  DEFAULT_TTLS,
  clearAllCache,
  getCache,
  getCacheOrFetch,
  getCacheStats,
  invalidateCache,
  invalidateCachePattern,
  setCache,
  warmCache,
  type CacheOptions,
  cachedDb,
} from './cache';

// Rate Limiting
export {
  checkDuplicate,
  cleanupDuplicates,
  clearAllDuplicates,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
  addRateLimitHeaders,
  applyDuplicateDetection,
  applyRateLimit,
  checkRateLimitAndDuplicates,
  duplicateContentError,
  rateLimitError,
  checkRateLimit,
  cleanupRateLimits,
  clearAllRateLimits,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from './rate-limiting';

// Realtime
export {
  type RealtimeChannel,
  type RealtimeEventEnvelope,
  type RealtimeTokenPayload,
  signRealtimeToken,
  verifyRealtimeToken,
  publishEvent,
  toStreamKey,
  issueRealtimeToken,
  generateConnectionId,
} from './realtime';
export { connections } from './realtime/connection-registry';
export { drainOutboxBatch, enqueueOutbox } from './realtime/outbox';

// Profile utilities
export {
  checkProfileUpdateRateLimit,
  getProfileUpdateHistory,
  logProfileUpdate,
  isBackendSigningEnabled,
  updateProfileBackendSigned,
  verifyBackendSignedUpdate,
  type BackendSignedUpdateParams,
  type BackendSignedUpdateResult,
  type ProfileMetadata,
} from './profile';

// SSE Event Broadcasting
export {
  broadcastToChannel,
  broadcastChatMessage,
} from './sse/event-broadcaster';

// Services
export * from './services';

// Swagger
export * from './swagger';

// Server-side utilities (require Node.js crypto)
export {
  generateApiKey,
  generateTestApiKey,
  hashApiKey,
  verifyApiKey,
  getClientIp,
  getHashedClientIp,
  hashIpAddress,
  // Token counter utilities (moved from @babylon/shared)
  countTokens,
  countTokensSync,
  truncateToTokenLimit,
  truncateToTokenLimitSync,
  MODEL_TOKEN_LIMITS,
  getModelTokenLimit,
  getSafeContextLimit,
  budgetTokens,
} from './utils';

// Storage utilities (moved from @babylon/shared)
export { getStorageClient, type UploadOptions, type UploadResult } from './storage/s3-client';

// Performance monitoring (moved from @babylon/shared)
export { performanceMonitor } from './monitoring/performance-monitor';
export * from './monitoring/monitored-storage';
export * from './monitoring/monitored-cache';
