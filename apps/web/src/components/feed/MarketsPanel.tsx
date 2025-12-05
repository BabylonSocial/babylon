'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@/components/shared/Skeleton';
import { useWidgetRefresh } from '@/contexts/WidgetRefreshContext';
import { usePerpMarkets } from '@/stores/perpMarketsStore';
import { cn } from '@babylon/shared';

/**
 * Prediction market structure for markets panel.
 */
interface Market {
  id: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: string;
  priceChange24h?: number;
  changePercent24h?: number;
}

/**
 * Markets panel component for displaying prediction and perpetual markets.
 *
 * Displays a list of prediction markets and trending perpetual markets.
 * Fetches data from widgets API and supports manual refresh via
 * WidgetRefreshContext. Shows price changes and volume information.
 *
 * Features:
 * - Prediction markets list
 * - Perpetual markets list
 * - Price change indicators
 * - Manual refresh support
 * - Loading states
 *
 * @returns Markets panel element
 */
export function MarketsPanel() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const { registerRefresh, unregisterRefresh } = useWidgetRefresh();

  // Use shared perp markets store
  const { markets: perpMarkets, loading: perpLoading, refetch: refetchPerps } = usePerpMarkets();

  const loading = predictionsLoading && perpLoading;

  const fetchMarkets = useCallback(async () => {
    try {
      // Fetch prediction markets only - perps come from shared store
      const response = await fetch('/api/feed/widgets/markets');

      if (!response.ok) {
        console.error(
          'Failed to fetch markets:',
          response.status,
          response.statusText
        );
        setMarkets([]);
      } else {
        const text = await response.text();
        if (!text) {
          console.error('Empty response from markets API');
          setMarkets([]);
        } else {
          try {
            const data = JSON.parse(text);
            if (data.success) {
              setMarkets(data.markets || []);
            } else {
              setMarkets([]);
            }
          } catch (parseError) {
            console.error('Failed to parse markets response:', parseError);
            setMarkets([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
      setMarkets([]);
    } finally {
      setPredictionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Register refresh function (includes both predictions and perps)
  useEffect(() => {
    const refreshAll = async () => {
      await Promise.all([fetchMarkets(), refetchPerps()]);
    };
    registerRefresh('markets', refreshAll);
    return () => unregisterRefresh('markets');
  }, [registerRefresh, unregisterRefresh, fetchMarkets, refetchPerps]);

  const handleMarketClick = (marketId: string) => {
    router.push(`/markets/predictions/${marketId}`);
  };

  // Get top movers (markets with biggest price changes)
  const topMovers = markets
    .filter((m) => m.changePercent24h !== undefined && m.changePercent24h !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.changePercent24h || 0) - Math.abs(a.changePercent24h || 0)
    )
    .slice(0, 3);

  // Get trending tokens - use same strategy as TopMoversPanel
  const sortedPerpMarkets = [...perpMarkets].sort(
    (a, b) => b.changePercent24h - a.changePercent24h
  );
  const tokenGainers = sortedPerpMarkets.slice(0, 3); // Top 3 (highest positive or least negative)
  const tokenLosers = sortedPerpMarkets.slice(-3).reverse(); // Bottom 3 (most negative)

  const handleTokenClick = (ticker: string) => {
    router.push(`/markets/perps/${ticker}`);
  };

  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-sidebar px-4 py-3">
      <h2 className="mb-3 text-left font-bold text-foreground text-lg">
        Markets
      </h2>
      {loading ? (
        <div className="flex-1 space-y-3 pl-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : markets.length === 0 && perpMarkets.length === 0 ? (
        <div className="flex-1 pl-3 text-muted-foreground text-sm">
          No active markets at the moment.
        </div>
      ) : (
        <>
          {/* Top Movers Section - show when we have price changes */}
          {topMovers.length > 0 && (
            <div className="mb-4 pl-3">
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#0066FF]" />
                <h3 className="font-semibold text-foreground text-sm">
                  Top Movers (24h)
                </h3>
              </div>
              <div className="space-y-2">
                {topMovers.map((market) => (
                  <div
                    key={`mover-${market.id}`}
                    onClick={() => handleMarketClick(market.id)}
                    className="-ml-1.5 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium text-foreground text-sm leading-snug">
                        {market.question}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-green-500 text-xs">
                          Yes {(market.yesPrice * 100).toFixed(0)}%
                        </span>
                        <div
                          className={cn(
                            'flex items-center gap-0.5 font-semibold text-xs',
                            (market.changePercent24h || 0) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {(market.changePercent24h || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {(market.changePercent24h || 0) >= 0 ? '+' : ''}
                          {(market.changePercent24h || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-border border-t pt-3" />
            </div>
          )}

          {/* Trending Tokens Section - show perp futures gainers and losers */}
          {perpMarkets.length > 0 && (
            <div className="mb-4 pl-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Top Gainers Column */}
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <h4 className="font-semibold text-green-600 text-xs">
                      Gainers
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {tokenGainers.map((token) => (
                      <div
                        key={`gainer-${token.ticker}`}
                        onClick={() => handleTokenClick(token.ticker)}
                        className="cursor-pointer rounded p-1.5 transition-colors duration-200 hover:bg-muted/50"
                      >
                        <p className="font-bold text-foreground text-xs">
                          ${token.ticker}
                        </p>
                        <div className="mt-0.5 flex items-center justify-between gap-1">
                          <span className="truncate text-muted-foreground text-xs">
                            ${token.currentPrice.toFixed(2)}
                          </span>
                          <span
                            className={cn(
                              'font-semibold text-xs',
                              token.changePercent24h >= 0
                                ? 'text-green-600'
                                : 'text-muted-foreground'
                            )}
                          >
                            {token.changePercent24h >= 0 ? '+' : ''}
                            {token.changePercent24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Losers Column */}
                <div>
                  <div className="mb-2 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <h4 className="font-semibold text-red-600 text-xs">
                      Losers
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {tokenLosers.map((token) => (
                      <div
                        key={`loser-${token.ticker}`}
                        onClick={() => handleTokenClick(token.ticker)}
                        className="cursor-pointer rounded p-1.5 transition-colors duration-200 hover:bg-muted/50"
                      >
                        <p className="font-bold text-foreground text-xs">
                          ${token.ticker}
                        </p>
                        <div className="mt-0.5 flex items-center justify-between gap-1">
                          <span className="truncate text-muted-foreground text-xs">
                            ${token.currentPrice.toFixed(2)}
                          </span>
                          <span
                            className={cn(
                              'font-semibold text-xs',
                              token.changePercent24h < 0
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                            )}
                          >
                            {token.changePercent24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Markets List - only show when there are prediction markets */}
          {markets.length > 0 && (
            <div className="flex-1 pl-3">
              <div className="space-y-2.5">
                {markets.slice(0, 5).map((market) => (
                  <div
                    key={market.id}
                    onClick={() => handleMarketClick(market.id)}
                    className="-ml-1.5 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Market question */}
                      <p className="line-clamp-2 font-semibold text-foreground text-sm leading-snug">
                        {market.question}
                      </p>
                      {/* Market stats */}
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-green-500 text-xs">
                          Yes {(market.yesPrice * 100).toFixed(0)}%
                        </span>
                        <span className="text-red-500 text-xs">
                          No {(market.noPrice * 100).toFixed(0)}%
                        </span>
                        {market.volume > 0 && (
                          <span className="text-muted-foreground text-xs">
                            ${market.volume.toFixed(0)}
                          </span>
                        )}
                        {market.changePercent24h !== undefined &&
                          market.changePercent24h !== 0 && (
                            <span
                              className={cn(
                                'font-medium text-xs',
                                market.changePercent24h >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              )}
                            >
                              {market.changePercent24h >= 0 ? '+' : ''}
                              {market.changePercent24h.toFixed(1)}%
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
