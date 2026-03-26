import { relations } from 'drizzle-orm';
import { decimal, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { pools } from './pools';

export const poolDeposits = pgTable(
  'PoolDeposit',
  {
    id: text('id').primaryKey(),
    poolId: text('poolId').notNull(),
    userId: text('userId').notNull(),
    amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
    shares: decimal('shares', { precision: 18, scale: 6 }).notNull(),
    currentValue: decimal('currentValue', {
      precision: 18,
      scale: 2,
    }).notNull(),
    unrealizedPnL: decimal('unrealizedPnL', {
      precision: 18,
      scale: 2,
    }).notNull(),
    depositedAt: timestamp('depositedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp('withdrawnAt', { mode: 'date' }),
    withdrawnAmount: decimal('withdrawnAmount', { precision: 18, scale: 2 }),
  },
  (table) => [
    index('PoolDeposit_poolId_userId_idx').on(table.poolId, table.userId),
    index('PoolDeposit_poolId_withdrawnAt_idx').on(
      table.poolId,
      table.withdrawnAt
    ),
    index('PoolDeposit_userId_depositedAt_idx').on(
      table.userId,
      table.depositedAt
    ),
  ]
);

export const poolDepositsRelations = relations(poolDeposits, ({ one }) => ({
  pool: one(pools, {
    fields: [poolDeposits.poolId],
    references: [pools.id],
  }),
}));

export type PoolDeposit = typeof poolDeposits.$inferSelect;
export type NewPoolDeposit = typeof poolDeposits.$inferInsert;
