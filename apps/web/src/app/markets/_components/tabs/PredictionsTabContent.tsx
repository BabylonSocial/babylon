'use client';

import type { UserPredictionPosition } from '@babylon/shared';
import { TrendingUp } from 'lucide-react';
import { memo, useState } from 'react';
import { CategoryPnLCard } from '@/components/markets/CategoryPnLCard';
import { PredictionPositionsList } from '@/components/markets/PredictionPositionsList';
import { EmptyState } from '@/components/shared/EmptyState';
import type {
  PredictionMarketWithPosition,
  PredictionSort,
} from '@/types/markets';
import type { CategoryPnLData } from '../../_hooks';
import { PredictionMarketCard, ResolvedPredictionCard } from '../cards';
import { PredictionSortControls } from '../sections';

interface PredictionsTabContentProps {
  // Auth state
  authenticated: boolean;

  // P&L data
  predictionPnLData: CategoryPnLData | null;
  portfolioLoading: boolean;
  portfolioError: string | null;
  portfolioUpdatedAt: number | null;
  onShowCategoryPnLShare: () => void;
  onRefreshPortfolio: () => Promise<void>;

  // Positions
  predictionPositions: UserPredictionPosition[];
  onPositionSold: () => Promise<void>;

  // Sort
  predictionSort: PredictionSort;
  onSortChange: (sort: PredictionSort) => void;

  // Markets
  activePredictions: PredictionMarketWithPosition[];
  resolvedPredictions: PredictionMarketWithPosition[];
  onPredictionClick: (prediction: PredictionMarketWithPosition) => void;

  /** Error message when predictions fail to load */
  predictionsError?: string | null;

  /** Use compact (scrollable) sort controls for mobile */
  compact?: boolean;
}

/**
 * Predictions tab content component.
 * Shows category P&L, user positions, sort controls, and prediction markets.
 * Resolved markets are hidden by default with a toggle in the sort controls.
 *
 * Wrapped in React.memo to prevent unnecessary re-renders during tab switches.
 */
export const PredictionsTabContent = memo(function PredictionsTabContent({
  authenticated,
  predictionPnLData,
  portfolioLoading,
  portfolioError,
  portfolioUpdatedAt,
  onShowCategoryPnLShare,
  onRefreshPortfolio,
  predictionPositions,
  onPositionSold,
  predictionSort,
  onSortChange,
  activePredictions,
  resolvedPredictions,
  onPredictionClick,
  predictionsError,
  compact = false,
}: PredictionsTabContentProps) {
  // Resolved markets hidden by default
  const [showResolved, setShowResolved] = useState(false);

  // Combine markets based on toggle
  const displayedPredictions = showResolved
    ? [...activePredictions, ...resolvedPredictions]
    : activePredictions;

  return (
    <div
      id="predictions-panel"
      role="tabpanel"
      aria-labelledby="predictions-tab"
      className="p-4"
    >
      {/* Error banner when predictions fail to load */}
      {predictionsError && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-600 dark:text-red-400">
          <p className="font-medium">Failed to load predictions</p>
          <p className="text-sm opacity-80">{predictionsError}</p>
        </div>
      )}

      {authenticated && predictionPnLData && (
        <div className="mb-6">
          <CategoryPnLCard
            category="predictions"
            data={predictionPnLData}
            loading={portfolioLoading}
            error={portfolioError}
            onShare={onShowCategoryPnLShare}
            onRefresh={onRefreshPortfolio}
            lastUpdated={portfolioUpdatedAt}
          />
        </div>
      )}

      {authenticated && predictionPositions.length > 0 && (
        <>
          <h2 className="mb-3 font-bold text-muted-foreground text-sm">
            YOUR POSITIONS ({predictionPositions.length})
          </h2>
          <div className="mb-6">
            <PredictionPositionsList
              positions={predictionPositions}
              onPositionSold={onPositionSold}
            />
          </div>
        </>
      )}

      <div
        className={compact ? 'mb-3' : 'mb-3 flex items-center justify-between'}
      >
        <h2
          className={
            compact
              ? 'mb-2 font-bold text-muted-foreground text-sm'
              : 'font-bold text-muted-foreground text-sm'
          }
        >
          {showResolved
            ? `ALL MARKETS (${displayedPredictions.length})`
            : `ACTIVE MARKETS (${activePredictions.length})`}
        </h2>
        <PredictionSortControls
          activeSort={predictionSort}
          onSortChange={onSortChange}
          showResolved={showResolved}
          onShowResolvedChange={setShowResolved}
          compact={compact}
        />
      </div>

      <div className="space-y-2">
        {displayedPredictions.length > 0 ? (
          displayedPredictions.map((prediction) =>
            prediction.status === 'resolved' ? (
              <ResolvedPredictionCard
                key={`resolved-${prediction.id}`}
                prediction={prediction}
              />
            ) : (
              <PredictionMarketCard
                key={`prediction-${prediction.id}`}
                prediction={prediction}
                onClick={onPredictionClick}
              />
            )
          )
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No markets found"
            description="Try adjusting your filters or check back later for new markets"
          />
        )}
      </div>
    </div>
  );
});
