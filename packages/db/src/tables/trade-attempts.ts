import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const tradeAttempts = pgTable(
  'TradeAttempt',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    tradeType: text('tradeType').notNull(),
    marketId: text('marketId'),
    ticker: text('ticker'),
    amount: text('amount').notNull(),
    outcome: text('outcome').notNull(),
    failureReason: text('failureReason'),
    failureCode: text('failureCode'),
    durationMs: integer('durationMs'),
    requestId: text('requestId'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('TradeAttempt_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('TradeAttempt_outcome_createdAt_idx').on(
      table.outcome,
      table.createdAt
    ),
    index('TradeAttempt_createdAt_idx').on(table.createdAt),
    index('TradeAttempt_tradeType_outcome_createdAt_idx').on(
      table.tradeType,
      table.outcome,
      table.createdAt
    ),
  ]
);

export type TradeAttempt = typeof tradeAttempts.$inferSelect;
export type NewTradeAttempt = typeof tradeAttempts.$inferInsert;

export const tradeAttemptsRelations = relations(tradeAttempts, ({ one }) => ({
  user: one(users, {
    fields: [tradeAttempts.userId],
    references: [users.id],
  }),
}));

export const TRADE_FAILURE_CODES = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  MARKET_CLOSED: 'MARKET_CLOSED',
  MARKET_RESOLVED: 'MARKET_RESOLVED',
  PRICE_SLIPPAGE: 'PRICE_SLIPPAGE',
  POSITION_LIMIT: 'POSITION_LIMIT',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type TradeFailureCode =
  (typeof TRADE_FAILURE_CODES)[keyof typeof TRADE_FAILURE_CODES];
