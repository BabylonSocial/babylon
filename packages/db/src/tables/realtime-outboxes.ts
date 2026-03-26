import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { realtimeOutboxStatusEnum } from './enums';

export const realtimeOutboxes = pgTable(
  'RealtimeOutbox',
  {
    id: text('id').primaryKey(),
    channel: text('channel').notNull(),
    type: text('type').notNull(),
    version: text('version').default('v1'),
    payload: json('payload').$type<JsonValue>().notNull(),
    status: realtimeOutboxStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('lastError'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('RealtimeOutbox_status_createdAt_idx').on(
      table.status,
      table.createdAt
    ),
    index('RealtimeOutbox_channel_status_idx').on(table.channel, table.status),
  ]
);

export type RealtimeOutbox = typeof realtimeOutboxes.$inferSelect;
export type NewRealtimeOutbox = typeof realtimeOutboxes.$inferInsert;
