import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const trendingTags = pgTable(
  'TrendingTag',
  {
    id: text('id').primaryKey(),
    tagId: text('tagId').notNull(),
    score: doublePrecision('score').notNull(),
    postCount: integer('postCount').notNull(),
    rank: integer('rank').notNull(),
    calculatedAt: timestamp('calculatedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    windowStart: timestamp('windowStart', { mode: 'date' }).notNull(),
    windowEnd: timestamp('windowEnd', { mode: 'date' }).notNull(),
    relatedContext: text('relatedContext'),
  },
  (table) => [
    index('TrendingTag_calculatedAt_idx').on(table.calculatedAt),
    index('TrendingTag_rank_calculatedAt_idx').on(
      table.rank,
      table.calculatedAt
    ),
    index('TrendingTag_tagId_calculatedAt_idx').on(
      table.tagId,
      table.calculatedAt
    ),
  ]
);

export type TrendingTag = typeof trendingTags.$inferSelect;
export type NewTrendingTag = typeof trendingTags.$inferInsert;
