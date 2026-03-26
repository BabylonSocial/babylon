import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const actorFollows = pgTable(
  'ActorFollow',
  {
    id: text('id').primaryKey(),
    followerId: text('followerId').notNull(),
    followingId: text('followingId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    isMutual: boolean('isMutual').notNull().default(false),
  },
  (table) => [
    index('ActorFollow_followerId_idx').on(table.followerId),
    index('ActorFollow_followingId_idx').on(table.followingId),
    index('ActorFollow_isMutual_idx').on(table.isMutual),
  ]
);

export type ActorFollow = typeof actorFollows.$inferSelect;
export type NewActorFollow = typeof actorFollows.$inferInsert;
