import { decimal, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const tradingFeeOutbox = pgTable(
  'TradingFeeOutbox',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    tradeType: text('tradeType').notNull(),
    tradeAmount: decimal('tradeAmount', { precision: 24, scale: 8 }).notNull(),
    tradeId: text('tradeId'),
    marketId: text('marketId'),
    lastError: text('lastError'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('TradingFeeOutbox_createdAt_idx').on(table.createdAt),
    index('TradingFeeOutbox_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
  ]
);

export type TradingFeeOutboxRow = typeof tradingFeeOutbox.$inferSelect;
export type NewTradingFeeOutboxRow = typeof tradingFeeOutbox.$inferInsert;
