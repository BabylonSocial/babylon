import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const dmAcceptances = pgTable(
  'DMAcceptance',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull().unique(),
    userId: text('userId').notNull(),
    otherUserId: text('otherUserId').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    acceptedAt: timestamp('acceptedAt', { mode: 'date' }),
    rejectedAt: timestamp('rejectedAt', { mode: 'date' }),
  },
  (table) => [
    index('DMAcceptance_status_createdAt_idx').on(
      table.status,
      table.createdAt
    ),
    index('DMAcceptance_userId_status_idx').on(table.userId, table.status),
  ]
);

export type DMAcceptance = typeof dmAcceptances.$inferSelect;
export type NewDMAcceptance = typeof dmAcceptances.$inferInsert;
