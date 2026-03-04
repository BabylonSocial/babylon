'use client';

import { cn, formatCurrency } from '@babylon/shared';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  History,
  Receipt,
  RefreshCw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BuyPointsModal } from '@/components/points/BuyPointsModal';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { getExplorerName, getExplorerTxUrl } from '@/lib/chain';
import { useAuthStore } from '@/stores/authStore';
import { useWalletBalance } from '@/stores/walletBalanceStore';

/** Number of transactions to show in collapsed view */
const COLLAPSED_COUNT = 5;
/** Max height for scrollable transaction containers when expanded (in px) */
const EXPANDED_MAX_HEIGHT = 400;

/**
 * Transaction from the points history API
 */
interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  pointsBefore: number;
  pointsAfter: number;
  reason: string;
  metadata: string | null;
  createdAt: string;
  paymentRequestId: string | null;
  paymentTxHash: string | null;
  paymentAmount: string | null;
  paymentVerified: boolean | null;
  paymentProvider: string | null;
}

/**
 * Get human-readable reason label
 */
function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    purchase: 'Points Purchase',
    purchase_refund: 'Refund',
    purchase_dispute: 'Dispute Deduction',
    purchase_dispute_won: 'Dispute Won (Re-credited)',
    trading_pnl: 'Trading P&L',
    transfer_sent: 'Points Sent',
    transfer_received: 'Points Received',
    referral_signup: 'Referral Bonus',
    referral_qualified: 'Qualified Referral Bonus',
    profile_completion: 'Profile Completion Bonus',
    farcaster_link: 'Farcaster Link Bonus',
    twitter_link: 'Twitter Link Bonus',
    discord_link: 'Discord Link Bonus',
    wallet_connect: 'Wallet Connection Bonus',
    admin_award: 'Admin Award',
    admin_deduction: 'Admin Deduction',
    report_reward: 'Report Reward',
  };
  return (
    labels[reason] ||
    reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Get icon for transaction type
 */
function getTransactionIcon(reason: string, amount: number) {
  if (reason === 'purchase') {
    return <CreditCard className="h-4 w-4" />;
  }
  if (reason.includes('refund') || reason.includes('dispute')) {
    return <RefreshCw className="h-4 w-4" />;
  }
  if (amount > 0) {
    return <ArrowDownLeft className="h-4 w-4" />;
  }
  return <ArrowUpRight className="h-4 w-4" />;
}

/**
 * Format payment provider display
 */
function getPaymentProviderLabel(provider: string | null): string {
  if (!provider) return '';
  if (provider === 'stripe') return 'Card';
  if (provider === 'crypto') return 'Crypto';
  return provider;
}

/**
 * Purchase transaction row component
 */
function PurchaseTransactionRow({ tx }: { tx: PointsTransaction }) {
  const isPurchase = tx.reason === 'purchase';
  const isPositive = tx.amount > 0;
  // Pre-compute explorer URL to avoid duplicate function calls
  const explorerUrl =
    tx.paymentTxHash && tx.paymentProvider === 'crypto'
      ? getExplorerTxUrl(tx.paymentTxHash)
      : null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/30 p-4 transition-all hover:bg-muted/50">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 shrink-0 rounded-full p-2',
            isPositive
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          )}
        >
          {getTransactionIcon(tx.reason, tx.amount)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{getReasonLabel(tx.reason)}</span>
            {tx.paymentProvider && (
              <span
                className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-xs',
                  tx.paymentProvider === 'stripe'
                    ? 'bg-purple-500/20 text-purple-500'
                    : 'bg-orange-500/20 text-orange-500'
                )}
              >
                {getPaymentProviderLabel(tx.paymentProvider)}
              </span>
            )}
          </div>
          <div className="mt-1 text-muted-foreground text-sm">
            {new Date(tx.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {isPurchase && tx.paymentAmount && (
            <div className="mt-1 text-muted-foreground text-xs">
              Paid: ${parseFloat(tx.paymentAmount).toFixed(2)} USD
            </div>
          )}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[#0066FF] text-xs hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View on {getExplorerName()}
            </a>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={cn(
            'font-semibold text-lg',
            isPositive ? 'text-green-500' : 'text-red-500'
          )}
        >
          {isPositive ? '+' : ''}
          {tx.amount.toLocaleString()}
        </div>
        <div className="text-muted-foreground text-xs">
          Balance: {tx.pointsAfter.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

/**
 * Other transaction row component (compact)
 */
function OtherTransactionRow({ tx }: { tx: PointsTransaction }) {
  const isPositive = tx.amount > 0;

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 transition-all hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'shrink-0 rounded-full p-1.5',
            isPositive
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          )}
        >
          {getTransactionIcon(tx.reason, tx.amount)}
        </div>
        <div className="min-w-0">
          <span className="font-medium text-sm">
            {getReasonLabel(tx.reason)}
          </span>
          <div className="text-muted-foreground text-xs">
            {new Date(tx.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
      <div
        className={cn(
          'shrink-0 font-semibold',
          isPositive ? 'text-green-500' : 'text-red-500'
        )}
      >
        {isPositive ? '+' : ''}
        {tx.amount.toLocaleString()}
      </div>
    </div>
  );
}

/**
 * Expandable transaction section with smooth transitions
 */
function TransactionSection({
  title,
  icon: Icon,
  transactions,
  emptyMessage,
  emptyAction,
  renderRow,
  description,
}: {
  title: string;
  icon: typeof CreditCard;
  transactions: PointsTransaction[];
  emptyMessage: string;
  emptyAction?: { label: string; onClick: () => void };
  renderRow: (tx: PointsTransaction) => React.ReactNode;
  description?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = transactions.length > COLLAPSED_COUNT;
  const visibleTransactions = expanded
    ? transactions
    : transactions.slice(0, COLLAPSED_COUNT);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#0066FF]" />
          <h3 className="font-semibold">{title}</h3>
          {transactions.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              {transactions.length}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="mb-4 text-muted-foreground text-sm">{description}</p>
      )}

      {transactions.length === 0 ? (
        <div className="py-12 text-center">
          <Icon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
          {emptyAction && (
            <button
              onClick={emptyAction.onClick}
              className="mt-3 text-[#0066FF] text-sm hover:underline"
            >
              {emptyAction.label}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Transaction list container */}
          <div
            className={cn(
              'space-y-3 transition-all duration-300 ease-in-out',
              expanded && hasMore && 'overflow-y-auto pr-1'
            )}
            style={{
              maxHeight: expanded && hasMore ? EXPANDED_MAX_HEIGHT : 'none',
            }}
          >
            {visibleTransactions.map((tx) => (
              <div key={tx.id}>{renderRow(tx)}</div>
            ))}
          </div>

          {/* Expand/collapse button */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show all {transactions.length} transactions
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Billing tab component for viewing transaction history and managing points.
 *
 * Shows:
 * - Current balance
 * - Transaction history with details (expandable sections)
 * - Buy more points button
 * - Payment method indicators (crypto vs card)
 */
export function BillingTab() {
  const { getAccessToken } = useAuth();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);

  // Use the same hook as markets page to fetch fresh balance from API
  const {
    balance,
    loading: balanceLoading,
    refresh: refreshBalance,
  } = useWalletBalance(user?.id);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/users/${user.id}/points-history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to load transaction history');
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load transaction history'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, getAccessToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reasons considered purchase-related for billing display
  const PURCHASE_REASONS = [
    'purchase',
    'purchase_refund',
    'purchase_dispute',
    'purchase_dispute_won',
  ] as const;

  // Filter to only show purchase-related transactions
  const purchaseTransactions = transactions.filter((tx) =>
    PURCHASE_REASONS.includes(tx.reason as (typeof PURCHASE_REASONS)[number])
  );

  // All other transactions
  const otherTransactions = transactions.filter(
    (tx) =>
      !PURCHASE_REASONS.includes(tx.reason as (typeof PURCHASE_REASONS)[number])
  );

  const handleBuyPointsSuccess = async () => {
    await Promise.all([refreshBalance(), fetchTransactions()]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 font-bold text-2xl">
          <Receipt className="h-6 w-6 text-[#0066FF]" />
          Billing & Transactions
        </h2>
        <p className="text-muted-foreground text-sm">
          View your points balance, purchase history, and transaction details.
        </p>
      </div>

      {/* Current Balance Card */}
      <div className="rounded-lg border border-border bg-gradient-to-br from-[#0066FF]/10 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Current Balance</p>
            <div className="mt-1 flex items-baseline gap-2">
              {balanceLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <span className="font-bold text-4xl text-foreground">
                  {formatCurrency(balance)}
                </span>
              )}
              <span className="text-lg text-muted-foreground">points</span>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              ≈ ${(balance / 100).toFixed(2)} USD
            </p>
          </div>
          <button
            onClick={() => setBuyPointsOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2.5 font-medium text-primary-foreground shadow-md transition-all hover:from-yellow-600 hover:to-amber-700 hover:shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
            Buy Points
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-4">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border p-4">
          <div className="py-8 text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchTransactions}
              className="mt-2 text-[#0066FF] text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Purchase History Section */}
          <div className="relative">
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="absolute top-4 right-4 z-10 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
            <TransactionSection
              title="Purchase History"
              icon={CreditCard}
              transactions={purchaseTransactions}
              emptyMessage="No purchases yet"
              emptyAction={{
                label: 'Buy your first points',
                onClick: () => setBuyPointsOpen(true),
              }}
              renderRow={(tx) => <PurchaseTransactionRow tx={tx} />}
            />
          </div>

          {/* Other Transactions Section */}
          {otherTransactions.length > 0 && (
            <TransactionSection
              title="Other Transactions"
              icon={History}
              transactions={otherTransactions}
              emptyMessage="No other transactions"
              description="Rewards, referrals, transfers, and other point activity."
              renderRow={(tx) => <OtherTransactionRow tx={tx} />}
            />
          )}
        </>
      )}

      {/* Pricing Info */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-5 w-5 text-[#0066FF]" />
          <div>
            <h3 className="font-semibold">Points Pricing</h3>
            <p className="mt-1 text-muted-foreground text-sm">
              <strong className="text-foreground">100 points = $1 USD</strong>
              <br />
              Points can be purchased with credit card or cryptocurrency.
              <br />
              Minimum purchase: $1 (100 points) • Maximum: $1,000 (100,000
              points)
            </p>
          </div>
        </div>
      </div>

      {/* Buy Points Modal */}
      <BuyPointsModal
        isOpen={buyPointsOpen}
        onClose={() => setBuyPointsOpen(false)}
        onSuccess={handleBuyPointsSuccess}
      />
    </div>
  );
}
