import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const positions = pgTable(
  'Position',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    marketId: text('marketId').notNull(),
    side: boolean('side').notNull(),
    shares: decimal('shares', { precision: 18, scale: 6 }).notNull(),
    avgPrice: decimal('avgPrice', { precision: 18, scale: 6 }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    amount: decimal('amount', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    outcome: boolean('outcome'),
    pnl: decimal('pnl', { precision: 18, scale: 2 }),
    questionId: integer('questionId'),
    resolvedAt: timestamp('resolvedAt', { mode: 'date' }),
    status: text('status').notNull().default('active'),
  },
  (table) => [
    index('Position_createdAt_idx').on(table.createdAt),
    index('Position_marketId_idx').on(table.marketId),
    index('Position_questionId_idx').on(table.questionId),
    index('Position_status_resolvedAt_idx').on(table.status, table.resolvedAt),
    index('Position_status_idx').on(table.status),
    index('Position_userId_idx').on(table.userId),
    index('Position_userId_createdAt_idx').on(table.userId, table.createdAt),
    index('Position_userId_marketId_idx').on(table.userId, table.marketId),
    index('Position_userId_resolvedAt_idx').on(table.userId, table.resolvedAt),
    index('Position_userId_status_idx').on(table.userId, table.status),
  ]
);

export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;
