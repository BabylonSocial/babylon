import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const externalAgentConnections = pgTable(
  'ExternalAgentConnection',
  {
    id: text('id').primaryKey(),
    agentRegistryId: text('agentRegistryId').notNull().unique(),
    externalId: text('externalId').notNull().unique(),
    endpoint: text('endpoint').notNull(),
    protocol: text('protocol').notNull(),
    authType: text('authType'),
    authCredentials: text('authCredentials'),
    agentCardJson: json('agentCardJson').$type<JsonValue>(),
    isHealthy: boolean('isHealthy').notNull().default(true),
    lastHealthCheck: timestamp('lastHealthCheck', { mode: 'date' }),
    lastConnected: timestamp('lastConnected', { mode: 'date' }),
    registeredByUserId: text('registeredByUserId'),
    revokedAt: timestamp('revokedAt', { mode: 'date' }),
    revokedBy: text('revokedBy'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('ExternalAgentConnection_agentRegistryId_idx').on(
      table.agentRegistryId
    ),
    index('ExternalAgentConnection_externalId_idx').on(table.externalId),
    index('ExternalAgentConnection_protocol_idx').on(table.protocol),
    index('ExternalAgentConnection_isHealthy_idx').on(table.isHealthy),
    index('ExternalAgentConnection_revokedAt_idx').on(table.revokedAt),
  ]
);

export type ExternalAgentConnection =
  typeof externalAgentConnections.$inferSelect;
export type NewExternalAgentConnection =
  typeof externalAgentConnections.$inferInsert;
