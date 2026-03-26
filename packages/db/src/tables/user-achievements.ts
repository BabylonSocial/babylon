import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { achievementDefinitions } from './achievement-definitions';
import { users } from './user';

export const userAchievements = pgTable(
  'UserAchievement',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    achievementId: text('achievementId').notNull(),
    unlockedAt: timestamp('unlockedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    pointsAwarded: integer('pointsAwarded').notNull(),
  },
  (table) => [
    unique('UserAchievement_userId_achievementId_idx').on(
      table.userId,
      table.achievementId
    ),
    index('UserAchievement_userId_idx').on(table.userId),
    index('UserAchievement_userId_unlockedAt_idx').on(
      table.userId,
      table.unlockedAt
    ),
    index('UserAchievement_unlockedAt_idx').on(table.unlockedAt),
  ]
);

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achievementDefinitions, {
      fields: [userAchievements.achievementId],
      references: [achievementDefinitions.id],
    }),
  })
);
