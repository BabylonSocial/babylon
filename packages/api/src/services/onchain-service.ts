/**
 * On-Chain Registration Service
 *
 * Handles ERC-8004 identity registration via the Agent0 SDK on Ethereum mainnet.
 * All registrations (users and agents) go through Agent0's canonical ERC-8004
 * Identity Registry. The Babylon Base Sepolia custom registry is deprecated.
 *
 * Architecture:
 * - Agent0 SDK handles contract interactions, IPFS metadata, and event parsing
 * - Privy embedded wallets provide gas-sponsored signing for users
 * - Registration is opt-in and costs POINTS.ONCHAIN_REGISTRATION (100 pts)
 *
 * @see https://eips.ethereum.org/EIPS/eip-8004 - ERC-8004 Trustless Agents
 */

import { getAgent0SDK } from '@babylon/agents';
import { getContractAddresses, getRpcUrl } from '@babylon/contracts';
import { and, eq, sql } from '@babylon/db';
import { db, follows, referrals, users } from '@babylon/db/runtime';

import type {
  AgentCapabilities,
  AuthenticatedUser,
  JsonValue,
  PointsReason,
  StringRecord,
} from '@babylon/shared';
import {
  BusinessLogicError,
  generateSnowflakeId,
  IDENTITY_REGISTRY_ABI,
  InternalServerError,
  identityRegistryAbi,
  logger,
  POINTS,
  ValidationError,
} from '@babylon/shared';
import {
  type Address,
  type Chain,
  createPublicClient,
  decodeEventLog,
  http,
} from 'viem';
import { baseSepolia, foundry, mainnet } from 'viem/chains';
import { cachedDb } from '../cache/cached-database-service';

function resolveViemChain(chainId: number): Chain {
  switch (chainId) {
    case 1:
      return mainnet;
    case 84532:
      return baseSepolia;
    case 31337:
      return foundry;
    default:
      throw new BusinessLogicError(
        `Unsupported chain ID for on-chain registration: ${chainId}`,
        'UNSUPPORTED_CHAIN'
      );
  }
}

import { notifyNewAccount } from './notification-service';
import { PointsService } from './points-service';
import { getOrCreateReferralCode } from './referral-service';

type OnboardingServices = {
  notifyNewAccount: (userId: string) => Promise<void>;
  pointsService: {
    awardReferralSignup: (
      referrerId: string,
      referredUserId: string
    ) => Promise<{
      success: boolean;
      pointsAwarded: number;
      error?: string;
    }>;
    awardPoints: (
      userId: string,
      amount: number,
      reason: PointsReason,
      metadata?: StringRecord<JsonValue>
    ) => Promise<{
      success: boolean;
      pointsAwarded: number;
      newTotal: number;
    }>;
  };
  getOrCreateReferralCode: (userId: string) => Promise<string>;
};

let onboardingServicesInstance: OnboardingServices | null = null;
let onboardingServicesFallbackLogged = false;

export function setOnboardingServices(services: OnboardingServices): void {
  onboardingServicesInstance = services;
}

function getOnboardingServices(): OnboardingServices {
  if (onboardingServicesInstance) {
    return onboardingServicesInstance;
  }

  if (!onboardingServicesFallbackLogged) {
    logger.warn(
      'OnboardingServices not explicitly initialized, using default service bindings',
      undefined,
      'OnboardingOnchain'
    );
    onboardingServicesFallbackLogged = true;
  }

  const fallback: OnboardingServices = {
    notifyNewAccount,
    pointsService: {
      awardReferralSignup: PointsService.awardReferralSignup,
      awardPoints: PointsService.awardPoints,
    },
    getOrCreateReferralCode,
  };
  onboardingServicesInstance = fallback;

  return fallback;
}

const contracts = getContractAddresses();
export const IDENTITY_REGISTRY = contracts.identityRegistry;

export interface OnchainRegistrationInput {
  user: AuthenticatedUser;
  walletAddress?: string | null;
  username?: string | null;
  displayName?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  endpoint?: string | null;
  referralCode?: string | null;
}

export interface OnchainRegistrationResult {
  message: string;
  tokenId?: number;
  txHash?: string;
  pointsAwarded?: number;
  alreadyRegistered: boolean;
  userId: string;
}

/**
 * Register a user or agent on-chain via Agent0 SDK (canonical ERC-8004).
 *
 * This function handles the complete registration flow:
 * 1. Resolve or create user record in DB
 * 2. Check if already registered via Agent0 SDK
 * 3. Register via Agent0 SDK (creates ERC-721 token + publishes IPFS metadata)
 * 4. Sync registration state to DB (agent0TokenId, onChainRegistered)
 * 5. Process referrals if applicable
 *
 * Welcome bonus is NOT awarded here — it is awarded at profile completion (signup).
 */
export async function processOnchainRegistration({
  user,
  walletAddress,
  username,
  displayName,
  bio,
  profileImageUrl,
  coverImageUrl,
  endpoint,
  referralCode,
}: OnchainRegistrationInput): Promise<OnchainRegistrationResult> {
  if (!user.isAgent && !walletAddress) {
    throw new BusinessLogicError(
      'Wallet address is required for non-agent users',
      'WALLET_REQUIRED'
    );
  }

  const finalUsername =
    username ||
    `user_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36).substring(2, 6)}`;

  if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new ValidationError(
      'Invalid wallet address format',
      ['walletAddress'],
      [
        {
          field: 'walletAddress',
          message: 'Must be a valid Ethereum address (0x...)',
        },
      ]
    );
  }

  let referrerId: string | null = null;
  if (referralCode) {
    const [referrer] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.username}) = lower(${referralCode})`)
      .limit(1);

    if (referrer && referrer.id !== user.userId) {
      referrerId = referrer.id;
    } else {
      const [referralOwner] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      if (referralOwner && referralOwner.id !== user.userId) {
        referrerId = referralOwner.id;
      } else if (
        referrer?.id === user.userId ||
        referralOwner?.id === user.userId
      ) {
        logger.warn(
          'Self-referral attempt blocked',
          { userId: user.userId, referralCode },
          'OnboardingOnchain'
        );
      }
    }
  }

  let dbUser: {
    id: string;
    username: string | null;
    privyWalletId: string | null;
    walletAddress: string | null;
    onChainRegistered: boolean;
    nftTokenId: number | null;
    agent0TokenId: number | null;
    referredBy: string | null;
  } | null = null;

  const userSelectFields = {
    id: users.id,
    username: users.username,
    privyWalletId: users.privyWalletId,
    walletAddress: users.walletAddress,
    onChainRegistered: users.onChainRegistered,
    nftTokenId: users.nftTokenId,
    agent0TokenId: users.agent0TokenId,
    referredBy: users.referredBy,
  };

  if (user.isAgent) {
    const [existingUser] = user.dbUserId
      ? await db
          .select(userSelectFields)
          .from(users)
          .where(eq(users.id, user.dbUserId))
          .limit(1)
      : await db
          .select(userSelectFields)
          .from(users)
          .where(sql`lower(${users.username}) = lower(${user.userId})`)
          .limit(1);
    dbUser = existingUser ?? null;

    if (!dbUser) {
      if (user.dbUserId) {
        throw new BusinessLogicError('Agent not found', 'AGENT_NOT_FOUND');
      }

      const newId = await generateSnowflakeId();
      const [createdUser] = await db
        .insert(users)
        .values({
          id: newId,
          privyId: user.userId,
          username: user.userId,
          displayName: displayName || username || user.userId,
          bio: bio || `Autonomous AI agent: ${user.userId}`,
          profileImageUrl: profileImageUrl || null,
          coverImageUrl: coverImageUrl || null,
          isActor: false,
          virtualBalance: '10000',
          totalDeposited: '10000',
          updatedAt: new Date(),
        })
        .returning(userSelectFields);
      dbUser = createdUser ?? null;

      // Invalidate identifier caches for the new user (clears negative cache)
      if (dbUser) {
        await cachedDb.invalidateUserIdentifierCaches({
          id: dbUser.id,
          privyId: user.userId,
          username: dbUser.username,
        });
      }
    }
  } else {
    const [existingUser] = await db
      .select(userSelectFields)
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);
    dbUser = existingUser ?? null;

    if (!dbUser) {
      const [createdUser] = await db
        .insert(users)
        .values({
          id: user.userId,
          privyId: user.privyId ?? user.userId,
          walletAddress: walletAddress?.toLowerCase() ?? null,
          username: finalUsername,
          displayName: displayName || finalUsername,
          bio: bio || '',
          profileImageUrl: profileImageUrl || null,
          coverImageUrl: coverImageUrl || null,
          isActor: false,
          virtualBalance: '0',
          totalDeposited: '0',
          referredBy: referrerId,
          updatedAt: new Date(),
        })
        .returning(userSelectFields);
      dbUser = createdUser ?? null;

      // Invalidate identifier caches for the new user (clears negative cache)
      if (dbUser) {
        await cachedDb.invalidateUserIdentifierCaches({
          id: dbUser.id,
          privyId: user.privyId ?? user.userId,
          username: dbUser.username,
        });
      }
    } else {
      const [fullUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, dbUser.id))
        .limit(1);
      const oldUsername = dbUser.username;
      const [updatedUser] = await db
        .update(users)
        .set({
          walletAddress: walletAddress?.toLowerCase() ?? dbUser.walletAddress,
          username: finalUsername || dbUser.username,
          displayName: displayName || finalUsername || fullUser?.displayName,
          bio: bio || fullUser?.bio,
          profileImageUrl: profileImageUrl ?? fullUser?.profileImageUrl,
          coverImageUrl: coverImageUrl ?? fullUser?.coverImageUrl,
          referredBy: referrerId ?? dbUser.referredBy ?? undefined,
        })
        .where(eq(users.id, dbUser.id))
        .returning(userSelectFields);
      dbUser = updatedUser ?? null;

      // Refresh identifier caches after any successful user update because lookups
      // now cache the full user row under identifier-based keys.
      if (dbUser) {
        await cachedDb.invalidateUserIdentifierCaches(
          {
            id: dbUser.id,
            privyId: user.privyId ?? user.userId,
            username: dbUser.username,
          },
          {
            username: oldUsername !== dbUser.username ? oldUsername : undefined,
          }
        );
      }
    }
  }

  if (!dbUser) {
    throw new InternalServerError('Failed to create or retrieve user record');
  }

  if (!referrerId && dbUser.referredBy) {
    referrerId = dbUser.referredBy;
  }

  // Check if already registered via Agent0
  if (dbUser.onChainRegistered && dbUser.agent0TokenId !== null) {
    logger.info(
      'User already registered on-chain via Agent0',
      { userId: dbUser.id, agent0TokenId: dbUser.agent0TokenId },
      'processOnchainRegistration'
    );
    return {
      message: 'Already registered on-chain',
      tokenId: dbUser.agent0TokenId,
      alreadyRegistered: true,
      userId: dbUser.id,
    };
  }

  // Clear stale registration state if DB says registered but no agent0TokenId
  if (dbUser.onChainRegistered && dbUser.agent0TokenId === null) {
    await db
      .update(users)
      .set({
        onChainRegistered: false,
        nftTokenId: null,
        agent0TokenId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, dbUser.id));

    logger.warn(
      'Cleared stale registration state (no agent0TokenId)',
      { userId: dbUser.id },
      'processOnchainRegistration'
    );
  }

  const name = username || (user.isAgent ? user.userId : finalUsername);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  logger.info(
    'Registering on-chain via Agent0 SDK',
    { isAgent: user.isAgent, name, userId: dbUser.id },
    'OnboardingOnchain'
  );

  // Register via Agent0 SDK
  const sdk = getAgent0SDK();

  const agent = sdk.createAgent(
    name,
    bio ||
      (user.isAgent
        ? `Autonomous AI agent: ${user.userId}`
        : `Babylon user: ${name}`),
    profileImageUrl ?? undefined
  );

  const agentEndpoint = user.isAgent
    ? endpoint || `${baseUrl}/api/agents/${dbUser.id}/a2a`
    : endpoint || `${baseUrl}/user/${name}`;

  await agent.setA2A(agentEndpoint);
  agent.setActive(true);

  if (user.isAgent) {
    agent.setX402Support(true);
    const skills = ['trade', 'analyze', 'prediction-markets'];
    for (const skill of skills) {
      agent.addSkill(skill, false);
    }
  }

  agent.setMetadata({
    platform: 'babylon',
    userType: user.isAgent ? 'agent' : 'user',
    capabilities: user.isAgent
      ? ({
          strategies: ['momentum'],
          markets: ['prediction'],
          actions: ['analyze'],
          version: '1.0.0',
        } as AgentCapabilities)
      : undefined,
  });

  const registrationHandle = await agent.registerIPFS();
  const { result: registration } = await registrationHandle.waitMined();

  const agent0AgentId = registration.agentId || '';
  const agent0TokenId = agent0AgentId
    ? Number.parseInt(agent0AgentId.split(':')[1] || '0', 10)
    : 0;
  const agent0MetadataCID = registration.agentURI || null;
  const registrationTxHash =
    (registration as { txHash?: string }).txHash || null;

  if (agent0TokenId === 0) {
    throw new InternalServerError(
      'Agent0 registration succeeded but returned no token ID',
      { agentId: agent0AgentId }
    );
  }

  logger.info(
    'Agent0 registration complete',
    {
      agent0TokenId,
      metadataCID: agent0MetadataCID,
      txHash: registrationTxHash,
    },
    'OnboardingOnchain'
  );

  // Resolve conflicting agent0TokenId assignments
  if (agent0TokenId > 0) {
    const [conflictingUser] = await db
      .select({
        id: users.id,
        walletAddress: users.walletAddress,
        onChainRegistered: users.onChainRegistered,
      })
      .from(users)
      .where(
        and(
          eq(users.agent0TokenId, agent0TokenId),
          sql`${users.id} <> ${dbUser.id}`
        )
      )
      .limit(1);

    if (conflictingUser) {
      await db
        .update(users)
        .set({
          agent0TokenId: null,
          onChainRegistered: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, conflictingUser.id));

      logger.warn(
        'Cleared conflicting agent0TokenId from another user',
        {
          agent0TokenId,
          currentUserId: dbUser.id,
          conflictingUserId: conflictingUser.id,
        },
        'OnboardingOnchain'
      );
    }
  }

  // Persist registration state to DB (registration fields only, not profile fields)
  await db
    .update(users)
    .set({
      onChainRegistered: true,
      agent0TokenId,
      agent0MetadataCID,
      agent0RegisteredAt: new Date(),
      registrationTxHash: registrationTxHash ?? null,
      registrationTimestamp: new Date(),
    })
    .where(eq(users.id, dbUser.id));

  // Sync on-chain reputation to local database
  try {
    const { syncAfterAgent0Registration } = await import('@babylon/agents');
    await syncAfterAgent0Registration(dbUser.id, agent0TokenId);
    logger.info(
      'Agent0 reputation synced successfully',
      { userId: dbUser.id, agent0TokenId },
      'OnboardingOnchain'
    );
  } catch (syncError) {
    logger.warn(
      'Agent0 reputation sync failed (non-fatal)',
      {
        error:
          syncError instanceof Error ? syncError.message : String(syncError),
      },
      'OnboardingOnchain'
    );
  }

  // Generate referral code
  const services = getOnboardingServices();
  await services.getOrCreateReferralCode(dbUser.id);

  await services.notifyNewAccount(dbUser.id);

  // Process referrals
  if (referrerId) {
    const referralResult = await services.pointsService.awardReferralSignup(
      referrerId,
      dbUser.id
    );

    if (referralResult.success) {
      const refereeBonus = await services.pointsService.awardPoints(
        dbUser.id,
        POINTS.REFERRAL_BONUS,
        'referral_bonus',
        { referrerId }
      );

      if (referralCode) {
        const [existingReferral] = await db
          .select({ id: referrals.id })
          .from(referrals)
          .where(
            and(
              eq(referrals.referralCode, referralCode),
              eq(referrals.referredUserId, dbUser.id)
            )
          )
          .limit(1);

        if (existingReferral) {
          await db
            .update(referrals)
            .set({ status: 'completed', completedAt: new Date() })
            .where(eq(referrals.id, existingReferral.id));
        } else {
          await db.insert(referrals).values({
            id: await generateSnowflakeId(),
            referrerId,
            referralCode,
            referredUserId: dbUser.id,
            status: 'completed',
            completedAt: new Date(),
            createdAt: new Date(),
          });
        }
      }

      const [existingFollow] = await db
        .select({ id: follows.id })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, dbUser.id),
            eq(follows.followingId, referrerId)
          )
        )
        .limit(1);

      if (!existingFollow) {
        await db.insert(follows).values({
          id: await generateSnowflakeId(),
          followerId: dbUser.id,
          followingId: referrerId,
          createdAt: new Date(),
        });
      }

      logger.info(
        'Referral processed successfully',
        {
          referrerId,
          referredUserId: dbUser.id,
          referrerPoints: referralResult.pointsAwarded,
          refereeBonus: refereeBonus.pointsAwarded,
        },
        'OnboardingOnchain'
      );
    } else {
      if (referralCode) {
        const [existingRejectedReferral] = await db
          .select({ id: referrals.id })
          .from(referrals)
          .where(
            and(
              eq(referrals.referralCode, referralCode),
              eq(referrals.referredUserId, dbUser.id)
            )
          )
          .limit(1);

        if (existingRejectedReferral) {
          await db
            .update(referrals)
            .set({ status: 'rejected' })
            .where(eq(referrals.id, existingRejectedReferral.id));
        } else {
          await db.insert(referrals).values({
            id: await generateSnowflakeId(),
            referrerId,
            referralCode,
            referredUserId: dbUser.id,
            status: 'rejected',
            createdAt: new Date(),
          });
        }
      }

      logger.warn(
        'Referral blocked during registration',
        { referrerId, referredUserId: dbUser.id, error: referralResult.error },
        'OnboardingOnchain'
      );
    }
  }

  return {
    message: `Successfully registered ${user.isAgent ? 'agent' : 'user'} on-chain via Agent0`,
    tokenId: agent0TokenId,
    txHash: registrationTxHash ?? undefined,
    alreadyRegistered: false,
    pointsAwarded: 0,
    userId: dbUser.id,
  };
}

/**
 * @deprecated This function relies on the Babylon Base Sepolia Identity Registry
 * which is being phased out. Profile updates should use Agent0 SDK's setAgentURI().
 */
export interface ConfirmOnchainProfileUpdateInput {
  userId: string;
  walletAddress: string;
  txHash: `0x${string}`;
}

export interface ConfirmOnchainProfileUpdateResult {
  tokenId: number;
  endpoint: string;
  capabilitiesHash: `0x${string}`;
  metadata: StringRecord<JsonValue> | null;
}

export async function confirmOnchainProfileUpdate({
  userId,
  walletAddress,
  txHash,
}: ConfirmOnchainProfileUpdateInput): Promise<ConfirmOnchainProfileUpdateResult> {
  if (!walletAddress) {
    throw new BusinessLogicError(
      'Wallet address required for profile update confirmation',
      'WALLET_REQUIRED'
    );
  }

  const lowerWallet = walletAddress.toLowerCase();
  const currentChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
  const publicClient = createPublicClient({
    chain: resolveViemChain(currentChainId),
    transport: http(getRpcUrl()),
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  if (receipt.status !== 'success') {
    throw new BusinessLogicError(
      'Blockchain profile update transaction failed',
      'PROFILE_UPDATE_TX_FAILED',
      { txHash, userId, receipt: receipt.status }
    );
  }

  const expectedTokenId = Number(
    await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: 'getTokenId',
      args: [walletAddress as Address],
    })
  );

  if (!expectedTokenId || Number.isNaN(expectedTokenId)) {
    throw new BusinessLogicError(
      'User wallet is not registered on-chain',
      'WALLET_NOT_REGISTERED',
      { walletAddress: lowerWallet }
    );
  }

  let tokenId: number | null = null;
  let endpoint = '';
  let capabilitiesHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== IDENTITY_REGISTRY.toLowerCase()) continue;
    if (log.topics.length === 0) continue;

    const decoded = decodeEventLog({
      abi: identityRegistryAbi,
      data: log.data,
      topics: log.topics,
      strict: false,
    });

    if (decoded.eventName === 'AgentUpdated') {
      tokenId = Number(decoded.args.tokenId);
      endpoint = decoded.args.endpoint ?? '';
      capabilitiesHash = decoded.args.capabilitiesHash as `0x${string}`;
      break;
    }
  }

  if (!tokenId) {
    throw new BusinessLogicError(
      'Transaction did not emit AgentUpdated event',
      'PROFILE_UPDATE_EVENT_NOT_FOUND',
      { txHash }
    );
  }

  if (tokenId !== expectedTokenId) {
    throw new BusinessLogicError(
      'Transaction updated a different token ID than expected',
      'PROFILE_UPDATE_TOKEN_MISMATCH',
      {
        txHash,
        expectedTokenId,
        actualTokenId: tokenId,
        walletAddress: lowerWallet,
      }
    );
  }

  const profile = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'getAgentProfile',
    args: [BigInt(tokenId)],
  });

  const profileArray = profile as [
    string,
    string,
    `0x${string}`,
    bigint,
    boolean,
    string,
  ];
  endpoint = endpoint || profileArray[1];
  capabilitiesHash = profileArray[2];
  const rawMetadata = profileArray[5];

  let metadata: StringRecord<JsonValue> | null = null;
  if (typeof rawMetadata === 'string' && rawMetadata.trim().length > 0) {
    metadata = JSON.parse(rawMetadata) as StringRecord<JsonValue>;
  }

  return {
    tokenId,
    endpoint,
    capabilitiesHash,
    metadata,
  };
}
