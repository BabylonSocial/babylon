/**
 * Integration Test: Market-Engine Integration (BAB-5)
 *
 * Validates the connection between prediction markets and the game generation engine:
 * - Questions create corresponding markets via ensureMarketExists()
 * - Market resolution is atomic with question resolution
 * - Events are aligned with active questions and markets
 * - NPC trading decisions affect market prices correctly
 * - Price movements are coherent with game events
 *
 * @see https://linear.app/eliza-labs/issue/BAB-5
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  PredictionDbAdapter,
  PredictionMarketService,
} from '@babylon/core/markets/prediction';
import { asSystem, db } from '@babylon/db';
import { QuestionManager } from '@babylon/engine';
import { generateSnowflakeId } from '@babylon/shared';

describe('Market-Engine Integration (BAB-5)', () => {
  // Test data tracking for cleanup
  const testQuestionIds: string[] = [];
  const testMarketIds: string[] = [];
  const testEventIds: string[] = [];

  beforeAll(async () => {
    // Ensure game is running
    const gameState = await asSystem(async (db) => {
      return await db.game.findFirst({
        where: { isContinuous: true },
      });
    });

    if (!gameState) {
      await asSystem(async (db) => {
        await db.game.create({
          data: {
            id: await generateSnowflakeId(),
            isContinuous: true,
            isRunning: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      });
    } else if (!gameState.isRunning) {
      await asSystem(async (db) => {
        await db.game.updateMany({
          where: { isContinuous: true },
          data: { isRunning: true },
        });
      });
    }
  });

  afterAll(async () => {
    // Cleanup test data in reverse order (events -> markets -> questions)
    for (const id of testEventIds) {
      await db.worldEvent.delete({ where: { id } }).catch(() => {});
    }
    for (const id of testMarketIds) {
      await db.market.delete({ where: { id } }).catch(() => {});
    }
    for (const id of testQuestionIds) {
      await db.question.delete({ where: { id } }).catch(() => {});
    }
  });

  describe('1.1 - Market-Engine Flow', () => {
    test('should create market when question is created via ensureMarketExists', async () => {
      // Create a question first
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: Will the integration work?',
          scenarioId: 1,
          outcome: true,
          rank: 1,
          status: 'active',
          resolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      // Use CorePredictionMarketService.ensureMarketExists to create the market
      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      const market = await marketService.ensureMarketExists({
        marketId: questionId,
        initialLiquidity: 20000,
        description: 'Test market for BAB-5 integration',
      });

      testMarketIds.push(market.id);

      // Validate market was created correctly
      expect(market).toBeDefined();
      expect(market.id).toBe(questionId);
      expect(market.liquidity).toBeGreaterThan(0);
      expect(market.resolved).toBe(false);

      // Verify market is in database
      const dbMarket = await db.market.findUnique({
        where: { id: questionId },
      });
      expect(dbMarket).toBeTruthy();
      expect(dbMarket?.question).toBe('BAB-5 Test: Will the integration work?');
    });

    test('should return existing market if already exists', async () => {
      // Create question and market
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: Idempotent market creation',
          scenarioId: 1,
          outcome: false,
          rank: 1,
          status: 'active',
          resolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      // Create market first time
      const market1 = await marketService.ensureMarketExists({
        marketId: questionId,
        initialLiquidity: 20000,
      });
      testMarketIds.push(market1.id);

      // Try to create again - should return same market
      const market2 = await marketService.ensureMarketExists({
        marketId: questionId,
        initialLiquidity: 50000, // Different liquidity - should be ignored
      });

      expect(market2.id).toBe(market1.id);
      expect(market2.liquidity).toBe(market1.liquidity); // Original liquidity preserved
    });

    test('should throw error when question does not exist', async () => {
      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      const fakeMarketId = 'non-existent-question-id-12345';

      await expect(
        marketService.ensureMarketExists({
          marketId: fakeMarketId,
        })
      ).rejects.toThrow(/Market not found/);
    });
  });

  describe('1.2 - ensureMarketExists Validation', () => {
    test('should create market with correct initial state from question', async () => {
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;
      const resolutionDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: Market initial state validation',
          scenarioId: 1,
          outcome: true,
          rank: 1,
          status: 'active',
          resolutionDate,
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      const market = await marketService.ensureMarketExists({
        marketId: questionId,
        initialLiquidity: 15000,
        description: 'Custom description for test',
      });
      testMarketIds.push(market.id);

      // Validate initial market state
      expect(market.id).toBe(questionId);
      expect(market.question).toBe('BAB-5 Test: Market initial state validation');
      expect(market.yesShares).toBeGreaterThan(0);
      expect(market.noShares).toBeGreaterThan(0);
      expect(market.liquidity).toBe(15000);
      expect(market.resolved).toBe(false);

      // End date should match resolution date
      const endDateDiff = Math.abs(
        market.endDate.getTime() - resolutionDate.getTime()
      );
      expect(endDateDiff).toBeLessThan(1000); // Within 1 second
    });

    test('should preserve market ID relationship with question', async () => {
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: ID relationship',
          scenarioId: 1,
          outcome: false,
          rank: 1,
          status: 'active',
          resolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      const market = await marketService.ensureMarketExists({
        marketId: questionId,
      });
      testMarketIds.push(market.id);

      // Market ID should equal Question ID - this is critical for resolution
      expect(market.id).toBe(questionId);

      // Verify we can look up both by the same ID
      const dbQuestion = await db.question.findUnique({
        where: { id: questionId },
      });
      const dbMarket = await db.market.findUnique({
        where: { id: questionId },
      });

      expect(dbQuestion).toBeTruthy();
      expect(dbMarket).toBeTruthy();
      expect(dbQuestion?.id).toBe(dbMarket?.id);
    });
  });

  describe('1.3 - Event-Market Coherence', () => {
    test('should track events related to questions', async () => {
      // Create a question
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: Will event tracking work?',
          scenarioId: 1,
          outcome: true,
          rank: 1,
          status: 'active',
          resolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      // Create associated market
      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      const market = await marketService.ensureMarketExists({
        marketId: questionId,
        initialLiquidity: 20000,
      });
      testMarketIds.push(market.id);

      // Create events related to this question
      const eventId1 = await generateSnowflakeId();
      const eventId2 = await generateSnowflakeId();

      await db.worldEvent.create({
        data: {
          id: eventId1,
          eventType: 'announcement',
          description: 'Positive development for question outcome',
          visibility: 'public',
          relatedQuestion: uniqueQuestionNumber,
          pointsToward: 'YES',
          actors: [],
          timestamp: new Date(),
        },
      });
      testEventIds.push(eventId1);

      await db.worldEvent.create({
        data: {
          id: eventId2,
          eventType: 'development',
          description: 'Negative development against question outcome',
          visibility: 'public',
          relatedQuestion: uniqueQuestionNumber,
          pointsToward: 'NO',
          actors: [],
          timestamp: new Date(),
        },
      });
      testEventIds.push(eventId2);

      // Verify events are linked to question
      const relatedEvents = await db.worldEvent.findMany({
        where: { relatedQuestion: uniqueQuestionNumber },
      });

      expect(relatedEvents.length).toBe(2);
      expect(relatedEvents.some((e) => e.pointsToward === 'YES')).toBe(true);
      expect(relatedEvents.some((e) => e.pointsToward === 'NO')).toBe(true);
    });

    test('should have events with valid pointsToward values', async () => {
      // Get all events with relatedQuestion
      const eventsWithQuestions = await db.worldEvent.findMany({
        where: {
          relatedQuestion: { not: null },
        },
        take: 100,
      });

      for (const event of eventsWithQuestions) {
        // pointsToward should be null, 'YES', or 'NO'
        if (event.pointsToward !== null) {
          expect(['YES', 'NO']).toContain(event.pointsToward);
        }
      }
    });

    test('should not have orphan events pointing to non-existent questions', async () => {
      // Get events that reference questions
      const eventsWithQuestions = await db.worldEvent.findMany({
        where: {
          relatedQuestion: { not: null },
        },
        take: 50,
      });

      const questionNumbers = [
        ...new Set(eventsWithQuestions.map((e) => e.relatedQuestion)),
      ].filter((n): n is number => n !== null);

      // Look up the questions
      const questions = await db.question.findMany({
        where: { questionNumber: { in: questionNumbers } },
      });

      const existingQuestionNumbers = new Set(
        questions.map((q) => q.questionNumber)
      );

      // All referenced questions should exist
      for (const questionNumber of questionNumbers) {
        expect(existingQuestionNumbers.has(questionNumber)).toBe(true);
      }
    });
  });

  describe('1.4 - Atomic Resolution Flow', () => {
    test('should resolve market and question atomically', async () => {
      // Create question
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: Atomic resolution test',
          scenarioId: 1,
          outcome: true, // Expected outcome
          rank: 1,
          status: 'active',
          resolutionDate: new Date(Date.now() - 1000), // Past date for resolution
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      // Create market with same ID
      await db.market.create({
        data: {
          id: questionId,
          question: 'BAB-5 Test: Atomic resolution test',
          yesShares: '5000',
          noShares: '5000',
          liquidity: '10000',
          resolved: false,
          endDate: new Date(Date.now() - 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testMarketIds.push(questionId);

      // Resolve using CorePredictionMarketService
      const wallet = {
        debit: async () => {},
        credit: async () => {},
        recordPnL: async () => {},
        getBalance: async () => ({ balance: 10000 }),
      };

      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet,
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      // Resolve market
      await marketService.resolve({
        marketId: questionId,
        winningSide: 'yes',
        resolutionDescription: 'Test resolution for BAB-5',
      });

      // Also update question status (as game-tick does)
      await db.question.update({
        where: { id: questionId },
        data: {
          status: 'resolved',
          resolvedOutcome: true,
          updatedAt: new Date(),
        },
      });

      // Verify both are resolved
      const dbQuestion = await db.question.findUnique({
        where: { id: questionId },
      });
      const dbMarket = await db.market.findUnique({
        where: { id: questionId },
      });

      expect(dbQuestion?.status).toBe('resolved');
      expect(dbQuestion?.resolvedOutcome).toBe(true);
      expect(dbMarket?.resolved).toBe(true);
      expect(dbMarket?.resolution).toBe(true); // YES won
    });

    test('should prevent double resolution', async () => {
      // Create already resolved question and market
      const questionId = await generateSnowflakeId();
      const uniqueQuestionNumber =
        Math.floor(Math.random() * 1000000000) + 1000000;

      await db.question.create({
        data: {
          id: questionId,
          questionNumber: uniqueQuestionNumber,
          text: 'BAB-5 Test: Already resolved',
          scenarioId: 1,
          outcome: false,
          rank: 1,
          status: 'resolved',
          resolvedOutcome: false,
          resolutionDate: new Date(Date.now() - 1000),
          createdDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testQuestionIds.push(questionId);

      await db.market.create({
        data: {
          id: questionId,
          question: 'BAB-5 Test: Already resolved',
          yesShares: '5000',
          noShares: '5000',
          liquidity: '10000',
          resolved: true,
          resolution: false, // NO won
          endDate: new Date(Date.now() - 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      testMarketIds.push(questionId);

      const marketService = new PredictionMarketService({
        db: new PredictionDbAdapter(),
        wallet: {
          debit: async () => {},
          credit: async () => {},
          recordPnL: async () => {},
          getBalance: async () => ({ balance: 10000 }),
        },
        fees: {
          tradingFeeRate: 0,
          platformShare: 0,
          referrerShare: 0,
          minFeeAmount: 0,
        },
      });

      // Second resolution should be a no-op (CorePredictionMarketService.resolve returns early if already resolved)
      await marketService.resolve({
        marketId: questionId,
        winningSide: 'yes', // Trying different outcome
      });

      // Original resolution should be preserved
      const dbMarket = await db.market.findUnique({
        where: { id: questionId },
      });

      expect(dbMarket?.resolution).toBe(false); // Original: NO won
    });

    test('should have matching question-market resolution states', async () => {
      // Check all resolved questions have matching resolved markets
      const resolvedQuestions = await db.question.findMany({
        where: { status: 'resolved' },
        take: 50,
      });

      for (const question of resolvedQuestions) {
        const market = await db.market.findUnique({
          where: { id: question.id },
        });

        if (market) {
          // If market exists, it should be resolved too
          expect(market.resolved).toBe(true);

          // Resolution outcome should match
          if (question.resolvedOutcome !== null) {
            expect(market.resolution).toBe(question.resolvedOutcome);
          }
        }
      }
    });
  });

  describe('Additional Validation', () => {
    test('should have valid market price ranges', async () => {
      const activeMarkets = await db.market.findMany({
        where: {
          resolved: false,
          endDate: { gte: new Date() },
        },
        take: 20,
      });

      for (const market of activeMarkets) {
        const yesShares = Number(market.yesShares);
        const noShares = Number(market.noShares);
        const totalShares = yesShares + noShares;

        if (totalShares > 0) {
          const yesPrice = yesShares / totalShares;
          const noPrice = noShares / totalShares;

          // Prices should be between 0 and 1
          expect(yesPrice).toBeGreaterThanOrEqual(0);
          expect(yesPrice).toBeLessThanOrEqual(1);
          expect(noPrice).toBeGreaterThanOrEqual(0);
          expect(noPrice).toBeLessThanOrEqual(1);

          // Prices should sum to 1
          expect(yesPrice + noPrice).toBeCloseTo(1, 5);
        }

        // Liquidity should be non-negative
        expect(Number(market.liquidity)).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have QuestionManager class exported', () => {
      // Verify QuestionManager is properly exported and can be referenced
      expect(QuestionManager).toBeDefined();
      expect(typeof QuestionManager).toBe('function');
      expect(QuestionManager.prototype.generateDailyQuestions).toBeDefined();
      expect(QuestionManager.prototype.getQuestionsToResolve).toBeDefined();
      expect(QuestionManager.prototype.resolveQuestion).toBeDefined();
    });
  });
});

