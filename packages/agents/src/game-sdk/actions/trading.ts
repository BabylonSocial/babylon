import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";

// Mock interface for Babylon Runtime access - in real implementation this would need proper injection
export interface BabylonContext {
    agentId: string;
    runtime: unknown; // Placeholder for actual Babylon runtime
}

export const buyPredictionSharesFunction = new GameFunction({
    name: "buy_prediction_shares",
    description: "Buy shares in a prediction market",
    args: [
        { name: "marketId", type: "string", description: "The ID of the prediction market" },
        { name: "side", type: "string", description: "YES or NO" },
        { name: "amount", type: "number", description: "Amount of shares to buy" },
    ] as const,
    executable: async (args, logger) => {
        try {
            // TODO: Access Babylon runtime/client here
            logger(`Buying ${args.amount} ${args.side} shares in market ${args.marketId}`);

            // Mock execution for now
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully bought ${args.amount} ${args.side} shares in ${args.marketId}`
            );
            // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to buy shares: ${e.message}`
            );
        }
    },
});

export const sellPredictionSharesFunction = new GameFunction({
    name: "sell_prediction_shares",
    description: "Sell shares in a prediction market",
    args: [
        { name: "positionId", type: "string", description: "The ID of the position to sell" },
        { name: "shares", type: "number", description: "Number of shares to sell" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger(`Selling ${args.shares} shares from position ${args.positionId}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully sold ${args.shares} shares from ${args.positionId}`
            );
            // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to sell shares: ${e.message}`
            );
        }
    },
});

export const openPerpPositionFunction = new GameFunction({
    name: "open_perp_position",
    description: "Open a leveraged position on a perpetual market",
    args: [
        { name: "ticker", type: "string", description: "Asset ticker (e.g. BTC, ETH)" },
        { name: "side", type: "string", description: "LONG or SHORT" },
        { name: "amount", type: "number", description: "Collateral amount" },
        { name: "leverage", type: "number", description: "Leverage multiplier (e.g. 1, 5, 10)" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger(`Opening ${args.leverage}x ${args.side} position on ${args.ticker} with $${args.amount}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully opened ${args.leverage}x ${args.side} position on ${args.ticker}`
            );
            // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to open position: ${e.message}`
            );
        }
    },
});

export const closePerpPositionFunction = new GameFunction({
    name: "close_perp_position",
    description: "Close an open perpetual position",
    args: [
        { name: "positionId", type: "string", description: "The ID of the position to close" },
    ] as const,
    executable: async (args, logger) => {
        try {
            logger(`Closing position ${args.positionId}`);
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                `Successfully closed position ${args.positionId}`
            );
            // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
        } catch (e: any) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Failed to close position: ${e.message}`
            );
        }
    },
});
