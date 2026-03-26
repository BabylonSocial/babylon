import { relations } from 'drizzle-orm';
import { decimal, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

/** UserPointsSnapshot - Daily/weekly snapshots of totalPoints for gain tracking */
export const userPointsSnapshots = pgTable(
  'UserPointsSnapshot',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalPoints: decimal('totalPoints', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    snapshotDate: timestamp('snapshotDate', { mode: 'date' }).notNull(),
    period: text('period').notNull().default('daily'), // 'daily' | 'weekly'
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('UserPointsSnapshot_userId_idx').on(table.userId),
    index('UserPointsSnapshot_userId_period_snapshotDate_idx').on(
      table.userId,
      table.period,
      table.snapshotDate
    ),
    index('UserPointsSnapshot_snapshotDate_idx').on(table.snapshotDate),
  ]
);

export type UserPointsSnapshot = typeof userPointsSnapshots.$inferSelect;
export type NewUserPointsSnapshot = typeof userPointsSnapshots.$inferInsert;

export const userPointsSnapshotsRelations = relations(
  userPointsSnapshots,
  ({ one }) => ({
    user: one(users, {
      fields: [userPointsSnapshots.userId],
      references: [users.id],
    }),
  })
);
