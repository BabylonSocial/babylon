/**
 * Drizzle ORM Database Client
 *
 * @description Complete database abstraction layer using Drizzle ORM.
 * Pure TypeScript solution that works on all platforms including Apple Silicon.
 *
 * Features:
 * - Connection pooling optimized for serverless
 * - Automatic retry with exponential backoff
 * - Row Level Security (RLS) context support
 * - Query monitoring and performance tracking
 * - Lazy initialization for Edge Runtime compatibility
 * - Familiar ORM-style API for findUnique, findMany, create, update, delete
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  createDrizzleClient,
  type DrizzleClient,
  type SQLValue,
} from './client';
import { logger } from './logger';
import * as schema from './schema';

// Re-export everything from schema
export * from './schema';
export { schema };

// Re-export client types
export type { DrizzleClient, JsonValue, SQLValue } from './client';
export { TableRepository } from './client';
// Re-export types
export * from './types';

/**
 * Re-export unique relation types from model-types.
 *
 * Base types (User, Actor, etc.) are already exported from schema.
 */
export type {
  ChatWithParticipants,
  ChatWithParticipantsAndMessages,
  ChatWithRelations,
  UserWithMetrics,
  UserWithAgentRelations,
  PostWithRelations,
  MessageWithSender,
  PoolWithActor,
  BalanceTransactionWithUser,
  ModerationEscrowWithRelations,
  TradingFeeWithUser,
  ExternalAgentConnectionWithRegistry,
  AgentGoalWithActions,
} from './model-types';

// ============================================================================
// Types
// ============================================================================

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

// ============================================================================
// Connection Management
// ============================================================================

// Global state for database connections (serverless-safe)
// Using a type assertion here is safe because we're extending globalThis
const globalForDb = globalThis as typeof globalThis & {
  postgresClient: ReturnType<typeof postgres> | undefined;
  drizzleDb: Database | undefined;
  db: DrizzleClient | undefined;
};

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.BUN_ENV === 'test' ||
    (typeof process !== 'undefined' && process.argv?.join(' ').includes('test'))
  );
}

function getConnectionUrl(): string {
  return process.env.DATABASE_URL || 'postgresql://localhost:5432/babylon';
}

function createPostgresClient(): ReturnType<typeof postgres> {
  const url = getConnectionUrl();
  const isTest = isTestEnvironment();
  const isProd = process.env.NODE_ENV === 'production';

  // Determine if this is a local database connection
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
  
  // Check if SSL is already specified in the URL (sslmode=require or ssl=true)
  const hasExplicitSSL = url.includes('sslmode=require') || url.includes('ssl=true');
  
  // Check for cloud database providers that require SSL (Neon, Supabase, etc.)
  const isCloudProvider = 
    url.includes('neon.tech') ||
    url.includes('supabase.co') ||
    url.includes('pooler.supabase') ||
    url.includes('db.bit.io') ||
    url.includes('.postgres.database.azure.com') ||
    url.includes('.rds.amazonaws.com');

  // SSL is required for:
  // - URL explicitly specifies sslmode=require
  // - Production with non-localhost connections
  // - Any cloud database provider (even in development)
  const sslMode: 'require' | false = 
    hasExplicitSSL || (!isLocalhost && (isProd || isCloudProvider)) ? 'require' : false;

  logger.debug('[Drizzle] Creating postgres client', {
    isProd,
    isLocalhost,
    isCloudProvider,
    hasExplicitSSL,
    sslMode,
    urlHost: url.split('@')[1]?.split('/')[0] || 'unknown',
  });

  return postgres(url, {
    max: isProd ? 50 : isTest ? 5 : 10,
    idle_timeout: isProd ? 30 : 20,
    connect_timeout: 10,
    ssl: sslMode,
    transform: { undefined: null },
    onnotice: () => {},
  });
}

function getPostgresClient(): ReturnType<typeof postgres> | null {
  if (isBuildTime && !isTestEnvironment()) {
    return null;
  }

  if (!globalForDb.postgresClient) {
    const url = getConnectionUrl();
    if (!url || url === 'postgresql://localhost:5432/babylon') {
      if (isTestEnvironment()) {
        throw new Error('DATABASE_URL is required in test environment');
      }
      return null;
    }

    globalForDb.postgresClient = createPostgresClient();
    logger.info('[Drizzle] Database connection created');
  }

  return globalForDb.postgresClient;
}

function getDrizzleInstance(): Database | null {
  if (!globalForDb.drizzleDb) {
    const client = getPostgresClient();
    if (!client) return null;

    globalForDb.drizzleDb = drizzle(client, {
      schema,
      logger: process.env.NODE_ENV === 'development',
    });
  }

  return globalForDb.drizzleDb;
}

function getDbClient(): DrizzleClient | null {
  if (!globalForDb.db) {
    const drizzleInstance = getDrizzleInstance();
    if (!drizzleInstance) return null;

    globalForDb.db = createDrizzleClient(drizzleInstance);
  }

  return globalForDb.db;
}

// ============================================================================
// Retry Logic
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}

const defaultRetryConfig: RetryConfig = isTestEnvironment()
  ? { maxRetries: 2, initialDelayMs: 50, maxDelayMs: 500, jitter: false }
  : { maxRetries: 5, initialDelayMs: 100, maxDelayMs: 5000, jitter: true };

async function withRetryInternal<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        lastError.message.includes('connection') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('deadlock') ||
        lastError.message.includes('ECONNREFUSED');

      if (!isRetryable || attempt === config.maxRetries) {
        throw lastError;
      }

      logger.warn(`[Drizzle] Retry ${attempt + 1}/${config.maxRetries}`, {
        error: lastError.message,
      });

      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, config.maxDelayMs);
      if (config.jitter) delay += Math.random() * delay * 0.1;
    }
  }

  throw lastError;
}

// ============================================================================
// Lazy Database Proxy
// ============================================================================

function createLazyDbProxy(): DrizzleClient {
  const handler: ProxyHandler<DrizzleClient> = {
    get(_target, prop: string | symbol) {
      const client = getDbClient();
      if (!client) {
        if (isBuildTime) {
          // Return a proxy that returns promises resolving to null/empty
          return new Proxy(
            {},
            {
              get() {
                return () => Promise.resolve(null);
              },
            }
          );
        }
        throw new Error('Database not initialized. Check DATABASE_URL.');
      }
      return client[prop as keyof DrizzleClient];
    },
  };

  // Create proxy with proper type casting
  // The proxy intercepts all property access so the empty object target is fine
  // Proxy requires a target object, but handler intercepts all access
  // We use a partial DrizzleClient as target since handler provides all properties
  const proxyTarget: Partial<DrizzleClient> = {};
  return new Proxy(proxyTarget, handler) as DrizzleClient;
}

// ============================================================================
// Main Exports
// ============================================================================

/** Main database instance with familiar ORM-style API */
export const db: DrizzleClient = createLazyDbProxy();

/** Raw Drizzle instance for advanced queries */
export function getRawDrizzle(): Database {
  const instance = getDrizzleInstance();
  if (!instance) throw new Error('Database not initialized');
  return instance;
}

/** Execute within a transaction */
export async function withTransaction<T>(
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  const instance = getDrizzleInstance();
  if (!instance) throw new Error('Database not initialized');
  return withRetryInternal(() => instance.transaction(fn));
}

// ============================================================================
// RLS Context Support
// ============================================================================

/** User identifier - can be a string ID or an object with userId property */
export type UserIdOrUser = string | { userId: string };

/**
 * Execute as a specific user (with RLS)
 * @param userIdOrUser - A string userId or an object with userId property (e.g., AuthenticatedUser)
 * @param operation - The database operation to execute
 */
export async function asUser<T>(
  userIdOrUser: UserIdOrUser,
  operation: (database: DrizzleClient) => Promise<T>
): Promise<T> {
  // Extract userId from string or object
  const userId =
    typeof userIdOrUser === 'string' ? userIdOrUser : userIdOrUser.userId;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const privyDidRegex = /^did:privy:[a-z0-9]+$/i;
  const snowflakeRegex = /^\d{15,20}$/;

  if (
    !uuidRegex.test(userId) &&
    !privyDidRegex.test(userId) &&
    !snowflakeRegex.test(userId)
  ) {
    throw new Error(`Invalid userId format: ${userId}`);
  }

  const instance = getDrizzleInstance();
  if (!instance) throw new Error('Database not initialized');

  return withRetryInternal(() =>
    instance.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`
      );
      // Create a client wrapper for the transaction
      // Transaction type from Drizzle is compatible with Database
      const txClient = createDrizzleClient(tx);
      return operation(txClient);
    })
  );
}

/**
 * Execute as system (bypass RLS)
 */
export async function asSystem<T>(
  operation: (database: DrizzleClient) => Promise<T>,
  operationName?: string
): Promise<T> {
  const startTime = Date.now();
  if (operationName) {
    logger.debug('[Drizzle] System operation', { operation: operationName });
  }

  const instance = getDrizzleInstance();
  if (!instance) throw new Error('Database not initialized');

  const result = await withRetryInternal(() =>
    instance.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', 'system', true)`
      );
      // Transaction type is compatible with Database for our use case
      const txClient = createDrizzleClient(tx as Database);
      return operation(txClient);
    })
  );

  if (operationName) {
    logger.debug('[Drizzle] System operation completed', {
      operation: operationName,
      duration: `${Date.now() - startTime}ms`,
    });
  }

  return result;
}

/**
 * Execute as public (unauthenticated)
 */
export async function asPublic<T>(
  operation: (database: DrizzleClient) => Promise<T>
): Promise<T> {
  const instance = getDrizzleInstance();
  if (!instance) throw new Error('Database not initialized');

  return withRetryInternal(() =>
    instance.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_user_id', '', true)`);
      // Transaction type is compatible with Database for our use case
      const txClient = createDrizzleClient(tx as Database);
      return operation(txClient);
    })
  );
}

// ============================================================================
// Utilities
// ============================================================================

/** Health check */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const instance = getDrizzleInstance();
    if (!instance) return false;
    await instance.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

/** Graceful shutdown */
export async function closeDatabase(): Promise<void> {
  if (globalForDb.postgresClient) {
    await globalForDb.postgresClient.end();
    globalForDb.postgresClient = undefined;
    globalForDb.drizzleDb = undefined;
    globalForDb.db = undefined;
    logger.info('[Drizzle] Database connections closed');
  }
}

/** Execute raw SQL */
export async function executeRaw<
  T extends Record<string, SQLValue> = Record<string, SQLValue>,
>(query: ReturnType<typeof sql>): Promise<T[]> {
  const instance = getDrizzleInstance();
  if (!instance) throw new Error('Database not initialized');
  return withRetryInternal(() => instance.execute(query)) as Promise<T[]>;
}

// ============================================================================
// Drizzle Query Operators
// ============================================================================

export {
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
export type { SQL } from 'drizzle-orm';
// Re-export database service
export {
  DatabaseService,
  type FeedPost,
  getDbInstance,
} from './database-service';
// Re-export query helpers
export {
  $connect,
  $disconnect,
  $executeRaw,
  $queryRaw,
  isRetryableError,
  withRetry,
} from './helpers';
// Re-export snowflake utilities from @babylon/shared
export {
  generateSnowflakeId,
  isValidSnowflakeId,
  parseSnowflakeId,
  SnowflakeGenerator,
} from '@babylon/shared';
export type { DatabaseErrorType } from './types';
// Re-export error utilities
export { isUniqueConstraintError, toDatabaseErrorType } from './types';
// Re-export moderation filters
export * from './moderation/filters';
// Re-export query monitor
export { queryMonitor, type QueryMetrics, type SlowQueryStats } from './query-monitor';
