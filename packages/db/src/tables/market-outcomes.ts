import {
  decimal,
  index,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const marketOutcomes = pgTable(
  'market_outcomes',
  {
    id: text('id').primaryKey(),
    windowId: varchar('windowId', { length: 50 }).notNull(),
    stockTicker: varchar('stockTicker', { length: 20 }),
    startPrice: decimal('startPrice', { precision: 10, scale: 2 }),
    endPrice: decimal('endPrice', { precision: 10, scale: 2 }),
    changePercent: decimal('changePercent', { precision: 5, scale: 2 }),
    sentiment: varchar('sentiment', { length: 20 }),
    newsEvents: json('newsEvents').$type<JsonValue>(),
    predictionMarketId: text('predictionMarketId'),
    question: text('question'),
    outcome: varchar('outcome', { length: 20 }),
    finalProbability: decimal('finalProbability', { precision: 5, scale: 4 }),
    volume: decimal('volume', { precision: 15, scale: 2 }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('market_outcomes_windowId_idx').on(table.windowId),
    index('market_outcomes_windowId_stockTicker_idx').on(
      table.windowId,
      table.stockTicker
    ),
  ]
);

export type MarketOutcome = typeof marketOutcomes.$inferSelect;
export type NewMarketOutcome = typeof marketOutcomes.$inferInsert;
