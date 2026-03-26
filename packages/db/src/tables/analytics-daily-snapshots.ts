import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const analyticsDailySnapshots = pgTable(
  'AnalyticsDailySnapshot',
  {
    id: text('id').primaryKey(),
    date: timestamp('date', { mode: 'date' }).notNull().unique(),
    totalUsers: integer('totalUsers').notNull().default(0),
    newUsers: integer('newUsers').notNull().default(0),
    activeUsers: integer('activeUsers').notNull().default(0),
    bannedUsers: integer('bannedUsers').notNull().default(0),
    totalPosts: integer('totalPosts').notNull().default(0),
    newPosts: integer('newPosts').notNull().default(0),
    totalComments: integer('totalComments').notNull().default(0),
    newComments: integer('newComments').notNull().default(0),
    totalReactions: integer('totalReactions').notNull().default(0),
    newReactions: integer('newReactions').notNull().default(0),
    totalMarkets: integer('totalMarkets').notNull().default(0),
    activeMarkets: integer('activeMarkets').notNull().default(0),
    totalTrades: integer('totalTrades').notNull().default(0),
    newTrades: integer('newTrades').notNull().default(0),
    totalFollows: integer('totalFollows').notNull().default(0),
    newFollows: integer('newFollows').notNull().default(0),
    totalReferrals: integer('totalReferrals').notNull().default(0),
    newReferrals: integer('newReferrals').notNull().default(0),
    totalReports: integer('totalReports').notNull().default(0),
    newReports: integer('newReports').notNull().default(0),
    resolvedReports: integer('resolvedReports').notNull().default(0),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('AnalyticsDailySnapshot_date_idx').on(table.date),
    index('AnalyticsDailySnapshot_createdAt_idx').on(table.createdAt),
  ]
);

export type AnalyticsDailySnapshot =
  typeof analyticsDailySnapshots.$inferSelect;
export type NewAnalyticsDailySnapshot =
  typeof analyticsDailySnapshots.$inferInsert;
