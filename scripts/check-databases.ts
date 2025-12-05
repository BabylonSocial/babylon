#!/usr/bin/env bun
/**
 * Quick script to check source and target database status
 */
import postgres from 'postgres';

async function main() {
  const sourceUrl = process.env.SOURCE_DIRECT_DATABASE_URL || process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DIRECT_DATABASE_URL || process.env.TARGET_DATABASE_URL;

  console.log('\n=== SOURCE DATABASE ===');
  console.log('URL:', sourceUrl?.split('@')[1]?.split('?')[0] || 'Not set');

  if (!sourceUrl) {
    console.log('SOURCE_DATABASE_URL not set!');
    return;
  }

  const sourceDb = postgres(sourceUrl, { ssl: 'require' });
  
  const sourceTables = await sourceDb`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  console.log('Tables:', sourceTables.length);
  console.log(sourceTables.slice(0, 20).map(t => t.table_name).join(', '));

  // Count some key tables
  const userCount = await sourceDb`SELECT COUNT(*) as count FROM "User"`;
  const pointsCount = await sourceDb`SELECT COUNT(*) as count FROM "PointsTransaction"`;
  const referralCount = await sourceDb`SELECT COUNT(*) as count FROM "Referral"`;
  const balanceCount = await sourceDb`SELECT COUNT(*) as count FROM "BalanceTransaction"`;
  
  console.log('\nKey table counts:');
  console.log('  User:', userCount[0].count);
  console.log('  PointsTransaction:', pointsCount[0].count);
  console.log('  Referral:', referralCount[0].count);
  console.log('  BalanceTransaction:', balanceCount[0].count);

  await sourceDb.end();

  console.log('\n=== TARGET DATABASE ===');
  console.log('URL:', targetUrl?.split('@')[1]?.split('?')[0] || 'Not set');

  if (!targetUrl) {
    console.log('TARGET_DATABASE_URL not set!');
    return;
  }

  const targetDb = postgres(targetUrl, { ssl: 'require' });
  
  const targetTables = await targetDb`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  console.log('Tables:', targetTables.length);
  if (targetTables.length > 0) {
    console.log(targetTables.slice(0, 20).map(t => t.table_name).join(', '));
    
    // Try to count users if table exists
    if (targetTables.some(t => t.table_name === 'User')) {
      const targetUserCount = await targetDb`SELECT COUNT(*) as count FROM "User"`;
      console.log('\nTarget User count:', targetUserCount[0].count);
    }
  } else {
    console.log('(no tables found - schema needs to be created)');
    console.log('\nTo create the schema, run:');
    console.log('  DATABASE_URL=<target-url> bun run packages/db/src/migrate.ts');
  }

  await targetDb.end();
}

main().catch(console.error);

