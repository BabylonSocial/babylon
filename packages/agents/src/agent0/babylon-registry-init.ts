/**
 * Babylon Game Registration
 *
 * @description Registers Babylon as a discoverable entity in ERC-8004 + Agent0
 * registry. Called on server startup to ensure Babylon is discoverable by agents.
 * Publishes game metadata, capabilities, and endpoints for agent discovery.
 */

import { db } from '@babylon/db/runtime';

import { getA2AEndpoint, getMCPEndpoint } from '@babylon/shared';
import { SDK } from 'agent0-sdk';
import { logger } from '../shared/logger';
import { generateSnowflakeId } from '../shared/snowflake';
import type { JsonValue } from '../types/common';

/**
 * Babylon registration result
 *
 * @description Contains registration information after successfully registering
 * Babylon in the Agent0 registry.
 */
export interface BabylonRegistrationResult {
  tokenId: number;
  metadataCID: string;
  registeredAt: string;
}

/**
 * Register Babylon game in ERC-8004 + Agent0 registry
 *
 * @description Registers Babylon as a discoverable game platform in the Agent0
 * registry on Ethereum Sepolia. Publishes game metadata, capabilities, MCP/A2A
 * endpoints, and tool definitions. Skips registration if already registered or
 * if Agent0 integration is disabled.
 *
 * @returns {Promise<BabylonRegistrationResult | null>} Registration result or null if skipped
 *
 * @example
 * ```typescript
 * const result = await registerBabylonGame();
 * if (result) {
 *   console.log(`Registered with token ID: ${result.tokenId}`);
 * }
 * ```
 */
export async function registerBabylonGame(): Promise<BabylonRegistrationResult | null> {
  if (process.env.BABYLON_REGISTRY_REGISTERED === 'true') {
    logger.info(
      'Babylon already registered, skipping registration...',
      undefined,
      'BabylonRegistry'
    );

    const config = await db.gameConfig.findUnique({
      where: { key: 'agent0_registration' },
    });

    if (config?.value) {
      const value = config.value as Record<string, JsonValue>;
      return {
        tokenId: Number(value.tokenId),
        metadataCID: String(value.metadataCID || ''),
        registeredAt: String(value.registeredAt || new Date().toISOString()),
      };
    }

    return null;
  }

  if (process.env.AGENT0_ENABLED !== 'true') {
    logger.info(
      'Agent0 integration disabled, skipping Babylon registration',
      undefined,
      'BabylonRegistry'
    );
    return null;
  }

  const gameWalletAddress = process.env.BABYLON_GAME_WALLET_ADDRESS;
  const gamePrivateKey = process.env.BABYLON_GAME_PRIVATE_KEY;

  if (!gameWalletAddress || !gamePrivateKey) {
    logger.warn(
      'BABYLON_GAME_WALLET_ADDRESS or BABYLON_GAME_PRIVATE_KEY not configured, skipping registration',
      undefined,
      'BabylonRegistry'
    );
    return null;
  }

  // 2. Register with Agent0 SDK directly on Ethereum mainnet
  logger.info(
    'Registering Babylon with Agent0 SDK on Ethereum mainnet...',
    undefined,
    'BabylonRegistry'
  );
  logger.info(
    'Game operates on Base network with cross-chain discovery via Agent0',
    undefined,
    'BabylonRegistry'
  );

  // Initialize SDK with Ethereum mainnet configuration
  const chainId = process.env.AGENT0_NETWORK === 'sepolia' ? 11155111 : 1; // Sepolia or Mainnet
  const sdk = new SDK({
    chainId,
    rpcUrl: process.env.AGENT0_RPC_URL || 'https://eth.llamarpc.com',
    signer: gamePrivateKey,
    subgraphUrl: process.env.AGENT0_SUBGRAPH_URL,
    ipfs: (process.env.AGENT0_IPFS_PROVIDER as 'pinata' | 'node') || 'pinata',
    pinataJwt: process.env.PINATA_JWT,
    // Configurable contract addresses (defaults to Agent0 canonical)
    registryOverrides: {
      [chainId]: {
        identityRegistry:
          process.env.AGENT0_IDENTITY_REGISTRY ||
          '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        reputationRegistry:
          process.env.AGENT0_REPUTATION_REGISTRY ||
          '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
      },
    },
  });

  // Create agent with basic info
  const babylonAgent = sdk.createAgent(
    'Babylon Prediction Markets',
    'Real-time prediction market game with autonomous AI agents',
    process.env.BABYLON_LOGO_URL || undefined
  );

  // Set capabilities (wallet will be set after registration via setWallet() if needed)
  babylonAgent.setX402Support(true); // Babylon supports ERC-402 micropayments
  babylonAgent.setActive(true);

  // Add skills (A2A capabilities)
  const skills = [
    'query_markets',
    'get_market_data',
    'place_bet',
    'buy_prediction',
    'sell_prediction',
    'close_position',
    'get_balance',
    'get_positions',
    'open_perp_position',
    'close_perp_position',
    'create_post',
    'reply_post',
    'like_post',
    'share_post',
    'comment_post',
    'follow_user',
    'unfollow_user',
    'get_followers',
    'get_following',
    'search_users',
    'get_user_profile',
    'query_feed',
    'join_chat',
    'get_referral_code',
    'get_referrals',
  ];
  for (const skill of skills) {
    babylonAgent.addSkill(skill, false);
  }

  // Set MCP and A2A endpoints
  await babylonAgent.setMCP(getMCPEndpoint());
  await babylonAgent.setA2A(getA2AEndpoint());

  // Register on-chain and publish to IPFS
  const registrationHandle = await babylonAgent.registerIPFS();
  const { result: registrationResult } = await registrationHandle.waitMined();

  logger.info(
    '✅ Babylon registered on Agent0 (Ethereum mainnet)',
    undefined,
    'BabylonRegistry'
  );
  logger.info(
    '   Discovery: External agents can find Babylon via Agent0 network',
    undefined,
    'BabylonRegistry'
  );
  logger.info(
    `   Game Network: Base ${process.env.BASE_CHAIN_ID || '8453'} (game contracts only, Agent0 on Ethereum)`,
    undefined,
    'BabylonRegistry'
  );
  logger.info(
    `   Agent0 Registry: Ethereum mainnet`,
    undefined,
    'BabylonRegistry'
  );

  const metadataCID = registrationResult.agentURI || '';
  const agentId = registrationResult.agentId || '';
  const tokenId = agentId
    ? Number.parseInt(agentId.split(':')[1] || '0', 10)
    : 0;

  logger.info(
    '✅ Babylon registered in Agent0 registry!',
    undefined,
    'BabylonRegistry'
  );
  logger.info(`   Agent ID: ${agentId}`, undefined, 'BabylonRegistry');
  logger.info(`   Token ID: ${tokenId}`, undefined, 'BabylonRegistry');
  logger.info(`   Metadata CID: ${metadataCID}`, undefined, 'BabylonRegistry');

  await db.gameConfig.upsert({
    where: { key: 'agent0_registration' },
    create: {
      id: await generateSnowflakeId(),
      key: 'agent0_registration',
      value: {
        registered: true,
        agentId,
        tokenId,
        metadataCID,
        registeredAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    },
    update: {
      value: {
        registered: true,
        agentId,
        tokenId,
        metadataCID,
        registeredAt: new Date().toISOString(),
      },
    },
  });

  return {
    tokenId,
    metadataCID,
    registeredAt: new Date().toISOString(),
  };
}
