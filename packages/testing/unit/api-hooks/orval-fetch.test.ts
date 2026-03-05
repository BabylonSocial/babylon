/**
 * Unit tests for the Orval custom fetch mutator.
 *
 * Tests the authentication, retry, and error handling logic in orvalFetch
 * without hitting real API endpoints.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

// orvalFetch checks `typeof window !== 'undefined'` so we need to polyfill it
// in Bun's test environment where `window` doesn't exist.
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis;
}

const originalFetch = globalThis.fetch;

let mockFetchImpl: (url: string, init?: RequestInit) => Promise<Response>;
let capturedRequests: { url: string; init?: RequestInit }[];

beforeEach(() => {
  capturedRequests = [];
  mockFetchImpl = () =>
    Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

  globalThis.fetch = ((url: string, init?: RequestInit) => {
    capturedRequests.push({ url, init });
    return mockFetchImpl(url, init);
  }) as typeof fetch;

  // Reset window state
  (globalThis as Record<string, unknown>).__privyGetAccessToken = undefined;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  (globalThis as Record<string, unknown>).__privyGetAccessToken = undefined;
});

// Dynamic import to get a fresh module for each describe block
async function importOrvalFetch() {
  // Clear module cache for fresh import
  // @ts-expect-error -- .ts extension required for bun runtime import
  const mod = await import('../../../../packages/api-hooks/src/orval-fetch.ts');
  return mod.orvalFetch as <T>(url: string, options: RequestInit) => Promise<T>;
}

describe('orvalFetch', () => {
  describe('authentication', () => {
    test('adds Authorization header when __privyGetAccessToken is available', async () => {
      const orvalFetch = await importOrvalFetch();
      (globalThis as Record<string, unknown>).__privyGetAccessToken = () =>
        Promise.resolve('test-token-123');

      await orvalFetch('/api/test', { method: 'GET' });

      expect(capturedRequests).toHaveLength(1);
      const headers = new Headers(capturedRequests[0]!.init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer test-token-123');
    });

    test('does not add Authorization header when token is null', async () => {
      const orvalFetch = await importOrvalFetch();
      (globalThis as Record<string, unknown>).__privyGetAccessToken = () =>
        Promise.resolve(null);

      await orvalFetch('/api/test', { method: 'GET' });

      expect(capturedRequests).toHaveLength(1);
      const headers = new Headers(capturedRequests[0]!.init?.headers);
      expect(headers.get('Authorization')).toBeNull();
    });

    test('does not override existing Authorization header', async () => {
      const orvalFetch = await importOrvalFetch();
      (globalThis as Record<string, unknown>).__privyGetAccessToken = () =>
        Promise.resolve('should-not-use');

      await orvalFetch('/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer existing-token' },
      });

      const headers = new Headers(capturedRequests[0]!.init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer existing-token');
    });

    test('includes credentials: include on all requests', async () => {
      const orvalFetch = await importOrvalFetch();

      await orvalFetch('/api/test', { method: 'GET' });

      expect(capturedRequests[0]!.init?.credentials).toBe('include');
    });
  });

  describe('401 retry', () => {
    test('retries with fresh token on 401 response', async () => {
      const orvalFetch = await importOrvalFetch();
      let callCount = 0;

      (globalThis as Record<string, unknown>).__privyGetAccessToken = () =>
        Promise.resolve(callCount++ === 0 ? 'expired-token' : 'fresh-token');

      mockFetchImpl = (_url, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get('Authorization') === 'Bearer expired-token') {
          return Promise.resolve(
            new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );
      };

      const result = await orvalFetch<{ success: boolean }>('/api/test', {
        method: 'GET',
      });

      expect(capturedRequests).toHaveLength(2);
      expect(result.success).toBe(true);
      const retryHeaders = new Headers(capturedRequests[1]!.init?.headers);
      expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token');
    });

    test('throws if retry also fails', async () => {
      const orvalFetch = await importOrvalFetch();
      (globalThis as Record<string, unknown>).__privyGetAccessToken = () =>
        Promise.resolve('always-expired');

      mockFetchImpl = () =>
        Promise.resolve(
          new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
          })
        );

      await expect(
        orvalFetch('/api/test', { method: 'GET' })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    test('throws Error with status for non-OK responses', async () => {
      const orvalFetch = await importOrvalFetch();

      mockFetchImpl = () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'Not found' }), {
            status: 404,
            statusText: 'Not Found',
          })
        );

      try {
        await orvalFetch('/api/test', { method: 'GET' });
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        const error = err as Error & { status: number };
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Not found');
        expect(error.status).toBe(404);
      }
    });

    test('extracts message from error.message field', async () => {
      const orvalFetch = await importOrvalFetch();

      mockFetchImpl = () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ error: { message: 'Detailed error' } }),
            { status: 500, statusText: 'Internal Server Error' }
          )
        );

      try {
        await orvalFetch('/api/test', { method: 'GET' });
        expect(true).toBe(false);
      } catch (err) {
        expect((err as Error).message).toBe('Detailed error');
      }
    });

    test('falls back to statusText when no JSON body', async () => {
      const orvalFetch = await importOrvalFetch();

      mockFetchImpl = () =>
        Promise.resolve(
          new Response('', { status: 503, statusText: 'Service Unavailable' })
        );

      try {
        await orvalFetch('/api/test', { method: 'GET' });
        expect(true).toBe(false);
      } catch (err) {
        expect((err as Error).message).toBe('Service Unavailable');
      }
    });
  });

  describe('response parsing', () => {
    test('returns parsed JSON for successful responses', async () => {
      const orvalFetch = await importOrvalFetch();

      mockFetchImpl = () =>
        Promise.resolve(
          new Response(JSON.stringify({ data: [1, 2, 3] }), { status: 200 })
        );

      const result = await orvalFetch<{ data: number[] }>('/api/test', {
        method: 'GET',
      });
      expect(result.data).toEqual([1, 2, 3]);
    });

    test('returns empty object for 204 No Content', async () => {
      const orvalFetch = await importOrvalFetch();

      mockFetchImpl = () =>
        Promise.resolve(new Response(null, { status: 204 }));

      const result = await orvalFetch<Record<string, unknown>>('/api/test', {
        method: 'DELETE',
      });
      expect(result).toEqual({});
    });
  });
});
