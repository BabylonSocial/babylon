/**
 * Grouped Trending API
 *
 * @route GET /api/trending/group - Get posts for multiple trending tags
 * @access Public
 *
 * @description
 * Returns posts for a group of trending tags. Used when displaying grouped
 * trends (e.g., "OpenAGI" + "Sam Altman" as one trending topic).
 *
 * @openapi
 * /api/trending/group:
 *   get:
 *     tags:
 *       - Trending
 *     summary: Get posts for grouped trending tags
 *     description: Returns posts that match any of the provided tag slugs
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated tag slugs (e.g., "openagi,sam-altman")
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of posts to return
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       category:
 *                         type: string
 *       400:
 *         description: Invalid parameters
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/trending/group?tags=openagi,sam-altman');
 * const { posts, tags } = await response.json();
 * ```
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  actors,
  comments,
  count,
  desc,
  eq,
  inArray,
  organizations,
  posts,
  postTags,
  reactions,
  shares,
  tags,
  users,
} from '@babylon/db';
import {
  type AuthenticatedUser,
  optionalAuth,
} from '@babylon/api';
import { asPublic, asUser } from '@babylon/db';
import { withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const tagsParam = searchParams.get('tags');
  const limitParam = searchParams.get('limit');

  if (!tagsParam) {
    return NextResponse.json(
      { success: false, error: 'Missing required parameter: tags' },
      { status: 400 }
    );
  }

  const tagSlugs = tagsParam
    .split(',')
    .map((slug) => slug.trim().toLowerCase())
    .filter((slug) => slug.length > 0);

  if (tagSlugs.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Invalid tags parameter' },
      { status: 400 }
    );
  }

  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;

  logger.info(
    'Fetching grouped trending posts',
    { tagSlugs, limit },
    'GET /api/trending/group'
  );

  // Optional auth for RLS
  const authUser: AuthenticatedUser | null = await optionalAuth(request).catch(
    () => null
  );

  // Get tag information by slug (name)
  const tagsList =
    authUser && authUser.userId
      ? await asUser(authUser, async (db) => {
          return await db
            .select({
              id: tags.id,
              name: tags.name,
              displayName: tags.displayName,
              category: tags.category,
            })
            .from(tags)
            .where(inArray(tags.name, tagSlugs));
        })
      : await asPublic(async (db) => {
          return await db
            .select({
              id: tags.id,
              name: tags.name,
              displayName: tags.displayName,
              category: tags.category,
            })
            .from(tags)
            .where(inArray(tags.name, tagSlugs));
        });

  // Extract tag IDs for the post lookup
  const tagIds = tagsList.map((t) => t.id);

  if (tagIds.length === 0) {
    return NextResponse.json({
      success: true,
      posts: [],
      tags: [],
    });
  }

  // Get posts that have any of these tags
  const postTagRelations =
    authUser && authUser.userId
      ? await asUser(authUser, async (db) => {
          return await db
            .select({
              postId: postTags.postId,
              tagId: postTags.tagId,
              createdAt: postTags.createdAt,
              post: {
                id: posts.id,
                content: posts.content,
                authorId: posts.authorId,
                timestamp: posts.timestamp,
                type: posts.type,
              },
            })
            .from(postTags)
            .innerJoin(posts, eq(postTags.postId, posts.id))
            .where(inArray(postTags.tagId, tagIds))
            .orderBy(desc(postTags.createdAt))
            .limit(limit * 2); // Get more to deduplicate
        })
      : await asPublic(async (db) => {
          return await db
            .select({
              postId: postTags.postId,
              tagId: postTags.tagId,
              createdAt: postTags.createdAt,
              post: {
                id: posts.id,
                content: posts.content,
                authorId: posts.authorId,
                timestamp: posts.timestamp,
                type: posts.type,
              },
            })
            .from(postTags)
            .innerJoin(posts, eq(postTags.postId, posts.id))
            .where(inArray(postTags.tagId, tagIds))
            .orderBy(desc(postTags.createdAt))
            .limit(limit * 2);
        });

  // Deduplicate posts (same post might have multiple tags from the group)
  const seenPostIds = new Set<string>();
  const uniquePosts = postTagRelations
    .filter((pt) => {
      if (seenPostIds.has(pt.postId)) {
        return false;
      }
      seenPostIds.add(pt.postId);
      return true;
    })
    .slice(0, limit);

  // Get interaction counts for posts
  const postIds = uniquePosts.map((pt) => pt.postId);

  // Get user info for authors
  const authorIds = [...new Set(uniquePosts.map((pt) => pt.post.authorId))];
  const [usersList, actorsList, orgsList] =
    authUser && authUser.userId
      ? await asUser(authUser, async (db) => {
          return await Promise.all([
            db
              .select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
              })
              .from(users)
              .where(inArray(users.id, authorIds)),
            db
              .select({ id: actors.id, name: actors.name })
              .from(actors)
              .where(inArray(actors.id, authorIds)),
            db
              .select({ id: organizations.id, name: organizations.name })
              .from(organizations)
              .where(inArray(organizations.id, authorIds)),
          ]);
        })
      : await asPublic(async (db) => {
          return await Promise.all([
            db
              .select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
              })
              .from(users)
              .where(inArray(users.id, authorIds)),
            db
              .select({ id: actors.id, name: actors.name })
              .from(actors)
              .where(inArray(actors.id, authorIds)),
            db
              .select({ id: organizations.id, name: organizations.name })
              .from(organizations)
              .where(inArray(organizations.id, authorIds)),
          ]);
        });

  const userMap = new Map(usersList.map((u) => [u.id, u]));
  const actorMap = new Map(actorsList.map((a) => [a.id, a]));
  const orgMap = new Map(orgsList.map((o) => [o.id, o]));

  // Get interaction counts using Drizzle's count aggregation
  const [likeCounts, commentCounts, shareCounts] =
    postIds.length > 0
      ? authUser && authUser.userId
        ? await asUser(authUser, async (db) => {
            return await Promise.all([
              db
                .select({ postId: reactions.postId, count: count() })
                .from(reactions)
                .where(inArray(reactions.postId, postIds))
                .groupBy(reactions.postId),
              db
                .select({ postId: comments.postId, count: count() })
                .from(comments)
                .where(inArray(comments.postId, postIds))
                .groupBy(comments.postId),
              db
                .select({ postId: shares.postId, count: count() })
                .from(shares)
                .where(inArray(shares.postId, postIds))
                .groupBy(shares.postId),
            ]);
          })
        : await asPublic(async (db) => {
            return await Promise.all([
              db
                .select({ postId: reactions.postId, count: count() })
                .from(reactions)
                .where(inArray(reactions.postId, postIds))
                .groupBy(reactions.postId),
              db
                .select({ postId: comments.postId, count: count() })
                .from(comments)
                .where(inArray(comments.postId, postIds))
                .groupBy(comments.postId),
              db
                .select({ postId: shares.postId, count: count() })
                .from(shares)
                .where(inArray(shares.postId, postIds))
                .groupBy(shares.postId),
            ]);
          })
      : [[], [], []];

  const likeMap = new Map(likeCounts.map((lc) => [lc.postId, lc.count || 0]));
  const commentMap = new Map(
    commentCounts.map((cc) => [cc.postId, cc.count || 0])
  );
  const shareMap = new Map(shareCounts.map((sc) => [sc.postId, sc.count || 0]));

  // Format posts
  const formattedPosts = uniquePosts.map((pt) => {
    const user = userMap.get(pt.post.authorId);
    const actor = actorMap.get(pt.post.authorId);
    const org = orgMap.get(pt.post.authorId);

    let authorName = pt.post.authorId;
    let authorUsername: string | null = null;

    if (user) {
      authorName = user.displayName || user.username || pt.post.authorId;
      authorUsername = user.username;
    } else if (actor) {
      authorName = actor.name;
    } else if (org) {
      authorName = org.name || pt.post.authorId;
    }

    return {
      id: pt.post.id,
      content: pt.post.content,
      authorId: pt.post.authorId,
      authorName,
      authorUsername,
      timestamp: pt.post.timestamp.toISOString(),
      likeCount: likeMap.get(pt.post.id) || 0,
      commentCount: commentMap.get(pt.post.id) || 0,
      shareCount: shareMap.get(pt.post.id) || 0,
      type: pt.post.type,
    };
  });

  logger.info(
    'Grouped trending posts retrieved',
    {
      tagCount: tagsList.length,
      postCount: formattedPosts.length,
    },
    'GET /api/trending/group'
  );

  return NextResponse.json({
    success: true,
    posts: formattedPosts,
    tags: tagsList,
  });
});
