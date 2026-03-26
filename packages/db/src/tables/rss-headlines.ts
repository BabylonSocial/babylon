import { index, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const rssHeadlines = pgTable(
  'RSSHeadline',
  {
    id: text('id').primaryKey(),
    sourceId: text('sourceId').notNull(),
    title: text('title').notNull(),
    link: text('link'),
    publishedAt: timestamp('publishedAt', { mode: 'date' }).notNull(),
    summary: text('summary'),
    content: text('content'),
    rawData: json('rawData').$type<JsonValue>(),
    fetchedAt: timestamp('fetchedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('RSSHeadline_sourceId_publishedAt_idx').on(
      table.sourceId,
      table.publishedAt
    ),
    index('RSSHeadline_publishedAt_idx').on(table.publishedAt),
  ]
);

export type RSSHeadline = typeof rssHeadlines.$inferSelect;
export type NewRSSHeadline = typeof rssHeadlines.$inferInsert;
