'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ComingSoon } from '@/components/shared/ComingSoon';

interface WaitlistWrapperProps {
  children: React.ReactNode;
  waitlistMode: boolean;
}

function WaitlistWrapperContent({
  children,
  waitlistMode,
}: WaitlistWrapperProps) {
  const searchParams = useSearchParams();
  const forceComingSoon = searchParams.get('comingsoon') === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Show ComingSoon if WAITLIST_MODE is enabled in production OR ?comingsoon=true
  if ((waitlistMode && isProduction) || forceComingSoon) {
    return <ComingSoon />;
  }

  return <>{children}</>;
}

export function WaitlistWrapper({
  children,
  waitlistMode,
}: WaitlistWrapperProps) {
  return (
    <Suspense fallback={null}>
      <WaitlistWrapperContent waitlistMode={waitlistMode}>
        {children}
      </WaitlistWrapperContent>
    </Suspense>
  );
}
