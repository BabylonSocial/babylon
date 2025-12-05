#!/usr/bin/env bun
import postgres from 'postgres';

const TARGET_URL = process.env.TARGET_DIRECT_DATABASE_URL || process.env.TARGET_DATABASE_URL;
const db = postgres(TARGET_URL!, { ssl: 'require' });

const tables = [
  'User', 'Referral', 'ProfileUpdateLog', 'PointsTransaction', 
  'OAuthState', 'Notification', 'Follow', 'BalanceTransaction', 
  'AgentPointsTransaction'
];

console.log('\n=== TARGET DATABASE COUNTS ===\n');

for (const table of tables) {
  const result = await db.unsafe(`SELECT COUNT(*)::int as c FROM "${table}"`);
  console.log(`${table.padEnd(25)} ${String(result[0].c).padStart(10)}`);
}

await db.end();
console.log('\n');

