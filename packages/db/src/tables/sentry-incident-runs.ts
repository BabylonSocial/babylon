import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import {
  sentryIncidentRunDecisionEnum,
  sentryIncidentRunStatusEnum,
} from './enums';

export const sentryIncidentRuns = pgTable(
  'SentryIncidentRun',
  {
    id: text('id').primaryKey(),
    inboxId: text('inboxId').notNull(),
    sentryIssueKey: text('sentryIssueKey').notNull(),
    issueId: text('issueId'),
    issueShortId: text('issueShortId'),
    action: text('action'),
    workerId: text('workerId').notNull(),
    status: sentryIncidentRunStatusEnum('status').notNull().default('running'),
    decision: sentryIncidentRunDecisionEnum('decision')
      .notNull()
      .default('pending'),
    linearIssueId: text('linearIssueId'),
    linearIssueUrl: text('linearIssueUrl'),
    codexSessionId: text('codexSessionId'),
    summary: text('summary'),
    resultReason: text('resultReason'),
    error: text('error'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    finishedAt: timestamp('finishedAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('SentryIncidentRun_inboxId_idx').on(table.inboxId),
    index('SentryIncidentRun_issueKey_createdAt_idx').on(
      table.sentryIssueKey,
      table.createdAt
    ),
    index('SentryIncidentRun_linearIssueId_idx').on(table.linearIssueId),
    index('SentryIncidentRun_status_createdAt_idx').on(
      table.status,
      table.createdAt
    ),
  ]
);

export type SentryIncidentRun = typeof sentryIncidentRuns.$inferSelect;
export type NewSentryIncidentRun = typeof sentryIncidentRuns.$inferInsert;
