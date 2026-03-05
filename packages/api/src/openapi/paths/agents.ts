import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  agentIdParam,
  AgentCard,
  AgentActivityResponse,
  AgentGoal,
  AgentLogsResponse,
  AllAgentsActivityResponse,
  ChatHistoryResponse,
  ChatSendBody,
  ChatSendResponse,
  DeleteAgentResponse,
  DiscoverAgentsResponse,
  GenerateFieldBody,
  GenerateFieldResponse,
  GenerateProfileBody,
  GenerateProfileResponse,
  GetAgentResponse,
  ListAgentsResponse,
  RecentTradesResponse,
  SearchAgentsResponse,
  TradingBalanceActionBody,
  TradingBalanceActionResponse,
  TradingBalanceResponse,
  UpdateAgentBody,
  UpdateAgentResponse,
} from '../../schemas/agents';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const agentPaths: ZodOpenApiPathsObject = {
  '/api/agents': {
    get: {
      operationId: 'listAgents',
      tags: ['Agents'],
      summary: 'List user agents',
      description:
        'Returns all agents owned by the authenticated user with performance statistics.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          autonomousTrading: z.string().optional().meta({
            description: 'Filter by autonomous trading status (true/false)',
          }),
        }),
      },
      responses: {
        '200': {
          description: 'List of agents',
          content: { 'application/json': { schema: ListAgentsResponse } },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/agents/discover': {
    get: {
      operationId: 'discoverAgents',
      tags: ['Agents'],
      summary: 'Discover agents',
      description:
        'Browse and search publicly discoverable agents with optional filters.',
      requestParams: {
        query: z.object({
          types: z
            .string()
            .optional()
            .meta({ description: 'Comma-separated agent types' }),
          skills: z
            .string()
            .optional()
            .meta({ description: 'Comma-separated skill tags' }),
          domains: z
            .string()
            .optional()
            .meta({ description: 'Comma-separated domain tags' }),
          search: z
            .string()
            .optional()
            .meta({ description: 'Free-text search query' }),
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max results to return (default 20)' }),
          offset: z
            .string()
            .optional()
            .meta({ description: 'Number of results to skip for pagination' }),
        }),
      },
      responses: {
        '200': {
          description: 'Discoverable agents',
          content: { 'application/json': { schema: DiscoverAgentsResponse } },
        },
      },
    },
  },

  '/api/agents/search': {
    get: {
      operationId: 'searchAgents',
      tags: ['Agents'],
      summary: 'Search agents',
      description:
        'Search for agents by name or username. Minimum 2 characters required.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          q: z
            .string()
            .min(2)
            .meta({ description: 'Search query (min 2 characters)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Search results',
          content: { 'application/json': { schema: SearchAgentsResponse } },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/agents/generate-profile': {
    post: {
      operationId: 'generateAgentProfile',
      tags: ['Agents'],
      summary: 'Generate agent profile',
      description:
        'Generate a complete agent profile using AI based on an optional archetype and context.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: { 'application/json': { schema: GenerateProfileBody } },
      },
      responses: {
        '200': {
          description: 'Generated profile',
          content: { 'application/json': { schema: GenerateProfileResponse } },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/agents/generate-field': {
    post: {
      operationId: 'generateAgentField',
      tags: ['Agents'],
      summary: 'Generate a single agent field',
      description:
        'Generate or regenerate a single profile field using AI with optional current value and context.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: { 'application/json': { schema: GenerateFieldBody } },
      },
      responses: {
        '200': {
          description: 'Generated field value',
          content: { 'application/json': { schema: GenerateFieldResponse } },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/agents/activity': {
    get: {
      operationId: 'listAllAgentsActivity',
      tags: ['Agents'],
      summary: 'List activity across all user agents',
      description:
        'Returns a combined activity feed for all agents owned by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max results to return (default 20)' }),
          type: z.string().optional().meta({
            description:
              'Filter by activity type: all | trade | post | comment',
          }),
        }),
      },
      responses: {
        '200': {
          description: 'Activity feed across all agents',
          content: {
            'application/json': { schema: AllAgentsActivityResponse },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/agents/{agentId}': {
    get: {
      operationId: 'getAgent',
      tags: ['Agents'],
      summary: 'Get agent details',
      description:
        'Returns full details of an agent owned by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      responses: {
        '200': {
          description: 'Agent details',
          content: { 'application/json': { schema: GetAgentResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
    put: {
      operationId: 'updateAgent',
      tags: ['Agents'],
      summary: 'Update agent',
      description: 'Update fields on an agent owned by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      requestBody: {
        content: { 'application/json': { schema: UpdateAgentBody } },
      },
      responses: {
        '200': {
          description: 'Updated agent',
          content: { 'application/json': { schema: UpdateAgentResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
    delete: {
      operationId: 'deleteAgent',
      tags: ['Agents'],
      summary: 'Delete agent',
      description:
        'Permanently delete an agent owned by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      responses: {
        '200': {
          description: 'Agent deleted',
          content: { 'application/json': { schema: DeleteAgentResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/chat': {
    post: {
      operationId: 'sendAgentChatMessage',
      tags: ['Agents'],
      summary: 'Send chat message to agent',
      description:
        'Send a message to an agent and receive an AI-generated response.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      requestBody: {
        content: { 'application/json': { schema: ChatSendBody } },
      },
      responses: {
        '200': {
          description: 'Chat response',
          content: { 'application/json': { schema: ChatSendResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
    get: {
      operationId: 'getChatHistory',
      tags: ['Agents'],
      summary: 'Get chat history',
      description: 'Returns paginated chat history for an agent.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: agentIdParam,
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max messages to return (default 50)' }),
          cursor: z.string().optional().meta({
            description: 'Cursor for pagination (message ID or timestamp)',
          }),
        }),
      },
      responses: {
        '200': {
          description: 'Chat history',
          content: { 'application/json': { schema: ChatHistoryResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/activity': {
    get: {
      operationId: 'getAgentActivity',
      tags: ['Agents'],
      summary: 'Get agent activity',
      description: 'Returns a paginated activity feed for a specific agent.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: agentIdParam,
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max results 1-100 (default 20)' }),
          type: z.string().optional().meta({
            description:
              'Filter by activity type: all | trade | post | comment',
          }),
        }),
      },
      responses: {
        '200': {
          description: 'Agent activity feed',
          content: { 'application/json': { schema: AgentActivityResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/recent-trades': {
    get: {
      operationId: 'getRecentTrades',
      tags: ['Agents'],
      summary: 'Get recent trades',
      description:
        'Returns the most recent trades for an agent. Public endpoint.',
      requestParams: {
        path: agentIdParam,
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max trades to return 1-20 (default 10)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Recent trades',
          content: { 'application/json': { schema: RecentTradesResponse } },
        },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/trading-balance': {
    get: {
      operationId: 'getTradingBalance',
      tags: ['Agents'],
      summary: 'Get agent trading balance',
      description:
        'Returns the trading balance, lifetime PnL, and transaction history for an agent.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      responses: {
        '200': {
          description: 'Trading balance details',
          content: { 'application/json': { schema: TradingBalanceResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
    post: {
      operationId: 'updateTradingBalance',
      tags: ['Agents'],
      summary: 'Deposit or withdraw trading balance',
      description:
        "Deposit funds to or withdraw funds from an agent's trading balance.",
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      requestBody: {
        content: { 'application/json': { schema: TradingBalanceActionBody } },
      },
      responses: {
        '200': {
          description: 'Updated balances',
          content: {
            'application/json': { schema: TradingBalanceActionResponse },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/logs': {
    get: {
      operationId: 'getAgentLogs',
      tags: ['Agents'],
      summary: 'Get agent logs',
      description:
        'Returns logs for an agent with optional type and level filters.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: agentIdParam,
        query: z.object({
          type: z.string().optional().meta({
            description: 'Filter by log type: chat | trade | system | error',
          }),
          level: z.string().optional().meta({
            description: 'Filter by log level: info | warn | error | debug',
          }),
          limit: z
            .string()
            .optional()
            .meta({ description: 'Max logs to return (default 50)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Agent logs',
          content: { 'application/json': { schema: AgentLogsResponse } },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/card': {
    get: {
      operationId: 'getAgentCard',
      tags: ['Agents'],
      summary: 'Get agent A2A card',
      description:
        'Returns the public Agent-to-Agent card describing capabilities and skills. Public endpoint.',
      requestParams: { path: agentIdParam },
      responses: {
        '200': {
          description: 'Agent card',
          content: { 'application/json': { schema: AgentCard } },
        },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/benchmark': {
    post: {
      operationId: 'runAgentBenchmark',
      tags: ['Agents'],
      summary: 'Run agent benchmark',
      description:
        'Run a performance benchmark against the specified agent. Owner only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                benchmarkPath: z.string().optional(),
                benchmarkData: z.unknown().optional(),
                runs: z.number().optional(),
                outputDir: z.string().optional(),
              })
              .meta({ id: 'RunBenchmarkBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Benchmark results',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  runs: z.number(),
                  results: z.object({
                    totalPnl: z.number(),
                    predictionAccuracy: z.number(),
                    perpWinRate: z.number(),
                    optimalityScore: z.number(),
                    actionsExecuted: z.number(),
                    duration: z.number(),
                    outputDir: z.string(),
                    avgPnl: z.number().optional(),
                    avgAccuracy: z.number().optional(),
                    avgOptimality: z.number().optional(),
                    avgActions: z.number().optional(),
                  }),
                })
                .meta({ id: 'BenchmarkResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/goals': {
    get: {
      operationId: 'listAgentGoals',
      tags: ['Agents'],
      summary: 'List agent goals',
      description: 'Returns all goals for the specified agent. Manager only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      responses: {
        '200': {
          description: 'Agent goals',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  goals: z.array(AgentGoal),
                })
                .meta({ id: 'ListAgentGoalsResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
    post: {
      operationId: 'createAgentGoal',
      tags: ['Agents'],
      summary: 'Create agent goal',
      description: 'Create a new goal for the specified agent. Manager only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: agentIdParam },
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                type: z.enum([
                  'trading',
                  'social',
                  'learning',
                  'reputation',
                  'custom',
                ]),
                name: z.string(),
                description: z.string(),
                target: z.string().optional(),
                priority: z.number().optional().meta({
                  description: 'Priority 1-10, default 5',
                }),
              })
              .meta({ id: 'CreateAgentGoalBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Created goal',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  goal: AgentGoal,
                })
                .meta({ id: 'CreateAgentGoalResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Agent not found' },
      },
    },
  },

  '/api/agents/{agentId}/goals/{goalId}': {
    get: {
      operationId: 'getAgentGoal',
      tags: ['Agents'],
      summary: 'Get agent goal',
      description: 'Returns a specific goal with its action history.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          agentId: z.string(),
          goalId: z.string(),
        }),
      },
      responses: {
        '200': {
          description: 'Goal details',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  goal: AgentGoal.extend({
                    completedAt: z.string().nullable().optional(),
                    AgentGoalAction: z
                      .array(
                        z.object({
                          id: z.string(),
                          type: z.string(),
                          description: z.string(),
                          result: z.unknown().nullable(),
                          createdAt: z.string(),
                        })
                      )
                      .optional(),
                  }),
                })
                .meta({ id: 'GetAgentGoalResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Goal not found' },
      },
    },
    put: {
      operationId: 'updateAgentGoal',
      tags: ['Agents'],
      summary: 'Update agent goal',
      description: 'Update a specific goal for the agent.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          agentId: z.string(),
          goalId: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                name: z.string().optional(),
                description: z.string().optional(),
                target: z.string().optional(),
                priority: z.number().optional(),
                status: z
                  .enum(['active', 'paused', 'completed', 'failed'])
                  .optional(),
              })
              .meta({ id: 'UpdateAgentGoalBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Updated goal',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                goal: AgentGoal,
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Goal not found' },
      },
    },
    delete: {
      operationId: 'deleteAgentGoal',
      tags: ['Agents'],
      summary: 'Delete agent goal',
      description: 'Delete a specific goal.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          agentId: z.string(),
          goalId: z.string(),
        }),
      },
      responses: {
        '200': {
          description: 'Goal deleted',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Goal not found' },
      },
    },
  },
};
