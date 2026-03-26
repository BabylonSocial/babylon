import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const tickTokenStats = pgTable(
  'TickTokenStats',
  {
    id: text('id').primaryKey(),
    tickId: text('tickId').notNull(),
    tickStartedAt: timestamp('tickStartedAt', { mode: 'date' }).notNull(),
    tickCompletedAt: timestamp('tickCompletedAt', { mode: 'date' }).notNull(),
    tickDurationMs: integer('tickDurationMs').notNull(),
    totalCalls: integer('totalCalls').notNull(),
    totalInputTokens: integer('totalInputTokens').notNull(),
    totalOutputTokens: integer('totalOutputTokens').notNull(),
    totalTokens: integer('totalTokens').notNull(),
    byPromptType: json('byPromptType').$type<JsonValue>().notNull(),
    byModel: json('byModel').$type<JsonValue>().notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('TickTokenStats_tickStartedAt_idx').on(table.tickStartedAt),
    index('TickTokenStats_tickId_idx').on(table.tickId),
    index('TickTokenStats_createdAt_idx').on(table.createdAt),
  ]
);

export type TickTokenStatsRow = typeof tickTokenStats.$inferSelect;
export type NewTickTokenStatsRow = typeof tickTokenStats.$inferInsert;
