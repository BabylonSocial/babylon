import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

// Load env from root .env file, trying both possible locations
const rootEnvPath = existsSync('../../.env') ? '../../.env' : '.env';
dotenv.config({ path: rootEnvPath });

// Determine if we're in local development mode
const isLocalDev = process.env.DEPLOYMENT_ENV === 'localnet' || 
                   process.env.NODE_ENV === 'development' ||
                   !process.env.DIRECT_DATABASE_URL;

// Local development database URL (matches docker-compose setup)
const LOCAL_DATABASE_URL = 'postgresql://babylon:babylon_dev_password@localhost:5433/babylon';

// Use local URL for development, production URL only when explicitly set
const databaseUrl = isLocalDev 
  ? (process.env.DATABASE_URL ?? LOCAL_DATABASE_URL)
  : (process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? LOCAL_DATABASE_URL);

// Detect if we're running from packages/db or from project root
const isInPackageDir = existsSync('./src/schema/index.ts');
const schemaPath = isInPackageDir 
  ? './src/schema/index.ts'
  : 'packages/db/src/schema/index.ts';
const outPath = isInPackageDir
  ? './drizzle/migrations'
  : 'packages/db/drizzle/migrations';

// Force unset DATABASE_URL so drizzle-kit uses explicit parameters
// Drizzle-kit reads process.env.DATABASE_URL if it exists, ignoring dbCredentials
if (process.env.DATABASE_URL) {
  delete process.env.DATABASE_URL;
  console.log('[drizzle.config] Unset DATABASE_URL to use explicit parameters');
}

export default defineConfig({
  schema: schemaPath,
  out: outPath,
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});

