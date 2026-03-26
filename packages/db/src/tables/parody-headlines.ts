import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const parodyHeadlines = pgTable(
  'ParodyHeadline',
  {
    id: text('id').primaryKey(),
    originalHeadlineId: text('originalHeadlineId').notNull().unique(),
    originalTitle: text('originalTitle').notNull(),
    originalSource: text('originalSource').notNull(),
    parodyTitle: text('parodyTitle').notNull(),
    parodyContent: text('parodyContent'),
    characterMappings: json('characterMappings').$type<JsonValue>().notNull(),
    organizationMappings: json('organizationMappings')
      .$type<JsonValue>()
      .notNull(),
    generatedAt: timestamp('generatedAt', { mode: 'date' }).notNull(),
    isUsed: boolean('isUsed').notNull().default(false),
    usedAt: timestamp('usedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('ParodyHeadline_isUsed_generatedAt_idx').on(
      table.isUsed,
      table.generatedAt
    ),
    index('ParodyHeadline_generatedAt_idx').on(table.generatedAt),
  ]
);

export type ParodyHeadline = typeof parodyHeadlines.$inferSelect;
export type NewParodyHeadline = typeof parodyHeadlines.$inferInsert;
