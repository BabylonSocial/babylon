import { z } from 'zod';

export const UserPositionSnapshot = z
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

export const PredictionMarket = z
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

export const PredictionMarketDetail = PredictionMarket.extend({
  liquidity: z.number(),
  tradeCount: z.number(),
}).meta({ id: 'PredictionMarketDetail' });

export const PredictionPricePoint = z
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

export const PerpPricePoint = z
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

export const TradeUser = z
  .object({
    id: z.string(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    isActor: z.boolean(),
  })
  .meta({ id: 'TradeUser' });

export const PredictionTrade = z
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

export const PerpTrade = z
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

export const FundingRate = z
  .object({
    ticker: z.string(),
    rate: z.number(),
    nextFundingTime: z.string().meta({ description: 'ISO 8601 timestamp' }),
    predictedRate: z.number(),
  })
  .meta({ id: 'FundingRate' });

export const PerpMarket = z
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

export const MarketState = z
  .object({
    yesPrice: z.number(),
    noPrice: z.number(),
    yesShares: z.number(),
    noShares: z.number(),
    priceImpact: z.number(),
    liquidity: z.number(),
  })
  .meta({ id: 'PredictionMarketState' });

export const FeeBreakdown = z
  .object({
    amount: z.number(),
    referrerPaid: z.number(),
  })
  .meta({ id: 'FeeBreakdown' });

export const PerpTradeResult = z
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

export const PerpPosition = z
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

export const PredictionPosition = z
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

export const Bias = z
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

export const PredictionBuyBody = z
  .object({
    side: z.enum(['yes', 'no']),
    amount: z.number().positive().meta({ description: 'Purchase amount in ƀ' }),
  })
  .meta({ id: 'PredictionBuyBody' });

export const PredictionSellBody = z
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

export const PerpOpenBody = z
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

export const PerpCloseBody = z
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

export const OnChainBuyBody = z
  .object({
    side: z.enum(['yes', 'no']),
    numShares: z.number().positive(),
    txHash: z.string().startsWith('0x'),
    walletAddress: z.string().startsWith('0x'),
  })
  .meta({ id: 'OnChainBuyBody' });

export const PerpTuningBody = z
  .object({
    ticker: z.string().optional(),
    riskMultiplier: z.number().min(0.5).max(2.0).optional(),
    entryThreshold: z.number().min(0).max(1).optional(),
    exitThreshold: z.number().min(0).max(1).optional(),
    positionSizeMultiplier: z.number().min(0.1).max(3.0).optional(),
    sentimentOverride: z
      .enum(['bullish', 'bearish', 'neutral'])
      .optional()
      .nullable(),
    maxLeverageOverride: z.number().min(1).max(100).optional().nullable(),
  })
  .meta({ id: 'PerpTuningBody' });

const SetBiasBody = z.object({
  action: z.literal('set'),
  entityId: z.string().min(1),
  entityName: z.string().min(1),
  direction: z.enum(['up', 'down']),
  strength: z.number().min(0).max(1).optional(),
  durationHours: z.number().optional(),
  decayRate: z.number().min(0).max(1).optional(),
});

const RemoveBiasBody = z.object({
  action: z.literal('remove'),
  entityId: z.string().min(1),
});

const BulkSetBiasBody = z.object({
  action: z.literal('bulk-set'),
  biases: z
    .array(
      z.object({
        entityId: z.string().min(1),
        entityName: z.string().min(1),
        direction: z.enum(['up', 'down']),
        strength: z.number().min(0).max(1).optional(),
        durationHours: z.number().optional(),
        decayRate: z.number().min(0).max(1).optional(),
      })
    )
    .min(1),
});

export const BiasConfigBody = z
  .discriminatedUnion('action', [SetBiasBody, RemoveBiasBody, BulkSetBiasBody])
  .meta({ id: 'BiasConfigBody' });

export const BiasTuneBody = z
  .object({
    entityId: z.string().min(1, 'entityId is required'),
    strength: z.number().min(0).max(1),
    decayRate: z.number().min(0).max(1).optional(),
  })
  .meta({ id: 'BiasTuneBody' });
