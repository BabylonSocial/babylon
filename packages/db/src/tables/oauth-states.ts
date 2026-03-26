import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const oAuthStates = pgTable(
  'OAuthState',
  {
    id: text('id').primaryKey(),
    state: text('state').notNull().unique(),
    codeVerifier: text('codeVerifier').notNull(),
    userId: text('userId'),
    returnPath: text('returnPath'),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('OAuthState_expiresAt_idx').on(table.expiresAt),
    index('OAuthState_state_idx').on(table.state),
  ]
);

export type OAuthState = typeof oAuthStates.$inferSelect;
export type NewOAuthState = typeof oAuthStates.$inferInsert;
