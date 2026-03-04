/**
 * Admin Training Rollback API
 *
 * @route POST /api/admin/training/rollback - Rollback model version
 * @access Admin
 *
 * @description
 * Rolls back to a previous model version. Useful for reverting problematic
 * deployments. Updates all agents to use the specified version.
 *
 * @example
 * ```typescript
 * await fetch('/api/admin/training/rollback', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` },
 *   body: JSON.stringify({ targetVersion: 'v0.9.0' })
 * });
 * ```
 */

import {
  BadRequestError,
  requireAdmin,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { db } from '@babylon/db';
import { modelDeployer } from '@babylon/training';
import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const body = await request.json();
  const { targetVersion } = body;

  if (!targetVersion) {
    throw new BadRequestError('Target version required');
  }

  // Get current deployed version
  const currentModel = await db.trainedModel.findFirst({
    where: { status: 'deployed' },
    orderBy: { deployedAt: 'desc' },
  });

  if (!currentModel) {
    throw new BadRequestError('No currently deployed model');
  }

  const result = await modelDeployer.rollback(
    currentModel.version,
    targetVersion
  );

  return successResponse(result);
});
