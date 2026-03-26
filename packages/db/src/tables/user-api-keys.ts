import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const userApiKeys = pgTable(
  'UserApiKey',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    keyHash: text('keyHash').notNull(),
    name: text('name'),
    lastUsedAt: timestamp('lastUsedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }),
    revokedAt: timestamp('revokedAt', { mode: 'date' }),
  },
  (table) => [
    index('UserApiKey_userId_idx').on(table.userId),
    index('UserApiKey_keyHash_idx').on(table.keyHash),
    index('UserApiKey_userId_revokedAt_idx').on(table.userId, table.revokedAt),
  ]
);

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type NewUserApiKey = typeof userApiKeys.$inferInsert;

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [userApiKeys.userId],
    references: [users.id],
    relationName: 'UserApiKey_userIdToUser',
  }),
}));
