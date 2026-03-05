import { z } from 'zod';

// ===========================================================================
// Shared / reusable fragments
// ===========================================================================

export const AdminUserBrief = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  profileImageUrl: z.string().nullable(),
});

export const PaginationMeta = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

// ===========================================================================
// 1. Stats
// ===========================================================================

export const AdminStatsResponse = z
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

export const AdminGrowthTrend = z.object({
  current: z.number(),
  previous: z.number(),
  change: z.number(),
  trend: z.enum(['up', 'down', 'stable']),
});

export const AdminGrowthStatsResponse = z
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

export const AdminUserStatsResponse = z
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

export const AdminTradingStatsResponse = z
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

export const AdminTimeseriesResponse = z
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

export const AdminHeatmapHourlyResponse = z
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

export const AdminHeatmapCalendarResponse = z
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

export const AdminSystemStatsResponse = z
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

export const AdminUserRecord = z.object({
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

export const AdminUsersResponse = z
  .object({
    users: z.array(AdminUserRecord),
    pagination: PaginationMeta,
  })
  .meta({ id: 'AdminUsersResponse' });

export const AdminBanUserResponse = z
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

export const AdminAgentRecord = z.object({
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

export const AdminAgentsResponse = z
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

export const AdminMarketRecord = z.object({
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

export const AdminMarketsResponse = z
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

export const AdminMarketDetailResponse = z
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

export const AdminMarketActionResponse = z
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

export const AdminRolesResponse = z
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

export const AdminRoleActionResponse = z
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

export const AdminAdminsResponse = z
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

export const AdminPromoteDemoteResponse = z
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

export const AdminGroupsResponse = z
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

export const AdminGroupMessagesResponse = z
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

export const AdminNftCollectionGetResponse = z
  .object({
    groups: z.array(
      z
        .record(z.string(), z.unknown())
        .meta({ description: 'Chat fields with memberCount' })
    ),
    total: z.number(),
  })
  .meta({ id: 'AdminNftCollectionGetResponse' });

export const AdminNftCollectionCreateResponse = z
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

export const AdminRevalidateNftResponse = z
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

export const AdminFeedbackResponse = z
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

export const AdminRetrySyncResponse = z
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

export const AdminTradesResponse = z
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

export const AdminCreateTradeResponse = z
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

export const AdminReportRecord = z.object({
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

export const AdminReportsResponse = z
  .object({
    reports: z.array(AdminReportRecord),
    pagination: PaginationMeta,
  })
  .meta({ id: 'AdminReportsResponse' });

export const AdminReportDetailResponse = z
  .object({
    report: AdminReportRecord,
    relatedReports: z.array(AdminReportRecord),
  })
  .meta({ id: 'AdminReportDetailResponse' });

export const AdminReportStatsResponse = z
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

export const AdminResolutionsResponse = z
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

export const AdminHumanReviewResponse = z
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

export const AdminCreateEscrowResponse = z
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

export const AdminVerifyEscrowPaymentResponse = z
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

export const AdminRefundEscrowResponse = z
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

export const AdminListEscrowResponse = z
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

export const AdminAiModelsResponse = z
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

export const AdminAiModelTestResponse = z
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

export const AdminTrainingStatusResponse = z
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

export const AdminTrainingTriggerGetResponse = z.record(z.string(), z.unknown()).meta({
  id: 'AdminTrainingTriggerGetResponse',
  description:
    'Training readiness check result from automationPipeline.checkTrainingReadiness()',
});

export const AdminTrainingTriggerPostResponse = z
  .record(z.string(), z.unknown())
  .meta({
    id: 'AdminTrainingTriggerPostResponse',
    description:
      'Training trigger result from automationPipeline.triggerTraining()',
  });

export const AdminTrainingDeployResponse = z.record(z.string(), z.unknown()).meta({
  id: 'AdminTrainingDeployResponse',
  description: 'Deployment result from modelDeployer.deploy()',
});

export const AdminTrainingRollbackResponse = z.record(z.string(), z.unknown()).meta({
  id: 'AdminTrainingRollbackResponse',
  description: 'Rollback result from modelDeployer.rollback()',
});

export const AdminTrainingBenchmarkPostResponse = z
  .object({
    success: z.literal(true),
    benchmark: z.record(z.string(), z.unknown()),
    comparison: z.record(z.string(), z.unknown()).nullable(),
  })
  .meta({ id: 'AdminTrainingBenchmarkPostResponse' });

export const AdminTrainingBenchmarkGetResponse = z
  .object({
    success: z.literal(true),
    summary: z.record(z.string(), z.unknown()),
  })
  .meta({ id: 'AdminTrainingBenchmarkGetResponse' });

export const AdminModelSelectionResponse = z
  .object({
    success: z.literal(true),
    summary: z.record(z.string(), z.unknown()),
    selection: z.record(z.string(), z.unknown()).nullable(),
    selectionError: z.unknown().nullable(),
  })
  .meta({ id: 'AdminModelSelectionResponse' });

export const AdminTrainingModelsResponse = z
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

export const AdminTrainingDataResponse = z
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

export const AdminUploadModelResponse = z
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

export const AdminContentQueueResponse = z
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

export const AdminContentActionResponse = z
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

export const AdminCronMetricsResponse = z
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

export const AdminPermissionsResponse = z
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

export const AdminAlphaGroupConfigGetResponse = z
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

export const AdminAlphaGroupConfigPatchResponse = z
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

export const AdminAlphaGroupStatsResponse = z
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

export const AdminWhitelistGetResponse = z
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

export const AdminWhitelistConfigGetResponse = z
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

export const AdminWorldFactsGetResponse = z
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

export const AdminEnvironmentGetResponse = z
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

export const AdminLoadTestGetResponse = z
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

export const AdminLoadTestPostResponse = z
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

export const AdminDebugDmResponse = z
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

export const AdminTestDmResponse = z
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

export const AdminFeesResponse = z
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

export const AdminNotificationResponse = z
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

export const AdminSignalAnalysisResponse = z
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

export const AdminAnalyticsResponse = z
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

export const AdminAuditLogsResponse = z
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

export const AdminPerformanceResponse = z
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

export const AdminSystemHealthResponse = z
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

export const AdminNetworkStatsResponse = z
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

export const AdminGameStatsResponse = z
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

export const AdminGroupInviteResponse = z
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
// Request body schemas (shared with route handlers)
// ===========================================================================

export const AdminActionBody = z
  .object({
    action: z.enum(['promote', 'demote']),
  })
  .meta({ id: 'AdminActionBody' });

export const AdminAlphaGroupConfigUpdateBody = z
  .object({
    inviteProbabilityMultiplier: z.number().min(0).max(10).optional(),
    maxInvitesPerTick: z.number().int().min(1).max(100).optional(),
    topUsersToConsider: z.number().int().min(1).max(100).optional(),
    minReplies: z.number().int().min(0).max(100).optional(),
    minLikes: z.number().int().min(0).max(100).optional(),
    minTotalInteractions: z.number().int().min(0).max(500).optional(),
    minQualityScore: z.number().min(0).max(1).optional(),
    maxInteractionsPerDay: z.number().int().min(1).max(1000).optional(),
    tradeWeight: z.number().min(0).max(100).optional(),
    profitableTradeBonus: z.number().min(0).max(100).optional(),
    includeTradingActivity: z.boolean().optional(),
    fastTrackEnabled: z.boolean().optional(),
    fastTrackMinTrades: z.number().int().min(1).max(1000).optional(),
    fastTrackMinPnL: z.number().min(0).optional(),
    fastTrackMinWinRate: z.number().min(0).max(1).optional(),
    inviteDecayEnabled: z.boolean().optional(),
    inviteDecayBaseHours: z.number().int().min(1).max(720).optional(),
    inviteDecayMaxHours: z.number().int().min(1).max(8760).optional(),
    inviteDecayMaxDeclines: z.number().int().min(1).max(100).optional(),
    inviteDecayResetDays: z.number().int().min(1).max(365).optional(),
    inviteCooldownHours: z.number().int().min(0).max(168).optional(),
    perNpcCustomizationEnabled: z.boolean().optional(),
    grandfatheringEnabled: z.boolean().optional(),
  })
  .meta({ id: 'AdminAlphaGroupConfigUpdateBody' });

export const AdminModerateContentBody = z
  .object({
    action: z.enum(['approve', 'hide']),
    contentType: z.enum(['post', 'comment']),
    reason: z.string().max(500).optional(),
  })
  .meta({ id: 'AdminModerateContentBody' });

export const AdminCreateNftCollectionGroupBody = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    contractAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format')
      .transform((addr) => addr.toLowerCase()),
    chainId: z.number().int().positive(),
    tokenId: z.number().int().min(0).nullable().optional(),
  })
  .meta({ id: 'AdminCreateNftCollectionGroupBody' });

export const AdminLoadTestBody = z
  .object({
    scenario: z.enum(['LIGHT', 'NORMAL', 'HEAVY', 'STRESS']),
    baseUrl: z.string().url().optional(),
  })
  .meta({ id: 'AdminLoadTestBody' });

export const AdminMarketActionBody = z
  .object({
    action: z.enum(['resolve', 'extend', 'void']),
    resolution: z.boolean().optional(),
    newEndDate: z.string().optional(),
    reason: z.string().optional(),
  })
  .meta({ id: 'AdminMarketActionBody' });

export const AdminCreateEscrowPaymentBody = z
  .object({
    recipientId: z.string().min(1, 'Recipient ID is required'),
    amountUSD: z.number().positive('Amount must be positive'),
    reason: z.string().optional(),
    recipientWalletAddress: z
      .string()
      .min(1, 'Recipient wallet address is required'),
  })
  .meta({ id: 'AdminCreateEscrowPaymentBody' });

export const AdminRefundEscrowBody = z
  .object({
    escrowId: z.string().min(1, 'Escrow ID is required'),
    refundTxHash: z.string().min(1, 'Refund transaction hash is required'),
    reason: z.string().optional(),
  })
  .meta({ id: 'AdminRefundEscrowBody' });

export const AdminVerifyEscrowPaymentBody = z
  .object({
    escrowId: z.string().min(1, 'Escrow ID is required'),
    txHash: z.string().min(1, 'Transaction hash is required'),
    fromAddress: z.string().min(1, 'From address is required'),
    toAddress: z.string().min(1, 'To address is required'),
    amount: z.string().min(1, 'Amount is required'),
  })
  .meta({ id: 'AdminVerifyEscrowPaymentBody' });

export const AdminHumanReviewActionBody = z
  .object({
    action: z.enum(['approve', 'deny']),
    reasoning: z.string().min(10).max(2000),
  })
  .meta({ id: 'AdminHumanReviewActionBody' });

export const AdminCreateNotificationBody = z
  .object({
    userId: z.string().optional(),
    message: z.string().min(1).max(500),
    type: z
      .enum([
        'system',
        'comment',
        'reaction',
        'follow',
        'mention',
        'reply',
        'share',
      ])
      .default('system'),
    postId: z.string().optional(),
    commentId: z.string().optional(),
    link: z.string().optional(),
    sendToAll: z.boolean().default(false),
  })
  .meta({ id: 'AdminCreateNotificationBody' });

export const AdminResolutionActionBody = z
  .object({
    action: z.enum(['approve', 'reject']),
  })
  .meta({ id: 'AdminResolutionActionBody' });

export const AdminRoleRequestBody = z
  .object({
    userId: z.string().min(1, 'userId is required'),
    action: z.enum(['grant', 'revoke']),
    role: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  })
  .meta({ id: 'AdminRoleRequestBody' });

export const AdminTestDmMessagesBody = z
  .object({
    senderId: z.string().min(1),
    recipientId: z.string().min(1),
    messageCount: z.number().min(1).max(200).default(100),
  })
  .meta({ id: 'AdminTestDmMessagesBody' });

export const AdminBanUserBody = z
  .object({
    action: z.enum(['ban', 'unban']),
    reason: z.string().min(1).max(500).optional(),
    isScammer: z.boolean().optional(),
    isCSAM: z.boolean().optional(),
  })
  .meta({ id: 'AdminBanUserBody' });

export const AdminCreateBalanceTradeBody = z.object({
  type: z.literal('balance'),
  userId: z.string().min(1),
  transactionType: z.enum([
    'pred_buy',
    'pred_sell',
    'perp_open',
    'perp_close',
    'perp_liquidation',
    'deposit',
    'withdrawal',
  ]),
  amount: z.number(),
  description: z.string().optional(),
  relatedId: z.string().optional(),
  updateBalance: z.boolean().default(true),
});

export const AdminCreateNPCTradeBody = z.object({
  type: z.literal('npc'),
  npcActorId: z.string().min(1),
  marketType: z.enum(['prediction', 'perp']),
  ticker: z.string().optional(),
  marketId: z.string().optional(),
  action: z.string().min(1),
  side: z.string().optional(),
  amount: z.number().positive(),
  price: z.number().positive(),
  sentiment: z.number().optional(),
  reason: z.string().optional(),
  poolId: z.string().optional(),
  postId: z.string().optional(),
});

export const AdminCreateTradeBody = z
  .discriminatedUnion('type', [AdminCreateBalanceTradeBody, AdminCreateNPCTradeBody])
  .meta({ id: 'AdminCreateTradeBody' });

// ===========================================================================
// Generic success response
// ===========================================================================

export const AdminSuccessMessage = z
  .object({ success: z.literal(true), message: z.string() })
  .meta({ id: 'AdminSuccessMessage' });

