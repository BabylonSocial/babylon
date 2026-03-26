import {
  decimal,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const predictionPriceHistories = pgTable(
  'PredictionPriceHistory',
  {
    id: text('id').primaryKey(),
    marketId: text('marketId').notNull(),
    yesPrice: doublePrecision('yesPrice').notNull(),
    noPrice: doublePrecision('noPrice').notNull(),
    yesShares: decimal('yesShares', { precision: 24, scale: 8 }).notNull(),
    noShares: decimal('noShares', { precision: 24, scale: 8 }).notNull(),
    liquidity: decimal('liquidity', { precision: 24, scale: 8 }).notNull(),
    eventType: text('eventType').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('PredictionPriceHistory_marketId_createdAt_idx').on(
      table.marketId,
      table.createdAt
    ),
  ]
);

export type PredictionPriceHistory =
  typeof predictionPriceHistories.$inferSelect;
export type NewPredictionPriceHistory =
  typeof predictionPriceHistories.$inferInsert;
