/**
 * Admin Agents Pause All API
 *
 * @route POST /api/admin/agents/pause-all - Pause all agents
 * @access Admin
 *
 * @description
 * Emergency endpoint to pause ALL autonomous agents immediately. Disables
 * all autonomous behaviors (trading, posting, commenting, DMs, group chats).
 * Admin only.
 *
 * @example
 * ```typescript
 * await fetch('/api/admin/agents/pause-all', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * });
 * ```
 */

import {
  getClientIp,
  logAdminModify,
  requireAdmin,
  withErrorHandling,
} from '@babylon/api';
import { db, userAgentConfigs } from '@babylon/db';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const admin = await requireAdmin(req);

  // Audit log the emergency action
  logAdminModify({
    adminId: admin.userId,
    ipAddress: getClientIp(req.headers) ?? undefined,
    resourceType: 'agents',
    metadata: { action: 'emergency_pause_all' },
  });

  // Pause ALL autonomous agents immediately by updating their configs
  await db.update(userAgentConfigs).set({
    autonomousTrading: false,
    autonomousPosting: false,
    autonomousCommenting: false,
    autonomousDMs: false,
    autonomousGroupChats: false,
    status: 'idle',
    updatedAt: new Date(),
  });

  logger.warn(
    `EMERGENCY: Paused all autonomous agents`,
    undefined,
    'AdminAgentsAPI'
  );

  return NextResponse.json({
    success: true,
    message: 'Paused all agents',
    data: {
      paused: 'all',
    },
  });
});
