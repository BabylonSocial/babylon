import { relations } from 'drizzle-orm';
import { decimal, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const balanceTransactions = pgTable(
  'BalanceTransaction',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    type: text('type').notNull(),
    amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
    balanceBefore: decimal('balanceBefore', {
      precision: 18,
      scale: 2,
    }).notNull(),
    balanceAfter: decimal('balanceAfter', {
      precision: 18,
      scale: 2,
    }).notNull(),
    relatedId: text('relatedId'),
    description: text('description'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('BalanceTransaction_type_idx').on(table.type),
    index('BalanceTransaction_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('BalanceTransaction_type_createdAt_idx').on(
      table.type,
      table.createdAt
    ),
    index('BalanceTransaction_userId_type_idx').on(table.userId, table.type),
  ]
);

export const balanceTransactionsRelations = relations(
  balanceTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [balanceTransactions.userId],
      references: [users.id],
    }),
  })
);

export type BalanceTransaction = typeof balanceTransactions.$inferSelect;
export type NewBalanceTransaction = typeof balanceTransactions.$inferInsert;
