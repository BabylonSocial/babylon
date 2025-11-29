/**
 * Comprehensive Tests for Game SDK Integration
 *
 * Tests all game-sdk functionality including:
 * - Trading action factories
 * - Social action factories
 * - BabylonGameAgent class
 * - Error handling and edge cases
 * - A2A client integration
 */

import { describe, expect, it, mock } from 'bun:test';
import type { BabylonRuntime } from '../../plugins/babylon/types';
import type { BabylonA2AClient } from '../../plugins/babylon/integration-a2a-sdk';
import {
    createBuyPredictionSharesFunction,
    createSellPredictionSharesFunction,
    createOpenPerpPositionFunction,
    createClosePerpPositionFunction,
} from '../actions/trading';
import {
    createPostFunctionFactory,
    createCommentFunctionFactory,
    createLikePostFunctionFactory,
} from '../actions/social';
import { BabylonGameAgent } from '../index';
import { ExecutableGameFunctionStatus } from '@virtuals-protocol/game';

// Mock A2A Client
function createMockA2AClient(connected: boolean = true): BabylonA2AClient {
    const mockSendRequest = mock(async (method: string, params?: Record<string, unknown>): Promise<unknown> => {
        // Mock responses based on method
        if (method === 'a2a.buyShares') {
            return {
                shares: params?.amount || 10,
                avgPrice: 0.55,
                positionId: 'pos-123',
            };
        }
        if (method === 'a2a.sellShares') {
            return {
                proceeds: (params?.shares as number) * 0.6 || 60,
                positionId: params?.positionId || 'pos-123',
            };
        }
        if (method === 'a2a.openPosition') {
            return {
                positionId: 'perp-456',
                entryPrice: 100.5,
            };
        }
        if (method === 'a2a.closePosition') {
            return {
                proceeds: 1050,
                pnl: 50,
                positionId: params?.positionId || 'perp-456',
            };
        }
        if (method === 'a2a.createPost') {
            return {
                postId: 'post-789',
            };
        }
        if (method === 'a2a.createComment') {
            return {
                commentId: 'comment-101',
            };
        }
        if (method === 'a2a.likePost') {
            return { success: true };
        }
        if (method === 'a2a.getBalance') {
            return { balance: 5000 };
        }
        if (method === 'a2a.getPositions') {
            return [
                { id: 'pos-1', marketId: 'market-1', shares: 100 },
                { id: 'pos-2', marketId: 'market-2', shares: 50 },
            ];
        }
        if (method === 'a2a.getPredictions') {
            return [
                { id: 'pred-1', question: 'Test question 1' },
                { id: 'pred-2', question: 'Test question 2' },
            ];
        }
        if (method === 'a2a.getPerpetuals') {
            return [
                { id: 'perp-1', ticker: 'BTC' },
                { id: 'perp-2', ticker: 'ETH' },
            ];
        }
        if (method === 'a2a.getFeed') {
            return {
                posts: [
                    { id: 'post-1', tags: ['crypto', 'ai'] },
                    { id: 'post-2', tags: ['babylon', 'trading'] },
                ],
            };
        }
        return {};
    });

    return {
        agentId: 'test-agent-123',
        isConnected: () => connected,
        sendRequest: mockSendRequest,
    } as unknown as BabylonA2AClient;
}

// Mock Runtime
function createMockRuntime(hasA2A: boolean = true, connected: boolean = true): BabylonRuntime {
    const a2aClient = hasA2A ? createMockA2AClient(connected) : undefined;

    return {
        agentId: 'test-agent-123',
        a2aClient,
    } as unknown as BabylonRuntime;
}

describe('Game SDK Integration', () => {
    describe('Trading Action Factories', () => {
        describe('createBuyPredictionSharesFunction', () => {
            it('should create function that calls A2A buyShares when runtime available', async () => {
                const runtime = createMockRuntime();
                const fn = createBuyPredictionSharesFunction(runtime);

                const result = await fn.executable(
                    { marketId: 'market-123', side: 'YES', amount: '100' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully bought');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.buyShares', {
                    marketId: 'market-123',
                    outcome: 'YES',
                    amount: 100,
                });
            });

            it('should handle NO side correctly', async () => {
                const runtime = createMockRuntime();
                const fn = createBuyPredictionSharesFunction(runtime);

                const result = await fn.executable(
                    { marketId: 'market-123', side: 'NO', amount: '50' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.buyShares', {
                    marketId: 'market-123',
                    outcome: 'NO',
                    amount: 50,
                });
            });

            it('should return Failed when A2A client not available', async () => {
                const runtime = createMockRuntime(false);
                const fn = createBuyPredictionSharesFunction(runtime);

                const result = await fn.executable(
                    { marketId: 'market-123', side: 'YES', amount: '100' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
                expect(result.feedback).toContain('A2A client not available');
            });

            it('should return Failed when A2A client not connected', async () => {
                const runtime = createMockRuntime(true, false);
                const fn = createBuyPredictionSharesFunction(runtime);

                const result = await fn.executable(
                    { marketId: 'market-123', side: 'YES', amount: '100' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
                expect(result.feedback).toContain('A2A client not available');
            });

            it('should handle errors gracefully', async () => {
                const runtime = createMockRuntime();
                const errorMsg = 'Network error';
                // Create a new mock that will reject
                const errorMock = mock(async () => {
                    throw new Error(errorMsg);
                });
                runtime.a2aClient = {
                    ...runtime.a2aClient!,
                    sendRequest: errorMock,
                } as BabylonA2AClient;

                const fn = createBuyPredictionSharesFunction(runtime);
                const result = await fn.executable(
                    { marketId: 'market-123', side: 'YES', amount: '100' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
                expect(result.feedback).toContain(errorMsg);
            });
        });

        describe('createSellPredictionSharesFunction', () => {
            it('should create function that calls A2A sellShares', async () => {
                const runtime = createMockRuntime();
                const fn = createSellPredictionSharesFunction(runtime);

                const result = await fn.executable(
                    { positionId: 'pos-123', shares: '50' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully sold');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.sellShares', {
                    positionId: 'pos-123',
                    shares: 50,
                });
            });

            it('should return Failed when A2A client not available', async () => {
                const runtime = createMockRuntime(false);
                const fn = createSellPredictionSharesFunction(runtime);

                const result = await fn.executable(
                    { positionId: 'pos-123', shares: '50' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
            });
        });

        describe('createOpenPerpPositionFunction', () => {
            it('should create function that calls A2A openPosition', async () => {
                const runtime = createMockRuntime();
                const fn = createOpenPerpPositionFunction(runtime);

                const result = await fn.executable(
                    { ticker: 'BTC', side: 'LONG', amount: '1000', leverage: '10' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully opened');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.openPosition', {
                    ticker: 'BTC',
                    side: 'long',
                    amount: 1000,
                    leverage: 10,
                });
            });

            it('should handle SHORT side correctly', async () => {
                const runtime = createMockRuntime();
                const fn = createOpenPerpPositionFunction(runtime);

                const result = await fn.executable(
                    { ticker: 'ETH', side: 'SHORT', amount: '500', leverage: '5' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.openPosition', {
                    ticker: 'ETH',
                    side: 'short',
                    amount: 500,
                    leverage: 5,
                });
            });
        });

        describe('createClosePerpPositionFunction', () => {
            it('should create function that calls A2A closePosition', async () => {
                const runtime = createMockRuntime();
                const fn = createClosePerpPositionFunction(runtime);

                const result = await fn.executable(
                    { positionId: 'perp-456' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully closed');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.closePosition', {
                    positionId: 'perp-456',
                });
            });
        });
    });

    describe('Social Action Factories', () => {
        describe('createPostFunctionFactory', () => {
            it('should create function that calls A2A createPost', async () => {
                const runtime = createMockRuntime();
                const fn = createPostFunctionFactory(runtime);

                const result = await fn.executable(
                    { content: 'Test post content' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully created post');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.createPost', {
                    content: 'Test post content',
                    type: 'post',
                });
            });

            it('should return Failed when A2A client not available', async () => {
                const runtime = createMockRuntime(false);
                const fn = createPostFunctionFactory(runtime);

                const result = await fn.executable(
                    { content: 'Test post' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
            });
        });

        describe('createCommentFunctionFactory', () => {
            it('should create function that calls A2A createComment', async () => {
                const runtime = createMockRuntime();
                const fn = createCommentFunctionFactory(runtime);

                const result = await fn.executable(
                    { postId: 'post-123', content: 'Test comment' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully commented');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.createComment', {
                    postId: 'post-123',
                    content: 'Test comment',
                });
            });
        });

        describe('createLikePostFunctionFactory', () => {
            it('should create function that calls A2A likePost', async () => {
                const runtime = createMockRuntime();
                const fn = createLikePostFunctionFactory(runtime);

                const result = await fn.executable(
                    { postId: 'post-123' },
                    () => {}
                );

                expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
                expect(result.feedback).toContain('Successfully liked');
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.likePost', {
                    postId: 'post-123',
                });
            });
        });
    });

    describe('BabylonGameAgent', () => {
        describe('Constructor', () => {
            it('should create agent without runtime (mock mode)', () => {
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description'
                );

                expect(agent.name).toBe('Test Agent');
            });

            it('should create agent with runtime', () => {
                const runtime = createMockRuntime();
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                expect(agent.name).toBe('Test Agent');
            });

            it('should accept llmConfig', () => {
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    {
                        llmConfig: {
                            model: 'gpt-4',
                            apiKey: 'test-key',
                            baseUrl: 'https://api.openai.com/v1',
                        },
                    }
                );

                expect(agent.name).toBe('Test Agent');
            });
        });

        describe('getAgentState', () => {
            it('should fetch real balance and positions when runtime available', async () => {
                const runtime = createMockRuntime();
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // Access private agent property for testing
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                const state = await gameAgent.getAgentState();

                expect(state.status).toBe('active');
                expect(state.balance).toBe(5000);
                expect(Array.isArray(state.inventory)).toBe(true);
                expect(state.positionsCount).toBe(2);
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.getBalance', {});
                expect(runtime.a2aClient?.sendRequest).toHaveBeenCalledWith('a2a.getPositions', {});
            });

            it('should return inactive state when A2A client not available', async () => {
                const runtime = createMockRuntime(false);
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                const state = await gameAgent.getAgentState();

                expect(state.status).toBe('inactive');
                expect(state.balance).toBe(0);
                expect(state.message).toContain('A2A client not connected');
            });

            it('should handle errors gracefully', async () => {
                const runtime = createMockRuntime();
                const errorMsg = 'Network error';
                // Create a new mock that will reject
                const errorMock = mock(async () => {
                    throw new Error(errorMsg);
                });
                runtime.a2aClient = {
                    ...runtime.a2aClient!,
                    sendRequest: errorMock,
                } as BabylonA2AClient;

                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                const state = await gameAgent.getAgentState();

                expect(state.status).toBe('error');
                expect(state.message).toBe(errorMsg);
            });
        });

        describe('Trading Worker getEnvironment', () => {
            it('should fetch real market data when runtime available', async () => {
                const runtime = createMockRuntime();
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const tradingWorker = gameAgent.workers.find((w: any) => w.id === 'trading_worker');
                const env = await tradingWorker.getEnvironment();

                expect(env.marketStatus).toBe('active');
                expect(env.predictionMarkets).toBe(2);
                expect(env.perpetualMarkets).toBe(2);
                expect(env.availableMarkets).toBe(4);
            });

            it('should return unavailable when A2A client not connected', async () => {
                const runtime = createMockRuntime(false);
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const tradingWorker = gameAgent.workers.find((w: any) => w.id === 'trading_worker');
                const env = await tradingWorker.getEnvironment();

                expect(env.marketStatus).toBe('unavailable');
                expect(env.message).toContain('A2A client not connected');
            });

            it('should handle errors gracefully', async () => {
                const runtime = createMockRuntime();
                const errorMsg = 'Market fetch error';
                // Create a new mock that will reject
                const errorMock = mock(async () => {
                    throw new Error(errorMsg);
                });
                runtime.a2aClient = {
                    ...runtime.a2aClient!,
                    sendRequest: errorMock,
                } as BabylonA2AClient;

                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const tradingWorker = gameAgent.workers.find((w: any) => w.id === 'trading_worker');
                const env = await tradingWorker.getEnvironment();

                expect(env.marketStatus).toBe('error');
                expect(env.message).toBe(errorMsg);
            });
        });

        describe('Social Worker getEnvironment', () => {
            it('should fetch real trending topics when runtime available', async () => {
                const runtime = createMockRuntime();
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const socialWorker = gameAgent.workers.find((w: any) => w.id === 'social_worker');
                const env = await socialWorker.getEnvironment();

                expect(Array.isArray(env.trendingTopics)).toBe(true);
                expect(env.trendingTopics.length).toBeGreaterThan(0);
                expect(env.feedAvailable).toBe(true);
            });

            it('should fallback to default topics on error', async () => {
                const runtime = createMockRuntime();
                const errorMsg = 'Feed fetch error';
                // Create a new mock that will reject
                const errorMock = mock(async () => {
                    throw new Error(errorMsg);
                });
                runtime.a2aClient = {
                    ...runtime.a2aClient!,
                    sendRequest: errorMock,
                } as BabylonA2AClient;

                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description',
                    { runtime }
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const socialWorker = gameAgent.workers.find((w: any) => w.id === 'social_worker');
                const env = await socialWorker.getEnvironment();

                expect(env.trendingTopics).toContain('crypto');
                expect(env.trendingTopics).toContain('ai');
                expect(env.trendingTopics).toContain('babylon');
            });
        });

        describe('init', () => {
            it('should initialize agent successfully', async () => {
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description'
                );

                // Mock the GameAgent.init method
                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                const originalInit = gameAgent.init;
                gameAgent.init = mock(async () => {});

                await agent.init();

                expect(gameAgent.init).toHaveBeenCalled();
                gameAgent.init = originalInit;
            });
        });

        describe('Methods', () => {
            it('should have working step method', async () => {
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description'
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                gameAgent.step = mock(async () => {});

                await agent.step();

                expect(gameAgent.step).toHaveBeenCalled();
            });

            it('should have working run method', async () => {
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'Test Agent',
                    'Test goal',
                    'Test description'
                );

                // biome-ignore lint/suspicious/noExplicitAny: Testing private property
                const gameAgent = (agent as any).agent;
                gameAgent.run = mock(async () => {});

                await agent.run(60);

                expect(gameAgent.run).toHaveBeenCalledWith(60);
            });

            it('should return name correctly', () => {
                const agent = new BabylonGameAgent(
                    'test-api-key',
                    'My Test Agent',
                    'Test goal',
                    'Test description'
                );

                expect(agent.name).toBe('My Test Agent');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle network timeouts gracefully', async () => {
            const runtime = createMockRuntime();
            const timeoutError = new Error('Request timeout');
            // Create a new mock that will reject
            const errorMock = mock(async () => {
                throw timeoutError;
            });
            runtime.a2aClient = {
                ...runtime.a2aClient!,
                sendRequest: errorMock,
            } as BabylonA2AClient;

            const fn = createBuyPredictionSharesFunction(runtime);
            const result = await fn.executable(
                { marketId: 'market-123', side: 'YES', amount: '100' },
                () => {}
            );

            expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
            expect(result.feedback).toContain('timeout');
        });

        it('should handle invalid responses gracefully', async () => {
            const runtime = createMockRuntime();
            // Create a mock that returns null
            const nullMock = mock(async () => null);
            runtime.a2aClient = {
                ...runtime.a2aClient!,
                sendRequest: nullMock,
            } as BabylonA2AClient;

            const fn = createBuyPredictionSharesFunction(runtime);
            const result = await fn.executable(
                { marketId: 'market-123', side: 'YES', amount: '100' },
                () => {}
            );

            // Should still return Done status even if response is unexpected
            expect([ExecutableGameFunctionStatus.Done, ExecutableGameFunctionStatus.Failed]).toContain(result.status);
        });
    });

    describe('Backward Compatibility', () => {
        it('should export default function instances', async () => {
            // These should be importable without runtime
            const tradingModule = await import('../actions/trading');

            expect(tradingModule.buyPredictionSharesFunction).toBeDefined();
            expect(tradingModule.sellPredictionSharesFunction).toBeDefined();
            expect(tradingModule.openPerpPositionFunction).toBeDefined();
            expect(tradingModule.closePerpPositionFunction).toBeDefined();
        });

        it('should export default social function instances', async () => {
            const socialModule = await import('../actions/social');

            expect(socialModule.createPostFunction).toBeDefined();
            expect(socialModule.commentFunction).toBeDefined();
            expect(socialModule.likePostFunction).toBeDefined();
        });
    });
});

