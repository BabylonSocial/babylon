import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const agentPerformanceMetrics = pgTable(
  'AgentPerformanceMetrics',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().unique(),
    gamesPlayed: integer('gamesPlayed').notNull().default(0),
    gamesWon: integer('gamesWon').notNull().default(0),
    averageGameScore: doublePrecision('averageGameScore').notNull().default(0),
    lastGameScore: doublePrecision('lastGameScore'),
    lastGamePlayedAt: timestamp('lastGamePlayedAt', { mode: 'date' }),
    normalizedPnL: doublePrecision('normalizedPnL').notNull().default(0.5),
    totalTrades: integer('totalTrades').notNull().default(0),
    profitableTrades: integer('profitableTrades').notNull().default(0),
    winRate: doublePrecision('winRate').notNull().default(0),
    averageROI: doublePrecision('averageROI').notNull().default(0),
    sharpeRatio: doublePrecision('sharpeRatio'),
    totalFeedbackCount: integer('totalFeedbackCount').notNull().default(0),
    averageFeedbackScore: doublePrecision('averageFeedbackScore')
      .notNull()
      .default(70),
    intelFeedbackCount: integer('intelFeedbackCount').notNull().default(0),
    averageIntelScore: doublePrecision('averageIntelScore')
      .notNull()
      .default(50),
    averageRating: doublePrecision('averageRating'),
    positiveCount: integer('positiveCount').notNull().default(0),
    neutralCount: integer('neutralCount').notNull().default(0),
    negativeCount: integer('negativeCount').notNull().default(0),
    reputationScore: doublePrecision('reputationScore').notNull().default(70),
    trustLevel: text('trustLevel').notNull().default('UNRATED'),
    confidenceScore: doublePrecision('confidenceScore').notNull().default(0),
    onChainReputationSync: boolean('onChainReputationSync')
      .notNull()
      .default(false),
    lastSyncedAt: timestamp('lastSyncedAt', { mode: 'date' }),
    onChainTrustScore: doublePrecision('onChainTrustScore'),
    onChainAccuracyScore: doublePrecision('onChainAccuracyScore'),
    firstActivityAt: timestamp('firstActivityAt', { mode: 'date' }),
    lastActivityAt: timestamp('lastActivityAt', { mode: 'date' }),
    totalInteractions: integer('totalInteractions').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('AgentPerformanceMetrics_gamesPlayed_idx').on(table.gamesPlayed),
    index('AgentPerformanceMetrics_normalizedPnL_idx').on(table.normalizedPnL),
    index('AgentPerformanceMetrics_reputationScore_idx').on(
      table.reputationScore
    ),
    index('AgentPerformanceMetrics_trustLevel_idx').on(table.trustLevel),
    index('AgentPerformanceMetrics_updatedAt_idx').on(table.updatedAt),
  ]
);

export type AgentPerformanceMetrics =
  typeof agentPerformanceMetrics.$inferSelect;
export type NewAgentPerformanceMetrics =
  typeof agentPerformanceMetrics.$inferInsert;
