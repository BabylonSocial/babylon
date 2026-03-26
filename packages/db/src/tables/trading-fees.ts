import { relations } from 'drizzle-orm';
import { decimal, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const tradingFees = pgTable(
  'TradingFee',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    tradeType: text('tradeType').notNull(),
    tradeId: text('tradeId'),
    marketId: text('marketId'),
    feeAmount: decimal('feeAmount', { precision: 18, scale: 2 }).notNull(),
    platformFee: decimal('platformFee', { precision: 18, scale: 2 }).notNull(),
    referrerFee: decimal('referrerFee', { precision: 18, scale: 2 }).notNull(),
    referrerId: text('referrerId'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('TradingFee_createdAt_idx').on(table.createdAt),
    index('TradingFee_referrerId_createdAt_idx').on(
      table.referrerId,
      table.createdAt
    ),
    index('TradingFee_tradeType_idx').on(table.tradeType),
    index('TradingFee_userId_createdAt_idx').on(table.userId, table.createdAt),
  ]
);

export const tradingFeesRelations = relations(tradingFees, ({ one }) => ({
  user: one(users, {
    fields: [tradingFees.userId],
    references: [users.id],
    relationName: 'TradingFee_userIdToUser',
  }),
  referrer: one(users, {
    fields: [tradingFees.referrerId],
    references: [users.id],
    relationName: 'TradingFee_referrerIdToUser',
  }),
}));

export type TradingFee = typeof tradingFees.$inferSelect;
export type NewTradingFee = typeof tradingFees.$inferInsert;
