/**
 * Markets Tick Cron Integration Tests
 *
 * Tests the complete markets-tick cron lifecycle including:
 * 1. Market creation with QuestionManager
 * 2. Market resolution
 * 3. Sub-market management
 * 4. Response structure and metrics
 *
 * These tests exercise real database operations with mocked LLM calls.
 */

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  setDefaultTimeout,
  test,
} from 'bun:test';
import { NextRequest } from 'next/server';
import type {
  GET as MarketsTickGet,
  POST as MarketsTickPost,
} from '@/app/api/cron/markets-tick/route';

// Set test environment first (before any imports)
process.env.NODE_ENV = 'test';
process.env.BUN_ENV = 'test';
process.env.LLM_TIMEOUT_MS = '30000';

// Define mock types inline (matches LLMGenerateJSONOptions and LLMJsonSchema from @babylon/engine)
interface MockLLMGenerateJSONOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  format?: 'xml' | 'json';
  promptType?: string;
  promptTemplate?: string;
}

interface MockLLMJsonSchema {
  required?: string[];
  properties?: Record<string, unknown>;
}

// Mock LLM client BEFORE importing the route
mock.module('@babylon/engine', async () => {
  const actualEngine = await import('@babylon/engine');

  const createMockClient = () => ({
    generateJSON: async <T>(
      _prompt: string,
      _schema?: MockLLMJsonSchema,
      _options?: MockLLMGenerateJSONOptions
    ): Promise<T> => {
      // Return deterministic question data for market creation
      return {
        text: 'Integration test: Will the market resolve correctly?',
        expectedOutcome: true,
        resolutionCriteria: 'Test criteria for resolution',
        affiliatedActorIds: [],
        affiliatedOrgIds: [],
      } as T;
    },
    complete: async () => 'Mock completion response',
  });

  // Override only BabylonLLMClient while preserving other exports
  return {
    ...actualEngine,
    BabylonLLMClient: {
      forGameTick: createMockClient,
      forGroq: createMockClient,
      forOpenRouter: createMockClient,
    },
    // Also mock QuestionManager to use our deterministic responses
    QuestionManager: class MockQuestionManager {
      constructor(_llmClient: unknown) {}

      async generateTimeframeQuestion(_timeframe: string, _durationMs: number) {
        return {
          text: `Integration test: Market for ${_timeframe}?`,
          expectedOutcome: true,
          resolutionCriteria: 'Test criteria',
          affiliatedActorIds: [],
          affiliatedOrgIds: [],
        };
      }

      async generateResolutionWithProof() {
        return {
          description: 'Market resolved via test',
          confidence: 0.95,
          requiresManualReview: false,
          proof: null,
        };
      }
    },
  };
});

import {
  and,
  eq,
  inArray,
  isNull,
  type MarketTimeframe,
  sql,
} from '@babylon/db';
import { db, posts, questions, timeframedMarkets } from '@babylon/db/runtime';
import {
  GRANULAR_TO_DB_TIMEFRAME,
  mapGranularToDbTimeframe,
} from '@babylon/engine';
import { generateSnowflakeId } from '@babylon/shared';

// Set timeout to 120 seconds for integration tests (market creation can be slow)
setDefaultTimeout(120000);

// Test data cleanup tracking
const testIds = {
  questionIds: [] as string[],
  marketIds: [] as string[],
  postIds: [] as string[],
};

// ============ HELPER FUNCTIONS ============

/**
 * Clean up all test data created during tests.
 * Deletes in reverse dependency order.
 * Errors propagate to fail fast and surface cleanup issues.
 */
async function cleanupTestData(): Promise<void> {
  // Delete posts first (they may reference questions)
  if (testIds.postIds.length > 0) {
    await db.delete(posts).where(inArray(posts.id, testIds.postIds));
  }

  // Delete markets (they reference questions)
  if (testIds.marketIds.length > 0) {
    await db
      .delete(timeframedMarkets)
      .where(inArray(timeframedMarkets.id, testIds.marketIds));
  }

  // Delete questions last
  if (testIds.questionIds.length > 0) {
    await db
      .delete(questions)
      .where(inArray(questions.id, testIds.questionIds));
  }
}

/**
 * Create a test game record for the cron to find.
 */
async function ensureTestGame(): Promise<{ id: string; isRunning: boolean }> {
  // Check if we have a continuous game
  const [game] = await db.execute(
    sql`SELECT id, "isRunning" FROM "Game" WHERE "isContinuous" = true LIMIT 1`
  );

  if (game) {
    return { id: (game as { id: string }).id, isRunning: true };
  }

  // For tests, we'll skip if no game exists
  return { id: 'test-game', isRunning: false };
}

/**
 * Create a test market directly in the database.
 */
async function createTestMarket(options: {
  timeframe: MarketTimeframe;
  isActive?: boolean;
  endTime?: Date;
}): Promise<{ marketId: string; questionId: string }> {
  const questionId = await generateSnowflakeId();
  const marketId = await generateSnowflakeId();

  // Get next question number
  const [maxResult] = await db
    .select({ max: sql<number>`COALESCE(MAX("questionNumber"), 0)` })
    .from(questions);
  const nextQuestionNumber = (maxResult?.max ?? 0) + 1;

  // Create question
  await db.insert(questions).values({
    id: questionId,
    questionNumber: nextQuestionNumber,
    text: `Integration test: ${options.timeframe} market`,
    scenarioId: 1,
    outcome: true,
    rank: 1,
    createdDate: new Date(),
    resolutionDate: options.endTime ?? new Date(Date.now() + 60 * 60 * 1000),
    status: options.isActive === false ? 'resolved' : 'active',
    updatedAt: new Date(),
  });
  testIds.questionIds.push(questionId);

  // Create timeframed market
  const now = new Date();
  await db.insert(timeframedMarkets).values({
    id: marketId,
    questionId,
    timeframe: options.timeframe,
    startTime: now,
    endTime: options.endTime ?? new Date(Date.now() + 60 * 60 * 1000),
    isActive: options.isActive ?? true,
    isResolved: options.isActive === false,
    arcStateEnteredAt: now,
  });
  testIds.marketIds.push(marketId);

  return { marketId, questionId };
}

/**
 * Count active main markets (excluding sub-markets).
 */
async function countActiveMainMarkets(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(timeframedMarkets)
    .where(
      and(
        eq(timeframedMarkets.isActive, true),
        isNull(timeframedMarkets.parentMarketId)
      )
    );
  return result?.count ?? 0;
}

// ============ TEST SETUP ============

let dbAvailable = false;

beforeAll(async () => {
  try {
    // Verify database connection
    await db.execute(sql`SELECT 1`);
    console.log('[Integration Test] Database connection verified');
    dbAvailable = true;

    // Clean up any stale test data from previous runs
    await db.execute(
      sql`DELETE FROM "TimeframedMarket" WHERE "questionId" IN (SELECT id FROM "Question" WHERE text LIKE 'Integration test:%')`
    );
    await db.execute(
      sql`DELETE FROM "Question" WHERE text LIKE 'Integration test:%'`
    );
  } catch (error) {
    console.error('[Integration Test] Database not available:', error);
    dbAvailable = false;
  }
});

afterEach(async () => {
  if (dbAvailable) {
    await cleanupTestData();
    // Reset test ID arrays
    testIds.questionIds = [];
    testIds.marketIds = [];
    testIds.postIds = [];
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await cleanupTestData();
  }
});

// ============ TESTS ============

describe('Markets Tick Integration', () => {
  describe('Database Operations', () => {
    test('should verify database connection', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      const [result] = await db.execute(sql`SELECT 1 as connected`);
      expect(result).toBeDefined();
    });

    test('should create and cleanup test markets correctly', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      // Create a test market
      const { marketId, questionId } = await createTestMarket({
        timeframe: 'flash',
        isActive: true,
      });

      // Verify it exists
      const [market] = await db
        .select()
        .from(timeframedMarkets)
        .where(eq(timeframedMarkets.id, marketId));

      expect(market).toBeDefined();
      expect(market!.questionId).toBe(questionId);
      expect(market!.isActive).toBe(true);

      // Cleanup will happen in afterEach
    });
  });

  describe('Market Structure', () => {
    test('should count main markets separately from sub-markets', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      const initialCount = await countActiveMainMarkets();

      // Create a main market
      await createTestMarket({
        timeframe: 'flash',
        isActive: true,
      });

      const afterMainCount = await countActiveMainMarkets();
      expect(afterMainCount).toBe(initialCount + 1);
    });

    test('should exclude sub-markets from main market count', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      const initialCount = await countActiveMainMarkets();

      // Create a main market
      const { marketId: parentMarketId } = await createTestMarket({
        timeframe: 'flash',
        isActive: true,
      });

      // Create a sub-market (with parentMarketId)
      const subMarketId = await generateSnowflakeId();
      const subQuestionId = await generateSnowflakeId();

      const [maxResult] = await db
        .select({ max: sql<number>`COALESCE(MAX("questionNumber"), 0)` })
        .from(questions);
      const nextQuestionNumber = (maxResult?.max ?? 0) + 1;

      await db.insert(questions).values({
        id: subQuestionId,
        questionNumber: nextQuestionNumber,
        text: 'Integration test: Sub-market',
        scenarioId: 1,
        outcome: true,
        rank: 1,
        createdDate: new Date(),
        resolutionDate: new Date(Date.now() + 30 * 60 * 1000),
        status: 'active',
        updatedAt: new Date(),
      });
      testIds.questionIds.push(subQuestionId);

      const subNow = new Date();
      await db.insert(timeframedMarkets).values({
        id: subMarketId,
        questionId: subQuestionId,
        parentMarketId,
        timeframe: 'flash',
        startTime: subNow,
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
        isResolved: false,
        arcStateEnteredAt: subNow,
      });
      testIds.marketIds.push(subMarketId);

      // Count should only show main market, not sub-market
      const afterSubCount = await countActiveMainMarkets();
      expect(afterSubCount).toBe(initialCount + 1); // Only +1, not +2
    });

    test('should exclude sub-markets from gap-filling even with many sub-markets', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      const initialCount = await countActiveMainMarkets();

      // Create a parent main market
      const { marketId: parentMarketId } = await createTestMarket({
        timeframe: 'flash',
        isActive: true,
      });

      // Create 10 sub-markets to simulate the MAX_SUB_MARKETS scenario
      const subMarketCount = 10;
      for (let i = 0; i < subMarketCount; i++) {
        const subMarketId = await generateSnowflakeId();
        const subQuestionId = await generateSnowflakeId();

        const [maxResult] = await db
          .select({ max: sql<number>`COALESCE(MAX("questionNumber"), 0)` })
          .from(questions);
        const nextQuestionNumber = (maxResult?.max ?? 0) + 1;

        await db.insert(questions).values({
          id: subQuestionId,
          questionNumber: nextQuestionNumber,
          text: `Integration test: Sub-market ${i + 1}`,
          scenarioId: 1,
          outcome: true,
          rank: 1,
          createdDate: new Date(),
          resolutionDate: new Date(Date.now() + (15 + i * 5) * 60 * 1000),
          status: 'active',
          updatedAt: new Date(),
        });
        testIds.questionIds.push(subQuestionId);

        const subNow = new Date();
        await db.insert(timeframedMarkets).values({
          id: subMarketId,
          questionId: subQuestionId,
          parentMarketId,
          timeframe: 'flash',
          startTime: subNow,
          endTime: new Date(Date.now() + (15 + i * 5) * 60 * 1000),
          isActive: true,
          isResolved: false,
          arcStateEnteredAt: subNow,
        });
        testIds.marketIds.push(subMarketId);
      }

      // Count active markets - should still only count the 1 main market
      const afterManySubsCount = await countActiveMainMarkets();
      expect(afterManySubsCount).toBe(initialCount + 1);

      // Verify total active markets (main + sub) is 11
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(timeframedMarkets)
        .where(eq(timeframedMarkets.isActive, true));
      const totalActive = totalResult?.count ?? 0;

      // Total should include all created markets (1 main + 10 subs)
      expect(totalActive).toBeGreaterThanOrEqual(
        initialCount + 1 + subMarketCount
      );

      // Gap-filling logic uses countActiveMainMarkets(), which excludes sub-markets
      // This verifies that even with 10 sub-markets, gap-filling would still trigger
      // based on the main market count, not the total count
      const gapFillShouldTrigger = afterManySubsCount < 10; // MARKET_STRUCTURE total is 10
      expect(gapFillShouldTrigger).toBe(true);
    });
  });

  describe('Market Timeframe Distribution', () => {
    test('should have correct DB timeframe mapping', () => {
      // Test the mapping logic using the production mapping from @babylon/engine
      // This ensures the test fails if the production mapping changes

      // Verify expected aggregations from the production mapping
      const flashCount = Object.entries(GRANULAR_TO_DB_TIMEFRAME).filter(
        ([, v]) => v === 'flash'
      ).length;
      const intradayCount = Object.entries(GRANULAR_TO_DB_TIMEFRAME).filter(
        ([, v]) => v === 'intraday'
      ).length;
      const dailyCount = Object.entries(GRANULAR_TO_DB_TIMEFRAME).filter(
        ([, v]) => v === 'daily'
      ).length;
      const weeklyCount = Object.entries(GRANULAR_TO_DB_TIMEFRAME).filter(
        ([, v]) => v === 'weekly'
      ).length;

      expect(flashCount).toBe(2); // 15m + 30m
      expect(intradayCount).toBe(2); // 1h + 6h
      expect(dailyCount).toBe(2); // 12h + 1d
      expect(weeklyCount).toBe(2); // 2d + 3d
    });
  });

  describe('Response Metrics', () => {
    test('should track market operations in test data', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      // Create multiple markets to test tracking
      const market1 = await createTestMarket({
        timeframe: 'flash',
        isActive: true,
      });
      const market2 = await createTestMarket({
        timeframe: 'intraday',
        isActive: true,
      });

      expect(testIds.marketIds).toContain(market1.marketId);
      expect(testIds.marketIds).toContain(market2.marketId);
      expect(testIds.questionIds).toContain(market1.questionId);
      expect(testIds.questionIds).toContain(market2.questionId);
    });
  });

  describe('Game State', () => {
    test('should detect game availability', async () => {
      if (!dbAvailable) {
        console.log('Skipping - database not available');
        return;
      }

      const game = await ensureTestGame();
      expect(game).toBeDefined();
      expect(game.id).toBeDefined();
    });
  });
});

describe('Idempotency Check Logic', () => {
  test('should aggregate target counts by DB timeframe', () => {
    // This tests the logic without requiring database
    // Uses the production mapping function from @babylon/engine
    // MARKET_STRUCTURE has these counts:
    // 15m: 2, 30m: 2 -> flash total: 4
    // 1h: 1, 6h: 1 -> intraday total: 2
    // 12h: 1, 1d: 1 -> daily total: 2
    // 2d: 1, 3d: 1 -> weekly total: 2

    const marketStructure: Record<string, { count: number }> = {
      '15m': { count: 2 },
      '30m': { count: 2 },
      '1h': { count: 1 },
      '6h': { count: 1 },
      '12h': { count: 1 },
      '1d': { count: 1 },
      '2d': { count: 1 },
      '3d': { count: 1 },
    };

    // Uses the production mapping function that throws on unknown timeframe
    function getTargetCountForDbTimeframe(dbTimeframe: string): number {
      let total = 0;
      for (const [key, config] of Object.entries(marketStructure)) {
        if (mapGranularToDbTimeframe(key) === dbTimeframe) {
          total += config.count;
        }
      }
      return total;
    }

    expect(getTargetCountForDbTimeframe('flash')).toBe(4);
    expect(getTargetCountForDbTimeframe('intraday')).toBe(2);
    expect(getTargetCountForDbTimeframe('daily')).toBe(2);
    expect(getTargetCountForDbTimeframe('weekly')).toBe(2);
  });

  test('should throw on unknown timeframe', () => {
    expect(() => mapGranularToDbTimeframe('invalid-timeframe')).toThrow(
      'Unsupported granular timeframe: invalid-timeframe'
    );
  });
});

// ============ POST HANDLER INTEGRATION TESTS ============
// These tests exercise the actual HTTP endpoint behavior with a test database

describe('POST Handler Integration', () => {
  // Import the POST handler dynamically to ensure mocks are applied
  let POST: typeof MarketsTickPost;
  let GET: typeof MarketsTickGet;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    const routeModule = await import('@/app/api/cron/markets-tick/route');
    POST = routeModule.POST;
    GET = routeModule.GET;
  });

  test('should return valid JSON response structure', async () => {
    if (!dbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    // Create a request with valid cron authorization header
    const request = new NextRequest('http://localhost/api/cron/markets-tick', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(typeof data.success).toBe('boolean');
  });

  test('should include performance metrics in response', async () => {
    if (!dbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    const request = new NextRequest('http://localhost/api/cron/markets-tick', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    // If not skipped, should have metrics
    if (!data.skipped) {
      expect(data).toHaveProperty('metrics');
      if (data.metrics) {
        expect(typeof data.metrics.getActiveMarketsMs).toBe('number');
        expect(typeof data.metrics.resolutionMs).toBe('number');
        expect(typeof data.metrics.creationMs).toBe('number');
        expect(typeof data.metrics.subMarketCreationMs).toBe('number');
      }
    }
  });

  test('should include duration in response', async () => {
    if (!dbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    const request = new NextRequest('http://localhost/api/cron/markets-tick', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    // Response should always include some timing information
    // Either in metrics.totalMs or as durationMs for skipped responses
    const hasTiming = data.durationMs !== undefined;
    expect(hasTiming || data.skipped).toBe(true);
  });

  test('GET should delegate to POST and return equivalent response', async () => {
    if (!dbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    const headers = {
      Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
    };

    const getRequest = new NextRequest(
      'http://localhost/api/cron/markets-tick',
      {
        method: 'GET',
        headers,
      }
    );

    const postRequest = new NextRequest(
      'http://localhost/api/cron/markets-tick',
      {
        method: 'POST',
        headers,
      }
    );

    const getResponse = await GET(getRequest);
    const postResponse = await POST(postRequest);

    expect(getResponse.status).toBe(postResponse.status);

    const getData = await getResponse.json();
    const postData = await postResponse.json();

    // Both should have success field with same type
    expect(typeof getData.success).toBe(typeof postData.success);
  });

  test('should skip when game is not running', async () => {
    if (!dbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    // This test relies on the game state in the database
    // If there's no running game, the response should indicate skipped
    const request = new NextRequest('http://localhost/api/cron/markets-tick', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    // Should either succeed or be skipped with a reason
    expect(data.success).toBe(true);
    if (data.skipped) {
      expect(data.reason).toBeDefined();
      expect(typeof data.reason).toBe('string');
    }
  });

  test('should return complete execution metrics when not skipped', async () => {
    if (!dbAvailable) {
      console.log('Skipping - database not available');
      return;
    }

    const request = new NextRequest('http://localhost/api/cron/markets-tick', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);

    // If execution completed (not skipped), verify metrics structure
    if (!data.skipped && data.metrics) {
      // Check for expected metric fields
      expect(typeof data.metrics.getActiveMarketsMs).toBe('number');
      expect(typeof data.metrics.resolutionMs).toBe('number');
      expect(typeof data.metrics.creationMs).toBe('number');
      expect(typeof data.metrics.subMarketCreationMs).toBe('number');
    }

    // Check for top-level durationMs (present in all responses, skipped or not)
    if (!data.skipped) {
      expect(typeof data.durationMs).toBe('number');
      expect(data.durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});
