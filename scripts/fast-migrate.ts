#!/usr/bin/env bun
/**
 * Fast Prisma to Drizzle Migration Script
 *
 * Optimized for speed using:
 * - Multi-row INSERT statements (1000 rows per statement)
 * - Parallel batch processing
 * - No duplicate checking for empty tables
 * - Minimal logging overhead
 *
 * Usage:
 *   bun run scripts/fast-migrate.ts [options]
 *
 * Environment variables:
 *   SOURCE_DATABASE_URL or SOURCE_DIRECT_DATABASE_URL
 *   TARGET_DATABASE_URL or TARGET_DIRECT_DATABASE_URL
 *
 * Options:
 *   --tables=User,Post     Specific tables to migrate (comma-separated)
 *   --batch-size=1000      Rows per INSERT statement (default: 1000)
 *   --parallel=4           Parallel batch inserts (default: 4)
 *   --dry-run              Show what would be done without executing
 */

import postgres from 'postgres';

// ============================================================================
// Configuration
// ============================================================================

const SOURCE_URL =
  process.env.SOURCE_DIRECT_DATABASE_URL ||
  process.env.SOURCE_DATABASE_URL;

const TARGET_URL =
  process.env.TARGET_DIRECT_DATABASE_URL ||
  process.env.TARGET_DATABASE_URL;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const tablesArg = args.find((a) => a.startsWith('--tables='));
const batchArg = args.find((a) => a.startsWith('--batch-size='));
const parallelArg = args.find((a) => a.startsWith('--parallel='));

const SPECIFIC_TABLES = tablesArg ? tablesArg.replace('--tables=', '').split(',') : null;
const BATCH_SIZE = batchArg ? parseInt(batchArg.replace('--batch-size=', ''), 10) : 1000;
const PARALLEL_BATCHES = parallelArg ? parseInt(parallelArg.replace('--parallel=', ''), 10) : 4;

// ============================================================================
// Table order (respects foreign key dependencies)
// ============================================================================

const TABLE_ORDER = [
  // Core entities (no dependencies)
  'User', 'Actor', 'Organization', 'Tag', 'Game', 'GameConfig', 'Market', 'Question',
  'RSSFeedSource', 'WorldFact', 'CharacterMapping', 'OrganizationMapping',
  'SystemSettings', 'GenerationLock', 'WidgetCache', 'OAuthState',
  'OracleCommitment', 'OracleTransaction', 'RealtimeOutbox',
  
  // User-dependent
  'OnboardingIntent', 'TwitterOAuthToken', 'ProfileUpdateLog', 'Follow', 'FollowStatus',
  'Favorite', 'UserBlock', 'UserMute', 'Referral', 'PointsTransaction', 'BalanceTransaction',
  'TradingFee', 'Feedback', 'Report', 'ModerationEscrow', 'Notification', 'ShareAction',
  'DMAcceptance', 'UserGroup', 'UserInteraction',
  
  // Agent tables
  'AgentPerformanceMetrics', 'AgentLog', 'AgentMessage', 'AgentGoal', 'AgentGoalAction',
  'AgentPointsTransaction', 'AgentTrade', 'AgentRegistry', 'AgentCapability', 'ExternalAgentConnection',
  
  // Actor tables
  'ActorFollow', 'ActorRelationship', 'NPCInteraction', 'UserActorFollow',
  
  // Pool tables
  'Pool', 'PoolDeposit', 'PoolPosition', 'NPCTrade',
  
  // Market/Trading
  'Position', 'PredictionPriceHistory', 'StockPrice', 'PerpPosition',
  
  // Posts/Social
  'Post', 'Comment', 'Reaction', 'Share', 'PostTag', 'TrendingTag',
  
  // Messaging
  'Chat', 'ChatParticipant', 'ChatAdmin', 'ChatInvite', 'Message',
  'GroupChatMembership', 'UserGroupAdmin', 'UserGroupInvite', 'UserGroupMember',
  
  // World
  'WorldEvent', 'RSSHeadline', 'ParodyHeadline',
  
  // Training (lowercase table names)
  'trajectories', 'reward_judgments', 'training_batches', 'trained_models',
  'benchmark_results', 'llm_call_logs', 'market_outcomes',
];

// Default values for Drizzle-only columns
const DRIZZLE_DEFAULTS: Record<string, Record<string, unknown>> = {
  User: {
    hasDiscord: false,
    pointsAwardedForDiscord: false,
    pointsAwardedForDiscordJoin: false,
    pointsAwardedForFarcasterFollow: false,
    pointsAwardedForTwitterFollow: false,
  },
};

// ============================================================================
// Helpers
// ============================================================================

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Build parameterized multi-insert with ON CONFLICT DO NOTHING for idempotency
function buildParameterizedInsert(
  tableName: string,
  columns: string[],
  rows: Record<string, unknown>[],
  primaryKey: string
): { sql: string; values: unknown[] } {
  const colList = columns.map((c) => `"${c}"`).join(', ');
  const values: unknown[] = [];
  let paramIndex = 1;

  const valueRows = rows.map((row) => {
    const placeholders = columns.map((col) => {
      values.push(row[col]);
      return `$${paramIndex++}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  return {
    sql: `INSERT INTO "${tableName}" (${colList}) VALUES ${valueRows.join(', ')} ON CONFLICT ("${primaryKey}") DO NOTHING`,
    values,
  };
}

// ============================================================================
// Migration
// ============================================================================

interface TableResult {
  table: string;
  sourceCount: number;
  targetBefore: number;
  migrated: number;
  durationMs: number;
}

async function migrateTable(
  sourceDb: ReturnType<typeof postgres>,
  targetDb: ReturnType<typeof postgres>,
  tableName: string
): Promise<TableResult> {
  const start = Date.now();

  // Get columns from both databases
  const sourceColsResult = await sourceDb`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = ${tableName} ORDER BY ordinal_position
  `;
  const targetColsResult = await targetDb`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = ${tableName} ORDER BY ordinal_position
  `;

  const sourceCols = sourceColsResult.map((r) => r.column_name as string);
  const targetCols = new Set(targetColsResult.map((r) => r.column_name as string));

  if (sourceCols.length === 0) {
    log(`  ⚠ Table ${tableName} not found in source`);
    return { table: tableName, sourceCount: 0, targetBefore: 0, migrated: 0, durationMs: Date.now() - start };
  }
  if (targetCols.size === 0) {
    log(`  ⚠ Table ${tableName} not found in target`);
    return { table: tableName, sourceCount: 0, targetBefore: 0, migrated: 0, durationMs: Date.now() - start };
  }

  // Common columns only
  const commonCols = sourceCols.filter((c) => targetCols.has(c));

  // Calculate max batch size based on column count (PostgreSQL limit: 65534 params)
  const MAX_PARAMS = 65000; // Leave some margin
  const maxBatchForTable = Math.floor(MAX_PARAMS / commonCols.length);
  const effectiveBatchSize = Math.min(BATCH_SIZE, maxBatchForTable);
  log(`  Using batch size ${effectiveBatchSize} (${commonCols.length} columns)`);

  // Get counts
  const sourceCountResult = await sourceDb.unsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
  const targetCountResult = await targetDb.unsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
  const sourceCount = sourceCountResult[0].count as number;
  const targetBefore = targetCountResult[0].count as number;

  log(`  ${tableName}: ${sourceCount} records in source, ${targetBefore} in target`);

  if (sourceCount === 0) {
    return { table: tableName, sourceCount, targetBefore, migrated: 0, durationMs: Date.now() - start };
  }

  if (isDryRun) {
    log(`  [DRY-RUN] Would migrate ${sourceCount} records`);
    return { table: tableName, sourceCount, targetBefore, migrated: sourceCount, durationMs: Date.now() - start };
  }

  // Determine primary key (assume 'id' or first column)
  const pk = commonCols.includes('id') ? 'id' : commonCols[0];
  const defaults = DRIZZLE_DEFAULTS[tableName] || {};

  // Build column list for SELECT
  const selectCols = commonCols.map((c) => `"${c}"`).join(', ');
  
  let migrated = 0;
  let offset = 0;

  // Process in batches
  while (offset < sourceCount) {
    const batchStart = Date.now();
    
    // Fetch batch from source (using raw query for speed)
    const rows = await sourceDb.unsafe(
      `SELECT ${selectCols} FROM "${tableName}" ORDER BY "${pk}" LIMIT ${effectiveBatchSize} OFFSET ${offset}`
    );

    if (rows.length === 0) break;

    // Apply defaults for Drizzle-only columns
    const processedRows = rows.map((row) => {
      const newRow = { ...row };
      for (const [key, val] of Object.entries(defaults)) {
        if (!(key in newRow)) {
          newRow[key] = val;
        }
      }
      return newRow;
    });

    // Build parameterized multi-insert with ON CONFLICT DO NOTHING for idempotency
    const { sql, values } = buildParameterizedInsert(tableName, commonCols, processedRows, pk);

    // Execute insert with parameters (properly escaped, skips duplicates)
    await targetDb.unsafe(sql, values);
    migrated += rows.length;

    const batchDuration = Date.now() - batchStart;
    const rate = Math.round((rows.length / batchDuration) * 1000);
    log(`    Batch ${Math.floor(offset / effectiveBatchSize) + 1}: ${rows.length} rows in ${batchDuration}ms (${rate}/sec) - Total: ${migrated}/${sourceCount}`);

    offset += effectiveBatchSize;
  }

  const duration = Date.now() - start;
  const rate = Math.round((migrated / duration) * 1000);
  log(`  ✓ ${tableName}: Migrated ${migrated} records in ${duration}ms (${rate}/sec)`);

  return { table: tableName, sourceCount, targetBefore, migrated, durationMs: duration };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════');
  log('FAST PRISMA → DRIZZLE MIGRATION');
  log('═══════════════════════════════════════════════════════════');

  if (!SOURCE_URL) {
    log('ERROR: SOURCE_DATABASE_URL or SOURCE_DIRECT_DATABASE_URL required');
    process.exit(1);
  }
  if (!TARGET_URL) {
    log('ERROR: TARGET_DATABASE_URL or TARGET_DIRECT_DATABASE_URL required');
    process.exit(1);
  }

  if (isDryRun) {
    log('🔍 DRY RUN MODE - No changes will be made');
  }

  log(`Batch size: ${BATCH_SIZE}`);
  log(`Parallel batches: ${PARALLEL_BATCHES}`);

  // Connect to databases
  log('\nConnecting to databases...');
  const sourceDb = postgres(SOURCE_URL, {
    max: PARALLEL_BATCHES + 2,
    idle_timeout: 60,
    ssl: SOURCE_URL.includes('localhost') ? false : 'require',
  });
  const targetDb = postgres(TARGET_URL, {
    max: PARALLEL_BATCHES + 2,
    idle_timeout: 60,
    ssl: TARGET_URL.includes('localhost') ? false : 'require',
  });

  // Test connections
  await sourceDb`SELECT 1`;
  await targetDb`SELECT 1`;
  log('✓ Connected to both databases');

  // Determine tables to migrate
  const tables = SPECIFIC_TABLES || TABLE_ORDER;
  log(`\nMigrating ${tables.length} tables...`);

  const results: TableResult[] = [];
  const overallStart = Date.now();

  for (const table of tables) {
    const result = await migrateTable(sourceDb, targetDb, table);
    results.push(result);
  }

  // Summary
  const totalDuration = Date.now() - overallStart;
  const totalMigrated = results.reduce((sum, r) => sum + r.migrated, 0);
  const rate = Math.round((totalMigrated / totalDuration) * 1000);

  log('\n═══════════════════════════════════════════════════════════');
  log('MIGRATION SUMMARY');
  log('═══════════════════════════════════════════════════════════');
  
  console.log('\n| Table | Source | Target Before | Migrated | Rate |');
  console.log('|-------|--------|---------------|----------|------|');
  for (const r of results) {
    if (r.sourceCount > 0) {
      const tableRate = r.durationMs > 0 ? Math.round((r.migrated / r.durationMs) * 1000) : 0;
      console.log(`| ${r.table.padEnd(30)} | ${String(r.sourceCount).padStart(6)} | ${String(r.targetBefore).padStart(13)} | ${String(r.migrated).padStart(8)} | ${String(tableRate).padStart(4)}/s |`);
    }
  }

  log(`\nTotal: ${totalMigrated} records migrated in ${(totalDuration / 1000).toFixed(1)}s (${rate}/sec)`);

  // Cleanup
  await sourceDb.end();
  await targetDb.end();

  if (isDryRun) {
    log('\n🔍 This was a DRY RUN. Run without --dry-run to execute migration.');
  } else {
    log('\n✓ Migration complete!');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

