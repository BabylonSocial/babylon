/**
 * Admin Signal Analysis API
 *
 * @route GET /api/admin/signal-analysis - Get signal analysis
 * @access Admin
 *
 * @description
 * Internal debugging endpoint for admins to view signal analysis. Reveals
 * secret game data and must NEVER be exposed to regular users or agents.
 * Admin authentication required.
 *
 * @example
 * ```typescript
 * const analysis = await fetch('/api/admin/signal-analysis', {
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * }).then(r => r.json());
 * ```
 */

import {
  getClientIp,
  logAdminView,
  requireAdmin,
  withErrorHandling,
} from '@babylon/api';
import { SignalExtractionService } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const admin = await requireAdmin(request);

  const { searchParams } = new URL(request.url);
  const questionNumber = searchParams.get('questionNumber');

  // Audit log the view
  logAdminView({
    adminId: admin.userId,
    ipAddress: getClientIp(request.headers) ?? undefined,
    resourceType: 'signal_analysis',
    metadata: { action: 'view_signal_analysis', questionNumber },
  });

  if (!questionNumber) {
    return NextResponse.json(
      { error: 'questionNumber parameter required' },
      { status: 400 }
    );
  }

  // Extract signal (admin only, for debugging)
  const signal = await SignalExtractionService.extractMarketSignal(
    Number.parseInt(questionNumber, 10)
  );

  return NextResponse.json({
    success: true,
    signal,
    warning: 'This data is for admin debugging only. Never expose to agents.',
  });
});
