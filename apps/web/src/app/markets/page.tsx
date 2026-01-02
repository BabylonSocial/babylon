'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { MarketsToggle } from '@/components/shared/MarketsToggle';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton, WidgetPanelSkeleton } from '@/components/shared/Skeleton';
import type { MarketTab, PerpMarket, PredictionMarket } from '@/types/markets';
import {
  DashboardTabContent,
  LoginPrompt,
  MarketsSearchInput,
  PerpsTabContent,
  PredictionsTabContent,
} from './_components';
import { useMarketsPageData } from './_hooks';

// Lazy load modals - not needed for initial render
const CategoryPnLShareModal = dynamic(
  () =>
    import('@/components/markets/CategoryPnLShareModal').then((m) => ({
      default: m.CategoryPnLShareModal,
    })),
  { ssr: false }
);

const PortfolioPnLShareModal = dynamic(
  () =>
    import('@/components/markets/PortfolioPnLShareModal').then((m) => ({
      default: m.PortfolioPnLShareModal,
    })),
  { ssr: false }
);

const BuyPointsModal = dynamic(
  () =>
    import('@/components/points/BuyPointsModal').then((m) => ({
      default: m.BuyPointsModal,
    })),
  { ssr: false }
);

// Lazy load sidebar - only needed on desktop
const MarketsWidgetSidebar = dynamic(
  () =>
    import('@/components/markets/MarketsWidgetSidebar').then((m) => ({
      default: m.MarketsWidgetSidebar,
    })),
  { ssr: false }
);

/**
 * Valid tab values from URL params.
 */
const VALID_TABS: MarketTab[] = ['dashboard', 'perps', 'predictions'];

/**
 * Parse tab from URL search params.
 */
function parseTabFromParams(params: URLSearchParams): MarketTab {
  const tab = params.get('tab');
  if (tab && VALID_TABS.includes(tab as MarketTab)) {
    return tab as MarketTab;
  }
  return 'dashboard';
}

/**
 * Markets page component.
 *
 * Main dashboard for trading perpetual futures and prediction markets.
 * Supports three views: Dashboard (overview), Perps (perpetual markets),
 * and Predictions (prediction markets).
 *
 * Features:
 * - Real-time market data via SSE
 * - User positions management
 * - Portfolio P&L tracking
 * - Search and filtering
 * - Responsive layout (desktop sidebar, mobile full-width)
 * - URL-based tab navigation (?tab=perps, ?tab=predictions)
 */
export default function MarketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize tab from URL params for deep linking support
  const [activeTab, setActiveTab] = useState<MarketTab>(() =>
    parseTabFromParams(searchParams)
  );
  const [showBuyPointsModal, setShowBuyPointsModal] = useState(false);
  const [showPnLShareModal, setShowPnLShareModal] = useState(false);
  const [showCategoryPnLShareModal, setShowCategoryPnLShareModal] = useState<
    'perps' | 'predictions' | null
  >(null);

  // Sync URL params with tab state (only when URL changes externally)
  // Intentionally excludes activeTab from deps to avoid feedback loop:
  // - URL change → state update (this effect)
  // - State change → URL update (handleTabChange)
  // biome-ignore lint/correctness/useExhaustiveDependencies: One-way sync from URL to state
  useEffect(() => {
    const urlTab = parseTabFromParams(searchParams);
    if (urlTab !== activeTab) {
      startTransition(() => {
        setActiveTab(urlTab);
      });
    }
  }, [searchParams]);

  // Handle tab change with URL update - uses startTransition for smooth UX
  const handleTabChange = useCallback(
    (tab: MarketTab) => {
      // Use startTransition to mark this as a non-urgent update
      // This prevents flickering by allowing React to keep showing old content
      startTransition(() => {
        setActiveTab(tab);
      });
      // Update URL without full navigation
      const url = tab === 'dashboard' ? '/markets' : `/markets?tab=${tab}`;
      router.replace(url, { scroll: false });
    },
    [router]
  );

  // All data and computed values from centralized hook
  const data = useMarketsPageData();

  // Navigation handlers - memoized to prevent child re-renders
  const handleMarketClick = useCallback(
    (market: PerpMarket) => {
      router.push(`/markets/perps/${market.ticker}?from=dashboard`);
    },
    [router]
  );

  const handlePredictionClick = useCallback(
    (prediction: PredictionMarket) => {
      router.push(`/markets/predictions/${prediction.id}?from=dashboard`);
    },
    [router]
  );

  // Modal handlers - memoized to prevent child re-renders
  const handleShowPnLShare = useCallback(() => setShowPnLShareModal(true), []);
  const handleClosePnLShare = useCallback(
    () => setShowPnLShareModal(false),
    []
  );
  const handleShowBuyPoints = useCallback(
    () => setShowBuyPointsModal(true),
    []
  );
  const handleCloseBuyPoints = useCallback(
    () => setShowBuyPointsModal(false),
    []
  );
  const handleShowPerpsPnLShare = useCallback(
    () => setShowCategoryPnLShareModal('perps'),
    []
  );
  const handleShowPredictionsPnLShare = useCallback(
    () => setShowCategoryPnLShareModal('predictions'),
    []
  );
  const handleCloseCategoryPnLShare = useCallback(
    () => setShowCategoryPnLShareModal(null),
    []
  );

  // Loading state
  if (data.loading) {
    return (
      <PageContainer noPadding className="flex flex-col">
        <div className="space-y-6 p-4">
          <div className="flex gap-0">
            {['Dashboard', 'Perps', 'Predictions'].map((tab) => (
              <div key={tab} className="flex-1 px-4 py-2.5">
                <Skeleton className="mx-auto h-5 w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <WidgetPanelSkeleton />
            <WidgetPanelSkeleton />
          </div>
          <WidgetPanelSkeleton />
        </div>
      </PageContainer>
    );
  }

  // Render active tab content
  const renderTabContent = (isMobile: boolean) => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTabContent
            authenticated={data.authenticated}
            onLogin={data.login}
            portfolioPnL={data.portfolioPnL}
            portfolioLoading={data.portfolioLoading}
            portfolioError={data.portfolioError}
            onShowPnLShare={handleShowPnLShare}
            onShowBuyPoints={handleShowBuyPoints}
            perpPositions={data.perpPositions}
            predictionPositions={data.predictionPositions}
            onPositionClosed={data.handlePositionsRefresh}
            onPositionSold={data.handlePositionsRefresh}
            trendingMarkets={data.trendingMarkets}
            topPredictions={data.topPredictions}
            onMarketClick={handleMarketClick}
            onPredictionClick={handlePredictionClick}
          />
        );
      case 'perps':
        return (
          <PerpsTabContent
            authenticated={data.authenticated}
            perpPnLData={data.perpPnLData}
            portfolioLoading={data.portfolioLoading}
            portfolioError={data.portfolioError}
            portfolioUpdatedAt={data.portfolioUpdatedAt}
            onShowCategoryPnLShare={handleShowPerpsPnLShare}
            onRefreshPortfolio={data.refreshPortfolio}
            perpPositions={data.perpPositions}
            onPositionClosed={data.handlePositionsRefresh}
            filteredMarkets={data.filteredPerpMarkets}
            onMarketClick={handleMarketClick}
          />
        );
      case 'predictions':
        return (
          <PredictionsTabContent
            authenticated={data.authenticated}
            predictionPnLData={data.predictionPnLData}
            portfolioLoading={data.portfolioLoading}
            portfolioError={data.portfolioError}
            portfolioUpdatedAt={data.portfolioUpdatedAt}
            onShowCategoryPnLShare={handleShowPredictionsPnLShare}
            onRefreshPortfolio={data.refreshPortfolio}
            predictionPositions={data.predictionPositions}
            onPositionSold={data.handlePositionsRefresh}
            predictionSort={data.predictionSort}
            onSortChange={data.setPredictionSort}
            activePredictions={data.activePredictions}
            resolvedPredictions={data.resolvedPredictions}
            onPredictionClick={handlePredictionClick}
            predictionsError={data.predictionsError}
            compact={isMobile}
          />
        );
    }
  };

  return (
    <PageContainer noPadding className="flex flex-col">
      {/* Desktop Layout */}
      <div className="hidden flex-1 overflow-hidden xl:flex">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-[rgba(120,120,120,0.5)] lg:border-r lg:border-l">
          {/* Header */}
          <div className="sticky top-0 z-10 flex-shrink-0 bg-background shadow-sm">
            <div className="px-3 sm:px-4 lg:px-6">
              <MarketsToggle
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
            {activeTab !== 'dashboard' && (
              <div className="px-3 pb-3 sm:px-4 lg:px-6">
                <MarketsSearchInput
                  value={data.searchQuery}
                  onChange={data.setSearchQuery}
                  activeTab={activeTab}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div
            className={`flex-1 overflow-y-auto transition-opacity duration-150 ${
              isPending ? 'opacity-80' : 'opacity-100'
            }`}
          >
            {renderTabContent(false)}
          </div>

          {/* Login prompt for non-dashboard tabs */}
          {!data.authenticated && activeTab !== 'dashboard' && (
            <LoginPrompt onLogin={data.login} />
          )}
        </div>

        {/* Widget Sidebar */}
        <MarketsWidgetSidebar
          onMarketClick={(market) => {
            router.push(`/markets/perps/${market.ticker}?from=dashboard`);
          }}
          onPredictionClick={(marketId) => {
            router.push(`/markets/predictions/${marketId}?from=dashboard`);
          }}
        />
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex flex-1 flex-col overflow-hidden xl:hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 bg-background shadow-sm">
          <div className="px-3 sm:px-4">
            <MarketsToggle
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
          {activeTab !== 'dashboard' && (
            <div className="px-3 pb-3 sm:px-4">
              <MarketsSearchInput
                value={data.searchQuery}
                onChange={data.setSearchQuery}
                activeTab={activeTab}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto transition-opacity duration-150 ${
            isPending ? 'opacity-80' : 'opacity-100'
          }`}
        >
          {renderTabContent(true)}
        </div>

        {/* Login prompt for non-dashboard tabs */}
        {!data.authenticated && activeTab !== 'dashboard' && (
          <LoginPrompt onLogin={data.login} />
        )}
      </div>

      {/* Lazy loaded modals */}
      {showPnLShareModal && (
        <PortfolioPnLShareModal
          isOpen={showPnLShareModal}
          onClose={handleClosePnLShare}
          data={data.portfolioPnL}
          user={data.user ?? null}
          lastUpdated={data.portfolioUpdatedAt}
        />
      )}

      {showCategoryPnLShareModal === 'perps' && (
        <CategoryPnLShareModal
          isOpen={true}
          onClose={handleCloseCategoryPnLShare}
          category="perps"
          data={data.perpPnLData}
          user={data.user ?? null}
          lastUpdated={data.portfolioUpdatedAt}
        />
      )}

      {showCategoryPnLShareModal === 'predictions' && (
        <CategoryPnLShareModal
          isOpen={true}
          onClose={handleCloseCategoryPnLShare}
          category="predictions"
          data={data.predictionPnLData}
          user={data.user ?? null}
          lastUpdated={data.portfolioUpdatedAt}
        />
      )}

      {showBuyPointsModal && (
        <BuyPointsModal
          isOpen={showBuyPointsModal}
          onClose={handleCloseBuyPoints}
          onSuccess={() => {
            data.triggerBalanceRefresh();
            data.refetchData();
          }}
        />
      )}
    </PageContainer>
  );
}
