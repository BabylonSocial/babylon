'use client';

import {
  claimDailyLogin,
  getDailyLoginStatus,
  getUserPortfolioBreakdown,
} from '@babylon/api-hooks';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { DailyLoginModal } from './DailyLoginModal';
import {
  type ClaimResult,
  formatTimeRemaining,
  type StreakData,
} from './types';

const STAT_ITEMS = [
  { key: 'nextReward', label: 'Next Reward', format: (v: number) => `+${v}` },
  { key: 'longestStreak', label: 'Best Streak', format: (v: number) => v },
  { key: 'totalDailyLogins', label: 'Total Claims', format: (v: number) => v },
] as const;

export function DailyStreakCard() {
  const { authenticated, user } = useAuth();
  const { setUser } = useAuthStore();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [modal, setModal] = useState<ClaimResult | null>(null);

  const fetchData = useCallback(async () => {
    if (!authenticated) {
      setLoading(false);
      return;
    }

    try {
      const json = (await getDailyLoginStatus()) as unknown as StreakData;
      setData(json);
    } catch (error) {
      // Silently fail - don't show error toast
      // This prevents blocking the page if the API/database isn't ready
      console.warn('Daily login API error:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown timer - updates every minute when user can't claim
  // Uses lastUpdateTime to calculate actual elapsed time instead of fixed intervals
  // to prevent timer drift over extended periods
  const canClaim = data?.canClaim ?? false;
  useEffect(() => {
    if (canClaim) return;
    let lastUpdateTime = Date.now();
    let refreshTriggered = false;
    const id = setInterval(() => {
      const now = Date.now();
      const actualElapsed = now - lastUpdateTime;
      lastUpdateTime = now;
      setData((prev) => {
        if (!prev) return prev;
        const timeUntilClaim = Math.max(0, prev.timeUntilClaim - actualElapsed);
        const newCanClaim = timeUntilClaim <= 0;

        // When claim window opens, trigger a fresh data fetch to get accurate server state
        if (newCanClaim && !prev.canClaim && !refreshTriggered) {
          refreshTriggered = true;
          // Schedule fetchData outside of setState to avoid state update during render
          setTimeout(() => fetchData(), 0);
        }

        return {
          ...prev,
          timeUntilClaim,
          timeUntilReset: Math.max(0, prev.timeUntilReset - actualElapsed),
          canClaim: newCanClaim,
        };
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [canClaim, fetchData]);

  const handleClaim = async () => {
    if (!authenticated || claiming) return;
    setClaiming(true);

    try {
      const result = (await claimDailyLogin()) as unknown as ClaimResult;

      if (result.success) {
        setModal(result);
        await fetchData();

        // Fetch latest portfolio breakdown to update totalPoints & virtualBalance
        if (user?.id) {
          try {
            const breakdown = (await getUserPortfolioBreakdown(
              user.id
            )) as unknown as { totalPoints: number; wallet: number };
            if (user) {
              setUser({
                ...user,
                totalPoints: breakdown.totalPoints,
                virtualBalance: breakdown.wallet,
              });
            }
          } catch {
            // Non-critical — don't block the claim flow
          }
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('Network error. Please check your connection.');
    }
    setClaiming(false);
  };

  if (!authenticated) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 h-5 w-32 animate-pulse rounded bg-muted/50" />
        <div className="mb-4 h-8 w-24 animate-pulse rounded bg-muted/50" />
        <div className="h-10 w-full animate-pulse rounded bg-muted/50" />
      </div>
    );
  }

  // Don't render if data failed to load (API/database not ready)
  if (!data) return null;

  const progress =
    data.nextMilestone > 0
      ? ((data.nextMilestone - data.daysUntilMilestone) / data.nextMilestone) *
        100
      : 100;

  return (
    <>
      <div className="rounded-md border border-border p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Daily Rewards</h2>
            <p className="text-muted-foreground text-sm">
              Claim daily to build your streak
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl text-foreground">
              {data.currentStreak}
            </div>
            <div className="text-muted-foreground text-xs">day streak</div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-4 text-center">
          {STAT_ITEMS.map(({ key, label, format }) => (
            <div key={key}>
              <div className="font-medium text-foreground text-sm">
                {format(data[key])}
              </div>
              <div className="text-muted-foreground text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Milestone Progress */}
        {data.nextMilestone > 0 && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {data.nextMilestone}-day milestone
              </span>
              <span className="text-muted-foreground">
                {data.daysUntilMilestone} days left
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#0066FF] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action */}
        {data.canClaim ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full rounded-md bg-[#0066FF] py-2.5 font-medium text-sm text-white transition-colors hover:bg-[#0066FF]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claiming ? 'Claiming...' : `Claim +${data.nextReward} Points`}
          </button>
        ) : (
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Next claim in </span>
            <span className="font-medium text-foreground">
              {formatTimeRemaining(data.timeUntilClaim)}
            </span>
            {data.timeUntilReset > 0 && (
              <span className="ml-2 text-muted-foreground">
                · Streak expires in {formatTimeRemaining(data.timeUntilReset)}
              </span>
            )}
          </div>
        )}
      </div>

      <DailyLoginModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        claimResult={modal}
      />
    </>
  );
}
