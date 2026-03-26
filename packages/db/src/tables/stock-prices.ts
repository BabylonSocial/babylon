import { generateSnowflakeId } from '@babylon/shared';
import { and, desc, eq } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { DrizzleClient } from '../client';

export const stockPrices = pgTable(
  'StockPrice',
  {
    id: text('id').primaryKey(),
    organizationId: text('organizationId').notNull(),
    price: doublePrecision('price').notNull(),
    change: doublePrecision('change').notNull(),
    changePercent: doublePrecision('changePercent').notNull(),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
    isSnapshot: boolean('isSnapshot').notNull().default(false),
    openPrice: doublePrecision('openPrice'),
    highPrice: doublePrecision('highPrice'),
    lowPrice: doublePrecision('lowPrice'),
    volume: doublePrecision('volume'),
  },
  (table) => [
    index('StockPrice_isSnapshot_timestamp_idx').on(
      table.isSnapshot,
      table.timestamp
    ),
    index('StockPrice_organizationId_timestamp_idx').on(
      table.organizationId,
      table.timestamp
    ),
    index('StockPrice_timestamp_idx').on(table.timestamp),
  ]
);

export type StockPrice = typeof stockPrices.$inferSelect;
export type NewStockPrice = typeof stockPrices.$inferInsert;

export async function recordStockPriceUpdate(
  db: DrizzleClient,
  organizationId: string,
  price: number,
  change: number,
  changePercent: number
) {
  const created = await db
    .insert(stockPrices)
    .values({
      id: await generateSnowflakeId(),
      organizationId,
      price,
      change,
      changePercent,
      timestamp: new Date(),
      isSnapshot: false,
    })
    .returning();

  return created[0]!;
}

export async function recordStockDailySnapshot(
  db: DrizzleClient,
  organizationId: string,
  data: {
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    closePrice: number;
    volume: number;
  }
) {
  const created = await db
    .insert(stockPrices)
    .values({
      id: await generateSnowflakeId(),
      organizationId,
      price: data.closePrice,
      change: data.closePrice - data.openPrice,
      changePercent:
        ((data.closePrice - data.openPrice) / data.openPrice) * 100,
      timestamp: new Date(),
      isSnapshot: true,
      openPrice: data.openPrice,
      highPrice: data.highPrice,
      lowPrice: data.lowPrice,
      volume: data.volume,
    })
    .returning();

  return created[0]!;
}

export async function getStockPriceHistory(
  db: DrizzleClient,
  organizationId: string,
  limit = 1440
) {
  return db
    .select()
    .from(stockPrices)
    .where(eq(stockPrices.organizationId, organizationId))
    .limit(limit)
    .orderBy(desc(stockPrices.timestamp));
}

export async function getStockDailySnapshots(
  db: DrizzleClient,
  organizationId: string,
  days = 30
) {
  return db
    .select()
    .from(stockPrices)
    .where(
      and(
        eq(stockPrices.organizationId, organizationId),
        eq(stockPrices.isSnapshot, true)
      )
    )
    .limit(days)
    .orderBy(desc(stockPrices.timestamp));
}
