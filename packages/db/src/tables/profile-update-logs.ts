import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const profileUpdateLogs = pgTable(
  'ProfileUpdateLog',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    changedFields: text('changedFields').array().notNull(),
    backendSigned: boolean('backendSigned').notNull(),
    txHash: text('txHash'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('ProfileUpdateLog_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
  ]
);

export type ProfileUpdateLog = typeof profileUpdateLogs.$inferSelect;
export type NewProfileUpdateLog = typeof profileUpdateLogs.$inferInsert;

export const profileUpdateLogsRelations = relations(
  profileUpdateLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [profileUpdateLogs.userId],
      references: [users.id],
    }),
  })
);
