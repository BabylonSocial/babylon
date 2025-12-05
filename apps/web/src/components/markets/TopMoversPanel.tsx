'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/shared/Skeleton';
import {
  usePerpTopMovers,
  usePerpMarketsPolling,
  type PerpMarket,
} from '@/stores/perpMarketsStore';
import { cn } from '@babylon/shared';

/**
 * Top movers panel component for displaying biggest gainers and losers.
 *
 * Displays the top 4 gainers and top 4 losers from perpetual markets based on
 * 24h price change percentage. Uses shared perp markets store for data.
 * Automatically refreshes every 30 seconds via shared polling.
 *
 * Features:
 * - Top gainers list (4 markets)
 * - Top losers list (4 markets)
 * - Auto-refresh (30s interval via shared store)
 * - Loading states
 * - Empty state handling
 *
 * @param props - TopMoversPanel component props
 * @returns Top movers panel element
 */
interface TopMoversPanelProps {
  onMarketClick?: (market: PerpMarket) => void;
}

export function TopMoversPanel({ onMarketClick }: TopMoversPanelProps) {
  // Use shared store with polling
  const { topGainers, topLosers, loading } = usePerpTopMovers(4);
  usePerpMarketsPolling(30000); // Enable 30s polling

  const formatPrice = (p: number) => `$${p.toFixed(2)}`;

  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-sidebar px-4 py-3">
      <h2 className="mb-3 font-bold text-foreground text-xl">Top Movers</h2>
      {loading ? (
        <div className="flex-1 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Top Gainers */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-foreground text-sm">
                Top Gainers
              </h3>
            </div>
            <div className="space-y-1.5">
              {topGainers.length > 0 ? (
                topGainers.map((mover) => (
                  <button
                    key={mover.ticker}
                    onClick={() => onMarketClick?.(mover)}
                    className={cn(
                      '-ml-1.5 flex w-full cursor-pointer items-center justify-between rounded-lg p-1.5 text-left text-sm transition-colors hover:bg-muted/50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-foreground">
                        ${mover.ticker}
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        {mover.name}
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatPrice(mover.currentPrice)}
                        </div>
                        <div className="font-medium text-green-600 text-xs">
                          +{mover.changePercent24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground text-xs">No gainers</div>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-foreground text-sm">
                Top Losers
              </h3>
            </div>
            <div className="space-y-1.5">
              {topLosers.length > 0 ? (
                topLosers.map((mover) => (
                  <button
                    key={mover.ticker}
                    onClick={() => onMarketClick?.(mover)}
                    className={cn(
                      '-ml-1.5 flex w-full cursor-pointer items-center justify-between rounded-lg p-1.5 text-left text-sm transition-colors hover:bg-muted/50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-foreground">
                        ${mover.ticker}
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        {mover.name}
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatPrice(mover.currentPrice)}
                        </div>
                        <div className="font-medium text-red-600 text-xs">
                          {mover.changePercent24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground text-xs">No losers</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
