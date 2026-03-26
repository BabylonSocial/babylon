import { index, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const gameConfigs = pgTable(
  'GameConfig',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull().unique(),
    value: json('value').$type<JsonValue>().notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [index('GameConfig_key_idx').on(table.key)]
);

export type GameConfig = typeof gameConfigs.$inferSelect;
export type NewGameConfig = typeof gameConfigs.$inferInsert;
