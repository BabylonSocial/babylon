import { index, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const adminAuditLogs = pgTable(
  'AdminAuditLog',
  {
    id: text('id').primaryKey(),
    adminId: text('adminId').notNull(),
    action: text('action').notNull(),
    resourceType: text('resourceType').notNull(),
    resourceId: text('resourceId'),
    previousValue: json('previousValue').$type<JsonValue>(),
    newValue: json('newValue').$type<JsonValue>(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('AdminAuditLog_adminId_idx').on(table.adminId),
    index('AdminAuditLog_action_idx').on(table.action),
    index('AdminAuditLog_resourceType_idx').on(table.resourceType),
    index('AdminAuditLog_resourceId_idx').on(table.resourceId),
    index('AdminAuditLog_createdAt_idx').on(table.createdAt),
    index('AdminAuditLog_adminId_createdAt_idx').on(
      table.adminId,
      table.createdAt
    ),
  ]
);

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;
