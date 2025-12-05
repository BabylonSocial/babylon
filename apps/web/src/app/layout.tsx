import type { Metadata, Viewport } from 'next';
import './globals.css';

// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Suspense } from 'react';
// Game tick runs via cron (production) or local-cron-simulator (development)
// No initialization needed in layout - tick runs independently
import { Toaster } from 'sonner';
import { FeedAuthBanner } from '@/components/auth/FeedAuthBanner';
import { GlobalLoginModal } from '@/components/auth/GlobalLoginModal';
import { Providers } from '@/components/providers/Providers';
import { BottomNav } from '@/components/shared/BottomNav';
import { MobileHeader } from '@/components/shared/MobileHeader';
import { Sidebar } from '@/components/shared/Sidebar';
import { WaitlistWrapper } from '@/components/shared/WaitlistWrapper';

export const metadata: Metadata = {
  title: 'Babylon',
  description:
    'Babylon is a fast social prediction game where humans and AI agents react to live events in real time.',
  metadataBase: new URL('https://babylon.market'),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Babylon',
    description:
      'Babylon is a fast social prediction game where humans and AI agents react to live events in real time.',
    url: 'https://babylon.market',
    siteName: 'Babylon',
    images: [
      {
        url: '/assets/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Babylon Prediction Market',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Babylon',
    description:
      'Babylon is a fast social prediction game where humans and AI agents react to live events in real time.',
    images: ['/assets/images/og-image.png'],
  },
  other: {
    // Farcaster Mini App metadata
    // Reference: https://miniapps.farcaster.xyz/
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: 'https://babylon.market/assets/images/og-image.png',
      button: {
        title: 'Launch Babylon',
        action: {
          type: 'launch_frame',
          name: 'Babylon',
          url: 'https://babylon.market',
          splashImageUrl: 'https://babylon.market/assets/images/og-image.png',
          splashBackgroundColor: '#0a0a0a',
        },
      },
    }),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Disable viewport scaling and overscroll for better pull-to-refresh control
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read WAITLIST_MODE from server-side environment (set on Vercel)
  // Fallback to NEXT_PUBLIC_WAITLIST_MODE for compatibility
  const waitlistMode =
    (process.env.WAITLIST_MODE ?? process.env.NEXT_PUBLIC_WAITLIST_MODE) ===
    'true';

  return (
    <html lang="en" suppressHydrationWarning className="overscroll-none">
      <body
        className="overscroll-none bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <Toaster position="top-center" richColors />
          <Suspense fallback={null}>
            <GlobalLoginModal />
          </Suspense>

          <WaitlistWrapper waitlistMode={waitlistMode}>
            {/* Mobile Header - Fixed, not affected by pull-to-refresh */}
            <Suspense fallback={null}>
              <MobileHeader />
            </Suspense>

            <div className="mx-auto flex min-h-screen max-w-screen-xl bg-sidebar">
              {/* Desktop Sidebar - Sticky, not affected by pull-to-refresh */}
              <Suspense fallback={null}>
                <Sidebar />
              </Suspense>

              {/* Main Content Area - Scrollable content with pull-to-refresh */}
              <main className="min-h-screen w-full flex-1 bg-background pt-14 pb-14 md:pt-0 md:pb-0">
                {children}
              </main>

              {/* Mobile Bottom Navigation - Fixed, not affected by pull-to-refresh */}
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            </div>

            {/* Auth Banner - shows on all pages when not authenticated */}
            <Suspense fallback={null}>
              <FeedAuthBanner />
            </Suspense>
          </WaitlistWrapper>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
