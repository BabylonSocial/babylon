import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

// ---------------------------------------------------------------------------
// Reusable schemas
// ---------------------------------------------------------------------------

const UserBalanceResponse = z
  .object({
    balance: z
      .string()
      .meta({ description: 'Virtual balance as decimal string' }),
    totalDeposited: z
      .string()
      .meta({ description: 'Total deposited as decimal string' }),
    totalWithdrawn: z
      .string()
      .meta({ description: 'Total withdrawn as decimal string' }),
    lifetimePnL: z
      .string()
      .meta({ description: 'Lifetime PnL as decimal string' }),
  })
  .meta({ id: 'UserBalanceResponse' });

const UserStats = z
  .object({
    followers: z.number(),
    following: z.number(),
    positions: z.number(),
    comments: z.number(),
    reactions: z.number(),
    posts: z.number(),
  })
  .meta({ id: 'UserStats' });

const UserProfile = z
  .object({
    id: z.string(),
    privyId: z.string(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    coverImageUrl: z.string().nullable(),
    walletAddress: z.string().nullable(),
    email: z.string().nullable(),
    emailVerified: z.boolean(),
    profileComplete: z.boolean(),
    hasUsername: z.boolean(),
    hasBio: z.boolean(),
    hasProfileImage: z.boolean(),
    onChainRegistered: z.boolean(),
    nftTokenId: z.string().nullable(),
    agent0TokenId: z.string().nullable(),
    referralCode: z.string().nullable(),
    referredBy: z.string().nullable(),
    reputationPoints: z.number(),
    virtualBalance: z.number(),
    isAdmin: z.boolean(),
    isActor: z.boolean(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    stats: UserStats.optional(),
  })
  .meta({ id: 'UserProfile' });

const UserPublicStats = z
  .object({
    positions: z.number(),
    comments: z.number(),
    reactions: z.number(),
    followers: z.number(),
    following: z.number(),
    posts: z.number(),
  })
  .meta({ id: 'UserPublicStats' });

const UserPublicProfile = z
  .object({
    id: z.string(),
    walletAddress: z.string().nullable(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    coverImageUrl: z.string().nullable(),
    isActor: z.boolean(),
    isAgent: z.boolean(),
    managedBy: z.string().nullable(),
    profileComplete: z.boolean(),
    onChainRegistered: z.boolean(),
    nftTokenId: z.string().nullable(),
    virtualBalance: z.number(),
    lifetimePnL: z.number(),
    reputationPoints: z.number(),
    totalPoints: z.number(),
    referralCode: z.string().nullable(),
    hasFarcaster: z.boolean(),
    hasTwitter: z.boolean(),
    farcasterUsername: z.string().nullable(),
    twitterUsername: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    stats: UserPublicStats,
  })
  .meta({ id: 'UserPublicProfile' });

const SearchUserResult = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
    isAgent: z.boolean().optional(),
  })
  .meta({ id: 'SearchUserResult' });

const FollowUser = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
    followedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    isActor: z.boolean(),
    isMutualFollow: z.boolean().optional(),
  })
  .meta({ id: 'FollowUser' });

const FollowTarget = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
  })
  .meta({ id: 'FollowTarget' });

const Activity = z
  .object({
    id: z.string(),
    type: z.enum(['points', 'post', 'comment', 'trade']),
    description: z.string(),
    points: z.number().optional(),
    referenceId: z.string().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Activity' });

const UserCommentPreview = z
  .object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    userId: z.string(),
    userName: z.string(),
    userUsername: z.string().nullable(),
    userAvatar: z.string().nullable(),
    likeCount: z.number(),
  })
  .meta({ id: 'UserCommentPreview' });

const UserOriginalPost = z
  .object({
    id: z.string(),
    content: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    authorUsername: z.string().nullable(),
    authorProfileImageUrl: z.string().nullable(),
    timestamp: z.string(),
  })
  .meta({ id: 'UserOriginalPost' });

const UserPost = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    content: z.string(),
    fullContent: z.string().optional(),
    articleTitle: z.string().optional(),
    byline: z.string().optional(),
    category: z.string().optional(),
    author: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    authorUsername: z.string().nullable(),
    authorProfileImageUrl: z.string().nullable(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    gameId: z.string().optional(),
    dayNumber: z.number().optional(),
    likeCount: z.number(),
    commentCount: z.number(),
    shareCount: z.number(),
    isLiked: z.boolean(),
    isShared: z.boolean(),
    commentPreviews: z.array(UserCommentPreview).optional(),
    isRepost: z.boolean().optional(),
    isQuote: z.boolean().optional(),
    quoteComment: z.string().nullable().optional(),
    originalPostId: z.string().optional(),
    originalPost: UserOriginalPost.nullable().optional(),
  })
  .meta({ id: 'UserPost' });

const ApiKey = z
  .object({
    id: z.string(),
    name: z.string(),
    maskedKey: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    lastUsedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
  })
  .meta({ id: 'ApiKey' });

const BlockRecord = z
  .object({
    id: z.string(),
    blockerId: z.string(),
    blockedId: z.string(),
    reason: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'BlockRecord' });

const MuteRecord = z
  .object({
    id: z.string(),
    muterId: z.string(),
    mutedId: z.string(),
    reason: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'MuteRecord' });

const FavoriteProfile = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
    isActor: z.boolean(),
    postCount: z.number(),
    favoriteCount: z.number(),
    favoritedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    isFavorited: z.boolean(),
  })
  .meta({ id: 'FavoriteProfile' });

const FavoriteTarget = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
  })
  .meta({ id: 'FavoriteTarget' });

// ---------------------------------------------------------------------------
// Shared path params
// ---------------------------------------------------------------------------

const userIdPath = z.object({
  userId: z.string().meta({ description: 'User ID' }),
});

const profileIdPath = z.object({
  id: z.string().meta({ description: 'Profile / User ID' }),
});

// ---------------------------------------------------------------------------
// User paths
// ---------------------------------------------------------------------------

export const userPaths: ZodOpenApiPathsObject = {
  '/api/users/{userId}/balance': {
    get: {
      operationId: 'getUserBalance',
      tags: ['Users'],
      summary: 'Get user balance',
      description:
        'Returns virtual balance, deposit/withdrawal totals, and lifetime PnL. Public endpoint with IP-based rate limiting.',
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'User balance data',
          content: { 'application/json': { schema: UserBalanceResponse } },
        },
        '429': {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: z.object({
                error: z.string(),
                retryAfter: z
                  .number()
                  .meta({ description: 'Seconds until retry is allowed' }),
              }),
            },
          },
        },
      },
    },
  },

  '/api/users/me': {
    get: {
      operationId: 'getCurrentUser',
      tags: ['Users'],
      summary: 'Get current authenticated user',
      description:
        'Returns the authenticated user profile with onboarding status.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Current user profile',
          content: {
            'application/json': {
              schema: z
                .object({
                  authenticated: z.literal(true),
                  needsOnboarding: z.boolean(),
                  needsOnchain: z.boolean(),
                  user: UserProfile,
                })
                .meta({ id: 'GetCurrentUserResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/search': {
    get: {
      operationId: 'searchUsers',
      tags: ['Users'],
      summary: 'Search users',
      description: 'Search users by username or display name.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          q: z
            .string()
            .min(2)
            .meta({ description: 'Search query (min 2 characters)' }),
          includeAgents: z
            .boolean()
            .optional()
            .meta({ description: 'Include agent accounts in results' }),
        }),
      },
      responses: {
        '200': {
          description: 'Search results',
          content: {
            'application/json': {
              schema: z.object({ users: z.array(SearchUserResult) }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/{userId}/profile': {
    get: {
      operationId: 'getUserProfile',
      tags: ['Users'],
      summary: 'Get user public profile',
      description: 'Returns the public profile for a user.',
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'User public profile',
          content: {
            'application/json': {
              schema: z.object({ user: UserPublicProfile.nullable() }),
            },
          },
        },
      },
    },
  },

  '/api/users/{userId}/followers': {
    get: {
      operationId: 'getUserFollowers',
      tags: ['Users'],
      summary: 'Get user followers',
      description:
        'Returns the list of followers for a user. Optional auth adds mutual follow info.',
      security: [{ PrivyAuth: [] }, {}],
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'List of followers',
          content: {
            'application/json': {
              schema: z.object({
                followers: z.array(FollowUser),
                count: z.number(),
              }),
            },
          },
        },
      },
    },
  },

  '/api/users/{userId}/following': {
    get: {
      operationId: 'getUserFollowing',
      tags: ['Users'],
      summary: 'Get users followed by user',
      description:
        'Returns the list of users this user follows. Optional auth adds mutual follow info.',
      security: [{ PrivyAuth: [] }, {}],
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'List of followed users',
          content: {
            'application/json': {
              schema: z.object({
                following: z.array(FollowUser),
                count: z.number(),
              }),
            },
          },
        },
      },
    },
  },

  '/api/users/{userId}/follow': {
    get: {
      operationId: 'checkFollowStatus',
      tags: ['Users'],
      summary: 'Check if following a user',
      description:
        'Check whether the authenticated user follows the specified user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'Follow status',
          content: {
            'application/json': {
              schema: z.object({ isFollowing: z.boolean() }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'followUser',
      tags: ['Users'],
      summary: 'Follow a user',
      description: 'Follow the specified user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      responses: {
        '201': {
          description: 'Follow created',
          content: {
            'application/json': {
              schema: z.object({
                id: z.string(),
                following: FollowTarget.nullable(),
                createdAt: z
                  .string()
                  .meta({ description: 'ISO 8601 timestamp' }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    delete: {
      operationId: 'unfollowUser',
      tags: ['Users'],
      summary: 'Unfollow a user',
      description: 'Unfollow the specified user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'Unfollowed successfully',
          content: {
            'application/json': {
              schema: z.object({ message: z.string() }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/{userId}/activity': {
    get: {
      operationId: 'getUserActivity',
      tags: ['Users'],
      summary: 'Get user activity',
      description: 'Returns the activity feed for a user. Owner only.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: userIdPath,
        query: z.object({
          limit: z
            .number()
            .min(1)
            .max(100)
            .optional()
            .meta({ description: 'Number of activities to return (1-100)' }),
          type: z
            .enum(['all', 'points', 'post', 'comment', 'trade'])
            .optional()
            .meta({ description: 'Filter by activity type' }),
        }),
      },
      responses: {
        '200': {
          description: 'User activity feed',
          content: {
            'application/json': {
              schema: z.object({
                userId: z.string(),
                activities: z.array(Activity),
                pagination: z.object({
                  limit: z.number(),
                  count: z.number(),
                  hasMore: z.boolean(),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden — owner only' },
      },
    },
  },

  '/api/users/{userId}/posts': {
    get: {
      operationId: 'getUserPosts',
      tags: ['Users'],
      summary: 'Get user posts',
      description:
        'Returns posts or replies by a user. Public with optional auth.',
      security: [{ PrivyAuth: [] }, {}],
      requestParams: {
        path: userIdPath,
        query: z.object({
          type: z
            .enum(['posts', 'replies'])
            .optional()
            .meta({ description: 'Filter by post type' }),
          page: z.number().optional().meta({ description: 'Page number' }),
          limit: z.number().optional().meta({ description: 'Items per page' }),
        }),
      },
      responses: {
        '200': {
          description: 'User posts',
          content: {
            'application/json': {
              schema: z.object({
                type: z.enum(['posts', 'replies']),
                items: z.array(UserPost),
                total: z.number(),
              }),
            },
          },
        },
      },
    },
  },

  '/api/users/{userId}/block': {
    post: {
      operationId: 'blockUser',
      tags: ['Users'],
      summary: 'Block or unblock a user',
      description: 'Block or unblock the specified user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum(['block', 'unblock']),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Block action result',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                block: BlockRecord.optional(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/{userId}/mute': {
    post: {
      operationId: 'muteUser',
      tags: ['Users'],
      summary: 'Mute or unmute a user',
      description: 'Mute or unmute the specified user.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum(['mute', 'unmute']),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Mute action result',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                mute: MuteRecord.optional(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/{userId}/update-profile': {
    post: {
      operationId: 'updateUserProfile',
      tags: ['Users'],
      summary: 'Update user profile',
      description:
        'Update profile fields for the authenticated user. Owner only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                username: z.string().optional(),
                displayName: z.string().optional(),
                bio: z.string().optional(),
                profileImageUrl: z.string().optional(),
                coverImageUrl: z.string().optional(),
                showTwitterPublic: z.boolean().optional(),
                showFarcasterPublic: z.boolean().optional(),
                showWalletPublic: z.boolean().optional(),
                onchainTxHash: z.string().optional(),
              })
              .meta({ id: 'UpdateProfileBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Updated profile',
          content: {
            'application/json': {
              schema: z
                .object({
                  user: z.object({
                    id: z.string(),
                    username: z.string().nullable(),
                    displayName: z.string().nullable(),
                    bio: z.string().nullable(),
                    profileImageUrl: z.string().nullable(),
                    coverImageUrl: z.string().nullable(),
                    profileComplete: z.boolean(),
                    hasUsername: z.boolean(),
                    hasBio: z.boolean(),
                    hasProfileImage: z.boolean(),
                    reputationPoints: z.number(),
                    referralCount: z.number().optional(),
                    referralCode: z.string().nullable(),
                    onChainRegistered: z.boolean(),
                    nftTokenId: z.string().nullable(),
                  }),
                  message: z.string(),
                  pointsAwarded: z
                    .array(
                      z.object({
                        reason: z.string(),
                        amount: z.number(),
                      })
                    )
                    .optional(),
                  onchain: z
                    .object({
                      txHash: z.string(),
                      metadata: z.record(z.string(), z.unknown()),
                      backendSigned: z.boolean(),
                    })
                    .nullable()
                    .optional(),
                })
                .meta({ id: 'UpdateProfileResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden — owner only' },
      },
    },
  },

  '/api/users/{userId}/link-social': {
    post: {
      operationId: 'linkSocialAccount',
      tags: ['Users'],
      summary: 'Link a social account',
      description:
        'Link a social platform account (Farcaster, Twitter, or wallet) to the user profile.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                platform: z.enum(['farcaster', 'twitter', 'wallet']),
                username: z.string().optional(),
                address: z
                  .string()
                  .optional()
                  .meta({ description: '0x-prefixed wallet address' }),
              })
              .meta({ id: 'LinkSocialBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Social account linked',
          content: {
            'application/json': {
              schema: z
                .object({
                  platform: z.string(),
                  linked: z.boolean(),
                  alreadyLinked: z.boolean(),
                  points: z
                    .object({
                      awarded: z.number(),
                      newTotal: z.number(),
                    })
                    .nullable(),
                })
                .meta({ id: 'LinkSocialResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden — owner only' },
      },
    },
  },

  '/api/users/{userId}/is-new': {
    get: {
      operationId: 'checkUserIsNew',
      tags: ['Users'],
      summary: 'Check if user needs setup',
      description:
        'Check whether the user needs initial profile setup. Owner only.',
      security: [{ PrivyAuth: [] }],
      requestParams: { path: userIdPath },
      responses: {
        '200': {
          description: 'User setup status',
          content: {
            'application/json': {
              schema: z.object({
                needsSetup: z.boolean(),
                profileComplete: z.boolean().optional(),
                hasUsername: z.boolean().optional(),
                hasBio: z.boolean().optional(),
                hasProfileImage: z.boolean().optional(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden — owner only' },
      },
    },
  },

  '/api/users/api-keys': {
    get: {
      operationId: 'listApiKeys',
      tags: ['Users'],
      summary: 'List API keys',
      description: 'Returns all API keys for the authenticated user.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'List of API keys',
          content: {
            'application/json': {
              schema: z.object({ keys: z.array(ApiKey) }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'createApiKey',
      tags: ['Users'],
      summary: 'Create API key',
      description: 'Generate a new API key for the authenticated user.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Newly created API key',
          content: {
            'application/json': {
              schema: z.object({
                id: z.string(),
                apiKey: z
                  .string()
                  .meta({ description: 'Full API key — only shown once' }),
                name: z.string(),
                createdAt: z
                  .string()
                  .meta({ description: 'ISO 8601 timestamp' }),
                message: z.string(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/api-keys/{keyId}': {
    delete: {
      operationId: 'deleteApiKey',
      tags: ['Users'],
      summary: 'Delete API key',
      description: 'Delete a specific API key.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          keyId: z.string().meta({ description: 'API key ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'API key deleted',
          content: {
            'application/json': {
              schema: z.object({ message: z.string() }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/daily-login': {
    get: {
      operationId: 'getDailyLoginStatus',
      tags: ['Users'],
      summary: 'Get daily login status',
      description: 'Returns daily login streak and reward information.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Daily login status',
          content: {
            'application/json': {
              schema: z
                .object({
                  currentStreak: z.number(),
                  longestStreak: z.number(),
                  nextReward: z.number(),
                  daysUntilMilestone: z.number(),
                  nextMilestone: z.number(),
                  lastClaim: z.string().nullable(),
                  canClaim: z.boolean(),
                  timeUntilClaim: z
                    .string()
                    .meta({ description: 'Human-readable duration' }),
                  timeUntilReset: z
                    .string()
                    .meta({ description: 'Human-readable duration' }),
                  totalDailyLogins: z.number(),
                })
                .meta({ id: 'DailyLoginStatus' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'claimDailyLogin',
      tags: ['Users'],
      summary: 'Claim daily login reward',
      description: 'Claim the daily login reward and update streak.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Daily login reward claimed',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.boolean(),
                  streak: z.number(),
                  reward: z.number(),
                  milestoneBonus: z.number().nullable(),
                  totalAwarded: z.number(),
                  nextReward: z.number(),
                  daysUntilMilestone: z.number(),
                  nextMilestone: z.number(),
                  streakReset: z.boolean(),
                })
                .meta({ id: 'DailyLoginReward' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/users/delete-account': {
    post: {
      operationId: 'deleteAccount',
      tags: ['Users'],
      summary: 'Delete user account',
      description: 'Permanently delete the authenticated user account.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              confirmation: z.literal('DELETE MY ACCOUNT'),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Account deleted',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                deleted_data: z.object({
                  user_id: z.string(),
                  username: z.string().nullable(),
                  deletion_time: z
                    .string()
                    .meta({ description: 'ISO 8601 timestamp' }),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Profile paths
// ---------------------------------------------------------------------------

export const profilePaths: ZodOpenApiPathsObject = {
  '/api/profiles/favorites': {
    get: {
      operationId: 'listFavoriteProfiles',
      tags: ['Profiles'],
      summary: 'List favorite profiles',
      description: "Returns the authenticated user's favorite profiles.",
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'List of favorite profiles',
          content: {
            'application/json': {
              schema: z.object({
                profiles: z.array(FavoriteProfile),
                total: z.number(),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/profiles/{id}/favorite': {
    post: {
      operationId: 'favoriteProfile',
      tags: ['Profiles'],
      summary: 'Favorite a profile',
      description: "Add a profile to the authenticated user's favorites.",
      security: [{ PrivyAuth: [] }],
      requestParams: { path: profileIdPath },
      responses: {
        '201': {
          description: 'Favorite created',
          content: {
            'application/json': {
              schema: z.object({
                id: z.string(),
                targetUser: FavoriteTarget.nullable(),
                createdAt: z
                  .string()
                  .meta({ description: 'ISO 8601 timestamp' }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    delete: {
      operationId: 'unfavoriteProfile',
      tags: ['Profiles'],
      summary: 'Unfavorite a profile',
      description: "Remove a profile from the authenticated user's favorites.",
      security: [{ PrivyAuth: [] }],
      requestParams: { path: profileIdPath },
      responses: {
        '200': {
          description: 'Unfavorited successfully',
          content: {
            'application/json': {
              schema: z.object({ message: z.string() }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
