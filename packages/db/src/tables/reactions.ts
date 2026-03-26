import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const reactions = pgTable(
  'Reaction',
  {
    id: text('id').primaryKey(),
    postId: text('postId'),
    commentId: text('commentId'),
    userId: text('userId').notNull(),
    type: text('type').notNull().default('like'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('Reaction_commentId_userId_type_key').on(
      table.commentId,
      table.userId,
      table.type
    ),
    unique('Reaction_postId_userId_type_key').on(
      table.postId,
      table.userId,
      table.type
    ),
    index('Reaction_commentId_idx').on(table.commentId),
    index('Reaction_postId_idx').on(table.postId),
    index('Reaction_userId_createdAt_idx').on(table.userId, table.createdAt),
    index('Reaction_userId_idx').on(table.userId),
  ]
);

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
