/**
 * Perp Markets Store - Centralized state management for perpetual markets data
 *
 * This store prevents duplicate API calls by:
 * 1. Caching data with a TTL (10 seconds)
 * 2. Deduplicating concurrent requests via a fetchPromise
 * 3. Providing a single polling mechanism that all components share
 *
 * Usage:
 * ```tsx
 * import { usePerpMarkets, usePerpMarketsPolling } from '@/stores/perpMarketsStore';
 *
 * function MyComponent() {
 *   const { markets, loading, error, refetch } = usePerpMarkets();
 *   usePerpMarketsPolling(30000); // Optional: enable polling every 30s
 *   return <div>{markets.map(m => ...)}</div>;
 * }
 * ```
 */

import { create } from 'zustand';
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { logger } from '@babylon/shared';

/**
 * Perp market data structure from API
 */
export interface PerpMarket {
  ticker: string;
  organizationId: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: {
    rate: number;
    nextFundingTime: string;
    predictedRate: number;
  };
  maxLeverage: number;
  minOrderSize: number;
}

interface PerpMarketsState {
  // Data
  markets: PerpMarket[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // Internal state for request deduplication
  fetchPromise: Promise<void> | null;
  pollingInterval: ReturnType<typeof setInterval> | null;
  subscriberCount: number;

  // Actions
  fetchMarkets: (force?: boolean) => Promise<void>;
  subscribe: (intervalMs: number) => () => void;
}

// Cache TTL in milliseconds (10 seconds)
const CACHE_TTL = 10000;

export const usePerpMarketsStore = create<PerpMarketsState>((set, get) => ({
  markets: [],
  loading: false,
  error: null,
  lastFetchedAt: null,
  fetchPromise: null,
  pollingInterval: null,
  subscriberCount: 0,

  fetchMarkets: async (force = false) => {
    const state = get();

    // Return existing promise if already fetching (deduplication)
    if (state.fetchPromise) {
      return state.fetchPromise;
    }

    // Return cached data if fresh and not forced
    if (
      !force &&
      state.lastFetchedAt &&
      Date.now() - state.lastFetchedAt < CACHE_TTL &&
      state.markets.length > 0
    ) {
      return;
    }

    // Create and store the fetch promise
    const fetchPromise = (async () => {
      // Only show loading on initial fetch (not background refreshes)
      if (state.markets.length === 0) {
        set({ loading: true });
      }
      set({ error: null });

      try {
        const response = await fetch('/api/markets/perps');
        if (!response.ok) {
          throw new Error(`Failed to fetch perp markets: ${response.status}`);
        }

        const data = await response.json();
        if (data.markets && Array.isArray(data.markets)) {
          set({
            markets: data.markets,
            lastFetchedAt: Date.now(),
            error: null,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch markets';
        logger.error(
          'Failed to fetch perp markets',
          { error: err },
          'perpMarketsStore'
        );
        set({ error: errorMessage });
      } finally {
        set({ loading: false, fetchPromise: null });
      }
    })();

    set({ fetchPromise });
    return fetchPromise;
  },

  // Combined subscribe/unsubscribe that handles polling lifecycle
  subscribe: (intervalMs: number) => {
    const state = get();
    const newCount = state.subscriberCount + 1;
    set({ subscriberCount: newCount });

    // Start polling on first subscriber
    if (newCount === 1) {
      // Initial fetch
      get().fetchMarkets();

      // Set up interval
      const interval = setInterval(() => {
        get().fetchMarkets(true);
      }, intervalMs);

      set({ pollingInterval: interval });
    }

    // Return unsubscribe function
    return () => {
      const currentState = get();
      const updatedCount = currentState.subscriberCount - 1;
      set({ subscriberCount: updatedCount });

      // Stop polling when last subscriber leaves
      if (updatedCount === 0 && currentState.pollingInterval) {
        clearInterval(currentState.pollingInterval);
        set({ pollingInterval: null });
      }
    };
  },
}));

// Selector for data (memoized by zustand)
const dataSelector = (state: PerpMarketsState) => ({
  markets: state.markets,
  loading: state.loading,
  error: state.error,
});

/**
 * Hook for consuming perp markets data
 * Automatically fetches data on mount if not cached
 */
export function usePerpMarkets() {
  // Single subscription with shallow comparison for the object
  const { markets, loading, error } = usePerpMarketsStore(
    useShallow(dataSelector)
  );
  const fetchMarkets = usePerpMarketsStore((state) => state.fetchMarkets);

  // Fetch on mount if needed
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const refetch = useCallback(() => {
    return fetchMarkets(true);
  }, [fetchMarkets]);

  return { markets, loading, error, refetch };
}

/**
 * Hook for enabling polling on perp markets
 * Uses reference counting so multiple components can request polling
 * and it only stops when all components unmount
 *
 * @param intervalMs - Polling interval in milliseconds (default: 30000)
 */
export function usePerpMarketsPolling(intervalMs = 30000) {
  const subscribe = usePerpMarketsStore((state) => state.subscribe);

  // Store interval in ref so it doesn't cause re-subscriptions
  const intervalRef = useRef(intervalMs);

  useEffect(() => {
    // Subscribe returns the unsubscribe function
    const unsubscribe = subscribe(intervalRef.current);
    return unsubscribe;
  }, [subscribe]);
}

/**
 * Get a specific market by ticker (memoized)
 */
export function usePerpMarket(ticker: string) {
  const { markets, loading, error, refetch } = usePerpMarkets();

  const market = useMemo(
    () =>
      markets.find((m) => m.ticker.toLowerCase() === ticker.toLowerCase()),
    [markets, ticker]
  );

  return { market, loading, error, refetch };
}

/**
 * Get top movers (gainers and losers) - memoized
 */
export function usePerpTopMovers(count = 4) {
  const { markets, loading, error, refetch } = usePerpMarkets();

  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...markets].sort(
      (a, b) => b.changePercent24h - a.changePercent24h
    );
    return {
      topGainers: sorted.slice(0, count),
      topLosers: sorted.slice(-count).reverse(),
    };
  }, [markets, count]);

  return { topGainers, topLosers, loading, error, refetch };
}
