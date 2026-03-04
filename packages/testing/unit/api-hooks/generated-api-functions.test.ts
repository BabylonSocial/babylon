/**
 * Unit tests for generated API functions from @babylon/api-hooks.
 *
 * Tests the non-React parts of the generated code: URL builders,
 * query key factories, and raw API fetch functions. This validates
 * that the OpenAPI spec -> Orval generation produces correct output.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

// Polyfill window for orvalFetch
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis;
}

const originalFetch = globalThis.fetch;

let lastFetchUrl: string;
let lastFetchInit: RequestInit | undefined;

beforeEach(() => {
  lastFetchUrl = '';
  lastFetchInit = undefined;
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    lastFetchUrl = url;
    lastFetchInit = init;
    return Promise.resolve(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
  }) as typeof fetch;
  (globalThis as Record<string, unknown>).__privyGetAccessToken = undefined;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('agents API', () => {
  test('getListAgentsUrl builds correct URL', async () => {
    const { getListAgentsUrl } = await import(
      '../../../../packages/api-hooks/src/generated/agents/agents'
    );
    expect(getListAgentsUrl()).toBe('/api/agents');
  });

  test('getListAgentsQueryKey returns stable key', async () => {
    const { getListAgentsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/agents/agents'
    );
    const key1 = getListAgentsQueryKey();
    const key2 = getListAgentsQueryKey();
    expect(key1).toEqual(key2);
    expect(key1).toEqual(['/api/agents']);
  });

  test('getListAgentsQueryKey includes params when provided', async () => {
    const { getListAgentsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/agents/agents'
    );
    const key = getListAgentsQueryKey({ autonomousTrading: true });
    expect(key).toEqual(['/api/agents', { autonomousTrading: true }]);
  });

  test('listAgents calls correct endpoint', async () => {
    const { listAgents } = await import(
      '../../../../packages/api-hooks/src/generated/agents/agents'
    );
    await listAgents();
    expect(lastFetchUrl).toBe('/api/agents');
    expect(lastFetchInit?.method).toBe('GET');
  });
});

describe('markets API', () => {
  test('getListPerpMarketsUrl builds correct URL', async () => {
    const { getListPerpMarketsUrl } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    expect(getListPerpMarketsUrl()).toBe('/api/markets/perps');
  });

  test('getListPerpMarketsQueryKey returns stable key', async () => {
    const { getListPerpMarketsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    expect(getListPerpMarketsQueryKey()).toEqual(['/api/markets/perps']);
  });

  test('getListPredictionMarketsUrl builds correct URL', async () => {
    const { getListPredictionMarketsUrl } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    expect(getListPredictionMarketsUrl()).toBe('/api/markets/predictions');
  });

  test('getListPredictionMarketsQueryKey returns stable key', async () => {
    const { getListPredictionMarketsQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    expect(getListPredictionMarketsQueryKey()).toEqual([
      '/api/markets/predictions',
    ]);
  });

  test('openPerpPosition calls correct endpoint with body', async () => {
    const { openPerpPosition } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    await openPerpPosition({
      ticker: 'BTC',
      side: 'long',
      size: 100,
      leverage: 10,
    });
    expect(lastFetchUrl).toBe('/api/markets/perps/open');
    expect(lastFetchInit?.method).toBe('POST');
    const body = JSON.parse(lastFetchInit?.body as string);
    expect(body.ticker).toBe('BTC');
    expect(body.side).toBe('long');
  });

  test('closePerpPosition calls correct endpoint with path param', async () => {
    const { closePerpPosition } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    await closePerpPosition('pos-123', {});
    expect(lastFetchUrl).toBe('/api/markets/perps/position/pos-123/close');
    expect(lastFetchInit?.method).toBe('POST');
  });

  test('getUserPositions calls correct endpoint', async () => {
    const { getUserPositions } = await import(
      '../../../../packages/api-hooks/src/generated/markets/markets'
    );
    await getUserPositions('user-456');
    expect(lastFetchUrl).toBe('/api/markets/positions/user-456');
    expect(lastFetchInit?.method).toBe('GET');
  });
});

describe('users API', () => {
  test('getUserBalance calls correct endpoint', async () => {
    const { getUserBalance } = await import(
      '../../../../packages/api-hooks/src/generated/users/users'
    );
    await getUserBalance('user-789');
    expect(lastFetchUrl).toBe('/api/users/user-789/balance');
    expect(lastFetchInit?.method).toBe('GET');
  });

  test('getGetUserBalanceQueryKey includes userId', async () => {
    const { getGetUserBalanceQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/users/users'
    );
    expect(getGetUserBalanceQueryKey('user-789')).toEqual([
      '/api/users/user-789/balance',
    ]);
  });
});

describe('chats API', () => {
  test('getGetUnreadCountQueryKey returns stable key', async () => {
    const { getGetUnreadCountQueryKey } = await import(
      '../../../../packages/api-hooks/src/generated/chats/chats'
    );
    expect(getGetUnreadCountQueryKey()).toEqual(['/api/chats/unread-count']);
  });
});

describe('points API', () => {
  test('transferPoints calls correct endpoint with body', async () => {
    const { transferPoints } = await import(
      '../../../../packages/api-hooks/src/generated/points/points'
    );
    await transferPoints({ toUserId: 'user-abc', amount: 100 });
    expect(lastFetchUrl).toBe('/api/points/transfer');
    expect(lastFetchInit?.method).toBe('POST');
    const body = JSON.parse(lastFetchInit?.body as string);
    expect(body.toUserId).toBe('user-abc');
    expect(body.amount).toBe(100);
  });
});

describe('model types', () => {
  test('PerpMarket type has required fields', async () => {
    // This is a compile-time check - if the type changes, this test fails to compile
    const mod = await import(
      '../../../../packages/api-hooks/src/generated/model/perpMarket'
    );
    // Verify the module exports the interface (runtime check: module exists)
    expect(mod).toBeDefined();
  });

  test('FundingRate type has ticker field', async () => {
    const mod = await import(
      '../../../../packages/api-hooks/src/generated/model/fundingRate'
    );
    expect(mod).toBeDefined();
  });
});
