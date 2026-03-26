import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  type PgColumn,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type {
  ArcStateType,
  MarketCategory,
  MarketTimeframe,
  SubMarketTriggerData,
} from './narrative-types';
import { questions } from './questions';

export const timeframedMarkets = pgTable(
  'TimeframedMarket',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId').references(() => questions.id, {
      onDelete: 'cascade',
    }),
    timeframe: text('timeframe').$type<MarketTimeframe>().notNull(),
    category: text('category')
      .$type<MarketCategory>()
      .notNull()
      .default('general'),
    topicKey: text('topicKey'),
    topicLabel: text('topicLabel'),
    topicDate: timestamp('topicDate', { mode: 'date' }),
    granularTimeframe: text('granularTimeframe'),
    parentMarketId: text('parentMarketId').references(
      (): PgColumn => timeframedMarkets.id,
      { onDelete: 'set null' }
    ),
    rootMarketId: text('rootMarketId').references(
      (): PgColumn => timeframedMarkets.id,
      { onDelete: 'set null' }
    ),
    startTime: timestamp('startTime', { mode: 'date' }).notNull(),
    endTime: timestamp('endTime', { mode: 'date' }).notNull(),
    arcState: text('arcState').$type<ArcStateType>().notNull().default('setup'),
    arcStateEnteredAt: timestamp('arcStateEnteredAt', {
      mode: 'date',
    }).notNull(),
    isActive: boolean('isActive').notNull().default(true),
    isResolved: boolean('isResolved').notNull().default(false),
    resolvedAt: timestamp('resolvedAt', { mode: 'date' }),
    triggerData: jsonb('triggerData').$type<SubMarketTriggerData>(),
    affiliatedOrgIds: jsonb('affiliatedOrgIds').$type<string[]>().default([]),
    affiliatedActorIds: jsonb('affiliatedActorIds')
      .$type<string[]>()
      .default([]),
    childMarketCount: integer('childMarketCount').notNull().default(0),
    eventsGenerated: integer('eventsGenerated').notNull().default(0),
    lastEventAt: timestamp('lastEventAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('TimeframedMarket_questionId_idx').on(t.questionId),
    index('TimeframedMarket_parentMarketId_idx').on(t.parentMarketId),
    index('TimeframedMarket_rootMarketId_idx').on(t.rootMarketId),
    index('TimeframedMarket_timeframe_idx').on(t.timeframe),
    index('TimeframedMarket_category_idx').on(t.category),
    index('TimeframedMarket_topicKey_topicDate_idx').on(
      t.topicKey,
      t.topicDate
    ),
    index('TimeframedMarket_granularTimeframe_idx').on(t.granularTimeframe),
    index('TimeframedMarket_isActive_idx').on(t.isActive),
    index('TimeframedMarket_isActive_isResolved_endTime_idx').on(
      t.isActive,
      t.isResolved,
      t.endTime
    ),
    index('TimeframedMarket_endTime_idx').on(t.endTime),
    index('TimeframedMarket_startTime_endTime_idx').on(t.startTime, t.endTime),
  ]
);

export const timeframedMarketsRelations = relations(
  timeframedMarkets,
  ({ one, many }) => ({
    question: one(questions, {
      fields: [timeframedMarkets.questionId],
      references: [questions.id],
    }),
    parentMarket: one(timeframedMarkets, {
      fields: [timeframedMarkets.parentMarketId],
      references: [timeframedMarkets.id],
      relationName: 'parentChild',
    }),
    childMarkets: many(timeframedMarkets, {
      relationName: 'parentChild',
    }),
    rootMarket: one(timeframedMarkets, {
      fields: [timeframedMarkets.rootMarketId],
      references: [timeframedMarkets.id],
      relationName: 'rootRelation',
    }),
    descendantMarkets: many(timeframedMarkets, {
      relationName: 'rootRelation',
    }),
  })
);

export type TimeframedMarket = typeof timeframedMarkets.$inferSelect;
export type NewTimeframedMarket = typeof timeframedMarkets.$inferInsert;
