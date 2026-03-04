/**
 * Wallet Balance Store - Powered by TanStack Query via generated hooks
 *
 * This module preserves the same public API as the original Zustand store
 * but delegates all data fetching to the Orval-generated useGetUserBalance hook.
 * TanStack Query natively handles:
 *   - Request deduplication
 *   - TTL-based caching (staleTime)
 *   - Background refetching
 *   - Polling (refetchInterval)
 *   - Cancellation on unmount
 *
 * Usage unchanged:
 * ```tsx
 * import { useWalletBalance, useWalletBalancePolling } from '@/stores/walletBalanceStore';
 *
 * function MyComponent() {
 *   const { balance, lifetimePnL, loading } = useWalletBalance(userId);
 *   useWalletBalancePolling(userId);
 * }
 * ```
 */

import {
  getGetUserBalanceQueryKey,
  useGetUserBalance,
} from '@babylon/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

/**
 * Hook for consuming wallet balance data.
 *
 * Backed by the generated useGetUserBalance hook from the OpenAPI spec.
 * Returns the same shape as the original Zustand store for drop-in compatibility.
 */
export function useWalletBalance(userId?: string | null) {
  const result = useGetUserBalance(userId ?? '', {
    query: {
      enabled: !!userId,
      staleTime: 5_000,
      queryKey: getGetUserBalanceQueryKey(userId ?? ''),
    },
  });

  const { refetch } = result;
  const refresh = useCallback(() => {
    if (userId) {
      return refetch().then(() => {});
    }
    return Promise.resolve();
  }, [userId, refetch]);

  const errorMessage = result.error
    ? result.error instanceof Error
      ? result.error.message
      : String(result.error)
    : null;

  return {
    balance: result.data ? Number(result.data.balance) || 0 : 0,
    lifetimePnL: result.data ? Number(result.data.lifetimePnL) || 0 : 0,
    loading: result.isLoading,
    error: errorMessage,
    refresh,
  };
}

/**
 * Hook for enabling wallet balance polling.
 * Automatically refetches balance at the given interval when active.
 *
 * Uses TanStack Query's native refetchInterval instead of manual setInterval.
 */
export function useWalletBalancePolling(
  userId?: string | null,
  intervalMs = 15_000
) {
  useGetUserBalance(userId ?? '', {
    query: {
      enabled: !!userId,
      staleTime: 5_000,
      refetchInterval: userId ? intervalMs : false,
      queryKey: getGetUserBalanceQueryKey(userId ?? ''),
    },
  });
}

/**
 * Invalidate the balance cache.
 * Call after actions that affect balance (trading, deposits, etc.)
 *
 * Must be called within a React component or hook that has access to QueryClient.
 * For use outside React, use refreshWalletBalance instead.
 */
function getGlobalQueryClient():
  | import('@tanstack/react-query').QueryClient
  | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  return (
    (win.__queryClient as import('@tanstack/react-query').QueryClient) ?? null
  );
}

export function invalidateWalletBalance() {
  const qc = getGlobalQueryClient();
  if (qc) {
    void qc.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0].includes('/api/users/') &&
        query.queryKey[0].includes('/balance'),
    });
  }
}

/**
 * Force refresh the balance for a specific user.
 * Returns a promise that resolves when the refresh is complete.
 */
export async function refreshWalletBalance(userId: string) {
  const qc = getGlobalQueryClient();
  if (qc) {
    await qc.invalidateQueries({
      queryKey: getGetUserBalanceQueryKey(userId),
    });
  }
}

/**
 * Hook that exposes the QueryClient for imperative invalidation.
 * Call once in a top-level provider to enable invalidateWalletBalance().
 */
export function useWalletBalanceQueryClientBridge() {
  const queryClient = useQueryClient();
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__queryClient = queryClient;
  }, [queryClient]);
}
