'use client';

import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OnChainBadge } from '@/components/profile/OnChainBadge';
import { Avatar } from '@/components/shared/Avatar';
import { PageContainer } from '@/components/shared/PageContainer';
import { RankBadge, RankNumber } from '@/components/shared/RankBadge';
import { LeaderboardSkeleton } from '@/components/shared/Skeleton';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@babylon/shared';

type LeaderboardTab = 'all' | 'earned' | 'referral';

interface LeaderboardUser {
  id: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  allPoints: number; // New: total points
  invitePoints: number; // New: points from referrals
  earnedPoints: number; // New: points from trading P&L
  bonusPoints: number; // New: bonus points from email/wallet
  referralCount: number;
  balance: number;
  lifetimePnL: number;
  createdAt: Date;
  rank: number;
  isActor?: boolean;
  tier?: string | null;
  onChainRegistered?: boolean;
  nftTokenId?: number | null;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  minPoints: number;
  pointsCategory: LeaderboardTab;
}

export default function LeaderboardPage() {
  const { authenticated, user } = useAuth();
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState<LeaderboardTab>('all');
  const tabs: Array<{
    key: LeaderboardTab;
    label: string;
    description: string;
  }> = [
    {
      key: 'all',
      label: 'All Points',
      description: 'Total reputation including invites and bonuses',
    },
    {
      key: 'earned',
      label: 'Earned Points',
      description: 'Points from trading P&L across all markets',
    },
    {
      key: 'referral',
      label: 'Referral Points',
      description: 'Points from inviting and onboarding friends',
    },
  ];
  const pageSize = 100;
  const baseMinPoints = 500;
  const minPoints = selectedTab === 'all' ? baseMinPoints : 0; // Only gate All Points view

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/leaderboard?page=${currentPage}&pageSize=${pageSize}&minPoints=${minPoints}&pointsType=${selectedTab}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setLeaderboardData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch leaderboard'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [currentPage, minPoints, selectedTab]);

  const handleTabChange = (tab: LeaderboardTab) => {
    if (tab === selectedTab) {
      return;
    }

    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (
      leaderboardData &&
      currentPage < leaderboardData.pagination.totalPages
    ) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activePointsLabel =
    selectedTab === 'all'
      ? 'All Points'
      : selectedTab === 'earned'
        ? 'Earned Points'
        : 'Referral Points';

  const activeTabDescription =
    tabs.find((tab) => tab.key === selectedTab)?.description || '';

  return (
    <PageContainer noPadding className="flex flex-col">
      {/* Desktop: Full width content */}
      <div className="hidden flex-1 flex-col overflow-hidden sm:flex">
        <div className="mx-auto w-full max-w-feed px-4 pt-6 lg:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const isActive = tab.key === selectedTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`rounded-full border px-4 py-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-[#0066FF] bg-[#0066FF] text-primary-foreground shadow-sm'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-muted-foreground text-sm">
            {activeTabDescription}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-feed px-4 lg:px-6">
              <LeaderboardSkeleton count={15} />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <p className="mb-2 font-semibold text-foreground text-lg">
                Failed to load leaderboard
              </p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        {!loading &&
          !error &&
          leaderboardData &&
          leaderboardData.leaderboard.length === 0 && (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Trophy className="mx-auto mb-4 h-16 w-16 opacity-50" />
                {leaderboardData.pointsCategory === 'all' && (
                  <>
                    <p className="mb-2 font-semibold text-foreground text-lg">
                      Compete with AI Traders
                    </p>
                    <p className="mb-2 text-sm">
                      Earn {baseMinPoints.toLocaleString()} reputation points to
                      appear on the leaderboard!
                    </p>
                    <p className="text-xs">
                      Complete your profile, link socials, share, and refer
                      friends to earn points
                    </p>
                  </>
                )}
                {leaderboardData.pointsCategory === 'earned' && (
                  <>
                    <p className="mb-2 font-semibold text-foreground text-lg">
                      No Earned Points Yet
                    </p>
                    <p className="text-sm">
                      Close profitable trades across perps and prediction
                      markets to climb this board.
                    </p>
                  </>
                )}
                {leaderboardData.pointsCategory === 'referral' && (
                  <>
                    <p className="mb-2 font-semibold text-foreground text-lg">
                      No Referral Points Yet
                    </p>
                    <p className="text-sm">
                      Share your invite link and onboard friends to earn
                      referral points.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          leaderboardData &&
          leaderboardData.leaderboard.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-feed px-4 lg:px-6">
                <div className="mb-4 flex items-center gap-3 px-4 pt-4">
                  <Users className="h-5 w-5 text-[#0066FF]" />
                  <h2 className="font-semibold text-foreground text-lg">
                    {leaderboardData.leaderboard.length}{' '}
                    {leaderboardData.leaderboard.length === 1
                      ? 'Player'
                      : 'Players'}
                  </h2>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-0">
                  {leaderboardData.leaderboard.map((player) => {
                    const isCurrentUser =
                      authenticated && user && player.id === user.id;
                    const profileUrl = `/profile/${player.username || player.id}`;
                    const displayPoints =
                      selectedTab === 'all'
                        ? player.allPoints
                        : selectedTab === 'earned'
                          ? player.earnedPoints
                          : player.invitePoints;
                    const formattedPoints = (
                      displayPoints ?? 0
                    ).toLocaleString();
                    const absolutePnL = Math.abs(player.lifetimePnL);
                    const formattedPnL = formatCurrency(absolutePnL);
                    const pnlDisplay =
                      player.lifetimePnL === 0
                        ? formatCurrency(0)
                        : `${player.lifetimePnL > 0 ? '+' : '-'}${formattedPnL}`;
                    const pnlColor =
                      player.lifetimePnL === 0
                        ? 'text-muted-foreground'
                        : player.lifetimePnL > 0
                          ? 'text-green-500'
                          : 'text-red-500';

                    return (
                      <Link
                        key={player.id}
                        href={profileUrl}
                        data-testid={
                          player.isActor ? 'npc-entry' : 'leaderboard-entry'
                        }
                        className={`block px-4 py-3 transition-colors ${
                          isCurrentUser
                            ? 'border-l-4 bg-[#0066FF]/20'
                            : 'hover:bg-muted/30'
                        }`}
                        style={{
                          borderLeftColor: isCurrentUser
                            ? '#0066FF'
                            : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="shrink-0">
                            <RankNumber rank={player.rank} size="md" />
                          </div>

                          {/* Avatar */}
                          <div className="shrink-0">
                            <Avatar
                              id={player.id}
                              name={
                                player.displayName || player.username || 'User'
                              }
                              type={player.isActor ? 'actor' : undefined}
                              size="md"
                              src={player.profileImageUrl || undefined}
                            />
                          </div>

                          {/* User Info */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-3">
                              <h3 className="truncate font-semibold text-foreground">
                                {player.displayName ||
                                  player.username ||
                                  'Anonymous'}
                              </h3>
                              {player.isActor ? (
                                <VerifiedBadge size="sm" />
                              ) : (
                                <OnChainBadge
                                  isRegistered={player.onChainRegistered ?? false}
                                  nftTokenId={player.nftTokenId ?? null}
                                  size="sm"
                                />
                              )}
                              {isCurrentUser && (
                                <span className="rounded bg-[#0066FF] px-2 py-0.5 font-semibold text-primary-foreground text-xs">
                                  YOU
                                </span>
                              )}
                            </div>
                            {player.username && (
                              <p className="truncate text-muted-foreground text-sm">
                                @{player.username}
                              </p>
                            )}
                          </div>

                          {/* Points and Badge */}
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-bold text-foreground text-lg">
                                  {formattedPoints}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {activePointsLabel}
                                </div>
                              </div>
                              <div className="shrink-0">
                                <RankBadge
                                  rank={player.rank}
                                  size="md"
                                  showLabel={false}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Points Breakdown - Show for all users */}
                        {!player.isActor &&
                          (player.invitePoints > 0 ||
                            player.earnedPoints !== 0 ||
                            player.bonusPoints > 0 ||
                            player.lifetimePnL !== 0 ||
                            player.referralCount > 0) && (
                            <div className="mt-2 ml-16 flex gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">
                                  P&L:
                                </span>
                                <span className={`font-semibold ${pnlColor}`}>
                                  {pnlDisplay}
                                </span>
                              </div>
                              {player.invitePoints > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    Invite:
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {player.invitePoints}
                                  </span>
                                </div>
                              )}
                              {player.earnedPoints !== 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    Earned:
                                  </span>
                                  <span
                                    className={`font-semibold ${player.earnedPoints > 0 ? 'text-green-500' : 'text-red-500'}`}
                                  >
                                    {player.earnedPoints > 0 ? '+' : ''}
                                    {player.earnedPoints}
                                  </span>
                                </div>
                              )}
                              {player.bonusPoints > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    Bonus:
                                  </span>
                                  <span className="font-semibold text-yellow-500">
                                    {player.bonusPoints}
                                  </span>
                                </div>
                              )}
                              {player.referralCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    Referrals:
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {player.referralCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {leaderboardData.pagination.totalPages > 1 && (
                  <div className="sticky bottom-0 bg-background/95 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-3 text-foreground transition-colors hover:bg-sidebar-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>

                      <div className="text-muted-foreground text-sm">
                        Page {currentPage} of{' '}
                        {leaderboardData.pagination.totalPages}
                      </div>

                      <button
                        onClick={handleNextPage}
                        disabled={
                          currentPage === leaderboardData.pagination.totalPages
                        }
                        className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-3 text-foreground transition-colors hover:bg-sidebar-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Mobile/Tablet: Full width content */}
      <div className="flex flex-1 flex-col overflow-hidden sm:hidden">
        <div className="w-full px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const isActive = tab.key === selectedTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`whitespace-nowrap rounded-full border px-3 py-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-[#0066FF] bg-[#0066FF] text-primary-foreground shadow-sm'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            {activeTabDescription}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 overflow-y-auto">
            <div className="w-full px-4 sm:px-6">
              <LeaderboardSkeleton count={10} />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <p className="mb-2 font-semibold text-foreground text-lg">
                Failed to load leaderboard
              </p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        {!loading &&
          !error &&
          leaderboardData &&
          leaderboardData.leaderboard.length === 0 && (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Trophy className="mx-auto mb-4 h-16 w-16 opacity-50" />
                {leaderboardData.pointsCategory === 'all' && (
                  <>
                    <p className="mb-2 font-semibold text-foreground text-lg">
                      Compete with AI Traders
                    </p>
                    <p className="mb-2 text-sm">
                      Earn {baseMinPoints.toLocaleString()} reputation points to
                      appear on the leaderboard!
                    </p>
                    <p className="text-xs">
                      Complete your profile, link socials, share, and refer
                      friends to earn points.
                    </p>
                  </>
                )}
                {leaderboardData.pointsCategory === 'earned' && (
                  <>
                    <p className="mb-2 font-semibold text-foreground text-lg">
                      No Earned Points Yet
                    </p>
                    <p className="text-sm">
                      Close profitable trades across perps and prediction
                      markets to climb this board.
                    </p>
                  </>
                )}
                {leaderboardData.pointsCategory === 'referral' && (
                  <>
                    <p className="mb-2 font-semibold text-foreground text-lg">
                      No Referral Points Yet
                    </p>
                    <p className="text-sm">
                      Share your invite link and onboard friends to earn
                      referral points.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          leaderboardData &&
          leaderboardData.leaderboard.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="w-full px-4 sm:px-6">
                {/* Header */}
                <div className="mb-4 flex items-center gap-3 pt-4 pb-2">
                  <Users className="h-5 w-5 text-[#0066FF]" />
                  <h2 className="font-semibold text-foreground text-lg">
                    {leaderboardData.leaderboard.length}{' '}
                    {leaderboardData.leaderboard.length === 1
                      ? 'Player'
                      : 'Players'}
                  </h2>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="space-y-0">
                  {leaderboardData.leaderboard.map((player) => {
                    const isCurrentUser =
                      authenticated && user && player.id === user.id;
                    const profileUrl = `/profile/${player.username || player.id}`;
                    const displayPoints =
                      selectedTab === 'all'
                        ? player.allPoints
                        : selectedTab === 'earned'
                          ? player.earnedPoints
                          : player.invitePoints;
                    const formattedPoints = (
                      displayPoints ?? 0
                    ).toLocaleString();
                    const absolutePnL = Math.abs(player.lifetimePnL);
                    const formattedPnL = formatCurrency(absolutePnL);
                    const pnlDisplay =
                      player.lifetimePnL === 0
                        ? formatCurrency(0)
                        : `${player.lifetimePnL > 0 ? '+' : '-'}${formattedPnL}`;
                    const pnlColor =
                      player.lifetimePnL === 0
                        ? 'text-muted-foreground'
                        : player.lifetimePnL > 0
                          ? 'text-green-500'
                          : 'text-red-500';

                    return (
                      <Link
                        key={player.id}
                        href={profileUrl}
                        className={`block px-3 py-3 transition-colors sm:px-4 sm:py-4 ${
                          isCurrentUser
                            ? 'border-l-4 bg-[#0066FF]/20'
                            : 'hover:bg-muted/30'
                        }`}
                        style={{
                          borderLeftColor: isCurrentUser
                            ? '#0066FF'
                            : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* Rank */}
                          <div className="shrink-0">
                            <RankNumber rank={player.rank} size="md" />
                          </div>

                          {/* Avatar */}
                          <div className="shrink-0">
                            <Avatar
                              id={player.id}
                              name={
                                player.displayName || player.username || 'User'
                              }
                              type={player.isActor ? 'actor' : undefined}
                              size="md"
                              src={player.profileImageUrl || undefined}
                            />
                          </div>

                          {/* User Info */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-3">
                              <h3 className="truncate font-semibold text-foreground text-sm sm:text-base">
                                {player.displayName ||
                                  player.username ||
                                  'Anonymous'}
                              </h3>
                              {player.isActor ? (
                                <VerifiedBadge size="sm" />
                              ) : (
                                <OnChainBadge
                                  isRegistered={player.onChainRegistered ?? false}
                                  nftTokenId={player.nftTokenId ?? null}
                                  size="sm"
                                />
                              )}
                              {isCurrentUser && (
                                <span className="shrink-0 rounded bg-[#0066FF]/20 px-2 py-0.5 text-[#0066FF] text-xs">
                                  You
                                </span>
                              )}
                            </div>
                            {player.username && (
                              <p className="mb-1 truncate text-muted-foreground text-xs">
                                @{player.username}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground text-xs sm:gap-3 sm:text-sm">
                              <span className="font-semibold text-foreground">
                                {formattedPoints} pts
                              </span>
                              <span>{activePointsLabel}</span>
                              {player.rank <= 3 && (
                                <RankBadge rank={player.rank} />
                              )}
                            </div>
                            {!player.isActor && (
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs sm:text-sm">
                                <span className={`${pnlColor} font-semibold`}>
                                  P&L: {pnlDisplay}
                                </span>
                                {player.invitePoints > 0 && (
                                  <span>
                                    Invite:{' '}
                                    <span className="font-semibold text-primary">
                                      {player.invitePoints}
                                    </span>
                                  </span>
                                )}
                                {player.earnedPoints !== 0 && (
                                  <span>
                                    Earned:{' '}
                                    <span
                                      className={`font-semibold ${player.earnedPoints > 0 ? 'text-green-500' : 'text-red-500'}`}
                                    >
                                      {player.earnedPoints > 0 ? '+' : ''}
                                      {player.earnedPoints}
                                    </span>
                                  </span>
                                )}
                                {player.bonusPoints > 0 && (
                                  <span>
                                    Bonus:{' '}
                                    <span className="font-semibold text-yellow-500">
                                      {player.bonusPoints}
                                    </span>
                                  </span>
                                )}
                                {player.referralCount > 0 && (
                                  <span>
                                    Referrals:{' '}
                                    <span className="font-semibold text-primary">
                                      {player.referralCount}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {leaderboardData.pagination.totalPages > 1 && (
                  <div className="sticky bottom-0 mt-4 border-border border-t bg-background/95 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-lg bg-sidebar-accent px-3 py-2 text-foreground text-sm transition-colors hover:bg-sidebar-accent/80 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-4"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      <div className="text-center text-muted-foreground text-xs sm:text-sm">
                        Page {currentPage} of{' '}
                        {leaderboardData.pagination.totalPages}
                      </div>

                      <button
                        onClick={handleNextPage}
                        disabled={
                          currentPage === leaderboardData.pagination.totalPages
                        }
                        className="flex items-center gap-1 rounded-lg bg-sidebar-accent px-3 py-2 text-foreground text-sm transition-colors hover:bg-sidebar-accent/80 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-4"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </PageContainer>
  );
}
