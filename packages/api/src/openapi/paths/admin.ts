import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

// ===========================================================================
// Shared / reusable fragments
// ===========================================================================

const AdminUserBrief = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  profileImageUrl: z.string().nullable(),
});

const PaginationMeta = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

// ===========================================================================
// 1. Stats
// ===========================================================================

const AdminStatsResponse = z
  .object({
    users: z.object({
      total: z.number(),
      actors: z.number(),
      realUsers: z.number(),
      banned: z.number(),
      admins: z.number(),
      signups: z.object({
        today: z.number(),
        thisWeek: z.number(),
        thisMonth: z.number(),
      }),
    }),
    markets: z.object({
      total: z.number(),
      active: z.number(),
      resolved: z.number(),
      positions: z.number(),
    }),
    trading: z.object({
      balanceTransactions: z.number(),
      npcTrades: z.number(),
    }),
    social: z.object({
      posts: z.number(),
      postsToday: z.number(),
      comments: z.number(),
      reactions: z.number(),
    }),
    financial: z.object({
      totalVirtualBalance: z.string(),
      totalDeposited: z.string(),
      totalWithdrawn: z.string(),
      totalLifetimePnL: z.string(),
    }),
    pools: z.object({
      total: z.number(),
      active: z.number(),
      deposits: z.number(),
    }),
    engagement: z.object({
      referrals: z.number(),
      pointsTransactions: z.number(),
    }),
    topUsers: z.object({
      byBalance: z.array(
        z.object({
          id: z.string(),
          username: z.string(),
          displayName: z.string(),
          profileImageUrl: z.string().nullable(),
          virtualBalance: z.string(),
          lifetimePnL: z.string(),
        })
      ),
      byReputation: z.array(
        z.object({
          id: z.string(),
          username: z.string(),
          displayName: z.string(),
          profileImageUrl: z.string().nullable(),
          reputationPoints: z.number(),
        })
      ),
    }),
    recentSignups: z.array(
      z.object({
        id: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        walletAddress: z.string().nullable(),
        createdAt: z.string(),
        onChainRegistered: z.boolean(),
        hasFarcaster: z.boolean(),
        hasTwitter: z.boolean(),
      })
    ),
  })
  .meta({ id: 'AdminStatsResponse' });

// ---------------------------------------------------------------------------
// Growth stats
// ---------------------------------------------------------------------------

const AdminGrowthTrend = z.object({
  current: z.number(),
  previous: z.number(),
  change: z.number(),
  trend: z.enum(['up', 'down', 'stable']),
});

const AdminGrowthStatsResponse = z
  .object({
    wau: AdminGrowthTrend,
    userBalance: z.object({
      tradersOnly: z.number(),
      commandersOnly: z.number(),
      hybrid: z.number(),
      total: z.number(),
      tradersOnlyPct: z.number(),
      commandersOnlyPct: z.number(),
      hybridPct: z.number(),
    }),
    engagement: z.object({
      tradesPerTrader: z.number(),
      totalTrades: z.number(),
      uniqueTraders: z.number(),
      actionsPerCommander: z.number(),
      totalActions: z.number(),
      uniqueCommanders: z.number(),
    }),
    activation: z.object({
      rate: z.number(),
      totalSignups: z.number(),
      activatedUsers: z.number(),
      tradedWithin24h: z.number(),
      commandedWithin24h: z.number(),
      funnel: z.object({
        signups: z.number(),
        tradedWithin24h: z.number(),
        commandedWithin24h: z.number(),
        activated: z.number(),
      }),
    }),
    sessions: z.object({
      avgSessionsPerWau: z.number().nullable(),
      medianSessionLengthMinutes: z.number().nullable(),
      totalSessions: z.number(),
    }),
    retention: z.object({
      d7: z.number().nullable(),
      cohorts: z.array(
        z.object({
          cohortDate: z.string(),
          cohortSize: z.number(),
          retainedD7: z.number(),
          retentionRate: z.number(),
        })
      ),
      status: z.enum(['ok', 'no_cohorts', 'no_retention']),
      message: z.string(),
    }),
    timeSeries: z
      .array(z.object({ date: z.string(), wau: z.number() }))
      .optional(),
    metadata: z.object({
      computedAt: z.string(),
      period: z.string(),
      periodStart: z.string(),
      periodEnd: z.string(),
    }),
  })
  .meta({ id: 'AdminGrowthStatsResponse' });

// ---------------------------------------------------------------------------
// User stats
// ---------------------------------------------------------------------------

const AdminUserStatsResponse = z
  .object({
    overview: z.object({
      total: z.number(),
      realUsers: z.number(),
      actors: z.number(),
      agents: z.number(),
      banned: z.number(),
      admins: z.number(),
      filteredTotal: z.number().optional(),
    }),
    signups: z.object({
      today: z.number(),
      yesterday: z.number(),
      thisWeek: z.number(),
      thisMonth: z.number(),
      growthRate: z.number(),
    }),
    profileMetrics: z.object({
      profileComplete: z.number(),
      profileCompletionRate: z.number(),
      onChainRegistered: z.number(),
      onChainRate: z.number(),
    }),
    socialConnections: z.object({
      withFarcaster: z.number(),
      withTwitter: z.number(),
      withDiscord: z.number(),
      withWallet: z.number(),
      farcasterRate: z.number(),
      twitterRate: z.number(),
      discordRate: z.number(),
      walletRate: z.number(),
    }),
    topReferrers: z.array(AdminUserBrief.extend({ referralCount: z.number() })),
    recentSignups: z.array(
      z.object({
        id: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        createdAt: z.string(),
        onChainRegistered: z.boolean(),
        hasFarcaster: z.boolean(),
        hasTwitter: z.boolean(),
        hasDiscord: z.boolean(),
      })
    ),
    timeSeries: z.array(
      z.object({
        date: z.string(),
        signups: z.number(),
        cumulative: z.number(),
      })
    ),
    filters: z.object({
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      userType: z.string(),
      applied: z.boolean(),
    }),
  })
  .meta({ id: 'AdminUserStatsResponse' });

// ---------------------------------------------------------------------------
// Trading stats
// ---------------------------------------------------------------------------

const AdminTradingStatsResponse = z
  .object({
    overview: z.object({
      totalMarkets: z.number(),
      activeMarkets: z.number(),
      resolvedMarkets: z.number(),
      totalPositions: z.number(),
      activePositions: z.number(),
      totalPerpPositions: z.number(),
      activePerpPositions: z.number(),
    }),
    volume: z.object({
      totalBalanceTransactions: z.number(),
      totalNpcTrades: z.number(),
      npcTradesToday: z.number(),
    }),
    fees: z.object({
      totalFees: z.number(),
      platformFees: z.number(),
      referrerFees: z.number(),
      feesToday: z.number(),
      feeRate: z.number(),
    }),
    topTraders: z.array(
      z.object({
        userId: z.string(),
        username: z.string().nullable(),
        displayName: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
        tradeCount: z.number(),
        totalVolume: z.number(),
      })
    ),
    topMarkets: z.array(
      z.object({
        marketId: z.string(),
        question: z.string(),
        positionCount: z.number(),
        totalVolume: z.number(),
      })
    ),
    recentTrades: z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        username: z.string().nullable(),
        displayName: z.string().nullable(),
        type: z.string(),
        amount: z.number(),
        createdAt: z.string(),
      })
    ),
    timeSeries: z.array(
      z.object({
        date: z.string(),
        trades: z.number(),
        volume: z.number(),
        fees: z.number(),
      })
    ),
    filters: z.object({
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      marketType: z.string(),
      applied: z.boolean(),
    }),
  })
  .meta({ id: 'AdminTradingStatsResponse' });

// ---------------------------------------------------------------------------
// Timeseries
// ---------------------------------------------------------------------------

const AdminTimeseriesResponse = z
  .object({
    timeSeries: z.array(z.record(z.string(), z.unknown())).meta({
      description:
        'Array of FormattedSnapshot or DailyAggregatedSnapshot objects',
    }),
    summary: z
      .object({
        period: z.object({ start: z.string(), end: z.string() }),
        userGrowth: z.object({
          startTotal: z.number(),
          endTotal: z.number(),
          netGrowth: z.number(),
          growthRate: z.number(),
          newUsers: z.number(),
        }),
        trading: z.object({
          totalVolume: z.number(),
          avgDailyVolume: z.number(),
        }),
        social: z.object({
          totalPosts: z.number(),
          avgHourlyPosts: z.number(),
        }),
        system: z.object({ avgUptime: z.number(), avgErrorRate: z.number() }),
      })
      .nullable(),
    metadata: z.object({
      startDate: z.string(),
      endDate: z.string(),
      environment: z.string(),
      granularity: z.string(),
      snapshotCount: z.number(),
      expectedSnapshots: z.number(),
      coverage: z.number(),
      hasGaps: z.boolean(),
    }),
    fallbackAvailable: z.boolean(),
  })
  .meta({ id: 'AdminTimeseriesResponse' });

// ---------------------------------------------------------------------------
// Heatmap
// ---------------------------------------------------------------------------

const AdminHeatmapHourlyResponse = z
  .object({
    type: z.literal('hourly'),
    activityType: z.string(),
    data: z.array(
      z.object({
        dayOfWeek: z.number(),
        hour: z.number(),
        count: z.number(),
        intensity: z.number(),
      })
    ),
    metadata: z.object({
      startDate: z.string(),
      endDate: z.string(),
      maxCount: z.number(),
      totalActivities: z.number(),
    }),
  })
  .meta({ id: 'AdminHeatmapHourlyResponse' });

const AdminHeatmapCalendarResponse = z
  .object({
    type: z.literal('calendar'),
    activityType: z.string(),
    data: z.array(
      z.object({ date: z.string(), count: z.number(), intensity: z.number() })
    ),
    metadata: z.object({
      startDate: z.string(),
      endDate: z.string(),
      maxCount: z.number(),
      totalActivities: z.number(),
      daysWithActivity: z.number(),
    }),
  })
  .meta({ id: 'AdminHeatmapCalendarResponse' });

// ---------------------------------------------------------------------------
// System stats
// ---------------------------------------------------------------------------

const AdminSystemStatsResponse = z
  .object({
    health: z.object({
      database: z.boolean(),
      redis: z.boolean(),
      overall: z.boolean(),
      timestamp: z.string(),
    }),
    game: z
      .object({
        id: z.string(),
        isRunning: z.boolean(),
        pausedAt: z.string().nullable(),
        currentTick: z.number(),
        lastTickAt: z.string().nullable(),
      })
      .nullable(),
    cronJobs: z.object({
      gameTick: z.record(z.string(), z.unknown()).nullable(),
      agentTick: z.record(z.string(), z.unknown()).nullable(),
      realtimeDrain: z.record(z.string(), z.unknown()).nullable(),
      allJobs: z.array(z.record(z.string(), z.unknown())),
    }),
    llm: z.object({
      callsLast24h: z.number(),
      inputTokensLast24h: z.number(),
      outputTokensLast24h: z.number(),
      errorsLastHour: z.number(),
    }),
    content: z.object({
      lookaheadMinutes: z.number(),
      isHealthy: z.boolean(),
      activeQuestions: z.number(),
    }),
    realtime: z.object({
      outboxPending: z.number(),
      outboxLagSeconds: z.number(),
      isHealthy: z.boolean(),
    }),
    locks: z.object({
      active: z.array(
        z.object({
          id: z.string(),
          lockType: z.string(),
          acquiredAt: z.string(),
          ageSeconds: z.number(),
        })
      ),
    }),
    moderation: z.object({ pendingReports: z.number() }),
    database: z.object({
      tables: z.array(
        z.object({
          name: z.string(),
          rowCount: z.number(),
          sizeBytes: z.number(),
          sizeMB: z.number(),
        })
      ),
    }),
    environment: z.object({
      nodeEnv: z.string(),
      vercelEnv: z.string(),
      region: z.string(),
    }),
  })
  .meta({ id: 'AdminSystemStatsResponse' });

// ===========================================================================
// 2. Users
// ===========================================================================

const AdminUserRecord = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  walletAddress: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  isActor: z.boolean(),
  isAdmin: z.boolean(),
  isBanned: z.boolean(),
  bannedAt: z.string().nullable(),
  bannedReason: z.string().nullable(),
  bannedBy: z.string().nullable(),
  virtualBalance: z.string(),
  totalDeposited: z.string(),
  totalWithdrawn: z.string(),
  lifetimePnL: z.string(),
  reputationPoints: z.number(),
  referralCount: z.number(),
  onChainRegistered: z.boolean(),
  nftTokenId: z.string().nullable(),
  hasFarcaster: z.boolean(),
  hasTwitter: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isWhitelisted: z.boolean(),
  _count: z.object({
    comments: z.number(),
    reactions: z.number(),
    positions: z.number(),
    following: z.number(),
    followedBy: z.number(),
    reportsReceived: z.number(),
    blocksReceived: z.number(),
    mutesReceived: z.number(),
    reportsSent: z.number(),
  }),
  _moderation: z.object({
    reportsReceived: z.number(),
    blocksReceived: z.number(),
    mutesReceived: z.number(),
    reportsSent: z.number(),
    reportRatio: z.number(),
    blockRatio: z.number(),
    muteRatio: z.number(),
    badUserScore: z.number(),
  }),
});

const AdminUsersResponse = z
  .object({
    users: z.array(AdminUserRecord),
    pagination: PaginationMeta,
  })
  .meta({ id: 'AdminUsersResponse' });

const AdminBanUserResponse = z
  .object({
    success: z.literal(true),
    user: z.object({
      id: z.string(),
      username: z.string(),
      displayName: z.string(),
      isBanned: z.boolean(),
      bannedAt: z.string().nullable(),
      bannedReason: z.string().nullable(),
      bannedBy: z.string().nullable(),
      isScammer: z.boolean(),
      isCSAM: z.boolean(),
      agent0TokenId: z.string().nullable(),
    }),
    message: z.string(),
  })
  .meta({ id: 'AdminBanUserResponse' });

// ===========================================================================
// 3. Agents
// ===========================================================================

const AdminAgentRecord = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  creatorId: z.string(),
  creatorName: z.string().nullable(),
  modelTier: z.string(),
  balance: z.number(),
  autonomousEnabled: z.boolean(),
  autonomousTrading: z.boolean(),
  autonomousPosting: z.boolean(),
  autonomousCommenting: z.boolean(),
  autonomousDMs: z.boolean(),
  autonomousGroupChats: z.boolean(),
  lifetimePnL: z.number(),
  totalTrades: z.number(),
  winRate: z.number(),
  reputationScore: z.number(),
  averageFeedbackScore: z.number(),
  totalFeedbackCount: z.number(),
  agentStatus: z.string(),
  errorMessage: z.string().nullable(),
  lastTickAt: z.string().nullable(),
  lastChatAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  recentLogsCount: z.number(),
  recentErrorsCount: z.number(),
  type: z.string().optional(),
  protocol: z.string().optional(),
  endpoint: z.string().optional(),
  isHealthy: z.boolean().optional(),
  lastHealthCheck: z.string().optional(),
});

const AdminAgentsResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      agents: z.array(AdminAgentRecord),
      stats: z.object({
        total: z.number(),
        running: z.number(),
        paused: z.number(),
        error: z.number(),
        totalActions24h: z.number(),
        external: z.number(),
        externalHealthy: z.number(),
      }),
    }),
  })
  .meta({ id: 'AdminAgentsResponse' });

// ===========================================================================
// 4. Markets (admin)
// ===========================================================================

const AdminMarketRecord = z.object({
  id: z.string(),
  question: z.string(),
  description: z.string().nullable(),
  yesShares: z.number(),
  noShares: z.number(),
  liquidity: z.number(),
  resolved: z.boolean(),
  resolution: z.boolean().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  onChainMarketId: z.string().nullable(),
  positionCount: z.number(),
  tradeCount: z.number(),
  totalVolume: z.number(),
  yesPrice: z.number(),
  noPrice: z.number(),
  status: z.enum(['active', 'expired', 'resolved']),
});

const AdminMarketsResponse = z
  .object({
    stats: z.object({
      total: z.number(),
      active: z.number(),
      expired: z.number(),
      resolved: z.number(),
      totalLiquidity: z.number(),
      totalPositions: z.number(),
      activePositions: z.number(),
      totalPositionValue: z.number(),
    }),
    markets: z.array(AdminMarketRecord),
  })
  .meta({ id: 'AdminMarketsResponse' });

const AdminMarketDetailResponse = z
  .object({
    market: z.record(z.string(), z.unknown()).meta({
      description: 'Full market record with yesPrice, noPrice, status',
    }),
    positions: z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        side: z.string(),
        shares: z.number(),
        avgPrice: z.number(),
        amount: z.number(),
        status: z.string(),
        createdAt: z.string(),
      })
    ),
    trades: z.array(z.record(z.string(), z.unknown())),
    stats: z.object({
      totalPositions: z.number(),
      totalTrades: z.number(),
      yesPositionCount: z.number(),
      noPositionCount: z.number(),
    }),
  })
  .meta({ id: 'AdminMarketDetailResponse' });

const AdminMarketActionResponse = z
  .object({
    success: z.literal(true),
    action: z.string(),
    marketId: z.string(),
    resolution: z.boolean().optional(),
    newEndDate: z.string().optional(),
    positionsRefunded: z.number().optional(),
    totalRefunded: z.number().optional(),
  })
  .meta({ id: 'AdminMarketActionResponse' });

// ===========================================================================
// 5. Roles
// ===========================================================================

const AdminRolesResponse = z
  .object({
    admins: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        role: z.string(),
        permissions: z.array(z.string()),
        grantedAt: z.string(),
        grantedBy: z.string(),
      })
    ),
    total: z.number(),
  })
  .meta({ id: 'AdminRolesResponse' });

const AdminRoleActionResponse = z
  .object({
    success: z.literal(true),
    message: z.string(),
    user: z.object({
      userId: z.string(),
      username: z.string(),
      displayName: z.string(),
      role: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    }),
  })
  .meta({ id: 'AdminRoleActionResponse' });

// ===========================================================================
// 6. Admins list / promote-demote
// ===========================================================================

const AdminAdminsResponse = z
  .object({
    admins: z.array(
      z.object({
        id: z.string(),
        username: z.string(),
        displayName: z.string(),
        walletAddress: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
        isActor: z.boolean(),
        isAdmin: z.boolean(),
        isBanned: z.boolean(),
        onChainRegistered: z.boolean(),
        hasFarcaster: z.boolean(),
        hasTwitter: z.boolean(),
        farcasterUsername: z.string().nullable(),
        twitterUsername: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    total: z.number(),
  })
  .meta({ id: 'AdminAdminsResponse' });

const AdminPromoteDemoteResponse = z
  .object({
    message: z.string(),
    user: z.object({
      id: z.string(),
      username: z.string(),
      displayName: z.string(),
      walletAddress: z.string().nullable(),
      profileImageUrl: z.string().nullable(),
      isAdmin: z.boolean(),
      onChainRegistered: z.boolean(),
      hasFarcaster: z.boolean(),
      hasTwitter: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    action: z.string(),
  })
  .meta({ id: 'AdminPromoteDemoteResponse' });

// ===========================================================================
// 7. Groups
// ===========================================================================

const AdminGroupsResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      groups: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          groupType: z.string(),
          creatorId: z.string().nullable(),
          creatorName: z.string(),
          memberCount: z.number(),
          messageCount: z.number(),
          participants: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              username: z.string(),
              isNPC: z.boolean(),
              profileImageUrl: z.string().nullable(),
              joinedAt: z.string(),
            })
          ),
          recentMessages: z.array(
            z.object({
              id: z.string(),
              content: z.string(),
              createdAt: z.string(),
              sender: z.object({
                id: z.string(),
                name: z.string(),
                isNPC: z.boolean(),
              }),
            })
          ),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
      ),
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      hasMore: z.boolean(),
    }),
  })
  .meta({ id: 'AdminGroupsResponse' });

const AdminGroupMessagesResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      chat: z.object({
        id: z.string(),
        name: z.string(),
        isGroup: z.boolean(),
        createdAt: z.string(),
      }),
      messages: z.array(
        z.object({
          id: z.string(),
          content: z.string(),
          createdAt: z.string(),
          sender: z.object({
            id: z.string(),
            name: z.string(),
            username: z.string(),
            isNPC: z.boolean(),
            profileImageUrl: z.string().nullable(),
          }),
        })
      ),
      pagination: z.object({
        total: z.number(),
        offset: z.number(),
        limit: z.number(),
        hasMore: z.boolean(),
      }),
    }),
  })
  .meta({ id: 'AdminGroupMessagesResponse' });

const AdminNftCollectionGetResponse = z
  .object({
    groups: z.array(
      z
        .record(z.string(), z.unknown())
        .meta({ description: 'Chat fields with memberCount' })
    ),
    total: z.number(),
  })
  .meta({ id: 'AdminNftCollectionGetResponse' });

const AdminNftCollectionCreateResponse = z
  .object({
    group: z.object({
      id: z.string(),
      name: z.string(),
      chatId: z.string(),
      nftGated: z.literal(true),
      contractAddress: z.string(),
      tokenId: z.string().nullable(),
      chainId: z.number(),
    }),
  })
  .meta({ id: 'AdminNftCollectionCreateResponse' });

const AdminRevalidateNftResponse = z
  .object({
    revalidation: z.object({
      chatId: z.string(),
      contractAddress: z.string(),
      total: z.number(),
      stillValid: z.number(),
      removed: z.number(),
      noWallet: z.number(),
      errors: z.number(),
      removedUserIds: z.array(z.string()),
    }),
  })
  .meta({ id: 'AdminRevalidateNftResponse' });

// ===========================================================================
// 8. Feedback
// ===========================================================================

const AdminFeedbackResponse = z
  .object({
    feedback: z.array(
      z.object({
        id: z.string(),
        feedbackType: z.string(),
        description: z.string().nullable(),
        score: z.number().nullable(),
        rating: z.number().nullable(),
        stepsToReproduce: z.string().nullable(),
        screenshotUrl: z.string().nullable(),
        linearIssue: z
          .object({ id: z.string(), identifier: z.string(), url: z.string() })
          .nullable(),
        createdAt: z.string(),
        user: z
          .object({
            id: z.string(),
            username: z.string(),
            displayName: z.string(),
            profileImageUrl: z.string().nullable(),
            email: z.string().nullable(),
          })
          .nullable(),
      })
    ),
    pagination: z.object({
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      hasMore: z.boolean(),
    }),
    stats: z.object({
      total: z.number(),
      byType: z.record(z.string(), z.number()),
    }),
  })
  .meta({ id: 'AdminFeedbackResponse' });

const AdminRetrySyncResponse = z
  .object({
    success: z.literal(true),
    alreadySynced: z.boolean(),
    linearIssue: z
      .object({ id: z.string(), identifier: z.string(), url: z.string() })
      .nullable(),
    message: z.string(),
  })
  .meta({ id: 'AdminRetrySyncResponse' });

// ===========================================================================
// 9. Trades
// ===========================================================================

const AdminTradesResponse = z
  .object({
    trades: z.array(
      z.record(z.string(), z.unknown()).meta({
        description:
          'Discriminated union of BalanceTrade, NPCTrade, PositionTrade by type field',
      })
    ),
    pagination: PaginationMeta,
    counts: z.object({
      balance: z.number(),
      npc: z.number(),
      position: z.number(),
    }),
  })
  .meta({ id: 'AdminTradesResponse' });

const AdminCreateTradeResponse = z
  .object({
    trade: z.record(z.string(), z.unknown()).meta({
      description:
        'Created trade with type, id, timestamp, and trade-specific fields',
    }),
  })
  .meta({ id: 'AdminCreateTradeResponse' });

// ===========================================================================
// 10. Reports
// ===========================================================================

const AdminReportRecord = z.object({
  id: z.string(),
  reporterId: z.string(),
  reportedUserId: z.string().nullable(),
  reportedPostId: z.string().nullable(),
  reportedCommentId: z.string().nullable(),
  reportType: z.string(),
  category: z.string().nullable(),
  reason: z.string(),
  evidence: z.string().nullable(),
  status: z.string(),
  priority: z.string().nullable(),
  resolution: z.string().nullable(),
  resolvedBy: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reporter: AdminUserBrief,
  reportedUser: AdminUserBrief.extend({ isBanned: z.boolean() }).nullable(),
  resolver: z
    .object({ id: z.string(), username: z.string(), displayName: z.string() })
    .nullable(),
  evaluation: z.record(z.string(), z.unknown()).nullable(),
});

const AdminReportsResponse = z
  .object({
    reports: z.array(AdminReportRecord),
    pagination: PaginationMeta,
  })
  .meta({ id: 'AdminReportsResponse' });

const AdminReportDetailResponse = z
  .object({
    report: AdminReportRecord,
    relatedReports: z.array(AdminReportRecord),
  })
  .meta({ id: 'AdminReportDetailResponse' });

const AdminReportStatsResponse = z
  .object({
    totals: z.object({
      total: z.number(),
      pending: z.number(),
      reviewing: z.number(),
      resolved: z.number(),
      dismissed: z.number(),
    }),
    byCategory: z.array(z.object({ category: z.string(), count: z.number() })),
    byPriority: z.array(z.object({ priority: z.string(), count: z.number() })),
    topReportedUsers: z.array(
      z.object({ user: AdminUserBrief.nullable(), reportCount: z.number() })
    ),
    topReporters: z.array(
      z.object({ user: AdminUserBrief.nullable(), reportCount: z.number() })
    ),
    recentActivity: z.object({
      last7Days: z.number(),
      resolved7Days: z.number(),
    }),
  })
  .meta({ id: 'AdminReportStatsResponse' });

// ===========================================================================
// 11. Resolutions
// ===========================================================================

const AdminResolutionsResponse = z
  .object({
    success: z.literal(true),
    items: z.array(
      z.object({
        id: z.string(),
        questionNumber: z.number(),
        text: z.string(),
        outcome: z.string().nullable(),
        resolutionDate: z.string().nullable(),
        resolutionProofUrl: z.string().nullable(),
        resolutionDescription: z.string().nullable(),
        resolutionConfidence: z.number().nullable(),
        resolutionReviewStatus: z.string(),
        requiresManualReview: z.boolean(),
        updatedAt: z.string().nullable(),
      })
    ),
    count: z.number(),
  })
  .meta({ id: 'AdminResolutionsResponse' });

// ===========================================================================
// 12. Moderation – human review
// ===========================================================================

const AdminHumanReviewResponse = z
  .object({
    appeals: z.array(
      z.object({
        id: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        bannedAt: z.string().nullable(),
        bannedReason: z.string().nullable(),
        bannedBy: z.string().nullable(),
        isScammer: z.boolean(),
        isCSAM: z.boolean(),
        appealCount: z.number(),
        appealStaked: z.boolean(),
        appealStakeAmount: z.number().nullable(),
        appealStakeTxHash: z.string().nullable(),
        appealSubmittedAt: z.string().nullable(),
        falsePositiveHistory: z.number(),
        earnedPoints: z.number(),
        totalDeposited: z.string(),
        totalWithdrawn: z.string(),
        lifetimePnL: z.string(),
      })
    ),
  })
  .meta({ id: 'AdminHumanReviewResponse' });

// ===========================================================================
// 13. Moderation escrow
// ===========================================================================

const AdminCreateEscrowResponse = z
  .object({
    success: z.literal(true),
    escrow: z.object({
      id: z.string(),
      recipientId: z.string(),
      amountUSD: z.number(),
      status: z.string(),
      reason: z.string().nullable(),
      paymentRequestId: z.string(),
      expiresAt: z.string(),
    }),
    paymentRequest: z.object({
      requestId: z.string(),
      amount: z.number(),
      from: z.string(),
      to: z.string(),
      expiresAt: z.string(),
    }),
  })
  .meta({ id: 'AdminCreateEscrowResponse' });

const AdminVerifyEscrowPaymentResponse = z
  .object({
    success: z.literal(true),
    escrow: z.object({
      id: z.string(),
      recipientId: z.string(),
      amountUSD: z.number(),
      status: z.string(),
      paymentTxHash: z.string(),
    }),
  })
  .meta({ id: 'AdminVerifyEscrowPaymentResponse' });

const AdminRefundEscrowResponse = z
  .object({
    success: z.literal(true),
    escrow: z.object({
      id: z.string(),
      recipientId: z.string(),
      amountUSD: z.number(),
      status: z.string(),
      refundTxHash: z.string(),
      refundedAt: z.string(),
    }),
  })
  .meta({ id: 'AdminRefundEscrowResponse' });

const AdminListEscrowResponse = z
  .object({
    success: z.literal(true),
    escrows: z.array(
      z.object({
        id: z.string(),
        recipientId: z.string(),
        recipient: z.object({
          id: z.string(),
          username: z.string(),
          displayName: z.string(),
          profileImageUrl: z.string().nullable(),
        }),
        adminId: z.string(),
        admin: z.object({
          id: z.string(),
          username: z.string(),
          displayName: z.string(),
        }),
        amountUSD: z.number(),
        amountWei: z.string().nullable(),
        status: z.string(),
        reason: z.string().nullable(),
        paymentRequestId: z.string().nullable(),
        paymentTxHash: z.string().nullable(),
        refundTxHash: z.string().nullable(),
        refundedBy: z.string().nullable(),
        refundedByUser: z
          .object({
            id: z.string(),
            username: z.string(),
            displayName: z.string(),
          })
          .nullable(),
        refundedAt: z.string().nullable(),
        createdAt: z.string(),
        expiresAt: z.string(),
      })
    ),
    pagination: PaginationMeta,
  })
  .meta({ id: 'AdminListEscrowResponse' });

// ===========================================================================
// 14. AI Models
// ===========================================================================

const AdminAiModelsResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      providers: z.object({
        groq: z.boolean(),
        claude: z.boolean(),
        openai: z.boolean(),
      }),
      activeProvider: z.enum(['groq', 'claude', 'openai']),
      recommendedModels: z.array(
        z.object({ id: z.string(), name: z.string(), description: z.string() })
      ),
    }),
  })
  .meta({ id: 'AdminAiModelsResponse' });

const AdminAiModelTestResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      provider: z.string(),
      model: z.string(),
      response: z.object({ message: z.string(), status: z.string() }),
      latency: z.number(),
      timestamp: z.string(),
    }),
    message: z.string(),
  })
  .meta({ id: 'AdminAiModelTestResponse' });

// ===========================================================================
// 15. Training
// ===========================================================================

const AdminTrainingStatusResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      status: z.literal('healthy'),
      automation: z
        .record(z.string(), z.unknown())
        .meta({ description: 'Automation pipeline status' }),
      readiness: z
        .record(z.string(), z.unknown())
        .meta({ description: 'Training readiness check' }),
      recentJobs: z.array(z.record(z.string(), z.unknown())),
      models: z.array(z.record(z.string(), z.unknown())),
      trajectoryStats: z.object({
        _count: z.number(),
        _avg: z.object({
          totalReward: z.number().nullable(),
          episodeLength: z.number().nullable(),
          durationMs: z.number().nullable(),
        }),
      }),
      timestamp: z.string(),
    }),
  })
  .meta({ id: 'AdminTrainingStatusResponse' });

const AdminTrainingTriggerGetResponse = z.record(z.string(), z.unknown()).meta({
  id: 'AdminTrainingTriggerGetResponse',
  description:
    'Training readiness check result from automationPipeline.checkTrainingReadiness()',
});

const AdminTrainingTriggerPostResponse = z
  .record(z.string(), z.unknown())
  .meta({
    id: 'AdminTrainingTriggerPostResponse',
    description:
      'Training trigger result from automationPipeline.triggerTraining()',
  });

const AdminTrainingDeployResponse = z.record(z.string(), z.unknown()).meta({
  id: 'AdminTrainingDeployResponse',
  description: 'Deployment result from modelDeployer.deploy()',
});

const AdminTrainingRollbackResponse = z.record(z.string(), z.unknown()).meta({
  id: 'AdminTrainingRollbackResponse',
  description: 'Rollback result from modelDeployer.rollback()',
});

const AdminTrainingBenchmarkPostResponse = z
  .object({
    success: z.literal(true),
    benchmark: z.record(z.string(), z.unknown()),
    comparison: z.record(z.string(), z.unknown()).nullable(),
  })
  .meta({ id: 'AdminTrainingBenchmarkPostResponse' });

const AdminTrainingBenchmarkGetResponse = z
  .object({
    success: z.literal(true),
    summary: z.record(z.string(), z.unknown()),
  })
  .meta({ id: 'AdminTrainingBenchmarkGetResponse' });

const AdminModelSelectionResponse = z
  .object({
    success: z.literal(true),
    summary: z.record(z.string(), z.unknown()),
    selection: z.record(z.string(), z.unknown()).nullable(),
    selectionError: z.unknown().nullable(),
  })
  .meta({ id: 'AdminModelSelectionResponse' });

const AdminTrainingModelsResponse = z
  .object({
    success: z.literal(true),
    models: z.array(
      z.object({
        version: z.string(),
        baseModel: z.string(),
        trainedAt: z.string(),
        accuracy: z.number().nullable(),
        avgReward: z.number().nullable(),
        status: z.string(),
        agentsUsing: z.number(),
        blobUrl: z.string().nullable(),
        size: z.number().nullable(),
        wandbRunId: z.string().nullable(),
      })
    ),
    total: z.number(),
  })
  .meta({ id: 'AdminTrainingModelsResponse' });

// ===========================================================================
// 16. Training data
// ===========================================================================

const AdminTrainingDataResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      summary: z.object({
        totalTrajectories: z.number(),
        totalWindows: z.number(),
        readyWindows: z.number(),
        minAgentsRequired: z.number(),
      }),
      windows: z.array(
        z.object({
          windowId: z.string(),
          trajectoryCount: z.number(),
          avgSteps: z.number(),
          avgPnl: z.number(),
        })
      ),
      readyWindows: z.array(
        z.object({
          windowId: z.string(),
          trajectoryCount: z.number(),
          avgSteps: z.number(),
          avgPnl: z.number(),
        })
      ),
      recentTrajectories: z.array(
        z.object({
          id: z.string(),
          trajectoryId: z.string(),
          agentId: z.string(),
          windowId: z.string(),
          episodeLength: z.number(),
          finalPnL: z.number(),
          tradesExecuted: z.number(),
          createdAt: z.string(),
        })
      ),
      qualityMetrics: z.object({
        avgEpisodeLength: z.number(),
        avgPnl: z.number(),
        trainingDataQuality: z.enum(['good', 'fair', 'low']),
      }),
    }),
  })
  .meta({ id: 'AdminTrainingDataResponse' });

// ===========================================================================
// 17. Upload model
// ===========================================================================

const AdminUploadModelResponse = z
  .object({
    success: z.literal(true),
    url: z.string(),
    version: z.string(),
    size: z.number(),
  })
  .meta({ id: 'AdminUploadModelResponse' });

// ===========================================================================
// 18. Content queue
// ===========================================================================

const AdminContentQueueResponse = z
  .object({
    posts: z.array(
      z.record(z.string(), z.unknown()).meta({
        description:
          'Post with type, isHidden, reactionCount, commentCount, mediaUrls',
      })
    ),
    comments: z.array(
      z
        .record(z.string(), z.unknown())
        .meta({ description: 'Comment with type, isHidden, reactionCount' })
    ),
    stats: z.object({
      posts: z.object({ pending: z.number(), hidden: z.number() }),
      comments: z.object({ pending: z.number(), hidden: z.number() }),
      totalPending: z.number(),
    }),
  })
  .meta({ id: 'AdminContentQueueResponse' });

const AdminContentActionResponse = z
  .object({
    success: z.literal(true),
    action: z.string(),
    contentId: z.string(),
    contentType: z.string(),
  })
  .meta({ id: 'AdminContentActionResponse' });

// ===========================================================================
// 19. Cron metrics
// ===========================================================================

const AdminCronMetricsResponse = z
  .object({
    success: z.literal(true),
    timestamp: z.string(),
  })
  .catchall(z.unknown())
  .meta({
    id: 'AdminCronMetricsResponse',
    description:
      'Dashboard metrics from cronMetrics.getDashboardMetrics() spread at top level',
  });

// ===========================================================================
// 20. Permissions
// ===========================================================================

const AdminPermissionsResponse = z
  .object({
    userId: z.string(),
    role: z.string(),
    permissions: z.array(z.string()),
    allPermissions: z.array(z.string()),
    rolePermissions: z.record(z.string(), z.array(z.string())),
  })
  .meta({ id: 'AdminPermissionsResponse' });

// ===========================================================================
// 21. Alpha groups
// ===========================================================================

const AdminAlphaGroupConfigGetResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      config: z
        .record(z.string(), z.unknown())
        .meta({ description: 'ALPHA_GROUP_CONFIG object' }),
      configWithMeta: z.array(
        z.object({
          key: z.string(),
          value: z.unknown(),
          description: z.string(),
          envVar: z.string(),
          type: z.string(),
        })
      ),
      tierConfig: z.record(z.string(), z.record(z.string(), z.unknown())),
      domainFocusWeights: z.record(z.string(), z.unknown()),
      instructions: z.object({
        howToUpdate: z.string(),
        effectiveImmediately: z.string(),
        documentation: z.string(),
      }),
    }),
  })
  .meta({ id: 'AdminAlphaGroupConfigGetResponse' });

const AdminAlphaGroupConfigPatchResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.string(),
      changes: z.array(
        z.object({
          key: z.string(),
          currentValue: z.unknown(),
          proposedValue: z.unknown(),
          envVar: z.string(),
        })
      ),
      envCommands: z.array(z.string()),
      instructions: z.array(z.string()),
      auditLog: z.object({
        requestedBy: z.string(),
        requestedAt: z.string(),
        role: z.string(),
      }),
    }),
  })
  .meta({ id: 'AdminAlphaGroupConfigPatchResponse' });

const AdminAlphaGroupStatsResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      overview: z.object({
        totalNpcs: z.number(),
        totalGroups: z.number(),
        totalMembers: z.number(),
        totalCapacity: z.number(),
        overallFillRate: z.number(),
      }),
      invites: z.object({
        total: z.number(),
        pending: z.number(),
        accepted: z.number(),
        declined: z.number(),
        acceptanceRate: z.number(),
        last24h: z.number(),
        lastWeek: z.number(),
      }),
      joins: z.object({ last24h: z.number(), lastWeek: z.number() }),
      tiers: z.record(
        z.string(),
        z.object({
          name: z.string(),
          current: z.number(),
          max: z.number(),
          fillRate: z.number(),
        })
      ),
      tierBreakdown: z.array(z.record(z.string(), z.unknown())),
      grandfathering: z.object({
        grandfatheredMembers: z.number(),
        grandfatheringEnabled: z.boolean(),
      }),
      inviteDecay: z.object({
        enabled: z.boolean(),
        usersWithDeclines: z.number(),
        usersAtMaxDeclines: z.number(),
        maxDeclines: z.number(),
        baseHours: z.number(),
        maxHours: z.number(),
      }),
      config: z.object({
        inviteProbabilityMultiplier: z.number(),
        maxInvitesPerTick: z.number(),
        inviteCooldownHours: z.number(),
        fastTrackEnabled: z.boolean(),
        includeTradingActivity: z.boolean(),
        perNpcCustomizationEnabled: z.boolean(),
      }),
      thresholds: z.object({
        minReplies: z.number(),
        minLikes: z.number(),
        minTotalInteractions: z.number(),
        minQualityScore: z.number(),
      }),
      timestamp: z.string(),
    }),
  })
  .meta({ id: 'AdminAlphaGroupStatsResponse' });

// ===========================================================================
// 22. Whitelist
// ===========================================================================

const AdminWhitelistGetResponse = z
  .object({
    entries: z.array(
      z
        .record(z.string(), z.unknown())
        .meta({ description: 'WhitelistEntry records' })
    ),
    stats: z
      .record(z.string(), z.unknown())
      .meta({ description: 'WhitelistStats aggregates' }),
  })
  .meta({ id: 'AdminWhitelistGetResponse' });

const AdminWhitelistConfigGetResponse = z
  .object({
    config: z.object({
      leaderboardRankThreshold: z.number(),
      leaderboardCategory: z.string(),
      updatedAt: z.string().nullable(),
      updatedBy: z.string().nullable(),
    }),
  })
  .meta({ id: 'AdminWhitelistConfigGetResponse' });

// ===========================================================================
// 23. World facts
// ===========================================================================

const AdminWorldFactsGetResponse = z
  .object({
    facts: z.array(z.record(z.string(), z.unknown())),
    rssFeeds: z.array(z.record(z.string(), z.unknown())),
    recentParodies: z.array(z.record(z.string(), z.unknown())),
    characterMappings: z.record(z.string(), z.unknown()),
    organizationMappings: z.record(z.string(), z.unknown()),
    context: z.record(z.string(), z.unknown()),
    realityGroundingContent: z.record(z.string(), z.unknown()),
  })
  .meta({ id: 'AdminWorldFactsGetResponse' });

// ===========================================================================
// 24. Environment
// ===========================================================================

const AdminEnvironmentGetResponse = z
  .object({
    actual: z.string(),
    preferred: z.string(),
    available: z.array(z.string()),
    info: z.object({
      nodeEnv: z.string(),
      vercelEnv: z.string(),
      vercelUrl: z.string(),
      region: z.string(),
    }),
  })
  .meta({ id: 'AdminEnvironmentGetResponse' });

// ===========================================================================
// 25. Load test
// ===========================================================================

const AdminLoadTestGetResponse = z
  .object({
    status: z.enum(['running', 'idle']),
    scenario: z.string().optional(),
    startTime: z.string().optional(),
    runningTimeMs: z.number().optional(),
    runningTimeSeconds: z.number().optional(),
    lastResult: z
      .object({
        endTime: z.string(),
        totalRequests: z.number(),
        successRate: z.number(),
        avgResponseTime: z.number(),
      })
      .nullable()
      .optional(),
  })
  .meta({ id: 'AdminLoadTestGetResponse' });

const AdminLoadTestPostResponse = z
  .object({
    message: z.string(),
    scenario: z.string(),
    config: z.object({
      concurrentUsers: z.number(),
      durationSeconds: z.number(),
      endpoints: z.array(z.string()),
    }),
    startTime: z.string(),
  })
  .meta({ id: 'AdminLoadTestPostResponse' });

// ===========================================================================
// 26. Debug DM
// ===========================================================================

const AdminDebugDmResponse = z
  .object({
    user: z
      .object({
        id: z.string(),
        privyId: z.string(),
        username: z.string(),
        displayName: z.string(),
      })
      .nullable(),
    note: z.string(),
    participantRecords: z.array(
      z
        .record(z.string(), z.unknown())
        .meta({ description: 'ChatParticipant records' })
    ),
    chats: z.array(
      z.object({
        id: z.string(),
        name: z.string().nullable(),
        isGroup: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
        participants: z.array(
          z.object({
            id: z.string(),
            userId: z.string(),
            username: z.string(),
            displayName: z.string(),
          })
        ),
        totalMessageCount: z.number(),
        loadedMessageCount: z.number(),
        recentMessages: z.array(
          z.object({
            id: z.string(),
            content: z.string(),
            senderId: z.string(),
            createdAt: z.string(),
          })
        ),
      })
    ),
  })
  .meta({ id: 'AdminDebugDmResponse' });

// ===========================================================================
// 27. Test DM messages
// ===========================================================================

const AdminTestDmResponse = z
  .object({
    success: z.literal(true),
    message: z.string(),
    chatId: z.string(),
    messageCount: z.number(),
    note: z.string(),
  })
  .meta({ id: 'AdminTestDmResponse' });

// ===========================================================================
// 28. Fees
// ===========================================================================

const AdminFeesResponse = z
  .object({
    platformStats: z.object({
      totalFeesCollected: z.number(),
      totalUserFees: z.number(),
      totalNPCFees: z.number(),
      totalPlatformFees: z.number(),
      totalReferrerFees: z.number(),
      totalTrades: z.number(),
    }),
    feesByType: z.array(
      z.object({
        tradeType: z.string(),
        totalFees: z.number(),
        platformFees: z.number(),
        referrerFees: z.number(),
        tradeCount: z.number(),
      })
    ),
    topFeePayers: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        isNPC: z.boolean(),
        totalFees: z.number(),
        tradeCount: z.number(),
      })
    ),
    topReferralEarners: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        totalEarned: z.number(),
        referralCount: z.number(),
      })
    ),
    recentFees: z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        username: z.string(),
        displayName: z.string(),
        profileImageUrl: z.string().nullable(),
        isNPC: z.boolean(),
        tradeType: z.string(),
        feeAmount: z.number(),
        platformFee: z.number(),
        referrerFee: z.number(),
        createdAt: z.string(),
      })
    ),
    feeTrend: z.array(
      z.object({
        date: z.string(),
        totalFees: z.number(),
        tradeCount: z.number(),
      })
    ),
  })
  .meta({ id: 'AdminFeesResponse' });

// ===========================================================================
// 29. Notifications
// ===========================================================================

const AdminNotificationResponse = z
  .object({
    success: z.literal(true),
    message: z.string(),
    recipientCount: z.number().optional(),
    recipient: z
      .object({ id: z.string(), username: z.string(), displayName: z.string() })
      .optional(),
  })
  .meta({ id: 'AdminNotificationResponse' });

// ===========================================================================
// 30. Signal analysis
// ===========================================================================

const AdminSignalAnalysisResponse = z
  .object({
    success: z.literal(true),
    signal: z
      .record(z.string(), z.unknown())
      .meta({ description: 'Signal analysis result for the given question' }),
    warning: z.string(),
  })
  .meta({ id: 'AdminSignalAnalysisResponse' });

// ===========================================================================
// 31. Analytics
// ===========================================================================

const AdminAnalyticsResponse = z
  .object({
    period: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    timeSeries: z.array(
      z.object({
        date: z.string(),
        users: z.number(),
        posts: z.number(),
        comments: z.number(),
        reactions: z.number(),
        follows: z.number(),
      })
    ),
    totals: z.object({
      users: z.number(),
      posts: z.number(),
      comments: z.number(),
      reactions: z.number(),
      follows: z.number(),
    }),
  })
  .meta({ id: 'AdminAnalyticsResponse' });

// ===========================================================================
// 32. Audit logs
// ===========================================================================

const AdminAuditLogsResponse = z
  .object({
    logs: z.array(
      z.object({
        id: z.string(),
        adminId: z.string(),
        action: z.string(),
        resourceType: z.string(),
        resourceId: z.string().nullable(),
        previousValue: z.unknown().nullable(),
        newValue: z.unknown().nullable(),
        ipAddress: z.string().nullable(),
        metadata: z.record(z.string(), z.unknown()).nullable(),
        createdAt: z.string(),
        admin: AdminUserBrief,
      })
    ),
    pagination: z.object({
      limit: z.number(),
      offset: z.number().optional(),
      total: z.number().optional(),
      cursor: z.string().optional(),
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
    filters: z.object({
      actionTypes: z.array(z.string()),
      resourceTypes: z.array(z.string()),
    }),
  })
  .meta({ id: 'AdminAuditLogsResponse' });

// ===========================================================================
// 33. Performance
// ===========================================================================

const AdminPerformanceResponse = z
  .object({
    timestamp: z.string(),
    cache: z.object({
      hitRate: z.number(),
      hits: z.number(),
      misses: z.number(),
      avgLatencyMs: z.number(),
      operations: z.number(),
      bytesRead: z.number(),
      bytesWritten: z.number(),
    }),
    database: z.object({
      totalQueries: z.number(),
      slowQueries: z.number(),
      slowQueryRate: z.number(),
      avgDurationMs: z.number(),
      p95DurationMs: z.number(),
      p99DurationMs: z.number(),
      topSlowQueries: z.array(
        z.object({
          query: z.string(),
          count: z.number(),
          avgDuration: z.number(),
          maxDuration: z.number(),
        })
      ),
      operationCount: z.number(),
    }),
    storage: z.object({
      uploads: z.number(),
      downloads: z.number(),
      deletes: z.number(),
      errors: z.number(),
      errorRate: z.number(),
      avgUploadLatencyMs: z.number(),
      avgDownloadLatencyMs: z.number(),
      bytesUploaded: z.number(),
      bytesDownloaded: z.number(),
    }),
    system: z.object({
      cpuUsagePercent: z.number(),
      memoryUsageMB: z.number(),
      memoryUsagePercent: z.number(),
      uptimeSeconds: z.number(),
      activeRequests: z.number(),
      requestsPerSecond: z.number(),
    }),
    vercelCache: z.record(z.string(), z.unknown()).nullable(),
    bottlenecks: z.array(
      z.object({
        type: z.string(),
        severity: z.string(),
        description: z.string(),
        metric: z.string(),
        threshold: z.number(),
      })
    ),
    recommendations: z.array(z.string()),
    summary: z.object({
      criticalIssues: z.number(),
      warnings: z.number(),
      totalRecommendations: z.number(),
    }),
  })
  .meta({ id: 'AdminPerformanceResponse' });

// ===========================================================================
// 34. System health
// ===========================================================================

const AdminSystemHealthResponse = z
  .object({
    status: z.enum(['healthy', 'degraded', 'critical']),
    issues: z.array(z.string()),
    timestamp: z.string(),
    gameEngine: z.object({
      isRunning: z.boolean(),
      currentDay: z.number(),
      lastTickAt: z.string().nullable(),
      timeSinceLastTickMs: z.number().nullable(),
      tickIntervalMs: z.number(),
      uptimeMs: z.number(),
    }),
    activityMetrics: z.object({
      lastHour: z.object({ newUsers: z.number(), newPosts: z.number() }),
      last24Hours: z.object({ newUsers: z.number(), newPosts: z.number() }),
    }),
    recentErrors: z.array(z.record(z.string(), z.unknown())),
  })
  .meta({ id: 'AdminSystemHealthResponse' });

// ===========================================================================
// 35. Network stats
// ===========================================================================

const AdminNetworkStatsResponse = z
  .object({
    timestamp: z.string(),
    database: z.object({
      queries: z.object({
        total: z.number(),
        slow: z.number(),
        slowRate: z.number(),
        avgDuration: z.number(),
        p95Duration: z.number(),
        p99Duration: z.number(),
      }),
      topSlowQueries: z.array(
        z.object({
          query: z.string(),
          count: z.number(),
          avgDuration: z.number(),
          maxDuration: z.number(),
        })
      ),
      recentQueries: z.array(
        z.object({
          query: z.string(),
          duration: z.number(),
          timestamp: z.string(),
          model: z.string(),
          operation: z.string(),
        })
      ),
    }),
    server: z.object({
      uptime: z.object({ seconds: z.number(), formatted: z.string() }),
      memory: z.object({
        heapUsed: z.number(),
        heapTotal: z.number(),
        external: z.number(),
        rss: z.number(),
      }),
      env: z.string(),
      pid: z.number(),
    }),
    health: z.object({
      database: z.enum(['healthy', 'warning', 'critical']),
      memory: z.enum(['healthy', 'warning']),
      overall: z.enum(['healthy', 'warning', 'critical']),
    }),
  })
  .meta({ id: 'AdminNetworkStatsResponse' });

// ===========================================================================
// 36. Game stats
// ===========================================================================

const AdminGameStatsResponse = z
  .object({
    gameState: z.object({
      id: z.string(),
      isRunning: z.boolean(),
      currentDay: z.number(),
      currentDate: z.string(),
      startedAt: z.string().nullable(),
      pausedAt: z.string().nullable(),
      lastTickAt: z.string().nullable(),
      timeSinceLastTickMs: z.number().nullable(),
      tickIntervalMs: z.number(),
      uptimeMs: z.number(),
      uptimeMinutes: z.number(),
      uptimeHours: z.number(),
      estimatedTotalTicks: z.number(),
    }),
    totals: z.object({
      posts: z.number(),
      articles: z.number(),
      groupChats: z.number(),
      chatMessages: z.number(),
      llmCalls: z.number(),
      avgMessagesPerChat: z.number(),
    }),
    last24Hours: z.object({
      posts: z.number(),
      articles: z.number(),
      groupChats: z.number(),
      messages: z.number(),
      llmCalls: z.number(),
    }),
    lastHour: z.object({
      posts: z.number(),
      articles: z.number(),
      groupChats: z.number(),
      messages: z.number(),
      llmCalls: z.number(),
    }),
    last5Minutes: z.object({
      posts: z.number(),
      articles: z.number(),
      messages: z.number(),
      llmCalls: z.number(),
    }),
    lastMinute: z.object({
      posts: z.number(),
      articles: z.number(),
      messages: z.number(),
      llmCalls: z.number(),
    }),
    rates: z.object({
      postsPerMinute: z.number(),
      articlesPerMinute: z.number(),
      messagesPerMinute: z.number(),
      llmCallsPerMinute: z.number(),
      postsPerMinuteAvgHour: z.number(),
      articlesPerMinuteAvgHour: z.number(),
      messagesPerMinuteAvgHour: z.number(),
      llmCallsPerMinuteAvgHour: z.number(),
      postsPerMinuteAvgDay: z.number(),
      articlesPerMinuteAvgDay: z.number(),
      messagesPerMinuteAvgDay: z.number(),
      llmCallsPerMinuteAvgDay: z.number(),
    }),
    llmStats: z.object({
      totalCalls24h: z.number(),
      totalPromptTokens24h: z.number(),
      totalCompletionTokens24h: z.number(),
      totalTokens24h: z.number(),
      avgLatencyMs24h: z.number(),
    }),
  })
  .meta({ id: 'AdminGameStatsResponse' });

// ===========================================================================
// 37. Group invite
// ===========================================================================

const AdminGroupInviteResponse = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      chatId: z.string(),
      chatName: z.string(),
      npcId: z.string(),
      npcName: z.string(),
      userId: z.string(),
    }),
  })
  .meta({ id: 'AdminGroupInviteResponse' });

// ===========================================================================
// Generic success response
// ===========================================================================

const AdminSuccessMessage = z
  .object({ success: z.literal(true), message: z.string() })
  .meta({ id: 'AdminSuccessMessage' });

// ===========================================================================
//  PATH DEFINITIONS
// ===========================================================================

export const adminPaths: ZodOpenApiPathsObject = {
  // -----------------------------------------------------------------------
  // 1. Stats overview
  // -----------------------------------------------------------------------
  '/api/admin/stats': {
    get: {
      operationId: 'adminGetStats',
      tags: ['Admin'],
      summary: 'Get admin dashboard statistics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Dashboard statistics',
          content: { 'application/json': { schema: AdminStatsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 2. Stats – growth
  // -----------------------------------------------------------------------
  '/api/admin/stats/growth': {
    get: {
      operationId: 'adminGetGrowthStats',
      tags: ['Admin'],
      summary: 'Get growth analytics',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          period: z.enum(['day', 'week', 'month']).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          includeTimeSeries: z
            .string()
            .optional()
            .meta({ description: 'Set to "true" to include WAU time series' }),
        }),
      },
      responses: {
        '200': {
          description: 'Growth statistics',
          content: { 'application/json': { schema: AdminGrowthStatsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 3. Stats – users
  // -----------------------------------------------------------------------
  '/api/admin/stats/users': {
    get: {
      operationId: 'adminGetUserStats',
      tags: ['Admin'],
      summary: 'Get user statistics',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          userType: z.enum(['all', 'real', 'actors', 'agents']).optional(),
          includeTimeSeries: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'User statistics',
          content: { 'application/json': { schema: AdminUserStatsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 4. Stats – trading
  // -----------------------------------------------------------------------
  '/api/admin/stats/trading': {
    get: {
      operationId: 'adminGetTradingStats',
      tags: ['Admin'],
      summary: 'Get trading statistics',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          marketType: z.enum(['all', 'prediction', 'perpetual']).optional(),
          includeTimeSeries: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Trading statistics',
          content: {
            'application/json': { schema: AdminTradingStatsResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 5. Stats – timeseries
  // -----------------------------------------------------------------------
  '/api/admin/stats/timeseries': {
    get: {
      operationId: 'adminGetTimeseries',
      tags: ['Admin'],
      summary: 'Get metrics time series snapshots',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          environment: z.string().optional(),
          granularity: z.enum(['hourly', 'daily']).optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Time series data',
          content: { 'application/json': { schema: AdminTimeseriesResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 6. Stats – heatmap
  // -----------------------------------------------------------------------
  '/api/admin/stats/heatmap': {
    get: {
      operationId: 'adminGetHeatmap',
      tags: ['Admin'],
      summary: 'Get activity heatmap data',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          type: z.enum(['hourly', 'calendar']).optional(),
          activityType: z
            .enum(['all', 'trades', 'posts', 'messages'])
            .optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Heatmap data (hourly or calendar format)',
          content: {
            'application/json': {
              schema: z.union([
                AdminHeatmapHourlyResponse,
                AdminHeatmapCalendarResponse,
              ]),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 7. Stats – system
  // -----------------------------------------------------------------------
  '/api/admin/stats/system': {
    get: {
      operationId: 'adminGetSystemStats',
      tags: ['Admin'],
      summary: 'Get system status overview',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'System statistics',
          content: { 'application/json': { schema: AdminSystemStatsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 8. Users
  // -----------------------------------------------------------------------
  '/api/admin/users': {
    get: {
      operationId: 'adminGetUsers',
      tags: ['Admin'],
      summary: 'List users with filtering and sorting',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
          search: z.string().optional(),
          filter: z
            .enum(['all', 'actors', 'users', 'banned', 'admins'])
            .optional(),
          sortBy: z.string().optional(),
          sortOrder: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Paginated user list',
          content: { 'application/json': { schema: AdminUsersResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 9. Ban / unban user
  // -----------------------------------------------------------------------
  '/api/admin/users/{userId}/ban': {
    post: {
      operationId: 'adminBanUser',
      tags: ['Admin'],
      summary: 'Ban or unban a user',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          userId: z.string().meta({ description: 'Target user ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum(['ban', 'unban']),
              reason: z.string().optional(),
              isScammer: z.boolean().optional(),
              isCSAM: z.boolean().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Ban/unban result',
          content: { 'application/json': { schema: AdminBanUserResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 10. Agents list
  // -----------------------------------------------------------------------
  '/api/admin/agents': {
    get: {
      operationId: 'adminGetAgents',
      tags: ['Admin'],
      summary: 'List all agents with stats',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Agent list with aggregated stats',
          content: { 'application/json': { schema: AdminAgentsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 11. Toggle agent
  // -----------------------------------------------------------------------
  '/api/admin/agents/{agentId}/toggle': {
    post: {
      operationId: 'adminToggleAgent',
      tags: ['Admin'],
      summary: 'Enable or disable an agent',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          agentId: z.string().meta({ description: 'Agent ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({ enabled: z.boolean() }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Toggle result',
          content: { 'application/json': { schema: AdminSuccessMessage } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 12. Pause all agents
  // -----------------------------------------------------------------------
  '/api/admin/agents/pause-all': {
    post: {
      operationId: 'adminPauseAllAgents',
      tags: ['Admin'],
      summary: 'Pause all agents',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'All agents paused',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                data: z.object({ paused: z.literal('all') }),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 13. Resume all agents
  // -----------------------------------------------------------------------
  '/api/admin/agents/resume-all': {
    post: {
      operationId: 'adminResumeAllAgents',
      tags: ['Admin'],
      summary: 'Resume all agents',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'All agents resumed',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                message: z.string(),
                data: z.object({ resumed: z.number() }),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 14. Markets list
  // -----------------------------------------------------------------------
  '/api/admin/markets': {
    get: {
      operationId: 'adminGetMarkets',
      tags: ['Admin'],
      summary: 'List markets with stats',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          status: z.enum(['all', 'active', 'resolved', 'expired']).optional(),
          limit: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Market list with aggregate stats',
          content: { 'application/json': { schema: AdminMarketsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 15. Market detail / actions
  // -----------------------------------------------------------------------
  '/api/admin/markets/{marketId}': {
    get: {
      operationId: 'adminGetMarketDetail',
      tags: ['Admin'],
      summary: 'Get market details with positions and trades',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          marketId: z.string().meta({ description: 'Market ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Market detail',
          content: {
            'application/json': { schema: AdminMarketDetailResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminMarketAction',
      tags: ['Admin'],
      summary: 'Resolve, extend, or void a market',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          marketId: z.string().meta({ description: 'Market ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum(['resolve', 'extend', 'void']),
              resolution: z.boolean().optional(),
              newEndDate: z.string().optional(),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Action result',
          content: {
            'application/json': { schema: AdminMarketActionResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 16. Roles
  // -----------------------------------------------------------------------
  '/api/admin/roles': {
    get: {
      operationId: 'adminGetRoles',
      tags: ['Admin'],
      summary: 'List admin role assignments',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Admin roles list',
          content: { 'application/json': { schema: AdminRolesResponse } },
        },
      },
    },
    post: {
      operationId: 'adminManageRole',
      tags: ['Admin'],
      summary: 'Grant or revoke admin role',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              userId: z.string(),
              action: z.enum(['grant', 'revoke']),
              role: z.string().optional(),
              permissions: z.array(z.string()).optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Role action result',
          content: { 'application/json': { schema: AdminRoleActionResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 17. Admins list
  // -----------------------------------------------------------------------
  '/api/admin/admins': {
    get: {
      operationId: 'adminGetAdmins',
      tags: ['Admin'],
      summary: 'List all admin users',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Admin users',
          content: { 'application/json': { schema: AdminAdminsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 18. Promote / demote admin
  // -----------------------------------------------------------------------
  '/api/admin/admins/{userId}': {
    post: {
      operationId: 'adminPromoteDemote',
      tags: ['Admin'],
      summary: 'Promote or demote a user to/from admin',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({ userId: z.string().meta({ description: 'User ID' }) }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({ action: z.enum(['promote', 'demote']) }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Promote/demote result',
          content: {
            'application/json': { schema: AdminPromoteDemoteResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 19. Groups
  // -----------------------------------------------------------------------
  '/api/admin/groups': {
    get: {
      operationId: 'adminGetGroups',
      tags: ['Admin'],
      summary: 'List group chats',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          creator: z.string().optional(),
          sortBy: z
            .enum(['createdAt', 'memberCount', 'messageCount'])
            .optional(),
          sortOrder: z.string().optional(),
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Group list',
          content: { 'application/json': { schema: AdminGroupsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 20. Group messages
  // -----------------------------------------------------------------------
  '/api/admin/groups/{id}/messages': {
    get: {
      operationId: 'adminGetGroupMessages',
      tags: ['Admin'],
      summary: 'Get messages for a group chat',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Group chat ID' }),
        }),
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Group messages',
          content: {
            'application/json': { schema: AdminGroupMessagesResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 21. NFT collection groups
  // -----------------------------------------------------------------------
  '/api/admin/groups/nft-collection': {
    get: {
      operationId: 'adminGetNftCollectionGroups',
      tags: ['Admin'],
      summary: 'List NFT-gated groups',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'NFT-gated group list',
          content: {
            'application/json': { schema: AdminNftCollectionGetResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminCreateNftCollectionGroup',
      tags: ['Admin'],
      summary: 'Create an NFT-gated group',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string(),
              description: z.string().optional(),
              contractAddress: z.string(),
              chainId: z.number(),
              tokenId: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '201': {
          description: 'Group created',
          content: {
            'application/json': { schema: AdminNftCollectionCreateResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 22. Revalidate NFT group
  // -----------------------------------------------------------------------
  '/api/admin/groups/{id}/revalidate-nft': {
    post: {
      operationId: 'adminRevalidateNftGroup',
      tags: ['Admin'],
      summary: 'Revalidate NFT ownership for group members',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({ id: z.string().meta({ description: 'Group ID' }) }),
      },
      responses: {
        '200': {
          description: 'Revalidation results',
          content: {
            'application/json': { schema: AdminRevalidateNftResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 23. Feedback
  // -----------------------------------------------------------------------
  '/api/admin/feedback': {
    get: {
      operationId: 'adminGetFeedback',
      tags: ['Admin'],
      summary: 'List user feedback',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
          type: z.string().optional(),
          hasLinearIssue: z.string().optional(),
          search: z.string().optional(),
          fromDate: z.string().optional(),
          toDate: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Feedback list with stats',
          content: { 'application/json': { schema: AdminFeedbackResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 24. Retry feedback sync
  // -----------------------------------------------------------------------
  '/api/admin/feedback/{feedbackId}/retry-sync': {
    post: {
      operationId: 'adminRetryFeedbackSync',
      tags: ['Admin'],
      summary: 'Retry syncing feedback to Linear',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          feedbackId: z.string().meta({ description: 'Feedback ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Sync result',
          content: { 'application/json': { schema: AdminRetrySyncResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 25. Trades
  // -----------------------------------------------------------------------
  '/api/admin/trades': {
    get: {
      operationId: 'adminGetTrades',
      tags: ['Admin'],
      summary: 'List trades',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
          type: z.enum(['all', 'balance', 'npc', 'position']).optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Trade list',
          content: { 'application/json': { schema: AdminTradesResponse } },
        },
      },
    },
    post: {
      operationId: 'adminCreateTrade',
      tags: ['Admin'],
      summary: 'Create a manual trade',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                type: z.enum(['balance', 'npc']),
              })
              .catchall(z.unknown())
              .meta({
                description: 'Trade fields vary by type (balance or npc)',
              }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Created trade',
          content: { 'application/json': { schema: AdminCreateTradeResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 26. Reports
  // -----------------------------------------------------------------------
  '/api/admin/reports': {
    get: {
      operationId: 'adminGetReports',
      tags: ['Admin'],
      summary: 'List moderation reports',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
          status: z.string().optional(),
          category: z.string().optional(),
          priority: z.string().optional(),
          reportType: z.string().optional(),
          reporterId: z.string().optional(),
          reportedUserId: z.string().optional(),
          reportedPostId: z.string().optional(),
          sortBy: z.string().optional(),
          sortOrder: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Report list',
          content: { 'application/json': { schema: AdminReportsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 27. Report detail / actions
  // -----------------------------------------------------------------------
  '/api/admin/reports/{reportId}': {
    get: {
      operationId: 'adminGetReportDetail',
      tags: ['Admin'],
      summary: 'Get report details with related reports',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          reportId: z.string().meta({ description: 'Report ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Report detail',
          content: {
            'application/json': { schema: AdminReportDetailResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminReportAction',
      tags: ['Admin'],
      summary: 'Resolve, dismiss, escalate, ban, or evaluate a report',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          reportId: z.string().meta({ description: 'Report ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum([
                'resolve',
                'dismiss',
                'escalate',
                'ban_user',
                'evaluate',
              ]),
              resolution: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Action result',
          content: { 'application/json': { schema: AdminSuccessMessage } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 28. Report stats
  // -----------------------------------------------------------------------
  '/api/admin/reports/stats': {
    get: {
      operationId: 'adminGetReportStats',
      tags: ['Admin'],
      summary: 'Get report statistics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Report stats',
          content: { 'application/json': { schema: AdminReportStatsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 29. Resolutions
  // -----------------------------------------------------------------------
  '/api/admin/resolutions': {
    get: {
      operationId: 'adminGetResolutions',
      tags: ['Admin'],
      summary: 'List pending market resolutions',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Resolution list',
          content: { 'application/json': { schema: AdminResolutionsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 30. Resolution action
  // -----------------------------------------------------------------------
  '/api/admin/resolutions/{id}': {
    post: {
      operationId: 'adminResolutionAction',
      tags: ['Admin'],
      summary: 'Approve or reject a resolution',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Resolution ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({ action: z.enum(['approve', 'reject']) }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Action result',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                postponedUntil: z.string().optional(),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 31. Human review list
  // -----------------------------------------------------------------------
  '/api/admin/moderation/human-review': {
    get: {
      operationId: 'adminGetHumanReview',
      tags: ['Admin'],
      summary: 'List users pending human review',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Appeals list',
          content: { 'application/json': { schema: AdminHumanReviewResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 32. Human review action
  // -----------------------------------------------------------------------
  '/api/admin/moderation/human-review/{userId}': {
    post: {
      operationId: 'adminHumanReviewAction',
      tags: ['Admin'],
      summary: 'Approve or deny a user appeal',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          userId: z.string().meta({ description: 'User ID under review' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum(['approve', 'deny']),
              reasoning: z.string(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Review result',
          content: { 'application/json': { schema: AdminSuccessMessage } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 33. Create moderation escrow payment
  // -----------------------------------------------------------------------
  '/api/admin/moderation-escrow/create-payment': {
    post: {
      operationId: 'adminCreateEscrowPayment',
      tags: ['Admin'],
      summary: 'Create a moderation escrow payment',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              recipientId: z.string(),
              amountUSD: z.number(),
              reason: z.string().optional(),
              recipientWalletAddress: z.string(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Escrow created',
          content: {
            'application/json': { schema: AdminCreateEscrowResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 34. Verify escrow payment
  // -----------------------------------------------------------------------
  '/api/admin/moderation-escrow/verify-payment': {
    post: {
      operationId: 'adminVerifyEscrowPayment',
      tags: ['Admin'],
      summary: 'Verify an on-chain escrow payment',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              escrowId: z.string(),
              txHash: z.string(),
              fromAddress: z.string(),
              toAddress: z.string(),
              amount: z.number(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Payment verified',
          content: {
            'application/json': { schema: AdminVerifyEscrowPaymentResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 35. Refund escrow
  // -----------------------------------------------------------------------
  '/api/admin/moderation-escrow/refund': {
    post: {
      operationId: 'adminRefundEscrow',
      tags: ['Admin'],
      summary: 'Refund a moderation escrow',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              escrowId: z.string(),
              refundTxHash: z.string(),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Escrow refunded',
          content: {
            'application/json': { schema: AdminRefundEscrowResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 36. Expire escrows
  // -----------------------------------------------------------------------
  '/api/admin/moderation-escrow/expire': {
    post: {
      operationId: 'adminExpireEscrows',
      tags: ['Admin'],
      summary: 'Expire stale moderation escrows',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Expired escrow count',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                expiredCount: z.number(),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 37. List escrows
  // -----------------------------------------------------------------------
  '/api/admin/moderation-escrow/list': {
    get: {
      operationId: 'adminListEscrows',
      tags: ['Admin'],
      summary: 'List moderation escrows',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          recipientId: z.string().optional(),
          adminId: z.string().optional(),
          status: z.string().optional(),
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Escrow list',
          content: { 'application/json': { schema: AdminListEscrowResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 38. AI models
  // -----------------------------------------------------------------------
  '/api/admin/ai-models': {
    get: {
      operationId: 'adminGetAiModels',
      tags: ['Admin'],
      summary: 'Get available AI model providers',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'AI model providers and recommendations',
          content: { 'application/json': { schema: AdminAiModelsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 39. Test AI model
  // -----------------------------------------------------------------------
  '/api/admin/ai-models/test': {
    post: {
      operationId: 'adminTestAiModel',
      tags: ['Admin'],
      summary: 'Run an AI model test inference',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Test result with latency',
          content: { 'application/json': { schema: AdminAiModelTestResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 40. Training status
  // -----------------------------------------------------------------------
  '/api/admin/training/status': {
    get: {
      operationId: 'adminGetTrainingStatus',
      tags: ['Admin'],
      summary: 'Get training pipeline status',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Training status',
          content: {
            'application/json': { schema: AdminTrainingStatusResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 41. Training trigger
  // -----------------------------------------------------------------------
  '/api/admin/training/trigger': {
    get: {
      operationId: 'adminGetTrainingReadiness',
      tags: ['Admin'],
      summary: 'Check training readiness',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Training readiness check',
          content: {
            'application/json': { schema: AdminTrainingTriggerGetResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminTriggerTraining',
      tags: ['Admin'],
      summary: 'Trigger a training run',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              force: z.boolean().optional(),
              batchSize: z.number().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Training trigger result',
          content: {
            'application/json': { schema: AdminTrainingTriggerPostResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 42. Deploy model
  // -----------------------------------------------------------------------
  '/api/admin/training/deploy': {
    post: {
      operationId: 'adminDeployModel',
      tags: ['Admin'],
      summary: 'Deploy a trained model',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              modelVersion: z.string(),
              strategy: z.string().optional(),
              rolloutPercentage: z.number().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Deployment result',
          content: {
            'application/json': { schema: AdminTrainingDeployResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 43. Rollback model
  // -----------------------------------------------------------------------
  '/api/admin/training/rollback': {
    post: {
      operationId: 'adminRollbackModel',
      tags: ['Admin'],
      summary: 'Rollback to a previous model version',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({ targetVersion: z.string() }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Rollback result',
          content: {
            'application/json': { schema: AdminTrainingRollbackResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 44. Benchmark
  // -----------------------------------------------------------------------
  '/api/admin/training/benchmark': {
    get: {
      operationId: 'adminGetBenchmarkSummary',
      tags: ['Admin'],
      summary: 'Get benchmark summary',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Benchmark summary',
          content: {
            'application/json': { schema: AdminTrainingBenchmarkGetResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminRunBenchmark',
      tags: ['Admin'],
      summary: 'Run a benchmark on a model',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              modelId: z.string(),
              compare: z.string().optional(),
              threshold: z.number().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Benchmark result',
          content: {
            'application/json': { schema: AdminTrainingBenchmarkPostResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 45. Model selection
  // -----------------------------------------------------------------------
  '/api/admin/training/model-selection': {
    get: {
      operationId: 'adminGetModelSelection',
      tags: ['Admin'],
      summary: 'Get automatic model selection result',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Model selection',
          content: {
            'application/json': { schema: AdminModelSelectionResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 46. Training models
  // -----------------------------------------------------------------------
  '/api/admin/training/models': {
    get: {
      operationId: 'adminGetTrainingModels',
      tags: ['Admin'],
      summary: 'List trained models',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Trained model list',
          content: {
            'application/json': { schema: AdminTrainingModelsResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 47. Training data
  // -----------------------------------------------------------------------
  '/api/admin/training-data': {
    get: {
      operationId: 'adminGetTrainingData',
      tags: ['Admin'],
      summary: 'Get training data summary and quality metrics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Training data overview',
          content: {
            'application/json': { schema: AdminTrainingDataResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 48. Upload model
  // -----------------------------------------------------------------------
  '/api/admin/training/upload-model': {
    post: {
      operationId: 'adminUploadModel',
      tags: ['Admin'],
      summary: 'Upload a trained model file',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              model: z.string().meta({ description: 'Model file (binary)' }),
              version: z.string(),
              metadata: z
                .string()
                .meta({ description: 'JSON-encoded metadata' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Upload result',
          content: { 'application/json': { schema: AdminUploadModelResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 49. Content queue
  // -----------------------------------------------------------------------
  '/api/admin/content-queue': {
    get: {
      operationId: 'adminGetContentQueue',
      tags: ['Admin'],
      summary: 'List flagged content for review',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          type: z.enum(['all', 'posts', 'comments']).optional(),
          status: z.enum(['pending', 'resolved']).optional(),
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Content queue',
          content: {
            'application/json': { schema: AdminContentQueueResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 50. Content queue action
  // -----------------------------------------------------------------------
  '/api/admin/content-queue/{contentId}': {
    post: {
      operationId: 'adminContentAction',
      tags: ['Admin'],
      summary: 'Approve or hide flagged content',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          contentId: z.string().meta({ description: 'Content ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.enum(['approve', 'hide']),
              contentType: z.enum(['post', 'comment']),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Action result',
          content: {
            'application/json': { schema: AdminContentActionResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 51. Cron metrics
  // -----------------------------------------------------------------------
  '/api/admin/cron-metrics': {
    get: {
      operationId: 'adminGetCronMetrics',
      tags: ['Admin'],
      summary: 'Get cron job dashboard metrics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Cron metrics',
          content: { 'application/json': { schema: AdminCronMetricsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 52. Permissions
  // -----------------------------------------------------------------------
  '/api/admin/permissions': {
    get: {
      operationId: 'adminGetPermissions',
      tags: ['Admin'],
      summary: 'Get current admin permissions and role hierarchy',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Permission details',
          content: { 'application/json': { schema: AdminPermissionsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 53. Alpha group config
  // -----------------------------------------------------------------------
  '/api/admin/alpha-groups/config': {
    get: {
      operationId: 'adminGetAlphaGroupConfig',
      tags: ['Admin'],
      summary: 'Get alpha group configuration',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Alpha group config',
          content: {
            'application/json': { schema: AdminAlphaGroupConfigGetResponse },
          },
        },
      },
    },
    patch: {
      operationId: 'adminPatchAlphaGroupConfig',
      tags: ['Admin'],
      summary: 'Propose alpha group config changes',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .record(z.string(), z.unknown())
              .meta({ description: 'Config key-value pairs to update' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Config change proposal',
          content: {
            'application/json': { schema: AdminAlphaGroupConfigPatchResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 54. Alpha group stats
  // -----------------------------------------------------------------------
  '/api/admin/alpha-groups/stats': {
    get: {
      operationId: 'adminGetAlphaGroupStats',
      tags: ['Admin'],
      summary: 'Get alpha group statistics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Alpha group stats',
          content: {
            'application/json': { schema: AdminAlphaGroupStatsResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 55. Whitelist
  // -----------------------------------------------------------------------
  '/api/admin/whitelist': {
    get: {
      operationId: 'adminGetWhitelist',
      tags: ['Admin'],
      summary: 'List whitelist entries',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          source: z.string().optional(),
          search: z.string().optional(),
          includeRevoked: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Whitelist entries with stats',
          content: {
            'application/json': { schema: AdminWhitelistGetResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminAddWhitelist',
      tags: ['Admin'],
      summary: 'Add a user to the whitelist',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              userId: z.string(),
              source: z.string().optional(),
              reason: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Whitelist entry created',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                id: z.string(),
                username: z.string(),
              }),
            },
          },
        },
      },
    },
    delete: {
      operationId: 'adminRemoveWhitelist',
      tags: ['Admin'],
      summary: 'Remove a user from the whitelist',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({ userId: z.string() }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Whitelist entry removed',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                removedUserId: z.string(),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 56. Whitelist config
  // -----------------------------------------------------------------------
  '/api/admin/whitelist/config': {
    get: {
      operationId: 'adminGetWhitelistConfig',
      tags: ['Admin'],
      summary: 'Get whitelist configuration',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Whitelist config',
          content: {
            'application/json': { schema: AdminWhitelistConfigGetResponse },
          },
        },
      },
    },
    put: {
      operationId: 'adminUpdateWhitelistConfig',
      tags: ['Admin'],
      summary: 'Update whitelist configuration',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              leaderboardRankThreshold: z.number(),
              leaderboardCategory: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Updated config',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                config: z.record(z.string(), z.unknown()),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 57. World facts
  // -----------------------------------------------------------------------
  '/api/admin/world-facts': {
    get: {
      operationId: 'adminGetWorldFacts',
      tags: ['Admin'],
      summary: 'Get world facts, RSS feeds, and character mappings',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'World facts',
          content: {
            'application/json': { schema: AdminWorldFactsGetResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminWorldFactAction',
      tags: ['Admin'],
      summary: 'Perform a world facts action',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              action: z.string().meta({
                description:
                  'Action type (update_fact, add_fact, bulk_update_facts, toggle_fact, delete_fact, fetch_rss, generate_parodies, refresh_mappings, generate_world_facts)',
              }),
              data: z
                .record(z.string(), z.unknown())
                .meta({ description: 'Action-specific payload' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Action result (varies by action)',
          content: {
            'application/json': {
              schema: z
                .record(z.string(), z.unknown())
                .meta({ description: 'Response shape varies by action' }),
            },
          },
        },
      },
    },
    delete: {
      operationId: 'adminDeleteWorldFact',
      tags: ['Admin'],
      summary: 'Delete a world fact',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          id: z.string().meta({ description: 'World fact ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Fact deleted',
          content: {
            'application/json': {
              schema: z.object({ success: z.literal(true) }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 58. Environment
  // -----------------------------------------------------------------------
  '/api/admin/environment': {
    get: {
      operationId: 'adminGetEnvironment',
      tags: ['Admin'],
      summary: 'Get current environment info',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Environment details',
          content: {
            'application/json': { schema: AdminEnvironmentGetResponse },
          },
        },
      },
    },
    post: {
      operationId: 'adminSetEnvironment',
      tags: ['Admin'],
      summary: 'Set preferred environment',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              environment: z.enum(['production', 'staging', 'development']),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Environment set',
          content: {
            'application/json': {
              schema: z.object({
                success: z.literal(true),
                environment: z.string(),
                message: z.string(),
              }),
            },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 59. Load test
  // -----------------------------------------------------------------------
  '/api/admin/load-test': {
    get: {
      operationId: 'adminGetLoadTestStatus',
      tags: ['Admin'],
      summary: 'Get load test status',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Load test status',
          content: { 'application/json': { schema: AdminLoadTestGetResponse } },
        },
      },
    },
    post: {
      operationId: 'adminStartLoadTest',
      tags: ['Admin'],
      summary: 'Start a load test',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              scenario: z.enum(['LIGHT', 'NORMAL', 'HEAVY', 'STRESS']),
              baseUrl: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Load test started',
          content: {
            'application/json': { schema: AdminLoadTestPostResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 60. Debug DM
  // -----------------------------------------------------------------------
  '/api/admin/debug-dm': {
    get: {
      operationId: 'adminDebugDm',
      tags: ['Admin'],
      summary: 'Debug DM chats for a user',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          userId: z.string().meta({ description: 'User ID to debug' }),
        }),
      },
      responses: {
        '200': {
          description: 'DM debug info',
          content: { 'application/json': { schema: AdminDebugDmResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 61. Test DM messages
  // -----------------------------------------------------------------------
  '/api/admin/test-dm-messages': {
    post: {
      operationId: 'adminTestDmMessages',
      tags: ['Admin'],
      summary: 'Send test DM messages between users',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              senderId: z.string(),
              recipientId: z.string(),
              messageCount: z.number(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Test messages sent',
          content: { 'application/json': { schema: AdminTestDmResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 62. Fees
  // -----------------------------------------------------------------------
  '/api/admin/fees': {
    get: {
      operationId: 'adminGetFees',
      tags: ['Admin'],
      summary: 'Get fee analytics',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Fee analytics',
          content: { 'application/json': { schema: AdminFeesResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 63. Notifications
  // -----------------------------------------------------------------------
  '/api/admin/notifications': {
    post: {
      operationId: 'adminSendNotification',
      tags: ['Admin'],
      summary: 'Send a notification to a user or all users',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              userId: z.string().optional(),
              message: z.string(),
              type: z.string().optional(),
              postId: z.string().optional(),
              commentId: z.string().optional(),
              link: z.string().optional(),
              sendToAll: z.boolean().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Notification sent',
          content: {
            'application/json': { schema: AdminNotificationResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 64. Signal analysis
  // -----------------------------------------------------------------------
  '/api/admin/signal-analysis': {
    get: {
      operationId: 'adminGetSignalAnalysis',
      tags: ['Admin'],
      summary: 'Get signal analysis for a question',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          questionNumber: z.string().meta({ description: 'Question number' }),
        }),
      },
      responses: {
        '200': {
          description: 'Signal analysis',
          content: {
            'application/json': { schema: AdminSignalAnalysisResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 65. Analytics
  // -----------------------------------------------------------------------
  '/api/admin/analytics': {
    get: {
      operationId: 'adminGetAnalytics',
      tags: ['Admin'],
      summary: 'Get engagement analytics time series',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          period: z.enum(['day', 'week', 'month']).optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Analytics data',
          content: { 'application/json': { schema: AdminAnalyticsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 66. Audit logs
  // -----------------------------------------------------------------------
  '/api/admin/audit-logs': {
    get: {
      operationId: 'adminGetAuditLogs',
      tags: ['Admin'],
      summary: 'List admin audit logs',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
          cursor: z.string().optional(),
          adminId: z.string().optional(),
          action: z.string().optional(),
          resourceType: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Audit log list',
          content: { 'application/json': { schema: AdminAuditLogsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 67. Performance
  // -----------------------------------------------------------------------
  '/api/admin/performance': {
    get: {
      operationId: 'adminGetPerformance',
      tags: ['Admin'],
      summary: 'Get system performance metrics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Performance metrics',
          content: { 'application/json': { schema: AdminPerformanceResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 68. System health
  // -----------------------------------------------------------------------
  '/api/admin/system-health': {
    get: {
      operationId: 'adminGetSystemHealth',
      tags: ['Admin'],
      summary: 'Get system health status',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'System health',
          content: {
            'application/json': { schema: AdminSystemHealthResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 69. Network stats
  // -----------------------------------------------------------------------
  '/api/admin/network-stats': {
    get: {
      operationId: 'adminGetNetworkStats',
      tags: ['Admin'],
      summary: 'Get network and database statistics',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Network stats',
          content: {
            'application/json': { schema: AdminNetworkStatsResponse },
          },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 70. Game stats
  // -----------------------------------------------------------------------
  '/api/admin/game-stats': {
    get: {
      operationId: 'adminGetGameStats',
      tags: ['Admin'],
      summary: 'Get game engine stats and activity rates',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Game stats',
          content: { 'application/json': { schema: AdminGameStatsResponse } },
        },
      },
    },
  },

  // -----------------------------------------------------------------------
  // 71. Group invite
  // -----------------------------------------------------------------------
  '/api/admin/group-invite': {
    post: {
      operationId: 'adminGroupInvite',
      tags: ['Admin'],
      summary: 'Invite a user to an NPC group chat',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              npcId: z.string(),
              userId: z.string(),
              chatId: z.string().optional(),
              chatName: z.string().optional(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Invite result',
          content: { 'application/json': { schema: AdminGroupInviteResponse } },
        },
      },
    },
  },
};
