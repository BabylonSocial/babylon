'use client';

import { useEffect, useRef, useState } from 'react';
import { useStewardAuthContext } from '@/components/providers/StewardAuthProvider';

/**
 * OAuth callback page for Steward OAuth providers (Google, Discord, Twitter/X).
 *
 * Steward redirects here after a successful OAuth flow with:
 *   ?token=<jwt>&refreshToken=<rt>    (on success, current Steward)
 *   ?token=<jwt>&refresh_token=<rt>   (legacy success shape)
 *   ?error=<message>                  (on failure)
 *
 * Security: Immediately sanitizes the URL via replaceState() to prevent
 * the JWT from appearing in browser history, referrer headers, or server logs.
 */
function getSafeReturnTo(params: URLSearchParams): string {
  const returnTo = params.get('returnTo');
  if (!returnTo) return '/';

  try {
    const decoded = decodeURIComponent(returnTo);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {
    // Fall through to the safe default.
  }

  return '/';
}

export default function OAuthCallbackPage() {
  const { onLoginSuccess } = useStewardAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken =
      params.get('refreshToken') ?? params.get('refresh_token') ?? null;
    const errorParam = params.get('error');
    const stateParam = params.get('state');
    const destination = getSafeReturnTo(params);

    // Sanitize URL immediately — remove sensitive query params from history
    window.history.replaceState(null, '', window.location.pathname);

    if (stateParam) {
      setState(stateParam);
    }

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!token) {
      setError('missing_token');
      return;
    }

    onLoginSuccess(token, refreshToken)
      .then(() => {
        window.location.assign(destination);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [onLoginSuccess]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="font-semibold text-destructive">Sign-in failed</p>
            <p className="mt-2 max-w-sm text-muted-foreground text-sm">
              {error}
            </p>
            {state ? (
              <p className="mt-2 max-w-sm text-muted-foreground text-xs">
                State: {state}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground text-sm">Completing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
