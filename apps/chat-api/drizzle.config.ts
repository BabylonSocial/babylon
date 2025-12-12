import { env as bunEnv } from 'bun';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: bunEnv.DATABASE_URL!,
  },
});
