import { defineConfig } from 'drizzle-kit';

// Force unset DATABASE_URL so drizzle-kit uses explicit parameters
// Drizzle-kit reads process.env.DATABASE_URL if it exists, ignoring dbCredentials
if (process.env.DATABASE_URL) {
  delete process.env.DATABASE_URL;
  console.log('[drizzle.config] Unset DATABASE_URL to use explicit parameters');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Use explicit connection parameters - avoids connection string parsing issues
    host: '127.0.0.1',
    port: 6432,
    user: 'babylon',
    password: 'babylon_dev_password',
    database: 'babylon',
    ssl: false, // Disable SSL for local development
  },
  verbose: true,
  strict: true,
});

