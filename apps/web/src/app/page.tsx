'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ComingSoon } from '@/components/shared/ComingSoon';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useLoginModal } from '@/hooks/useLoginModal';

const waitlistModeEnabled = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

function HomePageContent() {
  const router = useRouter();
  const { authenticated } = useAuth();
  const { showLoginModal } = useLoginModal();
  const searchParams = useSearchParams();
  const [shouldShowApp, setShouldShowApp] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Enforce waitlist mode via environment flag instead of relying on URL
    if (waitlistModeEnabled) {
      setShouldShowApp(false);
      setIsChecking(false);
      return;
    }

    // Check if force coming soon mode is enabled via URL parameter (?comingsoon=true)
    const forceComingSoon = searchParams.get('comingsoon') === 'true';

    // If force coming soon is enabled, show coming soon page
    if (forceComingSoon) {
      setShouldShowApp(false);
      setIsChecking(false);
      return;
    }

    // Check if we're on localhost
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '');

    // Check if dev mode is enabled via URL parameter (?dev=true)
    const isDevMode = searchParams.get('dev') === 'true';

    // Check if we're on production (babylon.market)
    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname === 'babylon.market';

    // Show app if on localhost OR (on production with ?dev=true)
    const showApp =
      isLocalhost ||
      (isProduction && isDevMode) ||
      (!isProduction && !isLocalhost);
    setShouldShowApp(showApp);
    setIsChecking(false);

    // Only proceed with normal home page logic if we should show the app
    if (showApp) {
      // Show login modal if not authenticated
      if (!authenticated) {
        showLoginModal({
          title: 'Welcome to Babylon',
          message:
            'Log in to start trading prediction markets, replying to NPCs, and earning rewards in this satirical game.',
        });
      }

      // Redirect to feed, preserving referral code if present
      const ref = searchParams.get('ref');
      const feedUrl = ref ? `/feed?ref=${ref}` : '/feed';
      router.push(feedUrl);
    }
  }, [authenticated, router, showLoginModal, searchParams]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  // Show coming soon if not in dev mode
  if (!shouldShowApp) {
    return <ComingSoon />;
  }

  // Show loading while redirecting to feed
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-3">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="space-y-3">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
