/**
 * Perp Markets Store — Powered by TanStack Query with SSE real-time overlay
 *
 * Uses the generated useListPerpMarkets hook for data fetching (dedup, caching,
 * polling) while preserving real-time SSE updates for price/volume/OI changes.
 *
 * TanStack Query handles: caching (10s staleTime), request dedup, polling, refetch.
 * SSE handlers patch individual fields in the query cache without triggering refetches.
 */

import {
  getListPerpMarketsQueryKey,
  type ListPerpMarkets200,
  useListPerpMarkets,
} from '@babylon/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  type PerpPriceUpdateSSE,
  type PerpTradeSSE,
  usePerpMarketsSubscription,
  usePerpPriceSubscription,
} from '@/hooks/usePerpMarketStream';
import { MARKETS_CONFIG } from '@/types/markets';

export type { PerpMarket } from '@babylon/api-hooks';

interface MarketStatsUpdate {
  currentPrice?: number;
  changePercent24h?: number;
  openInterest?: number;
  volume24h?: number;
}

export function usePerpMarkets() {
  const { data, isLoading, error, refetch } = useListPerpMarkets({
    query: {
      staleTime: MARKETS_CONFIG.CACHE_TTL_MS,
      queryKey: getListPerpMarketsQueryKey(),
    },
  });

  const markets = data?.markets ?? [];

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

export function usePerpMarketsPolling(intervalMs = 30_000) {
  useListPerpMarkets({
    query: {
      staleTime: MARKETS_CONFIG.CACHE_TTL_MS,
      refetchInterval: intervalMs,
      queryKey: getListPerpMarketsQueryKey(),
    },
  });
}

export function usePerpMarketsRealtime() {
  const queryClient = useQueryClient();

  const updateMarketStats = useCallback(
    (ticker: string, stats: MarketStatsUpdate) => {
      queryClient.setQueryData<ListPerpMarkets200>(
        getListPerpMarketsQueryKey(),
        (old) => {
          if (!old?.markets) return old;
          const upperTicker = ticker.toUpperCase();
          return {
            ...old,
            markets: old.markets.map((market) => {
              if (market.ticker.toUpperCase() !== upperTicker) return market;
              return {
                ...market,
                ...(stats.currentPrice !== undefined && {
                  currentPrice: stats.currentPrice,
                }),
                ...(stats.changePercent24h !== undefined && {
                  changePercent24h: stats.changePercent24h,
                }),
                ...(stats.openInterest !== undefined && {
                  openInterest: stats.openInterest,
                }),
                ...(stats.volume24h !== undefined && {
                  volume24h: stats.volume24h,
                }),
              };
            }),
          };
        }
      );
    },
    [queryClient]
  );

  const handleTrade = useCallback(
    (event: PerpTradeSSE) => {
      updateMarketStats(event.ticker, {
        openInterest: event.openInterest,
        volume24h: event.volume24h,
      });
    },
    [updateMarketStats]
  );

  usePerpMarketsSubscription({ onTrade: handleTrade });

  usePerpPriceSubscription({
    onPriceUpdate: useCallback(
      (update: PerpPriceUpdateSSE) => {
        updateMarketStats(update.ticker, {
          currentPrice: update.newPrice ?? update.price,
          changePercent24h: update.changePercent,
        });
      },
      [updateMarketStats]
    ),
  });
}

export function usePerpMarket(ticker: string) {
  const { markets, loading, error, refetch } = usePerpMarkets();

  const market = useMemo(
    () => markets.find((m) => m.ticker.toLowerCase() === ticker.toLowerCase()),
    [markets, ticker]
  );

  return {
    market,
    loading,
    error,
    refetch,
    initialLoadComplete: markets.length > 0 || !loading,
  };
}

export function invalidatePerpMarketsCache() {
  const win =
    typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>)
      : null;
  const qc = win?.__queryClient as
    | import('@tanstack/react-query').QueryClient
    | undefined;
  if (qc) {
    void qc.invalidateQueries({ queryKey: getListPerpMarketsQueryKey() });
  }
}

/**
 * @deprecated Use usePerpMarkets() instead. Kept for backward compatibility
 * with components that import the raw store.
 */
export const usePerpMarketsStore = {
  getState: () => ({
    invalidateCache: invalidatePerpMarketsCache,
  }),
};
