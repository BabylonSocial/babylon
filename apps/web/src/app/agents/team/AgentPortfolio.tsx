'use client';

import { cn, formatCompactCurrency, logger } from '@babylon/shared';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  History,
  Loader2,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BuyPointsModal } from '@/components/points/BuyPointsModal';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useWalletBalance } from '@/stores/walletBalanceStore';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

/** Response from /api/agents/[agentId]/trading-balance */
interface AgentWalletResponse {
  success: boolean;
  agentBalance: {
    tradingBalance: number;
    lifetimePnL: number;
    totalDeposited?: number;
    totalWithdrawn?: number;
  };
  userBalance: number;
  transactions?: Transaction[];
}

/** Typed response for POST trading-balance success */
interface TradingBalanceResponse {
  message: string;
  success?: boolean;
}

/** Typed error response */
interface ErrorResponse {
  error?: string;
}

type AgentPortfolioProps =
  | {
      entityType: 'agent';
      agentId: string;
      entityName: string;
      userId?: never;
    }
  | {
      entityType: 'user';
      userId: string;
      entityName: string;
      agentId?: never;
    };

/**
 * Wallet component for viewing balance and managing transfers.
 * Supports both user and agent modes.
 * - User mode: Shows balance only (no transfers)
 * - Agent mode: Shows balance, transfers, and transaction history
 */
export function AgentPortfolio(props: AgentPortfolioProps) {
  const { entityType, entityName } = props;

  if (entityType === 'user') {
    return <UserWallet userId={props.userId} entityName={entityName} />;
  }

  return <AgentWallet agentId={props.agentId} entityName={entityName} />;
}

/** User wallet - balance only, no transfers */
function UserWallet({
  userId,
  entityName,
}: {
  userId: string;
  entityName: string;
}) {
  const { balance, loading, refresh } = useWalletBalance(userId);
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);

  const handleBuyPointsSuccess = useCallback(() => {
    refresh();
    toast.success('Points purchased successfully!');
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Balance Card */}
      <div className="rounded-lg border border-[#0066FF]/30 bg-[#0066FF]/5 p-4">
        <div>
          <div className="flex items-center gap-1.5 text-[#0066FF] text-xs">
            <Wallet className="h-3.5 w-3.5" />
            Your Balance
          </div>
          <div className="mt-1 font-bold text-2xl">
            {formatCompactCurrency(balance)}
          </div>
        </div>
        <div className="mt-2 text-muted-foreground text-xs">{entityName}</div>
      </div>

      {/* Buy Points Button */}
      <button
        type="button"
        onClick={() => setBuyPointsOpen(true)}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 font-medium text-white transition-all hover:bg-[#0055DD]"
      >
        <Sparkles className="h-4 w-4" />
        Buy Points
      </button>

      {/* Buy Points Modal */}
      <BuyPointsModal
        isOpen={buyPointsOpen}
        onClose={() => setBuyPointsOpen(false)}
        onSuccess={handleBuyPointsSuccess}
      />
    </div>
  );
}

/** Agent wallet - full functionality with transfers */
function AgentWallet({
  agentId,
  entityName,
}: {
  agentId: string;
  entityName: string;
}) {
  const { getAccessToken } = useAuth();

  // Wallet state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [processing, setProcessing] = useState(false);
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());
  const [balanceInfo, setBalanceInfo] = useState({
    agentBalance: 0,
    userBalance: 0,
  });

  // Fetch balance and transactions
  const fetchData = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setWalletLoading(false);
      return;
    }

    setWalletLoading(true);

    try {
      const walletRes = await fetch(`/api/agents/${agentId}/trading-balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!walletRes.ok) {
        logger.error(
          'Failed to fetch wallet data',
          { agentId, status: walletRes.status },
          'AgentPortfolio'
        );
        return;
      }

      const walletData = (await walletRes.json()) as AgentWalletResponse;

      if (walletData.success) {
        setBalanceInfo({
          agentBalance: walletData.agentBalance.tradingBalance,
          userBalance: walletData.userBalance,
        });
        setTransactions(walletData.transactions ?? []);
      }
    } catch (err) {
      logger.error(
        'Failed to fetch wallet data',
        { error: err instanceof Error ? err.message : String(err) },
        'AgentPortfolio'
      );
    } finally {
      setWalletLoading(false);
    }
  }, [agentId, getAccessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTransaction = async () => {
    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (action === 'deposit' && amountNum > balanceInfo.userBalance) {
      toast.error(
        `Insufficient balance. You have ${formatCompactCurrency(balanceInfo.userBalance)}`
      );
      return;
    }
    if (action === 'withdraw' && amountNum > balanceInfo.agentBalance) {
      toast.error(
        `Insufficient agent balance. Agent has ${formatCompactCurrency(balanceInfo.agentBalance)}`
      );
      return;
    }

    setProcessing(true);
    const token = await getAccessToken();
    if (!token) {
      setProcessing(false);
      toast.error('Authentication required');
      return;
    }

    try {
      const res = await fetch(`/api/agents/${agentId}/trading-balance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, amount: amountNum }),
      });

      if (!res.ok) {
        const resClone = res.clone();
        let errorMessage = `Transaction failed (${res.status})`;

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = (await resClone.json()) as ErrorResponse;
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else {
          const rawText = await res.text();
          if (rawText) {
            errorMessage = rawText;
          }
        }

        toast.error(errorMessage);
        return;
      }

      const data = (await res.json()) as TradingBalanceResponse;
      toast.success(data.message);
      setAmount('');
      await fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Network error';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (walletLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Balance Card */}
      <div className="rounded-lg border border-[#0066FF]/30 bg-[#0066FF]/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#0066FF] text-xs">
              <Wallet className="h-3.5 w-3.5" />
              Agent Balance
            </div>
            <div className="mt-1 font-bold text-2xl">
              {formatCompactCurrency(balanceInfo.agentBalance)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">Your Balance</div>
            <div className="mt-1 font-semibold text-lg">
              {formatCompactCurrency(balanceInfo.userBalance)}
            </div>
          </div>
        </div>
        <div className="mt-2 text-muted-foreground text-xs">{entityName}</div>
      </div>

      {/* Transfer + Transaction History - Side by side on wide */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[300px_1fr]">
        {/* Transfer Section */}
        <div className="flex flex-col rounded-lg border border-border bg-card/50 p-4">
          <div className="mb-3 font-medium text-sm">Transfer</div>

          {/* Action Toggle */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAction('deposit')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-2.5 font-medium text-sm transition-all',
                action === 'deposit'
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setAction('withdraw')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-2.5 font-medium text-sm transition-all',
                action === 'withdraw'
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </button>
          </div>

          {/* Amount input */}
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount..."
              min={0.01}
              step={0.01}
              className="h-10 flex-1"
            />
            <button
              type="button"
              onClick={handleTransaction}
              disabled={processing || !amount}
              className="h-10 rounded-md bg-[#0066FF] px-5 font-medium text-white transition-all hover:bg-[#0055DD] disabled:opacity-50"
            >
              {processing ? '...' : 'Go'}
            </button>
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            {action === 'deposit'
              ? 'Transfer points from your account to this agent'
              : 'Withdraw points from this agent to your account'}
          </p>
        </div>

        {/* Transaction History */}
        <div className="flex max-h-[220px] flex-col overflow-hidden rounded-lg border border-border bg-card/50 p-4">
          <div className="mb-3 flex shrink-0 items-center gap-1.5">
            <History className="h-4 w-4" />
            <span className="font-medium text-sm">Transaction History</span>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {transactions.slice(0, 20).map((tx) => {
                const isExpanded = expandedTxIds.has(tx.id);
                return (
                  <div key={tx.id} className="rounded bg-muted/30 text-sm">
                    {/* Collapsed row */}
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => {
                        setExpandedTxIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(tx.id)) {
                            next.delete(tx.id);
                          } else {
                            next.add(tx.id);
                          }
                          return next;
                        });
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                        <span className="font-medium capitalize">
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'font-semibold',
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {formatCompactCurrency(tx.amount)}
                      </span>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-border border-t bg-muted/20 px-3 py-2 text-xs">
                        <div className="space-y-1">
                          {tx.description && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Description:
                              </span>
                              <span className="text-right">
                                {tx.description}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Balance After:
                            </span>
                            <span className="font-medium">
                              {formatCompactCurrency(tx.balanceAfter)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span>
                              {new Date(tx.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
