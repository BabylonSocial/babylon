'use client';

/**
 * On-Chain Betting Page
 *
 * Real betting with Base Sepolia ETH
 * Transactions execute on blockchain via smart wallet
 */

import {
  Clock,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useOnChainBetting } from '@/hooks/useOnChainBetting';
import { useSmartWallet } from '@/hooks/useSmartWallet';
import { usePerpMarkets } from '@/stores/perpMarketsStore';
import {
  usePredictionMarkets,
  type PredictionMarket,
} from '@/stores/predictionMarketsStore';
import { getContractAddresses } from '@babylon/contracts';
import { cn } from '@babylon/shared';

export default function OnChainBettingPage() {
  const router = useRouter();
  const { authenticated, login } = useAuth();
  const { smartWalletReady, smartWalletAddress } = useSmartWallet();
  const { buyShares, loading: txLoading } = useOnChainBetting();

  // Use shared stores
  const { markets: perpMarkets, loading: perpLoading } = usePerpMarkets();
  const { markets: questions, loading: questionsLoading } =
    usePredictionMarkets();

  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(
    null
  );
  const [betAmount, setBetAmount] = useState('');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');

  const loading = perpLoading && questionsLoading;

  // Get network info
  const { network, diamond, chainId } = getContractAddresses();
  const isLocal = chainId === 31337;
  const explorerUrl = isLocal
    ? null // No explorer for localnet
    : chainId === 84532
      ? 'https://sepolia.basescan.org'
      : 'https://basescan.org';

  const handleBet = async () => {
    if (!selectedMarket || !betAmount) return;

    const shares = Number.parseFloat(betAmount);
    if (isNaN(shares) || shares <= 0) {
      toast.error('Invalid bet amount');
      return;
    }

    try {
      const result = await buyShares(
        selectedMarket.id.toString(),
        betSide,
        shares
      );

      toast.success('Bet placed on-chain!', {
        description: isLocal
          ? `TX: ${result.txHash.slice(0, 10)}...`
          : 'View on explorer',
        action: explorerUrl
          ? {
              label: 'View TX',
              onClick: () =>
                window.open(`${explorerUrl}/tx/${result.txHash}`, '_blank'),
            }
          : undefined,
      });

      // Verify with backend
      await fetch(`/api/markets/predictions/${selectedMarket.id}/buy-onchain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side: betSide.toLowerCase(),
          numShares: shares,
          txHash: result.txHash,
          walletAddress: smartWalletAddress,
        }),
      });

      setSelectedMarket(null);
      setBetAmount('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bet failed');
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getDaysLeft = (date?: string) => {
    if (!date) return null;
    const diff = Math.ceil(
      (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff);
  };

  if (!authenticated) {
    return (
      <PageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-4 md:p-6">
          <div className="space-y-3 text-center">
            <Wallet className="mx-auto h-16 w-16 text-[#0066FF]" />
            <h1 className="font-bold text-3xl">On-Chain Betting</h1>
            <p className="max-w-md text-muted-foreground">
              Bet with real Base Sepolia ETH. All transactions are on-chain and
              verifiable.
            </p>
          </div>
          <button
            onClick={login}
            className="rounded-lg bg-[#0066FF] px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-[#2952d9]"
          >
            Connect Wallet to Start Betting
          </button>
        </div>
      </PageContainer>
    );
  }

  if (!smartWalletReady) {
    return (
      <PageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-4 md:p-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6 p-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8 p-4 md:p-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/markets')}
            className="mb-4 text-muted-foreground text-sm hover:text-foreground"
          >
            ← Back to Markets
          </button>
          <h1 className="mb-2 font-bold text-2xl md:text-3xl">
            On-Chain Betting
          </h1>
          <p className="text-muted-foreground">
            {isLocal
              ? `Local Hardhat (Chain ID: ${chainId}) • Testing mode`
              : 'Base Sepolia ETH • All transactions on blockchain'}
          </p>
          <div className="mt-1 text-muted-foreground text-xs">
            Network: {network} • Diamond: {diamond.slice(0, 10)}...
            {diamond.slice(-6)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">
              Connected: {smartWalletAddress?.slice(0, 6)}...
              {smartWalletAddress?.slice(-4)}
            </span>
            {explorerUrl && (
              <a
                href={`${explorerUrl}/address/${smartWalletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#0066FF] hover:underline"
              >
                View Wallet <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Prediction Markets Section */}
        <section>
          <h2 className="mb-4 font-bold text-xl">
            Prediction Markets - On-Chain
          </h2>
          <div className="space-y-3">
            {questions
              .filter((q) => q.status === 'active')
              .map((question) => {
                const yesShares = question.yesShares ?? 0;
                const noShares = question.noShares ?? 0;
                const totalShares = yesShares + noShares;
                const yesPercent =
                  totalShares > 0
                    ? ((yesShares / totalShares) * 100).toFixed(1)
                    : '50.0';
                const noPercent =
                  totalShares > 0
                    ? ((noShares / totalShares) * 100).toFixed(1)
                    : '50.0';
                const daysLeft = getDaysLeft(question.resolutionDate);

                return (
                  <div
                    key={question.id}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-[#0066FF]/50"
                  >
                    <div className="mb-3">
                      <h3 className="mb-1 font-medium text-base">
                        {question.text}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        {question.oracleCommitTxHash && (
                          <span className="flex items-center gap-1 text-green-600">
                            ✓ Committed On-Chain
                          </span>
                        )}
                        {daysLeft !== null && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {daysLeft}d left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="text-sm">
                          <span className="font-bold text-green-600">
                            {yesPercent}%
                          </span>
                          <span className="ml-1 text-muted-foreground">
                            YES
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-bold text-red-600">
                            {noPercent}%
                          </span>
                          <span className="ml-1 text-muted-foreground">NO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedMarket(question);
                          setBetSide('YES');
                        }}
                        className="flex-1 rounded-lg bg-green-600/20 px-4 py-2 font-medium text-green-600 transition-colors hover:bg-green-600/30"
                      >
                        Bet YES On-Chain
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMarket(question);
                          setBetSide('NO');
                        }}
                        className="flex-1 rounded-lg bg-red-600/20 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-600/30"
                      >
                        Bet NO On-Chain
                      </button>
                    </div>
                  </div>
                );
              })}

            {questions.filter((q) => q.status === 'active').length === 0 && (
              <div className="rounded-lg bg-muted/30 p-6 text-center">
                <p className="text-muted-foreground">
                  No active prediction markets
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Perpetual Markets Info */}
        <section>
          <h2 className="mb-4 font-bold text-xl">
            Perpetual Futures - Price Data On-Chain
          </h2>
          <div className="space-y-3">
            {perpMarkets.slice(0, 5).map((market) => (
              <div
                key={market.ticker}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">${market.ticker}</h3>
                    <p className="text-muted-foreground text-sm">
                      {market.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatPrice(market.currentPrice)}
                    </div>
                    <div
                      className={cn(
                        'flex items-center justify-end gap-1 font-bold text-sm',
                        market.change24h >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {market.change24h >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {market.change24h >= 0 ? '+' : ''}
                      {market.changePercent24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-green-600 text-xs">
                  ✓ Prices published on-chain every tick
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            Note: Perp trading is currently instant/off-chain. Prices are
            published on-chain for verification.
          </p>
        </section>

        {/* Bet Modal */}
        {selectedMarket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-background p-6">
              <div>
                <h3 className="mb-2 font-bold text-lg">Place On-Chain Bet</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedMarket.text}
                </p>
              </div>

              <div>
                <label className="mb-2 block font-medium text-sm">
                  Betting:{' '}
                  <span
                    className={
                      betSide === 'YES' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {betSide}
                  </span>
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="Number of shares"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-[#0066FF] focus:outline-none"
                  step="0.1"
                  min="0.1"
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  This will execute a real blockchain transaction on Base
                  Sepolia
                </p>
              </div>

              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                <p className="text-xs text-yellow-600">
                  ⚠️ This is a real on-chain transaction. Gas fees apply.
                  Transaction will be visible on Base Sepolia block explorer.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedMarket(null);
                    setBetAmount('');
                  }}
                  disabled={txLoading}
                  className="flex-1 rounded-lg bg-muted px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBet}
                  disabled={txLoading || !betAmount}
                  className="flex-1 rounded-lg bg-[#0066FF] px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-[#2952d9] disabled:opacity-50"
                >
                  {txLoading ? 'Sending TX...' : 'Place Bet On-Chain'}
                </button>
              </div>

              {smartWalletAddress && (
                <div className="text-center text-muted-foreground text-xs">
                  Using wallet: {smartWalletAddress.slice(0, 6)}...
                  {smartWalletAddress.slice(-4)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
