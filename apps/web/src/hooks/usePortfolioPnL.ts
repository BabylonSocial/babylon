'use client';

import type { PortfolioBreakdownSnapshot } from '@babylon/engine/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Re-export for components that import from this hook
export type { PortfolioBreakdownSnapshot } from '@babylon/engine/client';

/**
 * Return type for the usePortfolioPnL hook.
 */
interface UsePortfolioPnLResult {
  /** Whether portfolio data is currently loading */
  loading: boolean;
  /** Any error that occurred while fetching portfolio data */
  error: string | null;
  /** Portfolio PnL snapshot containing all calculated metrics */
  data: PortfolioBreakdownSnapshot | null;
  /** Function to manually refresh portfolio data */
  refresh: () => Promise<void>;
  /** Timestamp of last successful update */
  lastUpdated: number | null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Hook for fetching and managing portfolio profit and loss (PnL) data.
 *
 * Fetches a canonical portfolio breakdown for consistent P/L:
 * - Wallet (user-held points)
 * - Agents (agent-held points)
 * - Positions (mark-to-market value of open positions)
 * - Available (wallet + agents)
 * - Original amount (baseline)
 * - Total assets
 * - Total P/L
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
 *       <p>Total PnL: {data.totalPnL}</p>
 *       <p>Total Assets: {data.totalAssets}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePortfolioPnL(): UsePortfolioPnLResult {
  const { user, authenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioBreakdownSnapshot | null>(null);
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

    const breakdownRes = await fetch(
      `/api/users/${encodeURIComponent(user.id)}/portfolio-breakdown`,
      { signal: abortController.signal }
    );

    if (!breakdownRes.ok) {
      setError('Failed to fetch portfolio breakdown');
      setLoading(false);
      return;
    }

    if (abortController.signal.aborted) {
      return;
    }

    let breakdownJson: Record<string, unknown>;
    try {
      breakdownJson = (await breakdownRes.json()) as Record<string, unknown>;
    } catch {
      setError('Failed to parse portfolio breakdown');
      setLoading(false);
      return;
    }

    if (abortController.signal.aborted) {
      return;
    }

    setData({
      wallet: toNumber(breakdownJson.wallet),
      agents: toNumber(breakdownJson.agents),
      positions: toNumber(breakdownJson.positions),
      available: toNumber(breakdownJson.available),
      originalAmount: toNumber(breakdownJson.originalAmount),
      totalAssets: toNumber(breakdownJson.totalAssets),
      totalPnL: toNumber(breakdownJson.totalPnL),
      agentCount: toNumber(breakdownJson.agentCount),
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
