import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

// ---------------------------------------------------------------------------
// Reusable schemas
// ---------------------------------------------------------------------------

const UserPositionSnapshot = z
  .object({
    id: z.string(),
    marketId: z.string(),
    side: z.enum(['YES', 'NO']),
    shares: z.number(),
    avgPrice: z.number(),
    currentPrice: z.number(),
    currentProbability: z.number(),
    currentValue: z.number(),
    costBasis: z.number(),
    unrealizedPnL: z.number(),
    maxPayout: z.number(),
    resolved: z.boolean(),
    resolution: z.boolean().nullable(),
  })
  .meta({ id: 'UserPositionSnapshot' });

const PredictionMarket = z
  .object({
    id: z.string(),
    text: z.string().meta({ description: 'Question text' }),
    question: z
      .string()
      .meta({ description: 'Question text (backward compat)' }),
    status: z.enum(['active', 'resolved', 'cancelled']),
    resolution: z.boolean().nullable(),
    resolved: z.boolean(),
    resolutionDate: z
      .string()
      .nullable()
      .meta({ description: 'ISO 8601 timestamp' }),
    endDate: z.string().nullable().meta({ description: 'ISO 8601 timestamp' }),
    createdDate: z
      .string()
      .nullable()
      .meta({ description: 'ISO 8601 timestamp' }),
    yesShares: z.number(),
    noShares: z.number(),
    yesProbability: z.number(),
    noProbability: z.number(),
    userPosition: UserPositionSnapshot.nullable(),
    userPositions: z.array(UserPositionSnapshot),
    oracleCommitTxHash: z.string().nullable(),
    oracleRevealTxHash: z.string().nullable(),
    resolutionProofUrl: z.string().nullable(),
    resolutionDescription: z.string().nullable(),
  })
  .meta({ id: 'PredictionMarket' });

const PredictionMarketDetail = PredictionMarket.extend({
  liquidity: z.number(),
  tradeCount: z.number(),
}).meta({ id: 'PredictionMarketDetail' });

const PredictionPricePoint = z
  .object({
    id: z.string(),
    yesPrice: z.number(),
    noPrice: z.number(),
    yesShares: z.number(),
    noShares: z.number(),
    liquidity: z.number(),
    eventType: z.enum(['trade', 'resolution']),
    source: z.enum(['user_trade', 'npc_trade', 'system']),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'PredictionPricePoint' });

const PerpPricePoint = z
  .object({
    id: z.string().optional(),
    price: z.number(),
    change: z.number(),
    changePercent: z.number(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    openPrice: z.number(),
    highPrice: z.number(),
    lowPrice: z.number(),
    volume: z.number(),
  })
  .meta({ id: 'PerpPricePoint' });

const TradeUser = z
  .object({
    id: z.string(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    isActor: z.boolean(),
  })
  .meta({ id: 'TradeUser' });

const PredictionTrade = z
  .object({
    id: z.string(),
    type: z.enum(['balance', 'npc']),
    user: TradeUser.nullable(),
    transactionType: z.string().optional(),
    amount: z.number().optional(),
    marketId: z.string().optional(),
    marketType: z.string().optional(),
    ticker: z.string().optional(),
    action: z.string().optional(),
    side: z.string().nullable().optional(),
    price: z.number().optional(),
    sentiment: z.number().nullable().optional(),
    reason: z.string().nullable().optional(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'PredictionTrade' });

const PerpTrade = z
  .object({
    id: z.string(),
    type: z.enum(['perp', 'npc', 'balance']),
    user: TradeUser.nullable(),
    side: z.enum(['long', 'short']).optional(),
    size: z.number().optional(),
    leverage: z.number().optional(),
    entryPrice: z.number().optional(),
    currentPrice: z.number().optional(),
    unrealizedPnL: z.number().optional(),
    liquidationPrice: z.number().optional(),
    timestamp: z
      .string()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    closedAt: z.string().nullable().optional(),
    ticker: z.string().optional(),
    marketType: z.string().optional(),
    action: z.string().optional(),
    amount: z.number().optional(),
    price: z.number().optional(),
    sentiment: z.number().nullable().optional(),
    reason: z.string().nullable().optional(),
    transactionType: z.string().optional(),
    description: z.string().optional(),
    relatedId: z.string().optional(),
  })
  .meta({ id: 'PerpTrade' });

const FundingRate = z
  .object({
    ticker: z.string(),
    rate: z.number(),
    nextFundingTime: z.string().meta({ description: 'ISO 8601 timestamp' }),
    predictedRate: z.number(),
  })
  .meta({ id: 'FundingRate' });

const PerpMarket = z
  .object({
    ticker: z.string(),
    organizationId: z.string(),
    name: z.string().optional(),
    currentPrice: z.number(),
    price24hAgo: z.number().optional(),
    change24h: z.number(),
    changePercent24h: z.number(),
    high24h: z.number(),
    low24h: z.number(),
    volume24h: z.number(),
    openInterest: z.number(),
    fundingRate: FundingRate,
    maxLeverage: z.number(),
    minOrderSize: z.number(),
    markPrice: z.number().optional(),
    indexPrice: z.number().optional(),
  })
  .meta({ id: 'PerpMarket' });

const MarketState = z
  .object({
    yesPrice: z.number(),
    noPrice: z.number(),
    yesShares: z.number(),
    noShares: z.number(),
    priceImpact: z.number(),
    liquidity: z.number(),
  })
  .meta({ id: 'PredictionMarketState' });

const FeeBreakdown = z
  .object({
    amount: z.number(),
    referrerPaid: z.number(),
  })
  .meta({ id: 'FeeBreakdown' });

const PerpTradeResult = z
  .object({
    positionId: z.string(),
    ticker: z.string(),
    side: z.enum(['long', 'short']),
    size: z.number(),
    leverage: z.number(),
    entryPrice: z.number(),
    exitPrice: z.number().optional(),
    liquidationPrice: z.number(),
    marginPaid: z.number().optional(),
    realizedPnL: z.number().optional(),
    feePaid: z.number(),
    balance: z.number().optional(),
    remainingSize: z.number().optional(),
    fullyClosed: z.boolean().optional(),
    isRebalance: z.boolean().optional(),
    rebalanceType: z.enum(['add', 'reduce', 'close', 'flip']).optional(),
    previousSize: z.number().optional(),
    previousEntryPrice: z.number().optional(),
  })
  .meta({ id: 'PerpTradeResult' });

const PerpPosition = z
  .object({
    id: z.string(),
    ticker: z.string(),
    side: z.enum(['long', 'short']),
    entryPrice: z.number(),
    currentPrice: z.number(),
    size: z.number(),
    leverage: z.number(),
    unrealizedPnL: z.number(),
    unrealizedPnLPercent: z.number(),
    liquidationPrice: z.number(),
    fundingPaid: z.number(),
    openedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    isAgentPosition: z.boolean(),
    agentId: z.string().nullable(),
    agentName: z.string().nullable(),
  })
  .meta({ id: 'PerpPosition' });

const PredictionPosition = z
  .object({
    id: z.string(),
    marketId: z.string(),
    question: z.string(),
    side: z.enum(['YES', 'NO']),
    shares: z.number(),
    avgPrice: z.number(),
    currentPrice: z.number(),
    currentProbability: z.number(),
    currentValue: z.number(),
    costBasis: z.number(),
    unrealizedPnL: z.number(),
    resolved: z.boolean(),
    resolution: z.boolean().nullable(),
    status: z.string(),
    isAgentPosition: z.boolean(),
    agentId: z.string().nullable(),
    agentName: z.string().nullable(),
  })
  .meta({ id: 'PredictionPosition' });

const Bias = z
  .object({
    entityId: z.string(),
    entityName: z.string(),
    direction: z.enum(['up', 'down']),
    strength: z.number(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    expiresAt: z
      .string()
      .nullable()
      .meta({ description: 'ISO 8601 timestamp' }),
    decayRate: z.number(),
    adjustment: z.number(),
  })
  .meta({ id: 'Bias' });

// ---------------------------------------------------------------------------
// Request body schemas
// ---------------------------------------------------------------------------

const PredictionBuyBody = z
  .object({
    side: z.enum(['yes', 'no']),
    amount: z.number().positive().meta({ description: 'Purchase amount in ƀ' }),
  })
  .meta({ id: 'PredictionBuyBody' });

const PredictionSellBody = z
  .object({
    shares: z
      .number()
      .positive()
      .meta({ description: 'Number of shares to sell' }),
    positionId: z
      .string()
      .optional()
      .meta({ description: 'Specific position to sell from' }),
  })
  .meta({ id: 'PredictionSellBody' });

const PerpOpenBody = z
  .object({
    ticker: z.string().meta({ description: 'Market ticker symbol' }),
    side: z.enum(['long', 'short']),
    size: z.number().positive().meta({ description: 'Position size' }),
    leverage: z
      .number()
      .int()
      .min(1)
      .max(100)
      .meta({ description: 'Leverage multiplier (1-100)' }),
    maxSlippage: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .meta({ description: 'Max slippage tolerance (0-1)' }),
  })
  .meta({ id: 'PerpOpenBody' });

const PerpCloseBody = z
  .object({
    percentage: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .meta({ description: 'Partial close fraction (0-1)' }),
    slippage: z
      .number()
      .min(0)
      .max(0.1)
      .optional()
      .meta({ description: 'Max slippage tolerance' }),
  })
  .meta({ id: 'PerpCloseBody' });

// ---------------------------------------------------------------------------
// Path definitions
// ---------------------------------------------------------------------------

export const marketPaths: ZodOpenApiPathsObject = {
  // -----------------------------------------------------------------------
  // Prediction markets
  // -----------------------------------------------------------------------
  '/api/markets/predictions': {
    get: {
      operationId: 'listPredictionMarkets',
      tags: ['Markets'],
      summary: 'List prediction markets',
      description:
        'Returns all active prediction markets with current pricing and optional user positions.',
      responses: {
        '200': {
          description: 'List of prediction markets',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                questions: z.array(PredictionMarket),
                count: z.number(),
              }),
            },
          },
        },
      },
    },
  },

  '/api/markets/predictions/{id}': {
    get: {
      operationId: 'getPredictionMarket',
      tags: ['Markets'],
      summary: 'Get prediction market',
      description:
        'Returns a single prediction market with detailed pricing, liquidity, and trade count.',
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Prediction market ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Prediction market detail',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                market: PredictionMarketDetail,
              }),
            },
          },
        },
        '404': { description: 'Market not found' },
      },
    },
  },

  '/api/markets/predictions/{id}/buy': {
    post: {
      operationId: 'buyPredictionShares',
      tags: ['Markets'],
      summary: 'Buy prediction shares',
      description: 'Purchase YES or NO shares in a prediction market.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Prediction market ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': { schema: PredictionBuyBody },
        },
      },
      responses: {
        '200': {
          description: 'Trade executed',
          content: {
            'application/json': {
              schema: z.object({
                position: z.object({
                  id: z.string(),
                  marketId: z.string(),
                  side: z.enum(['yes', 'no']),
                  shares: z.number(),
                  avgPrice: z.number(),
                  totalCost: z.number(),
                }),
                market: MarketState,
                fee: FeeBreakdown,
                newBalance: z.number(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/predictions/{id}/sell': {
    post: {
      operationId: 'sellPredictionShares',
      tags: ['Markets'],
      summary: 'Sell prediction shares',
      description: 'Sell shares from an existing prediction market position.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Prediction market ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': { schema: PredictionSellBody },
        },
      },
      responses: {
        '200': {
          description: 'Shares sold',
          content: {
            'application/json': {
              schema: z.object({
                sharesSold: z.number(),
                grossProceeds: z.number(),
                netProceeds: z.number(),
                pnl: z.number(),
                market: MarketState,
                fee: FeeBreakdown,
                remainingShares: z.number(),
                positionClosed: z.boolean(),
                newBalance: z.number(),
                positionId: z.string(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/predictions/{id}/history': {
    get: {
      operationId: 'getPredictionMarketHistory',
      tags: ['Markets'],
      summary: 'Prediction market price history',
      description:
        'Returns historical price snapshots for a prediction market.',
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Prediction market ID' }),
        }),
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max number of data points' }),
          range: z
            .string()
            .optional()
            .meta({ description: 'Time range (e.g. 1h, 24h, 7d, 30d, all)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Price history',
          content: {
            'application/json': {
              schema: z.object({
                marketId: z.string(),
                history: z.array(PredictionPricePoint),
              }),
            },
          },
        },
        '404': { description: 'Market not found' },
      },
    },
  },

  '/api/markets/predictions/{id}/trades': {
    get: {
      operationId: 'getPredictionMarketTrades',
      tags: ['Markets'],
      summary: 'Prediction market trade history',
      description:
        'Returns recent trades for a prediction market including user and NPC activity.',
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Prediction market ID' }),
        }),
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Number of trades to return (default 20)' }),
          offset: z
            .string()
            .optional()
            .meta({ description: 'Offset for pagination (default 0)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Trade history',
          content: {
            'application/json': {
              schema: z.object({
                trades: z.array(PredictionTrade),
                total: z.number(),
                hasMore: z.boolean(),
                marketId: z.string(),
                question: z.string(),
              }),
            },
          },
        },
        '404': { description: 'Market not found' },
      },
    },
  },

  // -----------------------------------------------------------------------
  // Perpetual markets
  // -----------------------------------------------------------------------
  '/api/markets/perps': {
    get: {
      operationId: 'listPerpMarkets',
      tags: ['Markets'],
      summary: 'List perpetual markets',
      description:
        'Returns all available perpetual markets with pricing, volume, and funding rate data.',
      responses: {
        '200': {
          description: 'List of perpetual markets',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                markets: z.array(PerpMarket),
                count: z.number(),
              }),
            },
          },
        },
      },
    },
  },

  '/api/markets/perps/open': {
    post: {
      operationId: 'openPerpPosition',
      tags: ['Markets'],
      summary: 'Open perpetual position',
      description: 'Open a new leveraged long or short perpetual position.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': { schema: PerpOpenBody },
        },
      },
      responses: {
        '200': {
          description: 'Position opened',
          content: {
            'application/json': {
              schema: z.object({
                position: PerpTradeResult,
                marginPaid: z.number(),
                fee: FeeBreakdown,
                newBalance: z.number(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/perps/position/{id}/close': {
    post: {
      operationId: 'closePerpPosition',
      tags: ['Markets'],
      summary: 'Close perpetual position',
      description: 'Close an open perpetual position entirely or partially.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Position ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': { schema: PerpCloseBody },
        },
      },
      responses: {
        '200': {
          description: 'Position closed',
          content: {
            'application/json': {
              schema: z.object({
                position: PerpTradeResult,
                grossSettlement: z.number().optional(),
                netSettlement: z.number().optional(),
                marginReturned: z.number(),
                pnl: z.number(),
                fee: FeeBreakdown,
                wasLiquidated: z.boolean(),
                newBalance: z.number(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/perps/{ticker}/history': {
    get: {
      operationId: 'getPerpMarketHistory',
      tags: ['Markets'],
      summary: 'Perpetual market price history',
      description: 'Returns OHLCV price history for a perpetual market.',
      requestParams: {
        path: z.object({
          ticker: z.string().meta({ description: 'Market ticker symbol' }),
        }),
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max number of data points' }),
          range: z
            .string()
            .optional()
            .meta({ description: 'Time range (e.g. 1h, 24h, 7d, 30d, all)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Price history',
          content: {
            'application/json': {
              schema: z.object({
                ticker: z.string(),
                organizationId: z.string(),
                history: z.array(PerpPricePoint),
              }),
            },
          },
        },
        '404': { description: 'Market not found' },
      },
    },
  },

  '/api/markets/perps/trades/{ticker}': {
    get: {
      operationId: 'getPerpTradeFeed',
      tags: ['Markets'],
      summary: 'Perpetual market trade feed',
      description:
        'Returns recent trades for a perpetual market including perp, NPC, and balance transactions.',
      requestParams: {
        path: z.object({
          ticker: z.string().meta({ description: 'Market ticker symbol' }),
        }),
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Number of trades to return (default 50)' }),
          offset: z
            .string()
            .optional()
            .meta({ description: 'Offset for pagination (default 0)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Trade feed',
          content: {
            'application/json': {
              schema: z.object({
                trades: z.array(PerpTrade),
                total: z.number(),
                hasMore: z.boolean(),
                ticker: z.string(),
                organization: z.object({
                  name: z.string(),
                  type: z.string(),
                  currentPrice: z.number(),
                }),
              }),
            },
          },
        },
        '404': { description: 'Market not found' },
      },
    },
  },

  // -----------------------------------------------------------------------
  // Positions
  // -----------------------------------------------------------------------
  '/api/markets/positions/{userId}': {
    get: {
      operationId: 'getUserPositions',
      tags: ['Markets'],
      summary: 'Get user positions',
      description:
        'Returns all open perpetual and prediction market positions for a user.',
      requestParams: {
        path: z.object({
          userId: z.string().meta({ description: 'User ID' }),
        }),
        query: z.object({
          type: z.string().optional().meta({
            description:
              'Filter by market type: perp, prediction, or all (default all)',
          }),
          status: z.string().optional().meta({
            description:
              'Filter by status: open, closed, or all (default open)',
          }),
          page: z
            .string()
            .optional()
            .meta({ description: 'Page number (default 1)' }),
          limit: z
            .string()
            .optional()
            .meta({ description: 'Results per page (default 20, max 100)' }),
        }),
      },
      responses: {
        '200': {
          description: 'User positions across all markets',
          content: {
            'application/json': {
              schema: z.object({
                perpetuals: z.object({
                  positions: z.array(PerpPosition),
                  stats: z.object({
                    totalPositions: z.number(),
                    totalPnL: z.number(),
                    totalFunding: z.number(),
                  }),
                }),
                predictions: z.object({
                  positions: z.array(PredictionPosition),
                  stats: z.object({
                    totalPositions: z.number(),
                  }),
                }),
                timestamp: z
                  .string()
                  .meta({ description: 'ISO 8601 timestamp' }),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // Bias (public)
  // -----------------------------------------------------------------------
  '/api/markets/bias/active': {
    get: {
      operationId: 'getActiveMarketBiases',
      tags: ['Markets'],
      summary: 'Active market biases',
      description:
        'Returns currently active market biases that influence NPC trading behavior.',
      responses: {
        '200': {
          description: 'Active biases',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                biases: z.array(Bias),
                count: z.number(),
              }),
            },
          },
        },
      },
    },
  },
};
