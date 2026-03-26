import {
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const agentGoals = pgTable(
  'AgentGoal',
  {
    id: text('id').primaryKey(),
    agentUserId: text('agentUserId').notNull(),
    type: text('type').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    target: json('target').$type<JsonValue>(),
    priority: integer('priority').notNull(),
    status: text('status').notNull().default('active'),
    progress: doublePrecision('progress').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    completedAt: timestamp('completedAt', { mode: 'date' }),
  },
  (table) => [
    index('AgentGoal_agentUserId_status_idx').on(
      table.agentUserId,
      table.status
    ),
    index('AgentGoal_priority_idx').on(table.priority),
    index('AgentGoal_status_idx').on(table.status),
    index('AgentGoal_createdAt_idx').on(table.createdAt),
  ]
);

export type AgentGoal = typeof agentGoals.$inferSelect;
export type NewAgentGoal = typeof agentGoals.$inferInsert;
