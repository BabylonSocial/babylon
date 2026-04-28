'use client';

import type { StewardSession } from '@stwd/sdk';
import { StewardAuth } from '@stwd/sdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ── Singleton StewardAuth instance ───────────────────────────────────────────

const STEWARD_TENANT_ID =
  process.env.NEXT_PUBLIC_STEWARD_TENANT_ID ?? 'babylon';

let _stewardAuthInstance: StewardAuth | null = null;

function getOrCreateStewardAuth(): StewardAuth {
  if (_stewardAuthInstance) return _stewardAuthInstance;
  const baseUrl =
    process.env.NEXT_PUBLIC_STEWARD_API_URL ??
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'https://auth.elizacloud.ai'
      : 'http://localhost:3200');
  _stewardAuthInstance = new StewardAuth({
    baseUrl,
    tenantId: STEWARD_TENANT_ID,
    // Persist session across page reloads
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    onSessionChange: (session) => {
      // TODO: Phase 3 — rename __privyAccessToken to __accessToken once all
      // consumers have migrated off the legacy Privy naming.
      // Keep the window-level access token in sync for apiFetch
      if (typeof window !== 'undefined') {
        (
          window as Window & { __privyAccessToken?: string | null }
        ).__privyAccessToken = session?.token ?? null;
      }
    },
  });
  return _stewardAuthInstance;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface StewardAuthContextValue {
  stewardAuth: StewardAuth;
  session: StewardSession | null;
  isLoading: boolean;
  /** Call after a successful login to sync the httpOnly cookie and fetch the user profile. */
  onLoginSuccess: (
    token: string,
    refreshToken?: string | null
  ) => Promise<void>;
}

async function syncSessionCookie(token: string, refreshToken?: string | null) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, refreshToken }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Session cookie sync failed: ${res.status} ${body}`);
  }
}

const StewardAuthContext = createContext<StewardAuthContextValue | null>(null);

export function useStewardAuthContext(): StewardAuthContextValue {
  const ctx = useContext(StewardAuthContext);
  if (!ctx) {
    throw new Error(
      'useStewardAuthContext must be used inside StewardAuthProvider'
    );
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StewardAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const stewardAuth = useRef(getOrCreateStewardAuth()).current;
  const [session, setSession] = useState<StewardSession | null>(() =>
    stewardAuth.getSession()
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to session changes from the SDK
    const unsubscribe = stewardAuth.onSessionChange((s) => {
      setSession(s);
    });
    return unsubscribe;
  }, [stewardAuth]);

  const onLoginSuccess = useCallback(
    async (token: string, refreshToken?: string | null) => {
      setIsLoading(true);
      try {
        // Sync the token to the server-side httpOnly cookie before publishing a
        // local authenticated state. If this fails, clear any SDK-stored token so
        // callers do not redirect into an apparently authenticated UI without
        // httpOnly cookies.
        await syncSessionCookie(token, refreshToken);

        // For OAuth / Farcaster / Telegram callbacks we receive the JWT externally.
        // The SDK's private storage key is 'steward_session_token' in localStorage.
        // Writing there and then calling getSession() syncs the SDK without
        // needing access to private members.
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('steward_session_token', token);
          if (refreshToken) {
            localStorage.setItem('steward_refresh_token', refreshToken);
          }
        }
        // Immediately update React session state so useAuth sees the new session
        setSession(stewardAuth.getSession());
      } catch (err) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('steward_session_token');
          localStorage.removeItem('steward_refresh_token');
        }
        stewardAuth.signOut();
        setSession(null);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stewardAuth]
  );

  return (
    <StewardAuthContext.Provider
      value={{ stewardAuth, session, isLoading, onLoginSuccess }}
    >
      {children}
    </StewardAuthContext.Provider>
  );
}
