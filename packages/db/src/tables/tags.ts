import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const tags = pgTable(
  'Tag',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    displayName: text('displayName').notNull(),
    category: text('category'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [index('Tag_name_idx').on(table.name)]
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
