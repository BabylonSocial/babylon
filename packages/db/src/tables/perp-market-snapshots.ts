import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface FundingRate {
  ticker: string;
  rate: number;
  nextFundingTime: string;
  predictedRate: number;
}

export const perpMarketSnapshots = pgTable(
  'PerpMarketSnapshot',
  {
    ticker: text('ticker').primaryKey(),
    organizationId: text('organizationId').notNull(),
    name: text('name'),
    currentPrice: doublePrecision('currentPrice').notNull(),
    price24hAgo: doublePrecision('price24hAgo'),
    price24hAgoUpdatedAt: timestamp('price24hAgoUpdatedAt', { mode: 'date' }),
    metrics24hResetAt: timestamp('metrics24hResetAt', { mode: 'date' }),
    change24h: doublePrecision('change24h').notNull().default(0),
    changePercent24h: doublePrecision('changePercent24h').notNull().default(0),
    high24h: doublePrecision('high24h').notNull(),
    low24h: doublePrecision('low24h').notNull(),
    volume24h: doublePrecision('volume24h').notNull().default(0),
    openInterest: doublePrecision('openInterest').notNull().default(0),
    fundingRate: jsonb('fundingRate').$type<FundingRate>().notNull(),
    maxLeverage: integer('maxLeverage').notNull().default(100),
    minOrderSize: integer('minOrderSize').notNull().default(10),
    markPrice: doublePrecision('markPrice'),
    indexPrice: doublePrecision('indexPrice'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('PerpMarketSnapshot_orgId_idx').on(table.organizationId)]
);

export type PerpMarketSnapshot = typeof perpMarketSnapshots.$inferSelect;
export type NewPerpMarketSnapshot = typeof perpMarketSnapshots.$inferInsert;
