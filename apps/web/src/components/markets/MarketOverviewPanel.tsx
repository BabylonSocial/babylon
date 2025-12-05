'use client';

import {
  Activity,
  BarChart3,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '@/components/shared/Skeleton';
import {
  usePerpMarkets,
  usePerpMarketsPolling,
  type PerpMarket,
} from '@/stores/perpMarketsStore';
import {
  usePredictionMarkets,
  usePredictionMarketsPolling,
} from '@/stores/predictionMarketsStore';
import { cn } from '@babylon/shared';

/**
 * Market overview statistics structure.
 */
interface MarketOverview {
  totalMarkets: number;
  totalVolume24h: number;
  totalOpenInterest: number;
  avgChange24h: number;
  marketsUp: number;
  marketsDown: number;
}

/**
 * Market overview panel component displaying aggregate market statistics.
 *
 * Displays summary statistics for both perpetual and prediction markets including
 * total markets, volume, open interest, and price changes. Subscribes to real-time
 * prediction market updates via SSE. Shows loading states while fetching data.
 *
 * Features:
 * - Total markets count
 * - 24h volume and open interest
 * - Average price change
 * - Markets up/down counts
 * - Real-time prediction market updates
 *
 * @returns Market overview panel element
 */
export function MarketOverviewPanel() {
  // Use shared perp markets store
  const { markets: perpMarkets, loading: perpLoading } = usePerpMarkets();
  usePerpMarketsPolling(30000); // Enable 30s polling

  // Use shared prediction markets store
  const { markets: predictionMarkets, loading: predictionsLoading } =
    usePredictionMarkets();
  usePredictionMarketsPolling(30000); // Enable 30s polling

  // Calculate overview from perp markets
  const overview = useMemo<MarketOverview | null>(() => {
    if (perpMarkets.length === 0) return null;

    const totalVolume = perpMarkets.reduce(
      (sum: number, m: PerpMarket) => sum + (m.volume24h || 0),
      0
    );
    const totalOI = perpMarkets.reduce(
      (sum: number, m: PerpMarket) => sum + (m.openInterest || 0),
      0
    );
    const avgChange =
      perpMarkets.length > 0
        ? perpMarkets.reduce(
            (sum: number, m: PerpMarket) => sum + (m.changePercent24h || 0),
            0
          ) / perpMarkets.length
        : 0;
    const marketsUp = perpMarkets.filter(
      (m: PerpMarket) => (m.changePercent24h || 0) > 0
    ).length;
    const marketsDown = perpMarkets.filter(
      (m: PerpMarket) => (m.changePercent24h || 0) < 0
    ).length;

    return {
      totalMarkets: perpMarkets.length,
      totalVolume24h: totalVolume,
      totalOpenInterest: totalOI,
      avgChange24h: avgChange,
      marketsUp,
      marketsDown,
    };
  }, [perpMarkets]);

  const loading = perpLoading && predictionsLoading;

  // Calculate prediction overview from store data
  const predictionOverview = useMemo(() => {
    const activeMarkets = predictionMarkets.filter((m) => m.status === 'active');
    const totalVolume = activeMarkets.reduce(
      (sum, m) => sum + (m.yesShares || 0) + (m.noShares || 0),
      0
    );

    return {
      activeCount: activeMarkets.length,
      totalVolume,
    };
  }, [predictionMarkets]);

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${(v / 1e3).toFixed(2)}K`;
  };

  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-sidebar p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[#0066FF]" />
        <h2 className="font-bold text-foreground text-xl">Market Overview</h2>
      </div>
      {loading ? (
        <div className="flex-1 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : overview ? (
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Total Markets
              </span>
              <span className="font-semibold text-foreground text-sm">
                {overview.totalMarkets}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  24h Volume
                </span>
              </div>
              <span className="font-semibold text-foreground text-sm">
                {formatVolume(overview.totalVolume24h)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  Open Interest
                </span>
              </div>
              <span className="font-semibold text-foreground text-sm">
                {formatVolume(overview.totalOpenInterest)}
              </span>
            </div>
          </div>

          <div className="border-border border-t pt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Avg Change 24h
              </span>
              <div
                className={cn(
                  'flex items-center gap-1 font-semibold text-sm',
                  overview.avgChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {overview.avgChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {overview.avgChange24h >= 0 ? '+' : ''}
                {overview.avgChange24h.toFixed(2)}%
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>{overview.marketsUp} Up</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-3 w-3" />
                <span>{overview.marketsDown} Down</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-border border-t pt-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[#0066FF]" />
              <span className="font-semibold text-foreground text-sm">
                Prediction Markets
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Active</span>
              <span className="font-semibold text-foreground text-sm">
                {predictionOverview.activeCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Total Volume
              </span>
              <span className="font-semibold text-foreground text-sm">
                {predictionOverview.totalVolume.toFixed(0)} shares
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 text-muted-foreground text-sm">
          No data available
        </div>
      )}
    </div>
  );
}
