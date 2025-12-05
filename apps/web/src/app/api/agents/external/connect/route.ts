/**
 * External Agent Connection Verification Endpoint
 *
 * POST /api/agents/external/connect
 *
 * Verifies API key and returns agent status/capabilities
 * Used by external agents to test their connection
 *
 * @see src/lib/services/agent-registry.service.ts
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@babylon/db';
import { verifyApiKey } from '@babylon/api';

// Validation schema for connection request
const ConnectSchema = z.object({
  externalId: z.string().min(1),
  apiKey: z.string().regex(/^bab_(live|test)_[a-f0-9]{64}$/),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { externalId, apiKey } = ConnectSchema.parse(body);

    // Find the external agent connection
    const connection = await db.externalAgentConnection.findUnique({
      where: { externalId },
      include: {
        agentRegistry: {
          include: {
            capabilities: true,
          },
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agent not found',
          message: 'External agent not registered',
        },
        { status: 404 }
      );
    }

    // Verify API key
    let storedHash: string | undefined;
    if (connection.authType === 'apiKey' && connection.authCredentials) {
      try {
        const credentials = JSON.parse(connection.authCredentials);
        storedHash = credentials.apiKeyHash;
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication malformed',
            message: 'Failed to parse authentication credentials',
          },
          { status: 500 }
        );
      }
    }

    if (!storedHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication not configured',
          message: 'No API key configured for this agent',
        },
        { status: 500 }
      );
    }

    if (!verifyApiKey(apiKey, storedHash)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid API key',
          message: 'API key verification failed',
        },
        { status: 401 }
      );
    }

    // Update last connected timestamp
    await db.externalAgentConnection.update({
      where: { externalId },
      data: {
        lastConnected: new Date(),
      },
    });

    type ConnectionWithRegistry = typeof connection & {
      agentRegistry?: {
        id: string;
        name: string | null;
        status: string;
        trustLevel: string | null;
        capabilities?: Array<{
          id: string;
          capabilityType: string;
          description: string | null;
        }>;
      } | null;
    };
    const connectionWithRegistry = connection as ConnectionWithRegistry;
    const registry = connectionWithRegistry.agentRegistry;

    // Return agent status and capabilities
    return NextResponse.json(
      {
        success: true,
        agent: {
          id: registry?.id,
          externalId: connection.externalId,
          name: registry?.name || null,
          status: registry?.status || 'unknown',
          trustLevel: registry?.trustLevel || null,
          capabilities: registry?.capabilities || [],
          endpoint: connection.endpoint,
          protocol: connection.protocol,
        },
        message: 'Connection verified successfully',
      },
      { status: 200 }
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
      return NextResponse.json(
        {
          success: false,
          error: 'Connection verification failed',
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
