import { relations } from 'drizzle-orm';
import {
  decimal,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { users } from './user';

export const moderationEscrows = pgTable(
  'ModerationEscrow',
  {
    id: text('id').primaryKey(),
    recipientId: text('recipientId').notNull(),
    adminId: text('adminId').notNull(),
    amountUSD: decimal('amountUSD', { precision: 18, scale: 2 }).notNull(),
    amountWei: text('amountWei').notNull(),
    status: text('status').notNull().default('pending'),
    reason: text('reason'),
    paymentRequestId: text('paymentRequestId').unique(),
    paymentTxHash: text('paymentTxHash').unique(),
    refundTxHash: text('refundTxHash').unique(),
    refundedBy: text('refundedBy'),
    refundedAt: timestamp('refundedAt', { mode: 'date' }),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('ModerationEscrow_recipientId_createdAt_idx').on(
      table.recipientId,
      table.createdAt
    ),
    index('ModerationEscrow_adminId_idx').on(table.adminId),
    index('ModerationEscrow_status_idx').on(table.status),
    index('ModerationEscrow_paymentRequestId_idx').on(table.paymentRequestId),
    index('ModerationEscrow_paymentTxHash_idx').on(table.paymentTxHash),
    index('ModerationEscrow_createdAt_idx').on(table.createdAt),
  ]
);

export const moderationEscrowsRelations = relations(
  moderationEscrows,
  ({ one }) => ({
    recipient: one(users, {
      fields: [moderationEscrows.recipientId],
      references: [users.id],
    }),
    admin: one(users, {
      fields: [moderationEscrows.adminId],
      references: [users.id],
      relationName: 'ModerationEscrowAdmin',
    }),
    refundedByUser: one(users, {
      fields: [moderationEscrows.refundedBy],
      references: [users.id],
      relationName: 'ModerationEscrowRefundedBy',
    }),
  })
);

export type ModerationEscrow = typeof moderationEscrows.$inferSelect;
export type NewModerationEscrow = typeof moderationEscrows.$inferInsert;
