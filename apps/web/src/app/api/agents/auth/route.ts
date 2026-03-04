/**
 * Agent Authentication API
 *
 * @route POST /api/agents/auth - Authenticate agent
 * @access Public (with credentials)
 *
 * @description
 * Secure authentication endpoint for autonomous Babylon agents. Provides
 * session-based authentication without requiring user Privy tokens. Agent
 * credentials are validated against environment variables, and successful
 * authentication returns a time-limited session token.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/agents/auth', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     agentId: 'my-agent-id',
 *     agentSecret: process.env.AGENT_SECRET
 *   })
 * });
 *
 * const { sessionToken, expiresIn } = await response.json();
 *
 * // Use token for authenticated requests
 * await fetch('/api/some-endpoint', {
 *   headers: { 'Authorization': `Bearer ${sessionToken}` }
 * });
 * ```
 *
 * @see {@link /lib/auth/agent-auth} Agent authentication implementation
 * @see {@link /examples/babylon-typescript-agent} Example agent usage
 */

import {
  AuthorizationError,
  cleanupExpiredSessions,
  createAgentSession,
  getSessionDuration,
  successResponse,
  verifyAgentCredentials,
  withErrorHandling,
} from '@babylon/api';
import { AgentAuthSchema, logger } from '@babylon/shared';
import { randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * POST /api/agents/auth
 * Authenticate agent and receive session token
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  // Check if body is empty or not an object
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error(
      'Request body must be a JSON object containing agentId and agentSecret fields.'
    );
  }

  const { agentId, agentSecret } = AgentAuthSchema.parse(body);

  // Verify agent credentials
  if (!verifyAgentCredentials(agentId, agentSecret)) {
    throw new AuthorizationError(
      'Invalid agent credentials',
      'agent',
      'authenticate'
    );
  }

  // Clean up old sessions
  cleanupExpiredSessions();

  // Generate session token
  const sessionToken = randomBytes(32).toString('hex');

  // Create session
  const session = await createAgentSession(agentId, sessionToken);

  logger.info(
    `Agent ${agentId} authenticated successfully`,
    undefined,
    'POST /api/agents/auth'
  );

  return successResponse({
    success: true,
    sessionToken,
    expiresAt: session.expiresAt,
    expiresIn: getSessionDuration() / 1000, // seconds
  });
});
