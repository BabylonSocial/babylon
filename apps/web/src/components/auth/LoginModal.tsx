'use client';

import { logger } from '@babylon/shared';
import { ArrowLeft, Fingerprint, Loader2, Mail } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useStewardAuthContext } from '@/components/providers/StewardAuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

/**
 * Steward-backed login modal.
 *
 * Single card, progressive disclosure. First paint is a clean stack of
 * provider options (OAuth, email, passkey, Farcaster). Picking email or
 * passkey swaps the card contents to that flow, keeping one heading and
 * one hierarchy. No duplicate chrome, no emoji-as-icon.
 *
 * Supports:
 * - OAuth: Google, Discord, Twitter/X (redirect to Steward authorize)
 * - Email magic link (no password)
 * - Passkey (WebAuthn)
 * - Farcaster SIWF (lazy-loaded)
 */

type View = 'picker' | 'email' | 'passkey' | 'email-sent';
type Status = 'idle' | 'loading' | 'error';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

function getStewardApiUrl(): string {
  return process.env.NEXT_PUBLIC_STEWARD_API_URL ?? 'http://localhost:3200';
}

const STEWARD_TENANT_ID =
  process.env.NEXT_PUBLIC_STEWARD_TENANT_ID ?? 'babylon';

/** Build the Steward OAuth authorize URL. Callback lands on our /auth/callback/[provider] page. */
function oauthUrl(provider: string): string {
  const stewardBase = getStewardApiUrl();
  const callbackBase =
    typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUri = `${callbackBase}/auth/callback/${provider}`;
  return (
    `${stewardBase}/auth/oauth/${provider}/authorize` +
    `?redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&tenant_id=${encodeURIComponent(STEWARD_TENANT_ID)}`
  );
}

export function LoginModal({
  isOpen,
  onClose,
  title,
  message,
}: LoginModalProps) {
  const { stewardAuth, onLoginSuccess } = useStewardAuthContext();
  const { authenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [view, setView] = useState<View>('picker');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const loading = status === 'loading';

  useEffect(() => {
    if (authenticated && isOpen) onClose();
  }, [authenticated, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setView('picker');
      setStatus('idle');
      setEmail('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const resetToPicker = useCallback(() => {
    setView('picker');
    setStatus('idle');
    setErrorMsg('');
  }, []);

  const handleEmailLogin = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const result = await stewardAuth.signInWithEmail(trimmed);
      if (result.ok) {
        setView('email-sent');
        setStatus('idle');
        logger.info('Magic link sent', { email: trimmed }, 'LoginModal');
      } else {
        setErrorMsg('Failed to send magic link. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('Email login failed', { error: msg }, 'LoginModal');
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [email, stewardAuth]);

  const handlePasskeyLogin = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMsg('Please enter your email address to use a passkey.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const result = await stewardAuth.signInWithPasskey(trimmed);
      await onLoginSuccess(result.token);
      setStatus('idle');
      logger.info('Passkey login successful', { email: trimmed }, 'LoginModal');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey login failed';
      logger.warn('Passkey login failed', { error: msg }, 'LoginModal');
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [email, stewardAuth, onLoginSuccess]);

  const handleOAuth = useCallback(
    (provider: 'google' | 'discord' | 'twitter') => {
      window.location.href = oauthUrl(provider);
    },
    []
  );

  const pickerTitle = title ?? 'Sign in to Babylon';
  const flowTitle =
    view === 'email'
      ? 'Sign in with email'
      : view === 'passkey'
        ? 'Sign in with a passkey'
        : pickerTitle;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="p-8 sm:max-w-sm">
        {view === 'email' || view === 'passkey' ? (
          <button
            type="button"
            onClick={resetToPicker}
            disabled={loading}
            className="-ml-2 -mt-2 mb-1 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:opacity-50"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        ) : null}

        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {view === 'email-sent' ? 'Check your inbox' : flowTitle}
          </DialogTitle>
          {message && view === 'picker' ? (
            <DialogDescription className="text-center">
              {message}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          {view === 'email-sent' ? (
            <EmailSent email={email} onAgain={resetToPicker} />
          ) : view === 'email' ? (
            <EmailFlow
              email={email}
              setEmail={setEmail}
              loading={loading}
              errorMsg={errorMsg}
              onSubmit={handleEmailLogin}
            />
          ) : view === 'passkey' ? (
            <PasskeyFlow
              email={email}
              setEmail={setEmail}
              loading={loading}
              errorMsg={errorMsg}
              onSubmit={handlePasskeyLogin}
            />
          ) : (
            <Picker
              loading={loading}
              onOAuth={handleOAuth}
              onEmail={() => {
                setErrorMsg('');
                setView('email');
              }}
              onPasskey={() => {
                setErrorMsg('');
                setView('passkey');
              }}
              onLoginSuccess={onLoginSuccess}
              onClose={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Picker view (default) ────────────────────────────────────────────────────

interface PickerProps {
  loading: boolean;
  onOAuth: (provider: 'google' | 'discord' | 'twitter') => void;
  onEmail: () => void;
  onPasskey: () => void;
  onLoginSuccess: (token: string) => Promise<void>;
  onClose: () => void;
}

function Picker({
  loading,
  onOAuth,
  onEmail,
  onPasskey,
  onLoginSuccess,
  onClose,
}: PickerProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <ProviderButton
          icon={<GoogleIcon />}
          label="Continue with Google"
          onClick={() => onOAuth('google')}
          disabled={loading}
        />
        <ProviderButton
          icon={<DiscordIcon />}
          label="Continue with Discord"
          onClick={() => onOAuth('discord')}
          disabled={loading}
        />
        <ProviderButton
          icon={<XIcon />}
          label="Continue with X"
          onClick={() => onOAuth('twitter')}
          disabled={loading}
        />
        <ProviderButton
          icon={<Mail className="size-4" />}
          label="Continue with email"
          onClick={onEmail}
          disabled={loading}
        />
      </div>

      <Divider label="or" />

      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          onClick={onPasskey}
          disabled={loading}
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
          size="sm"
        >
          <Fingerprint className="size-4" />
          Sign in with a passkey
        </Button>

        <FarcasterSignInSection
          onLoginSuccess={onLoginSuccess}
          onClose={onClose}
          loading={loading}
        />
      </div>
    </>
  );
}

// ── Email flow view ──────────────────────────────────────────────────────────

interface FlowProps {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  errorMsg: string;
  onSubmit: () => void | Promise<void>;
}

function EmailFlow({ email, setEmail, loading, errorMsg, onSubmit }: FlowProps) {
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-medium text-foreground text-sm">Email</span>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
          autoFocus
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        />
      </label>

      <Button
        type="submit"
        disabled={loading || !email.trim()}
        className="h-10 w-full"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Sending link
          </span>
        ) : (
          'Send magic link'
        )}
      </Button>

      {errorMsg ? <ErrorLine message={errorMsg} /> : null}

      <p className="text-center text-muted-foreground text-xs">
        We will email you a one-time link. No password needed.
      </p>
    </form>
  );
}

// ── Passkey flow view ────────────────────────────────────────────────────────

function PasskeyFlow({
  email,
  setEmail,
  loading,
  errorMsg,
  onSubmit,
}: FlowProps) {
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-medium text-foreground text-sm">Email</span>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email webauthn"
          autoFocus
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        />
      </label>

      <Button
        type="submit"
        disabled={loading || !email.trim()}
        className="h-10 w-full gap-2"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Waiting for passkey
          </span>
        ) : (
          <>
            <Fingerprint className="size-4" />
            Sign in with passkey
          </>
        )}
      </Button>

      {errorMsg ? <ErrorLine message={errorMsg} /> : null}

      <p className="text-center text-muted-foreground text-xs">
        Uses your device biometrics or hardware security key.
      </p>
    </form>
  );
}

// ── Email-sent confirmation view ─────────────────────────────────────────────

function EmailSent({ email, onAgain }: { email: string; onAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 p-6 text-center">
      <Mail className="size-6 text-muted-foreground" aria-hidden />
      <p className="mt-1 text-muted-foreground text-sm">
        We sent a sign-in link to
      </p>
      <p className="font-medium text-foreground">{email}</p>
      <p className="mt-2 text-muted-foreground text-xs">
        No email in a minute? Check spam or{' '}
        <button
          className="text-primary underline-offset-4 hover:underline"
          onClick={onAgain}
          type="button"
        >
          try a different method
        </button>
        .
      </p>
    </div>
  );
}

// ── Shared pieces ────────────────────────────────────────────────────────────

interface ProviderButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ProviderButton({
  icon,
  label,
  onClick,
  disabled,
}: ProviderButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-10 w-full justify-start gap-3 px-4"
    >
      <span className="inline-flex size-5 items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
    </Button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <div className="flex-1 border-border border-t" />
      <span className="text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 border-border border-t" />
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs"
    >
      {message}
    </p>
  );
}

// ── Farcaster section ─────────────────────────────────────────────────────────

function FarcasterSignInSection({
  onLoginSuccess,
  onClose,
  loading,
}: {
  onLoginSuccess: (token: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [error, setError] = useState('');
  const [SignInButton, setSignInButton] = useState<React.ComponentType<{
    onSuccess?: (res: unknown) => void;
    onError?: (err: unknown) => void;
  }> | null>(null);

  useEffect(() => {
    import('@farcaster/auth-kit')
      .then((mod) => setSignInButton(() => mod.SignInButton))
      .catch(() => {
        // auth-kit unavailable, omit the button silently
      });
  }, []);

  const handleSuccess = useCallback(
    async (res: { message?: string; signature?: string; nonce?: string }) => {
      setError('');
      try {
        const r = await fetch('/api/auth/farcaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: res.message,
            signature: res.signature,
            nonce: res.nonce,
          }),
        });
        const data = (await r.json()) as {
          ok: boolean;
          token?: string;
          error?: string;
        };
        if (!data.ok || !data.token) {
          throw new Error(data.error ?? 'Farcaster auth failed');
        }
        await onLoginSuccess(data.token);
        onClose();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Farcaster sign-in failed';
        logger.warn('Farcaster SIWF failed', { error: msg }, 'LoginModal');
        setError(msg);
      }
    },
    [onLoginSuccess, onClose]
  );

  if (!SignInButton) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={
          loading
            ? 'pointer-events-none w-full opacity-50 [&>div]:w-full [&>div>button]:w-full'
            : 'w-full [&>div]:w-full [&>div>button]:w-full'
        }
      >
        <SignInButton
          onSuccess={(res) =>
            void handleSuccess(res as Parameters<typeof handleSuccess>[0])
          }
          onError={(err) => {
            const msg =
              err instanceof Error ? err.message : 'Farcaster sign-in error';
            setError(msg);
          }}
        />
      </div>
      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

// ── Icon SVGs ─────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="size-4 fill-[#5865F2]" viewBox="0 0 24 24" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
