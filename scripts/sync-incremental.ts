#!/usr/bin/env bun
/**
 * Incremental Sync Script for Red-Blue Switchover
 *
 * This script syncs only NEW records that were added to the source database
 * since the last migration. It's designed for the switchover window where
 * you need to capture any data added during the brief transition period.
 *
 * Key features:
 * - Uses timestamps to find new records (more efficient than full scan)
 * - Only syncs critical user/points data
 * - Very fast for incremental updates
 * - Safe to run repeatedly
 *
 * Usage:
 *   SOURCE_DATABASE_URL=<url> TARGET_DATABASE_URL=<url> bun run scripts/sync-incremental.ts
 *
 * Options:
 *   --since=<timestamp>  Sync records created/updated since this timestamp (ISO format)
 *   --dry-run            Preview what would be synced
 *   --tables=<list>      Comma-separated list of tables to sync
 */

import postgres from 'postgres';

// ============================================================================
// Configuration
// ============================================================================

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const sinceArg = args.find((arg) => arg.startsWith('--since='));
const tablesArg = args.find((arg) => arg.startsWith('--tables='));

// Default: sync records from the last hour
const DEFAULT_SINCE = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const sinceTimestamp = sinceArg
  ? sinceArg.replace('--since=', '')
  : DEFAULT_SINCE;

const specificTables = tablesArg
  ? tablesArg.replace('--tables=', '').split(',')
  : null;

// ============================================================================
// Types
// ============================================================================

interface TableSyncConfig {
  name: string;
  primaryKey: string;
  timestampColumn: string; // Column used to detect new/updated records
  // Additional columns to check for updates (beyond primary key)
  uniqueColumns?: string[];
}

interface SyncStats {
  table: string;
  newRecords: number;
  updatedRecords: number;
  durationMs: number;
}

// ============================================================================
// Critical Tables for Incremental Sync
// ============================================================================

// Focus on the most critical tables for user data and points
const CRITICAL_TABLES: TableSyncConfig[] = [
  // User core data
  {
    name: 'User',
    primaryKey: 'id',
    timestampColumn: 'updatedAt',
  },
  // Points and balance - CRITICAL
  {
    name: 'PointsTransaction',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  {
    name: 'BalanceTransaction',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // Referrals
  {
    name: 'Referral',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // Social
  {
    name: 'Follow',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // User relationships
  {
    name: 'UserBlock',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  {
    name: 'UserMute',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // Trading
  {
    name: 'Position',
    primaryKey: 'id',
    timestampColumn: 'updatedAt',
  },
  {
    name: 'PerpPosition',
    primaryKey: 'id',
    timestampColumn: 'lastUpdated',
  },
  {
    name: 'TradingFee',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // Pools
  {
    name: 'PoolDeposit',
    primaryKey: 'id',
    timestampColumn: 'depositedAt',
  },
  // Posts and social
  {
    name: 'Post',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  {
    name: 'Comment',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  {
    name: 'Reaction',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // Messaging
  {
    name: 'Message',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  {
    name: 'Notification',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  // Agent data
  {
    name: 'AgentPerformanceMetrics',
    primaryKey: 'id',
    timestampColumn: 'updatedAt',
  },
  {
    name: 'AgentPointsTransaction',
    primaryKey: 'id',
    timestampColumn: 'createdAt',
  },
  {
    name: 'AgentTrade',
    primaryKey: 'id',
    timestampColumn: 'executedAt',
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '\x1b[36m[INFO]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m',
    success: '\x1b[32m[SUCCESS]\x1b[0m',
  }[level];
  console.log(`${timestamp} ${prefix} ${message}`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ============================================================================
// Database Connection
// ============================================================================

function createDbClient(url: string, name: string): ReturnType<typeof postgres> {
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
  const ssl = isLocalhost ? false : 'require' as const;

  log(`Connecting to ${name} database...`);

  return postgres(url, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl,
    transform: { undefined: null },
  });
}

// ============================================================================
// Sync Functions
// ============================================================================

async function getTableColumns(
  db: ReturnType<typeof postgres>,
  tableName: string
): Promise<string[]> {
  const result = await db`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  return result.map((row) => row.column_name as string);
}

async function getNewRecordsSince(
  db: ReturnType<typeof postgres>,
  tableName: string,
  timestampColumn: string,
  since: string,
  columns: string[]
): Promise<Record<string, unknown>[]> {
  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const result = await db.unsafe(
    `SELECT ${columnList} FROM "${tableName}" WHERE "${timestampColumn}" >= $1 ORDER BY "${timestampColumn}"`,
    [since]
  );
  return result as Record<string, unknown>[];
}

async function getExistingIds(
  db: ReturnType<typeof postgres>,
  tableName: string,
  primaryKey: string,
  ids: string[]
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const result = await db.unsafe(
    `SELECT "${primaryKey}" FROM "${tableName}" WHERE "${primaryKey}" IN (${placeholders})`,
    ids
  );
  return new Set(result.map((row) => String(row[primaryKey])));
}

async function syncTable(
  sourceDb: ReturnType<typeof postgres>,
  targetDb: ReturnType<typeof postgres>,
  config: TableSyncConfig,
  since: string
): Promise<SyncStats> {
  const startTime = Date.now();
  const { name: tableName, primaryKey, timestampColumn } = config;

  log(`\nSyncing: ${tableName} (since ${since})`);

  // Get columns that exist in both databases
  const sourceColumns = await getTableColumns(sourceDb, tableName);
  const targetColumns = await getTableColumns(targetDb, tableName);

  if (sourceColumns.length === 0 || targetColumns.length === 0) {
    log(`Table ${tableName} missing in source or target`, 'warn');
    return {
      table: tableName,
      newRecords: 0,
      updatedRecords: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Check if timestamp column exists
  if (!sourceColumns.includes(timestampColumn)) {
    log(`Timestamp column "${timestampColumn}" not found in ${tableName}`, 'warn');
    return {
      table: tableName,
      newRecords: 0,
      updatedRecords: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Find common columns
  const targetColumnSet = new Set(targetColumns);
  const commonColumns = sourceColumns.filter((col) => targetColumnSet.has(col));

  // Get new/updated records from source
  const records = await getNewRecordsSince(
    sourceDb,
    tableName,
    timestampColumn,
    since,
    commonColumns
  );

  log(`Found ${records.length} records to sync`);

  if (records.length === 0) {
    return {
      table: tableName,
      newRecords: 0,
      updatedRecords: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Check which records already exist in target
  const recordIds = records.map((r) => String(r[primaryKey]));
  const existingIds = await getExistingIds(targetDb, tableName, primaryKey, recordIds);

  const newRecords = records.filter((r) => !existingIds.has(String(r[primaryKey])));
  const updatedRecords = records.filter((r) => existingIds.has(String(r[primaryKey])));

  log(`New: ${newRecords.length}, Updates: ${updatedRecords.length}`);

  if (isDryRun) {
    log('DRY RUN - no changes made');
    return {
      table: tableName,
      newRecords: newRecords.length,
      updatedRecords: updatedRecords.length,
      durationMs: Date.now() - startTime,
    };
  }

  // Insert new records
  if (newRecords.length > 0) {
    const columns = Object.keys(newRecords[0]);
    const columnNames = columns.map((c) => `"${c}"`).join(', ');

    for (const record of newRecords) {
      const values = columns.map((col) => record[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      await targetDb.unsafe(
        `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT ("${primaryKey}") DO NOTHING`,
        values
      );
    }
    log(`Inserted ${newRecords.length} new records`, 'success');
  }

  // Update existing records (using UPSERT)
  if (updatedRecords.length > 0) {
    const columns = Object.keys(updatedRecords[0]);
    const columnNames = columns.map((c) => `"${c}"`).join(', ');
    const updateSet = columns
      .filter((c) => c !== primaryKey)
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(', ');

    for (const record of updatedRecords) {
      const values = columns.map((col) => record[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      await targetDb.unsafe(
        `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})
         ON CONFLICT ("${primaryKey}") DO UPDATE SET ${updateSet}`,
        values
      );
    }
    log(`Updated ${updatedRecords.length} existing records`, 'success');
  }

  return {
    table: tableName,
    newRecords: newRecords.length,
    updatedRecords: updatedRecords.length,
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('\n');
  log('='.repeat(60));
  log('INCREMENTAL SYNC FOR RED-BLUE SWITCHOVER');
  log('='.repeat(60));

  if (!SOURCE_DATABASE_URL) {
    log('SOURCE_DATABASE_URL environment variable is required', 'error');
    process.exit(1);
  }

  if (!TARGET_DATABASE_URL) {
    log('TARGET_DATABASE_URL environment variable is required', 'error');
    process.exit(1);
  }

  if (isDryRun) {
    log('DRY RUN MODE - No changes will be made', 'warn');
  }

  log(`Syncing records since: ${sinceTimestamp}`);

  // Create connections
  const sourceDb = createDbClient(SOURCE_DATABASE_URL, 'source (Prisma)');
  const targetDb = createDbClient(TARGET_DATABASE_URL, 'target (Drizzle)');

  // Filter tables if specified
  let tablesToSync = CRITICAL_TABLES;
  if (specificTables) {
    tablesToSync = CRITICAL_TABLES.filter((t) =>
      specificTables.includes(t.name)
    );
    log(`Syncing specific tables: ${specificTables.join(', ')}`);
  }

  const allStats: SyncStats[] = [];
  const startTime = Date.now();

  // Sync each table
  for (const config of tablesToSync) {
    const stats = await syncTable(sourceDb, targetDb, config, sinceTimestamp);
    allStats.push(stats);
  }

  // Summary
  const totalDuration = Date.now() - startTime;
  log('\n' + '='.repeat(60));
  log('SYNC SUMMARY');
  log('='.repeat(60));

  let totalNew = 0;
  let totalUpdated = 0;

  console.log('\n');
  console.log('| Table | New | Updated | Duration |');
  console.log('|-------|-----|---------|----------|');

  for (const stat of allStats) {
    console.log(
      `| ${stat.table.padEnd(30)} | ${String(stat.newRecords).padStart(3)} | ${String(stat.updatedRecords).padStart(7)} | ${formatDuration(stat.durationMs).padStart(8)} |`
    );
    totalNew += stat.newRecords;
    totalUpdated += stat.updatedRecords;
  }

  console.log('\n');
  log(`Total new records: ${totalNew}`);
  log(`Total updated records: ${totalUpdated}`);
  log(`Total duration: ${formatDuration(totalDuration)}`);

  // Cleanup
  await sourceDb.end();
  await targetDb.end();

  log('\nIncremental sync complete!', 'success');

  if (isDryRun) {
    log('\nThis was a DRY RUN. Run without --dry-run to perform actual sync.', 'warn');
  }

  // Output the timestamp to use for next sync
  const nextSince = new Date().toISOString();
  log(`\nFor next sync, use: --since=${nextSince}`);
}

// Run main
main().catch((error) => {
  log(`Sync failed: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});

