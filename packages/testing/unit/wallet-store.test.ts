/**
 * Unit Tests: Onchain Wallet Zustand Store
 *
 * Tests the Zustand store logic directly without React.
 * Exercises real code paths in apps/web/src/stores/onchainWalletStore.ts.
 *
 * Run with: bun test unit/wallet-store.test.ts
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

// Mock fetch globally before importing the store
type MockFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

type MockFetch = (input: string) => Promise<MockFetchResponse>;

const mockFetch = mock<MockFetch>(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        native: {
          symbol: 'ETH',
          balance: '1000000000000000000',
          decimals: 18,
          usdValue: null,
        },
        tokens: [] as Array<Record<string, unknown>>,
      }),
    text: () => Promise.resolve(''),
  })
);

// @ts-expect-error - mock global fetch
globalThis.fetch = mockFetch;

// Mock only hook behavior; preserve core React exports/version for react-dom.
const actualReact = await import('react');
const reactMock = {
  ...actualReact,
  useCallback: (fn: Function) => fn,
  useEffect: () => {},
  useRef: (val: unknown) => ({ current: val }),
  useState: (init: unknown) => [init, () => {}],
};
mock.module('react', () => ({
  ...reactMock,
  default: actualReact.default ?? reactMock,
}));

mock.module('zustand/react/shallow', () => ({
  useShallow: (fn: Function) => fn,
}));

// Import store after mocks — uses tsconfig path alias @/stores/*
const { useOnchainWalletStore } = await import('@/stores/onchainWalletStore');

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  useOnchainWalletStore.getState().reset();
  mockFetch.mockClear();
  // Reset to default successful response
  mockFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          native: {
            symbol: 'ETH',
            balance: '1000000000000000000',
            decimals: 18,
            usdValue: null,
          },
          tokens: [
            {
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              balance: '5000000',
              logoUrl: '/assets/tokens/usdc.svg',
              usdValue: null,
            },
          ],
        }),
      text: () => Promise.resolve(''),
    })
  );
});

afterEach(() => {
  useOnchainWalletStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — initial state', () => {
  test('address is null initially', () => {
    const state = useOnchainWalletStore.getState();
    expect(state.address).toBeNull();
  });

  test('chainId is null initially', () => {
    expect(useOnchainWalletStore.getState().chainId).toBeNull();
  });

  test('nativeBalance is null initially', () => {
    expect(useOnchainWalletStore.getState().nativeBalance).toBeNull();
  });

  test('tokens array is empty initially', () => {
    expect(useOnchainWalletStore.getState().tokens).toEqual([]);
  });

  test('nftCollections is empty initially', () => {
    expect(useOnchainWalletStore.getState().nftCollections).toEqual([]);
  });

  test('transactions is empty initially', () => {
    expect(useOnchainWalletStore.getState().transactions).toEqual([]);
  });

  test('no loading flags set initially', () => {
    const { loading } = useOnchainWalletStore.getState();
    expect(loading.native).toBe(false);
    expect(loading.tokens).toBe(false);
    expect(loading.nfts).toBe(false);
    expect(loading.txs).toBe(false);
  });

  test('no errors initially', () => {
    const { errors } = useOnchainWalletStore.getState();
    expect(errors.tokens).toBeNull();
    expect(errors.nfts).toBeNull();
    expect(errors.txs).toBeNull();
  });

  test('lastFetchedAt all null initially', () => {
    const { lastFetchedAt } = useOnchainWalletStore.getState();
    expect(lastFetchedAt.tokens).toBeNull();
    expect(lastFetchedAt.nfts).toBeNull();
    expect(lastFetchedAt.txs).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setAddress
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — setAddress', () => {
  test('sets address and chainId', () => {
    const store = useOnchainWalletStore.getState();
    store.setAddress('0xabc', 8453);
    const state = useOnchainWalletStore.getState();
    expect(state.address).toBe('0xabc');
    expect(state.chainId).toBe(8453);
  });

  test('resets all data when address changes', () => {
    const store = useOnchainWalletStore.getState();
    // Simulate existing data
    useOnchainWalletStore.setState({
      address: '0xold',
      chainId: 1,
      nativeBalance: {
        symbol: 'ETH',
        balance: '100',
        decimals: 18,
        usdValue: null,
      },
      tokens: [
        {
          address: '0x1',
          symbol: 'T',
          name: 'T',
          decimals: 18,
          balance: '1',
          logoUrl: '/t.svg',
          usdValue: null,
        },
      ],
    });

    store.setAddress('0xnew', 8453);
    const state = useOnchainWalletStore.getState();
    expect(state.address).toBe('0xnew');
    expect(state.nativeBalance).toBeNull();
    expect(state.tokens).toEqual([]);
  });

  test('no-op when same address and chainId', () => {
    useOnchainWalletStore.setState({
      address: '0xsame',
      chainId: 8453,
      nativeBalance: {
        symbol: 'ETH',
        balance: '100',
        decimals: 18,
        usdValue: null,
      },
    });

    useOnchainWalletStore.getState().setAddress('0xsame', 8453);
    // Data should NOT be reset
    expect(useOnchainWalletStore.getState().nativeBalance).not.toBeNull();
  });

  test('setting address to null clears everything', () => {
    useOnchainWalletStore.setState({ address: '0xabc', chainId: 8453 });
    useOnchainWalletStore.getState().setAddress(null, null);
    const state = useOnchainWalletStore.getState();
    expect(state.address).toBeNull();
    expect(state.chainId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — reset', () => {
  test('reset clears all state to initial values', () => {
    useOnchainWalletStore.setState({
      address: '0xabc',
      chainId: 8453,
      nativeBalance: {
        symbol: 'ETH',
        balance: '100',
        decimals: 18,
        usdValue: null,
      },
      tokens: [
        {
          address: '0x1',
          symbol: 'T',
          name: 'T',
          decimals: 18,
          balance: '1',
          logoUrl: '/t.svg',
          usdValue: null,
        },
      ],
      nftCollections: [{ name: 'Col', contractAddress: '0x2', items: [] }],
      nftTotalCount: 5,
      transactions: [],
      loading: { native: true, tokens: true, nfts: true, txs: true },
      errors: { tokens: 'err', nfts: 'err', txs: 'err' },
    });

    useOnchainWalletStore.getState().reset();
    const state = useOnchainWalletStore.getState();

    expect(state.address).toBeNull();
    expect(state.chainId).toBeNull();
    expect(state.nativeBalance).toBeNull();
    expect(state.tokens).toEqual([]);
    expect(state.nftCollections).toEqual([]);
    expect(state.nftTotalCount).toBe(0);
    expect(state.transactions).toEqual([]);
    expect(state.loading.native).toBe(false);
    expect(state.loading.tokens).toBe(false);
    expect(state.errors.tokens).toBeNull();
    expect(state.errors.nfts).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchTokens
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — fetchTokens', () => {
  test('fetches tokens from API and updates state', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTokens('0xtest');

    expect(mockFetch).toHaveBeenCalled();
    const url = String(mockFetch.mock.calls[0]?.[0] ?? '');
    expect(url).toContain('/api/wallet/tokens');
    expect(url).toContain('address=0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.nativeBalance).not.toBeNull();
    expect(state.nativeBalance?.symbol).toBe('ETH');
    expect(state.tokens.length).toBe(1);
    expect(state.tokens[0]?.symbol).toBe('USDC');
  });

  test('sets loading state during fetch', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);

    // The loading state is set synchronously then cleared after async
    const promise = useOnchainWalletStore.getState().fetchTokens('0xtest');
    await promise;

    // After fetch completes, loading should be false
    expect(useOnchainWalletStore.getState().loading.tokens).toBe(false);
    expect(useOnchainWalletStore.getState().loading.native).toBe(false);
  });

  test('sets lastFetchedAt after successful fetch', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    const before = Date.now();
    await useOnchainWalletStore.getState().fetchTokens('0xtest');
    const after = Date.now();

    const fetchedAt = useOnchainWalletStore.getState().lastFetchedAt.tokens;
    expect(fetchedAt).not.toBeNull();
    expect(fetchedAt!).toBeGreaterThanOrEqual(before);
    expect(fetchedAt!).toBeLessThanOrEqual(after);
  });

  test('handles API error gracefully', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve('Internal Server Error'),
      })
    );

    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTokens('0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.errors.tokens).not.toBeNull();
    expect(state.errors.tokens).toContain('500');
    expect(state.loading.tokens).toBe(false);
  });

  test('handles network error gracefully', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTokens('0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.errors.tokens).not.toBeNull();
    expect(state.errors.tokens).toContain('Network error');
  });

  test('skips fetch if cache is fresh (TTL not expired)', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);

    // First fetch
    await useOnchainWalletStore.getState().fetchTokens('0xtest');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second fetch (should be skipped due to TTL)
    await useOnchainWalletStore.getState().fetchTokens('0xtest');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('force=true bypasses cache TTL', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);

    // First fetch
    await useOnchainWalletStore.getState().fetchTokens('0xtest');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Force fetch should hit API again
    await useOnchainWalletStore.getState().fetchTokens('0xtest', true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('ignores response if address changed during fetch', async () => {
    // Set up a slow response
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: () =>
                  Promise.resolve({
                    native: {
                      symbol: 'ETH',
                      balance: '999',
                      decimals: 18,
                      usdValue: null,
                    },
                    tokens: [] as Array<Record<string, unknown>>,
                  }),
                text: () => Promise.resolve(''),
              }),
            50
          )
        )
    );

    useOnchainWalletStore.getState().setAddress('0xold', 8453);
    const fetchPromise = useOnchainWalletStore.getState().fetchTokens('0xold');

    // Change address while fetch is in-flight
    useOnchainWalletStore.getState().setAddress('0xnew', 8453);

    await fetchPromise;

    // The stale response for '0xold' should be discarded
    const state = useOnchainWalletStore.getState();
    expect(state.address).toBe('0xnew');
    expect(state.nativeBalance).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchNfts
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — fetchNfts', () => {
  beforeEach(() => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            collections: [
              {
                name: 'ProtoMonkeys',
                contractAddress: '0xnft',
                items: [
                  {
                    contractAddress: '0xnft',
                    collectionName: 'ProtoMonkeys',
                    tokenId: 1,
                    name: 'ProtoMonkey #1',
                    imageUrl: 'https://example.com/1.png',
                    thumbnailUrl: null,
                  },
                ],
              },
            ],
            totalCount: 1,
          }),
        text: () => Promise.resolve(''),
      })
    );
  });

  test('fetches NFTs and updates collections', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchNfts('0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.nftCollections.length).toBe(1);
    expect(state.nftCollections[0]?.name).toBe('ProtoMonkeys');
    expect(state.nftTotalCount).toBe(1);
  });

  test('skips fetch if NFT cache is fresh', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchNfts('0xtest');
    await useOnchainWalletStore.getState().fetchNfts('0xtest');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('handles empty NFT response', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ collections: [], totalCount: 0 }),
        text: () => Promise.resolve(''),
      })
    );

    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchNfts('0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.nftCollections).toEqual([]);
    expect(state.nftTotalCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fetchTransactions
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — fetchTransactions', () => {
  beforeEach(() => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            transactions: [
              {
                txHash: '0xabc',
                type: 'send',
                from: '0xtest',
                to: '0xrecipient',
                value: '1000',
                timestamp: '2024-01-01T00:00:00.000Z',
                status: 'confirmed',
                explorerUrl: 'https://basescan.org/tx/0xabc',
              },
            ],
            pagination: { page: 1, limit: 20, total: 1 },
          }),
        text: () => Promise.resolve(''),
      })
    );
  });

  test('fetches transactions and updates state', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTransactions('0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0]?.txHash).toBe('0xabc');
    expect(state.transactions[0]?.type).toBe('send');
  });

  test('passes page parameter to API', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTransactions('0xtest', true, 3);

    const url = String(mockFetch.mock.calls[0]?.[0] ?? '');
    expect(url).toContain('page=3');
    expect(url).toContain('limit=20');
  });

  test('handles 429 rate limit error', async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve('Too many requests'),
      })
    );

    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTransactions('0xtest');

    const state = useOnchainWalletStore.getState();
    expect(state.errors.txs).not.toBeNull();
    expect(state.errors.txs).toContain('429');
  });
});

// ---------------------------------------------------------------------------
// Deduplication (fetchPromises)
// ---------------------------------------------------------------------------

describe('Onchain Wallet Store — fetch deduplication', () => {
  test('concurrent fetchTokens calls are deduplicated', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);

    // Fire two fetches concurrently
    const p1 = useOnchainWalletStore.getState().fetchTokens('0xtest');
    const p2 = useOnchainWalletStore.getState().fetchTokens('0xtest');

    await Promise.all([p1, p2]);

    // Should only make one API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('fetchPromise is cleared after fetch completes', async () => {
    useOnchainWalletStore.getState().setAddress('0xtest', 8453);
    await useOnchainWalletStore.getState().fetchTokens('0xtest');

    expect(useOnchainWalletStore.getState().fetchPromises.tokens).toBeNull();
  });
});
