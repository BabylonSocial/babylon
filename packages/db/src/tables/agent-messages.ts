import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const agentMessages = pgTable(
  'AgentMessage',
  {
    id: text('id').primaryKey(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    modelUsed: text('modelUsed'),
    pointsCost: integer('pointsCost').notNull().default(0),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    agentUserId: text('agentUserId').notNull(),
  },
  (table) => [
    index('AgentMessage_agentUserId_createdAt_idx').on(
      table.agentUserId,
      table.createdAt
    ),
    index('AgentMessage_role_idx').on(table.role),
  ]
);

export type AgentMessage = typeof agentMessages.$inferSelect;
export type NewAgentMessage = typeof agentMessages.$inferInsert;
