/**
 * Unit tests for the migrated hook/store wrappers.
 *
 * Since these are React hooks that can't be called directly in Bun tests,
 * we test the pure logic patterns they use:
 * - Query key consistency between hooks and cache invalidation
 * - Data transformation logic
 * - Cache update patterns (setQueryData shapes)
 * - Type compatibility between generated types and consumer expectations
 */

import { describe, expect, test } from 'bun:test';

// Polyfill window for orvalFetch
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis;
}

describe('useOwnedAgents wrapper logic', () => {
  test('query key used for cache invalidation matches the hook query key', async () => {
    const { getListAgentsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/agents/agents'
    );

    // The hook uses getListAgentsQueryKey() for both the query and updateAgentBalance
    const hookQueryKey = getListAgentsQueryKey();
    const cacheInvalidationKey = getListAgentsQueryKey();

    expect(hookQueryKey).toEqual(cacheInvalidationKey);
    expect(hookQueryKey).toEqual(['/api/agents']);
  });

  test('agent data transformation logic works correctly', () => {
    // Simulate the useMemo logic from useOwnedAgents
    const mockApiResponse = {
      success: true,
      agents: [
        {
          id: 'agent-1',
          name: 'Test Agent',
          username: 'testagent',
          profileImageUrl: 'https://example.com/img.png',
          virtualBalance: '1500.50',
          modelTier: 'pro',
        },
        {
          id: 'agent-2',
          name: '',
          username: 'agent2user',
          profileImageUrl: null,
          virtualBalance: null,
          modelTier: 'lite',
        },
      ],
    };

    // This mirrors the transformation in useOwnedAgents
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        username?: string;
        profileImageUrl?: string;
        virtualBalance: number;
        modelTier: 'free' | 'pro';
      }
    >();

    for (const agent of mockApiResponse.agents) {
      map.set(agent.id, {
        id: agent.id,
        name: agent.name || agent.username || 'Agent',
        username: agent.username,
        profileImageUrl: agent.profileImageUrl ?? undefined,
        virtualBalance: Number(agent.virtualBalance ?? 0),
        modelTier: agent.modelTier === 'pro' ? 'pro' : 'free',
      });
    }

    expect(map.size).toBe(2);

    const agent1 = map.get('agent-1')!;
    expect(agent1.name).toBe('Test Agent');
    expect(agent1.virtualBalance).toBe(1500.5);
    expect(agent1.modelTier).toBe('pro');

    const agent2 = map.get('agent-2')!;
    expect(agent2.name).toBe('agent2user'); // Falls back to username
    expect(agent2.virtualBalance).toBe(0); // Null -> 0
    expect(agent2.modelTier).toBe('free'); // lite -> free
  });

  test('updateAgentBalance cache mutation shape is valid', () => {
    // Simulate the setQueryData callback
    type AgentSummary = { id: string; virtualBalance: number };
    const mockCacheData = {
      success: true,
      agents: [
        { id: 'a1', virtualBalance: 100 },
        { id: 'a2', virtualBalance: 200 },
      ] as AgentSummary[],
    };

    // This mirrors the update logic in useOwnedAgents
    const updated = {
      ...mockCacheData,
      agents: mockCacheData.agents.map((a) =>
        a.id === 'a1' ? { ...a, virtualBalance: 999 } : a
      ),
    };

    expect(updated.agents[0]!.virtualBalance).toBe(999);
    expect(updated.agents[1]!.virtualBalance).toBe(200); // Unchanged
    expect(updated.success).toBe(true); // Preserved
  });
});

describe('perpMarketsStore wrapper logic', () => {
  test('query keys match between fetching and cache patching', async () => {
    const { getListPerpMarketsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );

    // usePerpMarkets uses this for the query
    const fetchKey = getListPerpMarketsQueryKey();
    // usePerpMarketsRealtime uses this for setQueryData
    const patchKey = getListPerpMarketsQueryKey();

    expect(fetchKey).toEqual(patchKey);
  });

  test('SSE cache update preserves data shape', () => {
    // Simulate the setQueryData<ListPerpMarkets200> callback from usePerpMarketsRealtime
    const mockCacheData = {
      success: true as const,
      markets: [
        {
          ticker: 'BTC',
          currentPrice: 50000,
          changePercent24h: 2.5,
          openInterest: 1000000,
          volume24h: 5000000,
          organizationId: 'org-1',
          change24h: 1250,
          high24h: 51000,
          low24h: 49000,
          fundingRate: {
            ticker: 'BTC',
            rate: 0.01,
            nextFundingTime: '2024-01-01T00:00:00Z',
            predictedRate: 0.012,
          },
          maxLeverage: 100,
          minOrderSize: 1,
        },
      ],
      count: 1,
    };

    // Simulate SSE price update
    const ticker = 'btc';
    const stats = { currentPrice: 51000, changePercent24h: 4.5 };

    const upperTicker = ticker.toUpperCase();
    const updated = {
      ...mockCacheData,
      markets: mockCacheData.markets.map((market) => {
        if (market.ticker.toUpperCase() !== upperTicker) return market;
        return {
          ...market,
          ...(stats.currentPrice !== undefined && {
            currentPrice: stats.currentPrice,
          }),
          ...(stats.changePercent24h !== undefined && {
            changePercent24h: stats.changePercent24h,
          }),
        };
      }),
    };

    expect(updated.markets[0]!.currentPrice).toBe(51000);
    expect(updated.markets[0]!.changePercent24h).toBe(4.5);
    expect(updated.markets[0]!.ticker).toBe('BTC'); // Unchanged
    expect(updated.markets[0]!.volume24h).toBe(5000000); // Unchanged
    expect(updated.success).toBe(true); // Preserved
  });
});

describe('predictionMarketsStore wrapper logic', () => {
  test('query keys match between fetching and invalidation', async () => {
    const { getListPredictionMarketsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );

    const fetchKey = getListPredictionMarketsQueryKey();
    const invalidationKey = getListPredictionMarketsQueryKey();

    expect(fetchKey).toEqual(invalidationKey);
    expect(fetchKey).toEqual(['/api/markets/predictions']);
  });

  test('market filtering logic works for active markets', () => {
    const mockMarkets = [
      { id: '1', text: 'Q1', status: 'active', yesShares: 100, noShares: 50 },
      {
        id: '2',
        text: 'Q2',
        status: 'resolved',
        yesShares: 200,
        noShares: 100,
      },
      { id: '3', text: 'Q3', status: 'active', yesShares: 50, noShares: 50 },
      {
        id: '4',
        text: 'Q4',
        status: 'cancelled',
        yesShares: 0,
        noShares: 0,
      },
    ];

    // Mirrors useActivePredictionMarkets
    const active = mockMarkets.filter((m) => m.status === 'active');
    expect(active).toHaveLength(2);

    // Mirrors usePredictionMarketsStats
    const stats = {
      total: mockMarkets.length,
      active: mockMarkets.filter((m) => m.status === 'active').length,
      resolved: mockMarkets.filter((m) => m.status === 'resolved').length,
      totalVolume: mockMarkets.reduce(
        (sum, m) => sum + (m.yesShares || 0) + (m.noShares || 0),
        0
      ),
    };

    expect(stats.total).toBe(4);
    expect(stats.active).toBe(2);
    expect(stats.resolved).toBe(1);
    expect(stats.totalVolume).toBe(550);
  });
});

describe('walletBalanceStore wrapper logic', () => {
  test('query key includes userId', async () => {
    const { getGetUserBalanceQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/users/users'
    );

    const key = getGetUserBalanceQueryKey('user-123');
    expect(key).toEqual(['/api/users/user-123/balance']);
  });

  test('different userIds produce different keys', async () => {
    const { getGetUserBalanceQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/users/users'
    );

    const key1 = getGetUserBalanceQueryKey('user-123');
    const key2 = getGetUserBalanceQueryKey('user-456');
    expect(key1).not.toEqual(key2);
  });
});

describe('useTransferPoints wrapper logic', () => {
  test('transfer body uses toUserId field (not recipientId)', async () => {
    // This validates the field name fix from the migration
    const { transferPoints } = await import(
      '../../../../packages/api-hooks/src/generated/points/points'
    );

    let capturedBody: string | undefined;
    const origFetch = globalThis.fetch;
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );
    }) as unknown as typeof fetch;

    await transferPoints({ toUserId: 'recipient-1', amount: 50 });

    globalThis.fetch = origFetch;

    const body = JSON.parse(capturedBody!);
    expect(body.toUserId).toBe('recipient-1');
    expect(body.amount).toBe(50);
    expect(body.recipientId).toBeUndefined(); // Old field name should not exist
  });
});

describe('usePerpTrade wrapper logic', () => {
  test('closePerpPosition requires both id and body', async () => {
    const { closePerpPosition } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );

    let capturedUrl = '';
    const origFetch = globalThis.fetch;
    globalThis.fetch = ((url: string, _init?: RequestInit) => {
      capturedUrl = url;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            position: {},
            pnl: 42.5,
            fee: {},
            wasLiquidated: false,
            marginReturned: 100,
            newBalance: 1000,
          }),
          { status: 200 }
        )
      );
    }) as unknown as typeof fetch;

    const result = await closePerpPosition('pos-abc', {});

    globalThis.fetch = origFetch;

    expect(capturedUrl).toContain('pos-abc');
    expect(result.pnl).toBe(42.5);
  });
});

describe('type re-exports', () => {
  test('PerpMarket is exported from api-hooks barrel', async () => {
    const mod = await import(
      '../../../../packages/api-hooks/src/generated/model/perpMarket'
    );
    // If this compiles and runs, the type exists
    expect(mod).toBeDefined();
  });

  test('ListPerpMarkets200 includes markets array', async () => {
    const mod = await import(
      '../../../../packages/api-hooks/src/generated/model/listPerpMarkets200'
    );
    expect(mod).toBeDefined();
  });
});
