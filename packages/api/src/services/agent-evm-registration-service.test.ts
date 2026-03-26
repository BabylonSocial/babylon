import { beforeEach, describe, expect, it, mock } from 'bun:test';

const mockProcessOnchainRegistration = mock();
const mockProvisionAgentPrivyWallet = mock();
const mockAcquireLock = mock();
const mockReleaseLock = mock();

let selectResults: Array<unknown[]> = [];
const capturedUpdates: Array<Record<string, unknown>> = [];
const capturedInserts: Array<Record<string, unknown>> = [];

const usersTable = {
  id: 'id',
  username: 'username',
  displayName: 'displayName',
  bio: 'bio',
  profileImageUrl: 'profileImageUrl',
  coverImageUrl: 'coverImageUrl',
  isAgent: 'isAgent',
  managedBy: 'managedBy',
  privyId: 'privyId',
  privyWalletId: 'privyWalletId',
  walletAddress: 'walletAddress',
  offlineWalletReady: 'offlineWalletReady',
  onChainRegistered: 'onChainRegistered',
  agent0TokenId: 'agent0TokenId',
  agent0MetadataCID: 'agent0MetadataCID',
  registrationTxHash: 'registrationTxHash',
  virtualBalance: 'virtualBalance',
} as const;

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
  logger: {
    info: mock(),
    warn: mock(),
  },
  POINTS: {
    ONCHAIN_REGISTRATION: 100,
  },
}));

mock.module('./onchain-service', () => ({
  processOnchainRegistration: mockProcessOnchainRegistration,
}));

mock.module('./privy/agent-wallet-provisioning', () => ({
  provisionAgentPrivyWallet: mockProvisionAgentPrivyWallet,
}));

mock.module('./distributed-lock-service', () => ({
  DistributedLockService: {
    acquireLock: mockAcquireLock,
    releaseLock: mockReleaseLock,
  },
}));

const { getAgentEvmRegistrationStatus, registerAgentOnEvmForOwner } =
  await import('./agent-evm-registration-service');

const BASE_AGENT = {
  id: 'agent-1',
  username: 'agent-one',
  displayName: 'Agent One',
  bio: 'Autonomous AI agent',
  profileImageUrl: null,
  coverImageUrl: null,
  isAgent: true,
  managedBy: 'owner-1',
  privyId: null,
  privyWalletId: null,
  walletAddress: null,
  offlineWalletReady: false,
  onChainRegistered: false,
  agent0TokenId: null,
  agent0MetadataCID: null,
  registrationTxHash: null,
};

describe('agent-evm-registration-service', () => {
  beforeEach(() => {
    selectResults = [];
    capturedUpdates.length = 0;
    capturedInserts.length = 0;
    mockProcessOnchainRegistration.mockReset();
    mockProvisionAgentPrivyWallet.mockReset();
    mockAcquireLock.mockReset();
    mockReleaseLock.mockReset();

    process.env.AGENT0_RPC_URL = 'https://rpc.example.com';
    process.env.AGENT0_PRIVATE_KEY = '0xabc';
    process.env.PINATA_JWT = 'pinata';
    process.env.BABYLON_GAME_WALLET_ADDRESS =
      '0x0000000000000000000000000000000000000001';
    mockAcquireLock.mockResolvedValue(true);
    mockReleaseLock.mockResolvedValue(undefined);
  });

  it('returns status for an owned agent', async () => {
    selectResults.push([BASE_AGENT]);

    const status = await getAgentEvmRegistrationStatus({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(status.isRegistered).toBe(false);
    expect(status.walletReady).toBe(false);
    expect(status.canRegister).toBe(true);
    expect(status.cost).toBe(100);
  });

  it('marks registration unavailable when Agent0 is missing required game wallet config', async () => {
    delete process.env.BABYLON_GAME_WALLET_ADDRESS;
    selectResults.push([BASE_AGENT]);

    const status = await getAgentEvmRegistrationStatus({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(status.canRegister).toBe(false);
  });

  it('rejects registration when the caller does not manage the agent', async () => {
    selectResults.push([
      {
        ...BASE_AGENT,
        managedBy: 'owner-2',
      },
    ]);

    await expect(
      registerAgentOnEvmForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toMatchObject({
      message: 'You do not manage this agent',
      code: 'AGENT_ACCESS_DENIED',
    });

    expect(capturedInserts).toHaveLength(0);
    expect(mockProcessOnchainRegistration).not.toHaveBeenCalled();
  });

  it('registers an agent on EVM, charges the owner, and persists wallet state when needed', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);
    mockProvisionAgentPrivyWallet.mockResolvedValue({
      privyId: 'did:privy:agent-1',
      privyWalletId: 'wallet-1',
      walletAddress: '0xAbC0000000000000000000000000000000000123',
      offlineWalletReady: true,
      createdPrivyUser: true,
      createdWallet: true,
      updatedSigner: false,
    });
    mockProcessOnchainRegistration.mockResolvedValue({
      message: 'Successfully registered agent on-chain via Agent0',
      tokenId: 321,
      txHash: '0xdeadbeef',
      alreadyRegistered: false,
      userId: 'agent-1',
    });

    const result = await registerAgentOnEvmForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(false);
    expect(result.tokenId).toBe(321);
    expect(result.walletAddress).toBe(
      '0xabc0000000000000000000000000000000000123'
    );
    expect(mockProvisionAgentPrivyWallet).toHaveBeenCalledWith({
      agentUserId: 'agent-1',
      existingPrivyId: null,
    });
    expect(mockProcessOnchainRegistration).toHaveBeenCalledWith({
      user: {
        userId: 'agent-one',
        dbUserId: 'agent-1',
        privyId: 'did:privy:agent-1',
        isAgent: true,
      },
      walletAddress: '0xabc0000000000000000000000000000000000123',
      username: 'agent-one',
      displayName: 'Agent One',
      bio: 'Autonomous AI agent',
      profileImageUrl: undefined,
      coverImageUrl: undefined,
    });

    expect(capturedUpdates).toContainEqual(
      expect.objectContaining({
        privyId: 'did:privy:agent-1',
        privyWalletId: 'wallet-1',
        walletAddress: '0xabc0000000000000000000000000000000000123',
        offlineWalletReady: true,
      })
    );
    expect(capturedInserts).toHaveLength(1);
    expect(capturedInserts[0]).toEqual(
      expect.objectContaining({
        userId: 'owner-1',
        relatedId: 'agent-1',
        description: 'Agent EVM registration',
      })
    );
    expect(mockReleaseLock).toHaveBeenCalledTimes(1);
  });

  it('refunds the owner when registration fails', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([BASE_AGENT]);
    selectResults.push([{ virtualBalance: '900' }]);
    selectResults.push([{ virtualBalance: '1000' }]);
    mockProvisionAgentPrivyWallet.mockResolvedValue({
      privyId: 'did:privy:agent-1',
      privyWalletId: 'wallet-1',
      walletAddress: '0xAbC0000000000000000000000000000000000123',
      offlineWalletReady: true,
      createdPrivyUser: true,
      createdWallet: true,
      updatedSigner: false,
    });
    mockProcessOnchainRegistration.mockRejectedValue(
      new Error('Agent0 registration failed')
    );

    await expect(
      registerAgentOnEvmForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toThrow('Agent0 registration failed');

    expect(capturedInserts).toHaveLength(2);
    expect(capturedInserts[1]).toEqual(
      expect.objectContaining({
        userId: 'owner-1',
        relatedId: 'agent-1',
        description: 'Refund - agent EVM registration failed',
      })
    );
  });

  it('returns already-registered agents without charging points', async () => {
    const registeredAgent = {
      ...BASE_AGENT,
      walletAddress: '0xabc0000000000000000000000000000000000123',
      onChainRegistered: true,
      agent0TokenId: 456,
      registrationTxHash: '0xbeef',
    };
    selectResults.push([registeredAgent]);
    selectResults.push([registeredAgent]);

    const result = await registerAgentOnEvmForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(true);
    expect(result.tokenId).toBe(456);
    expect(result.cost).toBe(0);
    expect(capturedInserts).toHaveLength(0);
    expect(mockProcessOnchainRegistration).not.toHaveBeenCalled();
  });

  it('re-checks registration state after acquiring the lock to avoid charging a stale second request', async () => {
    selectResults.push([BASE_AGENT]);
    selectResults.push([
      {
        ...BASE_AGENT,
        walletAddress: '0xabc0000000000000000000000000000000000123',
        onChainRegistered: true,
        agent0TokenId: 456,
        registrationTxHash: '0xbeef',
      },
    ]);

    const result = await registerAgentOnEvmForOwner({
      ownerUserId: 'owner-1',
      agentUserId: 'agent-1',
    });

    expect(result.alreadyRegistered).toBe(true);
    expect(result.tokenId).toBe(456);
    expect(result.cost).toBe(0);
    expect(capturedInserts).toHaveLength(0);
    expect(mockProcessOnchainRegistration).not.toHaveBeenCalled();
  });

  it('rejects concurrent registration attempts for the same agent before charging points', async () => {
    mockAcquireLock.mockResolvedValueOnce(false);
    selectResults.push([BASE_AGENT]);

    await expect(
      registerAgentOnEvmForOwner({
        ownerUserId: 'owner-1',
        agentUserId: 'agent-1',
      })
    ).rejects.toMatchObject({
      message:
        'An EVM registration attempt is already in progress for this agent. Please retry in a moment.',
      code: 'AGENT_EVM_REGISTRATION_IN_PROGRESS',
    });

    expect(capturedInserts).toHaveLength(0);
    expect(mockProcessOnchainRegistration).not.toHaveBeenCalled();
    expect(mockReleaseLock).not.toHaveBeenCalled();
  });
});
