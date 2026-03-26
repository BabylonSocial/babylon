import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const agentPointsTransactions = pgTable(
  'AgentPointsTransaction',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    amount: integer('amount').notNull(),
    balanceBefore: decimal('balanceBefore', {
      precision: 18,
      scale: 2,
    }).notNull(),
    balanceAfter: decimal('balanceAfter', {
      precision: 18,
      scale: 2,
    }).notNull(),
    description: text('description').notNull(),
    relatedId: text('relatedId'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    agentUserId: text('agentUserId').notNull(),
    managerUserId: text('managerUserId').notNull(),
  },
  (table) => [
    index('AgentPointsTransaction_agentUserId_createdAt_idx').on(
      table.agentUserId,
      table.createdAt
    ),
    index('AgentPointsTransaction_managerUserId_createdAt_idx').on(
      table.managerUserId,
      table.createdAt
    ),
    index('AgentPointsTransaction_type_idx').on(table.type),
  ]
);

export type AgentPointsTransaction =
  typeof agentPointsTransactions.$inferSelect;
export type NewAgentPointsTransaction =
  typeof agentPointsTransactions.$inferInsert;
