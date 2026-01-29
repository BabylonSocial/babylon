'use client';

import { formatCurrency } from '@babylon/shared';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FollowButton } from '@/components/interactions/FollowButton';
import type { SelectedUser } from '@/components/leaderboard/LeaderboardWidgetSidebar';
import { OnChainBadge } from '@/components/profile/OnChainBadge';
import { Avatar } from '@/components/shared/Avatar';
import type { LeaderboardTab } from '@/components/shared/LeaderboardToggle';
import { LeaderboardToggle } from '@/components/shared/LeaderboardToggle';
import { PageContainer } from '@/components/shared/PageContainer';
import { RankBadge, RankNumber } from '@/components/shared/RankBadge';
import { LeaderboardSkeleton } from '@/components/shared/Skeleton';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';

// Lazy load sidebar - only needed on desktop
const LeaderboardWidgetSidebar = dynamic(
  () =>
    import('@/components/leaderboard/LeaderboardWidgetSidebar').then((m) => ({
      default: m.LeaderboardWidgetSidebar,
    })),
  {
    ssr: false,
    loading: () => <div className="hidden w-96 flex-none xl:block" />,
  }
);

interface LeaderboardUser {
  id: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  allPoints: number;
  invitePoints: number;
  earnedPoints: number;
  bonusPoints: number;
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
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const pageSize = 100;
  const baseMinPoints = 500;
  const minPoints = selectedTab === 'all' ? baseMinPoints : 0;

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/leaderboard?page=${currentPage}&pageSize=${pageSize}&minPoints=${minPoints}&pointsType=${selectedTab}`
      );

      if (!response.ok) {
        setError('Failed to fetch leaderboard');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLeaderboardData(data);
      setLoading(false);
    }

    fetchLeaderboard();
  }, [currentPage, minPoints, selectedTab]);

  const handleTabChange = (tab: LeaderboardTab) => {
    if (tab === selectedTab) {
      return;
    }

    setSelectedTab(tab);
    setCurrentPage(1);
    setSelectedUser(null);
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

  const handleUserClick = (player: LeaderboardUser) => {
    setSelectedUser({
      id: player.id,
      username: player.username,
      displayName: player.displayName,
      profileImageUrl: player.profileImageUrl,
      allPoints: player.allPoints,
      invitePoints: player.invitePoints,
      earnedPoints: player.earnedPoints,
      bonusPoints: player.bonusPoints,
      referralCount: player.referralCount,
      balance: player.balance,
      lifetimePnL: player.lifetimePnL,
      rank: player.rank,
      isActor: player.isActor,
      tier: player.tier,
      onChainRegistered: player.onChainRegistered,
      nftTokenId: player.nftTokenId,
    });
  };

  const activePointsLabel =
    selectedTab === 'all'
      ? 'All Points'
      : selectedTab === 'earned'
        ? 'Earned Points'
        : 'Referral Points';

  const tabDescriptions: Record<LeaderboardTab, string> = {
    all: 'Total reputation including invites and bonuses',
    earned: 'Points from trading P&L across all markets',
    referral: 'Points from inviting and onboarding friends',
  };

  const renderEmptyState = () => {
    if (!leaderboardData) return null;

    return (
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
                Complete your profile, link socials, share, and refer friends to
                earn points
              </p>
            </>
          )}
          {leaderboardData.pointsCategory === 'earned' && (
            <>
              <p className="mb-2 font-semibold text-foreground text-lg">
                No Earned Points Yet
              </p>
              <p className="text-sm">
                Close profitable trades across perps and prediction markets to
                climb this board.
              </p>
            </>
          )}
          {leaderboardData.pointsCategory === 'referral' && (
            <>
              <p className="mb-2 font-semibold text-foreground text-lg">
                No Referral Points Yet
              </p>
              <p className="text-sm">
                Share your invite link and onboard friends to earn referral
                points.
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboardContent = () => {
    if (loading) {
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <LeaderboardSkeleton count={15} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <p className="mb-2 font-semibold text-foreground text-lg">
              Failed to load leaderboard
            </p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!leaderboardData || leaderboardData.leaderboard.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {leaderboardData.leaderboard.map((player) => {
            const isCurrentUser =
              authenticated && user && player.id === user.id;
            const isSelected = selectedUser?.id === player.id;
            const profileUrl = `/profile/${player.username || player.id}`;
            const displayPoints =
              selectedTab === 'all'
                ? player.allPoints
                : selectedTab === 'earned'
                  ? player.earnedPoints
                  : player.invitePoints;
            const formattedPoints = (displayPoints ?? 0).toLocaleString();
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
              <div key={player.id} className="flex items-stretch">
                {/* Clickable area for widget (desktop) - using div to allow nested FollowButton */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`View profile for ${player.displayName || player.username || 'Anonymous'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleUserClick(player);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleUserClick(player);
                    }
                  }}
                  data-testid={
                    player.isActor ? 'npc-entry' : 'leaderboard-entry'
                  }
                  className={`hidden flex-1 cursor-pointer px-4 py-3 text-left transition-colors xl:block ${
                    isSelected
                      ? 'border-[#0066FF] border-l-4 bg-[#0066FF]/20'
                      : isCurrentUser
                        ? 'border-l-4 border-l-[#0066FF] bg-[#0066FF]/10 hover:bg-muted/30'
                        : 'border-l-4 border-l-transparent hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <RankNumber rank={player.rank} size="md" />
                    </div>
                    <div className="shrink-0">
                      <Avatar
                        id={player.id}
                        name={player.displayName || player.username || 'User'}
                        type={player.isActor ? 'actor' : undefined}
                        size="md"
                        src={player.profileImageUrl || undefined}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-semibold text-foreground">
                          {player.displayName || player.username || 'Anonymous'}
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
                        {authenticated && !isCurrentUser && (
                          <div
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FollowButton
                              userId={player.id}
                              size="sm"
                              variant="icon"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!player.isActor &&
                    (player.invitePoints > 0 ||
                      player.earnedPoints !== 0 ||
                      player.bonusPoints > 0 ||
                      player.lifetimePnL !== 0 ||
                      player.referralCount > 0) && (
                      <div className="mt-2 ml-16 flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">P&L:</span>
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
                </div>

                {/* Mobile/Tablet: Direct link to profile */}
                <Link
                  href={profileUrl}
                  data-testid={
                    player.isActor ? 'npc-entry' : 'leaderboard-entry'
                  }
                  className={`block flex-1 px-4 py-3 transition-colors xl:hidden ${
                    isCurrentUser
                      ? 'border-l-4 bg-[#0066FF]/20'
                      : 'hover:bg-muted/30'
                  }`}
                  style={{
                    borderLeftColor: isCurrentUser ? '#0066FF' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="shrink-0">
                      <RankNumber rank={player.rank} size="md" />
                    </div>
                    <div className="shrink-0">
                      <Avatar
                        id={player.id}
                        name={player.displayName || player.username || 'User'}
                        type={player.isActor ? 'actor' : undefined}
                        size="md"
                        src={player.profileImageUrl || undefined}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-semibold text-foreground text-sm sm:text-base">
                          {player.displayName || player.username || 'Anonymous'}
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
                        {player.rank <= 3 && <RankBadge rank={player.rank} />}
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

                {/* Mobile Follow Button */}
                {authenticated && !isCurrentUser && (
                  <div className="flex shrink-0 items-center self-center pr-3 xl:hidden">
                    <FollowButton userId={player.id} size="sm" variant="icon" />
                  </div>
                )}
              </div>
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
                Page {currentPage} of {leaderboardData.pagination.totalPages}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === leaderboardData.pagination.totalPages}
                className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-3 text-foreground transition-colors hover:bg-sidebar-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageContainer noPadding className="!overflow-visible flex w-full flex-col">
      {/* Desktop: Content + Widgets layout */}
      <div className="hidden flex-1 overflow-hidden xl:flex">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-[rgba(120,120,120,0.15)] lg:border-r lg:border-l">
          {/* Header with tabs */}
          <div className="sticky top-0 z-10 flex-shrink-0 bg-background shadow-sm">
            <LeaderboardToggle
              activeTab={selectedTab}
              onTabChange={handleTabChange}
            />
            <p className="px-3 py-3 text-muted-foreground text-sm sm:px-4 lg:px-6">
              {tabDescriptions[selectedTab]}
            </p>
          </div>

          {/* Content */}
          {renderLeaderboardContent()}
        </div>

        {/* Widget Sidebar */}
        <LeaderboardWidgetSidebar
          selectedUser={selectedUser}
          pointsCategory={selectedTab}
        />
      </div>

      {/* Mobile/Tablet: Full width content */}
      <div className="flex flex-1 flex-col overflow-hidden xl:hidden">
        {/* Header with tabs */}
        <div className="sticky top-0 z-10 flex-shrink-0 bg-background shadow-sm">
          <LeaderboardToggle
            activeTab={selectedTab}
            onTabChange={handleTabChange}
          />
          <p className="px-3 py-2 text-muted-foreground text-xs sm:px-4 sm:text-sm">
            {tabDescriptions[selectedTab]}
          </p>
        </div>

        {/* Content */}
        {renderLeaderboardContent()}
      </div>
    </PageContainer>
  );
}
