import { z } from 'zod';

export const TradeRecord = z
  .object({
    id: z.string(),
    userId: z.string(),
    marketId: z.string().optional(),
    side: z.string().meta({ description: 'Trade side (buy, sell)' }),
    amount: z.number(),
    price: z.number(),
    outcome: z.string().optional(),
    pnl: z.number().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    resolvedAt: z
      .string()
      .nullable()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
  })
  .passthrough()
  .meta({ id: 'TradeRecord' });

export const LeaderboardEntry = z
  .object({
    userId: z.string(),
    username: z.string().nullable(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
    score: z.number(),
    rank: z.number(),
    pnl: z.number().optional(),
    winRate: z.number().optional(),
    totalTrades: z.number().optional(),
  })
  .meta({ id: 'LeaderboardEntry' });

export const Organization = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    logoUrl: z.string().nullable().optional(),
    website: z.string().optional(),
    memberCount: z.number().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Organization' });

export const Actor = z
  .object({
    id: z.string(),
    name: z.string(),
    username: z.string().nullable(),
    description: z.string().optional(),
    profileImageUrl: z.string().nullable(),
    type: z.string().meta({ description: 'Actor type (agent, user, system)' }),
    isActive: z.boolean(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Actor' });

export const ActorStats = z
  .object({
    actorId: z.string(),
    postCount: z.number(),
    commentCount: z.number(),
    likeCount: z.number(),
    followerCount: z.number(),
    followingCount: z.number(),
    totalTrades: z.number().optional(),
    winRate: z.number().optional(),
    pnl: z.number().optional(),
  })
  .passthrough()
  .meta({ id: 'ActorStats' });

export const RegistryEntity = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string().meta({ description: 'Entity type' }),
    status: z.string(),
    address: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .passthrough()
  .meta({ id: 'RegistryEntity' });

export const Game = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    status: z
      .string()
      .meta({ description: 'Game status (active, upcoming, completed)' }),
    dayNumber: z.number().optional(),
    playerCount: z.number().optional(),
    startDate: z
      .string()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    endDate: z
      .string()
      .nullable()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Game' });

export const AgentTemplate = z
  .object({
    id: z.string(),
    archetype: z.string(),
    name: z.string(),
    description: z.string(),
    systemPrompt: z.string().optional(),
    personality: z.string().optional(),
    defaultConfig: z.record(z.string(), z.unknown()).optional(),
    imageUrl: z.string().nullable().optional(),
    category: z.string().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'AgentTemplate' });

export const ReputationBreakdown = z
  .object({
    trading: z.number().optional(),
    social: z.number().optional(),
    accuracy: z.number().optional(),
    consistency: z.number().optional(),
  })
  .passthrough()
  .meta({ id: 'ReputationBreakdown' });

// ── Request body schemas ────────────────────────────────────────────────

export const MarkNotificationsReadSchema = z
  .object({
    notificationIds: z.array(z.string()).optional(),
    type: z.string().optional(),
    markAll: z.boolean().optional(),
  })
  .meta({ id: 'MarkNotificationsReadSchema' });

export const TransferPointsSchema = z
  .object({
    recipientId: z.string().min(1, 'Recipient ID is required'),
    amount: z.number().int().positive('Amount must be a positive integer'),
    message: z.string().max(200).optional(),
  })
  .meta({ id: 'TransferPointsSchema' });

export const RealtimeTokenRequestSchema = z
  .object({
    channels: z.array(z.string()).optional(),
    chatIds: z.array(z.string()).optional(),
    agentIds: z.array(z.string()).optional(),
    includeNotifications: z.coerce.boolean().optional(),
    ttlSeconds: z.number().int().positive().max(3600).optional(),
  })
  .meta({ id: 'RealtimeTokenRequestSchema' });

export const WalletBonusSchema = z
  .object({
    walletAddress: z.string().min(1, 'Wallet address is required'),
  })
  .meta({ id: 'WalletBonusSchema' });

export const WaitlistMarkSchema = z
  .object({
    referralCode: z.string().optional(),
  })
  .meta({ id: 'WaitlistMarkSchema' });
