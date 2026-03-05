import { z } from 'zod';

export const AgentToGameFeedbackSchema = z
  .object({
    agentId: z.string().min(1, 'agentId is required'),
    gameId: z.string().min(1, 'gameId is required'),
    score: z.number().min(0).max(100),
    comment: z.string().max(5000).optional(),
    tags: z.array(z.string().min(1)).max(10).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .meta({ id: 'AgentToGameFeedbackSchema' });

export const AgentToUserFeedbackSchema = z
  .object({
    agentId: z.string().min(1, 'agentId is required'),
    toUserId: z.string().min(1, 'toUserId is required'),
    score: z.number().min(0).max(100),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(5000).optional(),
    category: z.string().min(1).optional(),
    interactionType: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .meta({ id: 'AgentToUserFeedbackSchema' });

export const GameMetricsSchema = z
  .object({
    won: z.boolean(),
    pnl: z.number(),
    positionsClosed: z.number(),
    finalBalance: z.number(),
    startingBalance: z.number(),
    decisionsCorrect: z.number(),
    decisionsTotal: z.number(),
    timeToComplete: z.number().optional(),
    riskManagement: z.number().optional(),
  })
  .meta({ id: 'GameMetricsSchema' });

export const TradeMetricsSchema = z
  .object({
    profitable: z.boolean(),
    roi: z.number(),
    holdingPeriod: z.number(),
    timingScore: z.number(),
    riskScore: z.number(),
  })
  .meta({ id: 'TradeMetricsSchema' });

export const GameFeedbackRequestSchema = z
  .object({
    type: z.literal('game'),
    agentId: z.string().min(1),
    gameId: z.string().min(1),
    metrics: GameMetricsSchema,
  })
  .meta({ id: 'GameFeedbackRequestSchema' });

export const TradeFeedbackRequestSchema = z
  .object({
    type: z.literal('trade'),
    agentId: z.string().min(1),
    tradeId: z.string().min(1),
    metrics: TradeMetricsSchema,
  })
  .meta({ id: 'TradeFeedbackRequestSchema' });

export const AutoGenerateFeedbackRequestSchema = z
  .discriminatedUnion('type', [
    GameFeedbackRequestSchema,
    TradeFeedbackRequestSchema,
  ])
  .meta({ id: 'AutoGenerateFeedbackRequestSchema' });

export const GameToAgentFeedbackSchema = z
  .object({
    agentId: z.string().min(1, 'agentId is required'),
    gameId: z.string().min(1, 'gameId is required'),
    score: z.number().min(0).max(100),
    won: z.boolean(),
    comment: z.string().max(5000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .meta({ id: 'GameToAgentFeedbackSchema' });

export const UserToAgentFeedbackSchema = z
  .object({
    agentId: z.string().min(1, 'agentId is required'),
    score: z.number().min(0).max(100),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(5000).optional(),
    category: z.string().min(1).optional(),
    interactionType: z.string().min(1).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .meta({ id: 'UserToAgentFeedbackSchema' });
