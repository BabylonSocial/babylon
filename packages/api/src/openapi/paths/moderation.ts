import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

// ---------------------------------------------------------------------------
// Reusable schemas
// ---------------------------------------------------------------------------

const ModerationUserSummary = z.object({
  id: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

const Report = z
  .object({
    id: z.string(),
    reporterId: z.string(),
    reportedUserId: z.string().nullable(),
    reportedPostId: z.string().nullable(),
    reportType: z.string(),
    category: z.string(),
    reason: z.string(),
    evidence: z.string().nullable(),
    priority: z.string(),
    status: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    reportedUser: ModerationUserSummary.optional(),
    resolver: ModerationUserSummary.optional(),
  })
  .passthrough()
  .meta({ id: 'Report' });

const BlockEntry = z
  .object({
    id: z.string(),
    blockerId: z.string(),
    blockedId: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    blocked: z
      .object({
        id: z.string(),
        username: z.string().nullable(),
        displayName: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
        isActor: z.boolean(),
      })
      .optional(),
  })
  .meta({ id: 'BlockEntry' });

const MuteEntry = z
  .object({
    id: z.string(),
    muterId: z.string(),
    mutedId: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    muted: z
      .object({
        id: z.string(),
        username: z.string().nullable(),
        displayName: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
        isActor: z.boolean(),
      })
      .optional(),
  })
  .meta({ id: 'MuteEntry' });

const Pagination = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

export const moderationPaths: ZodOpenApiPathsObject = {
  '/api/moderation/reports': {
    get: {
      operationId: 'listReports',
      tags: ['Moderation'],
      summary: 'List moderation reports',
      description:
        'Returns moderation reports filed by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
          status: z.string().optional(),
          category: z.string().optional(),
          reportType: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Report list',
          content: {
            'application/json': {
              schema: z
                .object({
                  reports: z.array(Report),
                  pagination: Pagination,
                })
                .meta({ id: 'ListReportsResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'createReport',
      tags: ['Moderation'],
      summary: 'File a moderation report',
      description:
        'Submit a report against a user or post for moderation review.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                reportType: z.string(),
                reportedUserId: z.string().optional(),
                reportedPostId: z.string().optional(),
                category: z.string(),
                reason: z.string(),
                evidence: z.string().optional(),
              })
              .meta({ id: 'CreateReportBody' }),
          },
        },
      },
      responses: {
        '201': {
          description: 'Report created',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  message: z.string(),
                  report: Report,
                })
                .meta({ id: 'CreateReportResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Invalid report' },
      },
    },
  },

  '/api/moderation/blocks': {
    get: {
      operationId: 'listBlocks',
      tags: ['Moderation'],
      summary: 'List blocked users',
      description:
        'Returns the list of users blocked by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Block list',
          content: {
            'application/json': {
              schema: z
                .object({
                  blocks: z.array(BlockEntry),
                  pagination: Pagination,
                })
                .meta({ id: 'ListBlocksResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/moderation/mutes': {
    get: {
      operationId: 'listMutes',
      tags: ['Moderation'],
      summary: 'List muted users',
      description: 'Returns the list of users muted by the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        query: z.object({
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Mute list',
          content: {
            'application/json': {
              schema: z
                .object({
                  mutes: z.array(MuteEntry),
                  pagination: Pagination,
                })
                .meta({ id: 'ListMutesResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/moderation/appeal': {
    post: {
      operationId: 'submitAppeal',
      tags: ['Moderation'],
      summary: 'Submit a moderation appeal',
      description:
        'Appeal a moderation action taken against the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                reason: z.string(),
                stakeTxHash: z.string().optional(),
              })
              .meta({ id: 'AppealBody' }),
          },
        },
      },
      responses: {
        '201': {
          description: 'Appeal submitted',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.boolean(),
                  message: z.string(),
                  status: z.enum(['human_review', 'approved', 'denied']),
                  requiresStake: z.boolean().optional(),
                })
                .meta({ id: 'AppealResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
