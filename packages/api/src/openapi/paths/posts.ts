import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { CreatePostBody, FeedPost, ListPostsResponse } from '../../schemas/posts';

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
    post: {
      operationId: 'createPost',
      tags: ['Posts'],
      summary: 'Create a post',
      description: 'Create a new post as the authenticated user.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: { 'application/json': { schema: CreatePostBody } },
      },
      responses: {
        '201': {
          description: 'Created post',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  post: FeedPost,
                })
                .meta({ id: 'CreatePostResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
