'use client';

import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FollowButton } from '@/components/interactions';
import { useAuth } from '@/hooks/useAuth';
import { usePerpMarketsStore } from '@/stores/perpMarketsStore';
import {
  calculateExpectedPayout,
  PredictionPricing,
} from '@babylon/engine/client';
import { cn } from '@babylon/shared';

import type { PerpPositionFromAPI, PredictionPosition } from '@babylon/shared';

/**
 * Format error message from API response payload.
 *
 * Extracts error message from various API error response formats,
 * falling back to a default message if extraction fails.
 *
 * @param payload - Error payload from API response
 * @param fallback - Fallback error message
 * @returns Formatted error message string
 */
const formatErrorMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as {
    error?: string | { message?: string };
    message?: string;
  };

  if (typeof data.error === 'string') {
    return data.error;
  }

  if (
    data.error &&
    typeof data.error === 'object' &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  ) {
    return data.error.message;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  return fallback;
};

/**
 * Position detail modal component for viewing and managing positions.
 *
 * Displays a modal with detailed position information including entry price,
 * current price, PnL, and position metrics. Supports both prediction and
 * perpetual positions. Includes trading functionality (close/sell) with
 * confirmation dialogs. Handles body scroll lock and escape key.
 *
 * Features:
 * - Position details display
 * - PnL calculations
 * - Close/sell position functionality
 * - Confirmation dialogs
 * - Market data fetching
 * - Loading states
 * - Error handling
 *
 * @param props - PositionDetailModal component props
 * @returns Position detail modal element or null if not open
 *
 * @example
 * ```tsx
 * <PositionDetailModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   type="prediction"
 *   data={position}
 *   onSuccess={() => refreshPositions()}
 * />
 * ```
 */
interface PositionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'prediction' | 'perp';
  data: PredictionPosition | PerpPositionFromAPI | null;
  userId?: string; // User ID of the profile being viewed
  onSuccess?: () => void; // Callback after successful trade
}

/**
 * Perpetual market structure for position detail modal.
 */
interface PerpMarket {
  ticker: string;
  name: string;
  currentPrice: number;
  fundingRate: {
    rate: number;
    nextFundingTime: string;
  };
  maxLeverage: number;
  minOrderSize: number;
}

/**
 * Prediction market structure for position detail modal.
 */
interface PredictionMarket {
  id: number | string;
  text: string;
  yesShares?: number;
  noShares?: number;
  resolutionDate?: string;
}

export function PositionDetailModal({
  isOpen,
  onClose,
  type,
  data,
  userId,
  onSuccess,
}: PositionDetailModalProps) {
  const { user, authenticated, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'trade'>('details');

  // Trading state
  const [side, setSide] = useState<'long' | 'short' | 'yes' | 'no'>('long');
  const [size, setSize] = useState('100');
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  // Market data - use shared store for perps
  const fetchPerpMarketsFromStore = usePerpMarketsStore(
    (state) => state.fetchMarkets
  );
  const [perpMarket, setPerpMarket] = useState<PerpMarket | null>(null);
  const [predictionMarket, setPredictionMarket] =
    useState<PredictionMarket | null>(null);

  const fetchPerpMarket = useCallback(
    async (ticker: string) => {
      // Ensure store is populated
      await fetchPerpMarketsFromStore();
      // Get fresh markets from store
      const markets = usePerpMarketsStore.getState().markets;
      const market = markets.find(
        (m) => m.ticker.toLowerCase() === ticker.toLowerCase()
      );
      if (market) {
        setPerpMarket(market);
        setSide('long');
      }
    },
    [fetchPerpMarketsFromStore]
  );

  const fetchPredictionMarket = useCallback(async (marketId: string) => {
    const response = await fetch(`/api/markets/predictions/${marketId}`);
    if (response.ok) {
      const marketData = await response.json();
      setPredictionMarket(marketData);
      setSide('yes');
    }
  }, []);

  useEffect(() => {
    if (isOpen && data) {
      setActiveTab('details');
      // Fetch market data if needed for trading
      if (type === 'perp' && 'ticker' in data) {
        fetchPerpMarket((data as PerpPositionFromAPI).ticker);
      } else if (type === 'prediction' && 'marketId' in data) {
        fetchPredictionMarket((data as PredictionPosition).marketId);
      }
    }
  }, [isOpen, type, data, fetchPerpMarket, fetchPredictionMarket]);

  const handlePerpTrade = async () => {
    if (!user || !perpMarket) return;

    const sizeNum = parseFloat(size) || 0;
    if (sizeNum < perpMarket.minOrderSize) {
      toast.error(`Minimum order size is $${perpMarket.minOrderSize}`);
      return;
    }

    setLoading(true);
    const response = await fetch('/api/markets/perps/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${window.__privyAccessToken || ''}`,
      },
      body: JSON.stringify({
        ticker: perpMarket.ticker,
        side,
        size: sizeNum,
        leverage,
      }),
    });

    const responseData = await response.json();
    if (!response.ok) {
      toast.error(formatErrorMessage(responseData, 'Failed to open position'));
      setLoading(false);
      return;
    }

    toast.success('Position opened!');
    onClose();
    if (onSuccess) onSuccess();
    setLoading(false);
  };

  const handlePredictionTrade = async () => {
    if (!user || !predictionMarket) return;

    const amountNum = parseFloat(amount) || 0;
    if (amountNum < 1) {
      toast.error('Minimum bet is $1');
      return;
    }

    setLoading(true);
    const token =
      typeof window !== 'undefined' ? window.__privyAccessToken : null;
    if (!token) {
      toast.error('Authentication required');
      setLoading(false);
      return;
    }

    const response = await fetch(
      `/api/markets/predictions/${predictionMarket.id}/buy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          side,
          amount: amountNum,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(formatErrorMessage(errorData, 'Failed to buy shares'));
      setLoading(false);
      return;
    }

    toast.success(`Bought ${side.toUpperCase()} shares!`);
    onClose();
    if (onSuccess) onSuccess();
    setLoading(false);
  };

  if (!isOpen || !data) return null;

  const formatPoints = (points: number) => {
    return points.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate prediction trade preview
  const getPredictionCalculation = () => {
    if (!predictionMarket || type !== 'prediction') return null;
    const yesShares = predictionMarket.yesShares || 500;
    const noShares = predictionMarket.noShares || 500;
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) return null;
    return PredictionPricing.calculateBuy(
      yesShares,
      noShares,
      side as 'yes' | 'no',
      amountNum
    );
  };

  const predictionCalc = getPredictionCalculation();
  const expectedPayout = predictionCalc
    ? calculateExpectedPayout(
        predictionCalc.sharesBought,
        predictionCalc.avgPrice
      )
    : 0;
  const expectedProfit = expectedPayout - (parseFloat(amount) || 0);

  // Calculate perp trade preview
  const sizeNum = parseFloat(size) || 0;
  const marginRequired = perpMarket ? sizeNum / leverage : 0;
  const positionValue = sizeNum * leverage;
  const liquidationPrice =
    perpMarket && type === 'perp' && 'currentPrice' in data
      ? side === 'long'
        ? perpMarket.currentPrice * (1 - 0.9 / leverage)
        : perpMarket.currentPrice * (1 + 0.9 / leverage)
      : 0;
  const liquidationDistance =
    perpMarket && liquidationPrice > 0
      ? side === 'long'
        ? ((perpMarket.currentPrice - liquidationPrice) /
            perpMarket.currentPrice) *
          100
        : ((liquidationPrice - perpMarket.currentPrice) /
            perpMarket.currentPrice) *
          100
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-border border-b bg-background p-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-foreground text-xl">
              {type === 'prediction' && 'Prediction'}
              {type === 'perp' && 'Stock'}
            </h2>
            {userId && authenticated && user && user.id !== userId && (
              <FollowButton
                userId={userId}
                size="sm"
                variant="button"
                className="ml-2"
              />
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-border border-b">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex-1 px-4 py-3 font-medium transition-colors',
              activeTab === 'details'
                ? 'border-[#0066FF] border-b-2 text-[#0066FF]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart3 className="mr-2 inline h-4 w-4" />
            Details
          </button>
          {(type === 'prediction' || type === 'perp') && (
            <button
              onClick={() => {
                if (!authenticated) {
                  login();
                  return;
                }
                setActiveTab('trade');
              }}
              className={cn(
                'flex-1 px-4 py-3 font-medium transition-colors',
                activeTab === 'trade'
                  ? 'border-[#0066FF] border-b-2 text-[#0066FF]'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Zap className="mr-2 inline h-4 w-4" />
              Trade
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6 p-4">
          {activeTab === 'details' && (
            <>
              {/* Prediction Position Details */}
              {type === 'prediction' && 'question' in data && (
                <>
                  <div>
                    <h3 className="mb-2 font-semibold text-foreground text-lg">
                      {(data as PredictionPosition).question}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-2 py-1 font-medium text-sm',
                          (data as PredictionPosition).side === 'YES'
                            ? 'bg-green-600/20 text-green-600'
                            : 'bg-red-600/20 text-red-600'
                        )}
                      >
                        {(data as PredictionPosition).side}
                      </span>
                      {(data as PredictionPosition).resolved !== undefined && (
                        <span
                          className={cn(
                            'rounded px-2 py-1 text-xs',
                            (data as PredictionPosition).resolved
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-blue-600/20 text-blue-600'
                          )}
                        >
                          {(data as PredictionPosition).resolved
                            ? 'Resolved'
                            : 'Active'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Shares
                      </div>
                      <div className="font-bold text-foreground text-lg">
                        {(data as PredictionPosition).shares.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Avg Entry Price
                      </div>
                      <div className="font-bold text-foreground text-lg">
                        {formatPrice((data as PredictionPosition).avgPrice)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Current Price
                      </div>
                      <div className="font-bold text-foreground text-lg">
                        {formatPrice((data as PredictionPosition).currentPrice)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        P&L
                      </div>
                      <div
                        className={cn(
                          'font-bold text-lg',
                          (data as PredictionPosition).currentPrice -
                            (data as PredictionPosition).avgPrice >=
                            0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {formatPercent(
                          (((data as PredictionPosition).currentPrice -
                            (data as PredictionPosition).avgPrice) /
                            (data as PredictionPosition).avgPrice) *
                            100
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Perp Position Details */}
              {type === 'perp' && 'ticker' in data && (
                <>
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground text-lg">
                      {(data as PerpPositionFromAPI).ticker}
                      {(data as PerpPositionFromAPI).unrealizedPnLPercent >=
                      0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-2 py-1 font-medium text-sm',
                          (data as PerpPositionFromAPI).side === 'LONG'
                            ? 'bg-green-600/20 text-green-600'
                            : 'bg-red-600/20 text-red-600'
                        )}
                      >
                        {(data as PerpPositionFromAPI).side}
                      </span>
                      {(data as PerpPositionFromAPI).leverage && (
                        <span className="rounded bg-muted px-2 py-1 text-muted-foreground text-xs">
                          {(data as PerpPositionFromAPI).leverage}x Leverage
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Position Size
                      </div>
                      <div className="font-bold text-foreground text-lg">
                        {formatPoints((data as PerpPositionFromAPI).size)} pts
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Entry Price
                      </div>
                      <div className="font-bold text-foreground text-lg">
                        {formatPrice((data as PerpPositionFromAPI).entryPrice)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Current Price
                      </div>
                      <div className="font-bold text-foreground text-lg">
                        {formatPrice(
                          (data as PerpPositionFromAPI).currentPrice
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-1 text-muted-foreground text-xs">
                        Unrealized P&L
                      </div>
                      <div
                        className={cn(
                          'font-bold text-lg',
                          (data as PerpPositionFromAPI).unrealizedPnL >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {formatPoints(
                          (data as PerpPositionFromAPI).unrealizedPnL
                        )}{' '}
                        pts
                      </div>
                    </div>
                    {(data as PerpPositionFromAPI).liquidationPrice && (
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="mb-1 text-muted-foreground text-xs">
                          Liquidation Price
                        </div>
                        <div className="font-bold text-lg text-red-600">
                          {formatPrice(
                            (data as PerpPositionFromAPI).liquidationPrice
                          )}
                        </div>
                      </div>
                    )}
                    {(data as PerpPositionFromAPI).fundingPaid !==
                      undefined && (
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="mb-1 text-muted-foreground text-xs">
                          Funding Paid
                        </div>
                        <div className="font-bold text-foreground text-lg">
                          {formatPoints(
                            (data as PerpPositionFromAPI).fundingPaid
                          )}{' '}
                          pts
                        </div>
                      </div>
                    )}
                    {(data as PerpPositionFromAPI).openedAt && (
                      <div className="col-span-2 rounded-lg bg-muted/30 p-3">
                        <div className="mb-1 flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          Opened
                        </div>
                        <div className="font-medium text-foreground text-sm">
                          {formatDate((data as PerpPositionFromAPI).openedAt)}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'trade' && (
            <>
              {/* Prediction Trading */}
              {type === 'prediction' && predictionMarket && (
                <>
                  <div className="rounded bg-muted p-4">
                    <p className="font-medium text-foreground">
                      {predictionMarket.text}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded bg-green-600/15 p-3">
                      <div className="mb-1 text-green-600 text-xs">YES</div>
                      <div className="font-bold text-2xl text-green-600">
                        {(() => {
                          const totalShares =
                            (predictionMarket.yesShares || 0) +
                            (predictionMarket.noShares || 0);
                          return totalShares === 0
                            ? '50.0'
                            : (
                                ((predictionMarket.yesShares || 0) /
                                  totalShares) *
                                100
                              ).toFixed(1);
                        })()}%
                      </div>
                    </div>
                    <div className="rounded bg-red-600/15 p-3">
                      <div className="mb-1 text-red-600 text-xs">NO</div>
                      <div className="font-bold text-2xl text-red-600">
                        {(() => {
                          const totalShares =
                            (predictionMarket.yesShares || 0) +
                            (predictionMarket.noShares || 0);
                          return totalShares === 0
                            ? '50.0'
                            : (
                                ((predictionMarket.noShares || 0) /
                                  totalShares) *
                                100
                              ).toFixed(1);
                        })()}%
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSide('yes')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded py-3 font-bold transition-all',
                        side === 'yes'
                          ? 'bg-green-600 text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <CheckCircle size={18} />
                      BUY YES
                    </button>
                    <button
                      onClick={() => setSide('no')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded py-3 font-bold transition-all',
                        side === 'no'
                          ? 'bg-red-600 text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <XCircle size={18} />
                      BUY NO
                    </button>
                  </div>

                  <div>
                    <label className="mb-2 block text-muted-foreground text-sm">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="1"
                      className="w-full rounded bg-muted/50 px-4 py-3 font-medium text-base text-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
                      placeholder="Min: $1"
                    />
                  </div>

                  {predictionCalc && (
                    <div className="space-y-2 rounded bg-muted/20 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Shares Received
                        </span>
                        <span className="font-bold text-foreground">
                          {predictionCalc.sharesBought.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          If {side.toUpperCase()} Wins
                        </span>
                        <span className="font-bold text-green-600">
                          {formatPrice(expectedPayout)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Expected Profit
                        </span>
                        <span
                          className={cn(
                            'font-bold',
                            expectedProfit >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {formatPrice(expectedProfit)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePredictionTrade}
                    disabled={loading || parseFloat(amount) < 1}
                    className={cn(
                      'w-full rounded py-3 font-bold text-foreground transition-all',
                      side === 'yes'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700',
                      (loading || parseFloat(amount) < 1) &&
                        'cursor-not-allowed opacity-50'
                    )}
                  >
                    {loading ? 'Placing Bet...' : `BUY ${side.toUpperCase()}`}
                  </button>
                </>
              )}

              {/* Perp Trading */}
              {type === 'perp' && perpMarket && (
                <>
                  <div className="rounded bg-muted p-4">
                    <div className="mb-1 text-muted-foreground text-sm">
                      Current Price
                    </div>
                    <div className="font-bold text-2xl text-foreground">
                      {formatPrice(perpMarket.currentPrice)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSide('long')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded py-3 font-bold transition-all',
                        side === 'long'
                          ? 'bg-green-600 text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <TrendingUp size={18} />
                      LONG
                    </button>
                    <button
                      onClick={() => setSide('short')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded py-3 font-bold transition-all',
                        side === 'short'
                          ? 'bg-red-600 text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <TrendingDown size={18} />
                      SHORT
                    </button>
                  </div>

                  <div className="space-y-4 rounded bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-muted-foreground text-sm">
                        Position Size (USD)
                      </label>
                      <input
                        type="number"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        min={perpMarket.minOrderSize}
                        step="10"
                        className="w-32 rounded bg-background/50 px-3 py-1.5 text-right font-medium text-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
                        placeholder={`Min: $${perpMarket.minOrderSize}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-muted-foreground text-sm">
                          Leverage
                        </label>
                        <span className="font-bold text-base text-foreground">
                          {leverage}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={perpMarket.maxLeverage}
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded bg-background"
                      />
                      <div className="mt-1 flex justify-between text-muted-foreground text-xs">
                        <span>1x</span>
                        <span>{perpMarket.maxLeverage}x</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded bg-muted/20 p-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground">
                        Margin Required
                      </span>
                      <span className="text-right font-bold text-foreground">
                        {formatPrice(marginRequired)}
                      </span>
                      <span className="text-muted-foreground">
                        Position Value
                      </span>
                      <span className="text-right font-bold text-foreground">
                        {formatPrice(positionValue)}
                      </span>
                      <span className="text-muted-foreground">
                        Liquidation Price
                      </span>
                      <span className="text-right font-bold text-red-600">
                        {formatPrice(liquidationPrice)}
                      </span>
                      <span className="text-muted-foreground">
                        Distance to Liq
                      </span>
                      <span
                        className={cn(
                          'text-right font-medium',
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
                  </div>

                  {leverage > 50 && (
                    <div className="flex items-start gap-3 rounded bg-yellow-500/15 p-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                      <div className="text-sm">
                        <div className="mb-1 font-bold text-yellow-600">
                          High Risk Position
                        </div>
                        <p className="text-muted-foreground">
                          Leverage above 50x is extremely risky. Small price
                          movements can lead to liquidation.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePerpTrade}
                    disabled={loading || sizeNum < perpMarket.minOrderSize}
                    className={cn(
                      'w-full rounded py-3 font-bold text-foreground transition-all',
                      side === 'long'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700',
                      (loading || sizeNum < perpMarket.minOrderSize) &&
                        'cursor-not-allowed opacity-50'
                    )}
                  >
                    {loading
                      ? 'Opening Position...'
                      : `${side === 'long' ? 'LONG' : 'SHORT'} ${perpMarket.ticker} ${leverage}x`}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-border border-t bg-background p-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-muted px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
