import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const comments = pgTable(
  'Comment',
  {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    postId: text('postId').notNull(),
    authorId: text('authorId').notNull(),
    parentCommentId: text('parentCommentId'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    deletedAt: timestamp('deletedAt', { mode: 'date' }),
  },
  (table) => [
    index('Comment_authorId_createdAt_idx').on(table.authorId, table.createdAt),
    index('Comment_authorId_idx').on(table.authorId),
    index('Comment_deletedAt_idx').on(table.deletedAt),
    index('Comment_parentCommentId_idx').on(table.parentCommentId),
    index('Comment_postId_createdAt_idx').on(table.postId, table.createdAt),
    index('Comment_postId_deletedAt_idx').on(table.postId, table.deletedAt),
  ]
);

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
