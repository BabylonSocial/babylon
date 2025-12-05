'use client';

import {
  Award,
  Check,
  Copy,
  ExternalLink,
  Gift,
  Link as LinkIcon,
  Share2,
  TrendingUp,
  Twitter,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LoginButton } from '@/components/auth/LoginButton';
import { LinkSocialAccountsModal } from '@/components/profile/LinkSocialAccountsModal';
import { RewardsSkeleton } from '@/components/rewards/RewardsSkeleton';
import { Avatar } from '@/components/shared/Avatar';
import { ExternalShareButton } from '@/components/shared/ExternalShareButton';
import { PageContainer } from '@/components/shared/PageContainer';
import { Separator } from '@/components/shared/Separator';
import { ShareEarnModal } from '@/components/shared/ShareEarnModal';
import { useAuth } from '@/hooks/useAuth';
import { POINTS } from '@babylon/shared';
import { getProfileUrl } from '@babylon/shared';
import {
  getReferralShareText,
  getReferralUrl,
} from '@babylon/shared';
import { useAuthStore } from '@/stores/authStore';

interface ReferredUser {
  id: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  reputationPoints: number;
  isFollowing: boolean;
  joinedAt: Date | null;
}

interface ReferralStats {
  totalReferrals: number;
  totalPointsEarned?: number;
  totalFeesEarned?: number;
  pointsPerReferral?: number;
  feeShareRate?: number;
  followingCount: number;
  weeklyReferralCount?: number;
  weeklyLimit?: number;
}

interface ReferralData {
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    bio: string | null;
    profileImageUrl: string | null;
    referralCode: string | null;
    reputationPoints: number;
    pointsAwardedForProfile: boolean;
    pointsAwardedForFarcaster: boolean;
    pointsAwardedForTwitter: boolean;
    pointsAwardedForWallet: boolean;
    farcasterUsername: string | null;
    twitterUsername: string | null;
    walletAddress: string | null;
  };
  stats: ReferralStats;
  referredUsers: ReferredUser[];
  referralUrl: string | null;
}

export default function RewardsPage() {
  const { ready, authenticated, getAccessToken, login, refresh } = useAuth();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showLinkSocialModal, setShowLinkSocialModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Handle OAuth callback from Twitter/Discord linking
  useEffect(() => {
    const success = searchParams.get('success');
    const points = searchParams.get('points');
    const errorParam = searchParams.get('error');

    if (success === 'twitter_linked' && points) {
      toast.success(`X account linked! +${points} points awarded`);
      // Dispatch event to notify other components (like UserMenu) to refresh
      window.dispatchEvent(new CustomEvent('rewards-updated'));
      // Refresh auth state to get latest reputation points
      refresh();
      // Clean up URL params
      window.history.replaceState({}, '', '/rewards');
    } else if (success === 'discord_linked' && points) {
      toast.success(`Discord account linked! +${points} points awarded`);
      window.dispatchEvent(new CustomEvent('rewards-updated'));
      refresh();
      window.history.replaceState({}, '', '/rewards');
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        twitter_already_linked: 'This X account is already linked to another user',
        discord_already_linked: 'This Discord account is already linked to another user',
        token_exchange_failed: 'Failed to authenticate. Please try again.',
        invalid_state: 'Session expired. Please try again.',
        state_expired: 'Session expired. Please try again.',
      };
      toast.error(errorMessages[errorParam] || 'An error occurred. Please try again.');
      window.history.replaceState({}, '', '/rewards');
    }
  }, [searchParams, refresh]);

  const fetchReferralData = useCallback(async () => {
    if (!user?.id || !authenticated) return;

    setLoading(true);
    setError(null);

    const token = await getAccessToken();
    if (!token) {
      console.error('Failed to get access token');
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(user.id)}/referrals`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch referral data');
      }

      const data = await response.json();
      setReferralData(data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch referral data'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, authenticated, getAccessToken]);

  useEffect(() => {
    if (ready && authenticated && user?.id) {
      fetchReferralData();
    } else if (ready && !authenticated) {
      setLoading(false);
    }
  }, [user?.id, ready, authenticated, fetchReferralData]);

  const handleCopyUrl = async () => {
    if (!referralData?.user.referralCode) return;
    const referralUrl = getReferralUrl(referralData.user.referralCode);
    await navigator.clipboard.writeText(referralUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Calculate total points earned from all sources
  const calculateTotalEarned = () => {
    if (!referralData) return 0;
    let total = 0;

    // Add referral fees earned (new system)
    if (referralData.stats.totalFeesEarned) {
      total += referralData.stats.totalFeesEarned;
    }

    // Add profile completion points
    if (referralData.user.pointsAwardedForProfile)
      total += POINTS.PROFILE_COMPLETION;
    if (referralData.user.pointsAwardedForFarcaster)
      total += POINTS.FARCASTER_LINK;
    if (referralData.user.pointsAwardedForTwitter) total += POINTS.TWITTER_LINK;
    if (referralData.user.pointsAwardedForWallet)
      total += POINTS.WALLET_CONNECT;

    return total;
  };

  const rewardTasks = referralData
    ? [
        {
          id: 'profile',
          title: 'Complete Profile',
          description: (() => {
            if (referralData.user.pointsAwardedForProfile) {
              return 'Username, image, and bio complete! ✓';
            }
            const missing = [];
            if (!referralData.user.username) missing.push('username');
            if (!referralData.user.profileImageUrl) missing.push('image');
            if (!referralData.user.bio || referralData.user.bio.length < 50)
              missing.push('bio (50+ chars)');
            return `Set ${missing.join(', ')}`;
          })(),
          points: POINTS.PROFILE_COMPLETION,
          completed: referralData.user.pointsAwardedForProfile,
          action: 'profile-settings',
          icon: UserPlus,
          color: 'text-purple-500',
        },
        {
          id: 'twitter',
          title: 'Link X Account',
          description: referralData.user.twitterUsername
            ? `@${referralData.user.twitterUsername}`
            : 'Connect your X account',
          points: POINTS.TWITTER_LINK,
          completed: referralData.user.pointsAwardedForTwitter,
          action: 'link-social',
          icon: Twitter,
          color: 'text-blue-400',
        },
        {
          id: 'farcaster',
          title: 'Link Farcaster',
          description: referralData.user.farcasterUsername
            ? `@${referralData.user.farcasterUsername}`
            : 'Connect Farcaster account',
          points: POINTS.FARCASTER_LINK,
          completed: referralData.user.pointsAwardedForFarcaster,
          action: 'link-social',
          icon: LinkIcon,
          color: 'text-purple-400',
        },
        {
          id: 'wallet',
          title: 'Connect Wallet',
          description: referralData.user.walletAddress
            ? `${referralData.user.walletAddress.slice(0, 6)}...${referralData.user.walletAddress.slice(-4)}`
            : 'Link your wallet',
          points: POINTS.WALLET_CONNECT,
          completed: referralData.user.pointsAwardedForWallet,
          action: 'wallet-connect',
          icon: Wallet,
          color: 'text-orange-500',
        },
      ]
    : [];

  const handleTaskClick = (_taskId: string, action: string) => {
    if (action === 'link-social') {
      setShowLinkSocialModal(true);
    } else if (action === 'profile-settings') {
      window.location.href = '/settings';
    } else if (action === 'wallet-connect') {
      // Trigger Privy login modal for wallet connection
      if (authenticated) {
        // If already authenticated, redirect to settings to connect wallet
        window.location.href = '/settings';
      } else {
        // Trigger login modal
        login();
      }
    }
  };

  return (
    <PageContainer noPadding className="flex flex-col">
      {/* Auth Required Banner */}
      {ready && !authenticated && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <Award className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-bold text-foreground text-xl">log in</h2>
            <p className="mb-6 text-muted-foreground">
              Sign in to earn rewards and track your progress
            </p>
            <LoginButton />
          </div>
        </div>
      )}

      {/* Loading State */}
      {authenticated && loading && <RewardsSkeleton />}

      {/* Error State */}
      {authenticated && error && !loading && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center text-red-500">
            <p className="mb-2 font-semibold text-lg">Failed to load rewards</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Rewards Content - Desktop */}
      {authenticated && !loading && !error && referralData && (
        <div className="hidden flex-1 overflow-hidden xl:flex">
          {/* Main Content Column */}
          <div className="min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {/* Header */}
            <div className="mb-4">
              <h1 className="mb-2 font-bold text-2xl text-foreground">
                Rewards
              </h1>
              <p className="text-muted-foreground">
                Complete tasks and invite friends to earn points
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Total Earned */}
              <div className="rounded-lg border border-[#0066FF]/30 bg-gradient-to-r from-[#0066FF]/20 to-purple-500/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <h2 className="font-medium text-muted-foreground text-sm">
                    Total Earned
                  </h2>
                </div>
                <div className="font-bold text-3xl text-yellow-500">
                  {calculateTotalEarned().toLocaleString()}
                </div>
              </div>

              {/* Current Balance */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#0066FF]" />
                  <h2 className="font-medium text-muted-foreground text-sm">
                    Current Balance
                  </h2>
                </div>
                <div className="font-bold text-3xl text-foreground">
                  {referralData.user.reputationPoints.toLocaleString()}
                </div>
              </div>

              {/* Total Referrals */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#0066FF]" />
                  <h2 className="font-medium text-muted-foreground text-sm">
                    Total Referrals
                  </h2>
                </div>
                <div className="font-bold text-3xl text-foreground">
                  {referralData.stats.totalReferrals}
                </div>
                {referralData.stats.weeklyReferralCount !== undefined &&
                  referralData.stats.weeklyLimit !== undefined && (
                    <div className="mt-2 border-border border-t pt-2">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">This Week</span>
                        <span
                          className={`font-semibold ${
                            referralData.stats.weeklyReferralCount >=
                            referralData.stats.weeklyLimit
                              ? 'text-red-500'
                              : referralData.stats.weeklyReferralCount >=
                                  referralData.stats.weeklyLimit * 0.8
                                ? 'text-yellow-500'
                                : 'text-foreground'
                          }`}
                        >
                          {referralData.stats.weeklyReferralCount}/
                          {referralData.stats.weeklyLimit}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-background">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            referralData.stats.weeklyReferralCount >=
                            referralData.stats.weeklyLimit
                              ? 'bg-red-500'
                              : referralData.stats.weeklyReferralCount >=
                                  referralData.stats.weeklyLimit * 0.8
                                ? 'bg-yellow-500'
                                : 'bg-[#0066FF]'
                          }`}
                          style={{
                            width: `${Math.min(100, (referralData.stats.weeklyReferralCount / referralData.stats.weeklyLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Reward Tasks */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#0066FF]" />
                <h2 className="font-bold text-base text-foreground">
                  Earn Points
                </h2>
              </div>

              <div className="grid gap-3">
                {rewardTasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task.id, task.action)}
                      className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                        task.completed
                          ? 'border-green-500/30 bg-green-500/10'
                          : 'cursor-pointer border-border bg-sidebar-accent/50 hover:bg-sidebar-accent'
                      }`}
                    >
                      <div className={`shrink-0 ${task.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">
                            {task.title}
                          </h3>
                          {task.completed && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="truncate text-muted-foreground text-xs">
                          {task.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={`font-bold text-sm ${task.completed ? 'text-green-500' : 'text-yellow-500'}`}
                        >
                          {task.completed ? '✓ ' : '+'}
                          {task.points}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          points
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share Actions */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-[#0066FF]" />
                  <div>
                    <h2 className="font-bold text-base text-foreground">
                      Share & Earn
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Share content to earn +{POINTS.SHARE_ACTION} points
                      (one-time reward)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="rounded-lg bg-[#0066FF] px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-[#0066FF]/80"
                >
                  Share
                </button>
              </div>
            </div>

            <Separator />

            {/* Referral Link */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#0066FF]" />
                <h2 className="font-bold text-base text-foreground">
                  Referral Link
                </h2>
                <span className="text-muted-foreground text-xs">
                  +{POINTS.REFERRAL_SIGNUP} points per signup (max 10/week)
                </span>
              </div>

              <div className="space-y-3">
                {/* URL Display */}
                <div className="flex gap-2">
                  <div className="flex-1 truncate rounded-lg border border-border bg-sidebar-accent/50 px-3 py-2 text-foreground text-sm">
                    {referralData.user.referralCode
                      ? getReferralUrl(referralData.user.referralCode)
                      : 'Generating your referral link...'}
                  </div>
                  <button
                    onClick={handleCopyUrl}
                    disabled={!referralData.user.referralCode}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-sidebar-accent/50 px-3 py-2 text-foreground transition-colors hover:bg-sidebar-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="hidden text-xs sm:inline">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="hidden text-xs sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Share Button */}
                {referralData.user.referralCode && (
                  <ExternalShareButton
                    contentType="referral"
                    text={getReferralShareText(referralData.user.referralCode)}
                    url={getReferralUrl(referralData.user.referralCode)}
                    className="w-full"
                  />
                )}

                {!referralData.user.referralCode && (
                  <p className="text-muted-foreground text-xs">
                    Sign in to get your referral link
                  </p>
                )}
              </div>
            </div>

            {/* Referred Users List */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-bold text-base text-foreground">
                  <Users className="h-4 w-4 text-[#0066FF]" />
                  Your Referrals
                </h2>
              </div>

              {referralData.referredUsers.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/30 py-8 text-center">
                  <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mb-1 font-semibold text-base text-foreground">
                    No referrals yet
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Share your referral link to start earning points
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referralData.referredUsers.map((referredUser) => (
                    <div
                      key={referredUser.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      {/* Avatar */}
                      <Avatar
                        src={referredUser.profileImageUrl || undefined}
                        alt={
                          referredUser.displayName ||
                          referredUser.username ||
                          'User'
                        }
                        size="sm"
                      />

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground text-sm">
                          {referredUser.displayName ||
                            referredUser.username ||
                            'Anonymous'}
                        </h3>
                        {referredUser.username && (
                          <p className="truncate text-muted-foreground text-xs">
                            @{referredUser.username}
                          </p>
                        )}
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {new Date(
                            referredUser.joinedAt || referredUser.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {/* View Profile */}
                      <a
                        href={getProfileUrl(
                          referredUser.id,
                          referredUser.username
                        )}
                        className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="View profile"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rewards Widget Column */}
          {/* <div className="hidden xl:flex flex-col w-96 shrink-0 overflow-y-auto bg-sidebar p-4">
            {user && <RewardsWidget userId={user.id} />}
          </div> */}
        </div>
      )}

      {/* Mobile/Tablet View */}
      {authenticated && !loading && !error && referralData && (
        <div className="flex w-full flex-1 flex-col overflow-y-auto xl:hidden">
          <div className="w-full space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            {/* Header */}
            <div>
              <h1 className="mb-2 font-bold text-2xl text-foreground">
                Rewards
              </h1>
              <p className="text-muted-foreground">
                Complete tasks and invite friends to earn points
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Total Earned */}
              <div className="rounded-lg border border-[#0066FF]/30 bg-gradient-to-r from-[#0066FF]/20 to-purple-500/20 p-3">
                <div className="mb-1 flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <h2 className="font-medium text-muted-foreground text-xs">
                    Earned
                  </h2>
                </div>
                <div className="font-bold text-2xl text-yellow-500">
                  {calculateTotalEarned().toLocaleString()}
                </div>
              </div>

              {/* Current Balance */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-[#0066FF]" />
                  <h2 className="font-medium text-muted-foreground text-xs">
                    Balance
                  </h2>
                </div>
                <div className="font-bold text-2xl text-foreground">
                  {referralData.user.reputationPoints.toLocaleString()}
                </div>
              </div>

              {/* Total Referrals */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-1 flex items-center gap-1">
                  <Users className="h-4 w-4 text-[#0066FF]" />
                  <h2 className="font-medium text-muted-foreground text-xs">
                    Referrals
                  </h2>
                </div>
                <div className="font-bold text-2xl text-foreground">
                  {referralData.stats.totalReferrals}
                </div>
                {referralData.stats.weeklyReferralCount !== undefined &&
                  referralData.stats.weeklyLimit !== undefined && (
                    <div className="mt-1.5 border-border border-t pt-1.5">
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Week</span>
                        <span
                          className={`font-semibold ${
                            referralData.stats.weeklyReferralCount >=
                            referralData.stats.weeklyLimit
                              ? 'text-red-500'
                              : referralData.stats.weeklyReferralCount >=
                                  referralData.stats.weeklyLimit * 0.8
                                ? 'text-yellow-500'
                                : 'text-foreground'
                          }`}
                        >
                          {referralData.stats.weeklyReferralCount}/
                          {referralData.stats.weeklyLimit}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-background">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            referralData.stats.weeklyReferralCount >=
                            referralData.stats.weeklyLimit
                              ? 'bg-red-500'
                              : referralData.stats.weeklyReferralCount >=
                                  referralData.stats.weeklyLimit * 0.8
                                ? 'bg-yellow-500'
                                : 'bg-[#0066FF]'
                          }`}
                          style={{
                            width: `${Math.min(100, (referralData.stats.weeklyReferralCount / referralData.stats.weeklyLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Reward Tasks */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 font-bold text-foreground text-lg">
                <TrendingUp className="h-5 w-5 text-[#0066FF]" />
                Earn Points
              </h2>

              <div className="space-y-2">
                {rewardTasks.map((task) => {
                  const Icon = task.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task.id, task.action)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        task.completed
                          ? 'border-green-500/30 bg-green-500/10'
                          : 'cursor-pointer border-border bg-muted/30'
                      }`}
                    >
                      <div className={`shrink-0 ${task.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">
                            {task.title}
                          </h3>
                          {task.completed && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="truncate text-muted-foreground text-xs">
                          {task.description}
                        </p>
                      </div>
                      <div className="shrink-0 font-bold text-sm">
                        <span
                          className={
                            task.completed
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }
                        >
                          {task.completed ? '✓' : '+'}
                          {task.points}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share Actions */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 font-bold text-foreground text-lg">
                <Share2 className="h-5 w-5 text-[#0066FF]" />
                Share & Earn
              </h2>
              <p className="text-muted-foreground text-sm">
                Share content to earn +{POINTS.SHARE_ACTION} points (one-time
                reward)
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-foreground transition-colors hover:bg-sidebar-accent/80"
                >
                  <>
                    <Share2 className="h-4 w-4" />
                    <span className="font-medium text-sm">Share</span>
                  </>
                </button>
              </div>
            </div>

            <Separator />

            {/* Referral Link */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#0066FF]" />
                <h2 className="font-bold text-base text-foreground">
                  Referral Link
                </h2>
                <span className="text-muted-foreground text-xs">
                  +{POINTS.REFERRAL_SIGNUP} points per signup (max 10/week)
                </span>
              </div>

              <div className="space-y-3">
                {/* URL Display */}
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1 break-all rounded-lg border border-border bg-sidebar-accent/50 px-3 py-2 text-foreground text-sm">
                    {referralData.user.referralCode
                      ? getReferralUrl(referralData.user.referralCode)
                      : 'Generating your referral link...'}
                  </div>
                  <button
                    onClick={handleCopyUrl}
                    disabled={!referralData.user.referralCode}
                    className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-sidebar-accent/50 px-3 py-2 text-foreground transition-colors hover:bg-sidebar-accent disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Copy referral link"
                  >
                    {copiedUrl ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Share Button */}
                {referralData.user.referralCode && (
                  <ExternalShareButton
                    contentType="referral"
                    text={getReferralShareText(referralData.user.referralCode)}
                    url={getReferralUrl(referralData.user.referralCode)}
                    className="w-full"
                  />
                )}

                {!referralData.user.referralCode && (
                  <p className="text-muted-foreground text-xs">
                    Sign in to get your referral link
                  </p>
                )}
              </div>
            </div>

            {/* Referred Users List */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-base text-foreground">
                  <Users className="h-5 w-5 text-[#0066FF]" />
                  Your Referrals
                </h2>
              </div>

              {referralData.referredUsers.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/30 py-12 text-center">
                  <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold text-foreground text-lg">
                    No referrals yet
                  </h3>
                  <p className="px-4 text-muted-foreground text-sm">
                    Share your referral link to start earning points
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralData.referredUsers.map((referredUser) => (
                    <div
                      key={referredUser.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      {/* Avatar */}
                      <Avatar
                        id={referredUser.id}
                        name={
                          referredUser.displayName ||
                          referredUser.username ||
                          'User'
                        }
                        src={referredUser.profileImageUrl || undefined}
                        size="sm"
                      />

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground text-sm">
                          {referredUser.displayName ||
                            referredUser.username ||
                            'Anonymous'}
                        </h3>
                        {referredUser.username && (
                          <p className="truncate text-muted-foreground text-xs">
                            @{referredUser.username}
                          </p>
                        )}
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {new Date(
                            referredUser.joinedAt || referredUser.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {/* View Profile */}
                      <a
                        href={getProfileUrl(
                          referredUser.id,
                          referredUser.username
                        )}
                        className="p-2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="View profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Social Accounts Modal */}
      <LinkSocialAccountsModal
        isOpen={showLinkSocialModal}
        onClose={() => {
          setShowLinkSocialModal(false);
          // Refresh data to update the UI
          if (user?.id && authenticated) {
            fetchReferralData();
          }
        }}
      />

      {/* Share & Earn Modal */}
      <ShareEarnModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        contentType="profile"
        contentId={user?.id || ''}
        text="Check out my Babylon profile! 🎮"
      />
    </PageContainer>
  );
}
