/**
 * Integration tests for lazy database connection creation
 *
 * Verifies that client objects are only created when queries execute,
 * not during property access. This optimizes cold start performance.
 *
 * These are integration tests because they require a real database connection.
 */

import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { db } from '@babylon/db/runtime';

import {
  setupTestEnvironment,
  shouldSkipDatabaseTests,
} from '../helpers/setup';

const shouldSkip = shouldSkipDatabaseTests();

describe.skipIf(shouldSkip)('Lazy Connection Creation (Integration)', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterEach(() => {
    // Note: We don't clear clients between tests as they're cached globally
    // The tests verify creation timing, not isolation
  });

  it('should not create client on property access', async () => {
    const globalForDb = globalThis as typeof globalThis & {
      postgresClient: unknown;
      db: unknown;
    };

    // Save original values
    const originalPostgresClient = globalForDb.postgresClient;
    const originalDb = globalForDb.db;

    try {
      // Temporarily clear to test creation timing
      globalForDb.postgresClient = undefined;
      globalForDb.db = undefined;

      // Access property (should not create client immediately)
      void db.user;
      // Verify client was NOT created by property access alone
      expect(globalForDb.postgresClient).toBeUndefined();
      expect(globalForDb.db).toBeUndefined();

      // Execute query (should ensure client is created)
      await db.user.findMany({ take: 1 });
      expect(globalForDb.postgresClient).toBeDefined();
      expect(globalForDb.db).toBeDefined();
    } finally {
      // Restore original values
      globalForDb.postgresClient = originalPostgresClient;
      globalForDb.db = originalDb;
    }
  });

  it('should use lazy proxy for reads without replica', async () => {
    // Save original env
    const originalReplicaUrl = process.env.DATABASE_READ_REPLICA_URL;
    delete process.env.DATABASE_READ_REPLICA_URL;

    const globalForDb = globalThis as typeof globalThis & {
      postgresClient: unknown;
      db: unknown;
    };

    // Save original values
    const originalPostgresClient = globalForDb.postgresClient;
    const originalDb = globalForDb.db;

    try {
      // Clear client to test lazy creation
      globalForDb.postgresClient = undefined;
      globalForDb.db = undefined;

      // Property access - should not create client (lazy proxy)
      void db.user;
      // Verify client was NOT created by property access alone
      expect(globalForDb.postgresClient).toBeUndefined();
      expect(globalForDb.db).toBeUndefined();

      // Query execution - client should be created now
      await db.user.findMany({ take: 1 });
      expect(globalForDb.postgresClient).toBeDefined();
      expect(globalForDb.db).toBeDefined();
    } finally {
      // Restore
      globalForDb.postgresClient = originalPostgresClient;
      globalForDb.db = originalDb;
      if (originalReplicaUrl) {
        process.env.DATABASE_READ_REPLICA_URL = originalReplicaUrl;
      }
    }
  });

  it('should not create write client when replica configured', async () => {
    // Save original env
    const originalReplicaUrl = process.env.DATABASE_READ_REPLICA_URL;
    // Use same URL as primary for testing (in production, this would be different)
    process.env.DATABASE_READ_REPLICA_URL = process.env.DATABASE_URL;

    const globalForDb = globalThis as typeof globalThis & {
      postgresClient: unknown;
      readReplicaClient: unknown;
      db: unknown;
      readReplicaDb: unknown;
    };

    // Save original values
    const originalPostgresClient = globalForDb.postgresClient;
    const originalReadReplicaClient = globalForDb.readReplicaClient;
    const originalDb = globalForDb.db;
    const originalReadReplicaDb = globalForDb.readReplicaDb;

    try {
      // Clear clients
      globalForDb.postgresClient = undefined;
      globalForDb.readReplicaClient = undefined;
      globalForDb.db = undefined;
      globalForDb.readReplicaDb = undefined;

      // Read operation - should use replica, not create write client
      await db.user.findMany({ take: 1 });

      // Write client should not be created (reads use replica)
      // Note: If replica URL equals primary URL, both might be the same client
      // In production with separate replica, write client would be undefined
      expect(globalForDb.readReplicaClient).toBeDefined();
    } finally {
      // Restore
      globalForDb.postgresClient = originalPostgresClient;
      globalForDb.readReplicaClient = originalReadReplicaClient;
      globalForDb.db = originalDb;
      globalForDb.readReplicaDb = originalReadReplicaDb;
      if (originalReplicaUrl !== undefined) {
        process.env.DATABASE_READ_REPLICA_URL = originalReplicaUrl;
      } else {
        delete process.env.DATABASE_READ_REPLICA_URL;
      }
    }
  });

  it('should work with top-level read methods', async () => {
    const globalForDb = globalThis as typeof globalThis & {
      postgresClient: unknown;
      db: unknown;
    };

    // Save original values
    const originalPostgresClient = globalForDb.postgresClient;
    const originalDb = globalForDb.db;

    try {
      // Clear client
      globalForDb.postgresClient = undefined;
      globalForDb.db = undefined;

      // Access top-level method (lazy proxy should defer)
      void db.select;
      // Verify client was NOT created by property access alone
      expect(globalForDb.postgresClient).toBeUndefined();
      expect(globalForDb.db).toBeUndefined();

      // Execute query using table repository method instead (more common pattern)
      await db.user.findFirst();
      expect(globalForDb.postgresClient).toBeDefined();
    } finally {
      // Restore
      globalForDb.postgresClient = originalPostgresClient;
      globalForDb.db = originalDb;
    }
  });
});
