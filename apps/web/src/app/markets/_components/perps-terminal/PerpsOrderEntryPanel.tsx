'use client';

import { FEE_CONFIG } from '@babylon/engine/config/fees';
import { BABYLON_POINTS_SYMBOL, cn } from '@babylon/shared';
import { Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type OpenPerpDetails,
  TradeConfirmationDialog,
} from '@/components/markets/TradeConfirmationDialog';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { usePerpTrade } from '@/hooks/usePerpTrade';
import { invalidatePerpMarketsCache } from '@/stores/perpMarketsStore';
import {
  invalidateUserPositions,
  usePerpPositions,
} from '@/stores/userPositionsStore';
import {
  invalidateWalletBalance,
  useWalletBalance,
} from '@/stores/walletBalanceStore';
import type { PerpMarket } from '@/types/markets';
import { formatBalance, formatPrice } from '../../_lib/formatters';

interface PerpsOrderEntryPanelProps {
  market: PerpMarket | null;
  initialSide?: 'long' | 'short';
  onRequestBuyPoints?: () => void;
}

export function PerpsOrderEntryPanel({
  market,
  initialSide,
  onRequestBuyPoints,
}: PerpsOrderEntryPanelProps) {
  const { user, authenticated, login } = useAuth();
  const userId = authenticated ? (user?.id ?? null) : null;

  const {
    balance,
    loading: balanceLoading,
    refresh: refreshWalletBalance,
  } = useWalletBalance(userId);
  const {
    positions: perpPositions,
    loading: positionsLoading,
    refresh: refreshUserPositions,
  } = usePerpPositions(userId);

  const { openPosition } = usePerpTrade();

  const [side, setSide] = useState<'long' | 'short'>(initialSide ?? 'long');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [size, setSize] = useState('100');
  const [leverage, setLeverage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (!initialSide) return;
    setSide(initialSide);
  }, [initialSide]);

  const activePositions = useMemo(() => {
    if (!market) return [];
    return perpPositions.filter(
      (p) => p.ticker.toLowerCase() === market.ticker.toLowerCase()
    );
  }, [perpPositions, market]);

  const existingPosition = useMemo(() => {
    const openPositions = activePositions.filter((p) => !p.closedAt);
    if (openPositions.length === 0) return null;

    const first = openPositions[0];
    if (!first) return null;

    return openPositions.reduce<(typeof openPositions)[number]>((best, pos) => {
      const bestTs = Number.isFinite(Date.parse(best.openedAt))
        ? Date.parse(best.openedAt)
        : 0;
      const posTs = Number.isFinite(Date.parse(pos.openedAt))
        ? Date.parse(pos.openedAt)
        : 0;

      if (posTs !== bestTs) {
        return posTs > bestTs ? pos : best;
      }

      if (pos.size !== best.size) {
        return pos.size > best.size ? pos : best;
      }

      return best;
    }, first);
  }, [activePositions]);

  const sizeNum = Number.parseFloat(size) || 0;
  const effectiveMaxLeverage = market?.maxLeverage ?? 100;
  const clampedLeverage = Math.min(Math.max(leverage, 1), effectiveMaxLeverage);

  const baseMargin = sizeNum > 0 ? sizeNum / clampedLeverage : 0;
  const estimatedFee = sizeNum > 0 ? sizeNum * FEE_CONFIG.TRADING_FEE_RATE : 0;
  const totalRequired = sizeNum > 0 ? baseMargin + estimatedFee : 0;
  const hasSufficientBalance = !authenticated || balance >= totalRequired;
  const showBalanceWarning =
    authenticated && sizeNum > 0 && !hasSufficientBalance;

  const rebalanceInfo = useMemo(() => {
    if (!market) return null;
    if (!existingPosition) return null;
    if (sizeNum <= 0) return null;

    const isSameSide = existingPosition.side === side;
    const newTotalSize = existingPosition.size + sizeNum;

    if (isSameSide) {
      return {
        type: 'add' as const,
        label: 'Add to Position',
        description: `Adding ${formatPrice(sizeNum)} to your ${existingPosition.side.toUpperCase()} position`,
        newSize: newTotalSize,
      };
    }

    if (sizeNum < existingPosition.size) {
      return {
        type: 'reduce' as const,
        label: 'Reduce Position',
        description: `Reducing your ${existingPosition.side.toUpperCase()} by ${formatPrice(sizeNum)}`,
        newSize: existingPosition.size - sizeNum,
      };
    }

    if (Math.abs(sizeNum - existingPosition.size) < 0.01) {
      return {
        type: 'close' as const,
        label: 'Close Position',
        description: `Closing your ${existingPosition.side.toUpperCase()} position`,
        newSize: 0,
      };
    }

    const flipSize = sizeNum - existingPosition.size;
    return {
      type: 'flip' as const,
      label: 'Flip Position',
      description: `Closing ${existingPosition.side.toUpperCase()} and opening ${side.toUpperCase()} ${formatPrice(flipSize)}`,
      newSize: flipSize,
    };
  }, [existingPosition, market, side, sizeNum]);

  const submitLabel = useMemo(() => {
    if (submitting) return 'Processing…';
    if (!authenticated) return 'Log In to Trade';
    if (rebalanceInfo) {
      const labels = {
        add: 'ADD TO POSITION',
        reduce: 'REDUCE POSITION',
        close: 'CLOSE POSITION',
        flip: 'FLIP POSITION',
      } as const;
      return labels[rebalanceInfo.type];
    }
    return `PLACE ${side.toUpperCase()} ORDER`;
  }, [authenticated, rebalanceInfo, side, submitting]);

  const handleSubmit = () => {
    if (!market) return;
    if (!authenticated) {
      login();
      return;
    }

    if (!user) return;

    if (sizeNum < market.minOrderSize) {
      toast.error(
        `Minimum order size is ${BABYLON_POINTS_SYMBOL}${market.minOrderSize}`
      );
      return;
    }

    if (authenticated && showBalanceWarning) {
      toast.error('Insufficient balance for margin + fees');
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmOpen = useCallback(async () => {
    if (!market) return;
    if (sizeNum <= 0) return;

    setSubmitting(true);
    setConfirmDialogOpen(false);

    await openPosition({
      ticker: market.ticker,
      side,
      size: sizeNum,
      leverage: clampedLeverage,
    })
      .then(async () => {
        if (rebalanceInfo) {
          const messages = {
            add: {
              title: 'Position increased!',
              description: `Added ${formatPrice(sizeNum)} to your ${side.toUpperCase()} position`,
            },
            reduce: {
              title: 'Position reduced!',
              description: `Reduced your position by ${formatPrice(sizeNum)}`,
            },
            close: {
              title: 'Position closed!',
              description: `Closed your ${existingPosition?.side?.toUpperCase()} position`,
            },
            flip: {
              title: 'Position flipped!',
              description: `Flipped to ${clampedLeverage}x ${side.toUpperCase()} on ${market.ticker}`,
            },
          } as const;
          const msg = messages[rebalanceInfo.type];
          toast.success(msg.title, { description: msg.description });
        } else {
          toast.success('Position opened!', {
            description: `Opened ${clampedLeverage}x ${side.toUpperCase()} on ${market.ticker}`,
          });
        }

        invalidatePerpMarketsCache();
        invalidateUserPositions();
        invalidateWalletBalance();

        await Promise.all([refreshUserPositions(), refreshWalletBalance()]);
      })
      .catch((error: Error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [
    market,
    sizeNum,
    openPosition,
    side,
    clampedLeverage,
    rebalanceInfo,
    existingPosition?.side,
    refreshUserPositions,
    refreshWalletBalance,
  ]);

  const liquidationPrice = useMemo(() => {
    if (!market) return 0;
    const price = market.currentPrice;
    return side === 'long'
      ? price * (1 - 0.9 / clampedLeverage)
      : price * (1 + 0.9 / clampedLeverage);
  }, [market, side, clampedLeverage]);

  const liquidationDistance = useMemo(() => {
    if (!market) return 0;
    const price = market.currentPrice;
    if (price <= 0) return 0;
    return side === 'long'
      ? ((price - liquidationPrice) / price) * 100
      : ((liquidationPrice - price) / price) * 100;
  }, [market, side, liquidationPrice]);

  if (!market) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg p-6 text-center">
          <div className="font-semibold text-muted-foreground">Trade</div>
          <div className="mt-1 text-muted-foreground/70 text-sm">
            Select a market to place an order.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Account summary */}
      <div className="border-border border-b px-3 py-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs">
              Available Balance
            </div>
            <div className="flex items-center gap-2 font-mono text-base text-foreground tabular-nums">
              <Wallet size={14} className="text-muted-foreground" />
              {balanceLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                formatBalance(balance)
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {onRequestBuyPoints && (
              <button
                type="button"
                onClick={onRequestBuyPoints}
                className="rounded bg-primary px-3 py-1 font-sans font-semibold text-primary-foreground text-xs transition-colors hover:bg-primary/90"
              >
                Buy
              </button>
            )}
            {existingPosition && (
              <div className="text-right">
                <div className="text-muted-foreground text-xs">
                  Open Position
                </div>
                <div className="font-mono text-foreground text-xs">
                  {existingPosition.leverage}x{' '}
                  {existingPosition.side.toUpperCase()} •{' '}
                  {formatPrice(existingPosition.size)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order form */}
      <div className="min-h-0 flex-1 overflow-auto px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">Place Order</div>
          <div className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
            Standard
          </div>
        </div>

        <div className="mt-3 flex gap-1 rounded bg-muted p-1">
          <button
            type="button"
            onClick={() => setSide('long')}
            className={cn(
              'flex-1 rounded py-2 font-semibold text-xs transition-colors',
              side === 'long'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            LONG
          </button>
          <button
            type="button"
            onClick={() => setSide('short')}
            className={cn(
              'flex-1 rounded py-2 font-semibold text-xs transition-colors',
              side === 'short'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            SHORT
          </button>
        </div>

        <div className="mt-4 flex gap-4 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
            <input
              type="radio"
              checked={orderType === 'market'}
              onChange={() => setOrderType('market')}
              className="accent-primary"
            />
            Market
          </label>
          <label
            className="flex cursor-not-allowed items-center gap-2 text-muted-foreground/60"
            aria-disabled="true"
            title="Coming soon"
          >
            <input
              type="radio"
              checked={orderType === 'limit'}
              onChange={() => setOrderType('limit')}
              className="accent-primary"
              disabled
            />
            Limit
            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              soon
            </span>
          </label>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-medium text-muted-foreground text-xs">
                Size (USD)
              </label>
              <span className="text-muted-foreground text-xs">
                Min {BABYLON_POINTS_SYMBOL}
                {market.minOrderSize}
              </span>
            </div>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              min={market.minOrderSize}
              step="10"
              className="w-full rounded border border-border bg-input px-3 py-2.5 font-mono text-sm tabular-nums placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-medium text-muted-foreground text-xs">
                Leverage
              </label>
              <span className="font-medium font-mono text-foreground text-sm">
                {clampedLeverage}x
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={market.maxLeverage}
              value={clampedLeverage}
              onChange={(e) => setLeverage(Number.parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
            />
          </div>

          <div className="space-y-2 rounded bg-muted/50 p-3 text-xs">
            <Row label="Margin" value={formatPrice(baseMargin)} />
            <Row label="Fees" value={formatPrice(estimatedFee)} />
            <div className="border-border border-t" />
            <Row label="Total" value={formatPrice(totalRequired)} strong />
          </div>

          {showBalanceWarning && (
            <div className="rounded bg-red-500/10 p-3 text-red-400 text-xs">
              Insufficient balance ({formatPrice(balance)})
            </div>
          )}

          {positionsLoading && authenticated && (
            <div className="text-muted-foreground text-xs">
              Syncing positions…
            </div>
          )}
        </div>

        {rebalanceInfo && (
          <div className="mt-4 rounded bg-muted/50 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">
                {rebalanceInfo.label}
              </span>
              <span className="font-mono text-foreground tabular-nums">
                {formatPrice(rebalanceInfo.newSize)}
              </span>
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {rebalanceInfo.description}
            </div>
          </div>
        )}
      </div>

      {/* Sticky order button */}
      <div className="shrink-0 p-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            (authenticated &&
              (showBalanceWarning ||
                sizeNum <= 0 ||
                sizeNum < (market?.minOrderSize ?? 0)))
          }
          className={cn(
            'w-full rounded py-3 font-semibold text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            side === 'long'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          )}
        >
          {submitLabel}
        </button>
      </div>

      {/* Confirmation dialog */}
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
                leverage: clampedLeverage,
                entryPrice: market.currentPrice,
                margin: baseMargin,
                estimatedFee,
                liquidationPrice,
                liquidationDistance,
              } satisfies OpenPerpDetails)
            : null
        }
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-mono tabular-nums',
          strong ? 'font-semibold text-foreground' : 'text-foreground'
        )}
      >
        {value}
      </span>
    </div>
  );
}
