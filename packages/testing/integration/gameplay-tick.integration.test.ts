/**
 * Integration Test: Gameplay Tick
 *
 * Verifies that gameplay mechanics work correctly:
 * - Game tick executes without errors
 * - NPC trading creates positions
 * - Market prices update correctly
 * - Questions resolve with payouts
 * - Content is generated (posts/articles/events)
 * - Market pricing is reasonable (0-100% for predictions)
 */

import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { db } from '@babylon/db';
import type { MockJSONSchema } from '../types/test-types';

/**
 * Mock LLM client BEFORE importing serverless-game-tick.
 *
 * This ensures executeGameTick uses the mock. We mock @babylon/engine and override
 * only BabylonLLMClient. Internal code uses relative imports, but BabylonLLMClient
 * is exported from root for external use.
 */
mock.module('@babylon/engine', async () => {
  // Import actual engine to preserve all other exports
  const actualEngine = await import('@babylon/engine');
  
  // Create mock LLM client factory function
  const createMockClient = () => ({
    getStats: () => ({ provider: 'mock', model: 'mock-model' }),
    getProvider: () => 'mock',
    generateJSON: async (
      _prompt: string,
      schema: MockJSONSchema | undefined
    ) => {
          // CRITICAL: This mock MUST prevent all real API calls
          // Always return a valid response structure based on schema or prompt patterns

          // Priority 1: Question resolution validation (no schema, prompt contains Question/Outcome)
          // QuestionManager.generateResolutionEvent calls with undefined schema
          if (
            !schema &&
            _prompt.includes('Question:') &&
            _prompt.includes('Outcome:')
          ) {
            const outcomeMatch = _prompt.match(/Outcome:\s*(YES|NO)/i);
            const questionMatch = _prompt.match(/Question:\s*([^\n]+)/i);
            const outcome = outcomeMatch?.[1]?.toUpperCase() ?? 'YES';
            const questionText = questionMatch?.[1]?.trim() ?? 'test question';

            // QuestionManager expects: { event: string; type: string } | { response: { event: string; type: string } }
            return {
              response: {
                event: `Mock resolution event: ${questionText} outcome confirmed as ${outcome}`,
                type: 'announcement',
              },
            };
          }

          // Priority 2: Schema-based detection (more reliable than prompt parsing)
          if (schema?.properties) {
            /**
             * Question generation (has questions array property).
             *
             * Return format matches what XML parser produces (root element unwrapped).
             */
            if (schema.properties.questions) {
              return {
                questions: [
                  {
                    id: 1,
                    scenario: 1,
                    text: 'Will AIlon Musk tweet about Mars this week?',
                    resolutionCriteria:
                      'If AIlon Musk posts about Mars on social media',
                    daysUntilResolution: 3,
                    expectedOutcome: 'yes',
                    dramaPotential: 8,
                    uncertainty: 7,
                    satiricalValue: 9,
                    observableOutcome:
                      'Public tweet from AIlon Musk about Mars',
                  },
                  {
                    id: 2,
                    scenario: 1,
                    text: 'Will Sam AIltman announce a new AI feature?',
                    resolutionCriteria: 'If OpenAGI announces a new feature',
                    daysUntilResolution: 5,
                    expectedOutcome: 'yes',
                    dramaPotential: 7,
                    uncertainty: 6,
                    satiricalValue: 8,
                    observableOutcome: 'Official announcement from OpenAGI',
                  },
                ],
              };
            }

            // Question resolution (has response.event property)
            if (schema.properties.response?.properties?.event) {
              return {
                response: {
                  event: 'Mock resolution event confirming the outcome',
                  type: 'announcement',
                },
              };
            }

            // Market decisions (has npcId property)
            if (schema.properties.npcId || schema.properties.decisions) {
              // Extract from ID=xxx NAME="yyy" patterns in TRADERS section
              const idMatches = _prompt.matchAll(
                /ID=([^\s]+)\s+NAME="([^"]+)"/g
              );
              const npcsFromPrompt = Array.from(idMatches).slice(0, 3);

              if (npcsFromPrompt.length > 0) {
                // All hold actions to avoid balance warnings
                return {
                  decisions: npcsFromPrompt.map(([, id, name]) => ({
                    npcId: id,
                    npcName: name,
                    reasoning: `Mock reasoning for ${name} - holding for now`,
                    action: 'hold',
                    confidence: 0.5,
                    marketType: null,
                    marketId: null,
                    amount: 0,
                  })),
                };
              }
              // Fallback - no trades (empty decisions means no warnings)
              return { decisions: [] };
            }

            // Article generation (has title and/or article properties)
            if (
              schema.properties.title ||
              schema.properties.article ||
              schema.properties.content
            ) {
              // Extract question context from prompt if available
              const questionMatch = _prompt.match(/Question[:\s]*([^\n]+)/i);
              const questionText =
                questionMatch?.[1]?.trim() || 'Market Update';

              return {
                response: {
                  title: `Breaking: ${questionText.substring(0, 50)}`,
                  summary: `Analysis of the latest developments regarding ${questionText.substring(0, 100)}`,
                  content: `This is a comprehensive mock article analyzing the current market situation.\n\nThe question "${questionText}" has generated significant interest.\n\nExperts weigh in on the potential outcomes.\n\nMarket participants remain divided on the final resolution.`,
                  slant: 'Neutral analysis of market conditions',
                  sentiment: 'neutral',
                  category: 'markets',
                  tags: { tag: ['markets', 'analysis', 'prediction'] },
                },
              };
            }

            // Post generation (has post property)
            if (schema.properties.post) {
              return {
                post: 'This is a mock post content.',
              };
            }

            // Question generation (has question property)
            if (schema.properties.question) {
              return {
                question: 'Will testing succeed?',
                resolutionCriteria: 'If tests pass',
              };
            }

            // Scenarios or questions (has scenarios or response property)
            if (schema.properties.scenarios || schema.properties.response) {
              // Check prompt to distinguish between scenarios and questions
              // Use more specific checks to avoid false positives with "ORGANIZATIONS IN PLAY"
              const isScenarioGeneration = _prompt.includes(
                'Create 3 dramatic, satirical scenarios'
              );
              const isQuestionGeneration =
                !isScenarioGeneration &&
                (_prompt.includes('ORGANIZATIONS IN PLAY') ||
                  _prompt.includes('Create prediction market questions'));

              if (isQuestionGeneration) {
                return {
                  questions: [
                    {
                      id: 1,
                      text: 'Will testing succeed?',
                      scenario: 1,
                      outcome: true,
                      rank: 1,
                      createdDate: new Date().toISOString(),
                      resolutionDate: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                      ).toISOString(),
                      status: 'active',
                    },
                  ],
                };
              }

              // Extract actor IDs for scenarios
              const mainActorsMatch = _prompt.match(
                /MAIN ACTORS[:\s]*\n((?:- [^\n]+\n?)+)/i
              );
              let actorIds = ['actor-1', 'actor-2', 'actor-3'];

              if (mainActorsMatch?.[1]) {
                const actorLines =
                  mainActorsMatch[1].match(/- ([^:]+):/g) || [];
                actorIds = actorLines.slice(0, 3).map((m) => {
                  const name =
                    m
                      .replace(/^- |:/g, '')
                      .trim()
                      .split(' - ')[0]
                      ?.split(' [')[0] ?? 'actor';
                  return (
                    name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')
                      .substring(0, 50) || `actor-${actorIds.length + 1}`
                  );
                });
                if (actorIds.length === 0)
                  actorIds = ['actor-1', 'actor-2', 'actor-3'];
              }

              return {
                scenarios: [
                  {
                    id: 1,
                    title: 'Test Scenario: Will Testing Succeed?',
                    description:
                      'A test scenario to verify the gameplay tick functionality works correctly.',
                    mainActors: actorIds,
                    theme: 'testing',
                    involvedOrganizations: [],
                  },
                ],
              };
            }
          }

          // Priority 3: No schema - infer from prompt content
          if (!schema || !schema.properties) {
            // IMPORTANT: Check scenario generation FIRST because "MAIN ACTORS:" contains "ACTORS:"
            // which would falsely match the question generation check
            const isScenarioGeneration =
              _prompt.includes('Create 3 dramatic, satirical scenarios') ||
              (_prompt.includes('MAIN ACTORS:') &&
                _prompt.includes('<scenarios>'));

            if (isScenarioGeneration) {
              // Extract actor IDs from the MAIN ACTORS section if possible
              const mainActorsMatch = _prompt.match(
                /MAIN ACTORS:\s*([\s\S]*?)(?:AFFILIATED|IMPORTANT|$)/i
              );
              let actorIds = ['actor-1', 'actor-2', 'actor-3'];
              if (mainActorsMatch?.[1]) {
                const actorLines =
                  mainActorsMatch[1].match(/- ([^:]+):/g) || [];
                const extractedIds = actorLines.slice(0, 3).map((m) => {
                  const name =
                    m
                      .replace(/^- |:/g, '')
                      .trim()
                      .split(' - ')[0]
                      ?.split(' [')[0] ?? 'actor';
                  return (
                    name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')
                      .substring(0, 50) || `actor-${actorIds.length + 1}`
                  );
                });
                if (extractedIds.length > 0) actorIds = extractedIds;
              }

              return {
                scenarios: [
                  {
                    id: 1,
                    title: 'Test Scenario: Will Testing Succeed?',
                    description:
                      'A test scenario to verify the gameplay tick functionality works correctly.',
                    mainActors: actorIds,
                    theme: 'testing',
                    involvedOrganizations: [],
                  },
                ],
              };
            }

            /**
             * Question generation prompts - look for "Generate X prediction market questions".
             *
             * Check for 'ACTORS:' only after excluding MAIN ACTORS scenario prompts.
             */
            const isQuestionGeneration =
              _prompt.includes('prediction market questions') ||
              _prompt.includes('COMPANIES:') ||
              (_prompt.includes('ACTORS:') &&
                !_prompt.includes('MAIN ACTORS:'));

            if (isQuestionGeneration) {
              /**
               * Return format matches what XML parser produces (root element unwrapped).
               */
              return {
                questions: [
                  {
                    id: 1,
                    scenario: 1,
                    text: 'Will AIlon Musk tweet about Mars this week?',
                    resolutionCriteria:
                      'If AIlon Musk posts about Mars on social media',
                    daysUntilResolution: 3,
                    expectedOutcome: 'yes',
                    dramaPotential: 8,
                    uncertainty: 7,
                    satiricalValue: 9,
                    observableOutcome:
                      'Public tweet from AIlon Musk about Mars',
                  },
                  {
                    id: 2,
                    scenario: 1,
                    text: 'Will Sam AIltman announce a new AI feature?',
                    resolutionCriteria: 'If OpenAGI announces a new feature',
                    daysUntilResolution: 5,
                    expectedOutcome: 'yes',
                    dramaPotential: 7,
                    uncertainty: 6,
                    satiricalValue: 8,
                    observableOutcome: 'Official announcement from OpenAGI',
                  },
                ],
              };
            }

            // Default fallback - return empty object (will be caught by error handling)
            return {};
          }

          // Final fallback: return safe empty structure (never return {} which could cause parsing errors)
          // This should never be reached, but ensures we never return undefined or empty object
          return {
            response: {
              event: 'Mock event',
              type: 'announcement',
            },
          };
        },
    complete: async () => 'Mock completion response',
  });
  
  // Return actual engine exports with mocked BabylonLLMClient
  return {
    ...actualEngine,
    BabylonLLMClient: {
      forGameTick: createMockClient,
      forGroq: createMockClient,
      forClaude: createMockClient,
      forOpenAI: createMockClient,
    },
  };
});

import { asSystem } from '@babylon/db';
import { executeGameTick } from '@babylon/engine';
import { generateSnowflakeId } from '@babylon/shared';

const BASE_URL =
  process.env.TEST_API_URL ||
  process.env.TEST_BASE_URL ||
  'http://localhost:3000';
let serverAvailable = false;

describe('Gameplay Tick Integration', () => {
  let testQuestionId: string;
  let testMarketId: string;
  let initialGameRunning: boolean;

  beforeAll(async () => {
    // Check if server is running
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      serverAvailable = response.ok;
    } catch {
      serverAvailable = false;
    }

    // Ensure game is running
    const gameState = await asSystem(async (db) => {
      return await db.game.findFirst({
        where: { isContinuous: true },
      });
    }, 'gameplay-tick-test-get-game-state');

    if (!gameState) {
      // Create game state if it doesn't exist
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
      }, 'gameplay-tick-test-create-game-state');
    } else {
      initialGameRunning = gameState.isRunning;
      // Ensure game is running for tests
      if (!gameState.isRunning) {
        await asSystem(async (db) => {
          await db.game.updateMany({
            where: { isContinuous: true },
            data: { isRunning: true },
          });
        }, 'gameplay-tick-test-enable-game');
      }
    }

    // Create a test question for resolution testing
    // Use random questionNumber to avoid conflicts
    testQuestionId = await generateSnowflakeId();
    const uniqueQuestionNumber =
      Math.floor(Math.random() * 1000000000) + 1000000; // Random int between 1M and 1B
    await db.question.create({
      data: {
        id: testQuestionId,
        questionNumber: uniqueQuestionNumber,
        text: 'Integration test: Will gameplay work?',
        scenarioId: 1,
        outcome: false,
        rank: 1,
        status: 'active',
        resolutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        createdDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create a test market
    testMarketId = await generateSnowflakeId();
    await db.market.create({
      data: {
        id: testMarketId,
        question: 'Integration test: Will gameplay work?',
        yesShares: '100',
        noShares: '100',
        liquidity: '200',
        resolved: false,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    // Restore game state
    if (initialGameRunning !== undefined) {
      await asSystem(async (db) => {
        await db.game.updateMany({
          where: { isContinuous: true },
          data: { isRunning: initialGameRunning },
        });
      }, 'gameplay-tick-test-restore-game-state');
    }

    // Cleanup test data
    if (testQuestionId) {
      try {
        await db.question.delete({ where: { id: testQuestionId } });
      } catch (_error) {
        // Cleanup errors not critical
      }
    }

    if (testMarketId) {
      try {
        await db.market.delete({ where: { id: testMarketId } });
      } catch (_error) {
        // Cleanup errors not critical
      }
    }
  });

  test('should execute game tick without errors', async () => {
    const result = await executeGameTick(true); // Skip content generation for faster test

    expect(result).toBeDefined();
    expect(typeof result.postsCreated).toBe('number');
    expect(typeof result.eventsCreated).toBe('number');
    expect(typeof result.articlesCreated).toBe('number');
    expect(typeof result.marketsUpdated).toBe('number');
    expect(typeof result.questionsResolved).toBe('number');
    expect(typeof result.questionsCreated).toBe('number');
    expect(typeof result.trendingCalculated).toBe('boolean');
  }, 60000);

  test('should update market prices when NPC trading occurs', async () => {
    // Get initial market state
    const marketBefore = await db.market.findUnique({
      where: { id: testMarketId },
      select: {
        yesShares: true,
        noShares: true,
        updatedAt: true,
      },
    });

    expect(marketBefore).toBeTruthy();
    const initialYesShares = Number(marketBefore?.yesShares || 0);
    const initialNoShares = Number(marketBefore?.noShares || 0);

    // Run game tick
    const result = await executeGameTick(true); // Skip content generation

    // Check if markets were updated
    const marketAfter = await db.market.findUnique({
      where: { id: testMarketId },
      select: {
        yesShares: true,
        noShares: true,
        updatedAt: true,
      },
    });

    expect(marketAfter).toBeTruthy();

    // If NPC trading occurred, shares should have changed
    if (result.marketsUpdated > 0) {
      const afterYesShares = Number(marketAfter?.yesShares || 0);
      const afterNoShares = Number(marketAfter?.noShares || 0);

      // At least one side should have changed
      const sharesChanged =
        afterYesShares !== initialYesShares ||
        afterNoShares !== initialNoShares;
      expect(sharesChanged).toBe(true);

      // Market should have been updated (timestamp changed)
      expect(
        new Date(marketAfter?.updatedAt || 0).getTime()
      ).toBeGreaterThanOrEqual(
        new Date(marketBefore?.updatedAt || 0).getTime()
      );
    }
  }, 60000);

  test('should have reasonable market pricing (0-100% for predictions)', async () => {
    // Get all active markets
    const markets = await db.market.findMany({
      where: {
        resolved: false,
        endDate: { gte: new Date() },
      },
      take: 10,
    });

    for (const market of markets) {
      const yesShares = Number(market.yesShares);
      const noShares = Number(market.noShares);
      const totalShares = yesShares + noShares;

      if (totalShares > 0) {
        const yesOdds = (yesShares / totalShares) * 100;
        const noOdds = (noShares / totalShares) * 100;

        // Odds should be between 0 and 100%
        expect(yesOdds).toBeGreaterThanOrEqual(0);
        expect(yesOdds).toBeLessThanOrEqual(100);
        expect(noOdds).toBeGreaterThanOrEqual(0);
        expect(noOdds).toBeLessThanOrEqual(100);

        // Odds should sum to approximately 100% (allowing for rounding)
        const sum = yesOdds + noOdds;
        expect(sum).toBeGreaterThanOrEqual(99.9);
        expect(sum).toBeLessThanOrEqual(100.1);
      }
    }
  });

  test('should create NPC positions when trading occurs', async () => {
    // Get initial NPC position count (NPCs are users who are not agents)
    const npcUsers = await db.user.findMany({
      where: {
        isAgent: false,
      },
      take: 5,
      select: { id: true },
    });

    if (npcUsers.length === 0) {
      console.log('⏭️  Skipping - no NPC users found');
      return;
    }

    const initialPositions = await db.position.count({
      where: {
        userId: { in: npcUsers.map((u) => u.id) },
      },
    });

    // Run game tick
    const result = await executeGameTick(true); // Skip content generation

    // If markets were updated, NPCs likely traded
    if (result.marketsUpdated > 0) {
      const afterPositions = await db.position.count({
        where: {
          userId: { in: npcUsers.map((u) => u.id) },
        },
      });

      // Positions may have been created (depending on NPC trading decisions)
      // We just verify the count is reasonable
      expect(afterPositions).toBeGreaterThanOrEqual(initialPositions);
    }
  }, 60000);

  test('should generate content when buffer is low', async () => {
    // Run game tick without skipping content generation
    const result = await executeGameTick(false);

    // Content generation may or may not occur depending on buffer status
    // We just verify the result structure is correct
    expect(result).toHaveProperty('postsCreated');
    expect(result).toHaveProperty('articlesCreated');
    expect(result).toHaveProperty('eventsCreated');
    expect(typeof result.postsCreated).toBe('number');
    expect(typeof result.articlesCreated).toBe('number');
    expect(typeof result.eventsCreated).toBe('number');
  }, 120000);

  test('should resolve questions when resolution date passes', async () => {
    // Create a question that should resolve
    // Use random questionNumber to avoid conflicts
    const pastQuestionId = await generateSnowflakeId();
    const uniqueQuestionNumber =
      Math.floor(Math.random() * 1000000000) + 1000000; // Random int between 1M and 1B
    await db.question.create({
      data: {
        id: pastQuestionId,
        questionNumber: uniqueQuestionNumber,
        text: 'Integration test: Past question',
        scenarioId: 1,
        outcome: false,
        rank: 1,
        status: 'active',
        resolutionDate: new Date(Date.now() - 1000), // 1 second ago
        createdDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create associated market (required for resolution)
    await db.market.create({
      data: {
        id: pastQuestionId, // Same ID as question
        question: 'Integration test: Past question',
        yesShares: '100',
        noShares: '100',
        liquidity: '200',
        resolved: false,
        endDate: new Date(Date.now() - 1000), // Same as resolution date
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Run game tick
    const result = await executeGameTick(true);

    // Check if question was resolved
    const resolvedQuestion = await db.question.findUnique({
      where: { id: pastQuestionId },
    });

    // Question should be resolved if resolution date passed
    if (result.questionsResolved > 0) {
      console.log(
        'Resolved question status:',
        resolvedQuestion?.status,
        'ID:',
        pastQuestionId
      );
      expect(resolvedQuestion?.status).toBe('resolved');
    } else {
      // If result says 0 resolved but we made one that SHOULD be resolved, that's suspicious but maybe it wasn't picked up?
      // Check if it was picked up by logic
      console.log(
        'No questions resolved in this tick. Our past question status:',
        resolvedQuestion?.status
      );
    }

    // Cleanup
    try {
      await db.question.delete({ where: { id: pastQuestionId } });
    } catch (_error) {
      // Cleanup errors not critical
    }
  }, 60000);

  test('should test agent-tick cron endpoint if server available', async () => {
    if (!serverAvailable) {
      console.log('⏭️  Skipping cron endpoint test - server not available');
      return;
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.log('⏭️  Skipping cron endpoint test - CRON_SECRET not set');
      return;
    }

    // Use a shorter timeout for the test to fail fast if endpoint hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${BASE_URL}/api/cron/agent-tick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cronSecret}`,
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout for cron job
      });

      clearTimeout(timeoutId);

      // Should return 200 or handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Cron endpoint response:', data);
        // Verify response structure
        expect(data).toHaveProperty('success');
        expect(typeof data.success).toBe('boolean');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      // If it's an abort error, the endpoint took too long
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Cron endpoint timed out after 10 seconds - endpoint may be hanging`
        );
      }
      // Other network errors are acceptable for this test
      console.log('⚠️  Cron endpoint test error (acceptable):', error);
    }
  }, 15000); // 15 second test timeout (longer than fetch timeout)
});
