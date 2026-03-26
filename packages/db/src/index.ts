/**
 * Drizzle ORM Database Layer — public API
 *
 * Row/types, query operators, and helpers. For `db`, table symbols (`users`, …), and
 * `getRawDrizzle`, use `@babylon/db/runtime` (application wire-up only).
 */

// Re-export client types
export type { DrizzleClient, JsonValue, SQLValue } from './client';
export { TableRepository } from './client';
// Schema typing for advanced consumers (no runtime client)
export type {
  Database,
  StorageMode,
  Transaction,
  UserIdOrUser,
} from './db';
/**
 * Re-export unique relation types from model-types.
 *
 * Base types (User, Actor, etc.) overlap names with `export type * from './tables'` where
 * applicable; model-types remains the canonical relation-shaped types.
 */
export type {
  ActorRef,
  ActorStateRow,
  AgentGoalWithActions,
  BalanceTransactionWithUser,
  ChatWithParticipants,
  ChatWithParticipantsAndMessages,
  ChatWithRelations,
  ExternalAgentConnectionWithRegistry,
  MessageWithSender,
  ModerationEscrowWithRelations,
  NewActorStateRow,
  PoolWithActorState,
  PostWithRelations,
  TradingFeeWithUser,
  UserWithAgentRelations,
  UserWithMetrics,
} from './model-types';
// Table-related types (values like `users` are not re-exported here)
export type * from './tables';
// Re-export types
export * from './types';

// ============================================================================
// Drizzle Query Operators
// ============================================================================

// Re-export snowflake utilities from @babylon/shared
export {
  generateSnowflakeId,
  isValidSnowflakeId,
  parseSnowflakeId,
  SnowflakeGenerator,
} from '@babylon/shared';
export type { SQL } from 'drizzle-orm';
export {
  aliasedTable,
  and,
  asc,
  avg,
  between,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  max,
  min,
  ne,
  not,
  notExists,
  notInArray,
  or,
  sql,
  sum,
} from 'drizzle-orm';

// Re-export database service (import-then-export for reliable resolution in Bun/CI)
import { DatabaseService, getDbInstance } from './database-service';

export type { FeedPost } from './tables/posts';
export { DatabaseService, getDbInstance };
export {
  fetchA2aAgentCardUserRow,
  fetchA2aAgentConfigRow,
} from './a2a-agent-card-queries';
export {
  type AgentGroupChatRow,
  listAgentGroupChatsWithMemberCounts,
  listTeamGroupIds,
} from './agent-group-chat-queries';
export {
  deterministicGroupIdFromChatId,
  type RecordNpcGroupChatInviteResult,
  recordNpcGroupChatInviteTransaction,
} from './group-chat-invite-queries';
// Re-export query helpers
export {
  $connect,
  $disconnect,
  $executeRaw,
  $queryRaw,
  isRetryableError,
  withRetry,
} from './helpers';
// Re-export moderation filters
export * from './moderation/filters';
export type { PerpSnapshotA2aListingRow } from './perp-market-snapshot-queries';
export {
  getPerpMarketSnapshotPriceRowByTickerIgnoreCase,
  listPerpMarketSnapshotsForA2a,
} from './perp-market-snapshot-queries';
// Re-export query monitor
export {
  type QueryMetrics,
  queryMonitor,
  type SlowQueryStats,
} from './query-monitor';
export type { DatabaseErrorType } from './types';
// Re-export error utilities
export { isUniqueConstraintError, toDatabaseErrorType } from './types';
