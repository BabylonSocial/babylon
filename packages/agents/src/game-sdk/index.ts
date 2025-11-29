import {
    GameAgent,
    GameFunction,
    GameWorker,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import type { BabylonRuntime } from "../plugins/babylon/types";
import { agentRuntimeManager } from "../runtime/AgentRuntimeManager";
import {
    createBuyPredictionSharesFunction,
    createSellPredictionSharesFunction,
    createOpenPerpPositionFunction,
    createClosePerpPositionFunction,
} from "./actions/trading";
import {
    createPostFunctionFactory,
    createCommentFunctionFactory,
    createLikePostFunctionFactory,
} from "./actions/social";

/**
 * Babylon Wrapper for G.A.M.E. SDK Agent
 */
export class BabylonGameAgent {
    private agent: GameAgent;
    private runtime?: BabylonRuntime;
    private agentUserId?: string;

    constructor(
        apiKey: string,
        name: string,
        goal: string,
        description: string,
        options?: {
            runtime?: BabylonRuntime;
            agentUserId?: string;
            llmConfig?: {
                model?: string;
                apiKey?: string;
                baseUrl?: string;
            };
        }
    ) {
        this.runtime = options?.runtime;
        this.agentUserId = options?.agentUserId;

        // Create functions with runtime if available
        const tradingFunctions = [
            createBuyPredictionSharesFunction(this.runtime),
            createSellPredictionSharesFunction(this.runtime),
            createOpenPerpPositionFunction(this.runtime),
            createClosePerpPositionFunction(this.runtime),
        ];

        const socialFunctions = [
            createPostFunctionFactory(this.runtime),
            createCommentFunctionFactory(this.runtime),
            createLikePostFunctionFactory(this.runtime),
        ];

        // Define Workers
        const tradingWorker = new GameWorker({
            id: "trading_worker",
            name: "Trading Worker",
            description: "Handles all trading activities including prediction markets and perpetuals.",
            functions: tradingFunctions,
            getEnvironment: async () => {
                if (!this.runtime?.a2aClient?.isConnected()) {
                    return {
                        marketStatus: "unavailable",
                        message: "Babylon A2A client not connected",
                    };
                }

                try {
                    const [predictions, perpetuals] = await Promise.all([
                        this.runtime.a2aClient.sendRequest("a2a.getPredictions", {
                            status: "active",
                        }) as Promise<unknown[]>,
                        this.runtime.a2aClient.sendRequest("a2a.getPerpetuals", {}) as Promise<unknown[]>,
                    ]);

                    return {
                        marketStatus: "active",
                        predictionMarkets: Array.isArray(predictions) ? predictions.length : 0,
                        perpetualMarkets: Array.isArray(perpetuals) ? perpetuals.length : 0,
                        availableMarkets: (Array.isArray(predictions) ? predictions.length : 0) + (Array.isArray(perpetuals) ? perpetuals.length : 0),
                    };
                } catch (error) {
                    return {
                        marketStatus: "error",
                        message: error instanceof Error ? error.message : String(error),
                    };
                }
            },
        });

        const socialWorker = new GameWorker({
            id: "social_worker",
            name: "Social Worker",
            description: "Handles social interactions like posting, commenting, and liking.",
            functions: socialFunctions,
            getEnvironment: async () => {
                if (!this.runtime?.a2aClient?.isConnected()) {
                    return {
                        trendingTopics: [],
                        message: "Babylon A2A client not connected",
                    };
                }

                try {
                    const feed = (await this.runtime.a2aClient.sendRequest("a2a.getFeed", {
                        limit: 10,
                    })) as { posts?: Array<{ tags?: string[] }> };

                    const topics = new Set<string>();
                    if (Array.isArray(feed.posts)) {
                        for (const post of feed.posts) {
                            if (Array.isArray(post.tags)) {
                                for (const tag of post.tags) {
                                    if (typeof tag === "string") {
                                        topics.add(tag);
                                    }
                                }
                            }
                        }
                    }

                    return {
                        trendingTopics: Array.from(topics).slice(0, 10),
                        feedAvailable: true,
                    };
                } catch (error) {
                    // Fallback to default topics if feed fetch fails
                    return {
                        trendingTopics: ["crypto", "ai", "babylon"],
                        message: error instanceof Error ? error.message : String(error),
                    };
                }
            },
        });

        this.agent = new GameAgent(apiKey, {
            name,
            goal,
            description,
            getAgentState: async () => {
                if (!this.runtime?.a2aClient?.isConnected()) {
                    return {
                        status: "inactive",
                        balance: 0,
                        inventory: [],
                        message: "Babylon A2A client not connected",
                    };
                }

                try {
                    const [balanceResult, positionsResult] = await Promise.all([
                        this.runtime.a2aClient.sendRequest("a2a.getBalance", {}) as Promise<{ balance?: number }>,
                        this.runtime.a2aClient.sendRequest("a2a.getPositions", {}) as Promise<unknown[]>,
                    ]);

                    const balance = typeof balanceResult.balance === "number" ? balanceResult.balance : 0;
                    const positions = Array.isArray(positionsResult) ? positionsResult : [];

                    return {
                        status: "active",
                        balance,
                        inventory: positions,
                        positionsCount: positions.length,
                    };
                } catch (error) {
                    return {
                        status: "error",
                        balance: 0,
                        inventory: [],
                        message: error instanceof Error ? error.message : String(error),
                    };
                }
            },
            workers: [tradingWorker, socialWorker],
            llmModel: options?.llmConfig?.model,
            llmModelApiKey: options?.llmConfig?.apiKey,
            llmModelBaseUrl: options?.llmConfig?.baseUrl,
        });
    }

    public async init() {
        // If agentUserId provided but no runtime, try to fetch it for state/environment
        // Note: Functions won't have access to this runtime since they're created at construction
        // For full integration, pass runtime directly to constructor
        if (this.agentUserId && !this.runtime) {
            try {
                const fetchedRuntime = await agentRuntimeManager.getRuntime(this.agentUserId);
                // Type assertion: runtime from manager should have Babylon plugin attached
                this.runtime = fetchedRuntime as BabylonRuntime;
            } catch (error) {
                // Log but don't fail - agent can work without runtime (mock mode)
                console.warn(
                    `Failed to fetch runtime for agent ${this.agentUserId}:`,
                    error instanceof Error ? error.message : String(error)
                );
            }
        }

        await this.agent.init();
    }

    public async run(interval: number = 60) {
        await this.agent.run(interval);
    }

    public async step() {
        await this.agent.step();
    }

    public get name(): string {
        return this.agent.name;
    }
}

export {
    GameAgent,
    GameFunction,
    GameWorker,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
};
