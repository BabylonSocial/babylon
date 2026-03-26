import { relations } from 'drizzle-orm';
import { agentCapabilities } from './agent-capabilities';
import { agentGoalActions } from './agent-goal-actions';
import { agentGoals } from './agent-goals';
import { agentLogs } from './agent-logs';
import { agentMessages } from './agent-messages';
import { agentPerformanceMetrics } from './agent-performance-metrics';
import { agentPointsTransactions } from './agent-points-transactions';
import { agentRegistries } from './agent-registries';
import { agentTrades } from './agent-trades';
import { externalAgentConnections } from './external-agent-connections';
import { users } from './user';

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  user: one(users, {
    fields: [agentLogs.agentUserId],
    references: [users.id],
  }),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  user: one(users, {
    fields: [agentMessages.agentUserId],
    references: [users.id],
  }),
}));

export const agentPerformanceMetricsRelations = relations(
  agentPerformanceMetrics,
  ({ one }) => ({
    user: one(users, {
      fields: [agentPerformanceMetrics.userId],
      references: [users.id],
    }),
  })
);

export const agentGoalsRelations = relations(agentGoals, ({ one, many }) => ({
  user: one(users, {
    fields: [agentGoals.agentUserId],
    references: [users.id],
  }),
  actions: many(agentGoalActions),
}));

export const agentGoalActionsRelations = relations(
  agentGoalActions,
  ({ one }) => ({
    goal: one(agentGoals, {
      fields: [agentGoalActions.goalId],
      references: [agentGoals.id],
    }),
    user: one(users, {
      fields: [agentGoalActions.agentUserId],
      references: [users.id],
    }),
  })
);

export const agentPointsTransactionsRelations = relations(
  agentPointsTransactions,
  ({ one }) => ({
    agentUser: one(users, {
      fields: [agentPointsTransactions.agentUserId],
      references: [users.id],
      relationName: 'AgentPointsTransaction_agentUserIdToUser',
    }),
    managerUser: one(users, {
      fields: [agentPointsTransactions.managerUserId],
      references: [users.id],
      relationName: 'AgentPointsTransaction_managerUserIdToUser',
    }),
  })
);

export const agentTradesRelations = relations(agentTrades, ({ one }) => ({
  user: one(users, {
    fields: [agentTrades.agentUserId],
    references: [users.id],
  }),
}));

export const agentRegistriesRelations = relations(
  agentRegistries,
  ({ one }) => ({
    user: one(users, {
      fields: [agentRegistries.userId],
      references: [users.id],
    }),
    capabilities: one(agentCapabilities, {
      fields: [agentRegistries.id],
      references: [agentCapabilities.agentRegistryId],
    }),
    externalConnection: one(externalAgentConnections, {
      fields: [agentRegistries.id],
      references: [externalAgentConnections.agentRegistryId],
    }),
  })
);

export const agentCapabilitiesRelations = relations(
  agentCapabilities,
  ({ one }) => ({
    agentRegistry: one(agentRegistries, {
      fields: [agentCapabilities.agentRegistryId],
      references: [agentRegistries.id],
    }),
  })
);

export const externalAgentConnectionsRelations = relations(
  externalAgentConnections,
  ({ one }) => ({
    agentRegistry: one(agentRegistries, {
      fields: [externalAgentConnections.agentRegistryId],
      references: [agentRegistries.id],
    }),
  })
);
