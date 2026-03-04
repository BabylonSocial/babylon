/**
 * Per-Agent Agent Card Endpoint
 *
 * @route GET /api/agents/[agentId]/.well-known/agent-card - Get agent card
 * @access Public
 *
 * @description
 * Returns the A2A agent card for a specific agent. This follows the
 * A2A protocol specification for agent discovery via well-known URIs.
 * The agent card describes the agent's capabilities, skills, and how
 * to interact with it via the A2A protocol.
 *
 * @example
 * ```typescript
 * const card = await fetch(`/api/agents/${agentId}/.well-known/agent-card`)
 *   .then(r => r.json());
 * ```
 */

import { generateAgentCardSync } from '@babylon/a2a';
import { getAgentConfig } from '@babylon/agents';
import { db } from '@babylon/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type AgentCard = ReturnType<typeof generateAgentCardSync>;

type Agent0Extensions = {
  onChain?: {
    registered: boolean;
    tokenId: string;
    metadataCID: string | null;
    registeredAt?: string;
    chainId: number;
    agentId: string;
  };
  reputation?: {
    trustScore: number | null;
    feedbackCount: number | null;
    verifiedIdentity: boolean;
  };
  discovery?: {
    discoverable: boolean;
    searchable: boolean;
    publicProfile: boolean;
  };
};

type ExtendedAgentCard = AgentCard & Agent0Extensions;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  const agent = await db.user.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      displayName: true,
      bio: true,
      profileImageUrl: true,
      isAgent: true,
      // Agent0 fields for on-chain identity and reputation
      agent0TokenId: true,
      agent0MetadataCID: true,
      onChainRegistered: true,
      agent0RegisteredAt: true,
      agent0TrustScore: true,
      agent0FeedbackCount: true,
    },
  });

  if (!agent || !agent.isAgent) {
    return NextResponse.json(
      {
        error: 'Agent not found',
      },
      { status: 404 }
    );
  }

  // Get agent config for agent-specific fields
  const agentConfig = await getAgentConfig(agentId);

  const agentCard = generateAgentCardSync({
    id: agent.id,
    displayName: agent.displayName,
    bio: agent.bio,
    profileImageUrl: agent.profileImageUrl,
    systemPrompt: agentConfig?.systemPrompt,
    personality: agentConfig?.personality,
    tradingStrategy: agentConfig?.tradingStrategy,
  });

  let responseCard: ExtendedAgentCard = agentCard;

  // Add Agent0 metadata if agent is registered on-chain
  if (agent.onChainRegistered && agent.agent0TokenId) {
    const tokenId = String(agent.agent0TokenId);

    responseCard = {
      ...agentCard,
      onChain: {
        registered: true,
        tokenId,
        metadataCID: agent.agent0MetadataCID,
        registeredAt: agent.agent0RegisteredAt?.toISOString(),
        chainId: 1, // Ethereum mainnet
        agentId: `1:${tokenId}`,
      },
      reputation: {
        trustScore: agent.agent0TrustScore,
        feedbackCount: agent.agent0FeedbackCount,
        verifiedIdentity: true,
      },
      discovery: {
        discoverable: true,
        searchable: true,
        publicProfile: true,
      },
    };
  }

  return NextResponse.json(responseCard, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
