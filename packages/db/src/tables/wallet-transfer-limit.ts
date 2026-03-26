import { relations } from 'drizzle-orm';
import { decimal, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const walletTransferLimit = pgTable('WalletTransferLimit', {
  userId: text('userId').primaryKey(),
  dailyLimitUsd: decimal('dailyLimitUsd', { precision: 18, scale: 2 })
    .notNull()
    .default('1000.00'),
  dailySpentUsd: decimal('dailySpentUsd', { precision: 18, scale: 2 })
    .notNull()
    .default('0.00'),
  lastResetAt: timestamp('lastResetAt', { mode: 'date' })
    .notNull()
    .defaultNow(),
  elevatedUntil: timestamp('elevatedUntil', { mode: 'date' }),
  elevatedLimitUsd: decimal('elevatedLimitUsd', { precision: 18, scale: 2 }),
});

export const walletTransferLimitRelations = relations(
  walletTransferLimit,
  ({ one }) => ({
    user: one(users, {
      fields: [walletTransferLimit.userId],
      references: [users.id],
    }),
  })
);
