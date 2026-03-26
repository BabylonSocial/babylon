import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const agentTrades = pgTable(
  'AgentTrade',
  {
    id: text('id').primaryKey(),
    marketType: text('marketType').notNull(),
    marketId: text('marketId'),
    ticker: text('ticker'),
    action: text('action').notNull(),
    side: text('side'),
    amount: doublePrecision('amount').notNull(),
    price: doublePrecision('price').notNull(),
    pnl: doublePrecision('pnl'),
    reasoning: text('reasoning'),
    executedAt: timestamp('executedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    agentUserId: text('agentUserId').notNull(),
  },
  (table) => [
    index('AgentTrade_agentUserId_executedAt_idx').on(
      table.agentUserId,
      table.executedAt
    ),
    index('AgentTrade_marketType_marketId_idx').on(
      table.marketType,
      table.marketId
    ),
    index('AgentTrade_ticker_idx').on(table.ticker),
  ]
);

export type AgentTrade = typeof agentTrades.$inferSelect;
export type NewAgentTrade = typeof agentTrades.$inferInsert;
