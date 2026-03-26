import { and, eq, sql } from '@babylon/db';
import { balanceTransactions, db, users } from '@babylon/db/runtime';
import {
  BusinessLogicError,
  generateSnowflakeId,
  logger,
  POINTS,
} from '@babylon/shared';
import { DistributedLockService } from './distributed-lock-service';
import { processOnchainRegistration } from './onchain-service';
import { provisionAgentPrivyWallet } from './privy/agent-wallet-provisioning';

export interface AgentEvmRegistrationStatus {
  isRegistered: boolean;
  tokenId: number | null;
  metadataCid: string | null;
  txHash: string | null;
  walletAddress: string | null;
  walletReady: boolean;
  canRegister: boolean;
  cost: number;
}

export interface AgentEvmRegistrationResult {
  message: string;
  alreadyRegistered: boolean;
  agentUserId: string;
  tokenId: number;
  txHash?: string;
  walletAddress: string;
  cost: number;
}

type AgentEvmRecord = {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  isAgent: boolean;
  managedBy: string | null;
  privyId: string | null;
  privyWalletId: string | null;
  walletAddress: string | null;
  offlineWalletReady: boolean;
  onChainRegistered: boolean;
  agent0TokenId: number | null;
  agent0MetadataCID: string | null;
  registrationTxHash: string | null;
};

const AGENT_EVM_SELECT = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  bio: users.bio,
  profileImageUrl: users.profileImageUrl,
  coverImageUrl: users.coverImageUrl,
  isAgent: users.isAgent,
  managedBy: users.managedBy,
  privyId: users.privyId,
  privyWalletId: users.privyWalletId,
  walletAddress: users.walletAddress,
  offlineWalletReady: users.offlineWalletReady,
  onChainRegistered: users.onChainRegistered,
  agent0TokenId: users.agent0TokenId,
  agent0MetadataCID: users.agent0MetadataCID,
  registrationTxHash: users.registrationTxHash,
} as const;

function isAgent0RegistrationConfigured(): boolean {
  return Boolean(
    process.env.AGENT0_RPC_URL &&
      process.env.AGENT0_PRIVATE_KEY &&
      process.env.PINATA_JWT &&
      process.env.BABYLON_GAME_WALLET_ADDRESS
  );
}

function isPersistedEvmWalletReady(agent: AgentEvmRecord): boolean {
  return (
    agent.offlineWalletReady &&
    agent.privyId !== null &&
    agent.privyWalletId !== null &&
    agent.walletAddress !== null
  );
}

async function getAgentForOwner(
  ownerUserId: string,
  agentUserId: string
): Promise<AgentEvmRecord> {
  const [agent] = await db
    .select(AGENT_EVM_SELECT)
    .from(users)
    .where(eq(users.id, agentUserId))
    .limit(1);

  if (!agent || !agent.isAgent) {
    throw new BusinessLogicError('Agent not found', 'AGENT_NOT_FOUND');
  }

  if (agent.managedBy !== ownerUserId) {
    throw new BusinessLogicError(
      'You do not manage this agent',
      'AGENT_ACCESS_DENIED'
    );
  }

  return agent;
}

async function persistAgentEvmWalletState(
  agentUserId: string,
  wallet: {
    privyId: string;
    privyWalletId: string;
    walletAddress: string;
  }
): Promise<void> {
  await db
    .update(users)
    .set({
      privyId: wallet.privyId,
      privyWalletId: wallet.privyWalletId,
      walletAddress: wallet.walletAddress.toLowerCase(),
      offlineWalletReady: true,
      offlineWalletReadyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, agentUserId));
}

async function resolveAgentEvmWallet(agent: AgentEvmRecord): Promise<{
  privyId: string;
  privyWalletId: string;
  walletAddress: string;
}> {
  if (isPersistedEvmWalletReady(agent)) {
    return {
      privyId: agent.privyId!,
      privyWalletId: agent.privyWalletId!,
      walletAddress: agent.walletAddress!.toLowerCase(),
    };
  }

  const provisionedWallet = await provisionAgentPrivyWallet({
    agentUserId: agent.id,
    existingPrivyId: agent.privyId,
  });

  await persistAgentEvmWalletState(agent.id, {
    privyId: provisionedWallet.privyId,
    privyWalletId: provisionedWallet.privyWalletId,
    walletAddress: provisionedWallet.walletAddress,
  });

  return {
    privyId: provisionedWallet.privyId,
    privyWalletId: provisionedWallet.privyWalletId,
    walletAddress: provisionedWallet.walletAddress.toLowerCase(),
  };
}

async function deductRegistrationCost(
  ownerUserId: string,
  agentUserId: string,
  cost: number
): Promise<void> {
  const [deducted] = await db
    .update(users)
    .set({
      virtualBalance: sql`(${users.virtualBalance})::numeric - ${cost}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, ownerUserId),
        sql`(${users.virtualBalance})::numeric >= ${cost}`
      )
    )
    .returning({ virtualBalance: users.virtualBalance });

  if (!deducted) {
    const [owner] = await db
      .select({ virtualBalance: users.virtualBalance })
      .from(users)
      .where(eq(users.id, ownerUserId))
      .limit(1);

    const currentBalance = Number(owner?.virtualBalance ?? '0');
    throw new BusinessLogicError(
      `Insufficient balance. EVM agent registration costs ${cost} points. You have ${Math.floor(currentBalance)} points.`,
      'INSUFFICIENT_BALANCE'
    );
  }

  const balanceAfter = Number(deducted.virtualBalance);
  const balanceBefore = balanceAfter + cost;

  await db.insert(balanceTransactions).values({
    id: await generateSnowflakeId(),
    userId: ownerUserId,
    type: 'withdrawal',
    amount: String(cost),
    balanceBefore: String(balanceBefore),
    balanceAfter: String(balanceAfter),
    relatedId: agentUserId,
    description: 'Agent EVM registration',
    createdAt: new Date(),
  });
}

async function refundRegistrationCost(
  ownerUserId: string,
  agentUserId: string,
  cost: number
): Promise<void> {
  const [refunded] = await db
    .update(users)
    .set({
      virtualBalance: sql`(${users.virtualBalance})::numeric + ${cost}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, ownerUserId))
    .returning({ virtualBalance: users.virtualBalance });

  const balanceAfter = Number(refunded?.virtualBalance ?? '0');
  const balanceBefore = balanceAfter - cost;

  await db.insert(balanceTransactions).values({
    id: await generateSnowflakeId(),
    userId: ownerUserId,
    type: 'deposit',
    amount: String(cost),
    balanceBefore: String(balanceBefore),
    balanceAfter: String(balanceAfter),
    relatedId: agentUserId,
    description: 'Refund - agent EVM registration failed',
    createdAt: new Date(),
  });
}

async function withAgentEvmRegistrationLock<T>(
  agentUserId: string,
  fn: () => Promise<T>
): Promise<T> {
  const lockId = `agent-evm-registration:${agentUserId}`;
  const processId = `agent-evm-registration-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const acquired = await DistributedLockService.acquireLock({
    lockId,
    durationMs: 60_000,
    operation: 'agent-evm-registration',
    processId,
  });

  if (!acquired) {
    throw new BusinessLogicError(
      'An EVM registration attempt is already in progress for this agent. Please retry in a moment.',
      'AGENT_EVM_REGISTRATION_IN_PROGRESS'
    );
  }

  try {
    return await fn();
  } finally {
    await DistributedLockService.releaseLock(lockId, processId);
  }
}

export async function getAgentEvmRegistrationStatus({
  ownerUserId,
  agentUserId,
}: {
  ownerUserId: string;
  agentUserId: string;
}): Promise<AgentEvmRegistrationStatus> {
  const agent = await getAgentForOwner(ownerUserId, agentUserId);
  const tokenId = agent.agent0TokenId;
  const isRegistered = Boolean(agent.onChainRegistered && tokenId !== null);

  return {
    isRegistered,
    tokenId,
    metadataCid: agent.agent0MetadataCID,
    txHash: agent.registrationTxHash,
    walletAddress: agent.walletAddress?.toLowerCase() ?? null,
    walletReady: isPersistedEvmWalletReady(agent),
    canRegister: !isRegistered && isAgent0RegistrationConfigured(),
    cost: POINTS.ONCHAIN_REGISTRATION,
  };
}

export async function registerAgentOnEvmForOwner({
  ownerUserId,
  agentUserId,
}: {
  ownerUserId: string;
  agentUserId: string;
}): Promise<AgentEvmRegistrationResult> {
  await getAgentForOwner(ownerUserId, agentUserId);

  return withAgentEvmRegistrationLock(agentUserId, async () => {
    const agent = await getAgentForOwner(ownerUserId, agentUserId);

    if (agent.onChainRegistered && agent.agent0TokenId !== null) {
      return {
        message: 'Already registered on-chain',
        alreadyRegistered: true,
        agentUserId: agent.id,
        tokenId: agent.agent0TokenId,
        txHash: agent.registrationTxHash ?? undefined,
        walletAddress: agent.walletAddress?.toLowerCase() ?? '',
        cost: 0,
      };
    }

    if (!isAgent0RegistrationConfigured()) {
      throw new BusinessLogicError(
        'On-chain registration is currently unavailable. Please try again later.',
        'REGISTRATION_UNAVAILABLE'
      );
    }

    const cost = POINTS.ONCHAIN_REGISTRATION;
    await deductRegistrationCost(ownerUserId, agent.id, cost);

    try {
      const wallet = await resolveAgentEvmWallet(agent);
      const registration = await processOnchainRegistration({
        user: {
          userId: agent.username ?? agent.id,
          dbUserId: agent.id,
          privyId: wallet.privyId,
          isAgent: true,
        },
        walletAddress: wallet.walletAddress,
        username: agent.username,
        displayName: agent.displayName,
        bio: agent.bio ?? undefined,
        profileImageUrl: agent.profileImageUrl ?? undefined,
        coverImageUrl: agent.coverImageUrl ?? undefined,
      });

      logger.info(
        'Owner completed agent EVM registration',
        {
          ownerUserId,
          agentUserId: agent.id,
          agent0TokenId: registration.tokenId,
          cost,
        },
        'registerAgentOnEvmForOwner'
      );

      return {
        message: registration.message,
        alreadyRegistered: registration.alreadyRegistered,
        agentUserId: agent.id,
        tokenId: registration.tokenId ?? 0,
        txHash: registration.txHash,
        walletAddress: wallet.walletAddress,
        cost,
      };
    } catch (error) {
      await refundRegistrationCost(ownerUserId, agent.id, cost);
      throw error;
    }
  });
}
