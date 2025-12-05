/**
 * Babylon Game Registration
 *
 * @description Registers Babylon as a discoverable entity in ERC-8004 + Agent0
 * registry. Called on server startup to ensure Babylon is discoverable by agents.
 * Publishes game metadata, capabilities, and endpoints for agent discovery.
 */

import { getAgent0Client } from './index';
import { db } from '@babylon/db';
import { logger } from '../shared/logger';
import { generateSnowflakeId } from '../shared/snowflake';
import type { JsonValue } from '../types/common';
import { getMCPEndpoint, getA2AEndpoint } from '@babylon/shared';

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

  // 2. Register with Agent0 SDK (which handles IPFS publishing internally)
  logger.info(
    'Registering Babylon with Agent0 SDK on Ethereum Sepolia...',
    undefined,
    'BabylonRegistry'
  );
  logger.info(
    'Game operates on Base network with cross-chain discovery via agent0',
    undefined,
    'BabylonRegistry'
  );

  const agent0Client = getAgent0Client();

  // Register Babylon directly with registerAgent to provide full metadata payload
  // - Game metadata and capabilities
  // - MCP and A2A endpoint configuration
  // - Cross-chain network info (points to Base where game operates)
  let result: { tokenId: number; txHash: string; metadataCID?: string };

  try {
    result = await agent0Client.registerAgent({
      name: 'Babylon Prediction Markets',
      description: 'Real-time prediction market game with autonomous AI agents',
      walletAddress: gameWalletAddress,
      mcpEndpoint: getMCPEndpoint(),
      a2aEndpoint: getA2AEndpoint(),
      capabilities: {
        strategies: [],
        markets: ['prediction', 'perpetuals'],
        actions: [
          // Market Operations
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
          // Social Features
          'create_post',
          'reply_post',
          'like_post',
          'share_post',
          'comment_post',
          'follow_user',
          'unfollow_user',
          'get_followers',
          'get_following',
          // Discovery & Search
          'search_users',
          'get_user_profile',
          'query_feed',
          'join_chat',
          // Referrals & Rewards
          'get_referral_code',
          'get_referrals',
        ],
        version: '1.0.0',
        x402Support: true, // Babylon supports ERC-402 micropayments for premium actions
        skills: [],
        domains: [],
      },
    });

    logger.info(
      '✅ Babylon registered on agent0 (Ethereum Sepolia)',
      undefined,
      'BabylonRegistry'
    );
    logger.info(
      '   Discovery: External agents can find Babylon via agent0',
      undefined,
      'BabylonRegistry'
    );
    logger.info(
      `   Game Network: Base ${process.env.BASE_CHAIN_ID || '8453'}`,
      undefined,
      'BabylonRegistry'
    );
    logger.info(
      `   Registry: ${process.env.BASE_IDENTITY_REGISTRY_ADDRESS}`,
      undefined,
      'BabylonRegistry'
    );
  } catch (error) {
    // If Agent0 SDK is not available, registration failed
    logger.error(
      'Agent0 SDK registration failed. Check SDK installation and configuration.',
      error,
      'BabylonRegistry'
    );
    throw error;
  }

  const metadataCID = result.metadataCID || '';

  logger.info(
    '✅ Babylon registered in Agent0 registry!',
    undefined,
    'BabylonRegistry'
  );
  logger.info(`   Token ID: ${result.tokenId}`, undefined, 'BabylonRegistry');
  logger.info(`   Metadata CID: ${metadataCID}`, undefined, 'BabylonRegistry');

  await db.gameConfig.upsert({
    where: { key: 'agent0_registration' },
    create: {
      id: await generateSnowflakeId(),
      key: 'agent0_registration',
      value: {
        registered: true,
        tokenId: result.tokenId,
        metadataCID,
        txHash: result.txHash,
        registeredAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    },
    update: {
      value: {
        registered: true,
        tokenId: result.tokenId,
        metadataCID,
        txHash: result.txHash,
        registeredAt: new Date().toISOString(),
      },
    },
  });

  return {
    tokenId: result.tokenId,
    metadataCID,
    registeredAt: new Date().toISOString(),
  };
}

