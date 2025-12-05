'use client';

import { ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@babylon/shared';
import { cn } from '@babylon/shared';

/**
 * Transaction structure for agent wallet.
 */
interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

/**
 * Agent wallet component for managing agent points balance.
 *
 * Provides interface for depositing and withdrawing points to/from agent
 * wallet. Displays current balance, transaction history, and wallet
 * statistics. Handles balance transfers from user's reputation points.
 *
 * Features:
 * - Balance display
 * - Deposit functionality
 * - Withdraw functionality
 * - Transaction history
 * - Wallet statistics
 * - Loading states
 * - Error handling
 *
 * @param props - AgentWallet component props
 * @returns Agent wallet element
 *
 * @example
 * ```tsx
 * <AgentWallet
 *   agent={agentData}
 *   onUpdate={() => refreshAgent()}
 * />
 * ```
 */
interface AgentWalletProps {
  agent: {
    id: string;
    name: string;
    pointsBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalPointsSpent: number;
  };
  onUpdate: () => void;
}

export function AgentWallet({ agent, onUpdate }: AgentWalletProps) {
  const { user, getAccessToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [processing, setProcessing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/agents/${agent.id}/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = (await res.json()) as {
          success: boolean;
          transactions: Transaction[];
        };
        if (data.success && data.transactions) {
          setTransactions(data.transactions);
        }
      } else {
        logger.error('Failed to fetch transactions', undefined, 'AgentWallet');
      }
    } catch (error) {
      logger.error('Error fetching transactions', { error }, 'AgentWallet');
    } finally {
      setLoading(false);
    }
  }, [agent.id, getAccessToken]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTransaction = async () => {
    const amountNum = parseInt(amount);

    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const totalPoints = user?.reputationPoints || 0;

    if (action === 'deposit' && amountNum > totalPoints) {
      toast.error(`Insufficient balance. You have ${totalPoints} points`);
      return;
    }

    if (action === 'withdraw' && amountNum > agent.pointsBalance) {
      toast.error(
        `Insufficient agent balance. Agent has ${agent.pointsBalance} points`
      );
      return;
    }

    setProcessing(true);
    const token = await getAccessToken();
    if (!token) {
      setProcessing(false);
      throw new Error('Authentication required');
    }

    const res = await fetch(`/api/agents/${agent.id}/wallet`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, amount: amountNum }),
    });

    if (!res.ok) {
      const error = await res.json();
      setProcessing(false);
      throw new Error(error.error || 'Transaction failed');
    }

    const data = await res.json();
    toast.success(data.message);
    setAmount('');
    fetchTransactions();
    onUpdate();
    setProcessing(false);
  };

  const userTotalPoints = user?.reputationPoints || 0;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
          <div className="mb-2 text-muted-foreground text-sm">
            Agent Balance
          </div>
          <div className="mb-4 font-bold text-3xl">
            {agent.pointsBalance} pts
          </div>
          <div className="space-y-1 text-muted-foreground text-sm">
            <div className="flex justify-between">
              <span>Total Deposited:</span>
              <span>{agent.totalDeposited} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Total Withdrawn:</span>
              <span>{agent.totalWithdrawn} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Total Spent:</span>
              <span>{agent.totalPointsSpent} pts</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
          <div className="mb-2 text-muted-foreground text-sm">Your Balance</div>
          <div className="mb-4 font-bold text-3xl">{userTotalPoints} pts</div>
          <p className="text-muted-foreground text-sm">
            Available for deposit to agents
          </p>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur sm:p-6">
        <h3 className="mb-4 font-semibold text-lg">Transfer Points</h3>

        {/* Action Toggle - Full width buttons */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setAction('deposit')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-3 font-medium transition-all sm:px-4',
              action === 'deposit'
                ? 'bg-[#0066FF] text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            )}
          >
            <ArrowDownToLine className="h-4 w-4 shrink-0" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setAction('withdraw')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-3 font-medium transition-all sm:px-4',
              action === 'withdraw'
                ? 'bg-[#0066FF] text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            )}
          >
            <ArrowUpFromLine className="h-4 w-4 shrink-0" />
            <span>Withdraw</span>
          </button>
        </div>

        {/* Amount input and submit - Stack on mobile, inline on larger screens */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            min={1}
            max={action === 'deposit' ? userTotalPoints : agent.pointsBalance}
            className="h-12 w-full text-base sm:h-10 sm:flex-1 sm:text-sm"
          />
          <button
            onClick={handleTransaction}
            disabled={processing || !amount}
            className="h-12 w-full rounded-lg bg-[#0066FF] px-6 font-medium text-primary-foreground transition-all hover:bg-[#2952d9] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto"
          >
            {processing
              ? 'Processing...'
              : action === 'deposit'
                ? 'Deposit'
                : 'Withdraw'}
          </button>
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          {action === 'deposit'
            ? `Transfer points from your account to ${agent.name}`
            : `Transfer points from ${agent.name} to your account`}
        </p>
      </div>

      {/* Transaction History */}
      <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Transaction History</h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg bg-muted/30 p-3 transition-all hover:bg-muted"
              >
                <div className="flex-1">
                  <div className="font-medium capitalize">
                    {tx.type.replace('_', ' ')}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {tx.description}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'font-semibold',
                      tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount} pts
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Balance: {tx.balanceAfter} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
