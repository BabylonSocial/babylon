import { beforeEach, describe, expect, it, mock } from 'bun:test';

const mockGetAgentSolanaRegistration = mock();
const mockPrepareAgentSolanaRegistrationTransaction = mock();
const mockFinalizeAgentSolanaRegistrationTransaction = mock();
const mockGetSolanaWalletBalanceLamports = mock();
const mockEnsureSolanaWalletReady = mock();
const mockSendSolanaTransaction = mock();
const mockIsSolanaBlockhashNotFoundError = mock();
const mockAssertSolanaRegistryConfigured = mock();
const mockAcquireLock = mock();
const mockReleaseLock = mock();
let capturedRegistrationFileInput: Record<string, unknown> | null = null;

let selectResults: Array<unknown[]> = [];
const capturedUpdates: Array<Record<string, unknown>> = [];
const capturedInserts: Array<Record<string, unknown>> = [];

const usersTable = {
  id: 'id',
  username: 'username',
  displayName: 'displayName',
  bio: 'bio',
  profileImageUrl: 'profileImageUrl',
  isAgent: 'isAgent',
  managedBy: 'managedBy',
  privyId: 'privyId',
  privySolanaWalletId: 'privySolanaWalletId',
  solanaWalletAddress: 'solanaWalletAddress',
  solanaOfflineWalletReady: 'solanaOfflineWalletReady',
  solanaRegistered: 'solanaRegistered',
  solanaRegistryAssetId: 'solanaRegistryAssetId',
  solanaMetadataUri: 'solanaMetadataUri',
  solanaRegistrationTxHash: 'solanaRegistrationTxHash',
  virtualBalance: 'virtualBalance',
} as const;

mock.module('@babylon/agents/solana-registry', () => ({
  SOLANA_REGISTRATION_MIN_BALANCE_LAMPORTS: 21_000_000n,
  assertSolanaRegistryConfigured: mockAssertSolanaRegistryConfigured,
  buildAgentSolanaRegistrationFile: (input: Record<string, unknown>) => {
    capturedRegistrationFileInput = input;
    return input;
  },
  deriveDeterministicAgentSolanaAsset: () => ({
    publicKey: { toBase58: () => 'asset-deterministic' },
  }),
  formatLamportsAsSol: (lamports: bigint) => {
    const divisor = 1_000_000_000n;
    const whole = lamports / divisor;
    const fractional = (lamports % divisor).toString().padStart(9, '0');
    const trimmedFractional = fractional.replace(/0+$/, '');

    return trimmedFractional.length > 0
      ? `${whole}.${trimmedFractional}`
      : whole.toString();
  },
  getAgentSolanaRegistration: mockGetAgentSolanaRegistration,
  getSolanaWalletBalanceLamports: mockGetSolanaWalletBalanceLamports,
  finalizeAgentSolanaRegistrationTransaction:
    mockFinalizeAgentSolanaRegistrationTransaction,
  prepareAgentSolanaRegistrationTransaction:
    mockPrepareAgentSolanaRegistrationTransaction,
}));

mock.module('@babylon/db', () => ({
  and: (...args: unknown[]) => args,
  eq: (...args: unknown[]) => args,
  sql: (strings: TemplateStringsArray) => strings.join(''),
}));

mock.module('@babylon/db/runtime', () => ({
  balanceTransactions: 'BalanceTransaction',
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => selectResults.shift() ?? [],
        }),
      }),
    }),
    update: () => ({
      set: (data: Record<string, unknown>) => {
        capturedUpdates.push(data);
        return {
          where: () => ({
            returning: async () => selectResults.shift() ?? [],
          }),
        };
      },
    }),
    insert: () => ({
      values: async (data: Record<string, unknown>) => {
        capturedInserts.push(data);
      },
    }),
  },
  users: usersTable,
}));

mock.module('@babylon/shared', () => ({
  BusinessLogicError: class BusinessLogicError extends Error {
    constructor(
      message: string,
      public code: string
    ) {
      super(message);
    }
  },
  generateSnowflakeId: mock().mockResolvedValue('snowflake-1'),
  getBaseUrl: () => 'https://babylon.market',
  getMCPEndpoint: () => 'https://babylon.market/api/mcp',
  logger: {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
  },
  POINTS: {
    ONCHAIN_REGISTRATION: 100,
  },
}));

mock.module('./privy/solana-wallet-provisioning', () => ({
  ensureSolanaWalletReady: mockEnsureSolanaWalletReady,
}));

mock.module('./privy/solana-send-transaction', () => ({
  isSolanaBlockhashNotFoundError: mockIsSolanaBlockhashNotFoundError,
  sendSolanaTransaction: mockSendSolanaTransaction,
}));

mock.module('./distributed-lock-service', () => ({
  DistributedLockService: {
    acquireLock: mockAcquireLock,
    releaseLock: mockReleaseLock,
  },
}));

const { getAgentSolanaRegistrationStatus, registerAgentOnSolanaForOwner } =
  await import('./agent-solana-registration-service');

const BASE_AGENT = {
  id: 'agent-1',
  username: 'agent-one',
  displayName: 'Agent One',
  bio: 'Autonomous AI agent',
  profileImageUrl: null,
  isAgent: true,
  managedBy: 'owner-1',
  privyId: 'did:privy:agent-1',
  privySolanaWalletId: null,
  solanaWalletAddress: null,
  solanaOfflineWalletReady: false,
  solanaRegistered: false,
  solanaRegistryAssetId: null,
  solanaMetadataUri: null,
  solanaRegistrationTxHash: null,
};

describe('agent-solana-registration-service', () => {
  beforeEach(() => {
    selectResults = [];
    capturedUpdates.length = 0;
    capturedInserts.length = 0;
    capturedRegistrationFileInput = null;
    mockGetAgentSolanaRegistration.mockReset();
    mockPrepareAgentSolanaRegistrationTransaction.mockReset();
    mockFinalizeAgentSolanaRegistrationTransaction.mockReset();
    mockGetSolanaWalletBalanceLamports.mockReset();
    mockEnsureSolanaWalletReady.mockReset();
    mockSendSolanaTransaction.mockReset();
    mockIsSolanaBlockhashNotFoundError.mockReset();
    mockAssertSolanaRegistryConfigured.mockReset();
    mockAcquireLock.mockReset();
    mockReleaseLock.mockReset();

    process.env.SOLANA_REGISTRY_ENABLED = 'true';
    mockAssertSolanaRegistryConfigured.mockReturnValue(undefined);
    mockAcquireLock.mockResolvedValue(true);
    mockReleaseLock.mockResolvedValue(undefined);
    mockEnsureSolanaWalletReady.mockResolvedValue({
      privyWalletId: 'solana-wallet-1',
      walletAddress: 'SoLWallet111',
      offlineWalletReady: true,
      createdWallet: true,
    });
    mockPrepareAgentSolanaRegistrationTransaction.mockResolvedValue({
      assetId: 'asset-123',
      metadataUri: 'ipfs://cid-123',
      metadataCid: 'cid-123',
      transactionTemplate: 'base64-tx-template',
    });
    mockFinalizeAgentSolanaRegistrationTransaction.mockResolvedValue({
      transaction: 'base64-tx-signed',
      blockhash: 'blockhash-1',
      lastValidBlockHeight: 123,
    });
    mockGetSolanaWalletBalanceLamports.mockResolvedValue(22_000_000n);
    mockSendSolanaTransaction.mockResolvedValue({
      hash: 'tx-123',
      transactionId: 'tx-123',
      caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    });
    mockIsSolanaBlockhashNotFoundError.mockImplementation(
      (error: unknown) =>
        error instanceof Error && error.message.includes('Blockhash not found')
    );
  });

  it('returns status for an owned agent', async () => {
    selectResults.push([BASE_AGENT]);

    const status = await getAgentSolanaRegistrationStatus({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(status.isRegistered).toBe(false);
    expect(status.walletReady).toBe(true);
    expect(status.walletAddress).toBe('SoLWallet111');
    expect(status.walletBalanceSol).toBe('0.022');
    expect(status.minimumBalanceSol).toBe('0.021');
    expect(status.hasEnoughBalance).toBe(true);
    expect(status.canRegister).toBe(true);
    expect(status.cost).toBe(100);
  });

  it('returns wallet funding details even when balance lookup fails', async () => {
    selectResults.push([BASE_AGENT]);
    mockGetSolanaWalletBalanceLamports.mockRejectedValueOnce(
      new Error('RPC unavailable')
    );

    const status = await getAgentSolanaRegistrationStatus({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(status.walletReady).toBe(true);
    expect(status.walletAddress).toBe('SoLWallet111');
    expect(status.walletBalanceLamports).toBeNull();
    expect(status.walletBalanceSol).toBeNull();
    expect(status.hasEnoughBalance).toBe(false);
    expect(status.canRegister).toBe(false);
  });

  it('registers an agent on Solana, charges points once, and persists Solana-specific fields', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);

    mockGetAgentSolanaRegistration
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await registerAgentOnSolanaForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(false);
    expect(result.assetId).toBe('asset-123');
    expect(result.txHash).toBe('tx-123');
    expect(mockGetSolanaWalletBalanceLamports).toHaveBeenCalledWith(
      'SoLWallet111'
    );
    expect(mockSendSolanaTransaction).toHaveBeenCalledWith({
      walletId: 'solana-wallet-1',
      transaction: 'base64-tx-signed',
      confirmationStrategy: {
        blockhash: 'blockhash-1',
        lastValidBlockHeight: 123,
      },
    });
    expect(mockFinalizeAgentSolanaRegistrationTransaction).toHaveBeenCalledWith(
      {
        agentUserId: 'agent-1',
        transaction: 'base64-tx-template',
      }
    );
    expect(capturedRegistrationFileInput?.skills).toEqual([]);
    expect(capturedRegistrationFileInput?.domains).toEqual([]);
    expect(
      capturedUpdates.some((update) => update.solanaRegistered === true)
    ).toBe(true);
    expect(
      capturedInserts.some(
        (insert) => insert.description === 'Agent Solana registration'
      )
    ).toBe(true);
  });

  it('blocks registration until the agent wallet is funded with enough SOL', async () => {
    selectResults.push([BASE_AGENT]);
    mockGetAgentSolanaRegistration.mockResolvedValueOnce(null);
    mockGetSolanaWalletBalanceLamports.mockResolvedValueOnce(5_000_000n);

    await expect(
      registerAgentOnSolanaForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toThrow('Fund the agent wallet with at least 0.021 SOL');

    expect(capturedInserts).toHaveLength(0);
    expect(mockSendSolanaTransaction).not.toHaveBeenCalled();
  });

  it('rejects registration when the agent has no Privy identity', async () => {
    selectResults.push([
      {
        ...BASE_AGENT,
        privyId: null,
        solanaOfflineWalletReady: false,
        solanaWalletAddress: null,
        privySolanaWalletId: null,
      },
    ]);
    mockGetAgentSolanaRegistration.mockResolvedValueOnce(null);

    await expect(
      registerAgentOnSolanaForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toThrow('Agent wallet identity is not ready');

    expect(capturedInserts).toHaveLength(0);
    expect(mockSendSolanaTransaction).not.toHaveBeenCalled();
  });

  it('allows registration when wallet balance equals exactly the minimum threshold', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);
    mockGetAgentSolanaRegistration
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockGetSolanaWalletBalanceLamports.mockResolvedValueOnce(21_000_000n);

    const result = await registerAgentOnSolanaForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(false);
    expect(mockSendSolanaTransaction).toHaveBeenCalled();
  });

  it('refreshes and retries once when Privy rejects the transaction with a stale blockhash', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);

    mockGetAgentSolanaRegistration
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockFinalizeAgentSolanaRegistrationTransaction
      .mockResolvedValueOnce({
        transaction: 'base64-tx-signed-attempt-1',
        blockhash: 'blockhash-stale',
        lastValidBlockHeight: 111,
      })
      .mockResolvedValueOnce({
        transaction: 'base64-tx-signed-attempt-2',
        blockhash: 'blockhash-fresh',
        lastValidBlockHeight: 222,
      });
    mockSendSolanaTransaction
      .mockRejectedValueOnce(
        new Error(
          '400 {"error":"Error broadcasting transaction with message: Error: Transaction simulation failed: Blockhash not found","code":"transaction_broadcast_failure"}'
        )
      )
      .mockResolvedValueOnce({
        hash: 'tx-456',
        transactionId: 'tx-456',
        caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      });

    const result = await registerAgentOnSolanaForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.txHash).toBe('tx-456');
    expect(
      mockFinalizeAgentSolanaRegistrationTransaction
    ).toHaveBeenCalledTimes(2);
    expect(mockSendSolanaTransaction).toHaveBeenNthCalledWith(1, {
      walletId: 'solana-wallet-1',
      transaction: 'base64-tx-signed-attempt-1',
      confirmationStrategy: {
        blockhash: 'blockhash-stale',
        lastValidBlockHeight: 111,
      },
    });
    expect(mockSendSolanaTransaction).toHaveBeenNthCalledWith(2, {
      walletId: 'solana-wallet-1',
      transaction: 'base64-tx-signed-attempt-2',
      confirmationStrategy: {
        blockhash: 'blockhash-fresh',
        lastValidBlockHeight: 222,
      },
    });
    expect(
      capturedInserts.some(
        (insert) =>
          insert.description === 'Refund - agent Solana registration failed'
      )
    ).toBe(false);
  });

  it('returns already registered without charging when DB is already in sync', async () => {
    selectResults.push([
      {
        ...BASE_AGENT,
        solanaRegistered: true,
        solanaRegistryAssetId: 'asset-existing',
        solanaMetadataUri: 'ipfs://cid-existing',
        solanaRegistrationTxHash: 'tx-existing',
      },
    ]);

    const result = await registerAgentOnSolanaForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(true);
    expect(result.cost).toBe(0);
    expect(capturedInserts).toHaveLength(0);
    expect(mockSendSolanaTransaction).not.toHaveBeenCalled();
  });

  it('surfaces missing Solana configuration cleanly', async () => {
    selectResults.push([BASE_AGENT]);
    mockAssertSolanaRegistryConfigured.mockImplementationOnce(() => {
      throw new Error('Solana agent registration is disabled.');
    });

    await expect(
      registerAgentOnSolanaForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toThrow('Solana agent registration is disabled.');
    expect(capturedInserts).toHaveLength(0);
    expect(capturedUpdates).toHaveLength(0);
  });

  it('refunds when Solana preparation fails after charging the owner', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);

    mockGetAgentSolanaRegistration
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockPrepareAgentSolanaRegistrationTransaction.mockRejectedValueOnce(
      new Error('Solana agent registration is disabled.')
    );

    await expect(
      registerAgentOnSolanaForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toThrow('Solana agent registration is disabled.');
    expect(
      capturedInserts.some(
        (insert) =>
          insert.description === 'Refund - agent Solana registration failed'
      )
    ).toBe(true);
  });

  it('reconciles a partial failure without double-charging when the deterministic asset is already on-chain', async () => {
    selectResults.push([BASE_AGENT]);

    mockGetAgentSolanaRegistration.mockResolvedValueOnce({ owner: 'onchain' });

    const result = await registerAgentOnSolanaForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(true);
    expect(result.cost).toBe(0);
    expect(capturedInserts).toHaveLength(0);
  });

  it('blocks concurrent registration attempts before charging points', async () => {
    selectResults.push([BASE_AGENT]);
    mockAcquireLock.mockResolvedValueOnce(false);

    await expect(
      registerAgentOnSolanaForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toThrow('already in progress');

    expect(capturedInserts).toHaveLength(0);
    expect(mockSendSolanaTransaction).not.toHaveBeenCalled();
  });

  it('reconciles on-chain success after a post-send failure without refunding', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);

    mockGetAgentSolanaRegistration
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ owner: 'onchain' });
    mockSendSolanaTransaction.mockRejectedValueOnce(
      new Error('Privy returned an unexpected response')
    );

    const result = await registerAgentOnSolanaForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.assetId).toBe('asset-123');
    expect(result.walletAddress).toBe('SoLWallet111');
    expect(
      capturedInserts.some(
        (insert) =>
          insert.description === 'Refund - agent Solana registration failed'
      )
    ).toBe(false);
  });
});
