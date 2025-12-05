#!/usr/bin/env bun
/**
 * Fast Table Load - Uploads JSONL files to target database
 * 
 * Usage:
 *   bun run scripts/load-tables.ts --tables=User,Referral,...
 * 
 * Reads from:
 *   ./migration-data/{TableName}.jsonl
 *   ./migration-data/{TableName}.meta.json
 */

import postgres from 'postgres';
import { readFileSync, existsSync, createReadStream } from 'fs';
import { createInterface } from 'readline';

const TARGET_URL = process.env.TARGET_DIRECT_DATABASE_URL || process.env.TARGET_DATABASE_URL;
const DATA_DIR = './migration-data';

const args = process.argv.slice(2);
const tablesArg = args.find((a) => a.startsWith('--tables='));
const TABLES = tablesArg ? tablesArg.replace('--tables=', '').split(',') : [];
const WORKERS = 8; // Parallel insert workers (reduced to avoid connection limits)
const BATCH_SIZE = 200; // Rows per INSERT (stay under 65k param limit)

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

async function loadTable(db: postgres.Sql, table: string): Promise<number> {
  const start = Date.now();
  
  const metaPath = `${DATA_DIR}/${table}.meta.json`;
  const dataPath = `${DATA_DIR}/${table}.jsonl`;
  
  // Check for old JSON format (Referral was saved as .json)
  const oldJsonPath = `${DATA_DIR}/${table}.json`;
  
  if (!existsSync(metaPath) && !existsSync(oldJsonPath)) {
    log(`⚠ No data file for ${table}`);
    return 0;
  }
  
  let columns: string[];
  let pk: string;
  let rows: Record<string, unknown>[];
  
  if (existsSync(oldJsonPath) && !existsSync(metaPath)) {
    // Old format: single JSON file
    log(`${table}: Reading from legacy JSON format...`);
    const data = JSON.parse(readFileSync(oldJsonPath, 'utf-8'));
    columns = data.columns;
    pk = data.pk || (columns.includes('id') ? 'id' : columns[0]);
    rows = data.rows;
    log(`${table}: ${rows.length} rows loaded from JSON`);
  } else {
    // New format: meta + jsonl
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    columns = meta.columns;
    pk = meta.pk;
    
    // Stream read JSONL
    log(`${table}: Streaming from JSONL...`);
    rows = [];
    const fileStream = createReadStream(dataPath);
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });
    
    for await (const line of rl) {
      if (line.trim()) {
        rows.push(JSON.parse(line));
      }
    }
    log(`${table}: ${rows.length} rows loaded from JSONL`);
  }
  
  if (rows.length === 0) {
    return 0;
  }
  
  // Get target columns
  const targetColsResult = await db`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = ${table} ORDER BY ordinal_position
  `;
  
  if (targetColsResult.length === 0) {
    log(`⚠ Table ${table} not found in target database`);
    return 0;
  }
  
  const targetCols = new Set(targetColsResult.map((r) => r.column_name as string));
  const commonCols = columns.filter((c) => targetCols.has(c));
  
  // Calculate safe batch size
  const maxBatch = Math.min(BATCH_SIZE, Math.floor(65000 / commonCols.length));
  const defaults = DEFAULTS[table] || {};
  const colList = commonCols.map((c) => `"${c}"`).join(', ');
  
  // Get current count
  const beforeCount = await db.unsafe(`SELECT COUNT(*)::int as c FROM "${table}"`);
  log(`${table}: ${beforeCount[0].c} existing rows in target, inserting ${rows.length} (with ON CONFLICT DO NOTHING)`);
  
  // Split into batches
  const batches: Record<string, unknown>[][] = [];
  for (let i = 0; i < rows.length; i += maxBatch) {
    batches.push(rows.slice(i, i + maxBatch));
  }
  
  let inserted = 0;
  let batchNum = 0;
  
  // Process batches in parallel groups
  for (let i = 0; i < batches.length; i += WORKERS) {
    const group = batches.slice(i, i + WORKERS);
    const groupStart = Date.now();
    
    await Promise.all(
      group.map(async (batch) => {
        // Apply defaults
        const processed = batch.map((row) => {
          const newRow = { ...row };
          for (const [k, v] of Object.entries(defaults)) {
            if (!(k in newRow)) newRow[k] = v;
          }
          return newRow;
        });
        
        // Build parameterized insert
        const values: unknown[] = [];
        let idx = 1;
        const valueRows = processed.map((row) => {
          const placeholders = commonCols.map((col) => {
            values.push(row[col]);
            return `$${idx++}`;
          });
          return `(${placeholders.join(',')})`;
        });
        
        const sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueRows.join(',')} ON CONFLICT ("${pk}") DO NOTHING`;
        await db.unsafe(sql, values);
      })
    );
    
    batchNum += group.length;
    inserted += group.reduce((s, b) => s + b.length, 0);
    
    const groupMs = Date.now() - groupStart;
    const pct = Math.round((inserted / rows.length) * 100);
    const rate = Math.round((group.reduce((s, b) => s + b.length, 0) / (groupMs / 1000)));
    log(`  ${table}: ${pct}% (${inserted}/${rows.length}) - ${groupMs}ms, ${rate}/s`);
  }
  
  // Get final count
  const afterCount = await db.unsafe(`SELECT COUNT(*)::int as c FROM "${table}"`);
  const newRows = afterCount[0].c - beforeCount[0].c;
  
  const totalMs = Date.now() - start;
  const rate = Math.round((inserted / (totalMs / 1000)));
  log(`✓ ${table}: ${newRows} new rows inserted (${afterCount[0].c} total) in ${(totalMs / 1000).toFixed(1)}s (${rate}/s)`);
  
  return newRows;
}

async function main(): Promise<void> {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════');
  log('TABLE LOAD - Upload to Target Database');
  log('═══════════════════════════════════════════════════════════');

  if (!TARGET_URL) {
    log('ERROR: TARGET_DATABASE_URL required');
    process.exit(1);
  }

  if (TABLES.length === 0) {
    log('ERROR: Specify tables with --tables=Table1,Table2,...');
    process.exit(1);
  }

  log(`Tables: ${TABLES.join(', ')}`);
  log(`Workers: ${WORKERS}, Batch size: ${BATCH_SIZE}`);
  log(`Data dir: ${DATA_DIR}/`);

  const db = postgres(TARGET_URL, { 
    max: WORKERS + 2,
    ssl: TARGET_URL.includes('localhost') ? false : 'require',
    idle_timeout: 60,
    connect_timeout: 30,
  });

  await db`SELECT 1`;
  log('✓ Connected to target database\n');

  const overallStart = Date.now();
  let totalRows = 0;

  for (const table of TABLES) {
    const count = await loadTable(db, table);
    totalRows += count;
  }

  await db.end();

  const totalMs = Date.now() - overallStart;
  log('\n═══════════════════════════════════════════════════════════');
  log(`DONE: ${totalRows} new rows inserted in ${(totalMs / 1000).toFixed(1)}s`);
  log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Load failed:', err);
  process.exit(1);
});

