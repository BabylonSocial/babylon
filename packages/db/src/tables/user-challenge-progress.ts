import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { challengeDefinitions } from './challenge-definitions';
import { users } from './user';

export const userChallengeProgress = pgTable(
  'UserChallengeProgress',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    challengeId: text('challengeId').notNull(),
    periodKey: text('periodKey').notNull(),
    progress: integer('progress').notNull().default(0),
    completed: integer('completed').notNull().default(0),
    completedAt: timestamp('completedAt', { mode: 'date' }),
    pointsAwarded: integer('pointsAwarded').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('UserChallengeProgress_userId_challengeId_periodKey_idx').on(
      table.userId,
      table.challengeId,
      table.periodKey
    ),
    index('UserChallengeProgress_userId_periodKey_idx').on(
      table.userId,
      table.periodKey
    ),
  ]
);

export type UserChallengeProgressRecord =
  typeof userChallengeProgress.$inferSelect;
export type NewUserChallengeProgress =
  typeof userChallengeProgress.$inferInsert;

export const userChallengeProgressRelations = relations(
  userChallengeProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userChallengeProgress.userId],
      references: [users.id],
    }),
    challenge: one(challengeDefinitions, {
      fields: [userChallengeProgress.challengeId],
      references: [challengeDefinitions.id],
    }),
  })
);
