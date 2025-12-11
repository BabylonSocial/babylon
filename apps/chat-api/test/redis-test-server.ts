/**
 * In-Memory Redis Test Server
 *
 * Uses redis-memory-server to create an ephemeral Redis instance for testing.
 * No Docker required - runs entirely in-memory.
 */

import { RedisMemoryServer } from 'redis-memory-server';

export type RedisTestSetup = {
  server: RedisMemoryServer;
  host: string;
  port: number;
  url: string;
  shutdown: () => Promise<void>;
};

/**
 * Creates an in-memory Redis server for testing.
 * Uses atomic .create() to prevent race conditions when tests run in parallel.
 */
export async function createTestRedisSetup(): Promise<RedisTestSetup> {
  const server = await RedisMemoryServer.create();

  const host = await server.getHost();
  const port = await server.getPort();

  return {
    server,
    host,
    port,
    url: `redis://${host}:${port}`,
    shutdown: async () => {
      await server.stop();
    },
  };
}
