import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable(
  'Organization',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    ticker: text('ticker'),
    description: text('description').notNull(),
    type: text('type').notNull(),
    canBeInvolved: boolean('canBeInvolved').notNull().default(true),
    initialPrice: doublePrecision('initialPrice'),
    currentPrice: doublePrecision('currentPrice'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    imageUrl: text('imageUrl'),
  },
  (table) => [
    index('Organization_currentPrice_idx').on(table.currentPrice),
    index('Organization_type_idx').on(table.type),
    index('Organization_ticker_idx').on(table.ticker),
  ]
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
