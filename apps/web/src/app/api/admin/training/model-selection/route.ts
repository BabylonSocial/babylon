/**
 * Admin Training Model Selection API
 *
 * @route GET /api/admin/training/model-selection - Get model selection info
 * @access Admin
 *
 * @description
 * Returns information about model selection for training including summary
 * and recommended base model selection.
 *
 * @example
 * ```typescript
 * const info = await fetch('/api/admin/training/model-selection', {
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * }).then(r => r.json());
 * ```
 */

import { requireAdmin, successResponse, withErrorHandling } from '@babylon/api';
import { modelSelectionService } from '@babylon/training';
import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  // Get summary
  const summary = await modelSelectionService.getSelectionSummary();

  // Try to select base model
  let selection = null;
  const selectionError = null;

  selection = await modelSelectionService.selectBaseModel();

  return successResponse({
    success: true,
    summary,
    selection,
    selectionError,
  });
});
