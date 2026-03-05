import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  PredictionMarket,
  PredictionMarketDetail,
  PredictionPricePoint,
  PerpPricePoint,
  PredictionTrade,
  PerpTrade,
  PerpMarket,
  MarketState,
  FeeBreakdown,
  PerpTradeResult,
  PerpPosition,
  PredictionPosition,
  Bias,
  PredictionBuyBody,
  PredictionSellBody,
  PerpOpenBody,
  PerpCloseBody,
  OnChainBuyBody,
  PerpTuningBody,
  BiasConfigBody,
  BiasTuneBody,
} from '../../schemas/markets';

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
  '/api/markets/predictions/{id}/buy-onchain': {
    post: {
      operationId: 'buyPredictionSharesOnChain',
      tags: ['Markets'],
      summary: 'Buy prediction shares on-chain (legacy)',
      description:
        'Verify and record an on-chain share purchase for a prediction market.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Prediction market ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': { schema: OnChainBuyBody },
        },
      },
      responses: {
        '200': {
          description: 'On-chain buy verified',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                verified: z.literal(true),
                position: z.object({
                  marketId: z.string(),
                  side: z.string(),
                  shares: z.number(),
                  txHash: z.string(),
                  blockNumber: z.string(),
                  explorerUrl: z.string(),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/perps/tune': {
    get: {
      operationId: 'getPerpTuning',
      tags: ['Markets'],
      summary: 'Get perp tuning parameters',
      description:
        'Returns AI agent prompt tuning parameters for perpetual futures trading.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          ticker: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Tuning parameters',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                parameters: z.unknown(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'updatePerpTuning',
      tags: ['Markets'],
      summary: 'Update perp tuning parameters',
      description:
        'Update AI agent prompt tuning parameters for perpetual futures trading.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': { schema: PerpTuningBody },
        },
      },
      responses: {
        '201': {
          description: 'Tuning parameters updated',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                parameters: z.unknown(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/bias/configure': {
    post: {
      operationId: 'configureMarketBias',
      tags: ['Markets'],
      summary: 'Configure market biases',
      description:
        'Set, remove, or bulk-set market biases for entities.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': { schema: BiasConfigBody },
        },
      },
      responses: {
        '201': {
          description: 'Bias configured',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/markets/bias/tune': {
    post: {
      operationId: 'tuneMarketBias',
      tags: ['Markets'],
      summary: 'Tune market bias strength',
      description:
        'Adjust strength of an existing market bias. Setting strength to 0 deactivates it.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': { schema: BiasTuneBody },
        },
      },
      responses: {
        '200': {
          description: 'Bias tuned',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                bias: z.object({
                  entityId: z.string(),
                  strength: z.number(),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

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
