'use client';

import { Bell, Bot, Home, MessageCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@babylon/shared';

/**
 * Bottom navigation content component for mobile devices.
 *
 * Provides mobile navigation with Feed, Markets, Chats, Agents, and Notifications tabs.
 * Shows unread message and notification badges. Automatically hides when WAITLIST_MODE
 * is enabled on home page unless dev mode is enabled via URL parameter (?dev=true).
 *
 * @returns Bottom navigation element or null if hidden
 */
function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticated, user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { totalUnread: unreadMessages } = useUnreadMessages();

  // Hide bottom nav when WAITLIST_MODE is enabled in production OR ?comingsoon=true
  const forceComingSoon = searchParams.get('comingsoon') === 'true';
  const waitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldHide = (waitlistMode && isProduction) || forceComingSoon;

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

  // If should be hidden, don't render anything
  if (shouldHide) {
    return null;
  }

  const navItems = [
    {
      name: 'Feed',
      href: '/feed',
      icon: Home,
      color: '#0066FF',
      active: pathname === '/feed' || pathname === '/',
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
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      color: '#0066FF',
      active: pathname === '/notifications',
    },
  ];

  return (
    <nav className="fixed right-0 bottom-0 bottom-nav-rounded left-0 z-50 border-border border-t bg-sidebar md:hidden">
      {/* Navigation Items */}
      <div className="safe-area-bottom flex h-14 items-center justify-between px-4">
        <div className="flex flex-1 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasNotificationBadge =
              (item.name === 'Notifications' && unreadNotifications > 0) ||
              (item.name === 'Chats' && unreadMessages > 0);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg transition-colors duration-200',
                  'hover:bg-sidebar-accent/50',
                  'relative'
                )}
                aria-label={item.name}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors duration-200',
                    item.active
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-foreground'
                  )}
                  style={{
                    color: item.active ? item.color : undefined,
                  }}
                />
                {hasNotificationBadge && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-sidebar" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * Bottom navigation component wrapper with Suspense boundary.
 *
 * Wraps BottomNavContent in a Suspense boundary to handle async navigation
 * hooks gracefully. Provides mobile navigation for the application.
 *
 * @returns Bottom navigation element wrapped in Suspense
 */
export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
