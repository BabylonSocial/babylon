import { index, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const widgetCaches = pgTable(
  'WidgetCache',
  {
    widget: text('widget').primaryKey(),
    data: json('data').$type<JsonValue>().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('WidgetCache_widget_updatedAt_idx').on(table.widget, table.updatedAt),
  ]
);

export type WidgetCache = typeof widgetCaches.$inferSelect;
export type NewWidgetCache = typeof widgetCaches.$inferInsert;
