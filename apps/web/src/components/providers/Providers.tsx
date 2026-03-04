'use client';

import { logger, privyConfig } from '@babylon/shared';
import { type PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { PostHogErrorBoundary } from '@/components/analytics/PostHogErrorBoundary';
import { PostHogIdentifier } from '@/components/analytics/PostHogIdentifier';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { WidgetRefreshProvider } from '@/contexts/WidgetRefreshContext';
import { SessionHeartbeatProvider } from '@/hooks/useSessionHeartbeat';
import { useWalletBalanceQueryClientBridge } from '@/stores/walletBalanceStore';
import { DiscordActivityProvider } from './DiscordActivityProvider';
import { FarcasterMiniAppProvider } from './FarcasterMiniAppProvider';
import { GameGuideProvider } from './GameGuideProvider';
import { GamePlaybackManager } from './GamePlaybackManager';
import { OnboardingProvider } from './OnboardingProvider';
import { PostHogProvider } from './PostHogProvider';
import { ReferralCaptureProvider } from './ReferralCaptureProvider';
import { SolanaMobileProvider } from './SolanaMobileProvider';
import { TelegramMiniAppProvider } from './TelegramMiniAppProvider';

/**
 * Wrapper component to fix clip-path DOM property issue in Privy.
 *
 * Fixes the React 19 warning about invalid DOM property 'clip-path'.
 * Privy uses 'clip-path' in inline styles, which React 19 rejects.
 * This wrapper converts 'clip-path' to 'clipPath' (camelCase) after render.
 *
 * @param props - PrivyProvider component props
 * @returns PrivyProvider wrapped in fix container
 */
function PrivyProviderWrapper({
  children,
  appId,
  ...props
}: React.ComponentProps<typeof PrivyProvider>) {
  // Only check if appId is provided - let Privy validate the format
  // This allows tests to work while still preventing crashes from empty appId
  if (!appId || appId.trim() === '') {
    return <>{children}</>;
  }

  // Filter out props that shouldn't be passed to PrivyProvider
  // These might be passed from parent components but aren't valid PrivyProvider props
  // and can cause React warnings when forwarded to DOM elements
  // Type-safe filtering: exclude invalid props and ensure only valid PrivyProvider props are passed
  const privyProps = { ...props } as Omit<
    React.ComponentProps<typeof PrivyProvider>,
    'appId' | 'children'
  >;

  // Remove any invalid props that might have been passed
  // Check for common invalid props that React might forward to DOM
  if ('isActive' in privyProps) {
    logger.warn(
      'Invalid prop "isActive" passed to PrivyProviderWrapper - this prop is not supported by PrivyProvider',
      undefined,
      'PrivyProviderWrapper'
    );
    delete (privyProps as Record<string, unknown>).isActive;
  }

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fix clip-path properties in Privy's rendered DOM after render
    // This converts 'clip-path' to 'clipPath' in inline styles
    const fixClipPath = () => {
      if (!containerRef.current) return;

      const allElements = containerRef.current.querySelectorAll('*');
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;

        // Check inline style attribute
        const styleAttr = htmlElement.getAttribute('style');
        if (styleAttr && styleAttr.includes('clip-path')) {
          // Extract clip-path value
          const clipPathMatch = styleAttr.match(/clip-path\s*:\s*([^;]+)/);
          if (clipPathMatch && clipPathMatch[1]) {
            const clipPathValue = clipPathMatch[1].trim();

            // Set clipPath using the style object (camelCase)
            // Type assertion needed because CSSStyleDeclaration doesn't include clipPath in TypeScript's DOM types
            (
              htmlElement.style as CSSStyleDeclaration & { clipPath?: string }
            ).clipPath = clipPathValue;

            // Remove clip-path from the style attribute
            const cleanedStyle = styleAttr
              .replace(/clip-path\s*:\s*[^;]+;?/g, '')
              .trim()
              .replace(/;\s*;/g, ';')
              .replace(/^;|;$/g, '');

            if (cleanedStyle) {
              htmlElement.setAttribute('style', cleanedStyle);
            } else {
              htmlElement.removeAttribute('style');
            }
          }
        }

        // Also check computed style object directly (in case Privy sets it via style object)
        const computedStyle = htmlElement.style as CSSStyleDeclaration &
          Record<string, string | undefined>;
        if (
          computedStyle &&
          'clip-path' in computedStyle &&
          !computedStyle.clipPath
        ) {
          const clipPathValue = (
            computedStyle as Record<string, string | undefined>
          )['clip-path'];
          if (clipPathValue) {
            computedStyle.clipPath = clipPathValue;
            delete (computedStyle as Record<string, string | undefined>)[
              'clip-path'
            ];
          }
        }
      });
    };

    // Run after Privy has rendered - use requestAnimationFrame for better timing
    const runFix = () => {
      requestAnimationFrame(() => {
        fixClipPath();
        // Also run after a short delay to catch late-rendered elements
        setTimeout(fixClipPath, 50);
      });
    };

    const timeoutId = setTimeout(runFix, 100);

    // Watch for dynamically added elements
    const observer = new MutationObserver(() => {
      requestAnimationFrame(fixClipPath);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  // Wrap children in Fragment to ensure proper key handling
  // Ensure appId is trimmed and valid before passing to PrivyProvider
  const trimmedAppId = appId.trim();

  return (
    <div ref={containerRef}>
      <PrivyProvider appId={trimmedAppId} {...privyProps}>
        {children}
      </PrivyProvider>
    </div>
  );
}

/**
 * Syncs the app's resolved theme (from next-themes) to Privy's appearance config.
 * Must be rendered inside ThemeProvider so useTheme() has access to the context.
 */
function ThemedPrivyProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  const config = {
    ...privyConfig.config,
    appearance: {
      ...privyConfig.config.appearance,
      theme: resolvedTheme === 'light' ? 'light' : 'dark',
    },
  } as PrivyClientConfig;

  return (
    <PrivyProviderWrapper appId={privyConfig.appId} config={config}>
      {children}
    </PrivyProviderWrapper>
  );
}

/**
 * Root providers component wrapping the application with all necessary providers.
 *
 * Provides all application-level context providers including:
 * - Privy authentication
 * - Smart wallets
 * - React Query
 * - Theme
 * - Font size
 * - Widget refresh
 * - Farcaster Mini App
 * - Onboarding
 * - PostHog analytics
 * - Referral capture
 *
 * Handles client-side mounting and provider initialization.
 *
 * @param props - Providers component props
 * @returns Providers wrapper element
 */
function QueryClientBridge() {
  useWalletBalanceQueryClientBridge();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Check if Privy is configured (for build-time safety)
  const hasPrivyConfig = privyConfig.appId && privyConfig.appId !== '';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render without Privy if not configured (for build-time)
  if (!hasPrivyConfig) {
    // Log warning for debugging (will show in browser console and in CI test logs)
    if (mounted && typeof window !== 'undefined') {
      logger.warn(
        'Privy not configured: NEXT_PUBLIC_PRIVY_APP_ID was not set at build time. ' +
          'Authentication features will be disabled.',
        undefined,
        'Providers'
      );
    }

    return (
      <div suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <FontSizeProvider>
            <QueryClientProvider client={queryClient}>
              <GamePlaybackManager />
              <QueryClientBridge />
              <WidgetRefreshProvider>
                {mounted ? (
                  <Fragment>
                    {/* Debug banner - shows when Privy is not configured (visible in all environments for E2E test detection) */}
                    <div
                      data-testid="privy-not-configured-warning"
                      className="fixed top-0 right-0 left-0 z-[9999] bg-yellow-500 py-1 text-center font-medium text-black text-sm"
                    >
                      ⚠️ Privy authentication not configured -
                      NEXT_PUBLIC_PRIVY_APP_ID missing at build time
                    </div>
                    {children}
                  </Fragment>
                ) : (
                  <div className="min-h-screen bg-sidebar" />
                )}
              </WidgetRefreshProvider>
            </QueryClientProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <PostHogErrorBoundary>
        <Suspense fallback={null}>
          <PostHogProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange={false}
            >
              <FontSizeProvider>
                <QueryClientProvider client={queryClient}>
                  <GamePlaybackManager />
                  <QueryClientBridge />
                  <ThemedPrivyProvider>
                    <FarcasterMiniAppProvider>
                      <TelegramMiniAppProvider>
                        <DiscordActivityProvider>
                          {/* Solana MWA registration (side-effect only, no UI) */}
                          <SolanaMobileProvider />
                          {/* PostHog user identification */}
                          <PostHogIdentifier />
                          {/* Capture referral code from URL if present */}
                          <Suspense fallback={null}>
                            <ReferralCaptureProvider />
                          </Suspense>
                          {/* Onboarding provider for username setup */}
                          <OnboardingProvider>
                            {/* Session heartbeat for engagement metrics */}
                            <SessionHeartbeatProvider>
                              {/* Game guide provider for first-time tutorial */}
                              <GameGuideProvider>
                                <WidgetRefreshProvider>
                                  {mounted ? (
                                    <Fragment>{children}</Fragment>
                                  ) : (
                                    <div className="min-h-screen bg-sidebar" />
                                  )}
                                </WidgetRefreshProvider>
                              </GameGuideProvider>
                            </SessionHeartbeatProvider>
                          </OnboardingProvider>
                        </DiscordActivityProvider>
                      </TelegramMiniAppProvider>
                    </FarcasterMiniAppProvider>
                  </ThemedPrivyProvider>
                </QueryClientProvider>
              </FontSizeProvider>
            </ThemeProvider>
          </PostHogProvider>
        </Suspense>
      </PostHogErrorBoundary>
    </div>
  );
}
