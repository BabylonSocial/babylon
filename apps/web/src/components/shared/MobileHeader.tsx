'use client';

import {
  getGetUserBalanceQueryKey,
  getGetUserProfileQueryKey,
  useGetUserBalance,
  useGetUserProfile,
} from '@babylon/api-hooks';
import { cn, getDisplayReferralUrl, getReferralUrl } from '@babylon/shared';
import {
  Check,
  Copy,
  Gift,
  LogOut,
  Settings,
  Trophy,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameFeedbackModal } from '@/components/feedback/GameFeedbackModal';
import { Avatar } from '@/components/shared/Avatar';
import { BabylonIcon } from '@/components/shared/icons/BabylonIcon';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

/**
 * Mobile header content component for mobile devices.
 *
 * Provides a fixed header with logo, profile menu trigger, and slide-out
 * side menu. Shows user profile, navigation links, points balance, referral
 * code, and logout. Automatically hides when WAITLIST_MODE is enabled on
 * home page.
 *
 * @returns Mobile header element or null if hidden
 */
function MobileHeaderContent() {
  const { authenticated, logout } = useAuth();
  const { user, setUser } = useAuthStore();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const pathname = usePathname();

  // Hide mobile header when WAITLIST_MODE is enabled on home page
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';
  const isHomePage = pathname === '/';
  const shouldHide = isWaitlistMode && isHomePage;

  // Fetch user profile for hydrating profile image and reputation points
  const profileUserId = user?.id || '';
  const { data: profileData } = useGetUserProfile(profileUserId, {
    query: {
      queryKey: getGetUserProfileQueryKey(profileUserId),
      enabled: authenticated && !!user?.id,
      refetchInterval: 30000,
    },
  });

  // Fetch user balance with polling
  const { data: balanceData } = useGetUserBalance(profileUserId, {
    query: {
      queryKey: getGetUserBalanceQueryKey(profileUserId),
      enabled: authenticated && !!user?.id,
      refetchInterval: 30000,
    },
  });

  const pointsData =
    authenticated && user?.id && balanceData
      ? {
          available: Number(balanceData.balance || 0),
          total: user.reputationPoints || 0,
        }
      : null;

  // Hydrate profile image from profile data
  useEffect(() => {
    if (!authenticated || !user?.id || !profileData?.user) return;

    const profileUser = profileData.user as {
      profileImageUrl?: string;
      coverImageUrl?: string;
      reputationPoints?: number;
    };

    // Hydrate profile/cover images if missing
    if (
      !user.profileImageUrl &&
      (profileUser.profileImageUrl || profileUser.coverImageUrl)
    ) {
      setUser({
        ...user,
        profileImageUrl: profileUser.profileImageUrl ?? user.profileImageUrl,
        coverImageUrl: profileUser.coverImageUrl ?? user.coverImageUrl,
      });
    }

    // Update reputation points if changed
    if (
      profileUser.reputationPoints !== undefined &&
      profileUser.reputationPoints !== user.reputationPoints
    ) {
      setUser({
        ...user,
        reputationPoints: profileUser.reputationPoints,
      });
    }
  }, [authenticated, profileData, setUser, user]);

  const copyReferralCode = async () => {
    if (!user?.referralCode) return;

    const referralUrl = getReferralUrl(user.referralCode);
    await navigator.clipboard.writeText(referralUrl);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // Render nothing if should be hidden (after all hooks)
  if (shouldHide) {
    return null;
  }

  const menuItems = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      active: pathname === '/profile',
    },
    {
      name: 'Leaderboards',
      href: '/leaderboard',
      icon: Trophy,
      active: pathname === '/leaderboard',
    },
    {
      name: 'Rewards',
      href: '/rewards',
      icon: Gift,
      active: pathname === '/rewards',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname?.startsWith('/settings'),
    },
  ];

  return (
    <>
      <header
        className={cn(
          'md:hidden',
          'fixed top-0 right-0 left-0 z-40',
          'bg-sidebar/95'
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Profile Picture (when authenticated) */}
          <div className="w-8 shrink-0">
            {authenticated && user ? (
              <button
                onClick={() => setShowSideMenu(true)}
                className="transition-opacity hover:opacity-80"
                aria-label="Open profile menu"
              >
                <Avatar
                  id={user.id}
                  name={user.displayName || user.email || 'User'}
                  type="user"
                  size="sm"
                  src={user.profileImageUrl || undefined}
                  imageUrl={user.profileImageUrl || undefined}
                />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>

          {/* Center: Logo */}
          <div className="-translate-x-1/2 absolute left-1/2 transform">
            <Link
              href="/feed"
              className="transition-transform duration-300 hover:scale-105"
            >
              <BabylonIcon className="h-7 w-7 text-primary" />
            </Link>
          </div>

          {/* Right: Feedback Button */}
          <div className="shrink-0">
            {authenticated && (
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                className="rounded-md bg-emerald-500 px-3 py-1 font-medium text-white text-xs transition-colors hover:bg-emerald-600"
              >
                Feedback
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {showSideMenu && authenticated && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-neutral-300/70 backdrop-blur-[3px] md:hidden dark:bg-neutral-900/70"
            onClick={() => setShowSideMenu(false)}
          />

          {/* Menu Panel - slides in from left */}
          <div className="slide-in-from-left fixed top-0 bottom-0 left-0 z-50 flex w-[280px] animate-in flex-col bg-sidebar duration-300 md:hidden">
            {/* Header - User Profile */}
            <Link
              href="/profile"
              onClick={() => setShowSideMenu(false)}
              className="flex shrink-0 items-center justify-between p-4 transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar
                  id={user?.id}
                  name={user?.displayName || user?.email || 'User'}
                  type="user"
                  size="md"
                  src={user?.profileImageUrl || undefined}
                  imageUrl={user?.profileImageUrl || undefined}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-foreground text-sm">
                    {user?.displayName || user?.email || 'User'}
                  </div>
                  <div className="truncate text-muted-foreground text-xs">
                    @{user?.username || `user${user?.id.slice(0, 8)}`}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowSideMenu(false);
                }}
                className="shrink-0 p-2 transition-colors hover:bg-muted"
              >
                <X size={20} style={{ color: '#0066FF' }} />
              </button>
            </Link>

            {/* Points Display */}
            <div className="shrink-0 border-border border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-xs">Reputation</div>
                <div className="font-bold text-foreground text-sm">
                  {(user?.reputationPoints || 0).toLocaleString()}
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="text-muted-foreground text-xs">
                  Trading Balance
                </div>
                <div className="font-bold text-foreground text-sm">
                  {(pointsData?.available || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Menu Items - Scrollable */}
            <nav className="min-h-0 flex-1 overflow-y-auto pt-2.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowSideMenu(false)}
                    className={cn(
                      'relative flex items-center gap-4 px-4 py-2.5 transition-colors',
                      item.active
                        ? 'bg-[#0066FF] font-bold text-primary-foreground'
                        : 'font-semibold text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-base">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Section - Referral & Logout */}
            <div className="shrink-0 border-border border-t bg-sidebar pb-16">
              {/* Referral Code Button */}
              {user?.referralCode && (
                <button
                  onClick={copyReferralCode}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left font-semibold transition-colors hover:bg-sidebar-accent"
                >
                  {copiedReferral ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <div className="min-w-0 flex-1">
                        <div className="text-base text-green-500">
                          Referral Link Copied!
                        </div>
                        <div className="truncate font-mono text-muted-foreground text-xs">
                          {getDisplayReferralUrl(user.referralCode)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" style={{ color: '#0066FF' }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-base text-foreground">
                          Copy Referral Link
                        </div>
                        <div className="truncate font-mono text-muted-foreground text-xs">
                          {getDisplayReferralUrl(user.referralCode)}
                        </div>
                      </div>
                    </>
                  )}
                </button>
              )}

              {/* Separator */}
              {user?.referralCode && <div className="border-border border-t" />}

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowSideMenu(false);
                  logout();
                }}
                className="flex w-full items-center gap-4 px-4 py-3 text-left font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-base">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Feedback Modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
}

/**
 * Mobile header component for mobile devices.
 *
 * Provides a fixed header with logo, profile menu trigger, and slide-out
 * side menu. Automatically hides when WAITLIST_MODE is enabled on home page.
 *
 * @returns Mobile header element or null if hidden
 */
export function MobileHeader() {
  return <MobileHeaderContent />;
}
