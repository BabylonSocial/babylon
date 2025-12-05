'use client';

import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  Info,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AssetTradesFeed } from '@/components/markets/AssetTradesFeed';
import { PredictionPositionsList } from '@/components/markets/PredictionPositionsList';
import { PredictionProbabilityChart } from '@/components/markets/PredictionProbabilityChart';
import {
  type BuyPredictionDetails,
  TradeConfirmationDialog,
} from '@/components/markets/TradeConfirmationDialog';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMarketTracking } from '@/hooks/usePostHog';
import { usePredictionHistory } from '@/hooks/usePredictionHistory';
import type {
  PredictionResolutionSSE,
  PredictionTradeSSE,
} from '@/hooks/usePredictionMarketStream';
import { usePredictionMarketStream } from '@/hooks/usePredictionMarketStream';
import {
  calculateExpectedPayout,
  PredictionPricing,
} from '@babylon/engine/client';
import { cn } from '@babylon/shared';

interface PredictionPosition {
  id: string;
  marketId: string;
  question: string;
  side: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  unrealizedPnL: number;
  resolved: boolean;
  resolution?: boolean | null;
}

interface PredictionMarket {
  id: number | string;
  text: string;
  status: 'active' | 'resolved' | 'cancelled';
  createdDate?: string;
  resolutionDate?: string;
  resolvedOutcome?: boolean;
  scenario: number;
  yesShares?: number;
  noShares?: number;
  liquidity?: number;
  resolved?: boolean;
  resolution?: boolean | null;
  resolutionProofUrl?: string | null;
  resolutionDescription?: string | null;
  yesProbability?: number;
  noProbability?: number;
  userPosition?: PredictionPosition | null;
  userPositions?: PredictionPosition[];
}

export default function PredictionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authenticated, login, getAccessToken } = useAuth();
  const marketId = params.id as string;
  const { trackMarketView } = useMarketTracking();
  const from = searchParams.get('from');

  const [market, setMarket] = useState<PredictionMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [userPositions, setUserPositions] = useState<PredictionPosition[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const recalculatePositionMetrics = useCallback(
    (
      positions: PredictionPosition[],
      nextYesShares: number,
      nextNoShares: number
    ) => {
      if (!positions.length || nextYesShares <= 0 || nextNoShares <= 0) {
        return positions;
      }

      return positions.map((position) => {
        if (position.shares <= 0) {
          return position;
        }

        try {
          const sellPreview = PredictionPricing.calculateSell(
            nextYesShares,
            nextNoShares,
            position.side === 'YES' ? 'yes' : 'no',
            position.shares
          );
          const currentValue = sellPreview.totalCost;
          const currentPrice = currentValue / position.shares;
          const costBasis =
            position.costBasis ?? position.shares * position.avgPrice;
          const unrealizedPnL = currentValue - costBasis;

          return {
            ...position,
            currentPrice,
            currentValue,
            costBasis,
            unrealizedPnL,
          };
        } catch (error) {
          console.warn('Failed to recalc prediction position', error);
          return position;
        }
      });
    },
    []
  );

  const effectiveShares = useMemo(() => {
    if (!market) {
      return null;
    }

    const yes = Number(market.yesShares ?? 0);
    const no = Number(market.noShares ?? 0);

    if (yes > 0 && no > 0) {
      return {
        yesShares: yes,
        noShares: no,
        liquidity: Number(market.liquidity ?? yes + no),
      };
    }

    const seeded = PredictionPricing.initializeMarket();
    return {
      yesShares: seeded.yesShares,
      noShares: seeded.noShares,
      liquidity: seeded.yesShares + seeded.noShares,
    };
  }, [market?.yesShares, market?.noShares, market?.liquidity, market]);

  const historySeed = useMemo(
    () =>
      market && effectiveShares
        ? {
            yesShares: effectiveShares.yesShares,
            noShares: effectiveShares.noShares,
            liquidity: effectiveShares.liquidity,
          }
        : undefined,
    [market, effectiveShares]
  );
  const { history: priceHistory } = usePredictionHistory(marketId ?? null, {
    seed: historySeed,
  });
  const amountNum = Number.parseFloat(amount) || 0;
  const calculation =
    amountNum > 0 && effectiveShares
      ? PredictionPricing.calculateBuy(
          effectiveShares.yesShares,
          effectiveShares.noShares,
          side,
          amountNum
        )
      : null;
  const expectedPayout = calculation
    ? calculateExpectedPayout(calculation.sharesBought, calculation.avgPrice)
    : 0;
  const expectedProfit = expectedPayout - amountNum;

  const handleTradeEvent = useCallback(
    (event: PredictionTradeSSE) => {
      setMarket((prev) => {
        if (!prev || prev.id.toString() !== event.marketId) {
          return prev;
        }
        return {
          ...prev,
          yesShares: event.yesShares,
          noShares: event.noShares,
          liquidity: event.liquidity ?? prev.liquidity,
          yesProbability: event.yesPrice,
          noProbability: event.noPrice,
        };
      });
      setUserPositions((prev) =>
        recalculatePositionMetrics(prev, event.yesShares, event.noShares)
      );
    },
    [recalculatePositionMetrics]
  );

  const handleResolutionEvent = useCallback(
    (event: PredictionResolutionSSE) => {
      setMarket((prev) => {
        if (!prev || prev.id.toString() !== event.marketId) {
          return prev;
        }
        return {
          ...prev,
          resolved: true,
          resolution: event.winningSide === 'yes',
          yesShares: event.yesShares,
          noShares: event.noShares,
          liquidity: event.liquidity ?? prev.liquidity,
          yesProbability: event.yesPrice,
          noProbability: event.noPrice,
        };
      });
      setUserPositions((prev) =>
        recalculatePositionMetrics(prev, event.yesShares, event.noShares)
      );
    },
    [recalculatePositionMetrics]
  );

  usePredictionMarketStream(marketId ?? null, {
    onTrade: handleTradeEvent,
    onResolution: handleResolutionEvent,
  });

  // Track market view
  useEffect(() => {
    if (marketId && market) {
      trackMarketView(marketId, 'prediction');
    }
  }, [marketId, market, trackMarketView]);

  const fetchMarketData = useCallback(async () => {
    const userId = authenticated && user?.id ? `?userId=${user.id}` : '';
    const response = await fetch(`/api/markets/predictions${userId}`);
    const data = await response.json();
    const foundMarket = data.questions?.find(
      (q: PredictionMarket) => q.id.toString() === marketId
    );

    if (!foundMarket) {
      toast.error('Market not found');
      router.push(from === 'dashboard' ? '/markets' : '/markets/predictions');
      return;
    }

    setMarket(foundMarket);
    const positions =
      (foundMarket.userPositions ?? []).length > 0
        ? (foundMarket.userPositions as PredictionPosition[])
        : foundMarket.userPosition
          ? [foundMarket.userPosition as PredictionPosition]
          : [];
    setUserPositions(positions);

    setLoading(false);
  }, [marketId, router, authenticated, user?.id, from]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const handleSubmit = () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!market || !user) return;

    const isExpired =
      market.resolutionDate &&
      new Date(market.resolutionDate).getTime() < Date.now();
    if (isExpired) {
      toast.error('This market has expired.');
      return;
    }
    if (market.resolved) {
      toast.error('This market is already resolved.');
      return;
    }

    const amountNum = Number.parseFloat(amount) || 0;
    if (amountNum < 1) {
      toast.error('Minimum bet is $1');
      return;
    }

    // Open confirmation dialog
    setConfirmDialogOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!market) return;

    const amountNum = Number.parseFloat(amount) || 0;
    setSubmitting(true);
    setConfirmDialogOpen(false);

    const token = await getAccessToken();
    if (!token) {
      toast.error('Authentication required. Please log in.');
      setSubmitting(false);
      return;
    }

    const response = await fetch(`/api/markets/predictions/${market.id}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        side,
        amount: amountNum,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        typeof data.error === 'object'
          ? data.error.message || 'Failed to buy shares'
          : data.error || data.message || 'Failed to buy shares';
      toast.error(errorMessage);
      setSubmitting(false);
      return;
    }
    const calculation = data.calculation;

    toast.success(`Bought ${side.toUpperCase()} shares!`, {
      description: `${calculation?.sharesBought?.toFixed(2) || ''} shares at ${(calculation?.avgPrice || 0).toFixed(3)} each`,
    });

    // Refresh data
    await fetchMarketData();
    setSubmitting(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getTimeUntilResolution = () => {
    if (!market?.resolutionDate) return null;
    const now = Date.now();
    const resolutionTime = new Date(market.resolutionDate).getTime();
    const diff = resolutionTime - now;

    if (diff < 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
    }
    if (hours > 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
    }
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m left`;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="w-full max-w-2xl space-y-4 text-center">
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!market) return null;

  const yesShares = effectiveShares?.yesShares ?? 0;
  const noShares = effectiveShares?.noShares ?? 0;
  const currentYesPrice = PredictionPricing.getCurrentPrice(
    yesShares,
    noShares,
    'yes'
  );
  const currentNoPrice = PredictionPricing.getCurrentPrice(
    yesShares,
    noShares,
    'no'
  );
  const timeLeft = getTimeUntilResolution();
  const totalVolume = yesShares + noShares;
  const totalTrades = Math.floor(totalVolume / 10); // Rough estimate

  return (
    <PageContainer className="mx-auto max-w-7xl" ref={pageContainerRef}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (from === 'dashboard') {
              router.push('/markets');
            } else {
              router.push('/markets/predictions');
            }
          }}
          className="mb-4 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {from === 'dashboard' ? 'Back to Dashboard' : 'Back to Predictions'}
        </button>

        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h1 className="flex-1 font-bold text-2xl">{market.text}</h1>
            {timeLeft && (
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{timeLeft}</span>
              </div>
            )}
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-muted/30 px-3 py-3">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground text-xs">
                <TrendingUp className="h-3 w-3" />
                Volume
              </div>
              <div className="font-bold text-lg">
                {formatPrice(totalVolume)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-3">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground text-xs">
                <Users className="h-3 w-3" />
                Trades
              </div>
              <div className="font-bold text-lg">{totalTrades}</div>
            </div>
            <div className="rounded-lg bg-green-600/15 px-3 py-3">
              <div className="mb-1 flex items-center gap-2 text-green-600 text-xs">
                <CheckCircle className="h-3 w-3" />
                YES
              </div>
              <div className="font-bold text-2xl text-green-600">
                {(currentYesPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-red-600/15 px-3 py-3">
              <div className="mb-1 flex items-center gap-2 text-red-600 text-xs">
                <XCircle className="h-3 w-3" />
                NO
              </div>
              <div className="font-bold text-2xl text-red-600">
                {(currentNoPrice * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Position */}
      {userPositions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-bold text-lg">Your Position</h2>
          <PredictionPositionsList
            positions={userPositions}
            onPositionSold={fetchMarketData}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card/50 px-4 py-3 backdrop-blur">
            <h2 className="mb-4 font-bold text-lg">Probability Over Time</h2>
            <PredictionProbabilityChart
              data={priceHistory}
              marketId={marketId}
              showBrush={true}
            />
          </div>

          {/* Market Info */}
          <div className="mt-4 rounded-lg bg-muted/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="mb-2 font-medium">How it works</h3>
                <p className="mb-2 text-muted-foreground text-sm">
                  Buy YES shares if you think this will happen, NO shares if you
                  think it won&apos;t.
                </p>
                <p className="text-muted-foreground text-sm">
                  If you&apos;re right, you&apos;ll receive $1 per share. The
                  current price reflects the market&apos;s probability.
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Info */}
          {market.resolutionDate && (
            <div className="mt-4 rounded-lg bg-muted/30 px-4 py-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Resolution Date & Time
                  </span>
                  <span className="font-medium text-sm">
                    {new Date(market.resolutionDate).toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Exact Time
                  </span>
                  <span className="font-medium text-sm">
                    {new Date(market.resolutionDate).toLocaleTimeString(
                      'en-US',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short',
                      }
                    )}
                  </span>
                </div>

                {/* Resolution Proof */}
                {market.resolutionProofUrl && (
                  <div className="mt-1 flex items-center justify-between border-border/50 border-t pt-2">
                    <span className="text-muted-foreground text-sm">Proof</span>
                    <a
                      href={market.resolutionProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-blue-500 text-sm hover:text-blue-400 hover:underline"
                    >
                      View Source <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Resolution Description */}
                {market.resolutionDescription && (
                  <div className="mt-1 border-border/50 border-t pt-2 text-muted-foreground text-sm">
                    <p className="mb-1 font-medium text-foreground text-xs uppercase tracking-wider">
                      Resolution Description
                    </p>
                    <p className="italic">"{market.resolutionDescription}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Trades */}
          <div className="mt-4 rounded-lg border border-border bg-card/50 p-4 backdrop-blur">
            <h2 className="mb-4 font-bold text-lg">Recent Trades</h2>
            <AssetTradesFeed
              marketType="prediction"
              assetId={marketId}
              containerRef={pageContainerRef}
            />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-2xl border border-border bg-card/50 px-4 py-3 backdrop-blur">
            <h2 className="mb-4 font-bold text-lg">Trade</h2>

            {/* YES/NO Tabs */}
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => setSide('yes')}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-3 rounded py-3 font-bold transition-all',
                  side === 'yes'
                    ? 'bg-green-600 text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <CheckCircle size={18} />
                YES
              </button>
              <button
                onClick={() => setSide('no')}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-3 rounded py-3 font-bold transition-all',
                  side === 'no'
                    ? 'bg-red-600 text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <XCircle size={18} />
                NO
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="mb-2 block font-medium text-muted-foreground text-sm">
                Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="1"
                className="w-full rounded bg-background px-4 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
                placeholder="Min: $1"
              />
            </div>

            {/* Trade Preview */}
            {calculation && (
              <div className="mb-4 rounded-lg bg-muted/20 px-4 py-3">
                <h3 className="mb-3 font-bold text-muted-foreground text-sm">
                  Trade Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Shares Received
                    </span>
                    <span className="font-bold">
                      {calculation.sharesBought.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Avg Price/Share
                    </span>
                    <span className="font-medium">
                      {formatPrice(calculation.avgPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      New {side.toUpperCase()} Price
                    </span>
                    <span className="font-medium">
                      {(
                        (side === 'yes'
                          ? calculation.newYesPrice
                          : calculation.newNoPrice) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span className="font-medium text-orange-500">
                      +{Math.abs(calculation.priceImpact).toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-2 border-border border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        If {side.toUpperCase()} Wins
                      </span>
                      <span className="font-bold text-green-600">
                        {formatPrice(expectedPayout)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span
                        className={cn(
                          'font-bold',
                          expectedProfit >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {expectedProfit >= 0 ? '+' : ''}
                        {formatPrice(expectedProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || amountNum < 1}
              className={cn(
                'w-full cursor-pointer rounded-lg py-4 font-bold text-lg text-primary-foreground transition-all',
                side === 'yes'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700',
                (submitting || amountNum < 1) && 'cursor-not-allowed opacity-50'
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  Buying Shares...
                </span>
              ) : authenticated ? (
                `BUY ${side.toUpperCase()} - ${formatPrice(amountNum)}`
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
        onConfirm={handleConfirmBuy}
        isSubmitting={submitting}
        tradeDetails={
          market && calculation
            ? ({
                type: 'buy-prediction',
                question: market.text,
                side: side.toUpperCase() as 'YES' | 'NO',
                amount: amountNum,
                sharesBought: calculation.sharesBought,
                avgPrice: calculation.avgPrice,
                newPrice:
                  side === 'yes'
                    ? calculation.newYesPrice
                    : calculation.newNoPrice,
                priceImpact: calculation.priceImpact,
                expectedPayout,
                expectedProfit,
              } as BuyPredictionDetails)
            : null
        }
      />
    </PageContainer>
  );
}
