'use client';

// @ts-nocheck

import {
  AlertTriangle,
  ArrowLeft,
  Info,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AssetTradesFeed } from '@/components/markets/AssetTradesFeed';
import { PerpPositionsList } from '@/components/markets/PerpPositionsList';
import { PerpPriceChart } from '@/components/markets/PerpPriceChart';
import {
  type OpenPerpDetails,
  TradeConfirmationDialog,
} from '@/components/markets/TradeConfirmationDialog';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { usePerpTrade } from '@/hooks/usePerpTrade';
import { useMarketTracking } from '@/hooks/usePostHog';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { usePerpMarket } from '@/stores/perpMarketsStore';
import { FEE_CONFIG } from '@babylon/engine/client';
import { cn } from '@babylon/shared';

interface PricePoint {
  time: number;
  price: number;
}

export default function PerpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authenticated, login, getAccessToken } = useAuth();
  const ticker = params.ticker as string;
  const { trackMarketView } = useMarketTracking();
  const from = searchParams.get('from');

  // Use shared perp markets store
  const { market, loading, refetch } = usePerpMarket(ticker);

  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('100');
  const [leverage, setLeverage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const { perpPositions, refresh: refreshUserPositions } = useUserPositions(
    user?.id,
    {
      enabled: authenticated,
    }
  );
  const userPositions = useMemo(
    () => perpPositions.filter((position) => position.ticker === ticker),
    [perpPositions, ticker]
  );
  const { openPosition } = usePerpTrade({
    getAccessToken,
  });
  const {
    balance,
    loading: balanceLoading,
    refresh: refreshWalletBalance,
  } = useWalletBalance(user?.id, { enabled: authenticated });

  const trackedTicker = market?.ticker ?? ticker;
  const livePrices = useMarketPrices(trackedTicker ? [trackedTicker] : []);
  const livePrice = trackedTicker ? livePrices.get(trackedTicker) : undefined;
  const displayPrice = livePrice?.price ?? market?.currentPrice ?? 0;

  // Track market view
  useEffect(() => {
    if (ticker && market) {
      trackMarketView(ticker, 'perp');
    }
  }, [ticker, market, trackMarketView]);

  // Redirect if market not found after loading
  useEffect(() => {
    if (!loading && !market) {
      toast.error('Market not found');
      router.push(from === 'dashboard' ? '/markets' : '/markets/perps');
    }
  }, [loading, market, router, from]);

  // Generate price history when market loads
  useEffect(() => {
    if (!market) return;

    // Generate mock price history (you'll want to replace this with real data)
    const now = Date.now();
    const history: PricePoint[] = [];
    const basePrice = market.currentPrice;
    const volatility = basePrice * 0.02; // 2% volatility

    for (let i = 100; i >= 0; i--) {
      const time = now - i * 15 * 60 * 1000; // 15 min intervals for last ~25 hours
      const randomChange = (Math.random() - 0.5) * volatility;
      const price =
        basePrice +
        randomChange +
        ((market.change24h / 100) * (100 - i)) / 100;
      history.push({ time, price });
    }

    setPriceHistory(history);
  }, [market]);

  const handlePositionClosed = useCallback(async () => {
    await Promise.all([refreshUserPositions(), refreshWalletBalance(), refetch()]);
  }, [refreshUserPositions, refreshWalletBalance, refetch]);

  const handleSubmit = () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!market || !user) return;

    const sizeNum = Number.parseFloat(size) || 0;
    if (sizeNum < market.minOrderSize) {
      toast.error(`Minimum order size is $${market.minOrderSize}`);
      return;
    }

    if (authenticated && showBalanceWarning) {
      toast.error('Insufficient balance for margin + fees');
      return;
    }

    // Open confirmation dialog
    setConfirmDialogOpen(true);
  };

  const handleConfirmOpen = async () => {
    if (!market) return;

    const sizeNum = Number.parseFloat(size) || 0;
    setSubmitting(true);
    setConfirmDialogOpen(false);

    await openPosition({
      ticker: market.ticker,
      side,
      size: sizeNum,
      leverage,
    })
      .then(async () => {
        toast.success('Position opened!', {
          description: `Opened ${leverage}x ${side} on ${market.ticker} at $${displayPrice.toFixed(2)}`,
        });

        await Promise.all([
          refetch(),
          refreshUserPositions(),
          refreshWalletBalance(),
        ]);
      })
      .catch((error: Error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (v: number) => {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${(v / 1e3).toFixed(2)}K`;
  };

  const sizeNum = Number.parseFloat(size) || 0;
  const baseMargin = sizeNum > 0 ? sizeNum / leverage : 0;
  const estimatedFee = sizeNum > 0 ? sizeNum * FEE_CONFIG.TRADING_FEE_RATE : 0;
  const totalRequired = sizeNum > 0 ? baseMargin + estimatedFee : 0;
  const hasSufficientBalance = !authenticated || balance >= totalRequired;
  const showBalanceWarning =
    authenticated && sizeNum > 0 && !hasSufficientBalance;
  // Update price history when live price changes
  useEffect(() => {
    if (!livePrice) return;
    setPriceHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.price - livePrice.price) < 1e-6) {
        return prev;
      }
      const next = [...prev, { time: Date.now(), price: livePrice.price }];
      const maxPoints = 200;
      return next.slice(Math.max(0, next.length - maxPoints));
    });
  }, [livePrice]);

  const liquidationPrice =
    side === 'long'
      ? displayPrice * (1 - 0.9 / leverage)
      : displayPrice * (1 + 0.9 / leverage);

  const positionValue = sizeNum * leverage;
  const liquidationDistance =
    side === 'long'
      ? ((displayPrice - liquidationPrice) / displayPrice) * 100
      : ((liquidationPrice - displayPrice) / displayPrice) * 100;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="w-full max-w-md space-y-4 px-4 text-center">
            <Skeleton className="mx-auto h-12 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="mx-auto h-8 w-3/4" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!market) return null;

  const isHighRisk = leverage > 50 || baseMargin > 1000;

  return (
    <PageContainer className="mx-auto max-w-7xl" ref={pageContainerRef}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (from === 'dashboard') {
              router.push('/markets');
            } else {
              router.push('/markets/perps');
            }
          }}
          className="mb-4 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {from === 'dashboard' ? 'Back to Dashboard' : 'Back to Perps'}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-1 font-bold text-3xl">${market.ticker}</h1>
            <p className="text-muted-foreground">{market.name}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-3xl">
              {formatPrice(displayPrice)}
            </div>
            <div
              className={cn(
                'flex items-center justify-end gap-2 font-bold text-lg',
                market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {market.change24h >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {market.change24h >= 0 ? '+' : ''}
              {formatPrice(market.change24h)} (
              {market.changePercent24h.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="mb-1 text-muted-foreground text-xs">24h High</div>
            <div className="font-bold text-lg">
              {formatPrice(market.high24h)}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="mb-1 text-muted-foreground text-xs">24h Low</div>
            <div className="font-bold text-lg">
              {formatPrice(market.low24h)}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="mb-1 text-muted-foreground text-xs">24h Volume</div>
            <div className="font-bold text-lg">
              {formatVolume(market.volume24h)}
            </div>
          </div>
        </div>
      </div>

      {/* User Positions */}
      {userPositions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-bold text-lg">Your Positions</h2>
          <PerpPositionsList
            positions={userPositions}
            onPositionClosed={handlePositionClosed}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur">
            <h2 className="mb-4 font-bold text-lg">Price Chart</h2>
            <PerpPriceChart
              data={priceHistory}
              currentPrice={displayPrice}
              ticker={ticker}
            />
          </div>

          {/* Funding Rate Info */}
          <div className="mt-4 rounded-lg bg-muted/30 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">Funding Rate</span>
                  <span
                    className={cn(
                      'font-bold',
                      market.fundingRate.rate >= 0
                        ? 'text-orange-500'
                        : 'text-blue-500'
                    )}
                  >
                    {(market.fundingRate.rate * 100).toFixed(4)}% / 8h
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {market.fundingRate.rate >= 0
                    ? 'Long positions pay shorts every 8 hours'
                    : 'Short positions pay longs every 8 hours'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="mt-4 rounded-lg border border-border bg-card/50 p-4 backdrop-blur">
            <h2 className="mb-4 font-bold text-lg">Recent Trades</h2>
            <AssetTradesFeed
              marketType="perp"
              assetId={ticker}
              containerRef={pageContainerRef}
            />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border border-border bg-card/50 p-4 backdrop-blur">
            <h2 className="mb-4 font-bold text-lg">Trade</h2>

            {authenticated && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Balance
                </span>
                <span className="font-semibold text-foreground">
                  {balanceLoading ? '...' : formatPrice(balance)}
                </span>
              </div>
            )}

            {/* Long/Short Tabs */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setSide('long')}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded py-3 font-bold transition-all',
                  side === 'long'
                    ? 'bg-green-600 text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <TrendingUp size={18} />
                LONG
              </button>
              <button
                onClick={() => setSide('short')}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded py-3 font-bold transition-all',
                  side === 'short'
                    ? 'bg-red-600 text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <TrendingDown size={18} />
                SHORT
              </button>
            </div>

            {/* Size & Leverage */}
            <div className="mb-4 space-y-4 rounded-lg bg-muted/30 p-4">
              <div>
                <label className="mb-2 block font-medium text-muted-foreground text-sm">
                  Position Size (USD)
                </label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  min={market.minOrderSize}
                  step="10"
                  className="w-full rounded bg-background px-4 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
                  placeholder={`Min: $${market.minOrderSize}`}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-medium text-muted-foreground text-sm">
                    Leverage
                  </label>
                  <span className="font-bold text-xl">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={market.maxLeverage}
                  value={leverage}
                  onChange={(e) => setLeverage(Number.parseInt(e.target.value))}
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-muted"
                  style={{
                    background: `linear-gradient(to right, ${side === 'long' ? '#16a34a' : '#dc2626'} 0%, ${side === 'long' ? '#16a34a' : '#dc2626'} ${(leverage / market.maxLeverage) * 100}%, hsl(var(--muted)) ${(leverage / market.maxLeverage) * 100}%, hsl(var(--muted)) 100%)`,
                  }}
                />
                <div className="mt-1 flex justify-between text-muted-foreground text-xs">
                  <span>1x</span>
                  <span>{market.maxLeverage}x</span>
                </div>
              </div>
            </div>

            {/* Position Preview */}
            <div className="mb-4 rounded-lg bg-muted/20 p-4">
              <h3 className="mb-3 font-bold text-muted-foreground text-sm">
                Position Preview
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin Required</span>
                  <span className="font-bold">{formatPrice(baseMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position Value</span>
                  <span className="font-bold">
                    {formatPrice(positionValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry Price</span>
                  <span className="font-medium">
                    {formatPrice(displayPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Liquidation Price
                  </span>
                  <span className="font-bold text-red-600">
                    {formatPrice(liquidationPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance to Liq</span>
                  <span
                    className={cn(
                      'font-medium',
                      liquidationDistance > 5
                        ? 'text-green-600'
                        : liquidationDistance > 2
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    )}
                  >
                    {liquidationDistance.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Est. Trading Fee (
                    {(FEE_CONFIG.TRADING_FEE_RATE * 100).toFixed(1)}%)
                  </span>
                  <span className="font-bold">{formatPrice(estimatedFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Required</span>
                  <span className="font-bold">
                    {formatPrice(totalRequired)}
                  </span>
                </div>
              </div>
            </div>

            {authenticated && (
              <>
                <div className="mb-2 text-muted-foreground text-sm">
                  Required (margin + est. fee):{' '}
                  <span className="font-semibold text-foreground">
                    {formatPrice(totalRequired)}
                  </span>
                  {estimatedFee > 0 && (
                    <span className="ml-1">
                      (fee ≈ {formatPrice(estimatedFee)})
                    </span>
                  )}
                </div>
                {showBalanceWarning && (
                  <div className="mb-4 text-red-500 text-xs">
                    Insufficient balance to cover margin and fees for this
                    trade.
                  </div>
                )}
              </>
            )}

            {/* High Risk Warning */}
            {isHighRisk && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-yellow-500/15 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
                <div className="text-sm">
                  <div className="mb-1 font-bold text-yellow-600">
                    High Risk Position
                  </div>
                  <p className="text-muted-foreground">
                    {leverage > 50 && 'Leverage above 50x is extremely risky. '}
                    {baseMargin > 1000 &&
                      'This position requires significant margin. '}
                    Small price movements can lead to liquidation.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                sizeNum < market.minOrderSize ||
                (authenticated && showBalanceWarning) ||
                balanceLoading
              }
              className={cn(
                'w-full cursor-pointer rounded-lg py-4 font-bold text-lg text-primary-foreground transition-all',
                side === 'long'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700',
                (submitting ||
                  sizeNum < market.minOrderSize ||
                  (authenticated && showBalanceWarning) ||
                  balanceLoading) &&
                  'cursor-not-allowed opacity-50'
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Opening Position...
                </span>
              ) : authenticated ? (
                `${side === 'long' ? 'LONG' : 'SHORT'} ${market.ticker} ${leverage}x`
              ) : (
                'Connect Wallet to Trade'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <TradeConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmOpen}
        isSubmitting={submitting}
        tradeDetails={
          market
            ? ({
                type: 'open-perp',
                ticker: market.ticker,
                side,
                size: sizeNum,
                leverage,
                entryPrice: displayPrice,
                margin: baseMargin,
                estimatedFee,
                liquidationPrice,
                liquidationDistance,
              } as OpenPerpDetails)
            : null
        }
      />
    </PageContainer>
  );
}
