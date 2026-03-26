import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './user';

/** UserPnLSnapshot - Hourly snapshots of canonical per-user trading metrics */
export const userPnLSnapshots = pgTable(
  'UserPnLSnapshot',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    snapshotAt: timestamp('snapshotAt', { mode: 'date' }).notNull(),
    lifetimePnL: doublePrecision('lifetimePnL').notNull().default(0),
    unrealizedPnL: doublePrecision('unrealizedPnL').notNull().default(0),
    currentPnL: doublePrecision('currentPnL').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('UserPnLSnapshot_userId_snapshotAt_idx').on(
      table.userId,
      table.snapshotAt
    ),
    index('UserPnLSnapshot_snapshotAt_idx').on(table.snapshotAt),
    unique('UserPnLSnapshot_userId_snapshotAt_key').on(
      table.userId,
      table.snapshotAt
    ),
  ]
);

export type UserPnLSnapshot = typeof userPnLSnapshots.$inferSelect;
export type NewUserPnLSnapshot = typeof userPnLSnapshots.$inferInsert;
