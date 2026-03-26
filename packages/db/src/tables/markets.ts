import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const markets = pgTable(
  'Market',
  {
    id: text('id').primaryKey(),
    question: text('question').notNull(),
    description: text('description'),
    gameId: text('gameId'),
    dayNumber: integer('dayNumber'),
    yesShares: decimal('yesShares', { precision: 18, scale: 6 })
      .notNull()
      .default('0'),
    noShares: decimal('noShares', { precision: 18, scale: 6 })
      .notNull()
      .default('0'),
    liquidity: decimal('liquidity', { precision: 18, scale: 6 }).notNull(),
    resolved: boolean('resolved').notNull().default(false),
    resolution: boolean('resolution'),
    endDate: timestamp('endDate', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    onChainMarketId: text('onChainMarketId'),
    onChainResolutionTxHash: text('onChainResolutionTxHash'),
    onChainResolved: boolean('onChainResolved').notNull().default(false),
    oracleAddress: text('oracleAddress'),
    resolutionProofUrl: text('resolutionProofUrl'),
    resolutionDescription: text('resolutionDescription'),
  },
  (table) => [
    index('Market_createdAt_idx').on(table.createdAt),
    index('Market_gameId_dayNumber_idx').on(table.gameId, table.dayNumber),
    index('Market_onChainMarketId_idx').on(table.onChainMarketId),
    index('Market_resolved_endDate_idx').on(table.resolved, table.endDate),
  ]
);

export type Market = typeof markets.$inferSelect;
export type NewMarket = typeof markets.$inferInsert;
