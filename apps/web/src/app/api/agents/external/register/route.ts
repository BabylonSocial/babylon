/**
 * External Agent Registration Endpoint
 *
 * POST /api/agents/external/register
 *
 * Allows external agents (ElizaOS, MCP, Agent0, custom) to register
 * with the Babylon game. Generates API keys and stores connection params.
 *
 * @see src/lib/services/agent-registry.service.ts
 */

import type { ExternalAgentConnectionParams } from '@babylon/agents';
import { agentRegistry } from '@babylon/agents';
import {
  authenticate,
  checkRateLimitAsync,
  generateApiKey,
  hashApiKey,
  RATE_LIMIT_CONFIGS,
} from '@babylon/api';
import { ExternalAgentRegisterBody } from '@babylon/api/schemas';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Authenticate the request (requires valid Privy session)
  const authUser = await authenticate(req);

  // Rate limit check - 5 registrations per hour per user
  const rateLimitResult = await checkRateLimitAsync(
    authUser.userId,
    RATE_LIMIT_CONFIGS.EXTERNAL_AGENT_REGISTER
  );

  if (!rateLimitResult.allowed) {
    logger.warn(
      'External agent registration rate limit exceeded',
      {
        userId: authUser.userId,
        retryAfter: rateLimitResult.retryAfter,
      },
      'ExternalAgentRegister'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for agent registration',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter ?? 3600),
          'X-RateLimit-Limit': String(
            RATE_LIMIT_CONFIGS.EXTERNAL_AGENT_REGISTER.maxRequests
          ),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining ?? 0),
        },
      }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation error',
        message: 'Invalid JSON body',
      },
      { status: 400 }
    );
  }

  const validatedResult = ExternalAgentRegisterBody.safeParse(body);
  if (!validatedResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation error',
        details: validatedResult.error.issues,
      },
      { status: 400 }
    );
  }
  const validated = validatedResult.data;

  // Generate API key for this external agent
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  // Prepare connection params with API key authentication
  const connectionParams: ExternalAgentConnectionParams = {
    externalId: validated.externalId,
    name: validated.name,
    description: validated.description,
    endpoint: validated.endpoint,
    protocol: validated.protocol,
    capabilities: validated.capabilities,
    authentication: {
      type: 'apiKey',
      credentials: JSON.stringify({
        apiKeyHash,
        ...validated.authentication?.credentials,
      }),
    },
    agentCard: validated.agentCard,
    registeredByUserId: authUser.userId,
  };

  // Register the external agent
  const registration =
    await agentRegistry.registerExternalAgent(connectionParams);

  // Return registration details with API key (only shown once!)
  return NextResponse.json(
    {
      success: true,
      registration: {
        agentId: registration.agentId,
        name: registration.name,
        status: registration.status,
        trustLevel: registration.trustLevel,
        capabilities: registration.capabilities,
      },
      apiKey, // Only returned on registration, never again!
      message:
        'External agent registered successfully. Save your API key - it will not be shown again.',
      registeredBy: authUser.userId,
    },
    { status: 201 }
  );
}
