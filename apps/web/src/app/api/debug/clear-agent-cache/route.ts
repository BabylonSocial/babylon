/**
 * Clear Agent Runtime Cache API
 * 
 * @route POST /api/debug/clear-agent-cache - Clear agent cache
 * @access Admin/Debug
 * 
 * @description
 * Debug endpoint to forcefully clear all cached agent runtimes from memory.
 * Useful for troubleshooting agent behavior issues, memory leaks, or forcing
 * runtime reinitialization after configuration changes. Clears ALL agent
 * runtimes, causing temporary performance impact.
 * 
 * @example
 * ```typescript
 * await fetch('/api/debug/clear-agent-cache', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` }
 * });
 * ```
 * @returns {object} Success response with count of cleared runtimes
 * @property {boolean} success - Operation success status
 * @property {number} cleared - Number of runtime instances cleared
 * 
 * @throws {500} Internal server error if cache clearing fails
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/debug/clear-agent-cache', {
 *   method: 'POST'
 * });
 * const data = await response.json();
 * // { success: true, cleared: 15 }
 * ```
 * 
 * @see {@link /lib/agents/runtime/AgentRuntimeManager} Runtime manager implementation
 */


import { requireAdmin, successResponse, withErrorHandling } from '@babylon/api';
import { agentRuntimeManager } from '@babylon/agents/runtime';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const count = agentRuntimeManager.getRuntimeCount();
  agentRuntimeManager.clearAllRuntimes();
  logger.info(`Cleared ${count} cached runtimes`, undefined, 'Debug');
  return successResponse({ success: true, cleared: count });
});

