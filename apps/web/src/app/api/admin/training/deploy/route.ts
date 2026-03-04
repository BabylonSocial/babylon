/**
 * Admin Training Deploy Model API
 *
 * @route POST /api/admin/training/deploy - Deploy model version
 * @access Admin
 *
 * @description
 * Deploys a trained model version to agents. Supports gradual rollout with
 * percentage-based deployment strategy.
 *
 * @example
 * ```typescript
 * await fetch('/api/admin/training/deploy', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` },
 *   body: JSON.stringify({ modelVersion: 'v1.0.0', strategy: 'gradual' })
 * });
 * ```
 */

import {
  BadRequestError,
  requireAdmin,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { modelDeployer } from '@babylon/training';
import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const body = await request.json();
  const { modelVersion, strategy = 'gradual', rolloutPercentage = 10 } = body;

  if (!modelVersion) {
    throw new BadRequestError('Model version required');
  }

  const result = await modelDeployer.deploy({
    modelVersion,
    strategy,
    rolloutPercentage,
  });

  return successResponse(result);
});
