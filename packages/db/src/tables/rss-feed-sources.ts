import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const rssFeedSources = pgTable(
  'RSSFeedSource',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    feedUrl: text('feedUrl').notNull(),
    category: text('category').notNull(),
    isActive: boolean('isActive').notNull().default(true),
    lastFetched: timestamp('lastFetched', { mode: 'date' }),
    fetchErrors: integer('fetchErrors').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('RSSFeedSource_isActive_lastFetched_idx').on(
      table.isActive,
      table.lastFetched
    ),
    index('RSSFeedSource_category_idx').on(table.category),
  ]
);

export type RSSFeedSource = typeof rssFeedSources.$inferSelect;
export type NewRSSFeedSource = typeof rssFeedSources.$inferInsert;
