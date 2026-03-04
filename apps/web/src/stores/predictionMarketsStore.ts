/**
 * Prediction Markets Store — Powered by TanStack Query
 *
 * Uses the generated useListPredictionMarkets hook for data fetching
 * with TanStack Query handling caching, dedup, and polling.
 *
 * Preserves the same public API as the original Zustand store.
 */

import {
  getListPredictionMarketsQueryKey,
  useListPredictionMarkets,
} from '@babylon/api-hooks';
import { useCallback, useMemo } from 'react';
import { MARKETS_CONFIG } from '@/types/markets';

export type { PredictionMarket } from '@/types/markets';

export function usePredictionMarkets(_userId?: string) {
  const { data, isLoading, error, refetch } = useListPredictionMarkets({
    query: {
      staleTime: MARKETS_CONFIG.CACHE_TTL_MS,
      queryKey: getListPredictionMarketsQueryKey(),
    },
  });

  const markets =
    (data?.questions as unknown as import('@/types/markets').PredictionMarket[]) ??
    [];

  const refetchMarkets = useCallback(() => {
    return refetch().then(() => {});
  }, [refetch]);

  return {
    markets,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    refetch: refetchMarkets,
  };
}

export function usePredictionMarketsPolling(
  intervalMs = 30_000,
  _userId?: string
) {
  useListPredictionMarkets({
    query: {
      staleTime: MARKETS_CONFIG.CACHE_TTL_MS,
      refetchInterval: intervalMs,
      queryKey: getListPredictionMarketsQueryKey(),
    },
  });
}

export function usePredictionMarket(marketId: string | number) {
  const { markets, loading, error, refetch } = usePredictionMarkets();

  const market = useMemo(
    () => markets.find((m) => String(m.id) === String(marketId)),
    [markets, marketId]
  );

  return { market, loading, error, refetch };
}

export function useActivePredictionMarkets() {
  const { markets, loading, error, refetch } = usePredictionMarkets();

  const activeMarkets = useMemo(
    () => markets.filter((m) => m.status === 'active'),
    [markets]
  );

  return { markets: activeMarkets, loading, error, refetch };
}

export function usePredictionMarketsStats() {
  const { markets, loading } = usePredictionMarkets();

  const stats = useMemo(
    () => ({
      total: markets.length,
      active: markets.filter((m) => m.status === 'active').length,
      resolved: markets.filter((m) => m.status === 'resolved').length,
      totalVolume: markets.reduce(
        (sum, m) => sum + (m.yesShares || 0) + (m.noShares || 0),
        0
      ),
    }),
    [markets]
  );

  return { stats, loading };
}

export function invalidatePredictionMarketsCache() {
  const win =
    typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>)
      : null;
  const qc = win?.__queryClient as
    | import('@tanstack/react-query').QueryClient
    | undefined;
  if (qc) {
    void qc.invalidateQueries({
      queryKey: getListPredictionMarketsQueryKey(),
    });
  }
}
