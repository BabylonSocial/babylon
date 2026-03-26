#!/usr/bin/env bun

import {
  assertSolanaRegistryConfigured,
  buildAgentSolanaRegistrationFile,
  createSolanaRegistryConnection,
  deriveDeterministicAgentSolanaAsset,
  finalizeAgentSolanaRegistrationTransaction,
  formatLamportsAsSol,
  getAgentSolanaRegistration,
  getSolanaRegistryCluster,
  getSolanaRegistryRpcUrl,
  getSolanaWalletBalanceLamports,
  prepareAgentSolanaRegistrationTransaction,
  SOLANA_REGISTRATION_MIN_BALANCE_LAMPORTS,
} from '@babylon/agents/solana-registry';
import {
  buildSolanaTransactionIdempotencyKey,
  ensureSolanaWalletReady,
  extractPrivyApiDiagnostics,
  getPrivyNodeClient,
  getPrivyOfflineConfig,
  registerAgentOnSolanaForOwner,
} from '@babylon/api/solana-registration-debug';
import { and, eq } from '@babylon/db';
import { closeDatabase, db, users } from '@babylon/db/runtime';

import { getBaseUrl, getMCPEndpoint } from '@babylon/shared';
import { Transaction } from '@solana/web3.js';
import { config as loadEnvFile } from 'dotenv';

type CliMode = 'inspect' | 'simulate' | 'register';

type CliOptions = {
  agentId: string;
  ownerUserId: string | null;
  envFile: string | null;
  forceRegister: boolean;
  json: boolean;
  mode: CliMode;
};

type AgentRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  managedBy: string | null;
  isAgent: boolean;
  privyId: string | null;
  privySolanaWalletId: string | null;
  solanaWalletAddress: string | null;
  solanaOfflineWalletReady: boolean;
  solanaRegistered: boolean;
  solanaRegistryAssetId: string | null;
  solanaMetadataUri: string | null;
  solanaRegistrationTxHash: string | null;
};

type OwnerRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  virtualBalance: string;
};

type PreparedContext = {
  agent: AgentRow;
  ownerUserId: string;
  owner: OwnerRow | null;
  wallet: {
    privyWalletId: string;
    walletAddress: string;
    offlineWalletReady: true;
    createdWallet: boolean;
  };
  walletBalanceLamports: bigint;
  registrationFile: ReturnType<typeof buildAgentSolanaRegistrationFile>;
  prepared: {
    assetId: string;
    metadataUri: string;
    metadataCid: string;
    transactionTemplate: string;
  };
  onchainBefore: Awaited<ReturnType<typeof getAgentSolanaRegistration>>;
};

const RECOMMENDED_SOLANA_REGISTRATION_BALANCE_LAMPORTS =
  SOLANA_REGISTRATION_MIN_BALANCE_LAMPORTS;
const RECOMMENDED_SOLANA_REGISTRATION_BALANCE_SOL = formatLamportsAsSol(
  RECOMMENDED_SOLANA_REGISTRATION_BALANCE_LAMPORTS
);

function printUsage(): void {
  console.log(`
Debug the Solana agent registration flow locally with production-equivalent code.

Usage:
  bun run scripts/debug-solana-registration.ts --agent <agentUserId> [options]

Options:
  --agent <id>                 Agent user ID to debug
  --owner <id>                 Owner user ID (defaults to agent.managedBy)
  --mode <inspect|simulate|register>
                               inspect: resolve wallet + balance + prepare/finalize tx
                               simulate: inspect + Privy sign + RPC simulate (no broadcast)
                               register: exact production service flow (writes + broadcast)
                               default: inspect
  --env-file <path>            Optional env file to load before running
  --i-know-what-im-doing       Required for --mode register
  --json                       Print machine-readable JSON
  -h, --help                   Show this help

Examples:
  bun run scripts/debug-solana-registration.ts --env-file .env.production.local --agent 291871578944176128
  bun run scripts/debug-solana-registration.ts --env-file .env.production.local --agent 291871578944176128 --mode simulate
  bun run scripts/debug-solana-registration.ts --env-file .env.production.local --agent 291871578944176128 --mode register
`);
}

function readArgValue(args: string[], name: string): string | null {
  const exactIndex = args.findIndex((arg) => arg === name);
  if (exactIndex !== -1) {
    const value = args[exactIndex + 1];
    if (!value) {
      throw new Error(`Missing value after ${name}`);
    }
    return value.trim();
  }

  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (!prefixed) return null;

  const value = prefixed.slice(name.length + 1).trim();
  if (!value) {
    throw new Error(`${name} cannot be empty`);
  }

  return value;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (hasFlag(args, '-h') || hasFlag(args, '--help')) {
    printUsage();
    process.exit(0);
  }

  const agentId = readArgValue(args, '--agent');
  if (!agentId) {
    throw new Error('Missing required --agent <agentUserId>');
  }

  const modeRaw = readArgValue(args, '--mode') ?? 'inspect';
  if (!['inspect', 'simulate', 'register'].includes(modeRaw)) {
    throw new Error(
      `Invalid --mode "${modeRaw}". Expected inspect, simulate, or register.`
    );
  }

  return {
    agentId,
    ownerUserId: readArgValue(args, '--owner'),
    envFile: readArgValue(args, '--env-file'),
    forceRegister: hasFlag(args, '--i-know-what-im-doing'),
    json: hasFlag(args, '--json'),
    mode: modeRaw as CliMode,
  };
}

function maybeLoadEnvFile(envFile: string | null): void {
  if (!envFile) return;

  const result = loadEnvFile({ path: envFile, override: true });
  if (result.error) {
    throw result.error;
  }
}

function resolveSolanaCaip2(): string {
  const cluster = getSolanaRegistryCluster();

  switch (cluster) {
    case 'devnet':
      return 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
    case 'testnet':
      return 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z';
    case 'localnet':
      return 'solana:localnet';
    case 'mainnet-beta':
    default:
      return 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  }
}

function summarizeTransaction(base64Transaction: string): {
  base64Length: number;
  byteLength: number;
} {
  return {
    base64Length: base64Transaction.length,
    byteLength: Buffer.from(base64Transaction, 'base64').length,
  };
}

async function getAgent(agentUserId: string): Promise<AgentRow> {
  const [agent] = (await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      profileImageUrl: users.profileImageUrl,
      managedBy: users.managedBy,
      isAgent: users.isAgent,
      privyId: users.privyId,
      privySolanaWalletId: users.privySolanaWalletId,
      solanaWalletAddress: users.solanaWalletAddress,
      solanaOfflineWalletReady: users.solanaOfflineWalletReady,
      solanaRegistered: users.solanaRegistered,
      solanaRegistryAssetId: users.solanaRegistryAssetId,
      solanaMetadataUri: users.solanaMetadataUri,
      solanaRegistrationTxHash: users.solanaRegistrationTxHash,
    })
    .from(users)
    .where(eq(users.id, agentUserId))
    .limit(1)) as AgentRow[];

  if (!agent || !agent.isAgent) {
    throw new Error(`Agent not found or not marked as agent: ${agentUserId}`);
  }

  return agent;
}

async function getOwner(ownerUserId: string): Promise<OwnerRow | null> {
  const [owner] = (await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      virtualBalance: users.virtualBalance,
    })
    .from(users)
    .where(eq(users.id, ownerUserId))
    .limit(1)) as OwnerRow[];

  return owner ?? null;
}

async function ensureOwnerControlsAgent(
  ownerUserId: string,
  agentUserId: string
): Promise<void> {
  const [match] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, agentUserId), eq(users.managedBy, ownerUserId)))
    .limit(1);

  if (!match) {
    throw new Error(
      `Owner ${ownerUserId} does not control agent ${agentUserId}.`
    );
  }
}

async function buildPreparedContext(
  agentUserId: string,
  ownerUserId: string
): Promise<PreparedContext> {
  const agent = await getAgent(agentUserId);
  await ensureOwnerControlsAgent(ownerUserId, agentUserId);

  if (!agent.privyId) {
    throw new Error(
      'Agent has no Privy identity yet. The Solana wallet cannot be provisioned.'
    );
  }

  assertSolanaRegistryConfigured();

  const [owner, wallet] = await Promise.all([
    getOwner(ownerUserId),
    ensureSolanaWalletReady({ privyId: agent.privyId }),
  ]);

  const walletBalanceLamports = await getSolanaWalletBalanceLamports(
    wallet.walletAddress
  );

  const registrationFile = buildAgentSolanaRegistrationFile({
    name: agent.displayName || agent.username || agent.id,
    description:
      agent.bio || `Autonomous AI agent: ${agent.username || agent.id}`,
    image: agent.profileImageUrl,
    walletAddress: wallet.walletAddress,
    a2aEndpoint: `${getBaseUrl()}/api/agents/${agent.id}/a2a`,
    mcpEndpoint: getMCPEndpoint(),
    metadata: {
      platform: 'babylon',
      userType: 'agent',
      managerUserId: ownerUserId,
      network: 'solana',
    },
    skills: [],
    domains: [],
  });

  const prepared = await prepareAgentSolanaRegistrationTransaction({
    agentUserId: agent.id,
    ownerWalletAddress: wallet.walletAddress,
    registrationFile,
  });

  const onchainBefore = await getAgentSolanaRegistration(prepared.assetId);

  return {
    agent,
    ownerUserId,
    owner,
    wallet,
    walletBalanceLamports,
    registrationFile,
    prepared,
    onchainBefore,
  };
}

async function runInspect(
  agentUserId: string,
  ownerUserId: string
): Promise<Record<string, unknown>> {
  const context = await buildPreparedContext(agentUserId, ownerUserId);
  const finalized = await finalizeAgentSolanaRegistrationTransaction({
    agentUserId,
    transaction: context.prepared.transactionTemplate,
  });

  return {
    mode: 'inspect',
    environment: {
      solanaRegistryEnabled: process.env.SOLANA_REGISTRY_ENABLED === 'true',
      solanaCluster: getSolanaRegistryCluster(),
      solanaRpcUrl: getSolanaRegistryRpcUrl(),
      baseUrl: getBaseUrl(),
      mcpEndpoint: getMCPEndpoint(),
      privyAppIdConfigured:
        Boolean(process.env.PRIVY_APP_ID) ||
        Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
      privySolanaPolicyConfigured: Boolean(
        process.env.PRIVY_SOLANA_OFFLINE_POLICY_ID
      ),
      authorizationKeyConfigured: Boolean(
        process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY
      ),
      pinataConfigured: Boolean(process.env.PINATA_JWT),
      filecoinConfigured: Boolean(process.env.FILECOIN_PRIVATE_KEY),
      agent0IpfsConfigured: Boolean(process.env.AGENT0_IPFS_API),
    },
    owner: {
      id: context.ownerUserId,
      username: context.owner?.username ?? null,
      displayName: context.owner?.displayName ?? null,
      virtualBalance: context.owner?.virtualBalance ?? null,
    },
    agent: {
      id: context.agent.id,
      username: context.agent.username,
      displayName: context.agent.displayName,
      managedBy: context.agent.managedBy,
      privyId: context.agent.privyId,
      dbWalletId: context.agent.privySolanaWalletId,
      dbWalletAddress: context.agent.solanaWalletAddress,
      dbOfflineWalletReady: context.agent.solanaOfflineWalletReady,
      dbRegistered: context.agent.solanaRegistered,
      dbAssetId: context.agent.solanaRegistryAssetId,
      dbMetadataUri: context.agent.solanaMetadataUri,
      dbTxHash: context.agent.solanaRegistrationTxHash,
      deterministicAssetId: deriveDeterministicAgentSolanaAsset(
        context.agent.id
      ).publicKey.toBase58(),
    },
    wallet: {
      walletId: context.wallet.privyWalletId,
      walletAddress: context.wallet.walletAddress,
      createdWallet: context.wallet.createdWallet,
      balanceLamports: context.walletBalanceLamports.toString(),
      balanceSol: formatLamportsAsSol(context.walletBalanceLamports),
    },
    registrationFile: {
      name: context.registrationFile.name,
      description: context.registrationFile.description,
      image: context.registrationFile.image ?? null,
      walletAddress: context.registrationFile.walletAddress,
      services: context.registrationFile.services,
      metadata: context.registrationFile.metadata ?? null,
      skills: context.registrationFile.skills ?? [],
      domains: context.registrationFile.domains ?? [],
      updatedAt: context.registrationFile.updatedAt,
    },
    prepared: {
      assetId: context.prepared.assetId,
      metadataUri: context.prepared.metadataUri,
      metadataCid: context.prepared.metadataCid,
      transactionTemplate: summarizeTransaction(
        context.prepared.transactionTemplate
      ),
    },
    finalized: {
      blockhash: finalized.blockhash,
      lastValidBlockHeight: finalized.lastValidBlockHeight,
      transaction: summarizeTransaction(finalized.transaction),
    },
    onchainBefore: context.onchainBefore
      ? {
          found: true,
          asset: context.prepared.assetId,
          data: context.onchainBefore,
        }
      : {
          found: false,
          asset: context.prepared.assetId,
        },
  };
}

async function runSimulate(
  agentUserId: string,
  ownerUserId: string
): Promise<Record<string, unknown>> {
  const context = await buildPreparedContext(agentUserId, ownerUserId);
  const finalized = await finalizeAgentSolanaRegistrationTransaction({
    agentUserId,
    transaction: context.prepared.transactionTemplate,
  });

  const privy = getPrivyNodeClient();
  const offlineConfig = getPrivyOfflineConfig();
  const caip2 = resolveSolanaCaip2();
  const idempotencyKey = buildSolanaTransactionIdempotencyKey({
    walletId: context.wallet.privyWalletId,
    transaction: finalized.transaction,
    caip2,
  });

  const signed = await privy
    .wallets()
    .solana()
    .signTransaction(context.wallet.privyWalletId, {
      transaction: finalized.transaction,
      authorization_context: {
        authorization_private_keys: [offlineConfig.authorizationPrivateKey],
      },
      idempotency_key: idempotencyKey,
    });

  const connection = createSolanaRegistryConnection();
  const signedTransaction = Transaction.from(
    Buffer.from(signed.signed_transaction, 'base64')
  );
  const simulation = await connection.simulateTransaction(signedTransaction);
  const insufficientFundsForRent =
    typeof simulation.value.err === 'object' &&
    simulation.value.err !== null &&
    'InsufficientFundsForRent' in simulation.value.err;

  return {
    mode: 'simulate',
    ownerUserId,
    agentUserId,
    wallet: {
      walletId: context.wallet.privyWalletId,
      walletAddress: context.wallet.walletAddress,
      balanceLamports: context.walletBalanceLamports.toString(),
      balanceSol: formatLamportsAsSol(context.walletBalanceLamports),
    },
    prepared: {
      assetId: context.prepared.assetId,
      metadataUri: context.prepared.metadataUri,
      metadataCid: context.prepared.metadataCid,
    },
    finalized: {
      blockhash: finalized.blockhash,
      lastValidBlockHeight: finalized.lastValidBlockHeight,
      transaction: summarizeTransaction(finalized.transaction),
    },
    privy: {
      caip2,
      idempotencyKey,
      signedTransaction: summarizeTransaction(signed.signed_transaction),
    },
    simulation: {
      err: simulation.value.err,
      logs: simulation.value.logs ?? [],
      unitsConsumed: simulation.value.unitsConsumed ?? null,
      returnData: simulation.value.returnData ?? null,
    },
    diagnosis: insufficientFundsForRent
      ? {
          likelyCause:
            'The agent wallet has enough SOL to pass the old app-level threshold, but not enough to satisfy the actual rent requirement of the registration transaction.',
          currentBalanceLamports: context.walletBalanceLamports.toString(),
          currentBalanceSol: formatLamportsAsSol(context.walletBalanceLamports),
          recommendedMinimumLamports:
            RECOMMENDED_SOLANA_REGISTRATION_BALANCE_LAMPORTS.toString(),
          recommendedMinimumSol: RECOMMENDED_SOLANA_REGISTRATION_BALANCE_SOL,
        }
      : null,
  };
}

async function runRegister(
  agentUserId: string,
  ownerUserId: string,
  forceRegister: boolean
): Promise<Record<string, unknown>> {
  if (!forceRegister) {
    throw new Error(
      'Refusing to execute register mode without --i-know-what-im-doing.'
    );
  }

  const result = await registerAgentOnSolanaForOwner({
    ownerUserId,
    agentUserId,
  });

  return {
    mode: 'register',
    result,
  };
}

function printHumanReadable(result: Record<string, unknown>): void {
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const options = parseArgs();
  maybeLoadEnvFile(options.envFile);

  const agent = await getAgent(options.agentId);
  const ownerUserId = options.ownerUserId ?? agent.managedBy;

  if (!ownerUserId) {
    throw new Error(
      'No owner could be resolved. Pass --owner <ownerUserId> or set agent.managedBy.'
    );
  }

  let result: Record<string, unknown>;

  switch (options.mode) {
    case 'inspect':
      result = await runInspect(options.agentId, ownerUserId);
      break;
    case 'simulate':
      result = await runSimulate(options.agentId, ownerUserId);
      break;
    case 'register':
      result = await runRegister(
        options.agentId,
        ownerUserId,
        options.forceRegister
      );
      break;
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printHumanReadable(result);
}

main()
  .then(async () => {
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    const diagnostics = extractPrivyApiDiagnostics(error, {
      redactJwtLike: true,
    });
    const stack = error instanceof Error ? error.stack : undefined;
    const cause =
      error instanceof Error && error.cause instanceof Error
        ? {
            name: error.cause.name,
            message: error.cause.message,
            stack: error.cause.stack,
          }
        : error instanceof Error && error.cause
          ? String(error.cause)
          : null;

    console.error(
      JSON.stringify(
        {
          name: error instanceof Error ? error.name : 'Error',
          error: error instanceof Error ? error.message : String(error),
          stack,
          cause,
          diagnostics,
        },
        null,
        2
      )
    );
    await closeDatabase();
    process.exit(1);
  });
