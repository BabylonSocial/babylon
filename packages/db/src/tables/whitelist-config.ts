import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const whitelistConfig = pgTable('WhitelistConfig', {
  id: text('id').primaryKey(),
  leaderboardRankThreshold: integer('leaderboardRankThreshold'),
  leaderboardCategory: text('leaderboardCategory').notNull().default('all'),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  updatedBy: text('updatedBy').references(() => users.id, {
    onDelete: 'set null',
  }),
});

export type WhitelistConfigRow = typeof whitelistConfig.$inferSelect;
export type NewWhitelistConfigRow = typeof whitelistConfig.$inferInsert;

export const whitelistConfigRelations = relations(
  whitelistConfig,
  ({ one }) => ({
    updater: one(users, {
      fields: [whitelistConfig.updatedBy],
      references: [users.id],
    }),
  })
);
