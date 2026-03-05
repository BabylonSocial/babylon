import { z } from 'zod';

export const OriginalPost = z.object({
  id: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorUsername: z.string().nullable(),
  authorProfileImageUrl: z.string().nullable(),
  timestamp: z.string(),
});

export const CommentPreview = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  userId: z.string(),
  userName: z.string(),
  userUsername: z.string().nullable(),
  userAvatar: z.string().nullable(),
  likeCount: z.number(),
});

export const FeedPost = z
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

export const ListPostsResponse = z
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

export const CreatePostBody = z
  .object({
    content: z.string().meta({ description: 'Post content' }),
  })
  .meta({ id: 'CreatePostBody' });
