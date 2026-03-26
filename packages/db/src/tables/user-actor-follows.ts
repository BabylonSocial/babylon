import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './user';

export const userActorFollows = pgTable(
  'UserActorFollow',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    actorId: text('actorId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('UserActorFollow_userId_actorId_key').on(
      table.userId,
      table.actorId
    ),
    index('UserActorFollow_actorId_idx').on(table.actorId),
    index('UserActorFollow_userId_idx').on(table.userId),
  ]
);

export type UserActorFollow = typeof userActorFollows.$inferSelect;
export type NewUserActorFollow = typeof userActorFollows.$inferInsert;

export const userActorFollowsRelations = relations(
  userActorFollows,
  ({ one }) => ({
    user: one(users, {
      fields: [userActorFollows.userId],
      references: [users.id],
    }),
  })
);
