import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './user';

export const pointsTransactions = pgTable(
  'PointsTransaction',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    amount: integer('amount').notNull(),
    pointsBefore: integer('pointsBefore').notNull(),
    pointsAfter: integer('pointsAfter').notNull(),
    reason: text('reason').notNull(),
    metadata: text('metadata'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    paymentAmount: text('paymentAmount'),
    paymentRequestId: text('paymentRequestId').unique(),
    paymentTxHash: text('paymentTxHash'),
    paymentVerified: boolean('paymentVerified').notNull().default(false),
    paymentProvider: text('paymentProvider'),
  },
  (table) => [
    index('PointsTransaction_createdAt_idx').on(table.createdAt),
    index('PointsTransaction_paymentRequestId_idx').on(table.paymentRequestId),
    index('PointsTransaction_reason_idx').on(table.reason),
    index('PointsTransaction_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('PointsTransaction_paymentProvider_idx').on(table.paymentProvider),
  ]
);

export const pointsTransactionsRelations = relations(
  pointsTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [pointsTransactions.userId],
      references: [users.id],
    }),
  })
);

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type NewPointsTransaction = typeof pointsTransactions.$inferInsert;
