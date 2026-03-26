import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './user';

export const favorites = pgTable(
  'Favorite',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    targetUserId: text('targetUserId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('Favorite_userId_targetUserId_key').on(
      table.userId,
      table.targetUserId
    ),
    index('Favorite_targetUserId_idx').on(table.targetUserId),
    index('Favorite_userId_idx').on(table.userId),
  ]
);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export const favoritesRelations = relations(favorites, ({ one }) => ({
  User_Favorite_targetUserIdToUser: one(users, {
    fields: [favorites.targetUserId],
    references: [users.id],
    relationName: 'Favorite_targetUserIdToUser',
  }),
  User_Favorite_userIdToUser: one(users, {
    fields: [favorites.userId],
    references: [users.id],
    relationName: 'Favorite_userIdToUser',
  }),
}));
