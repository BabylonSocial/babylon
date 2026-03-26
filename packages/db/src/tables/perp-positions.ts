import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const perpPositions = pgTable(
  'PerpPosition',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    ticker: text('ticker').notNull(),
    organizationId: text('organizationId').notNull(),
    side: text('side').notNull(),
    entryPrice: doublePrecision('entryPrice').notNull(),
    currentPrice: doublePrecision('currentPrice').notNull(),
    size: doublePrecision('size').notNull(),
    leverage: integer('leverage').notNull(),
    liquidationPrice: doublePrecision('liquidationPrice').notNull(),
    unrealizedPnL: doublePrecision('unrealizedPnL').notNull(),
    unrealizedPnLPercent: doublePrecision('unrealizedPnLPercent').notNull(),
    fundingPaid: doublePrecision('fundingPaid').notNull().default(0),
    openedAt: timestamp('openedAt', { mode: 'date' }).notNull().defaultNow(),
    lastUpdated: timestamp('lastUpdated', { mode: 'date' }).notNull(),
    closedAt: timestamp('closedAt', { mode: 'date' }),
    realizedPnL: doublePrecision('realizedPnL'),
    settledAt: timestamp('settledAt', { mode: 'date' }),
    settledToChain: boolean('settledToChain').notNull().default(false),
    settlementTxHash: text('settlementTxHash'),
  },
  (table) => [
    index('PerpPosition_organizationId_idx').on(table.organizationId),
    index('PerpPosition_settledToChain_idx').on(table.settledToChain),
    index('PerpPosition_ticker_idx').on(table.ticker),
    index('PerpPosition_userId_closedAt_idx').on(table.userId, table.closedAt),
    index('PerpPosition_userId_openedAt_idx').on(table.userId, table.openedAt),
  ]
);

export type PerpPosition = typeof perpPositions.$inferSelect;
export type NewPerpPosition = typeof perpPositions.$inferInsert;
