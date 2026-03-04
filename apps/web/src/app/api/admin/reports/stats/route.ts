/**
 * Admin Reports Statistics API
 *
 * @route GET /api/admin/reports/stats - Get report statistics
 * @access Admin
 *
 * @description
 * Returns comprehensive statistics about user reports including counts by
 * status, type breakdown, and recent activity. Admin only.
 *
 * @example
 * ```typescript
 * const stats = await fetch('/api/admin/reports/stats', {
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * }).then(r => r.json());
 * ```
 */

import { requireAdmin, successResponse, withErrorHandling } from '@babylon/api';
import { count, db, isNotNull, reports } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  logger.info(
    'Admin reports stats requested',
    {},
    'GET /api/admin/reports/stats'
  );

  // Get counts by status
  const [
    totalReports,
    pendingReports,
    reviewingReports,
    resolvedReports,
    dismissedReports,
  ] = await Promise.all([
    db.report.count(),
    db.report.count({ where: { status: 'pending' } }),
    db.report.count({ where: { status: 'reviewing' } }),
    db.report.count({ where: { status: 'resolved' } }),
    db.report.count({ where: { status: 'dismissed' } }),
  ]);

  // Get counts by category
  const reportsByCategoryRaw = await db
    .select({
      category: reports.category,
      _count: count(),
    })
    .from(reports)
    .groupBy(reports.category);

  const reportsByCategory = reportsByCategoryRaw.sort(
    (a, b) => Number(b._count) - Number(a._count)
  );

  // Get counts by priority
  const reportsByPriority = await db
    .select({
      priority: reports.priority,
      _count: count(),
    })
    .from(reports)
    .groupBy(reports.priority);

  // Get top reported users
  const topReportedUsersRaw = await db
    .select({
      reportedUserId: reports.reportedUserId,
      _count: count(),
    })
    .from(reports)
    .where(isNotNull(reports.reportedUserId))
    .groupBy(reports.reportedUserId);

  const topReportedUsers = topReportedUsersRaw
    .sort((a, b) => Number(b._count) - Number(a._count))
    .slice(0, 10);

  // Get user details for top reported users
  const topReportedUsersWithDetails = await Promise.all(
    topReportedUsers.map(async (item) => {
      const user = await db.user.findUnique({
        where: { id: item.reportedUserId! },
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
          isBanned: true,
        },
      });
      return {
        user,
        reportCount: Number(item._count),
      };
    })
  );

  // Get top reporters
  const topReportersRaw = await db
    .select({
      reporterId: reports.reporterId,
      _count: count(),
    })
    .from(reports)
    .groupBy(reports.reporterId);

  const topReporters = topReportersRaw
    .sort((a, b) => Number(b._count) - Number(a._count))
    .slice(0, 10);

  // Get user details for top reporters
  const topReportersWithDetails = await Promise.all(
    topReporters.map(async (item) => {
      const user = await db.user.findUnique({
        where: { id: String(item.reporterId) },
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
        },
      });
      return {
        user,
        reportCount: Number(item._count),
      };
    })
  );

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentReports = await db.report.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  const recentResolved = await db.report.count({
    where: {
      resolvedAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  return successResponse({
    totals: {
      total: totalReports,
      pending: pendingReports,
      reviewing: reviewingReports,
      resolved: resolvedReports,
      dismissed: dismissedReports,
    },
    byCategory: reportsByCategory.map((item) => ({
      category: item.category,
      count: Number(item._count),
    })),
    byPriority: reportsByPriority.map((item) => ({
      priority: item.priority,
      count: Number(item._count),
    })),
    topReportedUsers: topReportedUsersWithDetails,
    topReporters: topReportersWithDetails,
    recentActivity: {
      last7Days: recentReports,
      resolved7Days: recentResolved,
    },
  });
});
