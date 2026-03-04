/**
 * Agent On-Chain Registration API
 *
 * @route POST /api/agents/onboard - Register agent on-chain
 * @access Authenticated
 *
 * @description
 * Registers ElizaOS agents to Agent0 network on Ethereum mainnet.
 * Uses Agent0 SDK with canonical ERC-8004 contracts for identity and reputation.
 * Agents are registered with IPFS metadata and discoverable globally.
 *
 * @example
 * ```typescript
 * await fetch('/api/agents/onboard', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     agentId: 'agent-id',
 *     name: 'My Agent',
 *     endpoint: 'https://...'
 *   })
 * });
 * ```
 */

import type { AgentCapabilities } from '@babylon/agents';
import { getAgent0SDK, syncAfterAgent0Registration } from '@babylon/agents';
import {
  AuthorizationError,
  authenticate,
  InternalServerError,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { asUser } from '@babylon/db';
import {
  AgentOnboardSchema,
  generateSnowflakeId,
  logger,
} from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * POST /api/agents/onboard
 * Register an agent to the on-chain identity system
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate agent FIRST
  const user = await authenticate(request);
  if (!user.isAgent || !user.userId) {
    throw new AuthorizationError(
      'Only agents can use this endpoint',
      'agent',
      'onboard'
    );
  }

  const agentId = user.userId;

  // Parse and validate request body
  const body = await request.json();
  const { agentName, endpoint } = AgentOnboardSchema.parse(body);

  // Check if agent exists in database (use upsert to avoid race conditions) with RLS
  // Note: Agents are registered via Agent0 SDK on Ethereum mainnet
  const dbUser = await asUser(user, async (db) => {
    await db.user.upsert({
      where: {
        username: agentId, // Use username as unique identifier for agents
      },
      update: {
        // Update fields if user exists but data changed
        displayName: agentName || agentId,
        bio: `Autonomous AI agent: ${agentId}`,
      },
      create: {
        id: await generateSnowflakeId(),
        privyId: agentId,
        username: agentId,
        displayName: agentName || agentId,
        virtualBalance: '10000', // Start with 10k points
        totalDeposited: '10000',
        bio: `Autonomous AI agent: ${agentId}`,
        updatedAt: new Date(),
      },
    });

    // Fetch the user with selected fields
    const userWithFields = await db.user.findUnique({
      where: { privyId: agentId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        walletAddress: true,
        onChainRegistered: true,
        nftTokenId: true,
        registrationTxHash: true,
      },
    });

    if (!userWithFields) {
      throw new Error('Failed to create or find user');
    }

    return userWithFields;
  });

  // Register with Agent0 SDK and publish to IPFS (if enabled)
  let agent0MetadataCID: string | null = null;
  let agent0TokenId = 0;
  let agent0AgentId = '';

  if (process.env.AGENT0_ENABLED === 'true') {
    logger.info(
      'Registering agent with Agent0 SDK...',
      { agentId },
      'AgentOnboard'
    );

    // Get agent wallet address from database or use game wallet as fallback
    const agentWalletAddress =
      dbUser.walletAddress || process.env.BABYLON_GAME_WALLET_ADDRESS || '';

    if (!agentWalletAddress) {
      throw new InternalServerError('Agent wallet address not configured');
    }

    // Validate wallet address format (Ethereum address: 0x + 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(agentWalletAddress)) {
      throw new InternalServerError(
        `Invalid wallet address format: ${agentWalletAddress}. Expected Ethereum address (0x + 40 hex characters).`
      );
    }

    // Define base URL for endpoint construction
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create agent metadata (Agent0 SDK will publish to IPFS)
    const agentMetadata = {
      name: agentName,
      description: dbUser.bio || `Autonomous AI agent: ${agentId}`,
      version: '1.0.0',
      type: 'agent',
      endpoints: {
        a2a: endpoint || `${baseUrl}/api/agents/${dbUser.id}/a2a`,
        mcp: `${baseUrl}/api/mcp`, // MCP protocol endpoint for tool execution
        api: `${baseUrl}/api/agents/${dbUser.id}`,
      },
      capabilities: {
        strategies: [
          'momentum',
          'sentiment',
          'volume',
          'arbitrage',
          'market_making',
        ], // AI strategies
        markets: ['prediction', 'perpetuals', 'pools'],
        actions: [
          // AI Analysis
          'analyze',
          'predict',
          'backtest',
          'optimize',
          // Trading
          'trade',
          'buy_prediction',
          'sell_prediction',
          'open_perp_position',
          'close_perp_position',
          'get_positions',
          'get_balance',
          // Liquidity Provision
          'deposit_pool',
          'withdraw_pool',
          'manage_liquidity',
          'get_pools',
          'get_pool_deposits',
          // Social & Coordination
          'post',
          'reply',
          'share',
          'comment',
          'follow',
          'coordinate',
          'form_coalition',
          'share_analysis',
          'chat',
          // Discovery
          'discover_agents',
          'search_users',
          'get_profile',
          'query_feed',
          // Referrals
          'get_referral_code',
          'get_referrals',
        ],
        version: '1.0.0',
      } as AgentCapabilities,
    };

    // Register with Agent0 SDK (handles IPFS publishing internally)
    const sdk = getAgent0SDK();

    // Create agent using SDK
    const agent = sdk.createAgent(
      agentName,
      dbUser.bio || `Autonomous AI agent: ${agentId}`,
      undefined // No profile image for now
    );

    // Set agent configuration
    // Note: Wallet is set after registration via setWallet() if needed
    await agent.setA2A(agentMetadata.endpoints.a2a);
    agent.setX402Support(true);
    agent.setActive(true);

    // Add skills based on capabilities
    const skills = [
      'trade',
      'analyze',
      'chat',
      'post',
      'comment',
      'prediction-markets',
      'social-interaction',
    ];

    for (const skill of skills) {
      agent.addSkill(skill, false);
    }

    // Set metadata for additional capabilities
    agent.setMetadata({
      platform: 'babylon',
      userType: 'agent',
      capabilities: agentMetadata.capabilities,
    });

    // Register on-chain and publish to IPFS
    const registrationHandle = await agent.registerIPFS();
    const { result: registration } = await registrationHandle.waitMined();

    // Extract tokenId from agentId (format: "chainId:tokenId")
    agent0AgentId = registration.agentId || '';
    agent0TokenId = agent0AgentId
      ? Number.parseInt(agent0AgentId.split(':')[1] || '0', 10)
      : 0;
    agent0MetadataCID = registration.agentURI || null;

    // Persist Agent0 registration data to user record
    await asUser(user, async (db) => {
      await db.user.update({
        where: { id: dbUser.id },
        data: {
          agent0TokenId: agent0TokenId,
          agent0MetadataCID: agent0MetadataCID,
          onChainRegistered: true,
        },
      });
    });

    logger.info(
      '✅ Agent registered with Agent0 SDK',
      {
        agentId,
        tokenId: agent0TokenId,
        metadataCID: agent0MetadataCID,
      },
      'AgentOnboard'
    );

    await syncAfterAgent0Registration(dbUser.id, agent0TokenId);
    logger.info(
      'Agent0 reputation synced successfully',
      {
        userId: dbUser.id,
        agent0TokenId,
      },
      'AgentOnboard'
    );
  } else {
    logger.info(
      'Agent0 integration disabled, skipping agent registration',
      { agentId },
      'AgentOnboard'
    );
  }

  logger.info(
    'Agent onboarded successfully',
    {
      agentId,
      agent0TokenId,
      agent0AgentId,
      agent0MetadataCID,
    },
    'POST /api/agents/onboard'
  );

  return successResponse({
    message: 'Successfully registered agent on Agent0 network',
    agentId,
    agent0TokenId,
    agent0AgentId,
    agent0MetadataCID,
    registered: true,
  });
});

/**
 * GET /api/agents/onboard
 * Check agent registration status
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);
  if (!user.isAgent || !user.userId) {
    throw new AuthorizationError(
      'Only agents can use this endpoint',
      'agent',
      'check-status'
    );
  }

  const agentId = user.userId;

  const dbUser = await asUser(user, async (db) => {
    return await db.user.findUniqueOrThrow({
      where: { username: agentId },
      select: {
        onChainRegistered: true,
        nftTokenId: true,
        agent0TokenId: true,
        agent0MetadataCID: true,
        registrationTxHash: true,
      },
    });
  });

  const isRegistered =
    dbUser.onChainRegistered || dbUser.agent0TokenId !== null;

  logger.info(
    'Agent registration status checked',
    { agentId, isRegistered },
    'GET /api/agents/onboard'
  );

  return successResponse({
    isRegistered,
    tokenId: dbUser.nftTokenId ?? dbUser.agent0TokenId,
    agent0MetadataCID: dbUser.agent0MetadataCID,
    txHash: dbUser.registrationTxHash,
    agentId,
  });
});
