import { index, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const agentLogs = pgTable(
  'AgentLog',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    level: text('level').notNull(),
    message: text('message').notNull(),
    prompt: text('prompt'),
    completion: text('completion'),
    thinking: text('thinking'),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    agentUserId: text('agentUserId').notNull(),
  },
  (table) => [
    index('AgentLog_agentUserId_createdAt_idx').on(
      table.agentUserId,
      table.createdAt
    ),
    index('AgentLog_level_idx').on(table.level),
    index('AgentLog_type_createdAt_idx').on(table.type, table.createdAt),
  ]
);

export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;
