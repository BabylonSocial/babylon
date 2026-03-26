import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './user';

export const userMutes = pgTable(
  'UserMute',
  {
    id: text('id').primaryKey(),
    muterId: text('muterId').notNull(),
    mutedId: text('mutedId').notNull(),
    reason: text('reason'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('UserMute_muterId_mutedId_key').on(table.muterId, table.mutedId),
    index('UserMute_muterId_idx').on(table.muterId),
    index('UserMute_mutedId_idx').on(table.mutedId),
    index('UserMute_createdAt_idx').on(table.createdAt),
  ]
);

export type UserMute = typeof userMutes.$inferSelect;
export type NewUserMute = typeof userMutes.$inferInsert;

export const userMutesRelations = relations(userMutes, ({ one }) => ({
  muter: one(users, {
    fields: [userMutes.muterId],
    references: [users.id],
    relationName: 'UserMute_muterIdToUser',
  }),
  muted: one(users, {
    fields: [userMutes.mutedId],
    references: [users.id],
    relationName: 'UserMute_mutedIdToUser',
  }),
}));
