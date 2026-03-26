import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { userAchievements } from './user-achievements';

export const achievementDefinitions = pgTable('AchievementDefinition', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  tier: text('tier').notNull(),
  iconKey: text('iconKey').notNull(),
  pointsReward: integer('pointsReward').notNull(),
  threshold: integer('threshold').notNull(),
  trackingType: text('trackingType').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export type AchievementDefinition = typeof achievementDefinitions.$inferSelect;
export type NewAchievementDefinition =
  typeof achievementDefinitions.$inferInsert;

export const achievementDefinitionsRelations = relations(
  achievementDefinitions,
  ({ many }) => ({
    userAchievements: many(userAchievements),
  })
);
