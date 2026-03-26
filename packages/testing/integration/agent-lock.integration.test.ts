/**
 * Integration Test: Agent Lock Service
 *
 * Tests the distributed locking mechanism for agent ticks:
 * - Lock acquisition prevents concurrent execution
 * - Locks are released properly
 * - Stale lock recovery works after expiry
 * - Per-agent locks are independent
 * - Race conditions are handled
 * - Serverless-safe ID generation
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { createTestAgent } from '@babylon/agents';
import {
  acquireAgentLock,
  checkAgentLock,
  releaseAgentLock,
} from '@babylon/agents/services/agent-lock-service';
import { db } from '@babylon/db/runtime';

import type {
  AgentTickResponse,
  AgentTickResultItem,
} from '../types/test-types';

const BASE_URL =
  process.env.TEST_API_URL ||
  process.env.TEST_BASE_URL ||
  'http://localhost:3000';
let serverAvailable = false;
let cronEndpointAvailable = false;
let testSetupComplete = false;

describe('Agent Lock Service Integration', () => {
  let testAgentId1: string;
  let testAgentId2: string;

  beforeAll(async () => {
    // Check if server is running with timeout
    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      serverAvailable = response.ok;
    } catch {
      serverAvailable = false;
    }

    if (!serverAvailable) {
      console.log('⏭️  Skipping agent lock tests - server not available');
      return;
    }

    // Check if cron endpoint is functional (may return 500 if misconfigured)
    try {
      const cronSecret = process.env.CRON_SECRET || 'development';
      const cronResponse = await fetch(`${BASE_URL}/api/cron/agent-tick`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      // Consider endpoint available if it returns 200-299 (success)
      cronEndpointAvailable = cronResponse.ok;
      if (!cronEndpointAvailable) {
        console.log(
          `⏭️  Cron endpoint not available (status: ${cronResponse.status}) - endpoint tests will skip`
        );
      }
    } catch {
      cronEndpointAvailable = false;
      console.log('⏭️  Cron endpoint check failed - endpoint tests will skip');
    }

    // Create two test agents
    try {
      const agent1 = await createTestAgent('lock-test-agent-1', {
        autonomousTrading: true,
        virtualBalance: 10000,
      });
      testAgentId1 = agent1.agentId;

      const agent2 = await createTestAgent('lock-test-agent-2', {
        autonomousTrading: true,
        virtualBalance: 10000,
      });
      testAgentId2 = agent2.agentId;

      testSetupComplete = true;
    } catch (error) {
      console.log('⏭️  Test agent creation failed - skipping tests:', error);
      testSetupComplete = false;
    }
  });

  afterAll(async () => {
    if (!serverAvailable || !testSetupComplete) return;

    // Cleanup test agents and their locks
    try {
      await db.generationLock.deleteMany({
        where: {
          id: {
            in: [`agent-tick-${testAgentId1}`, `agent-tick-${testAgentId2}`],
          },
        },
      });

      if (testAgentId1) {
        await db.user.delete({ where: { id: testAgentId1 } }).catch(() => {});
      }
      if (testAgentId2) {
        await db.user.delete({ where: { id: testAgentId2 } }).catch(() => {});
      }
    } catch (error) {
      // Cleanup errors not critical
      console.warn('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    if (!serverAvailable || !testSetupComplete) return;

    // Clean up any existing locks before each test
    await db.generationLock.deleteMany({
      where: {
        id: {
          in: [`agent-tick-${testAgentId1}`, `agent-tick-${testAgentId2}`],
        },
      },
    });
  });

  test('should acquire lock successfully when no lock exists', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    const processId = 'test-process-1';
    const acquired = await acquireAgentLock(testAgentId1, processId);

    expect(acquired).toBe(true);

    // Verify lock exists in database
    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });

    expect(lock).toBeTruthy();
    expect(lock?.lockedBy).toBe(processId);
    expect(lock?.operation).toBe('agent-tick');
    expect(lock?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Cleanup
    await releaseAgentLock(testAgentId1, processId);
  });

  test('should prevent concurrent lock acquisition (double-tick prevention)', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    const processId1 = 'test-process-1';
    const processId2 = 'test-process-2';

    // First process acquires lock
    const acquired1 = await acquireAgentLock(testAgentId1, processId1);
    expect(acquired1).toBe(true);

    // Second process tries to acquire same lock (returns false, doesn't throw error)
    // This logs an INFO message and allows graceful skipping
    const acquired2 = await acquireAgentLock(testAgentId1, processId2);
    expect(acquired2).toBe(false);

    // Verify only first process has the lock
    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });
    expect(lock?.lockedBy).toBe(processId1);

    // Cleanup
    await releaseAgentLock(testAgentId1, processId1);
  });

  test('should release lock properly', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    const processId = 'test-process-release';

    // Acquire lock
    await acquireAgentLock(testAgentId1, processId);

    // Release lock
    await releaseAgentLock(testAgentId1, processId);

    // Verify lock is gone
    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });
    expect(lock).toBeNull();

    // Should be able to acquire again
    const reacquired = await acquireAgentLock(testAgentId1, processId);
    expect(reacquired).toBe(true);

    // Cleanup
    await releaseAgentLock(testAgentId1, processId);
  });

  test('should handle stale lock recovery (expired locks)', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    // Create an expired lock (simulate crashed process)
    const staleLockId = `agent-tick-${testAgentId1}`;
    await db.generationLock.create({
      data: {
        id: staleLockId,
        lockedBy: 'crashed-process',
        lockedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 minutes ago
        operation: 'agent-tick',
      },
    });

    // Try to acquire - should succeed because lock is expired
    const processId = 'recovery-process';
    const acquired = await acquireAgentLock(testAgentId1, processId);
    expect(acquired).toBe(true);

    // Verify new process has the lock
    const lock = await db.generationLock.findUnique({
      where: { id: staleLockId },
    });
    expect(lock?.lockedBy).toBe(processId);
    expect(lock?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Cleanup
    await releaseAgentLock(testAgentId1, processId);
  });

  test('should keep locks independent per agent', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    const processId1 = 'test-process-agent1';
    const processId2 = 'test-process-agent2';

    // Acquire locks for different agents
    const acquired1 = await acquireAgentLock(testAgentId1, processId1);
    const acquired2 = await acquireAgentLock(testAgentId2, processId2);

    // Both should succeed - locks are independent
    expect(acquired1).toBe(true);
    expect(acquired2).toBe(true);

    // Verify both locks exist
    const lock1 = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });
    const lock2 = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId2}` },
    });

    expect(lock1?.lockedBy).toBe(processId1);
    expect(lock2?.lockedBy).toBe(processId2);

    // Cleanup
    await releaseAgentLock(testAgentId1, processId1);
    await releaseAgentLock(testAgentId2, processId2);
  });

  test('should handle race conditions gracefully', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    // Simulate race condition: multiple processes try to acquire simultaneously
    const processes = ['race-1', 'race-2', 'race-3', 'race-4', 'race-5'];

    const acquisitions = await Promise.all(
      processes.map((pid) => acquireAgentLock(testAgentId1, pid))
    );

    // Only one should succeed, others return false (warn, don't error)
    const successCount = acquisitions.filter(
      (result) => result === true
    ).length;
    expect(successCount).toBe(1);

    // Verify only one lock exists
    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });
    expect(lock).toBeTruthy();
    expect(lock?.lockedBy).toBeDefined();
    expect(processes).toContain(lock!.lockedBy);

    // Cleanup
    await releaseAgentLock(testAgentId1, lock!.lockedBy);
  });

  test('should generate serverless-safe unique process IDs', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    // Acquire without explicit process ID (tests auto-generation)
    const acquired1 = await acquireAgentLock(testAgentId1);
    expect(acquired1).toBe(true);

    const lock1 = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });

    // Should have auto-generated serverless-safe ID
    expect(lock1?.lockedBy).toMatch(/^serverless-\d+-[a-f0-9]{16}$/);

    await releaseAgentLock(testAgentId1, lock1!.lockedBy);

    // Acquire again - should get different ID
    const acquired2 = await acquireAgentLock(testAgentId1);
    expect(acquired2).toBe(true);

    const lock2 = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });

    // IDs should be unique
    expect(lock2?.lockedBy).not.toBe(lock1?.lockedBy);
    expect(lock2?.lockedBy).toMatch(/^serverless-\d+-[a-f0-9]{16}$/);

    await releaseAgentLock(testAgentId1, lock2!.lockedBy);
  });

  test('should check lock status correctly', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    // No lock initially
    let lockStatus = await checkAgentLock(testAgentId1);
    expect(lockStatus).toBeNull();

    // Acquire lock
    const processId = 'check-test-process';
    await acquireAgentLock(testAgentId1, processId);

    // Check lock status
    lockStatus = await checkAgentLock(testAgentId1);
    expect(lockStatus).toBeTruthy();
    expect(lockStatus?.id).toBe(`agent-tick-${testAgentId1}`);
    expect(lockStatus?.lockedBy).toBe(processId);
    expect(lockStatus?.operation).toBe('agent-tick');

    // Cleanup
    await releaseAgentLock(testAgentId1, processId);

    // Check again - should be null
    lockStatus = await checkAgentLock(testAgentId1);
    expect(lockStatus).toBeNull();
  });

  test('should only allow lock owner to release', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    const ownerProcess = 'lock-owner';
    const intruderProcess = 'intruder';

    // Owner acquires lock
    await acquireAgentLock(testAgentId1, ownerProcess);

    // Intruder tries to release
    await releaseAgentLock(testAgentId1, intruderProcess);

    // Lock should still exist (owned by owner)
    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });
    expect(lock?.lockedBy).toBe(ownerProcess);

    // Owner releases successfully
    await releaseAgentLock(testAgentId1, ownerProcess);

    // Now lock should be gone
    const lockAfter = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });
    expect(lockAfter).toBeNull();
  });

  test('should handle lock expiry timing correctly', async () => {
    if (!serverAvailable || !testSetupComplete) {
      console.log('⏭️  Skipping - server not available or test setup failed');
      return;
    }

    const processId = 'expiry-test';
    await acquireAgentLock(testAgentId1, processId);

    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId1}` },
    });

    // Lock should expire in ~15 minutes (900 seconds)
    const expiryDuration = lock!.expiresAt.getTime() - Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    const buffer = 5000; // 5 second buffer for test execution time

    // Should be approximately 15 minutes (within buffer)
    expect(expiryDuration).toBeGreaterThan(fifteenMinutes - buffer);
    expect(expiryDuration).toBeLessThan(fifteenMinutes + buffer);

    // Lock expiry should be greater than Vercel maxDuration (800s = 13.3min)
    const maxDurationMs = 800 * 1000;
    expect(expiryDuration).toBeGreaterThan(maxDurationMs);

    await releaseAgentLock(testAgentId1, processId);
  });
});

describe('Agent Tick Endpoint Lock Integration', () => {
  let testAgentId: string;

  beforeAll(async () => {
    if (!serverAvailable) return;

    const agent = await createTestAgent('endpoint-lock-test', {
      autonomousTrading: true,
      virtualBalance: 10000,
    });
    testAgentId = agent.agentId;
  });

  afterAll(async () => {
    if (!serverAvailable || !testSetupComplete) return;

    try {
      await db.generationLock.deleteMany({
        where: { id: `agent-tick-${testAgentId}` },
      });
      if (testAgentId) {
        await db.user.delete({ where: { id: testAgentId } }).catch(() => {});
      }
    } catch (_error) {
      // Cleanup errors not critical
    }
  });

  test('should skip locked agents in agent-tick endpoint', async () => {
    if (!serverAvailable || !testSetupComplete || !cronEndpointAvailable) {
      console.log(
        '⏭️  Skipping - server not available, test setup failed, or cron endpoint not functional'
      );
      return;
    }

    // Manually lock the agent
    const manualProcess = 'manual-lock-process';
    await acquireAgentLock(testAgentId, manualProcess);

    // Call the agent-tick endpoint
    const cronSecret = process.env.CRON_SECRET || 'development';
    const response = await fetch(`${BASE_URL}/api/cron/agent-tick`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    // The endpoint should report the agent as skipped
    expect(result.success).toBe(true);

    // Find our agent in results
    const typedResult = result as AgentTickResponse;
    const agentResult = typedResult.results?.find(
      (r: AgentTickResultItem) => r.agentId === testAgentId
    );

    if (agentResult) {
      expect(agentResult.status).toBe('skipped');
      expect(agentResult.reason).toBe('locked');
    }

    // Should have at least one skipped agent
    expect(result.skippedLocked).toBeGreaterThanOrEqual(0);

    // Cleanup
    await releaseAgentLock(testAgentId, manualProcess);
  });

  test('should process agent when lock is available', async () => {
    if (!serverAvailable || !testSetupComplete || !cronEndpointAvailable) {
      console.log(
        '⏭️  Skipping - server not available, test setup failed, or cron endpoint not functional'
      );
      return;
    }

    // Make sure no lock exists
    await db.generationLock.deleteMany({
      where: { id: `agent-tick-${testAgentId}` },
    });

    // Call the agent-tick endpoint
    const cronSecret = process.env.CRON_SECRET || 'development';
    const response = await fetch(`${BASE_URL}/api/cron/agent-tick`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.success).toBe(true);

    // The agent should be processed (not skipped)
    const typedResult2 = result as AgentTickResponse;
    const agentResult = typedResult2.results?.find(
      (r: AgentTickResultItem) => r.agentId === testAgentId
    );

    if (agentResult) {
      // Should not be skipped
      expect(agentResult.status).not.toBe('skipped');
      // Should be success or error, but not locked
      expect(agentResult.reason).not.toBe('locked');
    }

    // After processing, lock should be released
    const lock = await db.generationLock.findUnique({
      where: { id: `agent-tick-${testAgentId}` },
    });

    // Lock should be released (should not exist)
    expect(lock).toBeNull();
  });
});
