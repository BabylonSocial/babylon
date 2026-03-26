import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export type DailyTopicSourceType =
  | 'auto'
  | 'manual_override'
  | 'fallback_previous_day'
  | 'fallback_default';

export const dailyTopics = pgTable(
  'DailyTopic',
  {
    id: text('id').primaryKey(),
    date: timestamp('date', { mode: 'date' }).notNull().unique(),
    topicKey: text('topicKey').notNull(),
    topicLabel: text('topicLabel').notNull(),
    summary: text('summary').notNull(),
    sourceType: text('sourceType').$type<DailyTopicSourceType>().notNull(),
    sourceHeadlineIds: json('sourceHeadlineIds').$type<string[]>().notNull(),
    selectionReason: text('selectionReason'),
    isLocked: boolean('isLocked').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('DailyTopic_date_idx').on(table.date),
    index('DailyTopic_topicKey_idx').on(table.topicKey),
    index('DailyTopic_isLocked_date_idx').on(table.isLocked, table.date),
  ]
);

export type DailyTopic = typeof dailyTopics.$inferSelect;
export type NewDailyTopic = typeof dailyTopics.$inferInsert;
