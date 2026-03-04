'use client';

import { logger } from '@babylon/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioPnL } from '@/hooks/usePortfolioPnL';
import {
  usePerpMarkets,
  usePerpMarketsRealtime,
} from '@/stores/perpMarketsStore';
import {
  useUserPositions,
  useUserPositionsPolling,
} from '@/stores/userPositionsStore';
import type {
  PerpMarket,
  PredictionMarketWithPosition,
  PredictionSort,
} from '@/types/markets';

// ============================================================================
// Constants
// ============================================================================

/** Debounce delay for search input (ms) - balances responsiveness with performance */
const SEARCH_DEBOUNCE_MS = 150;

/** Number of top trending/hot items to display in dashboard widgets */
const TOP_ITEMS_COUNT = 6;

/**
 * Trending score weights for perp markets.
 * Volume is weighted higher (70%) to prioritize liquid, actively traded markets.
 * Price change contributes 30% so volatile markets also get visibility.
 */
const TRENDING_WEIGHTS = {
  VOLUME: 70,
  CHANGE: 30,
} as const;

/**
 * Trending score weights for prediction markets.
 * Volume (total shares) is weighted 70% to prioritize active markets.
 * Recency is weighted 30% so newer markets get visibility.
 * Timestamp is normalized by 1_000_000 to bring it to a comparable scale with volume.
 */
const PREDICTION_TRENDING_WEIGHTS = {
  VOLUME: 0.7,
  RECENCY: 0.3,
  /** Divisor to normalize timestamp (ms) to comparable scale with share counts */
  TIME_NORMALIZER: 1_000_000,
} as const;

/**
 * Computed P&L data for a market category.
 */
export interface CategoryPnLData {
  unrealizedPnL: number;
  positionCount: number;
  totalValue: number;
  categorySpecific: {
    openInterest?: number;
    totalShares?: number;
  };
}

/**
 * Perp market with computed trending score.
 */
export interface TrendingPerpMarket extends PerpMarket {
  trendingScore: number;
}

/**
 * Prediction market with computed total shares.
 */
export interface TopPrediction extends PredictionMarketWithPosition {
  totalShares: number;
}

/**
 * Return type for the useMarketsPageData hook.
 */
export interface MarketsPageData {
  // Auth state
  user: ReturnType<typeof useAuth>['user'];
  authenticated: boolean;
  login: ReturnType<typeof useAuth>['login'];

  // Loading states
  loading: boolean;
  perpLoading: boolean;
  predictionsLoading: boolean;
  portfolioLoading: boolean;

  // Errors
  /** Error message when predictions fetch fails */
  predictionsError: string | null;

  // Raw data
  perpMarkets: PerpMarket[];
  predictions: PredictionMarketWithPosition[];

  // Positions
  perpPositions: ReturnType<typeof useUserPositions>['perpPositions'];
  predictionPositions: ReturnType<
    typeof useUserPositions
  >['predictionPositions'];

  // Portfolio
  portfolioPnL: ReturnType<typeof usePortfolioPnL>['data'];
  portfolioError: ReturnType<typeof usePortfolioPnL>['error'];
  /** Timestamp of last portfolio update (ms since epoch) */
  portfolioUpdatedAt: number | null;

  // Computed data
  trendingMarkets: TrendingPerpMarket[];
  topPredictions: TopPrediction[];
  perpPnLData: CategoryPnLData | null;
  predictionPnLData: CategoryPnLData | null;

  // Filtered/sorted data (based on search and sort)
  filteredPerpMarkets: PerpMarket[];
  activePredictions: PredictionMarketWithPosition[];
  resolvedPredictions: PredictionMarketWithPosition[];

  // Search and sort state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deferredSearchQuery: string;
  predictionSort: PredictionSort;
  setPredictionSort: (sort: PredictionSort) => void;

  // Actions
  handlePositionsRefresh: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  refetchData: () => Promise<void>;

  // Modal triggers
  balanceRefreshTrigger: number;
  triggerBalanceRefresh: () => void;
}

/**
 * Check if a prediction market is truly active.
 * A market is active if:
 * 1. Its status is 'active' AND
 * 2. Its end date has not passed yet
 *
 * Defined outside the hook for referential stability.
 */
function isPredictionActive(p: PredictionMarketWithPosition): boolean {
  if (p.status !== 'active') return false;
  if (!p.resolutionDate) return true;
  return new Date(p.resolutionDate).getTime() > Date.now();
}

/**
 * Check if a prediction market is expired or resolved.
 *
 * Defined outside the hook for referential stability.
 */
function isPredictionExpiredOrResolved(
  p: PredictionMarketWithPosition
): boolean {
  if (p.status === 'resolved') return true;
  // Expired: status is active but resolution date has passed
  if (!p.resolutionDate) return false;
  return new Date(p.resolutionDate).getTime() <= Date.now();
}

/**
 * Centralized data hook for the Markets page.
 *
 * Handles all data fetching, caching, computed values, and filtering
 * for the markets dashboard. Extracts data logic from the page component
 * to improve maintainability and testability.
 *
 * @returns Markets page data and actions
 */
export function useMarketsPageData(): MarketsPageData {
  const { user, authenticated, login } = useAuth();

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredSearchQuery, setDeferredSearchQuery] = useState('');
  const [predictionSort, setPredictionSort] =
    useState<PredictionSort>('trending');

  // Debounce search query for performance
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Perp markets from store with real-time SSE updates
  const {
    markets: perpMarkets,
    loading: perpLoading,
    refetch: refetchPerps,
  } = usePerpMarkets();

  // Enable real-time SSE updates for perp markets
  usePerpMarketsRealtime();

  // Predictions state
  const [predictions, setPredictions] = useState<
    PredictionMarketWithPosition[]
  >([]);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [predictionsError, setPredictionsError] = useState<string | null>(null);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);

  // Portfolio P&L
  const {
    data: portfolioPnL,
    loading: portfolioLoading,
    error: portfolioError,
    refresh: refreshPortfolio,
    lastUpdated: portfolioUpdatedAt,
  } = usePortfolioPnL();

  // User positions (from centralized store with caching)
  const {
    perpPositions,
    predictionPositions,
    refresh: refreshUserPositions,
  } = useUserPositions(authenticated ? user?.id : null);

  // Enable positions polling when authenticated
  useUserPositionsPolling(authenticated ? user?.id : null);

  // Refs to break dependency chains and stabilize callbacks
  const fetchDataRef = useRef<((signal?: AbortSignal) => Promise<void>) | null>(
    null
  );
  const refreshPositionsRef = useRef(refreshUserPositions);
  const refetchPerpsRef = useRef(refetchPerps);
  const authenticatedRef = useRef(authenticated);
  const userIdRef = useRef<string | null>(user?.id ?? null);
  const prevAuthRef = useRef<{
    authenticated: boolean;
    userId: string | null | undefined;
  } | null>(null);
  const hasMountedRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    authenticatedRef.current = authenticated;
    userIdRef.current = user?.id ?? null;
  }, [authenticated, user?.id]);

  useEffect(() => {
    refreshPositionsRef.current = refreshUserPositions;
  }, [refreshUserPositions]);

  useEffect(() => {
    refetchPerpsRef.current = refetchPerps;
  }, [refetchPerps]);

  // Combined loading state - only true for INITIAL load (no data yet)
  // This prevents flickering when refetching data in the background
  const loading =
    (perpLoading && perpMarkets.length === 0) ||
    (predictionsLoading && predictions.length === 0);

  /**
   * Fetches prediction markets data.
   * Sets predictionsError on failure, clears it on success.
   */
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const isAuth = authenticatedRef.current;
    const userId = userIdRef.current;

    const url = `/api/markets/predictions${isAuth && userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        const errorMsg = `Failed to load predictions (${response.status})`;
        logger.error(
          'Failed to fetch predictions',
          { status: response.status },
          'useMarketsPageData'
        );
        setPredictionsError(errorMsg);
        setPredictionsLoading(false);
        return;
      }

      const data = await response.json();
      setPredictions(data.questions ?? []);
      setPredictionsError(null); // Clear error on success

      if (isAuth && userId && refreshPositionsRef.current) {
        await refreshPositionsRef.current();
      }

      setBalanceRefreshTrigger(Date.now());
      setPredictionsLoading(false);
    } catch (err) {
      // Don't set error for abort - that's expected cleanup behavior
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load predictions';
      logger.error(
        'Failed to fetch predictions',
        { error: errorMsg },
        'useMarketsPageData'
      );
      setPredictionsError(errorMsg);
      setPredictionsLoading(false);
    }
  }, []);

  // Store fetchData in ref
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Refresh portfolio when balance changes
  useEffect(() => {
    if (!authenticated || !balanceRefreshTrigger) return;
    void refreshPortfolio();
  }, [authenticated, balanceRefreshTrigger, refreshPortfolio]);

  // Initial fetch and auth state change handling
  useEffect(() => {
    const controller = new AbortController();
    const currentAuth = { authenticated, userId: user?.id };

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevAuthRef.current = currentAuth;
      fetchData(controller.signal).catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          logger.warn(
            'Failed to fetch predictions',
            { error: err.message },
            'useMarketsPageData'
          );
        }
      });
      return () => controller.abort();
    }

    const prevAuth = prevAuthRef.current;
    if (
      prevAuth &&
      (prevAuth.authenticated !== currentAuth.authenticated ||
        prevAuth.userId !== currentAuth.userId)
    ) {
      prevAuthRef.current = currentAuth;
      fetchData(controller.signal).catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          logger.warn(
            'Failed to fetch predictions',
            { error: err.message },
            'useMarketsPageData'
          );
        }
      });
    }

    return () => controller.abort();
  }, [authenticated, user?.id, fetchData]);

  /**
   * Refreshes all position data and markets.
   * Uses refs to ensure stable callback identity.
   */
  const handlePositionsRefresh = useCallback(async () => {
    if (refreshPositionsRef.current) {
      await refreshPositionsRef.current();
    }
    if (refetchPerpsRef.current) {
      await refetchPerpsRef.current();
    }
    if (fetchDataRef.current) {
      await fetchDataRef.current();
    }
  }, []);

  /**
   * Triggers a balance refresh for dependent components.
   */
  const triggerBalanceRefresh = useCallback(() => {
    setBalanceRefreshTrigger(Date.now());
  }, []);

  /**
   * Refetches all data.
   */
  const refetchData = useCallback(async () => {
    if (fetchDataRef.current) {
      await fetchDataRef.current();
    }
  }, []);

  // ============================================================================
  // Computed values
  // ============================================================================

  /**
   * Filtered perp markets based on search query.
   */
  const filteredPerpMarkets = useMemo(() => {
    if (!deferredSearchQuery.trim()) return perpMarkets;
    const query = deferredSearchQuery.toLowerCase();
    return perpMarkets.filter(
      (m) =>
        m.ticker.toLowerCase().includes(query) ||
        (m.name ?? '').toLowerCase().includes(query)
    );
  }, [perpMarkets, deferredSearchQuery]);

  /**
   * Filtered predictions based on search query.
   */
  const filteredPredictions = useMemo(() => {
    if (!deferredSearchQuery.trim()) return predictions;
    const query = deferredSearchQuery.toLowerCase();
    return predictions.filter((p) => p.text.toLowerCase().includes(query));
  }, [predictions, deferredSearchQuery]);

  /**
   * Sorted active predictions based on selected sort option.
   * Only includes markets that are truly active (not expired).
   */
  const sortedPredictions = useMemo(() => {
    const active = filteredPredictions.filter(isPredictionActive);

    return [...active].sort((a, b) => {
      switch (predictionSort) {
        case 'trending': {
          const aVolume = (a.yesShares ?? 0) + (a.noShares ?? 0);
          const bVolume = (b.yesShares ?? 0) + (b.noShares ?? 0);
          const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          const aScore =
            aVolume * PREDICTION_TRENDING_WEIGHTS.VOLUME +
            (aTime / PREDICTION_TRENDING_WEIGHTS.TIME_NORMALIZER) *
              PREDICTION_TRENDING_WEIGHTS.RECENCY;
          const bScore =
            bVolume * PREDICTION_TRENDING_WEIGHTS.VOLUME +
            (bTime / PREDICTION_TRENDING_WEIGHTS.TIME_NORMALIZER) *
              PREDICTION_TRENDING_WEIGHTS.RECENCY;
          // Alphabetical tie-breaker for stable sorting
          if (bScore === aScore) return a.text.localeCompare(b.text);
          return bScore - aScore;
        }
        case 'newest':
          return (
            (b.createdDate ? new Date(b.createdDate).getTime() : 0) -
            (a.createdDate ? new Date(a.createdDate).getTime() : 0)
          );
        case 'ending-soon':
          return (
            (a.resolutionDate
              ? new Date(a.resolutionDate).getTime()
              : Number.POSITIVE_INFINITY) -
            (b.resolutionDate
              ? new Date(b.resolutionDate).getTime()
              : Number.POSITIVE_INFINITY)
          );
        case 'volume':
          return (
            (b.yesShares ?? 0) +
            (b.noShares ?? 0) -
            ((a.yesShares ?? 0) + (a.noShares ?? 0))
          );
        default:
          return 0;
      }
    });
  }, [filteredPredictions, predictionSort]);

  /**
   * Resolved/expired predictions.
   * Includes both officially resolved markets and expired ones (end date passed).
   */
  const resolvedPredictions = useMemo(
    () => filteredPredictions.filter(isPredictionExpiredOrResolved),
    [filteredPredictions]
  );

  /**
   * Top trending perp markets (weighted by change % and volume).
   *
   * Trending score algorithm uses TRENDING_WEIGHTS constants:
   * - Volume score: normalized to 0-VOLUME range (default 70)
   *   Volume is weighted more heavily to prioritize liquid, active markets.
   * - Change score: normalized to 0-CHANGE range (default 30)
   *   Uses Math.abs so both gains and losses contribute to "trending".
   *
   * Final score = volumeScore + changeScore (max 100)
   * Returns TOP_ITEMS_COUNT markets sorted by trending score descending.
   */
  const trendingMarkets = useMemo((): TrendingPerpMarket[] => {
    if (perpMarkets.length === 0) return [];

    // Prevent division by zero when all markets have zero volume/change
    const maxVolume = Math.max(...perpMarkets.map((m) => m.volume24h), 1);
    const maxChange = Math.max(
      ...perpMarkets.map((m) => Math.abs(m.changePercent24h)),
      1
    );

    return perpMarkets
      .map((market) => {
        const volumeScore =
          (market.volume24h / maxVolume) * TRENDING_WEIGHTS.VOLUME;
        const changeScore =
          (Math.abs(market.changePercent24h) / maxChange) *
          TRENDING_WEIGHTS.CHANGE;
        return {
          ...market,
          trendingScore: volumeScore + changeScore,
        };
      })
      .sort((a, b) => {
        const scoreDiff = b.trendingScore - a.trendingScore;
        // Alphabetical tie-breaker for stable sorting
        if (scoreDiff === 0) return a.ticker.localeCompare(b.ticker);
        return scoreDiff;
      })
      .slice(0, TOP_ITEMS_COUNT);
  }, [perpMarkets]);

  /**
   * Top predictions by volume.
   * Returns TOP_ITEMS_COUNT predictions sorted by total shares descending.
   */
  const topPredictions = useMemo((): TopPrediction[] => {
    return predictions
      .filter((p) => p.status === 'active')
      .map((p) => ({
        ...p,
        totalShares: (p.yesShares ?? 0) + (p.noShares ?? 0),
      }))
      .sort((a, b) => b.totalShares - a.totalShares)
      .slice(0, TOP_ITEMS_COUNT);
  }, [predictions]);

  /**
   * Computed P&L data for perp positions.
   */
  const perpPnLData = useMemo((): CategoryPnLData | null => {
    if (perpPositions.length === 0) return null;

    const unrealizedPnL = perpPositions.reduce(
      (sum, pos) => sum + (pos.unrealizedPnL ?? 0),
      0
    );
    // totalValue and openInterest are equivalent for perps (sum of absolute position sizes)
    // In a more sophisticated implementation, totalValue could include notional (size * price)
    const openInterest = perpPositions.reduce(
      (sum, pos) => sum + Math.abs(pos.size ?? 0),
      0
    );

    return {
      unrealizedPnL,
      positionCount: perpPositions.length,
      totalValue: openInterest,
      categorySpecific: { openInterest },
    };
  }, [perpPositions]);

  /**
   * Computed P&L data for prediction positions.
   */
  const predictionPnLData = useMemo((): CategoryPnLData | null => {
    if (predictionPositions.length === 0) return null;

    const unrealizedPnL = predictionPositions.reduce((sum, pos) => {
      const currentValue = pos.currentValue ?? pos.shares * pos.currentPrice;
      const costBasis = pos.costBasis ?? pos.shares * pos.avgPrice;
      return sum + (currentValue - costBasis);
    }, 0);
    const totalShares = predictionPositions.reduce(
      (sum, pos) => sum + pos.shares,
      0
    );
    const totalValue = predictionPositions.reduce(
      (sum, pos) => sum + (pos.currentValue ?? pos.shares * pos.currentPrice),
      0
    );

    return {
      unrealizedPnL,
      positionCount: predictionPositions.length,
      totalValue,
      categorySpecific: { totalShares },
    };
  }, [predictionPositions]);

  return {
    // Auth
    user,
    authenticated,
    login,

    // Loading
    loading,
    perpLoading,
    predictionsLoading,
    portfolioLoading,

    // Errors
    predictionsError,

    // Data
    perpMarkets,
    predictions,
    perpPositions,
    predictionPositions,
    portfolioPnL,
    portfolioError,
    portfolioUpdatedAt,

    // Computed
    trendingMarkets,
    topPredictions,
    perpPnLData,
    predictionPnLData,
    filteredPerpMarkets,
    activePredictions: sortedPredictions,
    resolvedPredictions,

    // Search/Sort
    searchQuery,
    setSearchQuery,
    deferredSearchQuery,
    predictionSort,
    setPredictionSort,

    // Actions
    handlePositionsRefresh,
    refreshPortfolio,
    refetchData,
    balanceRefreshTrigger,
    triggerBalanceRefresh,
  };
}
