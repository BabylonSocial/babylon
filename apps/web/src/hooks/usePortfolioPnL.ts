'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioPnLSnapshot } from '@babylon/engine/client';

// Re-export for components that import from this hook
export type { PortfolioPnLSnapshot } from '@babylon/engine/client';

/**
 * Return type for the usePortfolioPnL hook.
 */
interface UsePortfolioPnLResult {
  /** Whether portfolio data is currently loading */
  loading: boolean;
  /** Any error that occurred while fetching portfolio data */
  error: string | null;
  /** Portfolio PnL snapshot containing all calculated metrics */
  data: PortfolioPnLSnapshot | null;
  /** Function to manually refresh portfolio data */
  refresh: () => Promise<void>;
  /** Timestamp of last successful update */
  lastUpdated: number | null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

/**
 * Hook for fetching and managing portfolio profit and loss (PnL) data.
 *
 * Calculates comprehensive portfolio metrics including:
 * - Lifetime PnL (realized gains/losses)
 * - Unrealized PnL from open positions (perpetuals and predictions)
 * - Net contributions (deposits minus withdrawals)
 * - Account equity (net contributions + total PnL)
 * - Available balance
 *
 * Automatically fetches data when the user is authenticated and refreshes
 * when the user changes. Supports manual refresh and cancellation of
 * in-flight requests.
 *
 * @returns Portfolio PnL state including loading status, error, data, and refresh function.
 *
 * @example
 * ```tsx
 * const { data, loading, refresh } = usePortfolioPnL();
 *
 * if (loading) return <div>Loading...</div>;
 * if (data) {
 *   return (
 *     <div>
 *       <p>Total PnL: ${data.totalPnL}</p>
 *       <p>Account Equity: ${data.accountEquity}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePortfolioPnL(): UsePortfolioPnLResult {
  const { user, authenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioPnLSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!authenticated || !user?.id) {
      setData(null);
      setLoading(false);
      setError(null);
      setLastUpdated(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    const [balanceRes, positionsRes] = await Promise.all([
      fetch(`/api/users/${encodeURIComponent(user.id)}/balance`, {
        signal: abortController.signal,
      }),
      fetch(`/api/markets/positions/${encodeURIComponent(user.id)}`, {
        signal: abortController.signal,
      }),
    ]);

    // Check if request was aborted before parsing
    if (abortController.signal.aborted) {
      return;
    }

    const balanceJson = await balanceRes.json();
    const positionsJson = await positionsRes.json();

    // Check if request was aborted after parsing
    if (abortController.signal.aborted) {
      return;
    }

    const totalDeposited = toNumber(balanceJson.totalDeposited);
    const totalWithdrawn = toNumber(balanceJson.totalWithdrawn);
    const lifetimePnL = toNumber(balanceJson.lifetimePnL);
    const availableBalance = toNumber(balanceJson.balance);

    const perpUnrealized = (positionsJson?.perpetuals?.positions ?? []).reduce(
      (sum: number, position: { unrealizedPnL?: number }) =>
        sum + toNumber(position?.unrealizedPnL),
      0
    );

    const predictionUnrealized = (
      positionsJson?.predictions?.positions ?? []
    ).reduce(
      (sum: number, position: { unrealizedPnL?: number }) =>
        sum + toNumber(position?.unrealizedPnL),
      0
    );

    const totalUnrealizedPnL = perpUnrealized + predictionUnrealized;
    const totalPnL = lifetimePnL + totalUnrealizedPnL;
    const netContributions = totalDeposited - totalWithdrawn;
    const accountEquity = netContributions + totalPnL;

    setData({
      lifetimePnL,
      netContributions,
      totalDeposited,
      totalWithdrawn,
      availableBalance,
      unrealizedPerpPnL: perpUnrealized,
      unrealizedPredictionPnL: predictionUnrealized,
      totalUnrealizedPnL,
      totalPnL,
      accountEquity,
    });
    setLastUpdated(Date.now());
    setLoading(false);
  }, [authenticated, user?.id]);

  useEffect(() => {
    refresh();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [refresh]);

  const memoizedData = useMemo(() => data, [data]);

  return {
    loading,
    error,
    data: memoizedData,
    refresh,
    lastUpdated,
  };
}
