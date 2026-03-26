/**
 * Agent Wallet Service
 *
 * Handles agent wallet creation and on-chain registration with zero user interaction.
 * Creates Privy embedded wallets, signs transactions server-side, handles gas fees
 * automatically, and registers agents on ERC-8004 identity registry.
 *
 * @packageDocumentation
 */

import {
  provisionAgentPrivyWallet,
  signPrivyEvmTransaction,
} from '@babylon/api';
import { eq, type JsonValue } from '@babylon/db';
import { agentLogs, db, users } from '@babylon/db/runtime';

import { v4 as uuidv4 } from 'uuid';
import { getAgent0SDK } from '../agent0/sdk-instance';
import {
  getAgentConfig,
  isAutonomousTradingEnabled,
} from '../shared/agent-config';
import { logger } from '../shared/logger';
import {
  type AgentWalletStateSnapshot,
  assessAgentWalletState,
  isAgentWalletReady,
} from './agent-wallet-state';

function parseTransactionValue(value: string): bigint | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '0' || trimmed === '0x0') {
    return undefined;
  }

  try {
    return BigInt(trimmed);
  } catch {
    return undefined;
  }
}

export class AgentWalletService {
  /**
   * Provision a Privy-backed offline-ready wallet for an agent.
   */
  async createAgentEmbeddedWallet(agentUserId: string): Promise<{
    walletAddress: string;
    privyUserId: string;
    privyWalletId: string;
  }> {
    const [agent] = await db
      .select({
        id: users.id,
        isAgent: users.isAgent,
        walletAddress: users.walletAddress,
        privyId: users.privyId,
        privyWalletId: users.privyWalletId,
        offlineWalletReady: users.offlineWalletReady,
      })
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent) {
      throw new Error('Agent user not found');
    }

    if (isAgentWalletReady(agent)) {
      logger.info(
        'Agent wallet already provisioned and ready',
        {
          agentUserId,
          walletAddress: agent.walletAddress,
          privyId: agent.privyId,
          privyWalletId: agent.privyWalletId,
        },
        'AgentWalletService'
      );

      return {
        walletAddress: agent.walletAddress!,
        privyUserId: agent.privyId!,
        privyWalletId: agent.privyWalletId!,
      };
    }

    const assessment = assessAgentWalletState(
      agent as AgentWalletStateSnapshot
    );
    if (
      assessment.classification !== 'empty' &&
      assessment.classification !== 'recover_with_existing_privy_user' &&
      assessment.classification !== 'offline_signer_missing'
    ) {
      throw new Error(
        `Agent ${agentUserId} wallet state is inconsistent (${assessment.classification}); manual remediation required`
      );
    }
    const existingPrivyId =
      assessment.remediationAction === 'provision_with_existing_privy_user'
        ? agent.privyId
        : null;

    logger.info(
      'Provisioning offline-ready Privy wallet for agent',
      {
        agentUserId,
        existingPrivyId,
        classification: assessment.classification,
      },
      'AgentWalletService'
    );

    const provisionedWallet = await provisionAgentPrivyWallet({
      agentUserId,
      existingPrivyId,
    });

    await db
      .update(users)
      .set({
        walletAddress: provisionedWallet.walletAddress,
        privyId: provisionedWallet.privyId,
        privyWalletId: provisionedWallet.privyWalletId,
        offlineWalletReady: true,
        offlineWalletReadyAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, agentUserId));

    await db.insert(agentLogs).values({
      id: uuidv4(),
      agentUserId,
      type: 'system',
      level: 'info',
      message: `Agent wallet provisioned: ${provisionedWallet.walletAddress}`,
      metadata: {
        privyUserId: provisionedWallet.privyId,
        privyWalletId: provisionedWallet.privyWalletId,
        walletAddress: provisionedWallet.walletAddress,
        createdPrivyUser: provisionedWallet.createdPrivyUser,
        createdWallet: provisionedWallet.createdWallet,
        updatedSigner: provisionedWallet.updatedSigner,
      },
    });

    logger.info(
      'Agent wallet provisioned successfully',
      {
        agentUserId,
        privyId: provisionedWallet.privyId,
        privyWalletId: provisionedWallet.privyWalletId,
        walletAddress: provisionedWallet.walletAddress,
        createdPrivyUser: provisionedWallet.createdPrivyUser,
        createdWallet: provisionedWallet.createdWallet,
        updatedSigner: provisionedWallet.updatedSigner,
      },
      'AgentWalletService'
    );

    return {
      walletAddress: provisionedWallet.walletAddress,
      privyUserId: provisionedWallet.privyId,
      privyWalletId: provisionedWallet.privyWalletId,
    };
  }

  /**
   * Register agent on ERC-8004 identity registry (server-side signing, gas handled)
   */
  async registerAgentOnChain(agentUserId: string): Promise<{
    tokenId: number;
    txHash?: string;
    metadataCID?: string;
  }> {
    logger.info(
      `Registering agent ${agentUserId} on-chain`,
      undefined,
      'AgentWalletService'
    );

    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent) {
      throw new Error('Agent user not found');
    }

    if (!isAgentWalletReady(agent)) {
      throw new Error('Agent wallet is not ready for on-chain registration');
    }

    // Get agent config for capabilities
    const config = await getAgentConfig(agentUserId);

    // Step 1: Get SDK instance
    const sdk = getAgent0SDK();

    // Step 2: Use individual agent's A2A endpoint, not the game's endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const individualAgentA2AEndpoint = `${baseUrl}/api/agents/${agentUserId}/a2a`;

    // Step 3: Create agent using SDK
    const agentInstance = sdk.createAgent(
      agent.displayName || agent.username || 'Agent',
      agent.bio || 'Autonomous AI agent in Babylon',
      agent.profileImageUrl || undefined
    );

    // Set agent configuration (wallet will be set after registration via setWallet() if needed)
    await agentInstance.setA2A(individualAgentA2AEndpoint);
    agentInstance.setX402Support(true);
    agentInstance.setActive(true);

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
      agentInstance.addSkill(skill, false);
    }

    // Set metadata for additional capabilities
    agentInstance.setMetadata({
      platform: 'babylon',
      userType: 'agent',
      moderationEscrowSupport: true,
      autonomousTrading: isAutonomousTradingEnabled(config),
      autonomousPosting: config?.autonomousPosting ?? false,
    });

    // Register on-chain and publish to IPFS
    const registrationHandle = await agentInstance.registerIPFS();
    const { result: registration } = await registrationHandle.waitMined();

    // Extract tokenId from agentId (format: "chainId:tokenId")
    const agentId = registration.agentId || '';
    const tokenId = agentId
      ? Number.parseInt(agentId.split(':')[1] || '0', 10)
      : 0;
    const metadataCID = registration.agentURI || '';

    // Step 4: Update agent with on-chain data
    await db
      .update(users)
      .set({
        agent0TokenId: tokenId,
        agent0MetadataCID: metadataCID || null,
        registrationTxHash: null, // RegistrationFile doesn't have txHash
        onChainRegistered: true,
      })
      .where(eq(users.id, agentUserId));

    // Step 5: Log registration
    await db.insert(agentLogs).values({
      id: uuidv4(),
      agentUserId,
      type: 'system',
      level: 'info',
      message: `Agent registered on-chain: Agent ID ${agentId}`,
      metadata: {
        agentId,
        tokenId,
        metadataCID,
      } as JsonValue,
    });

    logger.info(
      `Agent ${agentUserId} registered on-chain: Agent ID ${agentId}`,
      undefined,
      'AgentWalletService'
    );

    return {
      tokenId,
      txHash: undefined,
      metadataCID,
    };
  }

  /**
   * Complete setup: Create wallet + register on-chain (fully automated)
   * Wallet creation is required, on-chain registration is optional.
   */
  async setupAgentIdentity(agentUserId: string): Promise<{
    walletAddress: string;
    tokenId?: number;
    onChainRegistered: boolean;
  }> {
    logger.info(
      `Setting up complete identity for agent ${agentUserId}`,
      undefined,
      'AgentWalletService'
    );

    // Step 1: Create Privy embedded wallet (server-side, no user interaction)
    const wallet = await this.createAgentEmbeddedWallet(agentUserId);

    // Step 2: Register on-chain (server signs and pays gas)
    const registration = await this.registerAgentOnChain(agentUserId);

    return {
      walletAddress: wallet.walletAddress,
      tokenId: registration.tokenId,
      onChainRegistered: true,
    };
  }

  /**
   * Sign transaction for agent (server-side, no user interaction)
   */
  async signTransaction(
    agentUserId: string,
    transactionData: {
      to: string;
      value: string;
      data: string;
    }
  ): Promise<string> {
    const [agent] = await db
      .select({
        id: users.id,
        isAgent: users.isAgent,
        privyId: users.privyId,
        privyWalletId: users.privyWalletId,
        walletAddress: users.walletAddress,
        offlineWalletReady: users.offlineWalletReady,
      })
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent) {
      throw new Error('Agent not found');
    }

    if (!isAgentWalletReady(agent)) {
      throw new Error('Agent wallet is not offline-ready');
    }

    const signedTransaction = await signPrivyEvmTransaction({
      walletId: agent.privyWalletId!,
      to: transactionData.to as `0x${string}`,
      data: transactionData.data as `0x${string}`,
      valueWei: parseTransactionValue(transactionData.value),
    });

    logger.info(
      `Transaction signed for agent ${agentUserId}`,
      undefined,
      'AgentWalletService'
    );

    return signedTransaction;
  }

  /**
   * Verify agent has valid on-chain identity
   * Returns false on failure instead of throwing.
   */
  async verifyOnChainIdentity(agentUserId: string): Promise<boolean> {
    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent || !agent.agent0TokenId) {
      return false;
    }

    // Verify with Agent0 network
    const agentId = `1:${agent.agent0TokenId}`; // Ethereum mainnet
    const agentSummary = await getAgent0SDK().getAgent(agentId);

    return agentSummary !== null;
  }
}

export const agentWalletService = new AgentWalletService();
