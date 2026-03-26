import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const followStatuses = pgTable(
  'FollowStatus',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    npcId: text('npcId').notNull(),
    followedAt: timestamp('followedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    unfollowedAt: timestamp('unfollowedAt', { mode: 'date' }),
    isActive: boolean('isActive').notNull().default(true),
    followReason: text('followReason'),
  },
  (table) => [
    unique('FollowStatus_userId_npcId_key').on(table.userId, table.npcId),
    index('FollowStatus_npcId_idx').on(table.npcId),
    index('FollowStatus_userId_isActive_idx').on(table.userId, table.isActive),
  ]
);

export type FollowStatus = typeof followStatuses.$inferSelect;
export type NewFollowStatus = typeof followStatuses.$inferInsert;
