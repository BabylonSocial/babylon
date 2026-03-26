import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { npcTrades } from './npc-trades';
import { poolDeposits } from './pool-deposits';
import { poolPositions } from './pool-positions';

export const pools = pgTable(
  'Pool',
  {
    id: text('id').primaryKey(),
    npcActorId: text('npcActorId').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    totalValue: decimal('totalValue', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    totalDeposits: decimal('totalDeposits', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    availableBalance: decimal('availableBalance', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    lifetimePnL: decimal('lifetimePnL', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    performanceFeeRate: doublePrecision('performanceFeeRate')
      .notNull()
      .default(0.05),
    totalFeesCollected: decimal('totalFeesCollected', {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default('0'),
    isActive: boolean('isActive').notNull().default(true),
    openedAt: timestamp('openedAt', { mode: 'date' }).notNull().defaultNow(),
    closedAt: timestamp('closedAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    currentPrice: doublePrecision('currentPrice'),
    priceChange24h: doublePrecision('priceChange24h'),
    status: text('status').notNull().default('ACTIVE'),
    tvl: decimal('tvl', { precision: 18, scale: 2 }),
    volume24h: decimal('volume24h', { precision: 18, scale: 2 }),
  },
  (table) => [
    index('Pool_isActive_idx').on(table.isActive),
    index('Pool_npcActorId_idx').on(table.npcActorId),
    index('Pool_status_idx').on(table.status),
    index('Pool_totalValue_idx').on(table.totalValue),
    index('Pool_volume24h_idx').on(table.volume24h),
  ]
);

export const poolsRelations = relations(pools, ({ many }) => ({
  PoolDeposit: many(poolDeposits),
  PoolPosition: many(poolPositions),
  NPCTrade: many(npcTrades),
}));

export type Pool = typeof pools.$inferSelect;
export type NewPool = typeof pools.$inferInsert;
