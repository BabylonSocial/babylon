import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './user';

export const follows = pgTable(
  'Follow',
  {
    id: text('id').primaryKey(),
    followerId: text('followerId').notNull(),
    followingId: text('followingId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('Follow_followerId_followingId_key').on(
      table.followerId,
      table.followingId
    ),
    index('Follow_followerId_createdAt_idx').on(
      table.followerId,
      table.createdAt
    ),
    index('Follow_followerId_idx').on(table.followerId),
    index('Follow_followingId_idx').on(table.followingId),
  ]
);

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'Follow_followerIdToUser',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'Follow_followingIdToUser',
  }),
}));
