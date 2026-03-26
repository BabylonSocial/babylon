import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const npcTrades = pgTable(
  'NPCTrade',
  {
    id: text('id').primaryKey(),
    npcActorId: text('npcActorId').notNull(),
    poolId: text('poolId'),
    marketType: text('marketType').notNull(),
    ticker: text('ticker'),
    marketId: text('marketId'),
    action: text('action').notNull(),
    side: text('side'),
    amount: doublePrecision('amount').notNull(),
    price: doublePrecision('price').notNull(),
    sentiment: doublePrecision('sentiment'),
    reason: text('reason'),
    postId: text('postId'),
    executedAt: timestamp('executedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('NPCTrade_executedAt_idx').on(table.executedAt),
    index('NPCTrade_marketType_marketId_executedAt_idx').on(
      table.marketType,
      table.marketId,
      table.executedAt
    ),
    index('NPCTrade_marketType_ticker_idx').on(table.marketType, table.ticker),
    index('NPCTrade_npcActorId_executedAt_idx').on(
      table.npcActorId,
      table.executedAt
    ),
    index('NPCTrade_poolId_executedAt_idx').on(table.poolId, table.executedAt),
  ]
);

export type NPCTrade = typeof npcTrades.$inferSelect;
export type NewNPCTrade = typeof npcTrades.$inferInsert;
