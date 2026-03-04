import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const HotPost = z
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

const NewsItem = z
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

const TrendingTopic = z
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

const TrendingPost = z
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

const UpcomingEvent = z
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

export const feedPaths: ZodOpenApiPathsObject = {
  '/api/feed/hot': {
    get: {
      operationId: 'getHotFeed',
      tags: ['Feed'],
      summary: 'Get hot posts',
      description: 'Returns posts ranked by a hot-scoring algorithm.',
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Maximum number of posts to return' }),
        }),
      },
      responses: {
        '200': {
          description: 'Hot posts feed',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  posts: z.array(HotPost),
                  limit: z.number(),
                })
                .meta({ id: 'HotFeedResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/feed/widgets/breaking-news': {
    get: {
      operationId: 'getBreakingNews',
      tags: ['Feed'],
      summary: 'Get breaking news',
      description:
        'Returns recent breaking news items, optionally filtered by category.',
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Maximum number of news items' }),
          category: z
            .string()
            .optional()
            .meta({ description: 'Filter by news category' }),
        }),
      },
      responses: {
        '200': {
          description: 'Breaking news items',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  news: z.array(NewsItem),
                })
                .meta({ id: 'BreakingNewsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/feed/widgets/markets': {
    get: {
      operationId: 'getMarketWidgets',
      tags: ['Feed'],
      summary: 'Get market data',
      description: 'Returns prediction market data for the feed widget.',
      responses: {
        '200': {
          description: 'Market widget data',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  markets: z.array(
                    z.object({
                      id: z.string(),
                      question: z.string(),
                      yesPrice: z.number(),
                      noPrice: z.number(),
                      volume: z.number(),
                      endDate: z
                        .string()
                        .meta({ description: 'ISO 8601 timestamp' }),
                    })
                  ),
                })
                .meta({ id: 'MarketsWidgetResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/feed/widgets/stats': {
    get: {
      operationId: 'getFeedStats',
      tags: ['Feed'],
      summary: 'Get platform stats',
      description:
        'Returns aggregate platform statistics for the stats widget.',
      responses: {
        '200': {
          description: 'Platform statistics',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  stats: z.object({
                    activePlayers: z.number(),
                    aiAgents: z.number(),
                    totalHoots: z.number(),
                    pointsInCirculation: z.number(),
                  }),
                })
                .meta({ id: 'StatsWidgetResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/feed/widgets/trending': {
    get: {
      operationId: 'getTrendingTopics',
      tags: ['Feed'],
      summary: 'Get trending topics',
      description: 'Returns trending hashtags and topics.',
      responses: {
        '200': {
          description: 'Trending topics',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  trending: z.array(TrendingTopic),
                })
                .meta({ id: 'TrendingTopicsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/feed/widgets/trending-posts': {
    get: {
      operationId: 'getTrendingPosts',
      tags: ['Feed'],
      summary: 'Get trending posts',
      description: 'Returns posts that are currently trending by engagement.',
      responses: {
        '200': {
          description: 'Trending posts',
          content: {
            'application/json': {
              schema: z
                .object({
                  posts: z.array(TrendingPost),
                })
                .meta({ id: 'TrendingPostsResponse' }),
            },
          },
        },
      },
    },
  },

  '/api/feed/widgets/upcoming-events': {
    get: {
      operationId: 'getUpcomingEvents',
      tags: ['Feed'],
      summary: 'Get upcoming events',
      description: 'Returns upcoming platform events.',
      responses: {
        '200': {
          description: 'Upcoming events',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  events: z.array(UpcomingEvent),
                })
                .meta({ id: 'UpcomingEventsResponse' }),
            },
          },
        },
      },
    },
  },
};
