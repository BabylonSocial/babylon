import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './user';

export const userActivityLogs = pgTable(
  'UserActivityLog',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    activityType: text('activityType').notNull(),
    activityDate: timestamp('activityDate', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('UserActivityLog_userId_activityDate_activityType_idx').on(
      table.userId,
      table.activityDate,
      table.activityType
    ),
    index('UserActivityLog_activityDate_idx').on(table.activityDate),
    index('UserActivityLog_userId_activityDate_idx').on(
      table.userId,
      table.activityDate
    ),
    index('UserActivityLog_userId_activityType_idx').on(
      table.userId,
      table.activityType
    ),
  ]
);

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type NewUserActivityLog = typeof userActivityLogs.$inferInsert;

export const userActivityLogsRelations = relations(
  userActivityLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [userActivityLogs.userId],
      references: [users.id],
    }),
  })
);
