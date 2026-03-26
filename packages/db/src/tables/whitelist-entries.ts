import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const whitelist = pgTable(
  'Whitelist',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    source: text('source')
      .notNull()
      .$type<'snapshot_first_100' | 'admin_manual' | 'leaderboard'>(),
    reason: text('reason'),
    grantedBy: text('grantedBy').references(() => users.id, {
      onDelete: 'set null',
    }),
    grantedAt: timestamp('grantedAt', { mode: 'date' }).notNull().defaultNow(),
    revokedAt: timestamp('revokedAt', { mode: 'date' }),
  },
  (table) => [
    index('Whitelist_userId_idx').on(table.userId),
    index('Whitelist_source_idx').on(table.source),
    index('Whitelist_revokedAt_idx').on(table.revokedAt),
  ]
);

export type WhitelistRow = typeof whitelist.$inferSelect;
export type NewWhitelistRow = typeof whitelist.$inferInsert;

export const whitelistRelations = relations(whitelist, ({ one }) => ({
  user: one(users, {
    fields: [whitelist.userId],
    references: [users.id],
  }),
  granter: one(users, {
    fields: [whitelist.grantedBy],
    references: [users.id],
    relationName: 'Whitelist_grantedByToUser',
  }),
}));
