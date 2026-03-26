import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { sentryIncidentAlertOutboxStatusEnum } from './enums';

export const sentryIncidentAlertOutboxes = pgTable(
  'SentryIncidentAlertOutbox',
  {
    id: text('id').primaryKey(),
    runId: text('runId'),
    inboxId: text('inboxId').notNull(),
    sentryIssueKey: text('sentryIssueKey').notNull(),
    eventType: text('eventType').notNull(),
    dedupeKey: text('dedupeKey').notNull().unique(),
    payload: json('payload').$type<JsonValue>().notNull(),
    status: sentryIncidentAlertOutboxStatusEnum('status')
      .notNull()
      .default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('maxAttempts').notNull().default(8),
    nextAttemptAt: timestamp('nextAttemptAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    processingStartedAt: timestamp('processingStartedAt', { mode: 'date' }),
    sentAt: timestamp('sentAt', { mode: 'date' }),
    lastError: text('lastError'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('SentryIncidentAlertOutbox_status_nextAttemptAt_idx').on(
      table.status,
      table.nextAttemptAt
    ),
    index('SentryIncidentAlertOutbox_issueKey_createdAt_idx').on(
      table.sentryIssueKey,
      table.createdAt
    ),
    index('SentryIncidentAlertOutbox_runId_idx').on(table.runId),
    index('SentryIncidentAlertOutbox_inboxId_idx').on(table.inboxId),
  ]
);

export type SentryIncidentAlertOutbox =
  typeof sentryIncidentAlertOutboxes.$inferSelect;
export type NewSentryIncidentAlertOutbox =
  typeof sentryIncidentAlertOutboxes.$inferInsert;
