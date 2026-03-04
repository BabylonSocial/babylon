'use client';

import { calculateUnrealizedPnL, cn, formatCurrency } from '@babylon/shared';
import { AlertTriangle, Bot, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { usePerpTrade } from '@/hooks/usePerpTrade';
import { invalidatePerpMarketsCache } from '@/stores/perpMarketsStore';
import type { DisplayPerpPosition } from '@/types/markets';
import {
  type ClosePerpDetails,
  TradeConfirmationDialog,
} from './TradeConfirmationDialog';

/**
 * Alias for DisplayPerpPosition for local usage.
 */
type PerpPosition = DisplayPerpPosition;

/**
 * Perpetual positions list component for displaying and managing open positions.
 *
 * Displays a list of open perpetual positions with real-time price updates via SSE.
 * Shows position details including entry price, current price, PnL, and liquidation
 * price. Includes close position functionality with confirmation dialog.
 *
 * Features:
 * - Position list with real-time prices
 * - Unrealized PnL calculation
 * - Liquidation price display
 * - Close position with confirmation
 * - Loading states during close
 * - Toast notifications for success/error
 *
 * @param props - PerpPositionsList component props
 * @returns Perpetual positions list element
 *
 * @example
 * ```tsx
 * <PerpPositionsList
 *   positions={userPositions}
 *   onPositionClosed={() => refreshPositions()}
 * />
 * ```
 */
interface PerpPositionsListProps {
  positions: PerpPosition[];
  onPositionClosed?: () => void;
  onPositionClick?: (ticker: string) => void;
  density?: 'default' | 'compact';
}

export function PerpPositionsList({
  positions,
  onPositionClosed,
  onPositionClick,
  density = 'default',
}: PerpPositionsListProps) {
  const compact = density === 'compact';
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState<{
    position: PerpPosition;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
  } | null>(null);
  const { closePosition: closePerpPosition } = usePerpTrade();

  const tickers = useMemo(
    () => positions.map((pos) => pos.ticker),
    [positions]
  );
  const livePrices = useMarketPrices(tickers);

  // Pre-calculate PnL for all positions to avoid recalculating during render
  const positionsWithPnL = useMemo(
    () =>
      positions.map((position) => {
        const livePrice = livePrices.get(position.ticker)?.price;
        const currentPrice = livePrice ?? position.currentPrice;
        const { pnl, pnlPercent } = calculateUnrealizedPnL(
          position.entryPrice,
          currentPrice,
          position.side,
          position.size
        );
        const liquidationDistance =
          position.side === 'long'
            ? ((currentPrice - position.liquidationPrice) / currentPrice) * 100
            : ((position.liquidationPrice - currentPrice) / currentPrice) * 100;
        return {
          position,
          currentPrice,
          pnl,
          pnlPercent,
          liquidationDistance,
          isNearLiquidation: liquidationDistance < 5,
        };
      }),
    [positions, livePrices]
  );

  const handleCloseClick = useCallback(
    (
      position: PerpPosition,
      currentPrice: number,
      pnl: number,
      pnlPercent: number
    ) => {
      setPendingClose({ position, currentPrice, pnl, pnlPercent });
      setConfirmDialogOpen(true);
    },
    []
  );

  const handleConfirmClose = useCallback(async () => {
    if (!pendingClose) return;

    setClosingId(pendingClose.position.id);
    setConfirmDialogOpen(false);

    const data = await closePerpPosition(pendingClose.position.id);
    const pnl = data?.pnl ?? 0;

    const pnlSign = pnl >= 0 ? '+' : '-';
    toast.success('Position closed!', {
      description: `${pendingClose.position.ticker}: ${pnlSign}${formatCurrency(
        Math.abs(pnl),
        { useThousandsSeparator: true }
      )} PnL`,
    });

    // Invalidate cache to ensure fresh data on next fetch
    invalidatePerpMarketsCache();
    await onPositionClosed?.();
    setClosingId(null);
    setPendingClose(null);
  }, [closePerpPosition, onPositionClosed, pendingClose]);

  /** Use shared formatCurrency for price formatting */
  const formatPrice = (amount: number) =>
    formatCurrency(amount, { useThousandsSeparator: true });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (positions.length === 0) {
    return (
      <div
        className={cn(
          'text-center text-muted-foreground',
          compact ? 'py-6' : 'py-8'
        )}
      >
        <p>No open positions</p>
        <p className={cn(compact ? 'mt-1 text-xs' : 'mt-1 text-sm')}>
          Open a long or short position to get started
        </p>
      </div>
    );
  }

  return (
    <div className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
      {positionsWithPnL.map(
        ({
          position,
          currentPrice,
          pnl,
          pnlPercent,
          liquidationDistance,
          isNearLiquidation,
        }) => {
          const isClosing = closingId === position.id;

          return (
            <div
              key={position.id}
              className={cn(
                'rounded transition-all',
                compact ? 'p-2' : 'p-2.5',
                isNearLiquidation ? 'bg-red-600/10' : 'bg-muted/40',
                onPositionClick && 'cursor-pointer hover:bg-muted/60'
              )}
              onClick={() => onPositionClick?.(position.ticker)}
            >
              {/* Row 1: Side badge, ticker, PnL */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 font-bold text-[11px]',
                      position.side === 'long'
                        ? 'bg-green-600/20 text-green-600'
                        : 'bg-red-600/20 text-red-600'
                    )}
                  >
                    {position.side === 'long' ? (
                      <TrendingUp size={10} />
                    ) : (
                      <TrendingDown size={10} />
                    )}
                    {position.leverage}x {position.side.toUpperCase()}
                  </span>
                  <span className="font-bold text-foreground text-xs">
                    ${position.ticker}
                  </span>
                  {position.isAgentPosition && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded bg-purple-600/20 px-1 py-0.5 font-medium text-[11px] text-purple-500">
                      <Bot size={10} />
                      {position.agentName || 'Agent'}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'shrink-0 font-bold text-xs',
                    pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {pnl >= 0 ? '+' : ''}
                  {formatPrice(pnl)}{' '}
                  <span className="font-normal text-[11px]">
                    ({pnl >= 0 ? '+' : ''}
                    {pnlPercent.toFixed(2)}%)
                  </span>
                </span>
              </div>

              {/* Row 2: Price + Stats + Close button */}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
                  <span className="font-medium text-foreground">
                    {formatPrice(position.entryPrice)}
                    <span className="mx-0.5 text-muted-foreground">&rarr;</span>
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span>
                    Size{' '}
                    <span className="font-medium text-foreground">
                      {formatPrice(position.size)}
                    </span>
                  </span>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span>
                    Liq{' '}
                    <span className="font-medium text-red-600">
                      {formatPrice(position.liquidationPrice)}
                    </span>
                  </span>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span>
                    Fund{' '}
                    <span
                      className={cn(
                        'font-medium',
                        position.fundingPaid >= 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      )}
                    >
                      {position.fundingPaid >= 0 ? '-' : '+'}
                      {formatPrice(Math.abs(position.fundingPaid))}
                    </span>
                  </span>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span className="text-foreground">
                    {formatDate(position.openedAt)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseClick(position, currentPrice, pnl, pnlPercent);
                  }}
                  disabled={isClosing}
                  className={cn(
                    'shrink-0 cursor-pointer rounded-full px-3 py-0.5 font-medium text-xs transition-all',
                    isNearLiquidation
                      ? 'bg-red-600 text-primary-foreground hover:bg-red-700'
                      : 'bg-muted text-foreground hover:bg-muted/80',
                    isClosing && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {isClosing ? 'Closing...' : 'Close'}
                </button>
              </div>

              {/* Liquidation Warning */}
              {isNearLiquidation && (
                <div className="mt-1.5 flex items-center gap-1.5 rounded bg-red-600/20 px-2 py-1">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />
                  <p className="font-medium text-red-600 text-xs">
                    Near liquidation! {liquidationDistance.toFixed(2)}% away
                  </p>
                </div>
              )}
            </div>
          );
        }
      )}

      {/* Confirmation Dialog */}
      <TradeConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmClose}
        isSubmitting={closingId !== null}
        tradeDetails={
          pendingClose
            ? ({
                type: 'close-perp',
                ticker: pendingClose.position.ticker,
                side: pendingClose.position.side,
                size: pendingClose.position.size,
                leverage: pendingClose.position.leverage,
                entryPrice: pendingClose.position.entryPrice,
                currentPrice: pendingClose.currentPrice,
                unrealizedPnL: pendingClose.pnl,
                unrealizedPnLPercent: pendingClose.pnlPercent,
              } as ClosePerpDetails)
            : null
        }
      />
    </div>
  );
}
