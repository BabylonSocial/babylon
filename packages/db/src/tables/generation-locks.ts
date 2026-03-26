import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const generationLocks = pgTable(
  'GenerationLock',
  {
    id: text('id').primaryKey().default('game-tick-lock'),
    lockedBy: text('lockedBy').notNull(),
    lockedAt: timestamp('lockedAt', { mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    operation: text('operation').notNull().default('game-tick'),
  },
  (table) => [index('GenerationLock_expiresAt_idx').on(table.expiresAt)]
);

export type GenerationLock = typeof generationLocks.$inferSelect;
export type NewGenerationLock = typeof generationLocks.$inferInsert;
