'use client';

import type { PortfolioBreakdownSnapshot } from '@babylon/engine/client';
import type { PerpPosition, UserPredictionPosition } from '@babylon/shared';
import { memo } from 'react';
import { PortfolioPnLCard } from '@/components/markets/PortfolioPnLCard';
import type { PerpMarket, PredictionMarket } from '@/types/markets';
import type { TopPrediction, TrendingPerpMarket } from '../../_hooks';
import {
  HotPredictionsList,
  MarketsCTA,
  PositionsOverview,
  TrendingPerpsList,
} from '../sections';

interface DashboardTabContentProps {
  // Auth state
  authenticated: boolean;
  onLogin: () => void;

  // Portfolio
  portfolioPnL: PortfolioBreakdownSnapshot | null;
  portfolioLoading: boolean;
  portfolioError: string | null;
  onShowPnLShare: () => void;
  onShowBuyPoints: () => void;

  // Positions
  perpPositions: PerpPosition[];
  predictionPositions: UserPredictionPosition[];
  onPositionClosed: () => Promise<void>;
  onPositionSold: () => Promise<void>;

  // Markets data
  trendingMarkets: TrendingPerpMarket[];
  topPredictions: TopPrediction[];
  onMarketClick: (market: PerpMarket) => void;
  onPredictionClick: (prediction: PredictionMarket) => void;
}

/**
 * Dashboard tab content component.
 * Shows portfolio overview, positions, trending markets, and hot predictions.
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
export const DashboardTabContent = memo(function DashboardTabContent({
  authenticated,
  onLogin,
  portfolioPnL,
  portfolioLoading,
  portfolioError,
  onShowPnLShare,
  onShowBuyPoints,
  perpPositions,
  predictionPositions,
  onPositionClosed,
  onPositionSold,
  trendingMarkets,
  topPredictions,
  onMarketClick,
  onPredictionClick,
}: DashboardTabContentProps) {
  return (
    <div
      id="dashboard-panel"
      role="tabpanel"
      aria-labelledby="dashboard-tab"
      className="space-y-6 p-4"
    >
      {authenticated && (
        <PortfolioPnLCard
          data={portfolioPnL}
          loading={portfolioLoading}
          error={portfolioError}
          onShare={onShowPnLShare}
          setShowBuyPointsModal={onShowBuyPoints}
        />
      )}

      {authenticated && (
        <PositionsOverview
          perpPositions={perpPositions}
          predictionPositions={predictionPositions}
          onPositionClosed={onPositionClosed}
          onPositionSold={onPositionSold}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TrendingPerpsList
          markets={trendingMarkets}
          onMarketClick={onMarketClick}
        />
        <HotPredictionsList
          predictions={topPredictions}
          onPredictionClick={onPredictionClick}
        />
      </div>

      {!authenticated && <MarketsCTA onLogin={onLogin} />}
    </div>
  );
});
