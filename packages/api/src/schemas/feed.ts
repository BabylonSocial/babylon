import { z } from 'zod';

export const HotPost = z
  .object({
    id: z.string(),
    content: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    authorUsername: z.string().nullable(),
    authorProfileImageUrl: z.string().nullable(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    likeCount: z.number(),
    commentCount: z.number(),
    shareCount: z.number(),
    score: z.number().meta({ description: 'Hot-ranking score' }),
    isLiked: z.boolean(),
    isShared: z.boolean(),
  })
  .meta({ id: 'HotPost' });

export const NewsItem = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string().optional(),
    url: z.string().optional(),
    source: z.string().optional(),
    category: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    publishedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'NewsItem' });

export const TrendingTopic = z
  .object({
    tag: z.string(),
    label: z.string().optional(),
    postCount: z.number(),
    trend: z
      .string()
      .optional()
      .meta({ description: 'Trend direction (up, down, stable)' }),
  })
  .meta({ id: 'TrendingTopic' });

export const TrendingPost = z
  .object({
    id: z.string(),
    content: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    authorUsername: z.string().nullable(),
    authorProfileImageUrl: z.string().nullable(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    likeCount: z.number(),
    commentCount: z.number(),
    shareCount: z.number(),
    score: z.number().optional(),
  })
  .meta({ id: 'TrendingPost' });

export const UpcomingEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startDate: z.string().meta({ description: 'ISO 8601 timestamp' }),
    endDate: z.string().optional().meta({ description: 'ISO 8601 timestamp' }),
    category: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    url: z.string().optional(),
  })
  .meta({ id: 'UpcomingEvent' });
