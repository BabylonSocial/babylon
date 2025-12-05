#!/usr/bin/env bun
/**
 * Efficient Incremental Sync - Only syncs new rows from source to target
 * 
 * Gets the max ID from target, then only pulls rows where ID > max from source.
 * Streams directly from source to target without intermediate files.
 * 
 * Usage:
 *   bun run scripts/incremental-sync.ts --tables=User,Referral,...
 */

import postgres from 'postgres';

const SOURCE_URL = process.env.SOURCE_DIRECT_DATABASE_URL || process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.TARGET_DIRECT_DATABASE_URL || process.env.TARGET_DATABASE_URL;

const args = process.argv.slice(2);
const tablesArg = args.find((a) => a.startsWith('--tables='));
const TABLES = tablesArg ? tablesArg.replace('--tables=', '').split(',') : [];
const BATCH_SIZE = 1000;
const WRITE_BATCH = 200;

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

async function syncTable(
  sourceDb: postgres.Sql,
  targetDb: postgres.Sql,
  table: string
): Promise<{ table: string; newRows: number; ms: number }> {
  const start = Date.now();

  // Get columns from both databases
  const [srcCols, tgtCols] = await Promise.all([
    sourceDb`SELECT column_name FROM information_schema.columns WHERE table_name = ${table} ORDER BY ordinal_position`,
    targetDb`SELECT column_name FROM information_schema.columns WHERE table_name = ${table} ORDER BY ordinal_position`,
  ]);

  if (srcCols.length === 0 || tgtCols.length === 0) {
    log(`⚠ Table ${table} not found in source or target`);
    return { table, newRows: 0, ms: Date.now() - start };
  }

  const sourceColumns = srcCols.map((r) => r.column_name as string);
  const targetColumns = new Set(tgtCols.map((r) => r.column_name as string));
  const commonCols = sourceColumns.filter((c) => targetColumns.has(c));
  const pk = commonCols.includes('id') ? 'id' : commonCols[0];
  const colList = commonCols.map((c) => `"${c}"`).join(', ');

  // Get max ID from target (this is the key optimization)
  const maxIdResult = await targetDb.unsafe(`SELECT MAX("${pk}") as max_id FROM "${table}"`);
  const maxId = maxIdResult[0].max_id;

  // Get count of new rows in source
  let countQuery: string;
  if (maxId === null) {
    countQuery = `SELECT COUNT(*)::int as c FROM "${table}"`;
  } else {
    countQuery = `SELECT COUNT(*)::int as c FROM "${table}" WHERE "${pk}" > '${maxId}'`;
  }
  const countResult = await sourceDb.unsafe(countQuery);
  const newRowCount = countResult[0].c as number;

  if (newRowCount === 0) {
    log(`${table}: ✓ Already in sync (max ID: ${maxId})`);
    return { table, newRows: 0, ms: Date.now() - start };
  }

  log(`${table}: ${newRowCount} new rows to sync (after ID: ${maxId || 'none'})`);

  const defaults = DEFAULTS[table] || {};
  const maxWriteBatch = Math.min(WRITE_BATCH, Math.floor(65000 / commonCols.length));
  let totalSynced = 0;
  let offset = 0;

  // Stream new rows from source to target
  while (offset < newRowCount) {
    const batchStart = Date.now();

    // Fetch batch from source (only rows after maxId)
    let selectQuery: string;
    if (maxId === null) {
      selectQuery = `SELECT ${colList} FROM "${table}" ORDER BY "${pk}" LIMIT ${BATCH_SIZE} OFFSET ${offset}`;
    } else {
      selectQuery = `SELECT ${colList} FROM "${table}" WHERE "${pk}" > '${maxId}' ORDER BY "${pk}" LIMIT ${BATCH_SIZE} OFFSET ${offset}`;
    }
    
    const rows: Record<string, unknown>[] = await sourceDb.unsafe(selectQuery);
    if (rows.length === 0) break;

    // Apply defaults
    const processed = rows.map((row) => {
      const newRow = { ...row };
      for (const [k, v] of Object.entries(defaults)) {
        if (!(k in newRow)) newRow[k] = v;
      }
      return newRow;
    });

    // Insert in batches
    for (let i = 0; i < processed.length; i += maxWriteBatch) {
      const batch = processed.slice(i, i + maxWriteBatch);
      const values: unknown[] = [];
      let idx = 1;
      
      const valueRows = batch.map((row) => {
        const placeholders = commonCols.map((col) => {
          values.push(row[col]);
          return `$${idx++}`;
        });
        return `(${placeholders.join(',')})`;
      });

      const sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueRows.join(',')} ON CONFLICT ("${pk}") DO NOTHING`;
      await targetDb.unsafe(sql, values);
    }

    totalSynced += rows.length;
    offset += rows.length;

    const batchMs = Date.now() - batchStart;
    const pct = Math.round((offset / newRowCount) * 100);
    const rate = Math.round((rows.length / (batchMs / 1000)));
    log(`  ${table}: ${pct}% (${totalSynced}/${newRowCount}) - ${batchMs}ms, ${rate}/s`);
  }

  const ms = Date.now() - start;
  log(`✓ ${table}: ${totalSynced} new rows synced in ${(ms / 1000).toFixed(1)}s`);

  return { table, newRows: totalSynced, ms };
}

async function main(): Promise<void> {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════');
  log('INCREMENTAL SYNC - Only New Rows');
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

  const sourceDb = postgres(SOURCE_URL, { 
    max: 2,
    ssl: SOURCE_URL.includes('localhost') ? false : 'require',
    idle_timeout: 60,
  });
  
  const targetDb = postgres(TARGET_URL, { 
    max: 8,
    ssl: TARGET_URL.includes('localhost') ? false : 'require',
    idle_timeout: 60,
    connect_timeout: 30,
  });

  await Promise.all([sourceDb`SELECT 1`, targetDb`SELECT 1`]);
  log('✓ Connected to both databases\n');

  const overallStart = Date.now();
  const results: { table: string; newRows: number; ms: number }[] = [];

  for (const table of TABLES) {
    const result = await syncTable(sourceDb, targetDb, table);
    results.push(result);
  }

  await Promise.all([sourceDb.end(), targetDb.end()]);

  // Summary
  const totalMs = Date.now() - overallStart;
  const totalRows = results.reduce((s, r) => s + r.newRows, 0);

  log('\n═══════════════════════════════════════════════════════════');
  log('SYNC SUMMARY');
  log('═══════════════════════════════════════════════════════════');

  for (const r of results) {
    if (r.newRows > 0) {
      log(`  ${r.table.padEnd(25)} +${String(r.newRows).padStart(8)} rows`);
    } else {
      log(`  ${r.table.padEnd(25)} ✓ in sync`);
    }
  }

  log(`\nTotal: ${totalRows} new rows synced in ${(totalMs / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});

