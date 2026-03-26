import { desc } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const worldFacts = pgTable(
  'WorldFact',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(),
    key: text('key').notNull(),
    label: text('label').notNull(),
    value: text('value').notNull(),
    source: text('source'),
    lastUpdated: timestamp('lastUpdated', { mode: 'date' }).notNull(),
    isActive: boolean('isActive').notNull().default(true),
    priority: integer('priority').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('WorldFact_category_isActive_idx').on(table.category, table.isActive),
    index('WorldFact_priority_idx').on(table.priority),
    index('WorldFact_lastUpdated_idx').on(table.lastUpdated),
    index('WorldFact_source_createdAt_idx').on(
      table.source,
      desc(table.createdAt)
    ),
  ]
);

export type WorldFact = typeof worldFacts.$inferSelect;
export type NewWorldFact = typeof worldFacts.$inferInsert;
