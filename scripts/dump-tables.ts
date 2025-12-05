#!/usr/bin/env bun
/**
 * Fast Table Dump - Streams data from source DB to local JSONL files
 * 
 * Usage:
 *   bun run scripts/dump-tables.ts --tables=User,Referral,...
 * 
 * Output:
 *   ./migration-data/{TableName}.jsonl (one JSON object per line)
 *   ./migration-data/{TableName}.meta.json (columns, pk, count)
 */

import postgres from 'postgres';
import { mkdirSync, existsSync, createWriteStream, writeFileSync } from 'fs';

const SOURCE_URL = process.env.SOURCE_DIRECT_DATABASE_URL || process.env.SOURCE_DATABASE_URL;
const OUTPUT_DIR = './migration-data';

const args = process.argv.slice(2);
const tablesArg = args.find((a) => a.startsWith('--tables='));
const TABLES = tablesArg ? tablesArg.replace('--tables=', '').split(',') : [];
const BATCH_SIZE = 5000;

function log(msg: string): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function dumpTable(db: postgres.Sql, table: string): Promise<number> {
  const start = Date.now();
  
  // Get columns
  const colsResult = await db`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = ${table} ORDER BY ordinal_position
  `;
  
  if (colsResult.length === 0) {
    log(`⚠ Table ${table} not found`);
    return 0;
  }
  
  const columns = colsResult.map((r) => r.column_name as string);
  const pk = columns.includes('id') ? 'id' : columns[0];
  const colList = columns.map((c) => `"${c}"`).join(', ');
  
  // Get count
  const countResult = await db.unsafe(`SELECT COUNT(*)::int as c FROM "${table}"`);
  const totalCount = countResult[0].c as number;
  
  log(`${table}: ${totalCount} rows, ${columns.length} columns`);
  
  // Write metadata
  const metaPath = `${OUTPUT_DIR}/${table}.meta.json`;
  writeFileSync(metaPath, JSON.stringify({ table, columns, pk, totalCount }));
  
  if (totalCount === 0) {
    writeFileSync(`${OUTPUT_DIR}/${table}.jsonl`, '');
    return 0;
  }
  
  // Stream to JSONL file
  const dataPath = `${OUTPUT_DIR}/${table}.jsonl`;
  const stream = createWriteStream(dataPath);
  
  let offset = 0;
  let rowsWritten = 0;
  
  while (offset < totalCount) {
    const batchStart = Date.now();
    const rows = await db.unsafe(
      `SELECT ${colList} FROM "${table}" ORDER BY "${pk}" LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    );
    
    if (rows.length === 0) break;
    
    // Write each row as a JSON line
    for (const row of rows) {
      stream.write(JSON.stringify(row) + '\n');
      rowsWritten++;
    }
    
    offset += rows.length;
    
    const batchMs = Date.now() - batchStart;
    const pct = Math.round((offset / totalCount) * 100);
    const rate = Math.round((rows.length / (batchMs / 1000)));
    log(`  ${table}: ${pct}% (${offset}/${totalCount}) - ${batchMs}ms, ${rate}/s`);
  }
  
  // Close stream
  await new Promise<void>((resolve) => stream.end(resolve));
  
  const totalMs = Date.now() - start;
  log(`✓ ${table}: ${rowsWritten} rows saved in ${(totalMs / 1000).toFixed(1)}s`);
  
  return rowsWritten;
}

async function main(): Promise<void> {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════');
  log('TABLE DUMP - Stream to JSONL');
  log('═══════════════════════════════════════════════════════════');

  if (!SOURCE_URL) {
    log('ERROR: SOURCE_DATABASE_URL required');
    process.exit(1);
  }

  if (TABLES.length === 0) {
    log('ERROR: Specify tables with --tables=Table1,Table2,...');
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  log(`Tables: ${TABLES.join(', ')}`);
  log(`Output: ${OUTPUT_DIR}/`);

  const db = postgres(SOURCE_URL, { 
    max: 2,
    ssl: SOURCE_URL.includes('localhost') ? false : 'require',
    idle_timeout: 300,
  });

  await db`SELECT 1`;
  log('✓ Connected to source database\n');

  const overallStart = Date.now();
  let totalRows = 0;

  // Dump tables one at a time to avoid memory issues
  for (const table of TABLES) {
    const count = await dumpTable(db, table);
    totalRows += count;
  }

  await db.end();

  const totalMs = Date.now() - overallStart;
  log('\n═══════════════════════════════════════════════════════════');
  log(`DONE: ${totalRows} total rows dumped in ${(totalMs / 1000).toFixed(1)}s`);
  log(`Files saved to: ${OUTPUT_DIR}/`);
  log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Dump failed:', err);
  process.exit(1);
});
