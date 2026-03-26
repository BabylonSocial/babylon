import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { sentryWebhookInboxStatusEnum } from './enums';

export const sentryWebhookInboxes = pgTable(
  'SentryWebhookInbox',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull().default('sentry'),
    resource: text('resource').notNull(),
    action: text('action'),
    organizationSlug: text('organizationSlug'),
    projectSlug: text('projectSlug'),
    issueId: text('issueId'),
    issueShortId: text('issueShortId'),
    issueTitle: text('issueTitle'),
    issueUrl: text('issueUrl'),
    eventId: text('eventId'),
    level: text('level'),
    culprit: text('culprit'),
    dedupeKey: text('dedupeKey').notNull().unique(),
    routingKey: text('routingKey'),
    webhookTimestamp: timestamp('webhookTimestamp', { mode: 'date' }),
    status: sentryWebhookInboxStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('maxAttempts').notNull().default(8),
    nextAttemptAt: timestamp('nextAttemptAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    processingStartedAt: timestamp('processingStartedAt', { mode: 'date' }),
    processedAt: timestamp('processedAt', { mode: 'date' }),
    failedAt: timestamp('failedAt', { mode: 'date' }),
    lastError: text('lastError'),
    payload: json('payload').$type<JsonValue>().notNull(),
    metadata: json('metadata').$type<JsonValue>(),
    receivedAt: timestamp('receivedAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('SentryWebhookInbox_status_nextAttemptAt_idx').on(
      table.status,
      table.nextAttemptAt
    ),
    index('SentryWebhookInbox_project_issue_status_idx').on(
      table.projectSlug,
      table.issueId,
      table.status
    ),
    index('SentryWebhookInbox_eventId_idx').on(table.eventId),
    index('SentryWebhookInbox_routingKey_status_idx').on(
      table.routingKey,
      table.status
    ),
    index('SentryWebhookInbox_receivedAt_idx').on(table.receivedAt),
    index('SentryWebhookInbox_resource_action_idx').on(
      table.resource,
      table.action
    ),
  ]
);

export type SentryWebhookInbox = typeof sentryWebhookInboxes.$inferSelect;
export type NewSentryWebhookInbox = typeof sentryWebhookInboxes.$inferInsert;
