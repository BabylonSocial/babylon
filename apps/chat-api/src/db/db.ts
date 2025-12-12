/**
 * Database Factory for Chat-API
 *
 * Supports both production PostgreSQL (via Bun.sql) and PGLite for testing.
 * This allows the service to own its own database connection and schema.
 */

import { join } from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import type { Logger as DrizzleLogger } from 'drizzle-orm';
import { drizzle as drizzlePglite, PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate as migratePgLite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Logger } from '../logger';
import * as schema from './schema/schema';

export const DB_SCHEMA = schema;

/**
 * Database type union - supports both PGlite and postgres-js
 */
export type Database =
  | PgliteDatabase<typeof schema>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

export type DbConfig =
  | {
      type: 'pg';
      databaseUrl: string;
    }
  | {
      type: 'pglite';
      db: PGlite;
    };

/**
 * Create a database instance
 *
 * @param config - Database configuration
 * @param config.type - 'pg' for PostgreSQL, 'pglite' for in-memory testing
 * @param drizzleLogger - Optional Drizzle logger for query debugging
 */
export function createDb(props: {
  config: DbConfig;
  logger?: DrizzleLogger;
}): Database {
  const { config, logger } = props;

  if (config.type === 'pglite') {
    return drizzlePglite(config.db, { schema, logger });
  }

  // PostgreSQL via postgres-js
  const client = postgres(config.databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzlePostgres(client, { schema, logger });
}

/**
 * Transaction type for database operations
 */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Execute a callback within a database transaction
 */
export function withTransaction<T>(
  db: Database,
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(callback);
}

/**
 * Run database migrations
 *
 * Automatically detects database type and uses appropriate migrator.
 * Migrations are stored in the drizzle folder relative to this file.
 */
export async function runMigrations(
  db: Database,
  logger?: Logger
): Promise<void> {
  logger?.info({ msg: 'Running database migrations' });

  const migrationsFolder = join(import.meta.dir, '../../drizzle');

  if (db instanceof PgliteDatabase) {
    logger?.info({
      msg: 'Running PGlite migrations',
      folder: migrationsFolder,
    });
    await migratePgLite(db, { migrationsFolder });
  } else {
    logger?.info({
      msg: 'Running PostgreSQL migrations',
      folder: migrationsFolder,
    });
    await migratePostgres(db as ReturnType<typeof drizzlePostgres>, {
      migrationsFolder,
    });
  }

  logger?.info({ msg: 'Database migrations completed' });
}

/**
 * Close database connection
 * Note: Only needed for postgres-js connections, PGLite handles cleanup differently
 */
export async function closeDatabase(db: Database): Promise<void> {
  // postgres-js connections are closed via the client
  // This is a no-op for most cases as Bun handles cleanup
}
