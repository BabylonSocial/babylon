import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const shares = pgTable(
  'Share',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    postId: text('postId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('Share_userId_postId_key').on(table.userId, table.postId),
    index('Share_createdAt_idx').on(table.createdAt),
    index('Share_postId_idx').on(table.postId),
    index('Share_userId_createdAt_idx').on(table.userId, table.createdAt),
    index('Share_userId_idx').on(table.userId),
  ]
);

export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;
