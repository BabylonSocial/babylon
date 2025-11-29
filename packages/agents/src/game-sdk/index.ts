import {
    GameAgent,
    GameFunction,
    GameWorker,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

import {
    buyPredictionSharesFunction,
    sellPredictionSharesFunction,
    openPerpPositionFunction,
    closePerpPositionFunction,
} from "./actions/trading";

import {
    createPostFunction,
    commentFunction,
    likePostFunction,
} from "./actions/social";

/**
 * Babylon Wrapper for G.A.M.E. SDK Agent
 */
export class BabylonGameAgent {
    private agent: GameAgent;

    constructor(
        apiKey: string,
        name: string,
        goal: string,
        description: string,
        llmConfig?: {
            model?: string;
            apiKey?: string;
            baseUrl?: string;
        }
    ) {
        // Define Workers
        const tradingWorker = new GameWorker({
            id: "trading_worker",
            name: "Trading Worker",
            description: "Handles all trading activities including prediction markets and perpetuals.",
            functions: [
                buyPredictionSharesFunction,
                sellPredictionSharesFunction,
                openPerpPositionFunction,
                closePerpPositionFunction,
            ],
            getEnvironment: async () => {
                return {
                    marketStatus: "active",
                    // TODO: Fetch real market data
                };
            },
        });

        const socialWorker = new GameWorker({
            id: "social_worker",
            name: "Social Worker",
            description: "Handles social interactions like posting, commenting, and liking.",
            functions: [
                createPostFunction,
                commentFunction,
                likePostFunction,
            ],
            getEnvironment: async () => {
                return {
                    trendingTopics: ["crypto", "ai", "babylon"],
                    // TODO: Fetch real social context
                };
            },
        });

        this.agent = new GameAgent(apiKey, {
            name,
            goal,
            description,
            getAgentState: async () => {
                return {
                    status: "active",
                    balance: 1000, // TODO: Fetch real balance
                    inventory: [],
                    // TODO: Hook into Babylon agent state
                };
            },
            workers: [tradingWorker, socialWorker],
            llmModel: llmConfig?.model,
            llmModelApiKey: llmConfig?.apiKey,
            llmModelBaseUrl: llmConfig?.baseUrl,
        });
    }

    public async init() {
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
