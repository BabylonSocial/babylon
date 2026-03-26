import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const userInteractions = pgTable(
  'UserInteraction',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    npcId: text('npcId').notNull(),
    postId: text('postId').notNull(),
    commentId: text('commentId').notNull(),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
    qualityScore: doublePrecision('qualityScore').notNull().default(1.0),
    wasFollowed: boolean('wasFollowed').notNull().default(false),
    wasInvitedToChat: boolean('wasInvitedToChat').notNull().default(false),
  },
  (table) => [
    index('UserInteraction_npcId_timestamp_idx').on(
      table.npcId,
      table.timestamp
    ),
    index('UserInteraction_userId_npcId_timestamp_idx').on(
      table.userId,
      table.npcId,
      table.timestamp
    ),
    index('UserInteraction_userId_timestamp_idx').on(
      table.userId,
      table.timestamp
    ),
  ]
);

export type UserInteraction = typeof userInteractions.$inferSelect;
export type NewUserInteraction = typeof userInteractions.$inferInsert;
