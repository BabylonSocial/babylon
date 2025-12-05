'use client';

import { ArrowLeft, Search, TrendingDown, TrendingUp } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CategoryPnLCard } from '@/components/markets/CategoryPnLCard';
import { CategoryPnLShareModal } from '@/components/markets/CategoryPnLShareModal';
import { PerpPositionsList } from '@/components/markets/PerpPositionsList';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioPnL } from '@/hooks/usePortfolioPnL';
import { useUserPositions } from '@/hooks/useUserPositions';
import { usePerpMarkets, type PerpMarket } from '@/stores/perpMarketsStore';
import { cn } from '@babylon/shared';

export default function PerpsPage() {
  const router = useRouter();
  const { user, authenticated, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryPnLShareModal, setShowCategoryPnLShareModal] =
    useState(false);

  // Use shared perp markets store
  const { markets: perpMarkets, loading, refetch: refetchPerps } = usePerpMarkets();

  const {
    loading: portfolioLoading,
    error: portfolioError,
    refresh: refreshPortfolio,
    lastUpdated: portfolioUpdatedAt,
  } = usePortfolioPnL();

  const { perpPositions, refresh: refreshUserPositions } = useUserPositions(
    user?.id,
    { enabled: authenticated }
  );

  // Use refs to store latest values to break dependency chains
  const refreshPositionsRef = useRef<(() => Promise<void>) | null>(
    refreshUserPositions
  );
  const authenticatedRef = useRef(authenticated);
  const userIdRef = useRef<string | null>(user?.id || null);

  // Update refs when values change
  useEffect(() => {
    authenticatedRef.current = authenticated;
    userIdRef.current = user?.id || null;
  }, [authenticated, user?.id]);

  useEffect(() => {
    refreshPositionsRef.current = refreshUserPositions;
  }, [refreshUserPositions]);

  const handlePositionsRefresh = useCallback(async () => {
    if (refreshPositionsRef.current) {
      await refreshPositionsRef.current();
    }
    await refetchPerps();
  }, [refetchPerps]);

  const filteredPerpMarkets = perpMarkets.filter(
    (m) =>
      !searchQuery.trim() ||
      m.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Category P&L data
  const perpPnLData = useMemo(() => {
    if (perpPositions.length === 0) return null;
    const unrealizedPnL = perpPositions.reduce(
      (sum, pos) => sum + (pos.unrealizedPnL || 0),
      0
    );
    const totalValue = perpPositions.reduce(
      (sum, pos) => sum + Math.abs(pos.size || 0),
      0
    );
    const openInterest = perpPositions.reduce(
      (sum, pos) => sum + Math.abs(pos.size || 0),
      0
    );
    return {
      unrealizedPnL,
      positionCount: perpPositions.length,
      totalValue,
      categorySpecific: { openInterest },
    };
  }, [perpPositions]);

  const handleMarketClick = (market: PerpMarket) => {
    router.push(`/markets/perps/${market.ticker}?from=list`);
  };

  const formatPrice = (p: number) => `$${p.toFixed(2)}`;
  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${(v / 1e3).toFixed(2)}K`;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6 p-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 p-4">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/markets')}
            className="mb-4 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </button>
          <h1 className="font-bold text-3xl">Perpetual Futures</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search tickers"
            placeholder="Search tickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-muted/50 py-3 pr-4 pl-10 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
          />
        </div>

        {/* Category P&L Card */}
        {authenticated && perpPnLData && (
          <CategoryPnLCard
            category="perps"
            data={perpPnLData}
            loading={portfolioLoading}
            error={portfolioError}
            onShare={() => setShowCategoryPnLShareModal(true)}
            onRefresh={refreshPortfolio}
            lastUpdated={portfolioUpdatedAt}
          />
        )}

        {/* Show positions section if authenticated and has positions */}
        {authenticated && perpPositions.length > 0 && (
          <>
            <h2 className="font-bold text-muted-foreground text-sm">
              YOUR POSITIONS ({perpPositions.length})
            </h2>
            <PerpPositionsList
              positions={perpPositions}
              onPositionClosed={handlePositionsRefresh}
            />
          </>
        )}

        <h2 className="font-bold text-muted-foreground text-sm">ALL MARKETS</h2>
        <div className="space-y-2">
          {filteredPerpMarkets.map((market, idx) => (
            <button
              key={`market-${market.ticker}-${idx}`}
              onClick={() => handleMarketClick(market)}
              className="w-full cursor-pointer rounded bg-muted/30 p-3 text-left transition-all hover:bg-muted"
            >
              <div className="mb-2 flex justify-between">
                <div>
                  <div className="font-bold">${market.ticker}</div>
                  <div className="text-muted-foreground text-xs">
                    {market.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {formatPrice(market.currentPrice)}
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-end gap-1 font-medium text-xs',
                      market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {market.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {market.change24h >= 0 ? '+' : ''}
                    {market.changePercent24h.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-muted-foreground text-xs">
                <div>Vol: {formatVolume(market.volume24h)}</div>
                <div>OI: {formatVolume(market.openInterest)}</div>
                <div
                  className={
                    market.fundingRate.rate >= 0
                      ? 'text-orange-500'
                      : 'text-blue-500'
                  }
                >
                  Fund: {(market.fundingRate.rate * 100).toFixed(4)}%
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CTA for non-authenticated users */}
        {!authenticated && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#0066FF]/20 bg-gradient-to-br from-[#0066FF]/10 to-purple-500/10 px-4 py-16">
            <h3 className="mb-2 font-bold text-2xl">Start Trading Today</h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground text-sm">
              Log in to trade perpetual futures
            </p>
            <button
              onClick={login}
              className="cursor-pointer rounded-lg bg-[#0066FF] px-8 py-3 font-medium text-primary-foreground shadow-[#0066FF]/20 shadow-lg transition-colors hover:bg-[#2952d9]"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {/* Category P&L Share Modal */}
      {showCategoryPnLShareModal && (
        <CategoryPnLShareModal
          isOpen={true}
          onClose={() => setShowCategoryPnLShareModal(false)}
          category="perps"
          data={perpPnLData}
          user={user ?? null}
          lastUpdated={portfolioUpdatedAt}
        />
      )}
    </PageContainer>
  );
}
