'use client';

import { CheckCircle, Clock, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  calculateExpectedPayout,
  PredictionPricing,
} from '@babylon/engine/client';
import { cn } from '@babylon/shared';

/**
 * Represents a prediction market question.
 */
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
}

/**
 * Props for the PredictionTradingModal component.
 */
interface PredictionTradingModalProps {
  /** The prediction market question to trade */
  question: PredictionMarket;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback when modal should be closed */
  onClose: () => void;
  /** Optional callback when trade succeeds */
  onSuccess?: () => void;
}

/**
 * Modal component for trading prediction market shares.
 *
 * Provides a full-featured trading interface for buying and selling
 * YES/NO shares in prediction markets. Shows current prices, expected
 * payouts, and handles trade execution with loading states and error
 * handling.
 *
 * @param props - PredictionTradingModal component props
 * @returns Trading modal element
 *
 * @example
 * ```tsx
 * <PredictionTradingModal
 *   question={market}
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => refreshData()}
 * />
 * ```
 */
export function PredictionTradingModal({
  question,
  isOpen,
  onClose,
  onSuccess,
}: PredictionTradingModalProps) {
  const { user } = useAuth();
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, loading]);

  // Cleanup on unmount (for HMR)
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!isOpen) return null;

  const amountNum = Number.parseFloat(amount) || 0;

  // Use AMM to calculate current prices and shares
  const yesShares = question.yesShares || 500;
  const noShares = question.noShares || 500;

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

  // Calculate what would happen if user buys
  const calculation =
    amountNum > 0
      ? PredictionPricing.calculateBuy(yesShares, noShares, side, amountNum)
      : null;

  const expectedPayout = calculation
    ? calculateExpectedPayout(calculation.sharesBought, calculation.avgPrice)
    : 0;
  const expectedProfit = expectedPayout - amountNum;

  const getDaysUntilResolution = () => {
    if (!question.resolutionDate) return null;
    const now = new Date();
    const resolution = new Date(question.resolutionDate);
    const diffDays = Math.ceil(
      (resolution.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diffDays);
  };

  const daysLeft = getDaysUntilResolution();

  const handleSubmit = async () => {
    if (!user) return;

    if (amountNum < 1) {
      toast.error('Minimum bet is $1');
      return;
    }

    setLoading(true);

    const token =
      typeof window !== 'undefined' ? window.__privyAccessToken : null;
    if (!token) {
      toast.error('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    const response = await fetch(
      `/api/markets/predictions/${question.id}/buy`,
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

    await response.json();

    toast.success(`Bought ${side.toUpperCase()} shares!`, {
      description: `${calculation?.sharesBought.toFixed(2)} shares at ${(calculation?.avgPrice || 0).toFixed(3)} each`,
    });

    onClose();
    if (onSuccess) onSuccess();
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-full max-w-lg">
        <div className="fade-in zoom-in-95 m-4 max-h-[90vh] animate-in overflow-y-auto rounded bg-popover px-4 py-3 shadow-xl duration-200 sm:px-6 sm:py-4">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-foreground text-xl">
                Prediction Market
              </h2>
              {daysLeft !== null && (
                <span className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-muted-foreground text-sm">
                  <Clock size={14} />
                  {daysLeft}d left
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Question */}
          <div className="mb-6 rounded bg-muted px-4 py-3">
            <p className="font-medium text-foreground text-sm sm:text-base">
              {question.text}
            </p>
          </div>

          {/* Current Odds */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded bg-green-600/15 p-3">
              <div className="mb-1 text-green-600 text-xs">YES</div>
              <div className="font-bold text-2xl text-green-600">
                {(currentYesPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded bg-red-600/15 p-3">
              <div className="mb-1 text-red-600 text-xs">NO</div>
              <div className="font-bold text-2xl text-red-600">
                {(currentNoPrice * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* YES/NO Tabs */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setSide('yes')}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-3 rounded py-3 font-bold text-sm transition-all sm:text-base',
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
                'flex flex-1 cursor-pointer items-center justify-center gap-3 rounded py-3 font-bold text-sm transition-all sm:text-base',
                side === 'no'
                  ? 'bg-red-600 text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              )}
            >
              <XCircle size={18} />
              BUY NO
            </button>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="mb-2 block text-muted-foreground text-sm">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              className="w-full rounded bg-muted/50 px-4 py-3 font-medium text-base text-foreground focus:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 sm:text-lg"
              placeholder="Min: $1"
            />
          </div>

          {/* Trade Preview */}
          {calculation && (
            <div className="mb-6 space-y-2 rounded bg-muted p-4">
              <div className="mb-2 font-bold text-foreground text-sm">
                Trade Preview
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shares Received</span>
                <span className="font-bold text-foreground">
                  {calculation.sharesBought.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Price/Share</span>
                <span className="font-medium text-foreground">
                  {formatPrice(calculation.avgPrice)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  New {side.toUpperCase()} Price
                </span>
                <span className="font-medium text-foreground">
                  {(side === 'yes'
                    ? calculation.newYesPrice
                    : calculation.newNoPrice * 100
                  ).toFixed(1)}
                  %
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className="font-medium text-orange-500">
                  +{Math.abs(calculation.priceImpact).toFixed(2)}%
                </span>
              </div>

              <div className="mt-2 border-border border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    If {side.toUpperCase()} Wins
                  </span>
                  <span className="font-bold text-green-600">
                    {formatPrice(expectedPayout)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span
                    className={cn(
                      'font-bold',
                      expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {expectedProfit >= 0 ? '+' : ''}
                    {formatPrice(expectedProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || amountNum < 1}
            className={cn(
              'w-full cursor-pointer rounded py-3 font-bold text-base text-foreground transition-all sm:py-4 sm:text-lg',
              side === 'yes'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700',
              (loading || amountNum < 1) && 'cursor-not-allowed opacity-50'
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                Buying Shares...
              </span>
            ) : (
              `BUY ${side.toUpperCase()} - ${formatPrice(amountNum)}`
            )}
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            disabled={loading}
            className="mt-3 w-full cursor-pointer rounded py-2.5 font-medium text-muted-foreground transition-all hover:bg-muted disabled:cursor-not-allowed sm:py-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
