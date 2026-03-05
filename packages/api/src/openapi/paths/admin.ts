import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  AdminStatsResponse,
  AdminGrowthStatsResponse,
  AdminUserStatsResponse,
  AdminTradingStatsResponse,
  AdminTimeseriesResponse,
  AdminHeatmapHourlyResponse,
  AdminHeatmapCalendarResponse,
  AdminSystemStatsResponse,
  AdminUsersResponse,
  AdminBanUserResponse,
  AdminAgentsResponse,
  AdminSuccessMessage,
  AdminMarketsResponse,
  AdminMarketDetailResponse,
  AdminMarketActionResponse,
  AdminRolesResponse,
  AdminRoleActionResponse,
  AdminAdminsResponse,
  AdminPromoteDemoteResponse,
  AdminGroupsResponse,
  AdminGroupMessagesResponse,
  AdminNftCollectionGetResponse,
  AdminNftCollectionCreateResponse,
  AdminRevalidateNftResponse,
  AdminFeedbackResponse,
  AdminRetrySyncResponse,
  AdminTradesResponse,
  AdminCreateTradeResponse,
  AdminReportsResponse,
  AdminReportDetailResponse,
  AdminReportStatsResponse,
  AdminResolutionsResponse,
  AdminHumanReviewResponse,
  AdminCreateEscrowResponse,
  AdminVerifyEscrowPaymentResponse,
  AdminRefundEscrowResponse,
  AdminListEscrowResponse,
  AdminAiModelsResponse,
  AdminAiModelTestResponse,
  AdminTrainingStatusResponse,
  AdminTrainingTriggerGetResponse,
  AdminTrainingTriggerPostResponse,
  AdminTrainingDeployResponse,
  AdminTrainingRollbackResponse,
  AdminTrainingBenchmarkGetResponse,
  AdminTrainingBenchmarkPostResponse,
  AdminModelSelectionResponse,
  AdminTrainingModelsResponse,
  AdminTrainingDataResponse,
  AdminUploadModelResponse,
  AdminContentQueueResponse,
  AdminContentActionResponse,
  AdminCronMetricsResponse,
  AdminPermissionsResponse,
  AdminAlphaGroupConfigGetResponse,
  AdminAlphaGroupConfigPatchResponse,
  AdminAlphaGroupStatsResponse,
  AdminWhitelistGetResponse,
  AdminWhitelistConfigGetResponse,
  AdminWorldFactsGetResponse,
  AdminEnvironmentGetResponse,
  AdminLoadTestGetResponse,
  AdminLoadTestPostResponse,
  AdminDebugDmResponse,
  AdminTestDmResponse,
  AdminFeesResponse,
  AdminNotificationResponse,
  AdminSignalAnalysisResponse,
  AdminAnalyticsResponse,
  AdminAuditLogsResponse,
  AdminPerformanceResponse,
  AdminSystemHealthResponse,
  AdminNetworkStatsResponse,
  AdminGameStatsResponse,
  AdminGroupInviteResponse,
} from '../../schemas/admin';

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

  '/api/stats/tokens': {
    get: {
      operationId: 'getTokenStats',
      tags: ['Admin'],
      summary: 'Get LLM token usage statistics',
      description: 'Returns token usage summary, breakdowns by model and prompt type.',
      requestParams: {
        query: z.object({
          period: z.enum(['hour', 'day', 'week']).optional().meta({ description: 'Time range' }),
          limit: z.string().optional().meta({ description: 'Max records (1-100)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Token usage statistics',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.boolean(),
                  summary: z.object({
                    periodStart: z.string(),
                    periodEnd: z.string(),
                    tickCount: z.number(),
                    totalCalls: z.number(),
                    totalInputTokens: z.number(),
                    totalOutputTokens: z.number(),
                    totalTokens: z.number(),
                    avgCallsPerTick: z.number(),
                    avgInputTokensPerTick: z.number(),
                    avgOutputTokensPerTick: z.number(),
                    avgTotalTokensPerTick: z.number(),
                    estimatedTotalCostUSD: z.number(),
                  }),
                  byPromptType: z.array(
                    z.object({
                      promptType: z.string(),
                      callCount: z.number(),
                      totalInputTokens: z.number(),
                      totalOutputTokens: z.number(),
                      totalTokens: z.number(),
                      avgTokensPerCall: z.number(),
                    })
                  ),
                  byModel: z.array(
                    z.object({
                      model: z.string(),
                      provider: z.string(),
                      callCount: z.number(),
                      totalInputTokens: z.number(),
                      totalOutputTokens: z.number(),
                      totalTokens: z.number(),
                      avgTokensPerCall: z.number(),
                    })
                  ),
                  recentTicks: z.array(
                    z.object({
                      tickId: z.string(),
                      tickStartedAt: z.string(),
                      tickCompletedAt: z.string(),
                      totalCalls: z.number(),
                      totalTokens: z.number(),
                    })
                  ),
                })
                .meta({ id: 'TokenStatsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/game/control': {
    post: {
      operationId: 'controlGame',
      tags: ['Admin'],
      summary: 'Start or pause the game simulation',
      description: 'Controls game state. Admin-only endpoint.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z
              .object({
                action: z.enum(['start', 'pause']),
              })
              .meta({ id: 'GameControlBody' }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Game control result',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.boolean(),
                  action: z.string(),
                  game: z.object({
                    id: z.string(),
                    isRunning: z.boolean(),
                    currentDay: z.number(),
                    currentDate: z.string(),
                    lastTickAt: z.string().nullable(),
                  }),
                })
                .meta({ id: 'GameControlResponse' }),
            },
          },
        },
        '400': { description: 'Invalid action' },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/registry/all': {
    get: {
      operationId: 'getRegistryAll',
      tags: ['Admin'],
      summary: 'Get all registry entities',
      description: 'Returns all registered entities (users, actors, agents, apps) with filtering.',
      requestParams: {
        query: z.object({
          type: z.enum(['users', 'actors', 'agents', 'apps', 'all']).optional(),
          search: z.string().optional(),
          onChainOnly: z.string().optional().meta({ description: 'Filter to on-chain only (true/false)' }),
        }),
      },
      responses: {
        '200': {
          description: 'Registry data',
          content: {
            'application/json': {
              schema: z
                .object({
                  users: z.array(z.record(z.string(), z.unknown())),
                  actors: z.array(z.record(z.string(), z.unknown())),
                  agents: z.array(z.record(z.string(), z.unknown())),
                  apps: z.array(z.record(z.string(), z.unknown())),
                  totals: z.object({
                    users: z.number(),
                    actors: z.number(),
                    agents: z.number(),
                    apps: z.number(),
                    total: z.number(),
                  }),
                })
                .meta({ id: 'RegistryAllResponse' }),
            },
          },
        },
      },
    },
  },
};
