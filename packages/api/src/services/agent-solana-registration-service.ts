import {
  assertSolanaRegistryConfigured,
  buildAgentSolanaRegistrationFile,
  deriveDeterministicAgentSolanaAsset,
  finalizeAgentSolanaRegistrationTransaction,
  formatLamportsAsSol,
  getAgentSolanaRegistration,
  getSolanaWalletBalanceLamports,
  prepareAgentSolanaRegistrationTransaction,
  SOLANA_REGISTRATION_MIN_BALANCE_LAMPORTS,
} from '@babylon/agents/solana-registry';
import { and, eq, sql } from '@babylon/db';
import { balanceTransactions, db, users } from '@babylon/db/runtime';

import {
  BusinessLogicError,
  generateSnowflakeId,
  getBaseUrl,
  getMCPEndpoint,
  logger,
  POINTS,
} from '@babylon/shared';
import { DistributedLockService } from './distributed-lock-service';
import {
  isSolanaBlockhashNotFoundError,
  sendSolanaTransaction,
} from './privy/solana-send-transaction';
import { ensureSolanaWalletReady } from './privy/solana-wallet-provisioning';

export interface AgentSolanaRegistrationStatus {
  isRegistered: boolean;
  assetId: string | null;
  metadataUri: string | null;
  txHash: string | null;
  walletAddress: string | null;
  walletReady: boolean;
  walletBalanceLamports: string | null;
  walletBalanceSol: string | null;
  minimumBalanceLamports: string;
  minimumBalanceSol: string;
  hasEnoughBalance: boolean;
  canRegister: boolean;
  cost: number;
}

export interface AgentSolanaRegistrationResult {
  message: string;
  alreadyRegistered: boolean;
  agentUserId: string;
  assetId: string;
  metadataUri: string;
  txHash?: string;
  walletAddress: string;
  cost: number;
}

type AgentSolanaRecord = {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  isAgent: boolean;
  managedBy: string | null;
  privyId: string | null;
  privySolanaWalletId: string | null;
  solanaWalletAddress: string | null;
  solanaOfflineWalletReady: boolean;
  solanaRegistered: boolean;
  solanaRegistryAssetId: string | null;
  solanaMetadataUri: string | null;
  solanaRegistrationTxHash: string | null;
};

const AGENT_SOLANA_SELECT = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  bio: users.bio,
  profileImageUrl: users.profileImageUrl,
  isAgent: users.isAgent,
  managedBy: users.managedBy,
  privyId: users.privyId,
  privySolanaWalletId: users.privySolanaWalletId,
  solanaWalletAddress: users.solanaWalletAddress,
  solanaOfflineWalletReady: users.solanaOfflineWalletReady,
  solanaRegistered: users.solanaRegistered,
  solanaRegistryAssetId: users.solanaRegistryAssetId,
  solanaMetadataUri: users.solanaMetadataUri,
  solanaRegistrationTxHash: users.solanaRegistrationTxHash,
} as const;

const MINIMUM_SOLANA_REGISTRATION_BALANCE_LAMPORTS =
  SOLANA_REGISTRATION_MIN_BALANCE_LAMPORTS;
const MINIMUM_SOLANA_REGISTRATION_BALANCE_SOL = formatLamportsAsSol(
  MINIMUM_SOLANA_REGISTRATION_BALANCE_LAMPORTS
);

function isSolanaRegistrationEnabled(): boolean {
  return process.env.SOLANA_REGISTRY_ENABLED === 'true';
}

function isPersistedSolanaWalletReady(agent: AgentSolanaRecord): boolean {
  return (
    agent.solanaOfflineWalletReady &&
    agent.solanaWalletAddress !== null &&
    agent.privySolanaWalletId !== null
  );
}

async function resolveAgentSolanaWallet(agent: AgentSolanaRecord): Promise<{
  privyWalletId: string;
  walletAddress: string;
} | null> {
  if (!agent.privyId) {
    return null;
  }

  if (isPersistedSolanaWalletReady(agent)) {
    return {
      privyWalletId: agent.privySolanaWalletId!,
      walletAddress: agent.solanaWalletAddress!,
    };
  }

  if (!isSolanaRegistrationEnabled()) {
    return null;
  }

  const wallet = await ensureSolanaWalletReady({ privyId: agent.privyId });
  await persistSolanaWalletState(agent.id, wallet);

  return {
    privyWalletId: wallet.privyWalletId,
    walletAddress: wallet.walletAddress,
  };
}

async function getAgentForOwner(
  ownerUserId: string,
  agentUserId: string
): Promise<AgentSolanaRecord> {
  const [agent] = await db
    .select(AGENT_SOLANA_SELECT)
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

async function deductRegistrationCost(
  ownerUserId: string,
  agentUserId: string,
  cost: number
): Promise<{ balanceBefore: number; balanceAfter: number }> {
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
      `Insufficient balance. Solana agent registration costs ${cost} points. You have ${Math.floor(currentBalance)} points.`,
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
    description: 'Agent Solana registration',
    createdAt: new Date(),
  });

  return { balanceBefore, balanceAfter };
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
    description: 'Refund - agent Solana registration failed',
    createdAt: new Date(),
  });
}

async function persistSolanaWalletState(
  agentUserId: string,
  wallet: { privyWalletId: string; walletAddress: string }
): Promise<void> {
  await db
    .update(users)
    .set({
      privySolanaWalletId: wallet.privyWalletId,
      solanaWalletAddress: wallet.walletAddress,
      solanaOfflineWalletReady: true,
      solanaOfflineWalletReadyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, agentUserId));
}

async function persistSolanaRegistrationState({
  agentUserId,
  assetId,
  metadataUri,
  wallet,
  txHash,
}: {
  agentUserId: string;
  assetId: string;
  metadataUri: string | null;
  wallet?: {
    walletAddress: string;
    walletId: string;
  } | null;
  txHash?: string | null;
}): Promise<void> {
  await db
    .update(users)
    .set({
      ...(wallet
        ? {
            privySolanaWalletId: wallet.walletId,
            solanaWalletAddress: wallet.walletAddress,
            solanaOfflineWalletReady: true,
            solanaOfflineWalletReadyAt: new Date(),
          }
        : {}),
      solanaRegistered: true,
      solanaRegistryAssetId: assetId,
      solanaMetadataUri: metadataUri ?? null,
      solanaRegistrationTxHash: txHash ?? null,
      solanaRegisteredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, agentUserId));
}

async function withAgentSolanaRegistrationLock<T>(
  agentUserId: string,
  fn: () => Promise<T>
): Promise<T> {
  const lockId = `agent-solana-registration:${agentUserId}`;
  const processId = `agent-solana-registration-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const acquired = await DistributedLockService.acquireLock({
    lockId,
    durationMs: 60_000,
    operation: 'agent-solana-registration',
    processId,
  });

  if (!acquired) {
    throw new BusinessLogicError(
      'A Solana registration attempt is already in progress for this agent. Please retry in a moment.',
      'AGENT_SOLANA_REGISTRATION_IN_PROGRESS'
    );
  }

  try {
    return await fn();
  } finally {
    await DistributedLockService.releaseLock(lockId, processId);
  }
}

async function sendAgentSolanaRegistrationTransaction({
  ownerUserId,
  agentUserId,
  walletId,
  transactionTemplate,
}: {
  ownerUserId: string;
  agentUserId: string;
  walletId: string;
  transactionTemplate: string;
}): Promise<{ hash: string; transactionId?: string; caip2: string }> {
  const finalized = await finalizeAgentSolanaRegistrationTransaction({
    agentUserId,
    transaction: transactionTemplate,
  });

  try {
    return await sendSolanaTransaction({
      walletId,
      transaction: finalized.transaction,
      confirmationStrategy: {
        blockhash: finalized.blockhash,
        lastValidBlockHeight: finalized.lastValidBlockHeight,
      },
    });
  } catch (error) {
    if (!isSolanaBlockhashNotFoundError(error)) {
      throw error;
    }

    logger.warn(
      'Retrying Solana registration after stale blockhash broadcast failure',
      {
        ownerUserId,
        agentUserId,
        walletId,
        previousBlockhash: finalized.blockhash,
      },
      'AgentSolanaRegistration'
    );

    const retried = await finalizeAgentSolanaRegistrationTransaction({
      agentUserId,
      transaction: transactionTemplate,
    });

    return sendSolanaTransaction({
      walletId,
      transaction: retried.transaction,
      confirmationStrategy: {
        blockhash: retried.blockhash,
        lastValidBlockHeight: retried.lastValidBlockHeight,
      },
    });
  }
}

export async function getAgentSolanaRegistrationStatus({
  ownerUserId,
  agentUserId,
}: {
  ownerUserId: string;
  agentUserId: string;
}): Promise<AgentSolanaRegistrationStatus> {
  const agent = await getAgentForOwner(ownerUserId, agentUserId);
  const wallet = await resolveAgentSolanaWallet(agent);
  let walletBalanceLamports: bigint | null = null;

  if (wallet && isSolanaRegistrationEnabled()) {
    try {
      walletBalanceLamports = await getSolanaWalletBalanceLamports(
        wallet.walletAddress
      );
    } catch (error) {
      logger.warn(
        'Failed to load agent Solana wallet balance for registration status',
        {
          ownerUserId,
          agentUserId,
          walletAddress: wallet.walletAddress,
          error: error instanceof Error ? error.message : String(error),
        },
        'AgentSolanaRegistration'
      );
    }
  }

  const hasEnoughBalance =
    walletBalanceLamports !== null &&
    walletBalanceLamports >= MINIMUM_SOLANA_REGISTRATION_BALANCE_LAMPORTS;

  return {
    isRegistered:
      agent.solanaRegistered && agent.solanaRegistryAssetId !== null,
    assetId: agent.solanaRegistryAssetId,
    metadataUri: agent.solanaMetadataUri,
    txHash: agent.solanaRegistrationTxHash,
    walletAddress: wallet?.walletAddress ?? agent.solanaWalletAddress,
    walletReady: wallet !== null,
    walletBalanceLamports:
      walletBalanceLamports !== null ? walletBalanceLamports.toString() : null,
    walletBalanceSol:
      walletBalanceLamports !== null
        ? formatLamportsAsSol(walletBalanceLamports)
        : null,
    minimumBalanceLamports:
      MINIMUM_SOLANA_REGISTRATION_BALANCE_LAMPORTS.toString(),
    minimumBalanceSol: MINIMUM_SOLANA_REGISTRATION_BALANCE_SOL,
    hasEnoughBalance,
    canRegister:
      isSolanaRegistrationEnabled() &&
      !agent.solanaRegistered &&
      wallet !== null &&
      hasEnoughBalance,
    cost: POINTS.ONCHAIN_REGISTRATION,
  };
}

export async function registerAgentOnSolanaForOwner({
  ownerUserId,
  agentUserId,
}: {
  ownerUserId: string;
  agentUserId: string;
}): Promise<AgentSolanaRegistrationResult> {
  const agent = await getAgentForOwner(ownerUserId, agentUserId);
  return withAgentSolanaRegistrationLock(agentUserId, async () => {
    const cost = POINTS.ONCHAIN_REGISTRATION;
    let costCharged = false;
    let wallet: {
      privyWalletId: string;
      walletAddress: string;
    } | null = null;
    let prepared: {
      assetId: string;
      metadataUri: string;
      metadataCid: string;
      transactionTemplate: string;
    } | null = null;

    const deterministicAssetId =
      deriveDeterministicAgentSolanaAsset(agentUserId).publicKey.toBase58();

    if (agent.solanaRegistered && agent.solanaRegistryAssetId) {
      return {
        message: 'Agent already registered on Solana',
        alreadyRegistered: true,
        agentUserId,
        assetId: agent.solanaRegistryAssetId,
        metadataUri: agent.solanaMetadataUri ?? '',
        txHash: agent.solanaRegistrationTxHash ?? undefined,
        walletAddress: agent.solanaWalletAddress ?? '',
        cost: 0,
      };
    }

    assertSolanaRegistryConfigured();

    if (!agent.privyId) {
      throw new BusinessLogicError(
        'Agent wallet identity is not ready yet. Try again after the agent wallet has been provisioned.',
        'AGENT_IDENTITY_NOT_READY'
      );
    }

    try {
      const existingOnchain =
        await getAgentSolanaRegistration(deterministicAssetId);
      if (existingOnchain) {
        wallet = await ensureSolanaWalletReady({ privyId: agent.privyId });
        await persistSolanaRegistrationState({
          agentUserId,
          assetId: deterministicAssetId,
          metadataUri: agent.solanaMetadataUri,
          wallet: {
            walletAddress: wallet.walletAddress,
            walletId: wallet.privyWalletId,
          },
          txHash: agent.solanaRegistrationTxHash,
        });

        return {
          message: 'Agent already registered on Solana',
          alreadyRegistered: true,
          agentUserId,
          assetId: deterministicAssetId,
          metadataUri: agent.solanaMetadataUri ?? '',
          txHash: agent.solanaRegistrationTxHash ?? undefined,
          walletAddress: wallet.walletAddress,
          cost: 0,
        };
      }
    } catch (error) {
      logger.debug(
        'On-chain Solana registration lookup failed before registration attempt',
        {
          ownerUserId,
          agentUserId,
          assetId: deterministicAssetId,
          error: error instanceof Error ? error.message : String(error),
        },
        'AgentSolanaRegistration'
      );
    }

    try {
      wallet = await resolveAgentSolanaWallet(agent);
      if (!wallet) {
        throw new BusinessLogicError(
          'Agent wallet identity is not ready yet. Try again after the agent wallet has been provisioned.',
          'AGENT_IDENTITY_NOT_READY'
        );
      }

      const walletBalanceLamports = await getSolanaWalletBalanceLamports(
        wallet.walletAddress
      );
      if (
        walletBalanceLamports < MINIMUM_SOLANA_REGISTRATION_BALANCE_LAMPORTS
      ) {
        throw new BusinessLogicError(
          `Fund the agent wallet with at least ${MINIMUM_SOLANA_REGISTRATION_BALANCE_SOL} SOL before registering. Current balance: ${formatLamportsAsSol(walletBalanceLamports)} SOL.`,
          'AGENT_SOLANA_WALLET_NOT_FUNDED'
        );
      }

      await deductRegistrationCost(ownerUserId, agentUserId, cost);
      costCharged = true;

      const registrationFile = buildAgentSolanaRegistrationFile({
        name: agent.displayName || agent.username || agentUserId,
        description:
          agent.bio || `Autonomous AI agent: ${agent.username || agentUserId}`,
        image: agent.profileImageUrl,
        walletAddress: wallet.walletAddress,
        a2aEndpoint: `${getBaseUrl()}/api/agents/${agentUserId}/a2a`,
        mcpEndpoint: getMCPEndpoint(),
        metadata: {
          platform: 'babylon',
          userType: 'agent',
          managerUserId: ownerUserId,
          network: 'solana',
        },
        // Do not publish Babylon-specific labels as OASF skills/domains until
        // they are mapped to valid registry slugs.
        skills: [],
        domains: [],
      });

      const registrationPrepared =
        await prepareAgentSolanaRegistrationTransaction({
          agentUserId,
          ownerWalletAddress: wallet.walletAddress,
          registrationFile,
        });
      prepared = registrationPrepared;

      const existingOnchain = await getAgentSolanaRegistration(
        registrationPrepared.assetId
      );
      if (existingOnchain) {
        await persistSolanaRegistrationState({
          agentUserId,
          assetId: registrationPrepared.assetId,
          metadataUri: registrationPrepared.metadataUri,
          wallet: {
            walletAddress: wallet.walletAddress,
            walletId: wallet.privyWalletId,
          },
        });

        return {
          message: 'Agent already registered on Solana',
          alreadyRegistered: true,
          agentUserId,
          assetId: registrationPrepared.assetId,
          metadataUri: registrationPrepared.metadataUri,
          walletAddress: wallet.walletAddress,
          cost: 0,
        };
      }

      const tx = await sendAgentSolanaRegistrationTransaction({
        ownerUserId,
        agentUserId,
        walletId: wallet.privyWalletId,
        transactionTemplate: registrationPrepared.transactionTemplate,
      });

      await persistSolanaRegistrationState({
        agentUserId,
        assetId: registrationPrepared.assetId,
        metadataUri: registrationPrepared.metadataUri,
        wallet: {
          walletAddress: wallet.walletAddress,
          walletId: wallet.privyWalletId,
        },
        txHash: tx.hash,
      });

      logger.info(
        'Agent registered on the Solana Agent Registry',
        {
          ownerUserId,
          agentUserId,
          assetId: registrationPrepared.assetId,
          txHash: tx.hash,
          cost,
        },
        'AgentSolanaRegistration'
      );

      return {
        message: 'Successfully registered agent on Solana',
        alreadyRegistered: false,
        agentUserId,
        assetId: registrationPrepared.assetId,
        metadataUri: registrationPrepared.metadataUri,
        txHash: tx.hash,
        walletAddress: wallet.walletAddress,
        cost,
      };
    } catch (error) {
      if (prepared?.assetId) {
        try {
          const existingOnchain = await getAgentSolanaRegistration(
            prepared.assetId
          );
          if (existingOnchain) {
            const reconciledWallet =
              wallet ??
              (await ensureSolanaWalletReady({
                privyId: agent.privyId,
              }).catch((walletError) => {
                logger.warn(
                  'Solana registration succeeded on-chain but wallet reconciliation failed',
                  {
                    ownerUserId,
                    agentUserId,
                    assetId: prepared?.assetId,
                    error:
                      walletError instanceof Error
                        ? walletError.message
                        : String(walletError),
                  },
                  'AgentSolanaRegistration'
                );
                return null;
              }));

            try {
              await persistSolanaRegistrationState({
                agentUserId,
                assetId: prepared.assetId,
                metadataUri: prepared.metadataUri,
                wallet: reconciledWallet
                  ? {
                      walletAddress: reconciledWallet.walletAddress,
                      walletId: reconciledWallet.privyWalletId,
                    }
                  : null,
              });
            } catch (persistError) {
              logger.error(
                'Solana registration was confirmed on-chain but local persistence failed during reconciliation',
                {
                  ownerUserId,
                  agentUserId,
                  assetId: prepared.assetId,
                  error:
                    persistError instanceof Error
                      ? persistError.message
                      : String(persistError),
                },
                'AgentSolanaRegistration'
              );
            }

            return {
              message: 'Successfully registered agent on Solana',
              alreadyRegistered: false,
              agentUserId,
              assetId: prepared.assetId,
              metadataUri: prepared.metadataUri,
              walletAddress:
                reconciledWallet?.walletAddress ??
                wallet?.walletAddress ??
                agent.solanaWalletAddress ??
                '',
              cost,
            };
          }
        } catch (reconciliationError) {
          logger.debug(
            'Post-failure Solana registration reconciliation lookup failed',
            {
              ownerUserId,
              agentUserId,
              assetId: prepared.assetId,
              error:
                reconciliationError instanceof Error
                  ? reconciliationError.message
                  : String(reconciliationError),
            },
            'AgentSolanaRegistration'
          );
        }
      }

      if (costCharged) {
        await refundRegistrationCost(ownerUserId, agentUserId, cost);
      }

      throw error;
    }
  });
}
