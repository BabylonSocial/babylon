import { z } from 'zod';

export const ModerationUserSummary = z.object({
  id: z.string(),
  username: z.string().nullable(),
  displayName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export const Report = z
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

export const BlockEntry = z
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

export const MuteEntry = z
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

export const ModerationPagination = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

export const AppealBody = z
  .object({
    reason: z.string().min(10).max(2000),
    stakeTxHash: z.string().optional(),
  })
  .meta({ id: 'AppealBody' });
