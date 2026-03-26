import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { agentStatusEnum, agentTypeEnum } from './enums';

export const agentRegistries = pgTable(
  'AgentRegistry',
  {
    id: text('id').primaryKey(),
    agentId: text('agentId').notNull().unique(),
    type: agentTypeEnum('type').notNull(),
    status: agentStatusEnum('status').notNull().default('REGISTERED'),
    trustLevel: integer('trustLevel').notNull().default(0),
    userId: text('userId').unique(),
    actorId: text('actorId').unique(),
    name: text('name').notNull(),
    systemPrompt: text('systemPrompt').notNull(),
    discoveryCardVersion: text('discoveryCardVersion'),
    discoveryEndpointA2a: text('discoveryEndpointA2a'),
    discoveryEndpointMcp: text('discoveryEndpointMcp'),
    discoveryEndpointRpc: text('discoveryEndpointRpc'),
    discoveryAuthRequired: boolean('discoveryAuthRequired')
      .notNull()
      .default(false),
    discoveryAuthMethods: text('discoveryAuthMethods')
      .array()
      .notNull()
      .default([]),
    discoveryRateLimit: integer('discoveryRateLimit'),
    discoveryCostPerAction: doublePrecision('discoveryCostPerAction'),
    onChainTokenId: integer('onChainTokenId'),
    onChainTxHash: text('onChainTxHash'),
    onChainServerWallet: text('onChainServerWallet'),
    onChainReputationScore: integer('onChainReputationScore').default(0),
    onChainChainId: integer('onChainChainId'),
    onChainIdentityRegistry: text('onChainIdentityRegistry'),
    onChainReputationSystem: text('onChainReputationSystem'),
    agent0TokenId: text('agent0TokenId'),
    agent0MetadataCID: text('agent0MetadataCID'),
    agent0SubgraphOwner: text('agent0SubgraphOwner'),
    agent0SubgraphMetadataURI: text('agent0SubgraphMetadataURI'),
    agent0SubgraphTimestamp: integer('agent0SubgraphTimestamp'),
    agent0DiscoveryEndpoint: text('agent0DiscoveryEndpoint'),
    runtimeInstanceId: text('runtimeInstanceId').unique(),
    registeredAt: timestamp('registeredAt', { mode: 'date' })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp('lastActiveAt', { mode: 'date' }),
    terminatedAt: timestamp('terminatedAt', { mode: 'date' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('AgentRegistry_type_status_idx').on(table.type, table.status),
    index('AgentRegistry_trustLevel_idx').on(table.trustLevel),
    index('AgentRegistry_userId_idx').on(table.userId),
    index('AgentRegistry_actorId_idx').on(table.actorId),
    index('AgentRegistry_status_lastActiveAt_idx').on(
      table.status,
      table.lastActiveAt
    ),
    index('AgentRegistry_type_trustLevel_idx').on(table.type, table.trustLevel),
  ]
);

export type AgentRegistry = typeof agentRegistries.$inferSelect;
export type NewAgentRegistry = typeof agentRegistries.$inferInsert;
