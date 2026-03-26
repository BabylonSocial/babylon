import {
  doublePrecision,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const agentGoalActions = pgTable(
  'AgentGoalAction',
  {
    id: text('id').primaryKey(),
    goalId: text('goalId').notNull(),
    agentUserId: text('agentUserId').notNull(),
    actionType: text('actionType').notNull(),
    actionId: text('actionId'),
    impact: doublePrecision('impact').notNull(),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('AgentGoalAction_goalId_idx').on(table.goalId),
    index('AgentGoalAction_agentUserId_createdAt_idx').on(
      table.agentUserId,
      table.createdAt
    ),
    index('AgentGoalAction_actionType_idx').on(table.actionType),
  ]
);

export type AgentGoalAction = typeof agentGoalActions.$inferSelect;
export type NewAgentGoalAction = typeof agentGoalActions.$inferInsert;
