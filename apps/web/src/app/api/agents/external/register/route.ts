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

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@babylon/api';
import { generateApiKey, hashApiKey } from '@babylon/api';
import { agentRegistry } from '@babylon/agents';
import type { ExternalAgentConnectionParams } from '@babylon/agents';

// Validation schema for external agent registration
const ExternalAgentRegisterSchema = z.object({
  externalId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string(),
  endpoint: z.string().url(),
  protocol: z.enum(['a2a', 'mcp', 'agent0', 'custom']),
  capabilities: z.object({
    strategies: z.array(z.string()).optional().default([]),
    markets: z.array(z.string()).optional().default([]),
    actions: z.array(z.string()).optional().default([]),
    version: z.string().optional().default('1.0.0'),
    skills: z.array(z.string()).optional().default([]),
    domains: z.array(z.string()).optional().default([]),
    x402Support: z.boolean().optional(),
    platform: z.string().optional(),
  }),
  authentication: z
    .object({
      type: z.enum(['API_KEY', 'OAUTH', 'JWT', 'MUTUAL_TLS']),
      credentials: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  agentCard: z
    .object({
      version: z.literal('1.0'),
      agentId: z.string(),
      name: z.string(),
      description: z.string(),
      endpoints: z.object({
        a2a: z.string().optional(),
        mcp: z.string().optional(),
        rpc: z.string().optional(),
      }),
      capabilities: z.object({
        strategies: z.array(z.string()).optional().default([]),
        markets: z.array(z.string()).optional().default([]),
        actions: z.array(z.string()).optional().default([]),
        version: z.string().optional().default('1.0.0'),
        skills: z.array(z.string()).optional().default([]),
        domains: z.array(z.string()).optional().default([]),
        x402Support: z.boolean().optional(),
        platform: z.string().optional(),
      }),
      authentication: z
        .object({
          required: z.boolean(),
          methods: z.array(z.enum(['apiKey', 'oauth', 'wallet'])),
        })
        .optional(),
      limits: z
        .object({
          rateLimit: z.number().optional(),
          costPerAction: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  // Authenticate the request (requires valid Privy session)
  const authUser = await authenticate(req);

  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = ExternalAgentRegisterSchema.parse(body);

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for duplicate registration
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Agent already registered',
            message: error.message,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Registration failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
