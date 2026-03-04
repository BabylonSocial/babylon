/**
 * Admin Report Management API
 *
 * @route GET /api/admin/reports/[reportId] - Get report details
 * @route POST /api/admin/reports/[reportId] - Take action on report
 * @access Admin
 *
 * @description
 * Manages individual reports. GET returns detailed report information with related
 * reports. POST allows taking actions: resolve, dismiss, escalate, ban_user, or
 * evaluate (AI evaluation). Requires admin authentication.
 *
 * @example
 * ```typescript
 * // Get report details
 * const report = await fetch(`/api/admin/reports/${reportId}`, {
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * });
 *
 * // Resolve report
 * await fetch(`/api/admin/reports/${reportId}`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` },
 *   body: JSON.stringify({
 *     action: 'resolve',
 *     resolution: 'User warned'
 *   })
 * });
 * ```
 *
 * @see {@link /lib/api/admin-middleware} Admin middleware
 * @see {@link /lib/moderation/report-evaluation} Report evaluation
 */

import {
  evaluateReport,
  NotFoundError,
  requireAdmin,
  storeEvaluationResult,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { db } from '@babylon/db';
import { AdminReportActionSchema, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * GET /api/admin/reports/[reportId]
 * Get detailed report information
 */
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ reportId: string }> }
  ) => {
    await requireAdmin(request);
    const { reportId } = await context.params;

    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            createdAt: true,
            reputationPoints: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            isBanned: true,
            bannedAt: true,
            bannedReason: true,
            createdAt: true,
            reputationPoints: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Report', reportId);
    }

    // Get related reports for the same user/post
    const relatedReports = await db.report.findMany({
      where: {
        OR: [
          { reportedUserId: report.reportedUserId || undefined },
          { reportedPostId: report.reportedPostId || undefined },
        ],
        id: { not: reportId },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        reason: true,
        status: true,
        category: true,
        resolution: true,
        resolvedAt: true,
        priority: true,
        reportedUserId: true,
        reportedPostId: true,
        reportedCommentId: true,
        reporterId: true,
        resolvedBy: true,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    // Parse evaluation if it exists
    let evaluation = null;
    if (report.resolution) {
      // Check if it's valid JSON before parsing
      const trimmed = report.resolution.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        evaluation = JSON.parse(report.resolution);
      }
    }

    return successResponse({
      report: {
        ...report,
        evaluation,
      },
      relatedReports,
    });
  }
);

/**
 * POST /api/admin/reports/[reportId]
 * Take action on a report
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ reportId: string }> }
  ) => {
    const adminUser = await requireAdmin(request);
    const { reportId } = await context.params;

    const body = await request.json();
    const { action, resolution } = AdminReportActionSchema.parse(body);

    // Handle evaluate action (doesn't require resolution)
    if (action === 'evaluate') {
      const evaluation = await evaluateReport(reportId);
      await storeEvaluationResult(reportId, evaluation);

      logger.info(
        'Report evaluated',
        {
          reportId,
          outcome: evaluation.outcome,
          confidence: evaluation.confidence,
        },
        'POST /api/admin/reports/[reportId]'
      );

      return successResponse({
        success: true,
        message: 'Report evaluated successfully',
        evaluation,
      });
    }

    logger.info(
      'Admin taking action on report',
      {
        adminUserId: adminUser.userId,
        reportId,
        action,
      },
      'POST /api/admin/reports/[reportId]'
    );

    const report = await db.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        reportedUserId: true,
        reportedPostId: true,
        status: true,
      },
    });

    if (!report) {
      throw new NotFoundError('Report', reportId);
    }

    // Handle different actions
    if (action === 'resolve') {
      await db.report.update({
        where: { id: reportId },
        data: {
          status: 'resolved',
          resolution,
          resolvedBy: adminUser.userId,
          resolvedAt: new Date(),
        },
      });
    } else if (action === 'dismiss') {
      await db.report.update({
        where: { id: reportId },
        data: {
          status: 'dismissed',
          resolution,
          resolvedBy: adminUser.userId,
          resolvedAt: new Date(),
        },
      });
    } else if (action === 'escalate') {
      await db.report.update({
        where: { id: reportId },
        data: {
          priority: 'critical',
          status: 'reviewing',
          resolution,
        },
      });
    } else if (action === 'ban_user') {
      if (!report.reportedUserId) {
        throw new Error('Cannot ban user: no user associated with this report');
      }

      // Ban the reported user
      await db.user.update({
        where: { id: report.reportedUserId },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: `Report #${reportId}: ${resolution}`,
          bannedBy: adminUser.userId,
        },
      });

      // Update report
      await db.report.update({
        where: { id: reportId },
        data: {
          status: 'resolved',
          resolution: `User banned: ${resolution}`,
          resolvedBy: adminUser.userId,
          resolvedAt: new Date(),
        },
      });
    }

    logger.info(
      'Admin action completed on report',
      {
        adminUserId: adminUser.userId,
        reportId,
        action,
      },
      'POST /api/admin/reports/[reportId]'
    );

    return successResponse({
      success: true,
      message: `Report ${action} successfully`,
    });
  }
);
