import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Determine if we're in local development mode
const isLocalDev =
  process.env.DEPLOYMENT_ENV === 'localnet' ||
  process.env.NODE_ENV === 'development' ||
  !process.env.DIRECT_DATABASE_URL;

// Local development database URL (matches docker-compose setup)
const LOCAL_DATABASE_URL =
  'postgresql://babylon:babylon_dev_password@localhost:5433/babylon';

// Use local URL for development, production URL only when explicitly set
const databaseUrl = isLocalDev
  ? (process.env.DATABASE_URL ?? LOCAL_DATABASE_URL)
  : (process.env.DIRECT_DATABASE_URL ??
    process.env.DATABASE_URL ??
    LOCAL_DATABASE_URL);

export default defineConfig({
  schema: path.join(__dirname, 'src/schema/index.ts'),
  out: path.join(__dirname, 'drizzle/migrations'),
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
