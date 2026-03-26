import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const twitterOAuthTokens = pgTable(
  'TwitterOAuthToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().unique(),
    oauth1Token: text('oauth1Token').notNull(),
    oauth1TokenSecret: text('oauth1TokenSecret').notNull(),
    screenName: text('screenName'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [index('TwitterOAuthToken_userId_idx').on(table.userId)]
);

export type TwitterOAuthToken = typeof twitterOAuthTokens.$inferSelect;
export type NewTwitterOAuthToken = typeof twitterOAuthTokens.$inferInsert;

export const twitterOAuthTokensRelations = relations(
  twitterOAuthTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [twitterOAuthTokens.userId],
      references: [users.id],
    }),
  })
);
