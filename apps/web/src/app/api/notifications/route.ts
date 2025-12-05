/**
 * User Notifications API
 *
 * @route GET /api/notifications - Get user notifications
 * @route PATCH /api/notifications - Mark notifications as read
 * @access Authenticated
 *
 * @description
 * Manages user notifications for social interactions, mentions, trades,
 * and system events. Supports filtering, pagination, and batch read marking.
 * Optimized for high-frequency polling with short TTL caching.
 *
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get user notifications
 *     description: Returns paginated notifications with filtering support. Cached for 10 seconds.
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Show only unread notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark notifications as read
 *     description: Marks specific notifications or all notifications as read.
 *     security:
 *       - PrivyAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of notification IDs to mark as read
 *               markAllAsRead:
 *                 type: boolean
 *                 description: Mark all notifications as read
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       401:
 *         description: Unauthorized
 *
 * **Notification Types:**
 * - **mention:** User mentioned in post/comment (@username)
 * - **reply:** Comment reply to user's post/comment
 * - **like:** Post/comment liked by another user
 * - **follow:** New follower
 * - **trade:** Trade execution or settlement
 * - **system:** System announcements and alerts
 *
 * **GET - Retrieve Notifications**
 *
 * Returns paginated notifications with actor (sender) details and metadata.
 * Results are cached for 10 seconds to balance freshness with performance.
 *
 * @query {number} limit - Notifications per page (1-100, default: 50)
 * @query {number} page - Page number (default: 1, currently not implemented)
 * @query {boolean} unreadOnly - Show only unread notifications
 * @query {string} type - Filter by notification type
 *
 * **Notification Object:**
 * @property {string} id - Notification ID
 * @property {string} type - Notification type
 * @property {string} actorId - User who triggered notification
 * @property {object} actor - Actor profile details
 * @property {string} postId - Related post ID (if applicable)
 * @property {string} commentId - Related comment ID (if applicable)
 * @property {string} message - Notification message
 * @property {boolean} read - Read status
 * @property {string} createdAt - ISO timestamp
 *
 * @returns {object} Notifications response
 * @property {array} notifications - Array of notification objects
 * @property {number} unreadCount - Total unread notifications
 *
 * **PATCH - Mark Notifications as Read**
 *
 * Marks specific notifications or all notifications as read.
 * Automatically invalidates cached notifications after update.
 *
 * @param {array} notificationIds - Array of notification IDs to mark (optional)
 * @param {boolean} markAllAsRead - Mark all notifications as read (optional)
 *
 * **Note:** Must provide either `notificationIds` array or `markAllAsRead: true`
 *
 * @returns {object} Success response
 * @property {boolean} success - Operation success
 * @property {string} message - Confirmation message
 *
 * @throws {400} Invalid request (missing both parameters)
 * @throws {401} Unauthorized - authentication required
 * @throws {500} Internal server error
 *
 * @example
 * ```typescript
 * // Get unread notifications
 * const response = await fetch('/api/notifications?unreadOnly=true&limit=20', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * const { notifications, unreadCount } = await response.json();
 *
 * // Display notifications
 * notifications.forEach(notif => {
 *   console.log(`${notif.actor.displayName}: ${notif.message}`);
 * });
 *
 * // Mark specific notifications as read
 * await fetch('/api/notifications', {
 *   method: 'PATCH',
 *   body: JSON.stringify({
 *     notificationIds: ['id1', 'id2', 'id3']
 *   })
 * });
 *
 * // Mark all as read
 * await fetch('/api/notifications', {
 *   method: 'PATCH',
 *   body: JSON.stringify({
 *     markAllAsRead: true
 *   })
 * });
 * ```
 *
 * @see {@link /lib/services/notification-service} Notification creation
 * @see {@link /lib/cache-service} Caching layer
 * @see {@link /src/components/NotificationBell.tsx} Notification UI
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { and, count, db, desc, eq, inArray, notifications, users } from '@babylon/db';
import { authenticate } from '@babylon/api';
import {
  CACHE_KEYS,
  getCacheOrFetch,
  invalidateCachePattern,
} from '@babylon/api';
import { InternalServerError } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import {
  getBlockedByUserIds,
  getBlockedUserIds,
  getMutedUserIds,
} from '@babylon/db';
import {
  MarkNotificationsReadSchema,
  NotificationsQuerySchema,
} from '@babylon/shared';

/**
 * GET /api/notifications - Get user notifications
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);

  // Parse and validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams: Record<string, string> = {};

  const limit = searchParams.get('limit');
  const page = searchParams.get('page');
  const unreadOnly = searchParams.get('unreadOnly');
  const type = searchParams.get('type');

  if (limit) queryParams.limit = limit;
  if (page) queryParams.page = page;
  if (unreadOnly) queryParams.unreadOnly = unreadOnly;
  if (type) queryParams.type = type;

  const validated = NotificationsQuerySchema.parse(queryParams);
  const {
    limit: validatedLimit,
    unreadOnly: validatedUnreadOnly,
    type: validatedType,
  } = validated;

  // Build where conditions
  const conditions = [eq(notifications.userId, authUser.userId)];

  if (validatedUnreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  if (validatedType) {
    conditions.push(eq(notifications.type, validatedType));
  }

  // OPTIMIZED: Cache notifications with short TTL (high-frequency polling endpoint)
  const cacheKey = `notifications:${authUser.userId}:${validatedUnreadOnly}:${validatedType}:${validatedLimit}`;

  // Get blocked/muted user IDs to filter notifications
  const [blockedIds, mutedIds, blockedByIds] = await Promise.all([
    getBlockedUserIds(authUser.userId),
    getMutedUserIds(authUser.userId),
    getBlockedByUserIds(authUser.userId),
  ]);

  const excludedUserIds = new Set([
    ...blockedIds,
    ...mutedIds,
    ...blockedByIds,
  ]);

  const { notificationsList, unreadCount } = await getCacheOrFetch(
    cacheKey,
    async () => {
      // Fetch notifications
      const allNotifications = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(validatedLimit * 2); // Fetch more to account for filtering

      // Get actor IDs to fetch user info
      const actorIds = [
        ...new Set(
          allNotifications
            .map((n) => n.actorId)
            .filter((id): id is string => id !== null)
        ),
      ];

      // Fetch actor info
      const actorsResult =
        actorIds.length > 0
          ? await db
              .select({
                id: users.id,
                displayName: users.displayName,
                username: users.username,
                profileImageUrl: users.profileImageUrl,
              })
              .from(users)
              .where(inArray(users.id, actorIds))
          : [];

      const actorMap = new Map(actorsResult.map((a) => [a.id, a]));

      // Filter out notifications from blocked/muted users and add actor info
      const notificationsList = allNotifications
        .filter((n) => !n.actorId || !excludedUserIds.has(n.actorId))
        .slice(0, validatedLimit) // Limit to requested amount after filtering
        .map((n) => ({
          ...n,
          actor: n.actorId ? actorMap.get(n.actorId) || null : null,
        }));

      // Get unread count
      const [unreadCountResult] = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, authUser.userId),
            eq(notifications.read, false)
          )
        );

      return {
        notificationsList,
        unreadCount: Number(unreadCountResult?.count ?? 0),
      };
    },
    {
      namespace: CACHE_KEYS.USER,
      ttl: 10, // 10 second cache (high-frequency endpoint, needs to be fresh)
    }
  );

  logger.info(
    'Notifications fetched successfully',
    { userId: authUser.userId, count: notificationsList.length, unreadCount },
    'GET /api/notifications'
  );

  return successResponse({
    notifications: notificationsList.map((n) => {
      // Helper to safely convert any value to string (handles cached data)
      const toSafeString = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return String(value);
        if (typeof value === 'object' && 'toString' in value) {
          try {
            return (value as { toString: () => string }).toString();
          } catch {
            return String(value);
          }
        }
        return String(value);
      };

      // Handle createdAt safely - it could be Date (from DB/memory cache) or string (from Redis cache)
      let createdAtISO: string;
      if (n.createdAt instanceof Date) {
        createdAtISO = n.createdAt.toISOString();
      } else if (typeof n.createdAt === 'string') {
        createdAtISO = n.createdAt;
      } else {
        // Fallback: try to convert to Date then to ISO string
        try {
          const dateValue = n.createdAt as string | number | Date;
          createdAtISO = new Date(dateValue).toISOString();
        } catch {
          createdAtISO = new Date().toISOString();
        }
      }

      return {
        id: toSafeString(n.id),
        type: toSafeString(n.type),
        actorId: toSafeString(n.actorId),
        actor: n.actor
          ? {
              id: toSafeString(n.actor.id),
              displayName: toSafeString(n.actor.displayName),
              username: toSafeString(n.actor.username),
              profileImageUrl: toSafeString(n.actor.profileImageUrl),
            }
          : null,
        postId: n.postId ? toSafeString(n.postId) : null,
        commentId: n.commentId ? toSafeString(n.commentId) : null,
        chatId: n.chatId ? toSafeString(n.chatId) : null,
        groupId: n.groupId ? toSafeString(n.groupId) : null,
        inviteId: n.inviteId ? toSafeString(n.inviteId) : null,
        message: toSafeString(n.message),
        read: Boolean(n.read),
        createdAt: createdAtISO,
      };
    }),
    unreadCount,
  });
});

/**
 * PATCH /api/notifications - Mark notifications as read
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);

  // Parse and validate request body
  let body: { notificationIds?: string[]; markAllAsRead?: boolean };
  try {
    body = (await request.json()) as {
      notificationIds?: string[];
      markAllAsRead?: boolean;
    };
  } catch (error) {
    logger.error(
      'Failed to parse request body',
      { error },
      'PATCH /api/notifications'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
      },
      { status: 400 }
    );
  }
  const { notificationIds, markAllAsRead } =
    MarkNotificationsReadSchema.parse(body);

  if (markAllAsRead) {
    // Mark all notifications as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, authUser.userId),
          eq(notifications.read, false)
        )
      );

    // Invalidate notification cache after update
    await invalidateCachePattern(`notifications:${authUser.userId}:*`, {
      namespace: CACHE_KEYS.USER,
    });

    logger.info(
      'All notifications marked as read',
      { userId: authUser.userId },
      'PATCH /api/notifications'
    );
    return successResponse({
      success: true,
      message: 'All notifications marked as read',
    });
  }

  if (notificationIds && notificationIds.length > 0) {
    // Mark specific notifications as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          inArray(notifications.id, notificationIds),
          eq(notifications.userId, authUser.userId) // Ensure user owns these notifications
        )
      );

    // Invalidate notification cache after update
    await invalidateCachePattern(`notifications:${authUser.userId}:*`, {
      namespace: CACHE_KEYS.USER,
    });

    logger.info(
      'Notifications marked as read',
      { userId: authUser.userId, count: notificationIds.length },
      'PATCH /api/notifications'
    );
    return successResponse({
      success: true,
      message: 'Notifications marked as read',
    });
  }

  // This should not happen due to schema validation, but handle gracefully
  throw new InternalServerError(
    'Invalid request: provide notificationIds array or markAllAsRead=true'
  );
});
