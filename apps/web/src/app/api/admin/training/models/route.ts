/**
 * Admin Training Models API
 *
 * @route GET /api/admin/training/models - Get trained models
 * @access Admin
 *
 * @description
 * Returns all trained model versions with metadata from database and blob storage.
 * Includes version, performance metrics, and deployment status.
 *
 * @example
 * ```typescript
 * const { models } = await fetch('/api/admin/training/models', {
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * }).then(r => r.json());
 * ```
 */

import { requireAdmin, successResponse, withErrorHandling } from '@babylon/api';
import { db } from '@babylon/db';
import { modelStorage } from '@babylon/training';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);
  // Get models from database
  const dbModels = await db.trainedModel.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Get models from Vercel Blob
  const blobModels = await modelStorage.listModels();

  // Merge data
  const models = dbModels.map((dbModel) => {
    const blobModel = blobModels.find((b) => b.version === dbModel.version);

    return {
      version: dbModel.version,
      baseModel: dbModel.baseModel,
      trainedAt: dbModel.createdAt,
      accuracy: dbModel.accuracy,
      avgReward: dbModel.avgReward,
      status: dbModel.status,
      agentsUsing: dbModel.agentsUsing,
      blobUrl: dbModel.storagePath,
      size: blobModel?.size || 0,
      wandbRunId: dbModel.wandbRunId,
    };
  });

  return successResponse({
    success: true,
    models,
    total: models.length,
  });
});
