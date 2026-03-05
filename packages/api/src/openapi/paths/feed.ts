import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  HotPost,
  NewsItem,
  TrendingPost,
  TrendingTopic,
  UpcomingEvent,
} from '../../schemas/feed';

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
