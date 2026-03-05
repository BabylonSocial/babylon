/**
 * Babylon API Package
 *
 * Provides API middleware and utilities for authentication, authorization,
 * and common API patterns.
 */

// Re-export auth types from shared
export type { AuthenticatedUser } from '@babylon/shared';
// Logger
export {
  extractErrorMessage,
  type LogData,
  Logger,
  type LogLevel,
  logger,
} from '@babylon/shared';
// Admin Audit Logging
export {
  type AdminAuditContext,
  logAdminAction,
  logAdminDelete,
  logAdminModify,
  logAdminView,
} from './admin-audit';
// Admin Middleware
export {
  type AuthenticatedAdminUser,
  getAdminRole,
  getAllAdmins,
  isUserAdmin,
  requireAdmin,
  requirePermission,
  requireSuperAdmin,
} from './admin-middleware';
// Agent Authentication
export {
  type AgentSession,
  cleanupExpiredSessions,
  createAgentSession,
  getSessionDuration,
  type SessionStore,
  setSessionStore,
  verifyAgentCredentials,
  verifyAgentSession,
} from './agent-auth';
// SIWE Authentication
export {
  consumeNonce,
  createSiweMessage,
  generateNonce,
  getAppUrl,
  getExpectedDomain,
  type NonceResponse,
  type SiweVerifyFailure,
  type SiweVerifyResult,
  type SiweVerifySuccess,
  verifySiweMessage,
} from './auth';
// Auth Middleware
export {
  type AuthenticationError,
  authErrorResponse,
  authenticate,
  authenticateUser,
  authenticateWithDbUser,
  getPrivyClient,
  isAuthenticationError,
  optionalAuth,
  optionalAuthFromHeaders,
} from './auth-middleware';
// Cache
export {
  CACHE_KEYS,
  type CacheOptions,
  cachedDb,
  clearAllCache,
  DEFAULT_TTLS,
  getCache,
  getCacheOrFetch,
  getCacheStats,
  invalidateCache,
  invalidateCachePattern,
  setCache,
  warmCache,
} from './cache';
// Cron Authentication
export {
  cronUnauthorizedResponse,
  requireCronAuth,
  verifyCronAuth,
} from './cron-auth';
// Development credentials (for local testing)
export {
  type DevCredentials,
  getDevAdminUser,
  getDevCredentials,
  isValidAgentSecret,
  isValidCronSecret,
  isValidDevAdminToken,
  logDevCredentials,
} from './dev-credentials';
// Error Handler (Next.js specific)
export {
  asyncHandler,
  type ErrorHandlerOptions,
  errorHandler,
  errorResponse,
  type RouteContext,
  successResponse,
  withErrorHandling,
} from './error-handler';
// Errors
export {
  ApiError,
  AuthenticationError as AuthError,
  AuthorizationError,
  BabylonError,
  BadRequestError,
  BusinessLogicError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  isAuthenticationError as isAuthError,
  isAuthorizationError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from './errors';
// Fetch utilities
export { type ApiFetchOptions, apiFetch, getPrivyAccessToken } from './fetch';
// Linear Integration
export {
  type CreateIssueInput,
  createLinearIssue,
  type FeedbackType,
  type FeedbackUser,
  formatFeedbackForLinear,
  getLinearConfig,
  type LinearConfig,
  type LinearFeedbackData,
  type LinearIssue,
  syncFeedbackToLinear,
} from './linear';
// Monitoring
export { cronMetrics, recordCronExecution } from './monitoring/cron-metrics';
export * from './monitoring/monitored-cache';
export * from './monitoring/monitored-storage';
// Performance monitoring (moved from @babylon/shared)
export { performanceMonitor } from './monitoring/performance-monitor';
// Profile utilities
export {
  type BackendSignedUpdateParams,
  type BackendSignedUpdateResult,
  checkProfileUpdateRateLimit,
  getProfileUpdateHistory,
  isBackendSigningEnabled,
  logProfileUpdate,
  type ProfileMetadata,
  updateProfileBackendSigned,
  verifyBackendSignedUpdate,
} from './profile';
// Query Parameter Utilities
export {
  createEnumValidator,
  MAX_DATE_RANGE_DAYS,
  parseDateParam,
  validateDateRange,
  validateEnum,
} from './query-params';
// Rate Limiting
export {
  addPublicReadHeaders,
  addRateLimitHeaders,
  applyDuplicateDetection,
  applyRateLimit,
  checkDuplicate,
  checkRateLimit,
  checkRateLimitAndDuplicates,
  checkRateLimitAsync,
  cleanupDuplicates,
  cleanupMemoryRateLimits,
  clearAllDuplicates,
  clearAllRateLimits,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  duplicateContentError,
  getDuplicateStats,
  getRateLimitStatus,
  type PublicRateLimitKind,
  type PublicRateLimitResult,
  publicRateLimit,
  RATE_LIMIT_CONFIGS,
  rateLimitError,
  resetRateLimit,
} from './rate-limiting';
// Realtime
export {
  generateConnectionId,
  issueRealtimeToken,
  publishEvent,
  type RealtimeChannel,
  type RealtimeEventEnvelope,
  type RealtimeTokenPayload,
  signRealtimeToken,
  toStreamKey,
  verifyRealtimeToken,
} from './realtime';
export { connections } from './realtime/connection-registry';
export { drainOutboxBatch, enqueueOutbox } from './realtime/outbox';
// Redis
export {
  closeRedis,
  ensureRedisReady,
  getRedis,
  getRedisClient,
  isRedisAvailable,
  type RedisInstance,
  redis,
  type StreamMessage,
  safePoll,
  safePublish,
  streamAdd,
  streamRead,
} from './redis';
// Services
export * from './services';
export {
  type AuthedPrivyUserContext,
  getAuthedUserContextFromPrivyToken,
  getAuthedUserContextFromPrivyTokenBundle,
} from './services/privy/authed-user';
export {
  extractPrivyApiDiagnostics,
  type PrivyApiDiagnostics,
  redactJwtLikeTokens,
} from './services/privy/error-diagnostics';
export { sendSponsoredEvmTransaction } from './services/privy/evm-send-transaction';
export { ensureOfflineWalletReady } from './services/privy/offline-wallet-provisioning';
// Privy (embedded wallet server-side helpers)
export {
  type PrivyUserWalletsLite,
  pickEmbeddedEvmWallet,
} from './services/privy/user-wallets';
// SSE Event Broadcasting
export {
  type AgentActivityEvent,
  broadcastAgentActivity,
  broadcastChatMessage,
  broadcastChatMessageReaction,
  broadcastChatTitleUpdate,
  broadcastThinkingIndicator,
  broadcastToChannel,
  broadcastTypingIndicator,
  type CommentActivityData,
  type MessageActivityData,
  type PostActivityData,
  type TradeActivityData,
} from './sse/event-broadcaster';
// Storage utilities (moved from @babylon/shared)
export {
  getStorageClient,
  type UploadOptions,
  type UploadResult,
} from './storage/s3-client';
// OpenAPI Schemas (shared Zod schemas for request/response validation)
export * as schemas from './schemas';
// Swagger
export * from './swagger';
// Types
export type { ErrorLike, JsonValue, StringRecord } from './types';
// User management utilities
export {
  type CanonicalUser,
  type EnsureUserOptions,
  ensureUserForAuth,
  findTargetByIdentifier,
  findUserByIdentifier,
  findUserByIdentifierWithSelect,
  getCanonicalUserId,
  requireTargetByIdentifier,
  requireUserByIdentifier,
  type TargetLookupResult,
} from './users';
// Server-side utilities (require Node.js crypto)
export {
  budgetTokens,
  // Cached user API key validation
  clearApiKeyCache,
  // Token counter utilities (moved from @babylon/shared)
  countTokens,
  countTokensSync,
  // Deployment environment detection
  type DeploymentEnvironment,
  generateApiKey,
  generateTestApiKey,
  getApiKeyCacheStats,
  getClientIp,
  getDeploymentEnvironment,
  getHashedClientIp,
  getModelTokenLimit,
  getSafeContextLimit,
  hashApiKey,
  hashIpAddress,
  invalidateCachedKey,
  invalidateCachedKeysForUser,
  MODEL_TOKEN_LIMITS,
  truncateToTokenLimit,
  truncateToTokenLimitSync,
  validateUserApiKey,
  verifyApiKey,
} from './utils';
