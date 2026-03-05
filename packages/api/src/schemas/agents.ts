import { z } from 'zod';

export const agentIdParam = z.object({
  agentId: z.string().meta({ description: 'Agent ID' }),
});

export const AgentSummary = z
  .object({
    id: z.string(),
    username: z.string(),
    name: z.string().meta({ description: 'Display name' }),
    description: z.string().meta({ description: 'Bio / description' }),
    profileImageUrl: z.string(),
    virtualBalance: z.number(),
    autonomousEnabled: z.boolean(),
    autonomousTrading: z.boolean(),
    autonomousPosting: z.boolean(),
    autonomousCommenting: z.boolean(),
    autonomousDMs: z.boolean(),
    autonomousGroupChats: z.boolean(),
    modelTier: z.string(),
    status: z.string(),
    isActive: z.boolean(),
    lifetimePnL: z
      .string()
      .meta({ description: 'Lifetime PnL as decimal string' }),
    totalTrades: z.number(),
    profitableTrades: z.number(),
    winRate: z.number(),
    lastTickAt: z.string().optional(),
    lastChatAt: z.string().optional(),
    walletAddress: z.string(),
    onChainRegistered: z.boolean(),
    agent0TokenId: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'AgentSummary' });

export const AgentDetail = AgentSummary.extend({
  system: z.string(),
  bio: z.array(z.string()),
  personality: z.string(),
  tradingStrategy: z.string(),
  coverImageUrl: z.string(),
  totalDeposited: z
    .string()
    .meta({ description: 'Total deposited as decimal string' }),
  totalWithdrawn: z
    .string()
    .meta({ description: 'Total withdrawn as decimal string' }),
  a2aEnabled: z.boolean(),
  errorMessage: z.string().nullable(),
}).meta({ id: 'AgentDetail' });

export const UpdateAgentBody = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    profileImageUrl: z.string().optional(),
    system: z.string().optional(),
    bio: z.array(z.string()).optional(),
    personality: z.string().optional(),
    tradingStrategy: z.string().optional(),
    modelTier: z.string().optional(),
    autonomousEnabled: z.boolean().optional(),
    autonomousPosting: z.boolean().optional(),
    a2aEnabled: z.boolean().optional(),
  })
  .meta({ id: 'UpdateAgentBody' });

export const UpdateAgentResponse = z
  .object({
    success: z.literal(true),
    agent: z.object({
      id: z.string(),
      username: z.string(),
      name: z.string(),
      description: z.string(),
      profileImageUrl: z.string(),
      coverImageUrl: z.string(),
      virtualBalance: z.number(),
      autonomousTrading: z.boolean(),
      autonomousPosting: z.boolean(),
      modelTier: z.string(),
      updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    }),
  })
  .meta({ id: 'UpdateAgentResponse' });

export const AgentChatMessage = z
  .object({
    id: z.string(),
    role: z
      .string()
      .meta({ description: 'Message role: user | assistant | system' }),
    content: z.string(),
    modelUsed: z.string().optional(),
    pointsCost: z.number().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'AgentChatMessage' });

export const ChatSendBody = z
  .object({
    message: z.string(),
    usePro: z.boolean().optional(),
  })
  .meta({ id: 'ChatSendBody' });

export const ChatSendResponse = z
  .object({
    success: z.literal(true),
    messageId: z.string(),
    response: z.string(),
    pointsCost: z.number(),
    modelUsed: z.string(),
    balanceAfter: z.number(),
    isLLMFailure: z.boolean(),
    metadata: z.object({
      inputTokens: z.number(),
      outputTokens: z.number(),
      responseTimeMs: z.number(),
    }),
  })
  .meta({ id: 'ChatSendResponse' });

export const AgentActivity = z
  .object({
    id: z.string(),
    type: z
      .string()
      .meta({ description: 'Activity type: trade | post | comment' }),
    description: z.string(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    tokenSymbol: z.string().optional(),
    tokenName: z.string().optional(),
    action: z
      .string()
      .optional()
      .meta({ description: 'Trade action: buy | sell' }),
    amount: z.string().optional(),
    price: z.string().optional(),
    pnl: z.string().optional(),
    postId: z.string().optional(),
    postContent: z.string().optional(),
    commentId: z.string().optional(),
    commentContent: z.string().optional(),
  })
  .meta({ id: 'AgentActivity' });

export const AgentActivityWithAgent = AgentActivity.extend({
  agentId: z.string(),
  agentName: z.string(),
  agentUsername: z.string(),
  agentProfileImageUrl: z.string().optional(),
}).meta({ id: 'AgentActivityWithAgent' });

export const RecentTrade = z
  .object({
    id: z.string(),
    tokenAddress: z.string(),
    tokenSymbol: z.string(),
    tokenName: z.string(),
    action: z.string().meta({ description: 'Trade action: buy | sell' }),
    amount: z.string().meta({ description: 'Token amount as decimal string' }),
    price: z
      .string()
      .meta({ description: 'Price per token as decimal string' }),
    totalValue: z
      .string()
      .meta({ description: 'Total trade value as decimal string' }),
    pnl: z
      .string()
      .optional()
      .meta({ description: 'Realized PnL as decimal string' }),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'RecentTrade' });

export const Transaction = z
  .object({
    id: z.string(),
    type: z
      .string()
      .meta({ description: 'Transaction type: deposit | withdraw | trade' }),
    amount: z.string().meta({ description: 'Amount as decimal string' }),
    balanceAfter: z
      .string()
      .meta({ description: 'Balance after transaction as decimal string' }),
    description: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Transaction' });

export const AgentLog = z
  .object({
    id: z.string(),
    type: z
      .string()
      .meta({ description: 'Log type: chat | trade | system | error' }),
    level: z
      .string()
      .meta({ description: 'Log level: info | warn | error | debug' }),
    message: z.string(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .meta({ id: 'AgentLog' });

export const AgentCard = z
  .object({
    name: z.string(),
    description: z.string(),
    url: z.string(),
    version: z.string(),
    profileImageUrl: z.string().optional(),
    capabilities: z.object({
      chat: z.boolean(),
      trading: z.boolean(),
      posting: z.boolean(),
      a2a: z.boolean(),
    }),
    skills: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    ),
    provider: z
      .object({
        organization: z.string(),
        url: z.string().optional(),
      })
      .optional(),
    defaultInputModes: z.array(z.string()),
    defaultOutputModes: z.array(z.string()),
  })
  .meta({ id: 'AgentCard' });

export const DiscoverableAgent = z
  .object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    description: z.string(),
    profileImageUrl: z.string().optional(),
    type: z.string(),
    skills: z.array(z.string()),
    domains: z.array(z.string()),
    url: z.string().optional(),
    isActive: z.boolean(),
    autonomousTrading: z.boolean(),
    winRate: z.number(),
    totalTrades: z.number(),
  })
  .meta({ id: 'DiscoverableAgent' });

export const ListAgentsResponse = z
  .object({
    success: z.literal(true),
    agents: z.array(AgentSummary),
  })
  .meta({ id: 'ListAgentsResponse' });

export const GetAgentResponse = z
  .object({
    success: z.literal(true),
    agent: AgentDetail,
  })
  .meta({ id: 'GetAgentResponse' });

export const DeleteAgentResponse = z
  .object({
    success: z.literal(true),
    message: z.string(),
  })
  .meta({ id: 'DeleteAgentResponse' });

export const ChatHistoryResponse = z
  .object({
    success: z.literal(true),
    messages: z.array(AgentChatMessage),
    pagination: z.object({
      hasMore: z.boolean(),
      nextCursor: z.string().optional(),
    }),
  })
  .meta({ id: 'ChatHistoryResponse' });

export const AgentActivityResponse = z
  .object({
    success: z.literal(true),
    agentId: z.string(),
    agentName: z.string(),
    activities: z.array(AgentActivity),
    pagination: z.object({
      limit: z.number(),
      count: z.number(),
      hasMore: z.boolean(),
    }),
  })
  .meta({ id: 'AgentActivityResponse' });

export const RecentTradesResponse = z
  .object({
    success: z.literal(true),
    agentId: z.string(),
    agentName: z.string(),
    isAgent: z.boolean(),
    trades: z.array(RecentTrade),
    totalTrades: z.number(),
  })
  .meta({ id: 'RecentTradesResponse' });

export const TradingBalanceResponse = z
  .object({
    success: z.literal(true),
    agentBalance: z.object({
      tradingBalance: z
        .string()
        .meta({ description: 'Trading balance as decimal string' }),
      lifetimePnL: z
        .string()
        .meta({ description: 'Lifetime PnL as decimal string' }),
      totalDeposited: z
        .string()
        .meta({ description: 'Total deposited as decimal string' }),
      totalWithdrawn: z
        .string()
        .meta({ description: 'Total withdrawn as decimal string' }),
    }),
    userBalance: z
      .string()
      .meta({ description: 'User balance as decimal string' }),
    transactions: z.array(Transaction),
  })
  .meta({ id: 'TradingBalanceResponse' });

export const TradingBalanceActionBody = z
  .object({
    action: z.enum(['deposit', 'withdraw']),
    amount: z.number().meta({ description: 'Amount to deposit or withdraw' }),
  })
  .meta({ id: 'TradingBalanceActionBody' });

export const TradingBalanceActionResponse = z
  .object({
    success: z.literal(true),
    agentBalance: z.object({
      tradingBalance: z
        .string()
        .meta({ description: 'Trading balance as decimal string' }),
      lifetimePnL: z
        .string()
        .meta({ description: 'Lifetime PnL as decimal string' }),
    }),
    userBalance: z
      .string()
      .meta({ description: 'User balance as decimal string' }),
    message: z.string(),
  })
  .meta({ id: 'TradingBalanceActionResponse' });

export const AgentLogsResponse = z
  .object({
    success: z.literal(true),
    logs: z.array(AgentLog),
  })
  .meta({ id: 'AgentLogsResponse' });

export const DiscoverAgentsResponse = z
  .object({
    agents: z.array(DiscoverableAgent),
    total: z.number(),
    filter: z.object({
      types: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
      domains: z.array(z.string()).optional(),
      search: z.string().optional(),
    }),
  })
  .meta({ id: 'DiscoverAgentsResponse' });

export const SearchAgentsResponse = z
  .object({
    agents: z.array(
      z.object({
        id: z.string(),
        displayName: z.string(),
        username: z.string(),
        profileImageUrl: z.string().nullable(),
        bio: z.string().nullable(),
        type: z.string(),
      })
    ),
  })
  .meta({ id: 'SearchAgentsResponse' });

export const AgentGoal = z
  .object({
    id: z.string(),
    agentUserId: z.string(),
    type: z.string().meta({
      description:
        'Goal type: trading | social | learning | reputation | custom',
    }),
    name: z.string(),
    description: z.string(),
    target: z.unknown().nullable(),
    priority: z.number(),
    status: z.string().meta({
      description: 'Goal status: active | paused | completed | failed',
    }),
    progress: z.number(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'AgentGoal' });

export const GenerateProfileBody = z
  .object({
    archetype: z
      .object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
      .optional(),
    userProfile: z.string().optional(),
    existingProfile: z.string().optional(),
  })
  .meta({ id: 'GenerateProfileBody' });

export const GenerateProfileResponse = z
  .object({
    success: z.literal(true),
    name: z.string(),
    description: z.string(),
    system: z.string(),
    bio: z.array(z.string()),
    personality: z.string(),
    tradingStrategy: z.string(),
  })
  .meta({ id: 'GenerateProfileResponse' });

export const GenerateFieldBody = z
  .object({
    fieldName: z.string(),
    currentValue: z.string().optional(),
    context: z.string().optional(),
  })
  .meta({ id: 'GenerateFieldBody' });

export const GenerateFieldResponse = z
  .object({
    success: z.literal(true),
    value: z.string(),
  })
  .meta({ id: 'GenerateFieldResponse' });

export const AllAgentsActivityResponse = z
  .object({
    success: z.literal(true),
    activities: z.array(AgentActivityWithAgent),
    pagination: z.object({
      limit: z.number(),
      count: z.number(),
      hasMore: z.boolean(),
    }),
  })
  .meta({ id: 'AllAgentsActivityResponse' });

export const ExternalAgentConnectBody = z
  .object({
    externalId: z.string().min(1),
    apiKey: z.string().regex(/^bab_(live|test)_[a-f0-9]{64}$/),
  })
  .meta({ id: 'ExternalAgentConnectBody' });

export const ExternalAgentDiscoverBody = z
  .object({
    types: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    minTrustLevel: z.coerce.number().min(0).max(4).optional(),
    requiredCapabilities: z.array(z.string()).optional(),
    requiredSkills: z.array(z.string()).optional(),
    requiredDomains: z.array(z.string()).optional(),
    matchMode: z.enum(['all', 'any']).optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .meta({ id: 'ExternalAgentDiscoverBody' });

export const ExternalAgentRegisterBody = z
  .object({
    externalId: z.string().min(1).max(255),
    name: z.string().min(1).max(255),
    description: z.string(),
    endpoint: z.string().url(),
    protocol: z.enum(['a2a', 'mcp', 'agent0', 'custom']),
    capabilities: z.object({
      strategies: z.array(z.string()).optional().default([]),
      markets: z.array(z.string()).optional().default([]),
      actions: z.array(z.string()).optional().default([]),
      version: z.string().optional().default('1.0.0'),
      skills: z.array(z.string()).optional().default([]),
      domains: z.array(z.string()).optional().default([]),
      x402Support: z.boolean().optional(),
      platform: z.string().optional(),
    }),
    authentication: z
      .object({
        type: z.enum(['API_KEY', 'OAUTH', 'JWT', 'MUTUAL_TLS']),
        credentials: z.record(z.string(), z.any()).optional(),
      })
      .optional(),
    agentCard: z
      .object({
        version: z.literal('1.0'),
        agentId: z.string(),
        name: z.string(),
        description: z.string(),
        endpoints: z.object({
          a2a: z.string().optional(),
          mcp: z.string().optional(),
          rpc: z.string().optional(),
        }),
        capabilities: z.object({
          strategies: z.array(z.string()).optional().default([]),
          markets: z.array(z.string()).optional().default([]),
          actions: z.array(z.string()).optional().default([]),
          version: z.string().optional().default('1.0.0'),
          skills: z.array(z.string()).optional().default([]),
          domains: z.array(z.string()).optional().default([]),
          x402Support: z.boolean().optional(),
          platform: z.string().optional(),
        }),
        authentication: z
          .object({
            required: z.boolean(),
            methods: z.array(z.enum(['apiKey', 'oauth', 'wallet'])),
          })
          .optional(),
        limits: z
          .object({
            rateLimit: z.number().optional(),
            costPerAction: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .meta({ id: 'ExternalAgentRegisterBody' });

export const UpdateConversationBody = z
  .object({
    action: z.enum(['switch', 'rename']),
    title: z.string().max(100).optional(),
  })
  .meta({ id: 'UpdateConversationBody' });

export const CreateConversationBody = z
  .object({
    title: z.string().max(100).optional(),
  })
  .meta({ id: 'CreateConversationBody' });

export const TeamChatMessageBody = z
  .object({
    content: z
      .string()
      .min(1, 'Message content is required')
      .max(4000, 'Message too long. Maximum 4000 characters allowed.'),
    targetIds: z.array(z.string()).optional(),
  })
  .meta({ id: 'TeamChatMessageBody' });

export const TeamChatTypingBody = z
  .object({
    isTyping: z.boolean(),
  })
  .meta({ id: 'TeamChatTypingBody' });
