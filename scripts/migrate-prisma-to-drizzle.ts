#!/usr/bin/env bun
/**
 * Prisma to Drizzle Database Migration Script
 *
 * This script migrates data from the old Prisma-based database to the new Drizzle-based database.
 * It is designed to be idempotent - safe to run multiple times without duplicating data.
 *
 * CRITICAL: This script handles production data. Test thoroughly before running on production.
 *
 * Usage:
 *   SOURCE_DATABASE_URL=<prisma-db-url> TARGET_DATABASE_URL=<drizzle-db-url> bun run scripts/migrate-prisma-to-drizzle.ts
 *
 * Options:
 *   --dry-run              Preview what would be migrated without making changes (reads data, shows transformations)
 *   --dry-run-output=<dir> Output directory for dry-run data inspection (default: ./migration-preview)
 *   --sample-size=N        Number of sample records to show per table in dry-run (default: 5)
 *   --show-sql             Show the SQL statements that would be executed (in dry-run mode)
 *   --tables=<list>        Comma-separated list of tables to migrate (e.g., --tables=User,PointsTransaction)
 *   --batch-size=N         Number of records to process per batch (default: 1000)
 *   --skip-verify          Skip verification step after migration
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

// ============================================================================
// Configuration
// ============================================================================

// Prefer direct (unpooled) connections for migrations - they're better for bulk operations
const SOURCE_DATABASE_URL =
  process.env.SOURCE_DIRECT_DATABASE_URL ||
  process.env.SOURCE_DATABASE_URL_UNPOOLED ||
  process.env.SOURCE_DATABASE_URL;

const TARGET_DATABASE_URL =
  process.env.TARGET_DIRECT_DATABASE_URL ||
  process.env.TARGET_DATABASE_URL_UNPOOLED ||
  process.env.TARGET_DATABASE_URL;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const showSql = args.includes('--show-sql');
const skipVerify = args.includes('--skip-verify');
const tablesArg = args.find((arg) => arg.startsWith('--tables='));
const batchSizeArg = args.find((arg) => arg.startsWith('--batch-size='));
const outputDirArg = args.find((arg) => arg.startsWith('--dry-run-output='));
const sampleSizeArg = args.find((arg) => arg.startsWith('--sample-size='));

const specificTables = tablesArg
  ? tablesArg.replace('--tables=', '').split(',')
  : null;
const BATCH_SIZE = batchSizeArg
  ? parseInt(batchSizeArg.replace('--batch-size=', ''), 10)
  : 1000;
const DRY_RUN_OUTPUT_DIR = outputDirArg
  ? outputDirArg.replace('--dry-run-output=', '')
  : './migration-preview';
const SAMPLE_SIZE = sampleSizeArg
  ? parseInt(sampleSizeArg.replace('--sample-size=', ''), 10)
  : 5;

// ============================================================================
// Types
// ============================================================================

/** Valid database column value types that postgres can return */
type DatabaseValue = string | number | boolean | null | Date | DatabaseValue[];

/** A database row with string keys and typed values */
type DatabaseRow = Record<string, DatabaseValue>;

interface MigrationStats {
  table: string;
  sourceCount: number;
  targetCountBefore: number;
  migratedCount: number;
  skippedCount: number;
  targetCountAfter: number;
  durationMs: number;
}

interface TableMigrationConfig {
  name: string;
  primaryKey: string;
  // Column mappings: { drizzleColumn: prismaColumn } - only needed for renamed columns
  columnMappings?: Record<string, string>;
  // Columns to exclude from migration (auto-generated, etc.)
  excludeColumns?: string[];
  // Default values for new columns not in source
  defaultValues?: DatabaseRow;
  // Transform function for complex data transformations
  transform?: (row: DatabaseRow) => DatabaseRow;
  // Dependencies (tables that must be migrated first)
  dependencies?: string[];
}

// Dry-run preview data structures
interface DryRunTablePreview {
  tableName: string;
  sourceColumns: string[];
  targetColumns: string[];
  commonColumns: string[];
  sourceOnlyColumns: string[];
  targetOnlyColumns: string[];
  defaultsApplied: DatabaseRow;
  sourceRecordCount: number;
  targetRecordCountBefore: number;
  recordsToMigrate: number;
  recordsToSkip: number;
  sampleSourceRecords: DatabaseRow[];
  sampleTransformedRecords: DatabaseRow[];
  sampleSqlStatements: string[];
}

interface DryRunPreview {
  timestamp: string;
  sourceDatabase: string;
  targetDatabase: string;
  tables: DryRunTablePreview[];
  summary: {
    totalTables: number;
    totalRecordsToMigrate: number;
    totalRecordsToSkip: number;
  };
}

// ============================================================================
// Table Configurations
// ============================================================================

// Order matters for foreign key constraints
// Tables with dependencies must come after their dependencies
const TABLE_CONFIGS: TableMigrationConfig[] = [
  // ===== CORE USER TABLES (No dependencies) =====
  {
    name: 'User',
    primaryKey: 'id',
    // Drizzle adds Discord fields not in Prisma - they'll default to null
    defaultValues: {
      hasDiscord: false,
      pointsAwardedForDiscord: false,
      pointsAwardedForDiscordJoin: false,
      pointsAwardedForFarcasterFollow: false,
      pointsAwardedForTwitterFollow: false,
    },
  },
  {
    name: 'Actor',
    primaryKey: 'id',
  },
  {
    name: 'Organization',
    primaryKey: 'id',
  },
  {
    name: 'Tag',
    primaryKey: 'id',
  },
  {
    name: 'Game',
    primaryKey: 'id',
  },
  {
    name: 'GameConfig',
    primaryKey: 'id',
  },
  {
    name: 'Market',
    primaryKey: 'id',
  },
  {
    name: 'Question',
    primaryKey: 'id',
  },
  {
    name: 'RSSFeedSource',
    primaryKey: 'id',
  },
  {
    name: 'WorldFact',
    primaryKey: 'id',
  },
  {
    name: 'CharacterMapping',
    primaryKey: 'id',
  },
  {
    name: 'OrganizationMapping',
    primaryKey: 'id',
  },
  {
    name: 'SystemSettings',
    primaryKey: 'id',
  },
  {
    name: 'GenerationLock',
    primaryKey: 'id',
  },
  {
    name: 'WidgetCache',
    primaryKey: 'widget',
  },
  {
    name: 'OAuthState',
    primaryKey: 'id',
  },
  {
    name: 'OracleCommitment',
    primaryKey: 'id',
  },
  {
    name: 'OracleTransaction',
    primaryKey: 'id',
  },
  {
    name: 'RealtimeOutbox',
    primaryKey: 'id',
  },

  // ===== TABLES WITH USER DEPENDENCY =====
  {
    name: 'OnboardingIntent',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'TwitterOAuthToken',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'ProfileUpdateLog',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'Follow',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'FollowStatus',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'Favorite',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'UserBlock',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'UserMute',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'Referral',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'PointsTransaction',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'BalanceTransaction',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'TradingFee',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'Feedback',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'Report',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'ModerationEscrow',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'Notification',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'ShareAction',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'DMAcceptance',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'UserGroup',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'UserInteraction',
    primaryKey: 'id',
    dependencies: ['User'],
  },

  // ===== AGENT TABLES =====
  {
    name: 'AgentPerformanceMetrics',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'AgentLog',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'AgentMessage',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'AgentGoal',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'AgentGoalAction',
    primaryKey: 'id',
    dependencies: ['User', 'AgentGoal'],
  },
  {
    name: 'AgentPointsTransaction',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'AgentTrade',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'AgentRegistry',
    primaryKey: 'id',
    dependencies: ['User', 'Actor'],
  },
  {
    name: 'AgentCapability',
    primaryKey: 'id',
    dependencies: ['AgentRegistry'],
  },
  {
    name: 'ExternalAgentConnection',
    primaryKey: 'id',
    dependencies: ['AgentRegistry'],
  },

  // ===== ACTOR TABLES =====
  {
    name: 'ActorFollow',
    primaryKey: 'id',
    dependencies: ['Actor'],
  },
  {
    name: 'ActorRelationship',
    primaryKey: 'id',
    dependencies: ['Actor'],
  },
  {
    name: 'NPCInteraction',
    primaryKey: 'id',
    dependencies: ['Actor'],
  },
  {
    name: 'UserActorFollow',
    primaryKey: 'id',
    dependencies: ['User', 'Actor'],
  },

  // ===== POOL TABLES =====
  {
    name: 'Pool',
    primaryKey: 'id',
    dependencies: ['Actor'],
  },
  {
    name: 'PoolDeposit',
    primaryKey: 'id',
    dependencies: ['Pool', 'User'],
  },
  {
    name: 'PoolPosition',
    primaryKey: 'id',
    dependencies: ['Pool'],
  },
  {
    name: 'NPCTrade',
    primaryKey: 'id',
    dependencies: ['Actor', 'Pool'],
  },

  // ===== MARKET/TRADING TABLES =====
  {
    name: 'Position',
    primaryKey: 'id',
    dependencies: ['User', 'Market', 'Question'],
  },
  {
    name: 'PredictionPriceHistory',
    primaryKey: 'id',
    dependencies: ['Market'],
  },
  {
    name: 'StockPrice',
    primaryKey: 'id',
    dependencies: ['Organization'],
  },
  {
    name: 'PerpPosition',
    primaryKey: 'id',
    dependencies: ['User', 'Organization'],
  },

  // ===== POST/SOCIAL TABLES =====
  {
    name: 'Post',
    primaryKey: 'id',
    dependencies: ['User', 'Game'],
  },
  {
    name: 'Comment',
    primaryKey: 'id',
    dependencies: ['User', 'Post'],
  },
  {
    name: 'Reaction',
    primaryKey: 'id',
    dependencies: ['User', 'Post', 'Comment'],
  },
  {
    name: 'Share',
    primaryKey: 'id',
    dependencies: ['User', 'Post'],
  },
  {
    name: 'PostTag',
    primaryKey: 'id',
    dependencies: ['Post', 'Tag'],
  },
  {
    name: 'TrendingTag',
    primaryKey: 'id',
    dependencies: ['Tag'],
  },

  // ===== MESSAGING TABLES =====
  {
    name: 'Chat',
    primaryKey: 'id',
    dependencies: ['User', 'Game'],
  },
  {
    name: 'ChatParticipant',
    primaryKey: 'id',
    dependencies: ['Chat', 'User'],
  },
  {
    name: 'ChatAdmin',
    primaryKey: 'id',
    dependencies: ['Chat', 'User'],
  },
  {
    name: 'ChatInvite',
    primaryKey: 'id',
    dependencies: ['Chat', 'User'],
  },
  {
    name: 'Message',
    primaryKey: 'id',
    dependencies: ['Chat', 'User'],
  },
  {
    name: 'GroupChatMembership',
    primaryKey: 'id',
    dependencies: ['User', 'Chat'],
  },
  {
    name: 'UserGroupAdmin',
    primaryKey: 'id',
    dependencies: ['UserGroup', 'User'],
  },
  {
    name: 'UserGroupInvite',
    primaryKey: 'id',
    dependencies: ['UserGroup', 'User'],
  },
  {
    name: 'UserGroupMember',
    primaryKey: 'id',
    dependencies: ['UserGroup', 'User'],
  },

  // ===== WORLD TABLES =====
  {
    name: 'WorldEvent',
    primaryKey: 'id',
    dependencies: ['Game'],
  },
  {
    name: 'RSSHeadline',
    primaryKey: 'id',
    dependencies: ['RSSFeedSource'],
  },
  {
    name: 'ParodyHeadline',
    primaryKey: 'id',
    dependencies: ['RSSHeadline'],
  },

  // ===== TRAINING TABLES =====
  {
    name: 'trajectories',
    primaryKey: 'id',
    dependencies: ['User'],
  },
  {
    name: 'reward_judgments',
    primaryKey: 'id',
    dependencies: ['trajectories'],
  },
  {
    name: 'training_batches',
    primaryKey: 'id',
  },
  {
    name: 'trained_models',
    primaryKey: 'id',
  },
  {
    name: 'benchmark_results',
    primaryKey: 'id',
    dependencies: ['trained_models'],
  },
  {
    name: 'llm_call_logs',
    primaryKey: 'id',
    dependencies: ['trajectories'],
  },
  {
    name: 'market_outcomes',
    primaryKey: 'id',
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

function sanitizeForJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `<Buffer ${value.length} bytes>`;
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeForJson(v);
    }
    return result;
  }
  return value;
}

function generateInsertSql(
  tableName: string,
  primaryKey: string,
  record: DatabaseRow
): string {
  const columns = Object.keys(record);
  const columnNames = columns.map((c) => `"${c}"`).join(', ');
  const values = columns.map((col) => {
    const val = record[col];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (val instanceof Date) return `'${val.toISOString()}'`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return String(val);
  }).join(', ');

  return `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values}) ON CONFLICT ("${primaryKey}") DO NOTHING;`;
}

function ensureOutputDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writePreviewFile(preview: DryRunPreview): void {
  ensureOutputDir(DRY_RUN_OUTPUT_DIR);

  // Write full preview JSON
  const fullPreviewPath = join(DRY_RUN_OUTPUT_DIR, 'migration-preview.json');
  writeFileSync(
    fullPreviewPath,
    JSON.stringify(sanitizeForJson(preview), null, 2)
  );
  log(`Full preview written to: ${fullPreviewPath}`);

  // Write per-table files for easier inspection
  for (const table of preview.tables) {
    const tablePath = join(DRY_RUN_OUTPUT_DIR, `${table.tableName}.json`);
    writeFileSync(
      tablePath,
      JSON.stringify(sanitizeForJson(table), null, 2)
    );
  }
  log(`Per-table previews written to: ${DRY_RUN_OUTPUT_DIR}/`);

  // Write SQL file if requested
  if (showSql) {
    const sqlPath = join(DRY_RUN_OUTPUT_DIR, 'migration-statements.sql');
    let sqlContent = `-- Migration SQL Preview\n-- Generated: ${preview.timestamp}\n\n`;
    for (const table of preview.tables) {
      sqlContent += `-- ========================================\n`;
      sqlContent += `-- Table: ${table.tableName}\n`;
      sqlContent += `-- Records to migrate: ${table.recordsToMigrate}\n`;
      sqlContent += `-- ========================================\n\n`;
      for (const stmt of table.sampleSqlStatements) {
        sqlContent += `${stmt}\n`;
      }
      sqlContent += '\n';
    }
    writeFileSync(sqlPath, sqlContent);
    log(`SQL statements written to: ${sqlPath}`);
  }

  // Write summary markdown
  const summaryPath = join(DRY_RUN_OUTPUT_DIR, 'MIGRATION-SUMMARY.md');
  let markdown = `# Migration Preview Summary\n\n`;
  markdown += `Generated: ${preview.timestamp}\n\n`;
  markdown += `## Overview\n\n`;
  markdown += `- **Source Database**: ${preview.sourceDatabase}\n`;
  markdown += `- **Target Database**: ${preview.targetDatabase}\n`;
  markdown += `- **Total Tables**: ${preview.summary.totalTables}\n`;
  markdown += `- **Total Records to Migrate**: ${preview.summary.totalRecordsToMigrate}\n`;
  markdown += `- **Total Records to Skip**: ${preview.summary.totalRecordsToSkip}\n\n`;
  markdown += `## Table Details\n\n`;
  markdown += `| Table | Source | Target Before | To Migrate | To Skip | Source-Only Cols | Target-Only Cols |\n`;
  markdown += `|-------|--------|---------------|------------|---------|------------------|------------------|\n`;
  for (const t of preview.tables) {
    markdown += `| ${t.tableName} | ${t.sourceRecordCount} | ${t.targetRecordCountBefore} | ${t.recordsToMigrate} | ${t.recordsToSkip} | ${t.sourceOnlyColumns.length} | ${t.targetOnlyColumns.length} |\n`;
  }
  markdown += `\n## Files Generated\n\n`;
  markdown += `- \`migration-preview.json\` - Complete preview data\n`;
  markdown += `- \`<TableName>.json\` - Per-table preview with sample records\n`;
  if (showSql) {
    markdown += `- \`migration-statements.sql\` - SQL statements to be executed\n`;
  }
  markdown += `\n## How to Proceed\n\n`;
  markdown += `1. Review the JSON files to inspect source data and transformations\n`;
  markdown += `2. Check column mappings (sourceOnlyColumns and targetOnlyColumns)\n`;
  markdown += `3. Verify sample records look correct\n`;
  markdown += `4. Run the migration without --dry-run when ready\n`;

  writeFileSync(summaryPath, markdown);
  log(`Summary written to: ${summaryPath}`);
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
// Migration Functions
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

async function getRecordCount(
  db: ReturnType<typeof postgres>,
  tableName: string
): Promise<number> {
  const result = await db.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
  const firstRow = result[0];
  if (!firstRow) return 0;
  return parseInt(firstRow.count as string, 10);
}

async function getExistingIds(
  db: ReturnType<typeof postgres>,
  tableName: string,
  primaryKey: string
): Promise<Set<string>> {
  const result = await db.unsafe(
    `SELECT "${primaryKey}" FROM "${tableName}"`
  );
  return new Set(result.map((row) => String(row[primaryKey])));
}

interface MigrateTableResult {
  stats: MigrationStats;
  preview?: DryRunTablePreview;
}

async function migrateTable(
  sourceDb: ReturnType<typeof postgres>,
  targetDb: ReturnType<typeof postgres>,
  config: TableMigrationConfig
): Promise<MigrateTableResult> {
  const startTime = Date.now();
  const { name: tableName, primaryKey, defaultValues, transform } = config;

  log(`\n${'='.repeat(60)}`);
  log(`${isDryRun ? '[DRY-RUN] Analyzing' : 'Migrating'} table: ${tableName}`);
  log(`${'='.repeat(60)}`);

  // Check if table exists in both databases
  const sourceColumns = await getTableColumns(sourceDb, tableName);
  const targetColumns = await getTableColumns(targetDb, tableName);

  if (sourceColumns.length === 0) {
    log(`Table ${tableName} does not exist in source database`, 'warn');
    return {
      stats: {
        table: tableName,
        sourceCount: 0,
        targetCountBefore: 0,
        migratedCount: 0,
        skippedCount: 0,
        targetCountAfter: 0,
        durationMs: Date.now() - startTime,
      },
    };
  }

  if (targetColumns.length === 0) {
    log(`Table ${tableName} does not exist in target database`, 'warn');
    return {
      stats: {
        table: tableName,
        sourceCount: 0,
        targetCountBefore: 0,
        migratedCount: 0,
        skippedCount: 0,
        targetCountAfter: 0,
        durationMs: Date.now() - startTime,
      },
    };
  }

  // Get counts
  const sourceCount = await getRecordCount(sourceDb, tableName);
  const targetCountBefore = await getRecordCount(targetDb, tableName);

  log(`Source records: ${sourceCount}`);
  log(`Target records (before): ${targetCountBefore}`);

  // Find common columns (columns that exist in both source and target)
  const sourceColumnSet = new Set(sourceColumns);
  const targetColumnSet = new Set(targetColumns);
  const commonColumns = sourceColumns.filter((col) => targetColumnSet.has(col));
  const sourceOnlyColumns = sourceColumns.filter((col) => !targetColumnSet.has(col));
  const targetOnlyColumns = targetColumns.filter((col) => !sourceColumnSet.has(col));

  if (isDryRun) {
    log(`\nColumn Analysis for ${tableName}:`);
    log(`  Source columns: ${sourceColumns.length}`);
    log(`  Target columns: ${targetColumns.length}`);
    log(`  Common columns: ${commonColumns.length}`);
    if (sourceOnlyColumns.length > 0) {
      log(`  Source-only columns (will be ignored): ${sourceOnlyColumns.join(', ')}`, 'warn');
    }
    if (targetOnlyColumns.length > 0) {
      log(`  Target-only columns (will use defaults): ${targetOnlyColumns.join(', ')}`, 'warn');
    }
  } else if (targetOnlyColumns.length > 0) {
    log(`Target-only columns (will use defaults): ${targetOnlyColumns.join(', ')}`);
  }

  if (sourceCount === 0) {
    log(`No records to migrate in ${tableName}`, 'info');
    const noDefaults: DatabaseRow = {};
    const emptyPreview: DryRunTablePreview = {
      tableName,
      sourceColumns,
      targetColumns,
      commonColumns,
      sourceOnlyColumns,
      targetOnlyColumns,
      defaultsApplied: defaultValues ?? noDefaults,
      sourceRecordCount: 0,
      targetRecordCountBefore: targetCountBefore,
      recordsToMigrate: 0,
      recordsToSkip: 0,
      sampleSourceRecords: [],
      sampleTransformedRecords: [],
      sampleSqlStatements: [],
    };
    return {
      stats: {
        table: tableName,
        sourceCount,
        targetCountBefore,
        migratedCount: 0,
        skippedCount: 0,
        targetCountAfter: targetCountBefore,
        durationMs: Date.now() - startTime,
      },
      preview: isDryRun ? emptyPreview : undefined,
    };
  }

  // OPTIMIZATION: If target is empty, skip duplicate checking for faster bulk insert
  const isTargetEmpty = targetCountBefore === 0;
  let existingIds: Set<string> = new Set();
  
  if (isTargetEmpty) {
    log(`Target table is EMPTY - using fast bulk insert mode (no duplicate checking)`, 'success');
  } else {
    // Get existing IDs in target to skip duplicates (idempotency)
    log(`Target has existing data - checking for duplicates...`);
    existingIds = await getExistingIds(targetDb, tableName, primaryKey);
    log(`Existing records in target: ${existingIds.size}`);
  }

  let migratedCount = 0;
  let skippedCount = 0;
  let offset = 0;
  let batchNumber = 0;

  // For dry-run: collect sample records
  const sampleSourceRecords: DatabaseRow[] = [];
  const sampleTransformedRecords: DatabaseRow[] = [];
  const sampleSqlStatements: string[] = [];

  // Process in batches - each batch is a separate transaction
  while (offset < sourceCount) {
    batchNumber++;
    const batchStart = Date.now();
    
    // Fetch batch from source
    const columnList = commonColumns.map((c) => `"${c}"`).join(', ');
    const batch = await sourceDb.unsafe(
      `SELECT ${columnList} FROM "${tableName}" ORDER BY "${primaryKey}" LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    );

    if (batch.length === 0) break;

    // Filter out records that already exist in target (skip if target is empty)
    const newRecords = isTargetEmpty ? batch : batch.filter((row) => {
      const id = String(row[primaryKey]);
      if (existingIds.has(id)) {
        skippedCount++;
        return false;
      }
      return true;
    });

    if (newRecords.length > 0) {
      // Apply transformations and defaults
      const recordsToInsert = newRecords.map((row) => {
        let record: DatabaseRow = { ...row };

        // Apply transform function if provided
        if (transform) {
          record = transform(record);
        }

        // Apply default values for target-only columns
        if (defaultValues) {
          for (const [col, val] of Object.entries(defaultValues)) {
            if (!(col in record)) {
              record[col] = val;
            }
          }
        }

        return record;
      });

      if (isDryRun) {
        // Collect samples for preview
        for (let i = 0; i < Math.min(recordsToInsert.length, SAMPLE_SIZE - sampleSourceRecords.length); i++) {
          const sourceRecord = newRecords[i];
          const transformedRecord = recordsToInsert[i];
          if (sampleSourceRecords.length < SAMPLE_SIZE && sourceRecord && transformedRecord) {
            sampleSourceRecords.push({ ...sourceRecord });
            sampleTransformedRecords.push({ ...transformedRecord });
            sampleSqlStatements.push(generateInsertSql(tableName, primaryKey, transformedRecord));
          }
        }
        migratedCount += newRecords.length;
      } else {
        // Actually insert records - EACH BATCH IN ITS OWN TRANSACTION
        const firstRecord = recordsToInsert[0];
        if (!firstRecord) continue;
        
        const columns = Object.keys(firstRecord);
        const columnNames = columns.map((c) => `"${c}"`).join(', ');

        // Use transaction for this batch
        await targetDb.unsafe('BEGIN');
        
        for (const record of recordsToInsert) {
          const values = columns.map((col) => record[col] ?? null);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

          // Use simple INSERT for empty target (faster), ON CONFLICT for incremental
          const insertSql = isTargetEmpty
            ? `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`
            : `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT ("${primaryKey}") DO NOTHING`;

          await targetDb.unsafe(insertSql, values);
          migratedCount++;
        }
        
        await targetDb.unsafe('COMMIT');
        
        const batchDuration = Date.now() - batchStart;
        log(`  Batch ${batchNumber}: Committed ${recordsToInsert.length} records in ${batchDuration}ms`);
      }
    }

    offset += BATCH_SIZE;

    // Progress log
    const progress = Math.min(100, Math.round((offset / sourceCount) * 100));
    const totalMigrated = migratedCount;
    log(`Progress: ${progress}% (${offset}/${sourceCount} processed, ${totalMigrated} migrated, ${skippedCount} skipped)`);
  }

  const targetCountAfter = isDryRun
    ? targetCountBefore + migratedCount
    : await getRecordCount(targetDb, tableName);

  const durationMs = Date.now() - startTime;

  log(`${isDryRun ? 'Analysis' : 'Migration'} complete for ${tableName}`, 'success');
  log(`  ${isDryRun ? 'Would migrate' : 'Migrated'}: ${migratedCount}`);
  log(`  ${isDryRun ? 'Would skip' : 'Skipped'} (duplicates): ${skippedCount}`);
  log(`  Target count ${isDryRun ? 'would be' : 'after'}: ${targetCountAfter}`);
  log(`  Duration: ${formatDuration(durationMs)}`);

  // Display samples in console during dry-run
  if (isDryRun && sampleSourceRecords.length > 0) {
    log(`\n  Sample records (${sampleSourceRecords.length} of ${migratedCount}):`);
    for (let i = 0; i < sampleSourceRecords.length; i++) {
      const source = sampleSourceRecords[i];
      if (!source) continue;
      
      log(`\n  --- Record ${i + 1} ---`);
      log(`  ID: ${source[primaryKey]}`);

      // Show key fields (first 5 non-id fields)
      const keyFields = Object.keys(source).filter((k) => k !== primaryKey).slice(0, 5);
      for (const field of keyFields) {
        const val = source[field];
        const displayVal = typeof val === 'string' && val.length > 50
          ? val.substring(0, 50) + '...'
          : val;
        log(`  ${field}: ${displayVal}`);
      }

      // Show applied defaults if any
      if (defaultValues && Object.keys(defaultValues).length > 0) {
        log(`  [Defaults applied]: ${Object.keys(defaultValues).join(', ')}`);
      }

      // Show SQL if requested
      const sqlStatement = sampleSqlStatements[i];
      if (showSql && sqlStatement) {
        log(`  SQL: ${sqlStatement.substring(0, 200)}${sqlStatement.length > 200 ? '...' : ''}`);
      }
    }
  }

  const emptyDefaults: DatabaseRow = {};
  const preview: DryRunTablePreview = {
    tableName,
    sourceColumns,
    targetColumns,
    commonColumns,
    sourceOnlyColumns,
    targetOnlyColumns,
    defaultsApplied: defaultValues ?? emptyDefaults,
    sourceRecordCount: sourceCount,
    targetRecordCountBefore: targetCountBefore,
    recordsToMigrate: migratedCount,
    recordsToSkip: skippedCount,
    sampleSourceRecords,
    sampleTransformedRecords,
    sampleSqlStatements,
  };

  return {
    stats: {
      table: tableName,
      sourceCount,
      targetCountBefore,
      migratedCount,
      skippedCount,
      targetCountAfter,
      durationMs,
    },
    preview: isDryRun ? preview : undefined,
  };
}

async function verifyMigration(
  sourceDb: ReturnType<typeof postgres>,
  targetDb: ReturnType<typeof postgres>,
  stats: MigrationStats[]
): Promise<void> {
  log('\n' + '='.repeat(60));
  log('VERIFICATION');
  log('='.repeat(60));

  let hasDiscrepancies = false;

  for (const stat of stats) {
    const sourceCount = await getRecordCount(sourceDb, stat.table);
    const targetCount = await getRecordCount(targetDb, stat.table);

    if (sourceCount !== targetCount) {
      log(
        `${stat.table}: MISMATCH - Source: ${sourceCount}, Target: ${targetCount}`,
        'warn'
      );
      hasDiscrepancies = true;
    } else {
      log(`${stat.table}: OK (${sourceCount} records)`);
    }
  }

  if (hasDiscrepancies) {
    log('\nSome tables have count discrepancies. This may be expected if:', 'warn');
    log('  - Migration is still in progress');
    log('  - New data was added to source during migration');
    log('  - Some records were filtered due to constraints');
  } else {
    log('\nAll tables verified successfully!', 'success');
  }
}

// ============================================================================
// Main Migration
// ============================================================================

async function main(): Promise<void> {
  console.log('\n');
  log('='.repeat(60));
  log('PRISMA TO DRIZZLE DATABASE MIGRATION');
  log('='.repeat(60));

  if (!SOURCE_DATABASE_URL) {
    log('SOURCE_DATABASE_URL environment variable is required', 'error');
    log('Usage: SOURCE_DATABASE_URL=<url> TARGET_DATABASE_URL=<url> bun run scripts/migrate-prisma-to-drizzle.ts');
    process.exit(1);
  }

  if (!TARGET_DATABASE_URL) {
    log('TARGET_DATABASE_URL environment variable is required', 'error');
    log('Usage: SOURCE_DATABASE_URL=<url> TARGET_DATABASE_URL=<url> bun run scripts/migrate-prisma-to-drizzle.ts');
    process.exit(1);
  }

  if (isDryRun) {
    log('DRY RUN MODE - Reading data and generating preview', 'warn');
    log(`Output directory: ${DRY_RUN_OUTPUT_DIR}`);
    log(`Sample size per table: ${SAMPLE_SIZE}`);
    if (showSql) {
      log('SQL statements will be included in output');
    }
  }

  log(`Batch size: ${BATCH_SIZE}`);
  if (specificTables) {
    log(`Migrating specific tables: ${specificTables.join(', ')}`);
  }

  // Create database connections
  const sourceDb = createDbClient(SOURCE_DATABASE_URL, 'source (Prisma)');
  const targetDb = createDbClient(TARGET_DATABASE_URL, 'target (Drizzle)');

  // Extract database names for display (hide credentials)
  const sourceDbName = SOURCE_DATABASE_URL.split('@')[1]?.split('/')[0] || 'source';
  const targetDbName = TARGET_DATABASE_URL.split('@')[1]?.split('/')[0] || 'target';

  // Filter tables if specific ones requested
  let tablesToMigrate = TABLE_CONFIGS;
  if (specificTables) {
    tablesToMigrate = TABLE_CONFIGS.filter((t) =>
      specificTables.includes(t.name)
    );

    // Also include dependencies
    const includedTables = new Set(tablesToMigrate.map((t) => t.name));
    for (const table of tablesToMigrate) {
      if (table.dependencies) {
        for (const dep of table.dependencies) {
          if (!includedTables.has(dep)) {
            const depConfig = TABLE_CONFIGS.find((t) => t.name === dep);
            if (depConfig) {
              tablesToMigrate.unshift(depConfig);
              includedTables.add(dep);
            }
          }
        }
      }
    }
  }

  log(`\nTables to ${isDryRun ? 'analyze' : 'migrate'}: ${tablesToMigrate.length}`);
  tablesToMigrate.forEach((t) => log(`  - ${t.name}`));

  const allStats: MigrationStats[] = [];
  const allPreviews: DryRunTablePreview[] = [];
  const startTime = Date.now();

  // Migrate each table
  for (const config of tablesToMigrate) {
    const result = await migrateTable(sourceDb, targetDb, config);
    allStats.push(result.stats);
    if (result.preview) {
      allPreviews.push(result.preview);
    }
  }

  // Summary
  const totalDuration = Date.now() - startTime;
  log('\n' + '='.repeat(60));
  log(isDryRun ? 'DRY RUN SUMMARY' : 'MIGRATION SUMMARY');
  log('='.repeat(60));

  let totalMigrated = 0;
  let totalSkipped = 0;

  console.log('\n');
  console.log(
    '| Table | Source | Before | ' + (isDryRun ? 'Would Migrate' : 'Migrated') + ' | ' + (isDryRun ? 'Would Skip' : 'Skipped') + ' | After | Duration |'
  );
  console.log(
    '|-------|--------|--------|----------|---------|-------|----------|'
  );

  for (const stat of allStats) {
    console.log(
      `| ${stat.table.padEnd(30)} | ${String(stat.sourceCount).padStart(6)} | ${String(stat.targetCountBefore).padStart(6)} | ${String(stat.migratedCount).padStart(8)} | ${String(stat.skippedCount).padStart(7)} | ${String(stat.targetCountAfter).padStart(5)} | ${formatDuration(stat.durationMs).padStart(8)} |`
    );
    totalMigrated += stat.migratedCount;
    totalSkipped += stat.skippedCount;
  }

  console.log('\n');
  log(`Total records ${isDryRun ? 'to migrate' : 'migrated'}: ${totalMigrated}`);
  log(`Total records ${isDryRun ? 'to skip' : 'skipped'}: ${totalSkipped}`);
  log(`Total duration: ${formatDuration(totalDuration)}`);

  // Write preview files in dry-run mode
  if (isDryRun && allPreviews.length > 0) {
    log('\n' + '='.repeat(60));
    log('GENERATING PREVIEW FILES');
    log('='.repeat(60));

    const preview: DryRunPreview = {
      timestamp: new Date().toISOString(),
      sourceDatabase: sourceDbName,
      targetDatabase: targetDbName,
      tables: allPreviews,
      summary: {
        totalTables: allPreviews.length,
        totalRecordsToMigrate: totalMigrated,
        totalRecordsToSkip: totalSkipped,
      },
    };

    writePreviewFile(preview);

    log('\n' + '='.repeat(60));
    log('HOW TO INSPECT THE PREVIEW');
    log('='.repeat(60));
    log(`\n1. Browse files in: ${DRY_RUN_OUTPUT_DIR}/`);
    log('2. Review MIGRATION-SUMMARY.md for overview');
    log('3. Check individual <TableName>.json files for sample records');
    log('4. Look at sampleSourceRecords vs sampleTransformedRecords');
    log('5. Review sampleSqlStatements to see exact SQL to be executed');
    if (!showSql) {
      log('\nTip: Run with --show-sql to generate migration-statements.sql');
    }
  }

  // Verification (only for actual migration)
  if (!skipVerify && !isDryRun) {
    await verifyMigration(sourceDb, targetDb, allStats);
  }

  // Cleanup
  await sourceDb.end();
  await targetDb.end();

  if (isDryRun) {
    log('\n' + '='.repeat(60));
    log('READY TO PROCEED?');
    log('='.repeat(60));
    log('\nAfter reviewing the preview files, run without --dry-run:');
    log(`\n  SOURCE_DATABASE_URL=<url> TARGET_DATABASE_URL=<url> \\`);
    log(`  bun run scripts/migrate-prisma-to-drizzle.ts`);
    if (specificTables) {
      log(`  --tables=${specificTables.join(',')}`);
    }
  } else {
    log('\nMigration complete!', 'success');
  }
}

// Run main
main().catch((error) => {
  log(`Migration failed: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});

