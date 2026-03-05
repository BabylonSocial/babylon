/**
 * Mark Notifications as Read API
 *
 * @route POST /api/notifications/mark-read - Mark notifications as read
 * @access Authenticated
 *
 * @description
 * Marks one or more notifications as read/acknowledged. Supports marking
 * specific notifications, all notifications of a type, or all notifications.
 *
 * @example
 * ```typescript
 * await fetch('/api/notifications/mark-read', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({ markAll: true })
 * });
 * ```
 */

import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { MarkNotificationsReadSchema } from '@babylon/api/schemas';
import { and, db, eq, inArray, notifications } from '@babylon/db';
import type { NextRequest } from 'next/server';

/**
 * POST /api/notifications/mark-read
 * Mark notifications as read
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);
  const body = await request.json();
  const { notificationIds, type, markAll } = MarkNotificationsReadSchema.parse(body);

  if (markAll) {
    // Mark all notifications as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, user.userId),
          eq(notifications.read, false)
        )
      );

    return successResponse({
      data: {
        message: 'All notifications marked as read',
      },
    });
  }

  if (type) {
    // Mark all notifications of a specific type as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, user.userId),
          eq(notifications.type, type),
          eq(notifications.read, false)
        )
      );

    return successResponse({
      data: {
        message: `All ${type} notifications marked as read`,
      },
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
          eq(notifications.userId, user.userId) // Ensure user owns these notifications
        )
      );

    return successResponse({
      data: {
        message: `${notificationIds.length} notification(s) marked as read`,
      },
    });
  }

  return successResponse({
    data: {
      message: 'No notifications to mark',
    },
  });
});
