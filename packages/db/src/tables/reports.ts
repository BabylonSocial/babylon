import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const reports = pgTable(
  'Report',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporterId').notNull(),
    reportedUserId: text('reportedUserId'),
    reportedPostId: text('reportedPostId'),
    reportedCommentId: text('reportedCommentId'),
    reportType: text('reportType').notNull(),
    category: text('category').notNull(),
    reason: text('reason').notNull(),
    evidence: text('evidence'),
    status: text('status').notNull().default('pending'),
    priority: text('priority').notNull().default('normal'),
    resolution: text('resolution'),
    resolvedBy: text('resolvedBy'),
    resolvedAt: timestamp('resolvedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('Report_reporterId_idx').on(table.reporterId),
    index('Report_reportedUserId_idx').on(table.reportedUserId),
    index('Report_reportedPostId_idx').on(table.reportedPostId),
    index('Report_reportedCommentId_idx').on(table.reportedCommentId),
    index('Report_status_idx').on(table.status),
    index('Report_priority_status_idx').on(table.priority, table.status),
    index('Report_category_idx').on(table.category),
    index('Report_createdAt_idx').on(table.createdAt),
    index('Report_reportedUserId_status_idx').on(
      table.reportedUserId,
      table.status
    ),
    index('Report_reportedPostId_status_idx').on(
      table.reportedPostId,
      table.status
    ),
    index('Report_reportedCommentId_status_idx').on(
      table.reportedCommentId,
      table.status
    ),
  ]
);

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: 'Report_reporterIdToUser',
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
    relationName: 'Report_reportedUserIdToUser',
  }),
  resolver: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
    relationName: 'Report_resolvedByToUser',
  }),
}));

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
