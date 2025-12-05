'use client';

import {
  Bell,
  Bot,
  Check,
  Copy,
  Gift,
  Home,
  LogOut,
  MessageCircle,
  Shield,
  TrendingUp,
  Trophy,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserMenu } from '@/components/auth/UserMenu';
import { Avatar } from '@/components/shared/Avatar';
import { Separator } from '@/components/shared/Separator';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { getReferralUrl } from '@babylon/shared';
import { cn } from '@babylon/shared';

/**
 * Main sidebar content component with navigation and user menu.
 *
 * Provides navigation links, user authentication state, unread message
 * counts, and admin access. Handles responsive behavior and dev mode
 * visibility. Includes referral code sharing functionality.
 *
 * @returns Sidebar content element
 */
function SidebarContent() {
  const [showMdMenu, setShowMdMenu] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const mdMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { ready, authenticated, user, logout } = useAuth();
  const { totalUnread: unreadMessages } = useUnreadMessages();

  // Hide sidebar when WAITLIST_MODE is enabled in production OR ?comingsoon=true
  const forceComingSoon = searchParams.get('comingsoon') === 'true';
  const waitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldHideSidebar = (waitlistMode && isProduction) || forceComingSoon;

  // Check if user is admin from the user object
  const isAdmin = user?.isAdmin ?? false;

  // All hooks must be called before any conditional returns
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mdMenuRef.current &&
        !mdMenuRef.current.contains(event.target as Node)
      ) {
        setShowMdMenu(false);
      }
    };

    if (showMdMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showMdMenu]);

  // Poll for unread notifications
  useEffect(() => {
    if (!authenticated || !user) {
      setUnreadNotifications(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const token =
        typeof window !== 'undefined' ? window.__privyAccessToken : null;

      if (!token) {
        return;
      }

      const response = await fetch(
        '/api/notifications?unreadOnly=true&limit=1',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    };

    fetchUnreadCount();

    // Refresh every 1 minute
    const interval = setInterval(fetchUnreadCount, 60000); // 60 seconds = 1 minute
    return () => clearInterval(interval);
  }, [authenticated, user]);

  const copyReferralCode = async () => {
    if (!user?.referralCode) return;

    const referralUrl = getReferralUrl(user.referralCode);
    await navigator.clipboard.writeText(referralUrl);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // Render nothing if sidebar should be hidden (after all hooks)
  if (shouldHideSidebar) {
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      href: '/feed',
      icon: Home,
      color: '#0066FF',
      active: pathname === '/feed' || pathname === '/',
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      color: '#0066FF',
      active: pathname === '/notifications',
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
      color: '#0066FF',
      active: pathname === '/leaderboard',
    },
    {
      name: 'Markets',
      href: '/markets',
      icon: TrendingUp,
      color: '#0066FF',
      active: pathname === '/markets',
    },
    {
      name: 'Chats',
      href: '/chats',
      icon: MessageCircle,
      color: '#0066FF',
      active: pathname === '/chats',
    },
    {
      name: 'Agents',
      href: '/agents',
      icon: Bot,
      color: '#0066FF',
      active: pathname === '/agents' || pathname.startsWith('/agents/'),
    },
    {
      name: 'Rewards',
      href: '/rewards',
      icon: Gift,
      color: '#a855f7',
      active: pathname === '/rewards',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      color: '#0066FF',
      active: pathname === '/profile',
    },
    // Admin link (only shown for admins)
    ...(isAdmin
      ? [
          {
            name: 'Admin',
            href: '/admin',
            icon: Shield,
            color: '#f97316',
            active: pathname === '/admin',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Responsive sidebar: icons only on tablet (md), icons + names on desktop (lg+) */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen md:flex md:flex-col',
          'bg-sidebar',
          'transition-all duration-300',
          'md:w-20 lg:w-64'
        )}
      >
        {/* Header - Logo */}
        <div className="flex items-center justify-center p-6 lg:justify-start">
          <Link
            href="/feed"
            className="transition-transform duration-300 hover:scale-105"
          >
            {/* Icon-only logo for md (tablet) */}
            <Image
              src="/assets/logos/logo.svg"
              alt="Babylon Logo"
              width={32}
              height={32}
              className="h-8 w-8 lg:hidden"
            />
            {/* Full logo with text for lg+ (desktop) */}
            <Image
              src="/assets/logos/logo_full.svg"
              alt="Babylon"
              width={160}
              height={38}
              className="hidden h-8 w-auto lg:block"
              loading="eager"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasNotificationBadge =
              (item.name === 'Notifications' && unreadNotifications > 0) ||
              (item.name === 'Chats' && unreadMessages > 0);
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  'group relative flex items-center px-4 py-3',
                  'transition-colors duration-200',
                  'md:justify-center lg:justify-start',
                  !item.active && 'bg-transparent hover:bg-sidebar-accent'
                )}
                title={item.name}
                style={{
                  backgroundColor: item.active ? item.color : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = item.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '';
                  }
                }}
              >
                {/* Icon with notification indicator */}
                <div className="relative lg:mr-3">
                  <Icon
                    className={cn(
                      'h-6 w-6 flex-shrink-0',
                      'transition-all duration-300',
                      'group-hover:scale-110',
                      !item.active && 'text-sidebar-foreground'
                    )}
                    style={{
                      color: item.active ? '#e4e4e4' : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!item.active) {
                        e.currentTarget.style.color = '#e4e4e4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.active) {
                        e.currentTarget.style.color = '';
                      }
                    }}
                  />
                  {hasNotificationBadge && (
                    <span className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-blue-500 ring-2 ring-sidebar" />
                  )}
                </div>

                {/* Label - hidden on tablet (md), shown on desktop (lg+) */}
                <span
                  className={cn(
                    'hidden lg:block',
                    'text-lg transition-colors duration-300',
                    item.active ? 'font-semibold' : 'text-sidebar-foreground'
                  )}
                  style={{
                    color: item.active ? '#e4e4e4' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = '#e4e4e4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.color = '';
                    }
                  }}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Separator - only shown on desktop */}
        <div className="hidden px-4 py-2 lg:block">
          <Separator />
        </div>

        {/* Bottom Section - Authentication (Desktop lg+) */}
        <div className="hidden p-4 lg:block">
          {!ready ? (
            // Skeleton loader while authentication is initializing
            <div className="flex animate-pulse items-center gap-3 p-3">
              <div className="h-10 w-10 rounded-full bg-sidebar-accent/50" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-sidebar-accent/50" />
                <div className="h-3 w-16 rounded bg-sidebar-accent/30" />
              </div>
            </div>
          ) : authenticated ? (
            <UserMenu />
          ) : (
            <LoginButton />
          )}
        </div>

        {/* Bottom Section - User Icon (Tablet md) */}
        {authenticated && user && (
          <div className="relative md:block lg:hidden" ref={mdMenuRef}>
            <div className="flex justify-center p-4">
              <button
                onClick={() => setShowMdMenu(!showMdMenu)}
                className="transition-opacity hover:opacity-80"
                aria-label="Open user menu"
              >
                <Avatar
                  id={user.id}
                  name={user.displayName || user.email || 'User'}
                  type="user"
                  size="md"
                  src={user.profileImageUrl || undefined}
                  imageUrl={user.profileImageUrl || undefined}
                />
              </button>
            </div>

            {/* Dropdown Menu - Icon Only */}
            {showMdMenu && (
              <div className="-translate-x-1/2 absolute bottom-full left-1/2 z-50 mb-2 w-auto overflow-hidden rounded-lg border border-border bg-sidebar shadow-lg">
                {/* Referral Code */}
                {user.referralCode && (
                  <button
                    onClick={copyReferralCode}
                    className="flex w-full items-center justify-center p-3 transition-colors hover:bg-sidebar-accent"
                    title={copiedReferral ? 'Copied!' : 'Copy Referral Link'}
                    aria-label={
                      copiedReferral ? 'Copied!' : 'Copy Referral Link'
                    }
                  >
                    {copiedReferral ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 flex-shrink-0 text-sidebar-foreground" />
                    )}
                  </button>
                )}

                {/* Separator */}
                {user.referralCode && (
                  <div className="border-border border-t" />
                )}

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowMdMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center justify-center p-3 text-destructive transition-colors hover:bg-destructive/10"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

/**
 * Sidebar component wrapper with Suspense boundary.
 *
 * Wraps SidebarContent in a Suspense boundary to handle
 * async navigation hooks gracefully. Provides the main
 * application sidebar with navigation and user menu.
 *
 * @returns Sidebar element wrapped in Suspense
 */
export function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarContent />
    </Suspense>
  );
}
