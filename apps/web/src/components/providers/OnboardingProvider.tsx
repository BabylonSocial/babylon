'use client';

import type { OnboardingProfilePayload } from '@babylon/shared';
import { logger, POINTS } from '@babylon/shared';
import { useIdentityToken, usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ImportedProfileData,
  OnboardingModal,
} from '@/components/onboarding/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { useSignupTracking } from '@/hooks/usePostHog';
import { isWaitlistHomePage } from '@/lib/host-routing';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/utils/api-fetch';

import { clearReferralCode, getReferralCode } from './ReferralCaptureProvider';

/**
 * Onboarding stage type for multi-step onboarding flow.
 */
type OnboardingStage = 'PROFILE' | 'COMPLETED';

/**
 * Onboarding provider component for managing user onboarding flow.
 *
 * Manages the complete onboarding process including profile creation and social
 * account linking. Handles full-screen onboarding display, form submission,
 * error handling, and progress tracking.
 * Integrates with Privy authentication and smart wallet registration.
 *
 * Features:
 * - Multi-stage onboarding (PROFILE, COMPLETED)
 * - Full-screen blocking onboarding (user cannot access app until complete)
 * - Profile creation form (simplified: username + picture + terms)
 * - Social account import (Farcaster, Twitter) - skips PROFILE stage
 * - Referral code handling
 * - Error handling and retry logic
 *
 * Flow:
 * - Wallet users: PROFILE → COMPLETED
 * - Social (Farcaster/Twitter) users: COMPLETED (profile auto-imported)
 *
 * @param props - OnboardingProvider component props
 * @returns Onboarding provider element
 */
export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, user, needsOnboarding, loadingProfile, logout } =
    useAuth();

  const { user: privyUser } = usePrivy();

  // Detect if user authenticated via social login (Farcaster or Twitter)
  // These users skip the PROFILE stage - their data is auto-imported
  const isSocialLogin = useMemo(() => {
    if (!privyUser) return false;
    const userWithSocial = privyUser as typeof privyUser & {
      farcaster?: { username?: string };
      twitter?: { username?: string };
    };
    return !!(
      userWithSocial.farcaster?.username || userWithSocial.twitter?.username
    );
  }, [privyUser]);

  const { setUser, setNeedsOnboarding } = useAuthStore();
  const { identityToken } = useIdentityToken();
  const { trackSignupStarted, trackSignupCompleted, trackOnboardingStep } =
    useSignupTracking();

  const [stage, setStage] = useState<OnboardingStage>('PROFILE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_submittedProfile, setSubmittedProfile] =
    useState<OnboardingProfilePayload | null>(null);
  const [importedProfileData, setImportedProfileData] =
    useState<ImportedProfileData | null>(null);
  const [_hasProgressedPastSocialImport, setHasProgressedPastSocialImport] =
    useState(false);
  // Track if social user auto-submit is currently in-flight (prevents StrictMode double-invoke)
  const socialAutoSubmitRef = useRef(false);
  // Persistent flag to prevent repeated auto-submit attempts after failure
  // (only reset on explicit logout/cleanup, NOT on failure)
  const [socialAutoSubmitAttempted, setSocialAutoSubmitAttempted] =
    useState(false);

  // Delay onboarding display to prevent flickering
  const [isReadyToShow, setIsReadyToShow] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Wait for app to stabilize before showing onboarding
  useEffect(() => {
    if (!authenticated || loadingProfile) {
      setIsReadyToShow(false);
      setHasInitialized(false);
      return;
    }

    // If already initialized and conditions change, show immediately
    if (hasInitialized) {
      setIsReadyToShow(true);
      return;
    }

    // First time: wait 1 second for app to load (shorter delay for blocking UI)
    const delay = 1000; // Fixed 1 second delay for consistent UX
    const timer = setTimeout(() => {
      setIsReadyToShow(true);
      setHasInitialized(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [authenticated, loadingProfile, hasInitialized]);

  // If needsOnboarding is manually set to true, show onboarding immediately
  useEffect(() => {
    if (needsOnboarding && authenticated && !loadingProfile) {
      setIsReadyToShow(true);
      setHasInitialized(true);
    }
  }, [needsOnboarding, authenticated, loadingProfile]);

  /**
   * Determines if onboarding should be shown (full-screen blocking).
   * Unlike before, this is NOT dismissible - users must complete onboarding.
   */
  const shouldShowOnboarding = useMemo(() => {
    // Check if dev mode is enabled via URL parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDevMode = params.get('dev') === 'true';
      const isWaitlistFlow = params.get('waitlist') === 'true';
      const isWaitlistHome = isWaitlistHomePage(
        window.location.hostname,
        window.location.pathname
      );

      // Hide onboarding on waitlist home pages unless ?dev=true
      // BUT allow it if user is in waitlist flow (coming from waitlist signup)
      if (isWaitlistHome && !isDevMode && !isWaitlistFlow) {
        return false;
      }
    }

    // Don't show until ready (prevents flickering)
    if (!isReadyToShow) {
      return false;
    }

    if (!authenticated || loadingProfile) {
      return false;
    }

    // Don't show onboarding if user has completed their profile
    // On-chain registration is opt-in and not required for onboarding
    if (user?.profileComplete) {
      return false;
    }

    // Show briefly after completion to display success message
    if (stage === 'COMPLETED') {
      return true;
    }

    return Boolean(needsOnboarding);
  }, [
    isReadyToShow,
    authenticated,
    loadingProfile,
    needsOnboarding,
    stage,
    user,
  ]);

  const handleProfileSubmit = useCallback(
    async (payload: OnboardingProfilePayload) => {
      setIsSubmitting(true);
      setError(null);
      trackSignupStarted();

      const referralCode = getReferralCode();

      logger.info(
        'Identity token state during signup',
        {
          present: Boolean(identityToken),
          tokenPreview: identityToken
            ? `${identityToken.slice(0, 12)}...`
            : null,
        },
        'OnboardingProvider'
      );

      try {
        const response = await apiFetch('/api/users/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            referralCode: referralCode ?? undefined,
            identityToken: identityToken ?? undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          const message =
            data?.error ||
            `Failed to complete signup (status ${response.status})`;
          setIsSubmitting(false);
          throw new Error(message);
        }

        if (data.user) {
          setUser({
            id: data.user.id,
            walletAddress: data.user.walletAddress ?? undefined,
            displayName: data.user.displayName ?? payload.displayName,
            email: user?.email,
            username: data.user.username ?? payload.username,
            bio: data.user.bio ?? payload.bio,
            profileImageUrl:
              data.user.profileImageUrl ?? payload.profileImageUrl ?? undefined,
            coverImageUrl:
              data.user.coverImageUrl ?? payload.coverImageUrl ?? undefined,
            profileComplete: data.user.profileComplete ?? true,
            reputationPoints:
              data.user.reputationPoints ?? user?.reputationPoints,
            hasFarcaster: data.user.hasFarcaster ?? user?.hasFarcaster,
            hasTwitter: data.user.hasTwitter ?? user?.hasTwitter,
            farcasterUsername:
              data.user.farcasterUsername ?? user?.farcasterUsername,
            twitterUsername: data.user.twitterUsername ?? user?.twitterUsername,
            nftTokenId: data.user.nftTokenId ?? undefined,
            createdAt: data.user.createdAt ?? user?.createdAt,
            onChainRegistered:
              data.user.onChainRegistered ?? user?.onChainRegistered,
          });
        }
        setNeedsOnboarding(false);

        clearReferralCode();
        setSubmittedProfile(payload);
        trackOnboardingStep('profile', true);
        trackSignupCompleted(data.user?.id ?? '', {
          hasReferrer: Boolean(referralCode),
          hasFarcaster: data.user?.hasFarcaster ?? false,
          hasTwitter: data.user?.hasTwitter ?? false,
        });
        setStage('COMPLETED');
        setIsSubmitting(false);
      } catch (err) {
        setIsSubmitting(false);
        // Re-throw to let caller handle the error
        throw err;
      }
    },
    [
      user,
      setUser,
      setNeedsOnboarding,
      identityToken,
      trackSignupStarted,
      trackSignupCompleted,
      trackOnboardingStep,
    ]
  );

  useEffect(() => {
    if (!authenticated) {
      setStage('PROFILE');
      setSubmittedProfile(null);
      setError(null);
      setImportedProfileData(null);
      setHasProgressedPastSocialImport(false);
      socialAutoSubmitRef.current = false;
      setSocialAutoSubmitAttempted(false);
      return;
    }

    if (loadingProfile) {
      return;
    }

    if (needsOnboarding) {
      // For social login users (Farcaster/Twitter), skip PROFILE and auto-submit
      // Check both: socialAutoSubmitRef (in-flight) and socialAutoSubmitAttempted (persistent)
      if (
        isSocialLogin &&
        importedProfileData &&
        !socialAutoSubmitRef.current &&
        !socialAutoSubmitAttempted
      ) {
        // Mark as attempted BEFORE submission to prevent retries on failure
        setSocialAutoSubmitAttempted(true);
        // Mark as in-flight to prevent StrictMode double-invoke
        socialAutoSubmitRef.current = true;
        logger.info(
          'Social login user - auto-submitting profile',
          {
            platform: importedProfileData.platform,
            username: importedProfileData.username,
          },
          'OnboardingProvider'
        );
        const autoProfile: OnboardingProfilePayload = {
          username: importedProfileData.username,
          displayName: importedProfileData.displayName,
          bio: '', // Empty bio by default
          profileImageUrl: importedProfileData.profileImageUrl ?? undefined,
          coverImageUrl: undefined, // Auto-populated by backend
          importedFrom: importedProfileData.platform,
          twitterId: importedProfileData.twitterId ?? null,
          twitterUsername:
            importedProfileData.platform === 'twitter'
              ? importedProfileData.username
              : null,
          farcasterFid: importedProfileData.farcasterFid ?? null,
          farcasterUsername:
            importedProfileData.platform === 'farcaster'
              ? importedProfileData.username
              : null,
          tosAccepted: true, // Social login implies acceptance
          privacyPolicyAccepted: true,
        };
        handleProfileSubmit(autoProfile).catch((submitError: Error) => {
          logger.error(
            'Social login auto-submit failed',
            {
              error: submitError.message,
              platform: importedProfileData.platform,
            },
            'OnboardingProvider'
          );
          setError(submitError.message);
          socialAutoSubmitRef.current = false;
          setStage('PROFILE');
        });
        return;
      }
      // Non-social users: start at profile setup
      setStage('PROFILE');
      return;
    }

    // User has completed onboarding - don't reset stage or show onboarding
    // The handleProfileSubmit dependency is intentional - the socialAutoSubmitAttempted
    // and socialAutoSubmitRef guards prevent infinite loops and repeated retries.
  }, [
    authenticated,
    loadingProfile,
    needsOnboarding,
    isSocialLogin,
    importedProfileData,
    handleProfileSubmit,
    socialAutoSubmitAttempted,
  ]);

  // Automatically extract social profile data from Privy user when authenticating
  useEffect(() => {
    if (!authenticated || !privyUser || !needsOnboarding) return;
    if (importedProfileData) return; // Already have imported data
    if (loadingProfile) return; // Wait for profile to load

    const userWithFarcaster = privyUser as typeof privyUser & {
      farcaster?: {
        username?: string;
        displayName?: string;
        bio?: string;
        pfp?: string;
        pfpUrl?: string;
        fid?: number;
        url?: string;
        ownerAddress?: string;
        verifications?: string[];
      };
    };
    const userWithTwitter = privyUser as typeof privyUser & {
      twitter?: {
        username?: string;
        name?: string;
        profilePictureUrl?: string;
        subject?: string; // Twitter user ID
      };
    };

    // Check if user authenticated with Farcaster
    if (userWithFarcaster.farcaster) {
      const fc = userWithFarcaster.farcaster;

      // Use pfpUrl or pfp, whichever is available
      const profileImage = fc.pfpUrl || fc.pfp || null;

      const profileData: ImportedProfileData = {
        platform: 'farcaster',
        username:
          fc.username ||
          fc.displayName?.toLowerCase().replace(/\s+/g, '_') ||
          'farcaster_user',
        displayName: fc.displayName || fc.username || 'Farcaster User',
        bio: fc.bio || undefined,
        profileImageUrl: profileImage,
        farcasterFid: fc.fid?.toString(),
      };

      logger.info(
        'Auto-imported Farcaster profile from Privy - will award points on signup',
        {
          username: profileData.username,
          displayName: profileData.displayName,
          fid: fc.fid,
          hasBio: !!profileData.bio,
          hasProfileImage: !!profileImage,
          rewardEligible: true,
          expectedPoints: POINTS.FARCASTER_LINK,
        },
        'OnboardingProvider'
      );

      setImportedProfileData(profileData);
      setHasProgressedPastSocialImport(true);
      return;
    }

    // Check if user authenticated with Twitter
    if (userWithTwitter.twitter) {
      const tw = userWithTwitter.twitter;

      // Upgrade Twitter profile image to higher resolution if available
      let profileImageUrl = tw.profilePictureUrl;
      if (profileImageUrl && profileImageUrl.includes('_normal')) {
        profileImageUrl = profileImageUrl.replace('_normal', '_400x400');
      }

      const profileData: ImportedProfileData = {
        platform: 'twitter',
        username: tw.username || 'twitter_user',
        displayName: tw.name || tw.username || 'Twitter User',
        bio: undefined, // Twitter bio not directly available from Privy, would need separate API call
        profileImageUrl: profileImageUrl || null,
        twitterId: tw.subject || tw.username, // Use subject (Twitter user ID) if available
      };

      logger.info(
        'Auto-imported Twitter profile from Privy - will award points on signup',
        {
          username: profileData.username,
          displayName: profileData.displayName,
          twitterId: profileData.twitterId,
          hasProfileImage: !!profileImageUrl,
          rewardEligible: true,
          expectedPoints: POINTS.TWITTER_LINK,
        },
        'OnboardingProvider'
      );

      setImportedProfileData(profileData);
      setHasProgressedPastSocialImport(true);
      return;
    }

    // For wallet-only logins, don't set imported data - let the generated profile flow handle it
    logger.info(
      'User authenticated with wallet only - will use generated profile',
      { userId: privyUser.id },
      'OnboardingProvider'
    );
  }, [
    authenticated,
    privyUser,
    needsOnboarding,
    importedProfileData,
    loadingProfile,
  ]);

  // Listen for social import callbacks from URL parameters (for manual social linking)
  useEffect(() => {
    if (typeof window === 'undefined' || !authenticated) return;

    const params = new URLSearchParams(window.location.search);
    const socialImport = params.get('social_import');
    const dataParam = params.get('data');

    if (socialImport && dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam)) as unknown;

        // Validate the imported data structure
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('platform' in parsed) ||
          !('username' in parsed) ||
          !('displayName' in parsed) ||
          (parsed.platform !== 'twitter' && parsed.platform !== 'farcaster') ||
          typeof parsed.username !== 'string' ||
          typeof parsed.displayName !== 'string'
        ) {
          logger.warn(
            'Invalid social profile data structure from URL',
            { socialImport },
            'OnboardingProvider'
          );
          return;
        }

        const profileData = parsed as ImportedProfileData;
        logger.info(
          'Social profile data received from URL',
          { platform: socialImport },
          'OnboardingProvider'
        );

        setImportedProfileData(profileData);
        setHasProgressedPastSocialImport(true);
        setStage('PROFILE');
      } catch (parseError) {
        logger.warn(
          'Failed to parse social profile data from URL',
          { error: parseError },
          'OnboardingProvider'
        );
        // Clean up malformed URL params and continue without imported data
      }

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('social_import');
      newUrl.searchParams.delete('data');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [authenticated]);

  // Handler for completion - closes the onboarding screen
  const handleComplete = useCallback(() => {
    logger.info(
      'User completed onboarding',
      {
        stage,
        userId: user?.id,
        onChainRegistered: user?.onChainRegistered,
      },
      'OnboardingProvider'
    );
    // Reset stage to allow re-entry if needed (defensive)
    setStage('PROFILE');
  }, [stage, user]);

  // Full-screen blocking onboarding - user cannot access app until complete
  if (shouldShowOnboarding) {
    return (
      <OnboardingModal
        isOpen
        stage={stage}
        isSubmitting={isSubmitting}
        error={error}
        onSubmitProfile={handleProfileSubmit}
        onComplete={handleComplete}
        onLogout={logout}
        user={user}
        importedData={importedProfileData}
      />
    );
  }

  // User has completed onboarding - render children (the app)
  return <>{children}</>;
}
