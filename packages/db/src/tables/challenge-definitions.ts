import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { userChallengeProgress } from './user-challenge-progress';

export const challengeDefinitions = pgTable('ChallengeDefinition', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  pool: text('pool').notNull(),
  category: text('category').notNull(),
  iconKey: text('iconKey').notNull(),
  pointsReward: integer('pointsReward').notNull(),
  threshold: integer('threshold').notNull(),
  trackingType: text('trackingType').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export type ChallengeDefinition = typeof challengeDefinitions.$inferSelect;
export type NewChallengeDefinition = typeof challengeDefinitions.$inferInsert;

export const challengeDefinitionsRelations = relations(
  challengeDefinitions,
  ({ many }) => ({
    progress: many(userChallengeProgress),
  })
);
