import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { MarketTimeframe } from './narrative-types';
import { timeframedMarkets } from './timeframed-markets';

export const subMarketSpawnLogs = pgTable(
  'SubMarketSpawnLog',
  {
    id: text('id').primaryKey(),
    parentMarketId: text('parentMarketId')
      .notNull()
      .references(() => timeframedMarkets.id, { onDelete: 'cascade' }),
    sourceEventId: text('sourceEventId'),
    eventType: text('eventType').notNull(),
    spawnedMarketId: text('spawnedMarketId').references(
      () => timeframedMarkets.id,
      { onDelete: 'set null' }
    ),
    wasSpawned: boolean('wasSpawned').notNull(),
    skipReason: text('skipReason'),
    questionTemplate: text('questionTemplate'),
    generatedQuestion: text('generatedQuestion'),
    childTimeframe: text('childTimeframe').$type<MarketTimeframe>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('SubMarketSpawnLog_parentMarketId_idx').on(t.parentMarketId),
    index('SubMarketSpawnLog_spawnedMarketId_idx').on(t.spawnedMarketId),
    index('SubMarketSpawnLog_eventType_idx').on(t.eventType),
    index('SubMarketSpawnLog_createdAt_idx').on(t.createdAt),
  ]
);

export const subMarketSpawnLogsRelations = relations(
  subMarketSpawnLogs,
  ({ one }) => ({
    parentMarket: one(timeframedMarkets, {
      fields: [subMarketSpawnLogs.parentMarketId],
      references: [timeframedMarkets.id],
    }),
    spawnedMarket: one(timeframedMarkets, {
      fields: [subMarketSpawnLogs.spawnedMarketId],
      references: [timeframedMarkets.id],
    }),
  })
);

export type SubMarketSpawnLog = typeof subMarketSpawnLogs.$inferSelect;
export type NewSubMarketSpawnLog = typeof subMarketSpawnLogs.$inferInsert;
