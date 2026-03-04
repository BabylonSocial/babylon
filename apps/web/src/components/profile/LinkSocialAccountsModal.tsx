'use client';

import { disconnectTwitter } from '@babylon/api-hooks';
import { cn, signInWithFarcaster } from '@babylon/shared';
import { Check, ExternalLink, Shield, X as XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAuthToken } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

/**
 * Link social accounts modal component for connecting social accounts.
 *
 * Provides a modal interface for linking Twitter and Farcaster accounts
 * via OAuth. Handles OAuth callbacks and updates user profile with linked
 * account information. Awards reputation points for linking accounts.
 *
 * Features:
 * - Twitter OAuth linking
 * - Farcaster OAuth linking
 * - OAuth callback handling
 * - Points/reputation awards
 * - Loading states
 * - Error handling
 * - Body scroll lock and escape key handling
 *
 * @param props - LinkSocialAccountsModal component props
 * @returns Link social accounts modal element or null if not open
 *
 * @example
 * ```tsx
 * <LinkSocialAccountsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 * />
 * ```
 */
interface LinkSocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LinkSocialAccountsModal({
  isOpen,
  onClose,
}: LinkSocialAccountsModalProps) {
  const { user, setUser } = useAuthStore();
  const [linking, setLinking] = useState<string | null>(null);
  const [confirmUnlinkTwitter, setConfirmUnlinkTwitter] = useState(false);
  const [unlinkingTwitter, setUnlinkingTwitter] = useState(false);

  useEffect(() => {
    if (isOpen) return;
    setLinking(null);
    setConfirmUnlinkTwitter(false);
    setUnlinkingTwitter(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTwitterOAuth = async () => {
    if (!user?.id) return;

    setLinking('twitter');

    // Redirect to OAuth initiation endpoint
    const initiateUrl = `/api/auth/twitter/initiate`;

    // Store current URL to return to
    sessionStorage.setItem('oauth_return_url', window.location.pathname);

    window.location.href = initiateUrl;
  };

  const handleTwitterDisconnect = async () => {
    if (!user?.id) return;

    setUnlinkingTwitter(true);
    try {
      const data = (await disconnectTwitter()) as unknown as {
        success?: boolean;
        error?: string;
      };

      if (!data?.success) {
        toast.error(data?.error || 'Failed to unlink X account');
        return;
      }

      setUser({
        ...user,
        hasTwitter: false,
        twitterUsername: undefined,
      });
      setConfirmUnlinkTwitter(false);
      toast.success('X account unlinked');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setUnlinkingTwitter(false);
    }
  };

  const handleFarcasterAuth = async () => {
    if (!user?.id) return;

    setLinking('farcaster');

    // Use the proper SIWF protocol via relay.farcaster.xyz
    const result = await signInWithFarcaster({
      userId: user.id,
    });

    // Send authentication data to backend for verification and linking
    const token = getAuthToken();
    const response = await fetch('/api/auth/farcaster/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: result.message,
        signature: result.signature,
        fid: result.fid,
        username: result.username,
        displayName: result.displayName,
        pfpUrl: result.pfpUrl,
        state: result.state,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setUser({
        ...user,
        hasFarcaster: true,
        farcasterUsername: result.username,
        reputationPoints: data.newTotal || user.reputationPoints,
      });

      // Dispatch event to notify other components (like UserMenu) to refresh
      window.dispatchEvent(new CustomEvent('rewards-updated'));

      if (data.pointsAwarded > 0) {
        toast.success(
          `Farcaster linked! +${data.pointsAwarded} points awarded`
        );
      } else {
        toast.success('Farcaster account linked successfully!');
      }

      onClose();
    } else {
      const errorMessage = data.error || 'Failed to link Farcaster account';
      if (response.status === 409) {
        toast.error(
          errorMessage.includes('already linked')
            ? errorMessage
            : 'This Farcaster account is already linked to another user'
        );
      } else {
        toast.error(errorMessage);
      }
    }
    setLinking(null);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col bg-background md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[480px] md:max-w-md md:rounded-xl md:border md:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-border border-b p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">Link Social Accounts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          {/* Twitter/X */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <h3 className="font-semibold">X</h3>
              {user?.hasTwitter && (
                <span className="ml-auto flex items-center gap-1 text-green-500 text-sm">
                  <Check className="h-4 w-4" />
                  Verified
                </span>
              )}
            </div>

            {user?.hasTwitter ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">
                    {user.twitterUsername
                      ? `@${user.twitterUsername}`
                      : 'Connected'}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    {user.twitterUsername && (
                      <a
                        href={`https://x.com/${user.twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                        title="Open X profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmUnlinkTwitter((v) => !v)}
                      className="rounded px-2 py-1 font-medium text-red-600 text-xs hover:bg-red-500/10"
                    >
                      Unlink
                    </button>
                  </div>
                </div>

                {confirmUnlinkTwitter && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-muted-foreground text-xs">
                      This disconnects your X account from Babylon. You can
                      reconnect a different X account afterwards.
                    </p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmUnlinkTwitter(false)}
                        disabled={unlinkingTwitter}
                        className="rounded px-3 py-1.5 font-medium text-xs hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTwitterDisconnect()}
                        disabled={unlinkingTwitter}
                        className={cn(
                          'rounded px-3 py-1.5 font-semibold text-xs',
                          'bg-red-600 text-white hover:bg-red-600/90',
                          'disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      >
                        {unlinkingTwitter ? 'Unlinking...' : 'Confirm unlink'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-muted-foreground text-xs">
                    You&apos;ll be redirected to X to authorize access.
                    We&apos;ll verify your account ownership.
                  </p>
                </div>
                <button
                  onClick={handleTwitterOAuth}
                  disabled={linking === 'twitter'}
                  className={cn(
                    'w-full rounded-lg px-4 py-2 font-semibold transition-colors',
                    'bg-[#0066FF] text-primary-foreground hover:bg-[#2952d9]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {linking === 'twitter' ? (
                    <>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>Connect with X</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Farcaster */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                viewBox="0 0 1000 1000"
                fill="currentColor"
              >
                <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
                <path d="M128.889 253.333L157.778 351.111H182.222V844.444H128.889V253.333Z" />
                <path d="M871.111 253.333L842.222 351.111H817.778V844.444H871.111V253.333Z" />
              </svg>
              <h3 className="font-semibold">Farcaster</h3>
              {user?.hasFarcaster && (
                <span className="ml-auto flex items-center gap-1 text-green-500 text-sm">
                  <Check className="h-4 w-4" />
                  Verified
                </span>
              )}
            </div>

            {user?.hasFarcaster ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">
                  @{user.farcasterUsername}
                </span>
                <a
                  href={`https://farcaster.xyz/${user.farcasterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  <p className="text-muted-foreground text-xs">
                    Sign in with Farcaster to verify your account. A popup will
                    open for authentication.
                  </p>
                </div>
                <button
                  onClick={handleFarcasterAuth}
                  disabled={linking === 'farcaster'}
                  className={cn(
                    'w-full rounded-lg px-4 py-2 font-semibold transition-colors',
                    'bg-[#8A63D2] text-white hover:bg-[#7952c4]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {linking === 'farcaster' ? (
                    <>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>Sign in with Farcaster</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground text-sm">
                OAuth authentication verifies your account ownership and earns
                you reputation points!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-border border-t p-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-muted px-4 py-3 font-semibold transition-colors hover:bg-muted/70"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
