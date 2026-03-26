/**
 * Agent Identity Service
 *
 * Handles agent identity management including Privy embedded wallet creation,
 * Agent0 network registration (ERC-8004), and on-chain identity verification.
 *
 * @remarks
 * Agents are Users (isAgent=true) and participate fully in the platform.
 *
 * @packageDocumentation
 */

import { eq, type JsonValue, type User } from '@babylon/db';
import { agentLogs, db, users } from '@babylon/db/runtime';
import { syncAfterAgent0Registration } from '../agent0/reputation/agent0-reputation-sync';
import { getAgent0SDK } from '../agent0/sdk-instance';
import {
  getAgentConfig,
  isAutonomousTradingEnabled,
} from '../shared/agent-config';
import { logger } from '../shared/logger';
import { generateSnowflakeId } from '../shared/snowflake';
import { agentWalletService } from './AgentWalletService';
import { isAgentWalletReady } from './agent-wallet-state';

/**
 * Service for agent identity management
 */
export class AgentIdentityService {
  /**
   * Creates embedded wallet for agent user via Privy
   *
   * Delegates to AgentWalletService for actual Privy integration.
   *
   * @param agentUserId - Agent user ID
   * @returns Wallet address and Privy wallet ID
   * @throws Error if agent user not found
   */
  async createAgentWallet(agentUserId: string): Promise<{
    walletAddress: string;
    privyWalletId: string;
  }> {
    logger.info(
      `Creating wallet for agent user ${agentUserId}`,
      undefined,
      'AgentIdentityService'
    );

    const [agentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agentUser || !agentUser.isAgent) {
      throw new Error('Agent user not found');
    }

    // Use proper Privy integration via AgentWalletService
    const result =
      await agentWalletService.createAgentEmbeddedWallet(agentUserId);

    logger.info(
      `Wallet created for agent ${agentUserId}: ${result.walletAddress}`,
      undefined,
      'AgentIdentityService'
    );
    return {
      walletAddress: result.walletAddress,
      privyWalletId: result.privyWalletId,
    };
  }

  /**
   * Register agent user on Agent0 network
   */
  async registerOnAgent0(agentUserId: string): Promise<{
    agent0TokenId: number;
    metadataCID?: string;
    txHash?: string;
  }> {
    logger.info(
      `Registering agent user ${agentUserId} on Agent0`,
      undefined,
      'AgentIdentityService'
    );

    const [agentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agentUser || !agentUser.isAgent)
      throw new Error('Agent user not found');
    if (!isAgentWalletReady(agentUser)) {
      throw new Error('Agent wallet is not ready for Agent0 registration');
    }

    // Get agent config for capabilities
    const config = await getAgentConfig(agentUserId);

    const sdk = getAgent0SDK();

    // Use individual agent's A2A endpoint, not the game's endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const individualAgentA2AEndpoint = `${baseUrl}/api/agents/${agentUserId}/a2a`;

    // Create agent using SDK
    const agent = sdk.createAgent(
      agentUser.displayName || agentUser.username || 'Agent',
      agentUser.bio || 'Autonomous AI agent in Babylon',
      agentUser.profileImageUrl || undefined
    );

    // Set agent configuration (wallet will be set after registration via setWallet() if needed)
    await agent.setA2A(individualAgentA2AEndpoint);
    agent.setX402Support(true);
    agent.setActive(true);

    // Add skills (A2A capabilities)
    const skills = [
      'trade',
      'analyze',
      'chat',
      'post',
      'comment',
      'moderation-escrow',
      'appeal-ban',
    ];

    if (config?.tradingStrategy) {
      skills.push(
        'autonomous-trading',
        'prediction-markets',
        'social-interaction'
      );
    }

    for (const skill of skills) {
      agent.addSkill(skill, false);
    }

    // Set metadata for additional capabilities
    agent.setMetadata({
      platform: 'babylon',
      userType: 'agent',
      moderationEscrowSupport: true,
      autonomousTrading: isAutonomousTradingEnabled(config),
      autonomousPosting: config?.autonomousPosting ?? false,
    });

    // Register on-chain and publish to IPFS
    const registrationHandle = await agent.registerIPFS();
    const { result: registration } = await registrationHandle.waitMined();

    // Extract tokenId from agentId (format: "chainId:tokenId")
    const agentId = registration.agentId || '';
    const tokenId = agentId
      ? Number.parseInt(agentId.split(':')[1] || '0', 10)
      : 0;
    const metadataCID = registration.agentURI || '';

    await db
      .update(users)
      .set({
        agent0TokenId: tokenId,
        agent0MetadataCID: metadataCID || null,
        registrationTxHash: null, // RegistrationFile doesn't have txHash
        onChainRegistered: true,
      })
      .where(eq(users.id, agentUserId));

    // Fire-and-forget reputation sync; log but do not block registration
    syncAfterAgent0Registration(agentUserId, tokenId).catch((error) => {
      logger.warn(
        'Agent0 reputation sync failed after registration',
        { agentUserId, tokenId, error },
        'AgentIdentityService'
      );
    });

    await db.insert(agentLogs).values({
      id: await generateSnowflakeId(),
      agentUserId,
      type: 'system',
      level: 'info',
      message: `Agent registered on Agent0: Agent ID ${agentId}`,
      metadata: {
        agentId,
        tokenId,
        metadataCID,
      } as JsonValue,
    });

    logger.info(
      `Agent ${agentUserId} registered on Agent0: Agent ID ${agentId}`,
      undefined,
      'AgentIdentityService'
    );
    return {
      agent0TokenId: tokenId,
      metadataCID,
      txHash: undefined,
    };
  }

  /**
   * Setup complete agent identity
   * Wallet creation is required, Agent0 registration is optional.
   */
  async setupAgentIdentity(
    agentUserId: string,
    options?: {
      skipAgent0Registration?: boolean;
    }
  ): Promise<User> {
    logger.info(
      `Setting up identity for agent user ${agentUserId}`,
      undefined,
      'AgentIdentityService'
    );

    await this.createAgentWallet(agentUserId);

    // Agent0 registration is optional and can be skipped
    if (!options?.skipAgent0Registration) {
      const registrationResult = await this.registerOnAgent0(agentUserId).catch(
        (error) => {
          logger.warn(
            `Agent0 registration failed for ${agentUserId}, continuing without on-chain registration`,
            { error },
            'AgentIdentityService'
          );
          return null;
        }
      );

      if (registrationResult) {
        logger.info(
          `Agent ${agentUserId} registered on Agent0`,
          { tokenId: registrationResult.agent0TokenId },
          'AgentIdentityService'
        );
      }
    }

    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent) {
      throw new Error('Agent not found after identity setup');
    }
    return agent;
  }

  /**
   * Verify agent identity on Agent0
   * Returns false on failure instead of throwing (verification is non-critical).
   */
  async verifyAgentIdentity(agentUserId: string): Promise<boolean> {
    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent || !agent.agent0TokenId) {
      logger.debug(
        `Agent ${agentUserId} not found or not registered on Agent0`,
        undefined,
        'AgentIdentityService'
      );
      return false;
    }

    // Verification is a non-critical check operation - catch errors and return false
    const agentId = `1:${agent.agent0TokenId}`; // Ethereum mainnet
    const verificationResult = await getAgent0SDK()
      .getAgent(agentId)
      .then((agentSummary) => agentSummary !== null)
      .catch((error) => {
        logger.warn(
          `Failed to verify agent identity for ${agentUserId} on Agent0`,
          { error },
          'AgentIdentityService'
        );
        return false;
      });

    if (verificationResult) {
      logger.info(
        `Agent ${agentUserId} verified on Agent0`,
        { tokenId: agent.agent0TokenId },
        'AgentIdentityService'
      );
    }

    return verificationResult;
  }
}

export const agentIdentityService = new AgentIdentityService();
