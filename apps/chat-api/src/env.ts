import { env as bunEnv } from 'bun';
import { z } from 'zod';

export const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth - Privy credentials for user authentication
  PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),

  // Auth - shared secret with main API for inter-service auth
  CHAT_API_SECRET: z.string().min(32),

  // Redis for SSE pub/sub (required)
  REDIS_URL: z.string().url(),

  // Logging
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(bunEnv);
