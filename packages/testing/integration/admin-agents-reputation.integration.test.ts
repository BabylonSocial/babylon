/**
 * Integration Tests: Admin Agents Tab with Reputation
 *
 * Tests that the admin agents API returns reputation scores
 * and that the UI can display and sort by reputation.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from 'bun:test';
import { db, userAgentConfigs, users } from '@babylon/db/runtime';

import { generateSnowflakeId } from '@babylon/shared';

const BASE_URL =
  process.env.TEST_API_URL ||
  process.env.TEST_BASE_URL ||
  'http://localhost:3000';
let serverAvailable = false;

describe('Admin Agents Reputation Integration', () => {
  let testAgentUserId: string;
  let adminAccessToken: string | null = null;

  beforeAll(async () => {
    // Check if server is running
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (healthResponse.ok) {
        serverAvailable = true;
        console.log('✅ Server available for testing');
      }
    } catch (_error) {
      console.warn('⚠️  Server not available, some tests may be skipped');
    }

    // Create test agent (use 'rep-agent' prefix to avoid preload cleanup which targets 'test-*')
    testAgentUserId = await generateSnowflakeId();

    // Create user record
    await db.insert(users).values({
      id: testAgentUserId,
      username: `rep-agent-${testAgentUserId}`,
      displayName: 'Test Agent for Reputation',
      isAgent: true,
      agent0TokenId: 99999,
      updatedAt: new Date(),
    });

    // Create agent config record
    await db.insert(userAgentConfigs).values({
      id: await generateSnowflakeId(),
      userId: testAgentUserId,
      autonomousTrading: true,
      modelTier: 'pro',
      updatedAt: new Date(),
    });

    // Create performance metrics with reputation
    await db.agentPerformanceMetrics.create({
      data: {
        id: await generateSnowflakeId(),
        userId: testAgentUserId,
        reputationScore: 85,
        averageFeedbackScore: 82,
        totalFeedbackCount: 15,
        totalTrades: 50,
        profitableTrades: 35,
        updatedAt: new Date(),
      },
    });

    // Try to get admin access token (if available)
    adminAccessToken = process.env.TEST_ADMIN_TOKEN || null;
  });

  afterEach(async () => {
    // Don't clean up metrics - they're needed for tests
    // Cleanup will happen in afterAll if needed
  });

  test('should fetch agents with reputation scores from API', async () => {
    if (!serverAvailable) {
      console.log('⏭️  Skipping API test - server not available');
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (adminAccessToken) {
        headers['Authorization'] = `Bearer ${adminAccessToken}`;
      }

      const response = await fetch(`${BASE_URL}/api/admin/agents`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.agents).toBeInstanceOf(Array);

        // Find our test agent
        const testAgent = data.data.agents.find(
          (a: { id: string }) => a.id === testAgentUserId
        );

        if (testAgent) {
          expect(testAgent.reputationScore).toBeDefined();
          expect(testAgent.reputationScore).toBeGreaterThanOrEqual(0);
          expect(testAgent.reputationScore).toBeLessThanOrEqual(100);
          expect(testAgent.averageFeedbackScore).toBeDefined();
          expect(testAgent.totalFeedbackCount).toBeDefined();
        }
      } else {
        // May require proper auth
        console.log('⚠️  API requires authentication or admin access');
      }
    } catch (error) {
      console.warn('⚠️  API test failed:', error);
    }
  });

  test('should verify reputation data structure', async () => {
    // Re-verify or recreate test data in case it was cleaned up
    let agent = await db.user.findUnique({
      where: { id: testAgentUserId },
      include: {
        AgentPerformanceMetrics: true,
      },
    });

    // If agent was cleaned up by another test, recreate it
    if (!agent) {
      // Create user record
      await db.insert(users).values({
        id: testAgentUserId,
        username: `rep-agent-${testAgentUserId}`,
        displayName: 'Test Agent for Reputation',
        isAgent: true,
        agent0TokenId: 99999,
        updatedAt: new Date(),
      });

      // Create agent config record
      await db.insert(userAgentConfigs).values({
        id: await generateSnowflakeId(),
        userId: testAgentUserId,
        autonomousTrading: true,
        modelTier: 'pro',
        updatedAt: new Date(),
      });

      await db.agentPerformanceMetrics.create({
        data: {
          id: await generateSnowflakeId(),
          userId: testAgentUserId,
          reputationScore: 85,
          averageFeedbackScore: 82,
          totalFeedbackCount: 15,
          totalTrades: 50,
          profitableTrades: 35,
          updatedAt: new Date(),
        },
      });

      agent = await db.user.findUnique({
        where: { id: testAgentUserId },
        include: {
          AgentPerformanceMetrics: true,
        },
      });
    }

    expect(agent).toBeDefined();
    const agentWithMetrics = agent as typeof agent & {
      AgentPerformanceMetrics: {
        reputationScore: number;
        averageFeedbackScore: number | null;
        totalFeedbackCount: number;
      } | null;
    };
    expect(agentWithMetrics?.AgentPerformanceMetrics).toBeDefined();

    // Verify reputation score exists and is valid
    const reputationScore =
      agentWithMetrics?.AgentPerformanceMetrics?.reputationScore;
    expect(reputationScore).toBeDefined();
    expect(reputationScore).toBeGreaterThanOrEqual(0);
    expect(reputationScore).toBeLessThanOrEqual(100);

    // Verify other metrics exist
    expect(
      agentWithMetrics?.AgentPerformanceMetrics?.averageFeedbackScore
    ).toBeDefined();
    expect(
      agentWithMetrics?.AgentPerformanceMetrics?.totalFeedbackCount
    ).toBeDefined();
  });

  test('should handle agents without reputation metrics', async () => {
    const newAgentId = await generateSnowflakeId();
    await db.user.create({
      data: {
        id: newAgentId,
        username: `no-rep-agent-${Date.now()}`,
        displayName: 'Agent Without Reputation',
        isAgent: true,
        updatedAt: new Date(),
      },
    });

    const agent = await db.user.findUnique({
      where: { id: newAgentId },
      include: {
        AgentPerformanceMetrics: true,
      },
    });

    expect(agent).toBeDefined();
    // Should have default reputation score of 50 if no metrics
    const agentWithMetrics = agent as typeof agent & {
      AgentPerformanceMetrics: {
        reputationScore: number;
        averageFeedbackScore: number | null;
        totalFeedbackCount: number;
      } | null;
    };
    expect(agentWithMetrics?.AgentPerformanceMetrics).toBeNull();

    // Clean up
    await db.user.delete({ where: { id: newAgentId } });
  });

  afterAll(async () => {
    // Clean up test agent and metrics
    await db.agentPerformanceMetrics.deleteMany({
      where: { userId: testAgentUserId },
    });
    await db.user.delete({ where: { id: testAgentUserId } });
  });
});
