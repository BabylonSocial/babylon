import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const sentryIncidentDiscordThreads = pgTable(
  'SentryIncidentDiscordThread',
  {
    id: text('id').primaryKey(),
    sentryIssueKey: text('sentryIssueKey').notNull().unique(),
    channelId: text('channelId').notNull(),
    rootMessageId: text('rootMessageId').notNull(),
    threadId: text('threadId').notNull().unique(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('SentryIncidentDiscordThread_threadId_idx').on(table.threadId),
  ]
);

export type SentryIncidentDiscordThread =
  typeof sentryIncidentDiscordThreads.$inferSelect;
export type NewSentryIncidentDiscordThread =
  typeof sentryIncidentDiscordThreads.$inferInsert;
