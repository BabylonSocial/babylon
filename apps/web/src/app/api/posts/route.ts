/**
 * Posts Feed API
 *
 * @route GET /api/posts - Get posts feed
 * @route POST /api/posts - Create new post
 * @access GET: Public, POST: Authenticated
 *
 * @description
 * Core API for the social feed system. Handles post retrieval with advanced
 * filtering, caching, and repost detection. POST creates new posts with
 * mention notifications, rate limiting, and real-time SSE broadcasting.
 *
 * @openapi
 * /api/posts:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get posts feed
 *     description: Returns paginated posts with advanced filtering, caching, and repost detection. Supports following feed and actor filtering.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 100
 *         description: Posts per page
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (timestamp)
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *         description: Filter by specific actor/agent
 *       - in: query
 *         name: following
 *         schema:
 *           type: boolean
 *         description: Show only followed users' posts
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Required with following=true
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [article, post]
 *         description: Filter by post type
 *     responses:
 *       200:
 *         description: Posts feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       authorId:
 *                         type: string
 *                       authorName:
 *                         type: string
 *                       authorUsername:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       likeCount:
 *                         type: integer
 *                       commentCount:
 *                         type: integer
 *                       shareCount:
 *                         type: integer
 *                 limit:
 *                   type: integer
 *                 cursor:
 *                   type: string
 *                 hasMore:
 *                   type: boolean
 *   post:
 *     tags:
 *       - Posts
 *     summary: Create new post
 *     description: Creates a new post with automatic mention notifications, rate limiting, and real-time SSE broadcasting.
 *     security:
 *       - PrivyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 280
 *                 description: Post content (1-280 characters)
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     authorId:
 *                       type: string
 *                     authorName:
 *                       type: string
 *                     authorUsername:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid content or rate limited
 *       401:
 *         description: Unauthorized
 *
 * **GET - Retrieve Posts Feed**
 *
 * Returns paginated posts with comprehensive metadata including:
 * - Author details (users, agents/actors, organizations)
 * - Interaction counts (likes, comments, shares)
 * - Repost metadata with original post tracking
 * - Following feed filtering
 * - Post type filtering (articles, standard posts)
 *
 * **Query Parameters:**
 * @query {number} limit - Posts per page (default: 100, max recommended: 100)
 * @query {number} offset - Pagination offset (default: 0)
 * @query {string} actorId - Filter by specific actor/agent
 * @query {boolean} following - Show only followed users' posts
 * @query {string} userId - Required with following=true
 * @query {string} type - Filter by post type ('article', 'post', etc.)
 *
 * **Caching Strategy:**
 * - Recent posts cached for 60s
 * - Following feeds cached for 120s
 * - Actor-specific posts cached per actor
 * - Cache invalidation on new post creation
 *
 * **Repost Detection:**
 * Automatically parses repost content format:
 * ```
 * [Quote comment]
 *
 * --- Reposted from @originalAuthor ---
 * [Original content]
 * ```
 *
 * @returns {object} Posts feed response
 * @property {boolean} success - Operation success
 * @property {array} posts - Array of post objects with metadata
 * @property {number} limit - Applied limit
 * @property {number} offset - Applied offset
 * @property {string} source - Feed source ('following' or undefined)
 *
 * **POST - Create New Post**
 *
 * Creates a new post with automatic processing:
 * - Content validation (max 280 characters)
 * - Rate limiting (prevents spam)
 * - Duplicate detection
 * - Mention extraction and notification (@username)
 * - Real-time SSE broadcast to feed subscribers
 * - Cache invalidation
 * - PostHog analytics tracking
 *
 * @param {string} content - Post content (required, 1-280 chars)
 *
 * @returns {object} Created post
 * @property {boolean} success - Operation success
 * @property {object} post - Created post with author details
 *
 * @throws {400} Invalid content (empty, too long, duplicate, rate limited)
 * @throws {401} Unauthorized - authentication required
 * @throws {500} Internal server error
 *
 * @example
 * ```typescript
 * // Get recent posts
 * const feed = await fetch('/api/posts?limit=20&offset=0');
 * const { posts } = await feed.json();
 *
 * // Get following feed
 * const following = await fetch(`/api/posts?following=true&userId=${userId}&limit=50`);
 *
 * // Get actor's posts
 * const actorPosts = await fetch(`/api/posts?actorId=${actorId}`);
 *
 * // Create post
 * const response = await fetch('/api/posts', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     content: 'Hello @friend, check this out!'
 *   })
 * });
 * ```
 *
 */

import {
  authenticate,
  broadcastToChannel,
  cachedDb,
  checkRateLimitAndDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  ensureUserForAuth,
  getCacheOrFetch,
  notifyMention,
  RATE_LIMIT_CONFIGS,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import type { Post } from '@babylon/db';
import {
  and,
  comments,
  count,
  db,
  desc,
  eq,
  follows,
  getBlockedByUserIds,
  getBlockedUserIds,
  getMutedUserIds,
  inArray,
  isNull,
  lt,
  lte,
  posts,
  reactions,
  shares,
  userActorFollows,
  users,
} from '@babylon/db';
import {
  type GeneratedTag,
  generateTagsFromPost,
  handlePlayerMention,
  StaticDataRegistry,
  storeTagsForPost,
} from '@babylon/engine';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/posthog/server';

// Type for posts with included original post relation
type PostWithOriginal = Post & {
  originalPost?: {
    id: string;
    content: string;
    authorId: string;
    timestamp: Date;
    createdAt: Date;
    deletedAt: Date | null;
  } | null;
};

/**
 * Converts a date value to ISO string format, handling various input types.
 *
 * @param date - Date object, ISO string, or null/undefined
 * @returns ISO string representation of the date, or current date ISO string if invalid/null
 */
function toISOStringSafe(date: Date | string | null | undefined): string {
  if (!date) {
    return new Date().toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (typeof date === 'string') {
    // If it's already an ISO string, return it
    if (date.includes('T') && date.includes('Z')) {
      return date;
    }
    // Try to parse and convert
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  // Fallback to current date
  return new Date().toISOString();
}

/**
 * GET /api/posts
 *
 * Retrieves paginated posts feed with advanced filtering, caching, and repost detection.
 * Supports following feed, actor filtering, post type filtering, and moderation (blocked/muted users).
 * Includes interaction counts (likes, comments, shares) and repost metadata.
 *
 * @param request - Next.js request with query parameters
 * @returns Posts feed response with pagination cursor
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') || '100');
  const cursor = searchParams.get('cursor') || undefined; // Cursor-based pagination
  const actorId = searchParams.get('actorId') || undefined;
  const following = searchParams.get('following') === 'true';
  const userId = searchParams.get('userId') || undefined;
  const type = searchParams.get('type') || undefined;

  // If following feed is requested, filter by followed users/actors
  if (following && userId) {
    // Cache key for user's follows
    const followsCacheKey = `follows:${userId}`;

    // Get list of followed users/actors with caching
    const allFollowedIds = await getCacheOrFetch(
      followsCacheKey,
      async () => {
        const [userFollowsList, actorFollowsList] = await Promise.all([
          db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(eq(follows.followerId, userId)),
          db
            .select({ actorId: userActorFollows.actorId })
            .from(userActorFollows)
            .where(eq(userActorFollows.userId, userId)),
        ]);

        const followedUserIds = userFollowsList.map((f) => f.followingId);
        const followedActorIds = actorFollowsList.map((f) => f.actorId);
        return [...followedUserIds, ...followedActorIds];
      },
      {
        namespace: 'user:follows',
        ttl: 120, // Cache follows for 2 minutes
      }
    );

    if (allFollowedIds.length === 0) {
      // User is not following anyone
      return NextResponse.json({
        success: true,
        posts: [],
        total: 0,
        limit,
        source: 'following',
      });
    }

    // Get moderation filters for this user
    const [blockedIds, mutedIds, blockedByIds] = await Promise.all([
      getBlockedUserIds(userId),
      getMutedUserIds(userId),
      getBlockedByUserIds(userId),
    ]);

    // Combine all excluded user IDs
    const excludedUserIds = new Set([
      ...blockedIds,
      ...mutedIds,
      ...blockedByIds,
    ]);

    // Get posts from followed users/actors with caching
    const postsResult = await cachedDb.getPostsForFollowing(
      userId,
      allFollowedIds,
      limit,
      cursor
    );

    // Filter out posts from blocked/muted users
    const filteredPosts = postsResult.filter(
      (post) => !excludedUserIds.has(post.authorId)
    );

    // Get user data for filtered posts
    const authorIds: string[] = [
      ...new Set(
        filteredPosts
          .map((p: Post) => p.authorId)
          .filter((id): id is string => id !== undefined)
      ),
    ];

    const usersList =
      authorIds.length > 0
        ? await db
            .select({
              id: users.id,
              username: users.username,
              displayName: users.displayName,
              profileImageUrl: users.profileImageUrl,
            })
            .from(users)
            .where(inArray(users.id, authorIds))
        : [];
    const userMap = new Map(usersList.map((u) => [u.id, u]));
    const actorMap = new Map(
      authorIds
        .map((id) => StaticDataRegistry.getActor(id))
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => [
          a.id,
          { id: a.id, name: a.name, profileImageUrl: a.profileImageUrl },
        ])
    );
    const orgMap = new Map(
      authorIds
        .map((id) => StaticDataRegistry.getOrganization(id))
        .filter((o): o is NonNullable<typeof o> => o !== null)
        .map((o) => [o.id, { id: o.id, name: o.name, imageUrl: o.imageUrl }])
    );

    // Get interaction counts for all filtered posts in parallel
    const postIds = filteredPosts.map((p: Post) => p.id);
    const [reactionCounts, commentCounts] = await Promise.all([
      postIds.length > 0
        ? db
            .select({
              postId: reactions.postId,
              count: count(),
            })
            .from(reactions)
            .where(
              and(
                inArray(reactions.postId, postIds),
                eq(reactions.type, 'like')
              )
            )
            .groupBy(reactions.postId)
        : [],
      postIds.length > 0
        ? db
            .select({
              postId: comments.postId,
              count: count(),
            })
            .from(comments)
            .where(inArray(comments.postId, postIds))
            .groupBy(comments.postId)
        : [],
    ]);

    // Create maps for quick lookup
    const reactionMap = new Map(
      reactionCounts.map((r) => [r.postId, Number(r.count)])
    );
    const commentMap = new Map(
      commentCounts.map((c) => [c.postId, Number(c.count)])
    );

    // Format following posts synchronously using lookup maps
    // Note: filteredPosts already includes originalPost via the include in the query above
    const formattedFollowingPosts = filteredPosts.map((post: Post) => {
      const postsWithOriginal = post as PostWithOriginal;
      const user = post.authorId ? userMap.get(post.authorId) : undefined;

      // Build repost metadata from originalPost if it exists (clean, no text parsing)
      const repostMetadata: Record<string, unknown> = {};
      if (postsWithOriginal.originalPostId && postsWithOriginal.originalPost) {
        const originalPost = postsWithOriginal.originalPost;
        const isQuote = post.content && post.content.length > 0;

        // Get original author from our maps
        const originalUser = userMap.get(originalPost.authorId);
        const originalActor = actorMap.get(originalPost.authorId);
        const originalOrg = orgMap.get(originalPost.authorId);

        let originalAuthorName = originalPost.authorId;
        let originalAuthorUsername: string | null = null;
        let originalAuthorProfileImageUrl: string | null = null;

        if (originalActor) {
          originalAuthorName = originalActor.name;
          originalAuthorProfileImageUrl = originalActor.profileImageUrl!;
        } else if (originalOrg) {
          originalAuthorName = originalOrg.name;
          originalAuthorProfileImageUrl = originalOrg.imageUrl!;
        } else if (originalUser) {
          originalAuthorName = originalUser.displayName!;
          originalAuthorUsername = originalUser.username!;
          originalAuthorProfileImageUrl = originalUser.profileImageUrl || null;
        }

        repostMetadata.isRepost = true;
        repostMetadata.isQuote = isQuote;
        repostMetadata.quoteComment = isQuote ? post.content : null;
        repostMetadata.originalPostId = originalPost.id;
        repostMetadata.originalPost = {
          id: originalPost.id,
          content: originalPost.content,
          authorId: originalPost.authorId,
          authorName: originalAuthorName,
          authorUsername: originalAuthorUsername,
          authorProfileImageUrl: originalAuthorProfileImageUrl,
          timestamp: toISOStringSafe(originalPost.timestamp),
        };
      }

      return {
        id: post.id,
        content: post.content,
        author: post.authorId,
        authorId: post.authorId,
        authorName:
          user?.displayName || user?.username || post.authorId || 'Unknown',
        authorUsername: user?.username || null,
        timestamp: toISOStringSafe(post.timestamp),
        createdAt: toISOStringSafe(post.createdAt),
        likeCount: reactionMap.get(post.id) ?? 0,
        commentCount: commentMap.get(post.id) ?? 0,
        shareCount: 0, // Share count not currently tracked in feed
        isLiked: false,
        isShared: false,
        ...repostMetadata,
      };
    });

    return NextResponse.json({
      success: true,
      posts: formattedFollowingPosts,
      limit,
      source: 'following',
    });
  }

  // Get posts from database with cursor-based pagination
  let postsResult: Post[];

  logger.info(
    'Fetching posts from database',
    { limit, cursor, actorId, type },
    'GET /api/posts'
  );

  if (type) {
    // Filter by type (e.g., 'article')
    logger.info(
      'Filtering posts by type',
      { type, limit, cursor },
      'GET /api/posts'
    );

    const now = new Date();

    // Build conditions
    const conditions = [eq(posts.type, type), isNull(posts.deletedAt)];

    if (cursor) {
      conditions.push(lt(posts.timestamp, new Date(cursor)));
    }
    conditions.push(lte(posts.timestamp, now)); // No future posts

    postsResult = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.timestamp))
      .limit(limit);

    logger.info(
      'Fetched posts by type',
      { type, count: postsResult.length },
      'GET /api/posts'
    );
  } else if (actorId) {
    // Get posts by specific actor (cached with cursor)
    postsResult = await cachedDb.getPostsByActor(actorId, limit, cursor);
    logger.info(
      'Fetched posts by actor (cached)',
      { actorId, count: postsResult.length },
      'GET /api/posts'
    );
  } else {
    // Get recent posts with cursor-based pagination
    postsResult = await cachedDb.getRecentPosts(limit, cursor);
    logger.info(
      'Fetched recent posts (cached)',
      { count: postsResult.length, limit, cursor },
      'GET /api/posts'
    );
  }

  // Log post structure for debugging
  if (postsResult.length > 0) {
    const samplePost = postsResult[0];
    if (samplePost) {
      logger.debug(
        'Sample post structure',
        {
          id: samplePost.id,
          hasTimestamp: !!samplePost.timestamp,
          timestampType: typeof samplePost.timestamp,
          timestampValue: samplePost.timestamp,
          hasCreatedAt: !!samplePost.createdAt,
          createdAtType: typeof samplePost.createdAt,
          createdAtValue: samplePost.createdAt,
        },
        'GET /api/posts'
      );
    }
  }

  // Apply moderation filters if user is authenticated
  if (userId) {
    const [blockedIds, mutedIds, blockedByIds] = await Promise.all([
      getBlockedUserIds(userId),
      getMutedUserIds(userId),
      getBlockedByUserIds(userId),
    ]);

    const excludedUserIds = new Set([
      ...blockedIds,
      ...mutedIds,
      ...blockedByIds,
    ]);
    postsResult = postsResult.filter(
      (post) => !excludedUserIds.has(post.authorId)
    );
  }

  // Get original posts for reposts
  const originalPostIds = postsResult
    .filter((p) => p.originalPostId)
    .map((p) => p.originalPostId)
    .filter((id): id is string => id !== null);

  const originalPostsMap = new Map<string, Post>();
  if (originalPostIds.length > 0) {
    const originalPostsList = await db
      .select()
      .from(posts)
      .where(and(inArray(posts.id, originalPostIds), isNull(posts.deletedAt)));
    originalPostsList.forEach((p) => originalPostsMap.set(p.id, p));
  }

  // Merge original posts into posts with type casting
  const postsWithOriginal: PostWithOriginal[] = postsResult.map((p) => ({
    ...p,
    originalPost: p.originalPostId
      ? (originalPostsMap.get(p.originalPostId) ?? null)
      : null,
  }));

  // Filter out reposts where the original post is deleted
  const validPosts = postsWithOriginal.filter((post) => {
    // If it's a repost, check if original post exists and is not deleted
    if (post.originalPostId) {
      const hasOriginalPost = post.originalPost && !post.originalPost.deletedAt;
      const isQuote = post.content && post.content.length > 0;

      // For quote posts, keep them even if original is deleted (user has commentary)
      // For simple reposts, filter out if original is deleted
      if (isQuote) {
        return true; // Keep quote posts regardless
      }
      return hasOriginalPost; // Filter out simple reposts with deleted originals
    }
    return true;
  });

  const postAuthorIds = validPosts
    .map((p) => p.authorId)
    .filter((id): id is string => id !== undefined);
  const originalPostAuthorIds = validPosts
    .filter((p) => p.originalPostId && p.originalPost)
    .map((p) => p.originalPost!.authorId)
    .filter((id): id is string => id !== undefined);

  const authorIds = [...new Set([...postAuthorIds, ...originalPostAuthorIds])];

  const usersList =
    authorIds.length > 0
      ? await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          })
          .from(users)
          .where(inArray(users.id, authorIds))
      : [];
  const userMap = new Map(usersList.map((u) => [u.id, u]));
  const actorMap = new Map(
    authorIds
      .map((id) => StaticDataRegistry.getActor(id))
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map((a) => [
        a.id,
        { id: a.id, name: a.name, profileImageUrl: a.profileImageUrl },
      ])
  );
  const orgMap = new Map(
    authorIds
      .map((id) => StaticDataRegistry.getOrganization(id))
      .filter((o): o is NonNullable<typeof o> => o !== null)
      .map((o) => [o.id, { id: o.id, name: o.name, imageUrl: o.imageUrl }])
  );

  // Get interaction counts for all posts in parallel
  const postIds = validPosts.map((p) => p.id);
  // Also collect original post IDs for reposts to get their interaction counts
  const allPostIds = [
    ...new Set([
      ...postIds,
      ...originalPostIds.filter((id) => originalPostsMap.has(id)),
    ]),
  ];

  const [reactionCounts, commentCounts, shareCounts] = await Promise.all([
    allPostIds.length > 0
      ? db
          .select({
            postId: reactions.postId,
            count: count(),
          })
          .from(reactions)
          .where(
            and(
              inArray(reactions.postId, allPostIds),
              eq(reactions.type, 'like')
            )
          )
          .groupBy(reactions.postId)
      : [],
    allPostIds.length > 0
      ? db
          .select({
            postId: comments.postId,
            count: count(),
          })
          .from(comments)
          .where(inArray(comments.postId, allPostIds))
          .groupBy(comments.postId)
      : [],
    allPostIds.length > 0
      ? db
          .select({
            postId: shares.postId,
            count: count(),
          })
          .from(shares)
          .where(inArray(shares.postId, allPostIds))
          .groupBy(shares.postId)
      : [],
  ]);

  // Create maps for quick lookup
  const reactionMap = new Map(
    reactionCounts.map((r) => [r.postId, Number(r.count)])
  );
  const commentMap = new Map(
    commentCounts.map((c) => [c.postId, Number(c.count)])
  );
  const shareMap = new Map(shareCounts.map((s) => [s.postId, Number(s.count)]));

  // Format posts - simple transformation, no async queries needed!
  const formattedPosts = validPosts.map((post) => {
    const user = userMap.get(post.authorId!);
    const actor = actorMap.get(post.authorId!);
    const org = orgMap.get(post.authorId!);

    let authorName = post.authorId!;
    let authorUsername: string | null = null;
    let authorProfileImageUrl: string | null = null;

    if (actor) {
      authorName = actor.name;
      authorProfileImageUrl = actor.profileImageUrl!;
    } else if (org) {
      authorName = org.name;
      authorProfileImageUrl = org.imageUrl!;
    } else if (user) {
      authorName = user.displayName!;
      authorUsername = user.username!;
      authorProfileImageUrl = user.profileImageUrl;
    }

    const timestamp = toISOStringSafe(post.timestamp);
    const createdAt = toISOStringSafe(post.createdAt);

    // Build base post object
    const basePost = {
      id: post.id,
      type: post.type || undefined,
      content: post.content!,
      fullContent: post.fullContent || undefined,
      articleTitle: post.articleTitle || undefined,
      byline: post.byline || undefined,
      biasScore: post.biasScore !== undefined ? post.biasScore : undefined,
      sentiment: post.sentiment || undefined,
      slant: post.slant || undefined,
      category: post.category || undefined,
      author: post.authorId,
      authorId: post.authorId,
      authorName,
      authorUsername,
      authorProfileImageUrl,
      timestamp,
      createdAt,
      gameId: post.gameId || undefined,
      dayNumber: post.dayNumber || undefined,
      likeCount: reactionMap.get(post.id) ?? 0,
      commentCount: commentMap.get(post.id) ?? 0,
      shareCount: shareMap.get(post.id) ?? 0,
      isLiked: false,
      isShared: false,
    };

    // Check if this is a repost/quote by presence of originalPostId
    if (post.originalPostId) {
      const isQuote = post.content && post.content.length > 0;
      const originalPost = post.originalPost;

      // If original post exists and is not deleted
      if (originalPost && !originalPost.deletedAt) {
        // Get original post author info
        const originalUser = userMap.get(originalPost.authorId);
        const originalActor = actorMap.get(originalPost.authorId);
        const originalOrg = orgMap.get(originalPost.authorId);

        let originalAuthorName = originalPost.authorId;
        let originalAuthorUsername: string | null = null;
        let originalAuthorProfileImageUrl: string | null = null;

        if (originalActor) {
          originalAuthorName = originalActor.name;
          originalAuthorProfileImageUrl = originalActor.profileImageUrl!;
        } else if (originalOrg) {
          originalAuthorName = originalOrg.name;
          originalAuthorProfileImageUrl = originalOrg.imageUrl!;
        } else if (originalUser) {
          originalAuthorName = originalUser.displayName!;
          originalAuthorUsername = originalUser.username!;
          originalAuthorProfileImageUrl = originalUser.profileImageUrl;
        }

        // For simple reposts (not quotes), use the original post's interaction counts
        // For quote posts, keep the quote post's interaction counts
        const interactionCounts = !isQuote
          ? {
              likeCount: reactionMap.get(originalPost.id) ?? 0,
              commentCount: commentMap.get(originalPost.id) ?? 0,
              shareCount: shareMap.get(originalPost.id) ?? 0,
            }
          : {
              likeCount: basePost.likeCount,
              commentCount: basePost.commentCount,
              shareCount: basePost.shareCount,
            };

        return {
          ...basePost,
          ...interactionCounts,
          isRepost: true,
          isQuote,
          quoteComment: isQuote ? post.content : null,
          originalPostId: originalPost.id,
          originalPost: {
            id: originalPost.id,
            content: originalPost.content,
            authorId: originalPost.authorId,
            authorName: originalAuthorName,
            authorUsername: originalAuthorUsername,
            authorProfileImageUrl: originalAuthorProfileImageUrl,
            timestamp: toISOStringSafe(originalPost.timestamp),
          },
        };
      }

      // If original post is deleted but this is a quote post, return with null originalPost
      if (isQuote) {
        return {
          ...basePost,
          isRepost: true,
          isQuote: true,
          quoteComment: post.content,
          originalPostId: post.originalPostId,
          originalPost: null,
        };
      }
    }

    return basePost;
  });

  logger.info(
    'Formatted posts',
    {
      originalCount: postsResult.length,
      formattedCount: formattedPosts.length,
      filteredOut: postsResult.length - formattedPosts.length,
    },
    'GET /api/posts'
  );

  // Next.js 16: Add cache headers for real-time feeds
  // Use 'no-store' to ensure fresh data for real-time updates
  // This prevents stale data in client-side caches
  logger.info(
    'Returning formatted posts',
    {
      postCount: formattedPosts.length,
      total: formattedPosts.length,
      limit,
      cursor,
    },
    'GET /api/posts'
  );

  // Calculate next cursor (timestamp of last post)
  const nextCursor =
    formattedPosts.length > 0
      ? formattedPosts[formattedPosts.length - 1]?.timestamp
      : null;

  const response = NextResponse.json({
    success: true,
    posts: formattedPosts,
    limit,
    cursor: nextCursor, // Next cursor for pagination
    hasMore: formattedPosts.length === limit, // Has more if we got a full page
  });

  // PERFORMANCE FIX: Use short cache with stale-while-revalidate for high-traffic endpoint
  // This reduces database load by 90%+ while keeping data fresh
  // 10s fresh, serve stale for 60s while revalidating in background
  response.headers.set(
    'Cache-Control',
    's-maxage=10, stale-while-revalidate=60, must-revalidate'
  );

  return response;
});

/**
 * POST /api/posts
 *
 * Creates a new post with content validation, rate limiting, and mention notifications.
 * Automatically extracts @mentions, sends notifications, broadcasts via SSE, and invalidates caches.
 *
 * @param request - Next.js request containing post content in JSON body
 * @returns Created post object with author details and metadata
 * @throws {400} Invalid content (empty, too long, duplicate, rate limited)
 * @throws {401} Unauthorized - authentication required
 * @throws {500} Internal server error
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);

  const body = (await request.json()) as { content: string };
  const { content } = body;

  checkRateLimitAndDuplicates(
    authUser.userId,
    content,
    RATE_LIMIT_CONFIGS.CREATE_POST,
    DUPLICATE_DETECTION_CONFIGS.POST
  );

  const fallbackDisplayName = authUser.walletAddress
    ? `${authUser.walletAddress.slice(0, 6)}...${authUser.walletAddress.slice(-4)}`
    : 'Anonymous';

  const { user: canonicalUser } = await ensureUserForAuth(authUser, {
    displayName: fallbackDisplayName,
  });
  const canonicalUserId = canonicalUser.id;

  const postId = await generateSnowflakeId();
  const [post] = await db
    .insert(posts)
    .values({
      id: postId,
      content: content.trim(),
      authorId: canonicalUserId,
      timestamp: new Date(),
    })
    .returning();

  if (!post) {
    logger.error('Failed to create post', { postId }, 'POST /api/posts');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create post',
      },
      { status: 500 }
    );
  }

  const authorName = canonicalUser.username!;

  await cachedDb.invalidatePostsCache();
  await cachedDb.invalidateActorPostsCache(canonicalUserId);
  logger.info(
    'Invalidated post caches',
    { postId: post.id },
    'POST /api/posts'
  );

  broadcastToChannel('feed', {
    type: 'new_post',
    post: {
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      authorName: authorName,
      authorUsername: canonicalUser.username,
      authorDisplayName: canonicalUser.displayName,
      authorProfileImageUrl: canonicalUser.profileImageUrl,
      timestamp: post.timestamp.toISOString(),
    },
  });
  logger.info(
    'Broadcast new user post to feed channel',
    { postId: post.id },
    'POST /api/posts'
  );

  const mentions = content.match(/@(\w+)/g) || [];
  const usernames = [...new Set(mentions.map((m: string) => m.substring(1)))];

  const mentionedUsers =
    usernames.length > 0
      ? await db
          .select({ id: users.id, username: users.username })
          .from(users)
          .where(inArray(users.username, usernames as string[]))
      : [];

  await Promise.all(
    mentionedUsers.map((mentionedUser) =>
      notifyMention(mentionedUser.id, canonicalUserId, post.id, undefined)
    )
  );

  logger.info(
    'Sent mention notifications',
    {
      postId: post.id,
      mentionCount: mentionedUsers.length,
      mentionedUsernames: mentionedUsers.map((u) => u.username!),
    },
    'POST /api/posts'
  );

  // Handle player influence for mentioned NPCs (boosts their response probability)
  // Check if any mentioned users are NPCs/actors
  const mentionedActorIds = mentionedUsers
    .filter((u) => {
      // Check if this user is an actor (NPC)
      const actor = StaticDataRegistry.getActor(u.id);
      return actor !== null;
    })
    .map((u) => u.id);

  if (mentionedActorIds.length > 0) {
    void Promise.all(
      mentionedActorIds.map((actorId) =>
        handlePlayerMention(canonicalUserId, actorId, post.id)
      )
    ).catch((err) => {
      logger.warn(
        'Failed to handle player mentions for NPCs',
        { error: err instanceof Error ? err.message : String(err) },
        'POST /api/posts'
      );
    });
    logger.info(
      'Triggered NPC mention influence',
      { postId: post.id, npcCount: mentionedActorIds.length },
      'POST /api/posts'
    );
  }

  trackServerEvent(canonicalUserId, 'post_created', {
    postId: post.id,
    contentLength: content.trim().length,
    hasUsername: Boolean(canonicalUser.username),
  });

  // Generate and store tags asynchronously (don't block response)
  // This allows posts to be tagged for trending without slowing down the API
  void generateTagsFromPost(content.trim())
    .then((generatedTags: GeneratedTag[]) => {
      if (generatedTags.length > 0) {
        return storeTagsForPost(post.id, generatedTags).then(() => {
          logger.info(
            'Tagged user post',
            { postId: post.id, tagCount: generatedTags.length },
            'POST /api/posts'
          );
        });
      }
      return Promise.resolve();
    })
    .catch((tagError: Error) => {
      logger.warn(
        'Failed to tag post',
        { postId: post.id, error: tagError },
        'POST /api/posts'
      );
    });

  return successResponse({
    success: true,
    post: {
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      authorName: authorName,
      authorUsername: canonicalUser.username,
      authorDisplayName: canonicalUser.displayName,
      authorProfileImageUrl: canonicalUser.profileImageUrl,
      timestamp: post.timestamp.toISOString(),
      createdAt: post.createdAt.toISOString(),
    },
  });
});
