import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const agentCapabilities = pgTable(
  'AgentCapability',
  {
    id: text('id').primaryKey(),
    agentRegistryId: text('agentRegistryId').notNull().unique(),
    strategies: text('strategies').array().notNull().default([]),
    markets: text('markets').array().notNull().default([]),
    actions: text('actions').array().notNull().default([]),
    version: text('version').notNull().default('1.0.0'),
    x402Support: boolean('x402Support').notNull().default(false),
    platform: text('platform'),
    userType: text('userType'),
    gameNetworkChainId: integer('gameNetworkChainId'),
    gameNetworkRpcUrl: text('gameNetworkRpcUrl'),
    gameNetworkExplorerUrl: text('gameNetworkExplorerUrl'),
    skills: text('skills').array().notNull().default([]),
    domains: text('domains').array().notNull().default([]),
    a2aEndpoint: text('a2aEndpoint'),
    mcpEndpoint: text('mcpEndpoint'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('AgentCapability_agentRegistryId_idx').on(table.agentRegistryId),
  ]
);

export type AgentCapability = typeof agentCapabilities.$inferSelect;
export type NewAgentCapability = typeof agentCapabilities.$inferInsert;
