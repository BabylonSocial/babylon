import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import type { BabylonRuntime } from "../../plugins/babylon/types";

/**
 * Factory function to create buyPredictionSharesFunction with Babylon runtime
 */
export function createBuyPredictionSharesFunction(
    runtime?: BabylonRuntime
): GameFunction {
    return new GameFunction({
        name: "buy_prediction_shares",
        description: "Buy shares in a prediction market",
        args: [
            { name: "marketId", type: "string", description: "The ID of the prediction market" },
            { name: "side", type: "string", description: "YES or NO" },
            { name: "amount", type: "number", description: "Amount of shares to buy" },
        ] as const,
        executable: async (args, logger) => {
            try {
                logger(`Buying ${args.amount} ${args.side} shares in market ${args.marketId}`);

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                const outcome = args.side.toUpperCase() === "YES" ? "YES" : "NO";
                const result = (await runtime.a2aClient.sendRequest("a2a.buyShares", {
                    marketId: args.marketId,
                    outcome,
                    amount: Number(args.amount),
                })) as { shares?: number; avgPrice?: number; positionId?: string };

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully bought ${result.shares || args.amount} ${args.side} shares in ${args.marketId} at ${result.avgPrice || "N/A"}`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to buy shares: ${e.message || String(e)}`
                );
            }
        },
    });
}

/**
 * Factory function to create sellPredictionSharesFunction with Babylon runtime
 */
export function createSellPredictionSharesFunction(
    runtime?: BabylonRuntime
): GameFunction {
    return new GameFunction({
        name: "sell_prediction_shares",
        description: "Sell shares in a prediction market",
        args: [
            { name: "positionId", type: "string", description: "The ID of the position to sell" },
            { name: "shares", type: "number", description: "Number of shares to sell" },
        ] as const,
        executable: async (args, logger) => {
            try {
                logger(`Selling ${args.shares} shares from position ${args.positionId}`);

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                const result = (await runtime.a2aClient.sendRequest("a2a.sellShares", {
                    positionId: args.positionId,
                    shares: Number(args.shares),
                })) as { proceeds?: number; positionId?: string };

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully sold ${args.shares} shares from ${args.positionId}. Received ${result.proceeds || "N/A"} points`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to sell shares: ${e.message || String(e)}`
                );
            }
        },
    });
}

/**
 * Factory function to create openPerpPositionFunction with Babylon runtime
 */
export function createOpenPerpPositionFunction(
    runtime?: BabylonRuntime
): GameFunction {
    return new GameFunction({
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

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                const side = args.side.toUpperCase() === "LONG" ? "long" : "short";
                const result = (await runtime.a2aClient.sendRequest("a2a.openPosition", {
                    ticker: args.ticker,
                    side,
                    amount: Number(args.amount),
                    leverage: Number(args.leverage),
                })) as { positionId?: string; entryPrice?: number };

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully opened ${args.leverage}x ${args.side} position on ${args.ticker}. Position ID: ${result.positionId || "N/A"}, Entry: ${result.entryPrice || "N/A"}`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to open position: ${e.message || String(e)}`
                );
            }
        },
    });
}

/**
 * Factory function to create closePerpPositionFunction with Babylon runtime
 */
export function createClosePerpPositionFunction(
    runtime?: BabylonRuntime
): GameFunction {
    return new GameFunction({
        name: "close_perp_position",
        description: "Close an open perpetual position",
        args: [
            { name: "positionId", type: "string", description: "The ID of the position to close" },
        ] as const,
        executable: async (args, logger) => {
            try {
                logger(`Closing position ${args.positionId}`);

                if (!runtime?.a2aClient?.isConnected()) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Babylon A2A client not available"
                    );
                }

                const result = (await runtime.a2aClient.sendRequest("a2a.closePosition", {
                    positionId: args.positionId,
                })) as { proceeds?: number; pnl?: number; positionId?: string };

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    `Successfully closed position ${args.positionId}. PnL: ${result.pnl || "N/A"}, Proceeds: ${result.proceeds || "N/A"}`
                );
                // biome-ignore lint/suspicious/noExplicitAny: Error handling wrapper
            } catch (e: any) {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Failed,
                    `Failed to close position: ${e.message || String(e)}`
                );
            }
        },
    });
}

// Export default instances for backward compatibility (without runtime)
export const buyPredictionSharesFunction = createBuyPredictionSharesFunction();
export const sellPredictionSharesFunction = createSellPredictionSharesFunction();
export const openPerpPositionFunction = createOpenPerpPositionFunction();
export const closePerpPositionFunction = createClosePerpPositionFunction();
