import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const TradeRecord = z
  .object({
    id: z.string(),
    userId: z.string(),
    marketId: z.string().optional(),
    side: z.string().meta({ description: 'Trade side (buy, sell)' }),
    amount: z.number(),
    price: z.number(),
    outcome: z.string().optional(),
    pnl: z.number().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    resolvedAt: z
      .string()
      .nullable()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
  })
  .passthrough()
  .meta({ id: 'TradeRecord' });

const LeaderboardEntry = z
  .object({
    userId: z.string(),
    username: z.string().nullable(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
    score: z.number(),
    rank: z.number(),
    pnl: z.number().optional(),
    winRate: z.number().optional(),
    totalTrades: z.number().optional(),
  })
  .meta({ id: 'LeaderboardEntry' });

const Organization = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    logoUrl: z.string().nullable().optional(),
    website: z.string().optional(),
    memberCount: z.number().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Organization' });

const Actor = z
  .object({
    id: z.string(),
    name: z.string(),
    username: z.string().nullable(),
    description: z.string().optional(),
    profileImageUrl: z.string().nullable(),
    type: z.string().meta({ description: 'Actor type (agent, user, system)' }),
    isActive: z.boolean(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Actor' });

const ActorStats = z
  .object({
    actorId: z.string(),
    postCount: z.number(),
    commentCount: z.number(),
    likeCount: z.number(),
    followerCount: z.number(),
    followingCount: z.number(),
    totalTrades: z.number().optional(),
    winRate: z.number().optional(),
    pnl: z.number().optional(),
  })
  .passthrough()
  .meta({ id: 'ActorStats' });

const RegistryEntity = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string().meta({ description: 'Entity type' }),
    status: z.string(),
    address: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .passthrough()
  .meta({ id: 'RegistryEntity' });

const Game = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    status: z
      .string()
      .meta({ description: 'Game status (active, upcoming, completed)' }),
    dayNumber: z.number().optional(),
    playerCount: z.number().optional(),
    startDate: z
      .string()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    endDate: z
      .string()
      .nullable()
      .optional()
      .meta({ description: 'ISO 8601 timestamp' }),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Game' });

const AgentTemplate = z
  .object({
    id: z.string(),
    archetype: z.string(),
    name: z.string(),
    description: z.string(),
    systemPrompt: z.string().optional(),
    personality: z.string().optional(),
    defaultConfig: z.record(z.string(), z.unknown()).optional(),
    imageUrl: z.string().nullable().optional(),
    category: z.string().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'AgentTemplate' });

const ReputationBreakdown = z
  .object({
    trading: z.number().optional(),
    social: z.number().optional(),
    accuracy: z.number().optional(),
    consistency: z.number().optional(),
  })
  .passthrough()
  .meta({ id: 'ReputationBreakdown' });

export const miscPaths: ZodOpenApiPathsObject = {
  '/api/trades': {
    get: {
      operationId: 'listTrades',
      tags: ['Trades'],
      summary: 'List trades',
      description:
        'Returns a paginated list of trades, optionally filtered by user.',
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Number of trades to return' }),
          offset: z
            .string()
            .optional()
            .meta({ description: 'Offset for pagination' }),
          userId: z
            .string()
            .optional()
            .meta({ description: 'Filter by user ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Trade list',
          content: {
            'application/json': {
              schema: z
                .object({
                  trades: z.array(TradeRecord),
                  total: z.number(),
                  hasMore: z.boolean(),
                })
                .meta({ id: 'ListTradesResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/trending/{tag}': {
    get: {
      operationId: 'getTrendingByTag',
      tags: ['Trending'],
      summary: 'Get posts by trending tag',
      description: 'Returns posts associated with the specified trending tag.',
      requestParams: {
        path: z.object({
          tag: z.string().meta({ description: 'Trending tag / hashtag' }),
        }),
      },
      responses: {
        '200': {
          description: 'Tagged posts',
          content: {
            'application/json': {
              schema: z
                .object({
                  tag: z.string(),
                  posts: z.array(
                    z.object({
                      id: z.string(),
                      content: z.string(),
                      authorId: z.string(),
                      authorName: z.string(),
                      authorUsername: z.string().nullable(),
                      authorProfileImageUrl: z.string().nullable(),
                      createdAt: z.string(),
                      likeCount: z.number(),
                      commentCount: z.number(),
                      shareCount: z.number(),
                    })
                  ),
                  total: z.number(),
                })
                .meta({ id: 'TrendingTagResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/reputation/{userId}': {
    get: {
      operationId: 'getUserReputation',
      tags: ['Reputation'],
      summary: 'Get user reputation',
      description: 'Returns the reputation score and breakdown for a user.',
      requestParams: {
        path: z.object({
          userId: z.string().meta({ description: 'User ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Reputation data',
          content: {
            'application/json': {
              schema: z
                .object({
                  userId: z.string(),
                  reputation: z.number(),
                  level: z.string(),
                  breakdown: ReputationBreakdown,
                })
                .meta({ id: 'UserReputationResponse' }),
            },
          },
        },
        '404': { description: 'User not found' },
      },
    },
  },

  '/api/reputation/leaderboard': {
    get: {
      operationId: 'getReputationLeaderboard',
      tags: ['Reputation'],
      summary: 'Reputation leaderboard',
      description: 'Returns users ranked by reputation score.',
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Number of entries to return' }),
        }),
      },
      responses: {
        '200': {
          description: 'Reputation leaderboard',
          content: {
            'application/json': {
              schema: z
                .object({
                  leaderboard: z.array(
                    z.object({
                      userId: z.string(),
                      username: z.string().nullable(),
                      displayName: z.string(),
                      profileImageUrl: z.string().nullable(),
                      score: z.number(),
                      rank: z.number(),
                    })
                  ),
                })
                .meta({ id: 'ReputationLeaderboardResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/leaderboard': {
    get: {
      operationId: 'getLeaderboard',
      tags: ['Leaderboard'],
      summary: 'Get leaderboard',
      description:
        'Returns the platform leaderboard, optionally filtered by timeframe.',
      requestParams: {
        query: z.object({
          timeframe: z.string().optional().meta({
            description: 'Timeframe filter (daily, weekly, monthly, allTime)',
          }),
          limit: z
            .string()
            .optional()
            .meta({ description: 'Number of entries to return' }),
        }),
      },
      responses: {
        '200': {
          description: 'Leaderboard data',
          content: {
            'application/json': {
              schema: z
                .object({
                  leaderboard: z.array(LeaderboardEntry),
                  timeframe: z.string(),
                })
                .meta({ id: 'LeaderboardResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/organizations': {
    get: {
      operationId: 'listOrganizations',
      tags: ['Organizations'],
      summary: 'List organizations',
      description: 'Returns all organizations.',
      responses: {
        '200': {
          description: 'Organization list',
          content: {
            'application/json': {
              schema: z
                .object({
                  organizations: z.array(Organization),
                })
                .meta({ id: 'ListOrganizationsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/actors': {
    get: {
      operationId: 'listActors',
      tags: ['Actors'],
      summary: 'List actors',
      description: 'Returns all actors (agents, users, system entities).',
      responses: {
        '200': {
          description: 'Actor list',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  actors: z.array(Actor),
                })
                .meta({ id: 'ListActorsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/actors/{actorId}/stats': {
    get: {
      operationId: 'getActorStats',
      tags: ['Actors'],
      summary: 'Get actor statistics',
      description: 'Returns activity and performance statistics for an actor.',
      requestParams: {
        path: z.object({
          actorId: z.string().meta({ description: 'Actor ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Actor stats',
          content: {
            'application/json': {
              schema: ActorStats,
            },
          },
        },
        '404': { description: 'Actor not found' },
      },
    },
  },

  '/api/registry': {
    get: {
      operationId: 'listRegistry',
      tags: ['Registry'],
      summary: 'List registry entities',
      description: 'Returns all entities in the on-chain registry.',
      responses: {
        '200': {
          description: 'Registry entities',
          content: {
            'application/json': {
              schema: z
                .object({
                  entities: z.array(RegistryEntity),
                })
                .meta({ id: 'ListRegistryResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/ticker': {
    get: {
      operationId: 'getTicker',
      tags: ['Ticker'],
      summary: 'Get ticker data',
      description: 'Returns real-time ticker / price feed data.',
      responses: {
        '200': {
          description: 'Ticker data',
          content: {
            'application/json': {
              schema: z
                .object({
                  prices: z
                    .array(
                      z.object({
                        symbol: z.string(),
                        price: z.number(),
                        change24h: z.number().optional(),
                        volume24h: z.number().optional(),
                        updatedAt: z
                          .string()
                          .meta({ description: 'ISO 8601 timestamp' }),
                      })
                    )
                    .optional(),
                  updatedAt: z
                    .string()
                    .meta({ description: 'ISO 8601 timestamp' }),
                })
                .passthrough()
                .meta({ id: 'TickerResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/games': {
    get: {
      operationId: 'listGames',
      tags: ['Games'],
      summary: 'List games',
      description: 'Returns all games on the platform.',
      responses: {
        '200': {
          description: 'Game list',
          content: {
            'application/json': {
              schema: z
                .object({
                  games: z.array(Game),
                })
                .meta({ id: 'ListGamesResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/game-assets': {
    get: {
      operationId: 'listGameAssets',
      tags: ['Games'],
      summary: 'List game assets',
      description: 'Returns available game assets and resources.',
      responses: {
        '200': {
          description: 'Game assets',
          content: {
            'application/json': {
              schema: z
                .object({
                  assets: z
                    .array(
                      z.object({
                        id: z.string(),
                        name: z.string(),
                        type: z.string(),
                        imageUrl: z.string().nullable().optional(),
                        rarity: z.string().optional(),
                        metadata: z.record(z.string(), z.unknown()).optional(),
                      })
                    )
                    .optional(),
                })
                .passthrough()
                .meta({ id: 'GameAssetsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/points/transfer': {
    post: {
      operationId: 'transferPoints',
      tags: ['Points'],
      summary: 'Transfer points',
      description:
        'Transfers points from the authenticated user to another user.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              toUserId: z.string().meta({ description: 'Recipient user ID' }),
              amount: z
                .number()
                .meta({ description: 'Number of points to transfer' }),
              reason: z
                .string()
                .optional()
                .meta({ description: 'Optional reason for transfer' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Transfer result',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  transfer: z.object({
                    id: z.string(),
                    fromUserId: z.string(),
                    toUserId: z.string(),
                    amount: z.number(),
                    reason: z.string().nullable(),
                    createdAt: z
                      .string()
                      .meta({ description: 'ISO 8601 timestamp' }),
                  }),
                })
                .meta({ id: 'TransferPointsResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Insufficient balance or invalid request' },
      },
    },
  },

  '/api/upload/image': {
    post: {
      operationId: 'uploadImage',
      tags: ['Upload'],
      summary: 'Upload an image',
      description: 'Uploads an image and returns the hosted URL.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.string().meta({ description: 'Image file (binary)' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Upload result',
          content: {
            'application/json': {
              schema: z
                .object({
                  url: z
                    .string()
                    .meta({ description: 'URL of the uploaded image' }),
                })
                .meta({ id: 'UploadImageResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Invalid file or file too large' },
      },
    },
  },

  '/api/onboarding/check-username': {
    get: {
      operationId: 'checkUsername',
      tags: ['Onboarding'],
      summary: 'Check username availability',
      description:
        'Checks whether a username is available and returns suggestions if taken.',
      requestParams: {
        query: z.object({
          username: z.string().meta({ description: 'Username to check' }),
        }),
      },
      responses: {
        '200': {
          description: 'Availability result',
          content: {
            'application/json': {
              schema: z
                .object({
                  available: z.boolean(),
                  suggestions: z
                    .array(z.string())
                    .optional()
                    .meta({ description: 'Alternative usernames if taken' }),
                })
                .meta({ id: 'CheckUsernameResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/onboarding/game-status': {
    get: {
      operationId: 'getOnboardingGameStatus',
      tags: ['Onboarding'],
      summary: 'Get onboarding game status',
      description:
        'Returns the onboarding game progress for the authenticated user.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Onboarding status',
          content: {
            'application/json': {
              schema: z
                .object({
                  status: z
                    .string()
                    .meta({ description: 'Overall onboarding status' }),
                  currentStep: z.string(),
                  completedSteps: z.array(z.string()),
                })
                .meta({ id: 'OnboardingGameStatusResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/twitter/auth-status': {
    get: {
      operationId: 'getTwitterAuthStatus',
      tags: ['Twitter'],
      summary: 'Get Twitter auth status',
      description:
        'Returns whether the authenticated user has connected their Twitter account.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Twitter connection status',
          content: {
            'application/json': {
              schema: z
                .object({
                  connected: z.boolean(),
                  username: z
                    .string()
                    .optional()
                    .meta({ description: 'Connected Twitter username' }),
                })
                .meta({ id: 'TwitterAuthStatusResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/activity/heartbeat': {
    post: {
      operationId: 'activityHeartbeat',
      tags: ['Activity'],
      summary: 'Send activity heartbeat',
      description:
        'Records a heartbeat to track user activity / online status.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                sessionId: z.string(),
                pageViews: z.number(),
                lastPath: z.string().optional(),
              })
              .meta({ id: 'HeartbeatBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Heartbeat acknowledged',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                })
                .meta({ id: 'HeartbeatResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/twitter/disconnect': {
    post: {
      operationId: 'disconnectTwitter',
      tags: ['Twitter'],
      summary: 'Disconnect Twitter account',
      description:
        'Disconnects the authenticated user\'s linked Twitter account.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '201': {
          description: 'Twitter disconnected',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                })
                .meta({ id: 'DisconnectTwitterResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/twitter/tweet': {
    post: {
      operationId: 'postTweet',
      tags: ['Twitter'],
      summary: 'Post a tweet',
      description:
        'Posts a tweet to the authenticated user\'s connected Twitter account.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                text: z.string().meta({ description: 'Tweet text' }),
                contentType: z
                  .enum(['market', 'profile', 'referral'])
                  .optional()
                  .meta({ description: 'Type of content being shared' }),
                contentId: z.string().optional(),
              })
              .meta({ id: 'PostTweetBody' }),
          },
        },
      },
      responses: {
        '201': {
          description: 'Tweet posted',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  tweet: z.object({
                    data: z.object({
                      id: z.string(),
                      text: z.string(),
                    }),
                  }),
                  tweetUrl: z.string(),
                })
                .meta({ id: 'PostTweetResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/points/purchase/create-payment': {
    post: {
      operationId: 'createPointsPayment',
      tags: ['Points'],
      summary: 'Create a points purchase payment',
      description: 'Initiates a crypto payment to purchase points.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                amountUSD: z.number(),
                fromAddress: z.string(),
              })
              .meta({ id: 'CreatePointsPaymentBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Payment request created',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  paymentRequest: z.object({
                    requestId: z.string(),
                    amount: z.string(),
                    from: z.string(),
                    to: z.string(),
                    expiresAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
                    pointsAmount: z.number(),
                    amountUSD: z.number(),
                  }),
                })
                .meta({ id: 'CreatePointsPaymentResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Invalid request' },
      },
    },
  },

  '/api/points/purchase/verify-payment': {
    post: {
      operationId: 'verifyPointsPayment',
      tags: ['Points'],
      summary: 'Verify a points purchase payment',
      description:
        'Verifies a crypto payment transaction and awards points.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                requestId: z.string(),
                txHash: z.string(),
                fromAddress: z.string(),
                toAddress: z.string(),
                amount: z.string(),
              })
              .meta({ id: 'VerifyPointsPaymentBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Payment verified and points awarded',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  pointsAwarded: z.number(),
                  newTotal: z.number(),
                  txHash: z.string(),
                })
                .meta({ id: 'VerifyPointsPaymentResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Invalid or expired payment request' },
      },
    },
  },

  '/api/stripe/checkout/session': {
    post: {
      operationId: 'createStripeCheckout',
      tags: ['Points'],
      summary: 'Create Stripe checkout session',
      description: 'Creates a Stripe checkout session for purchasing points.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                amountUSD: z.number(),
              })
              .meta({ id: 'StripeCheckoutBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Checkout session created',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  sessionId: z.string(),
                  url: z.string(),
                })
                .meta({ id: 'StripeCheckoutResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/auth/whoami': {
    get: {
      operationId: 'whoami',
      tags: ['Auth'],
      summary: 'Get authenticated user identity',
      description: 'Returns the user identity for the provided API key.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'User identity',
          content: {
            'application/json': {
              schema: z
                .object({
                  userId: z.string(),
                  username: z.string().nullable(),
                })
                .meta({ id: 'WhoamiResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/auth/siwe/authenticate': {
    post: {
      operationId: 'authenticateSiwe',
      tags: ['Auth'],
      summary: 'Authenticate with SIWE',
      description:
        'Authenticate using Sign-In with Ethereum (SIWE) message and signature.',
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                message: z.string(),
                signature: z.string(),
                username: z.string(),
              })
              .meta({ id: 'SiweAuthBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Authentication result',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  isNewUser: z.boolean(),
                  userId: z.string(),
                  username: z.string(),
                  walletAddress: z.string(),
                  apiKey: z.string(),
                })
                .meta({ id: 'SiweAuthResponse' }),
            },
          },
        },
        '400': { description: 'Invalid signature' },
      },
    },
  },

  '/api/agent-templates': {
    get: {
      operationId: 'listAgentTemplates',
      tags: ['AgentTemplates'],
      summary: 'List agent templates',
      description: 'Returns all available agent templates.',
      responses: {
        '200': {
          description: 'Template list',
          content: {
            'application/json': {
              schema: z
                .object({
                  templates: z.array(AgentTemplate),
                })
                .meta({ id: 'ListAgentTemplatesResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/agent-templates/{archetype}': {
    get: {
      operationId: 'getAgentTemplate',
      tags: ['AgentTemplates'],
      summary: 'Get agent template by archetype',
      description: 'Returns the full details for a specific agent template.',
      requestParams: {
        path: z.object({
          archetype: z
            .string()
            .meta({ description: 'Template archetype identifier' }),
        }),
      },
      responses: {
        '200': {
          description: 'Template details',
          content: {
            'application/json': {
              schema: AgentTemplate,
            },
          },
        },
        '404': { description: 'Template not found' },
      },
    },
  },
};
