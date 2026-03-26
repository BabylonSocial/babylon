import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './user';

export const userBlocks = pgTable(
  'UserBlock',
  {
    id: text('id').primaryKey(),
    blockerId: text('blockerId').notNull(),
    blockedId: text('blockedId').notNull(),
    reason: text('reason'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('UserBlock_blockerId_blockedId_key').on(
      table.blockerId,
      table.blockedId
    ),
    index('UserBlock_blockerId_idx').on(table.blockerId),
    index('UserBlock_blockedId_idx').on(table.blockedId),
    index('UserBlock_createdAt_idx').on(table.createdAt),
  ]
);

export type UserBlock = typeof userBlocks.$inferSelect;
export type NewUserBlock = typeof userBlocks.$inferInsert;

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, {
    fields: [userBlocks.blockerId],
    references: [users.id],
    relationName: 'UserBlock_blockerIdToUser',
  }),
  blocked: one(users, {
    fields: [userBlocks.blockedId],
    references: [users.id],
    relationName: 'UserBlock_blockedIdToUser',
  }),
}));
