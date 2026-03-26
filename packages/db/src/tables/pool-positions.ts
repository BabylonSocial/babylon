import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { pools } from './pools';

export const poolPositions = pgTable(
  'PoolPosition',
  {
    id: text('id').primaryKey(),
    poolId: text('poolId').notNull(),
    marketType: text('marketType').notNull(),
    ticker: text('ticker'),
    marketId: text('marketId'),
    side: text('side').notNull(),
    entryPrice: doublePrecision('entryPrice').notNull(),
    currentPrice: doublePrecision('currentPrice').notNull(),
    size: doublePrecision('size').notNull(),
    shares: doublePrecision('shares'),
    leverage: integer('leverage'),
    liquidationPrice: doublePrecision('liquidationPrice'),
    unrealizedPnL: doublePrecision('unrealizedPnL').notNull(),
    openedAt: timestamp('openedAt', { mode: 'date' }).notNull().defaultNow(),
    closedAt: timestamp('closedAt', { mode: 'date' }),
    realizedPnL: doublePrecision('realizedPnL'),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('PoolPosition_marketType_marketId_idx').on(
      table.marketType,
      table.marketId
    ),
    index('PoolPosition_marketType_ticker_idx').on(
      table.marketType,
      table.ticker
    ),
    index('PoolPosition_poolId_closedAt_idx').on(table.poolId, table.closedAt),
  ]
);

export const poolPositionsRelations = relations(poolPositions, ({ one }) => ({
  pool: one(pools, {
    fields: [poolPositions.poolId],
    references: [pools.id],
  }),
}));

export type PoolPosition = typeof poolPositions.$inferSelect;
export type NewPoolPosition = typeof poolPositions.$inferInsert;
