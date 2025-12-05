/**
 * Post Share/Repost API
 *
 * @route POST /api/posts/[id]/share - Share/repost a post
 * @route DELETE /api/posts/[id]/share - Unshare/remove repost
 * @access Authenticated
 *
 * @description
 * Manages post sharing and reposting functionality. Creates repost posts that appear
 * in user feeds, handles quote posts with commentary, and manages share tracking.
 * Includes rate limiting, duplicate prevention, and automatic notifications.
 *
 * @openapi
 * /api/posts/{id}/share:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Share/repost a post
 *     description: Creates a share/repost of a post. Optionally includes quote commentary. Creates repost post in user's feed.
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to share
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Optional quote comment/commentary
 *     responses:
 *       201:
 *         description: Post shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareCount:
 *                       type: integer
 *                     isShared:
 *                       type: boolean
 *                     repostPost:
 *                       type: object
 *       400:
 *         description: Post already shared or invalid
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       429:
 *         description: Rate limit exceeded
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Unshare a post
 *     description: Removes share and deletes associated repost post
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to unshare
 *     responses:
 *       200:
 *         description: Post unshared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Share not found
 *
 * @example
 * ```typescript
 * // Share with quote comment
 * const response = await fetch(`/api/posts/${postId}/share`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     comment: 'Great analysis!'
 *   })
 * });
 *
 * // Unshare
 * await fetch(`/api/posts/${postId}/share`, {
 *   method: 'DELETE',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * ```
 *
 */

import type { NextRequest } from 'next/server';
import {
  actors,
  and,
  count,
  db,
  eq,
  isNull,
  organizations,
  posts,
  shares,
  users,
} from '@babylon/db';
import { authenticate } from '@babylon/api';
import { cachedDb } from '@babylon/api';
import { BusinessLogicError, NotFoundError } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import { hasBlocked } from '@babylon/db';
import { parsePostId } from '@babylon/engine';
import { trackServerEvent } from '@/lib/posthog/server';
import {
  checkRateLimitAndDuplicates,
  RATE_LIMIT_CONFIGS,
} from '@babylon/api';
import { notifyShare } from '@babylon/api';
import { NPCInteractionTracker } from '@babylon/engine';
import { generateSnowflakeId } from '@babylon/shared';
import { broadcastToChannel } from '@babylon/api';
import { ensureUserForAuth, getCanonicalUserId } from '@babylon/api';
import { PostIdParamSchema, SharePostSchema } from '@babylon/shared';
import type { JsonValue } from '@babylon/api';

/**
 * POST /api/posts/[id]/share
 *
 * Shares/reposts a post to the user's feed. Creates a repost post and share record.
 *
 * @param request - Next.js request containing optional quote comment
 * @param context - Route context with post ID parameter
 * @returns Share result with updated share count and repost post data
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    // Authenticate user
    const user = await authenticate(request);
    const { id: postId } = PostIdParamSchema.parse(await context.params);

    const rateLimitError = checkRateLimitAndDuplicates(
      user.userId,
      null,
      RATE_LIMIT_CONFIGS.SHARE_POST
    );
    if (rateLimitError) {
      return rateLimitError;
    }

    const body = await request.json();
    const validatedBody =
      Object.keys(body).length > 0
        ? SharePostSchema.parse(body)
        : { comment: undefined };
    const quoteComment = validatedBody.comment?.trim();

    const fallbackDisplayName = user.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : 'Anonymous';

    const { user: canonicalUser } = await ensureUserForAuth(user, {
      displayName: fallbackDisplayName,
    });
    const canonicalUserId = canonicalUser.id;

    const now = new Date();
    const [post] = await db
      .select({
        id: posts.id,
        deletedAt: posts.deletedAt,
        authorId: posts.authorId,
        timestamp: posts.timestamp,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post && post.timestamp > now) {
      throw new NotFoundError('Post', postId);
    }

    if (post) {
      const [isBlocked, hasBlockedMe] = await Promise.all([
        hasBlocked(post.authorId, canonicalUserId),
        hasBlocked(canonicalUserId, post.authorId),
      ]);

      if (isBlocked || hasBlockedMe) {
        throw new BusinessLogicError('Cannot share this post', 'BLOCKED_USER');
      }
    }

    if (!post) {
      const parseResult = parsePostId(postId);

      if (!parseResult.success) {
        throw new BusinessLogicError(
          'Invalid post ID format',
          'INVALID_POST_ID_FORMAT'
        );
      }

      const { gameId, authorId, timestamp } = parseResult.metadata;

      const [existingPost] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!existingPost) {
        await db.insert(posts).values({
          id: postId,
          content: '[Game-generated post]',
          authorId,
          gameId,
          timestamp,
        });
      }
    } else if (post.deletedAt) {
      throw new BusinessLogicError('Cannot share deleted post', 'POST_DELETED');
    }

    const [existingShare] = await db
      .select({ id: shares.id })
      .from(shares)
      .where(and(eq(shares.userId, canonicalUserId), eq(shares.postId, postId)))
      .limit(1);

    if (existingShare) {
      throw new BusinessLogicError('Post already shared', 'ALREADY_SHARED');
    }

    await db.insert(shares).values({
      id: await generateSnowflakeId(),
      userId: canonicalUserId,
      postId,
    });

    await NPCInteractionTracker.trackShare(canonicalUserId, postId);

    const repostId = await generateSnowflakeId();

    const [originalPost] = await db
      .select({
        content: posts.content,
        authorId: posts.authorId,
        timestamp: posts.timestamp,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (originalPost && originalPost.timestamp > now) {
      throw new NotFoundError('Post', postId);
    }

    let repostPostData = null;

    if (originalPost) {
      const [[originalUser], [originalActor], [originalOrg]] =
        await Promise.all([
          db
            .select({
              username: users.username,
              displayName: users.displayName,
              profileImageUrl: users.profileImageUrl,
            })
            .from(users)
            .where(eq(users.id, originalPost.authorId))
            .limit(1),
          db
            .select({
              name: actors.name,
              profileImageUrl: actors.profileImageUrl,
            })
            .from(actors)
            .where(eq(actors.id, originalPost.authorId))
            .limit(1),
          db
            .select({
              name: organizations.name,
              imageUrl: organizations.imageUrl,
            })
            .from(organizations)
            .where(eq(organizations.id, originalPost.authorId))
            .limit(1),
        ]);

      const originalAuthorName =
        originalUser?.displayName ||
        originalUser?.username ||
        originalActor?.name ||
        originalOrg?.name ||
        originalPost.authorId;
      const originalAuthorUsername =
        originalUser?.username || originalPost.authorId;
      const originalAuthorProfileImageUrl =
        originalUser?.profileImageUrl ||
        originalActor?.profileImageUrl ||
        originalOrg?.imageUrl;

      const repostContent = quoteComment || '';

      const [createdRepost] = await db
        .insert(posts)
        .values({
          id: repostId,
          content: repostContent,
          authorId: canonicalUserId,
          timestamp: new Date(),
          originalPostId: postId,
        })
        .returning();

      if (!createdRepost) {
        throw new BusinessLogicError(
          'Failed to create repost',
          'CREATE_FAILED'
        );
      }

      repostPostData = {
        id: createdRepost.id,
        content: createdRepost.content,
        authorId: createdRepost.authorId,
        authorName:
          canonicalUser.username ||
          canonicalUser.displayName ||
          `user_${canonicalUserId.slice(0, 8)}`,
        authorUsername: canonicalUser.username,
        authorDisplayName: canonicalUser.displayName,
        authorProfileImageUrl: canonicalUser.profileImageUrl,
        timestamp: createdRepost.timestamp.toISOString(),
        isRepost: true,
        isQuote: !!quoteComment,
        originalPostId: postId,
        originalPost: {
          id: postId,
          content: originalPost.content,
          authorId: originalPost.authorId,
          authorName: originalAuthorName,
          authorUsername: originalAuthorUsername,
          authorProfileImageUrl: originalAuthorProfileImageUrl,
          timestamp: originalPost.timestamp.toISOString(),
        },
        quoteComment: quoteComment || null,
      };

      await cachedDb.invalidatePostsCache();
      await cachedDb.invalidateActorPostsCache(canonicalUserId);
      logger.info(
        'Invalidated post caches after repost',
        { repostId },
        'POST /api/posts/[id]/share'
      );

      broadcastToChannel('feed', {
        type: 'new_post',
        post: repostPostData as JsonValue,
      });
      logger.info(
        'Broadcast repost to feed channel',
        { repostId, postId },
        'POST /api/posts/[id]/share'
      );
    }

    const [postAuthor] = await db
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (
      postAuthor &&
      postAuthor.authorId &&
      postAuthor.authorId !== canonicalUserId
    ) {
      const [postAuthorUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, postAuthor.authorId))
        .limit(1);

      if (postAuthorUser) {
        await notifyShare(postAuthor.authorId, canonicalUserId, postId);
      }
    }

    const [shareCountResult] = await db
      .select({ count: count() })
      .from(shares)
      .where(eq(shares.postId, postId));
    const shareCount = Number(shareCountResult?.count ?? 0);

    logger.info(
      'Post shared successfully',
      { postId, userId: canonicalUserId, shareCount },
      'POST /api/posts/[id]/share'
    );

    trackServerEvent(canonicalUserId, 'post_shared', {
      postId,
      ...(postAuthor?.authorId && { originalAuthorId: postAuthor.authorId }),
      shareCount,
      ...(repostId && { repostId }),
    });

    return successResponse(
      {
        data: {
          shareCount,
          isShared: true,
          repostPost: repostPostData, // Include repost post data for optimistic UI
        },
      },
      201
    );
  }
);

/**
 * DELETE /api/posts/[id]/share
 *
 * Unshares a post and removes the associated repost post from the user's feed.
 * Deletes the share record, removes the repost post if it exists, invalidates caches,
 * and updates share count. Tracks unshare event for analytics.
 *
 * @param request - Next.js request
 * @param context - Route context with post ID parameter
 * @returns Unshare result with updated share count and success status
 * @throws {401} Unauthorized
 * @throws {404} Share not found
 */
export const DELETE = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    // Authenticate user
    const user = await authenticate(request);
    const { id: postId } = PostIdParamSchema.parse(await context.params);

    const fallbackDisplayName = user.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : 'Anonymous';

    await ensureUserForAuth(user, { displayName: fallbackDisplayName });
    const canonicalUserId = getCanonicalUserId(user);

    const [share] = await db
      .select({ id: shares.id })
      .from(shares)
      .where(and(eq(shares.userId, canonicalUserId), eq(shares.postId, postId)))
      .limit(1);

    if (!share) {
      throw new NotFoundError('Share', `${postId}-${canonicalUserId}`);
    }

    const [repostPost] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, canonicalUserId),
          eq(posts.originalPostId, postId),
          isNull(posts.deletedAt)
        )
      )
      .limit(1);

    if (repostPost) {
      await db.delete(posts).where(eq(posts.id, repostPost.id));
      logger.info(
        'Deleted repost post',
        { repostPostId: repostPost.id, originalPostId: postId },
        'DELETE /api/posts/[id]/share'
      );
    } else {
      logger.warn(
        'No repost post found to delete',
        { postId, userId: canonicalUserId },
        'DELETE /api/posts/[id]/share'
      );
    }

    await db.delete(shares).where(eq(shares.id, share.id));

    const [shareCountResult] = await db
      .select({ count: count() })
      .from(shares)
      .where(eq(shares.postId, postId));
    const shareCount = Number(shareCountResult?.count ?? 0);

    await cachedDb.invalidatePostsCache();
    await cachedDb.invalidateActorPostsCache(canonicalUserId);
    logger.info(
      'Invalidated post caches after unshare',
      { postId },
      'DELETE /api/posts/[id]/share'
    );

    logger.info(
      'Post unshared successfully',
      { postId, userId: canonicalUserId, shareCount },
      'DELETE /api/posts/[id]/share'
    );

    trackServerEvent(canonicalUserId, 'post_unshared', {
      postId,
      shareCount,
    });

    return successResponse({
      data: {
        shareCount,
        isShared: false,
      },
    });
  }
);
