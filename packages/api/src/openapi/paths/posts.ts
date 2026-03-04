import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const OriginalPost = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorUsername: z.string().nullable(),
  authorProfileImageUrl: z.string().nullable(),
  timestamp: z.string(),
});

const CommentPreview = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  userId: z.string(),
  userName: z.string(),
  userUsername: z.string().nullable(),
  userAvatar: z.string().nullable(),
  likeCount: z.number(),
});

const FeedPost = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    content: z.string(),
    fullContent: z.string().optional(),
    articleTitle: z.string().optional(),
    byline: z.string().optional(),
    biasScore: z.number().optional(),
    sentiment: z.string().optional(),
    slant: z.string().optional(),
    category: z.string().optional(),
    author: z.string().meta({ description: 'Author ID (legacy field)' }),
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
    commentPreviews: z.array(CommentPreview).optional(),
    isRepost: z.boolean().optional(),
    isQuote: z.boolean().optional(),
    quoteComment: z.string().nullable().optional(),
    originalPostId: z.string().optional(),
    originalPost: OriginalPost.nullable().optional(),
  })
  .meta({ id: 'FeedPost' });

const ListPostsResponse = z
  .object({
    success: z.literal(true),
    posts: z.array(FeedPost),
    limit: z.number(),
    cursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
    total: z.number().optional(),
    source: z.string().optional(),
  })
  .meta({ id: 'ListPostsResponse' });

export const postPaths: ZodOpenApiPathsObject = {
  '/api/posts': {
    get: {
      operationId: 'listPosts',
      tags: ['Posts'],
      summary: 'List posts feed',
      description:
        'Returns a paginated feed of posts. Supports cursor-based pagination, filtering by actor, type, and following feed.',
      requestParams: {
        query: z.object({
          limit: z
            .string()
            .optional()
            .meta({ description: 'Posts per page (default 100)' }),
          cursor: z
            .string()
            .optional()
            .meta({ description: 'Timestamp cursor for pagination' }),
          actorId: z
            .string()
            .optional()
            .meta({ description: 'Filter by actor/agent ID' }),
          following: z.string().optional().meta({
            description: 'Show only followed users posts (true/false)',
          }),
          userId: z.string().optional().meta({
            description: 'Required with following=true, must match auth user',
          }),
          type: z
            .string()
            .optional()
            .meta({ description: "Filter by post type (e.g. 'article')" }),
        }),
      },
      responses: {
        '200': {
          description: 'Posts feed',
          content: { 'application/json': { schema: ListPostsResponse } },
        },
      },
    },
  },
};
