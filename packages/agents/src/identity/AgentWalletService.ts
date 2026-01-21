/**
 * Agent Wallet Service
 *
 * Handles agent wallet creation and on-chain registration with zero user interaction.
 * Creates Privy embedded wallets, signs transactions server-side, handles gas fees
 * automatically, and registers agents on ERC-8004 identity registry.
 *
 * @packageDocumentation
 */

import { agentLogs, db, eq, type JsonValue, users } from '@babylon/db';
import { PrivyClient } from '@privy-io/server-auth';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getAgent0Client } from '../agent0/Agent0Client';
import {
  getAgentConfig,
  isAutonomousTradingEnabled,
} from '../shared/agent-config';
import { logger } from '../shared/logger';

/**
 * Privy wallet structure
 * @internal
 */
interface PrivyWallet {
  address: string;
  id: string;
}

/**
 * Privy user structure
 * @internal
 */
interface PrivyUser {
  id: string;
  wallet?: PrivyWallet;
}

/**
 * Privy create user parameters
 * @internal
 */
interface PrivyCreateUserParams {
  create_embedded_wallet: boolean;
  linked_accounts: Array<Record<string, unknown>>;
}

/**
 * Privy sign transaction parameters
 * @internal
 */
interface PrivySignTransactionParams {
  wallet_id: string;
  transaction: {
    to: string;
    value: string;
    data: string;
  };
}

/**
 * Privy signed transaction response
 * @internal
 */
interface PrivySignedTransaction {
  signed_transaction: string;
}

/**
 * Extended Privy client with additional methods
 * @internal
 */
interface ExtendedPrivyClient extends PrivyClient {
  createUser(params: PrivyCreateUserParams): Promise<PrivyUser>;
  signTransaction(
    params: PrivySignTransactionParams
  ): Promise<PrivySignedTransaction>;
}

// Initialize Privy server client
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
) as ExtendedPrivyClient;

export class AgentWalletService {
  /**
   * Create embedded wallet for agent via Privy (server-side, no user interaction)
   * Falls back to dev wallet in development if Privy is not configured.
   */
  async createAgentEmbeddedWallet(agentUserId: string): Promise<{
    walletAddress: string;
    privyUserId: string;
    privyWalletId: string;
  }> {
    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent) {
      throw new Error('Agent user not found');
    }

    // Check if agent already has a wallet address
    if (agent.walletAddress) {
      logger.info(
        'Agent already has wallet address, skipping creation',
        {
          agentUserId,
          walletAddress: agent.walletAddress,
        },
        'AgentWalletService'
      );

      return {
        walletAddress: agent.walletAddress,
        privyUserId: agent.privyId || `dev_${agentUserId}`,
        privyWalletId: `dev_wallet_${agentUserId}`,
      };
    }

    // Check if Privy is configured and if createUser method exists
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const privyAppSecret = process.env.PRIVY_APP_SECRET;
    const hasPrivyConfig = !!(privyAppId && privyAppSecret);

    // Check if createUser method exists (it may not in newer Privy SDK versions)
    // PrivyClient may have createUser method that's not in the type definition
    interface PrivyClientWithCreateUser {
      createUser?: (params: PrivyCreateUserParams) => Promise<PrivyUser>;
    }
    const privyWithCreateUser = privy as PrivyClientWithCreateUser;
    const hasCreateUserMethod =
      typeof privyWithCreateUser.createUser === 'function';

    // If Privy is not available, skip directly to dev wallet (no error)
    if (!hasPrivyConfig || !hasCreateUserMethod) {
      logger.info(
        'Privy not available, using development wallet',
        {
          agentUserId,
          hasPrivyConfig,
          hasCreateUserMethod,
        },
        'AgentWalletService'
      );

      // Create dev wallet directly
      const devWallet = ethers.Wallet.createRandom();
      const walletAddress = devWallet.address;
      const privyUserId = `dev_${agentUserId}`;
      const privyWalletId = `dev_wallet_${agentUserId}`;

      await db
        .update(users)
        .set({
          walletAddress,
          privyId: privyUserId,
        })
        .where(eq(users.id, agentUserId));

      return { walletAddress, privyUserId, privyWalletId };
    }

    // Try Privy wallet creation
    logger.info(
      `Creating Privy embedded wallet for agent ${agentUserId}`,
      undefined,
      'AgentWalletService'
    );

    // Step 1: Create Privy user for the agent (server-side)
    // Privy allows server-side user creation without user interaction
    if (!privyWithCreateUser.createUser) {
      throw new Error('Privy createUser method not available');
    }
    const privyUser = await privyWithCreateUser.createUser({
      create_embedded_wallet: true,
      linked_accounts: [],
    });

    if (!privyUser.wallet) {
      throw new Error('Failed to create embedded wallet');
    }

    const walletAddress = privyUser.wallet.address;
    const privyUserId = privyUser.id;
    const privyWalletId = privyUser.wallet.id;

    // Step 2: Update agent user with wallet info
    await db
      .update(users)
      .set({
        walletAddress,
        privyId: privyUserId,
      })
      .where(eq(users.id, agentUserId));

    // Step 3: Log wallet creation
    await db.insert(agentLogs).values({
      id: uuidv4(),
      agentUserId,
      type: 'system',
      level: 'info',
      message: `Privy embedded wallet created: ${walletAddress}`,
      metadata: {
        privyUserId,
        privyWalletId,
        walletAddress,
      },
    });

    logger.info(
      `Privy wallet created for agent ${agentUserId}: ${walletAddress}`,
      undefined,
      'AgentWalletService'
    );

    return { walletAddress, privyUserId, privyWalletId };
  }

  /**
   * Register agent on ERC-8004 identity registry (server-side signing, gas handled)
   */
  async registerAgentOnChain(agentUserId: string): Promise<{
    tokenId: number;
    txHash: string;
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

    if (!agent.walletAddress) {
      throw new Error('Agent must have wallet before on-chain registration');
    }

    // Get agent config for capabilities
    const config = await getAgentConfig(agentUserId);

    // Step 1: Prepare agent metadata
    const capabilities = {
      strategies: config?.tradingStrategy
        ? ['autonomous-trading', 'prediction-markets', 'social-interaction']
        : ['chat', 'analysis'],
      markets: ['prediction', 'perp', 'crypto'],
      actions: [
        'trade',
        'analyze',
        'chat',
        'post',
        'comment',
        'moderation-escrow',
        'appeal-ban',
      ],
      version: '1.0.0',
      platform: 'babylon',
      userType: 'agent',
      x402Support: true,
      moderationEscrowSupport: true,
      autonomousTrading: isAutonomousTradingEnabled(config),
      autonomousPosting: config?.autonomousPosting ?? false,
      skills: [],
      domains: [],
    };

    // Step 2: Register via Agent0Client (handles signing and gas server-side)
    const agent0Client = getAgent0Client();

    // Use individual agent's A2A endpoint, not the game's endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const individualAgentA2AEndpoint = `${baseUrl}/api/agents/${agentUserId}/a2a`;

    const registration = await agent0Client.registerAgent({
      name: agent.displayName || agent.username || 'Agent',
      description: agent.bio || 'Autonomous AI agent in Babylon',
      imageUrl: agent.profileImageUrl || undefined,
      walletAddress: agent.walletAddress,
      a2aEndpoint: individualAgentA2AEndpoint,
      capabilities,
    });

    // Step 3: Update agent with on-chain data
    await db
      .update(users)
      .set({
        agent0TokenId: registration.tokenId,
        agent0MetadataCID: registration.metadataCID ?? null,
        registrationTxHash: registration.txHash,
        onChainRegistered: true,
      })
      .where(eq(users.id, agentUserId));

    // Step 4: Log registration
    await db.insert(agentLogs).values({
      id: uuidv4(),
      agentUserId,
      type: 'system',
      level: 'info',
      message: `Agent registered on-chain: Token ID ${registration.tokenId}`,
      metadata: {
        tokenId: registration.tokenId,
        txHash: registration.txHash,
        metadataCID: registration.metadataCID,
      } as JsonValue,
    });

    logger.info(
      `Agent ${agentUserId} registered on-chain: Token ID ${registration.tokenId}`,
      undefined,
      'AgentWalletService'
    );

    return {
      tokenId: registration.tokenId,
      txHash: registration.txHash,
      metadataCID: registration.metadataCID,
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
      })
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent || !agent.isAgent) {
      throw new Error('Agent not found');
    }

    if (!agent.privyId) {
      throw new Error('Agent does not have Privy wallet');
    }

    // Use Privy server client to sign transaction (no user interaction needed)
    // Privy handles the private key management and signing server-side
    const signedTx = await privy.signTransaction({
      wallet_id: agent.privyId,
      transaction: transactionData,
    });

    logger.info(
      `Transaction signed for agent ${agentUserId}`,
      undefined,
      'AgentWalletService'
    );

    return signedTx.signed_transaction;
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
    const agent0Client = getAgent0Client();
    const profile = await agent0Client.getAgentProfile(agent.agent0TokenId);

    return profile !== null;
  }
}

export const agentWalletService = new AgentWalletService();
