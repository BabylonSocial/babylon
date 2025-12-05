#!/usr/bin/env bun
/**
 * TURBO Prisma to Drizzle Migration
 * 
 * Optimized for maximum speed using:
 * - Parallel read/write workers
 * - Large batch sizes with chunked parameters
 * - Concurrent table migrations
 * - Connection pooling
 * 
 * Usage:
 *   bun run scripts/turbo-migrate.ts --tables=User,Referral,...
 */

import postgres from 'postgres';

const SOURCE_URL = process.env.SOURCE_DIRECT_DATABASE_URL || process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DIRECT_DATABASE_URL || process.env.TARGET_DATABASE_URL;

const args = process.argv.slice(2);
const tablesArg = args.find((a) => a.startsWith('--tables='));
const TABLES = tablesArg ? tablesArg.replace('--tables=', '').split(',') : [];
const WORKERS = 8; // Parallel insert workers per table
const READ_BATCH = 5000; // Read this many rows at a time
const WRITE_BATCH = 200; // Write this many rows per INSERT (to stay under param limit)

// Drizzle-only column defaults
const DEFAULTS: Record<string, Record<string, unknown>> = {
  User: {
    hasDiscord: false,
    pointsAwardedForDiscord: false,
    pointsAwardedForDiscordJoin: false,
    pointsAwardedForFarcasterFollow: false,
    pointsAwardedForTwitterFollow: false,
  },
};

function log(msg: string): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function getTableInfo(
  sourceDb: postgres.Sql,
  targetDb: postgres.Sql,
  table: string
): Promise<{ columns: string[]; pk: string; sourceCount: number; targetCount: number } | null> {
  const [srcCols, tgtCols, srcCount, tgtCount] = await Promise.all([
    sourceDb`SELECT column_name FROM information_schema.columns WHERE table_name = ${table} ORDER BY ordinal_position`,
    targetDb`SELECT column_name FROM information_schema.columns WHERE table_name = ${table} ORDER BY ordinal_position`,
    sourceDb.unsafe(`SELECT COUNT(*)::int as c FROM "${table}"`),
    targetDb.unsafe(`SELECT COUNT(*)::int as c FROM "${table}"`),
  ]);

  if (srcCols.length === 0 || tgtCols.length === 0) {
    log(`⚠ Table ${table} missing in source or target`);
    return null;
  }

  const targetSet = new Set(tgtCols.map((r) => r.column_name as string));
  const columns = (srcCols.map((r) => r.column_name as string)).filter((c) => targetSet.has(c));
  const pk = columns.includes('id') ? 'id' : columns[0];

  return {
    columns,
    pk,
    sourceCount: srcCount[0].c as number,
    targetCount: tgtCount[0].c as number,
  };
}

async function migrateTableParallel(table: string): Promise<{ table: string; migrated: number; ms: number }> {
  const start = Date.now();
  
  // Create dedicated connections for this table
  const sourceDb = postgres(SOURCE_URL!, { max: 2, ssl: 'require' });
  const targetDb = postgres(TARGET_URL!, { max: WORKERS + 1, ssl: 'require' });

  const info = await getTableInfo(sourceDb, targetDb, table);
  if (!info) {
    await sourceDb.end();
    await targetDb.end();
    return { table, migrated: 0, ms: Date.now() - start };
  }

  const { columns, pk, sourceCount, targetCount } = info;
  log(`${table}: ${sourceCount} source, ${targetCount} target, ${columns.length} cols`);

  if (sourceCount === 0) {
    await sourceDb.end();
    await targetDb.end();
    return { table, migrated: 0, ms: Date.now() - start };
  }

  // Calculate safe write batch size (65000 params max)
  const maxWriteBatch = Math.min(WRITE_BATCH, Math.floor(65000 / columns.length));
  const defaults = DEFAULTS[table] || {};
  const colList = columns.map((c) => `"${c}"`).join(', ');

  let totalMigrated = 0;
  let offset = 0;

  // Process in large read batches, then parallelize writes
  while (offset < sourceCount) {
    const readStart = Date.now();
    
    // Fetch a large batch
    const rows: Record<string, unknown>[] = await sourceDb.unsafe(
      `SELECT ${colList} FROM "${table}" ORDER BY "${pk}" LIMIT ${READ_BATCH} OFFSET ${offset}`
    );
    
    if (rows.length === 0) break;
    
    const readMs = Date.now() - readStart;

    // Apply defaults
    const processed = rows.map((row) => {
      const newRow = { ...row };
      for (const [k, v] of Object.entries(defaults)) {
        if (!(k in newRow)) newRow[k] = v;
      }
      return newRow;
    });

    // Split into write chunks and insert in parallel
    const writeChunks: Record<string, unknown>[][] = [];
    for (let i = 0; i < processed.length; i += maxWriteBatch) {
      writeChunks.push(processed.slice(i, i + maxWriteBatch));
    }

    const writeStart = Date.now();
    
    // Process chunks in parallel batches of WORKERS
    for (let i = 0; i < writeChunks.length; i += WORKERS) {
      const batch = writeChunks.slice(i, i + WORKERS);
      await Promise.all(
        batch.map(async (chunk) => {
          const values: unknown[] = [];
          let idx = 1;
          const valueRows = chunk.map((row) => {
            const placeholders = columns.map((col) => {
              values.push(row[col]);
              return `$${idx++}`;
            });
            return `(${placeholders.join(',')})`;
          });
          
          const sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueRows.join(',')} ON CONFLICT ("${pk}") DO NOTHING`;
          await targetDb.unsafe(sql, values);
        })
      );
    }

    const writeMs = Date.now() - writeStart;
    totalMigrated += rows.length;
    
    const pct = Math.round((offset / sourceCount) * 100);
    const rate = Math.round((rows.length / ((readMs + writeMs) / 1000)));
    log(`  ${table}: ${pct}% (${totalMigrated}/${sourceCount}) - read ${readMs}ms, write ${writeMs}ms, ${rate}/s`);
    
    offset += READ_BATCH;
  }

  await sourceDb.end();
  await targetDb.end();

  const ms = Date.now() - start;
  const rate = Math.round((totalMigrated / (ms / 1000)));
  log(`✓ ${table}: ${totalMigrated} rows in ${(ms / 1000).toFixed(1)}s (${rate}/s)`);

  return { table, migrated: totalMigrated, ms };
}

async function main(): Promise<void> {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════');
  log('TURBO MIGRATION - Parallel Mode');
  log('═══════════════════════════════════════════════════════════');

  if (!SOURCE_URL || !TARGET_URL) {
    log('ERROR: SOURCE/TARGET DATABASE URLs required');
    process.exit(1);
  }

  if (TABLES.length === 0) {
    log('ERROR: Specify tables with --tables=Table1,Table2,...');
    process.exit(1);
  }

  log(`Tables: ${TABLES.join(', ')}`);
  log(`Workers: ${WORKERS}, Read batch: ${READ_BATCH}, Write batch: ${WRITE_BATCH}`);

  const overallStart = Date.now();
  const results: { table: string; migrated: number; ms: number }[] = [];

  // Migrate tables sequentially (each table uses parallel workers internally)
  for (const table of TABLES) {
    log(`\n─── Starting ${table} ───`);
    const result = await migrateTableParallel(table);
    results.push(result);
  }

  // Summary
  const totalMs = Date.now() - overallStart;
  const totalRows = results.reduce((s, r) => s + r.migrated, 0);

  log('\n═══════════════════════════════════════════════════════════');
  log('SUMMARY');
  log('═══════════════════════════════════════════════════════════');
  
  for (const r of results) {
    const rate = r.ms > 0 ? Math.round((r.migrated / (r.ms / 1000))) : 0;
    log(`  ${r.table.padEnd(25)} ${String(r.migrated).padStart(8)} rows  ${(r.ms / 1000).toFixed(1).padStart(6)}s  ${String(rate).padStart(5)}/s`);
  }
  
  log(`\nTotal: ${totalRows} rows in ${(totalMs / 1000).toFixed(1)}s (${Math.round(totalRows / (totalMs / 1000))}/s)`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

