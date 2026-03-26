import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('SystemSettings', {
  id: text('id').primaryKey().default('system'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;
