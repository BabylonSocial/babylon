import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const postTags = pgTable(
  'PostTag',
  {
    id: text('id').primaryKey(),
    postId: text('postId').notNull(),
    tagId: text('tagId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('PostTag_postId_tagId_key').on(table.postId, table.tagId),
    index('PostTag_postId_idx').on(table.postId),
    index('PostTag_tagId_createdAt_idx').on(table.tagId, table.createdAt),
    index('PostTag_tagId_idx').on(table.tagId),
  ]
);

export type PostTag = typeof postTags.$inferSelect;
export type NewPostTag = typeof postTags.$inferInsert;
