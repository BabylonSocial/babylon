'use client';

import type { StewardSession } from '@stwd/sdk';
import { StewardAuth } from '@stwd/sdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const STEWARD_TOKEN_KEY = 'steward_session_token';
const STEWARD_REFRESH_TOKEN_KEY = 'steward_refresh_token';
const REFRESH_CHECK_INTERVAL_MS = 60_000;
const REFRESH_AHEAD_SECS = 120;

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(STEWARD_TOKEN_KEY);
  } catch {
    return null;
  }
}

function tokenSecsRemaining(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (!payload.exp) return null;
    return payload.exp - Date.now() / 1000;
  } catch {
    return null;
  }
}

// ── Singleton StewardAuth instance ───────────────────────────────────────────

let _stewardAuthInstance: StewardAuth | null = null;

function getStewardBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STEWARD_API_URL ??
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'https://auth.elizacloud.ai'
      : 'http://localhost:3200')
  );
}

function getOrCreateStewardAuth(): StewardAuth {
  if (_stewardAuthInstance) return _stewardAuthInstance;
  _stewardAuthInstance = new StewardAuth({
    baseUrl: getStewardBaseUrl(),
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
  onLoginSuccess: (token: string, refreshToken?: string) => Promise<void>;
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
  const refreshAuth = useMemo(
    () =>
      new StewardAuth({
        baseUrl: getStewardBaseUrl(),
        storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
      }),
    []
  );
  const [session, setSession] = useState<StewardSession | null>(() =>
    stewardAuth.getSession()
  );
  const [isLoading, setIsLoading] = useState(false);

  const syncSessionCookie = useCallback(
    async (token: string, refreshToken?: string) => {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, refreshToken }),
      });
    },
    []
  );

  useEffect(() => {
    // Subscribe to session changes from the SDK
    const unsubscribe = stewardAuth.onSessionChange((s) => {
      setSession(s);
    });
    return unsubscribe;
  }, [stewardAuth]);

  const onLoginSuccess = useCallback(
    async (token: string, refreshToken?: string) => {
      setIsLoading(true);
      try {
        // For OAuth / Farcaster / Telegram callbacks we receive the JWT externally.
        // The SDK's private storage key is 'steward_session_token' in localStorage.
        // Writing there and then calling getSession() syncs the SDK without
        // needing access to private members.
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STEWARD_TOKEN_KEY, token);
          if (refreshToken) {
            localStorage.setItem(STEWARD_REFRESH_TOKEN_KEY, refreshToken);
          }
        }
        // Immediately update React session state so useAuth sees the new session
        setSession(stewardAuth.getSession());

        // Sync the token to the server-side httpOnly cookie
        await syncSessionCookie(token, refreshToken);
      } finally {
        setIsLoading(false);
      }
    },
    [stewardAuth, syncSessionCookie]
  );

  useEffect(() => {
    const checkAndRefresh = async () => {
      const token = readStoredToken();
      if (!token) return;

      const secsRemaining = tokenSecsRemaining(token);
      if (
        secsRemaining === null ||
        secsRemaining >= REFRESH_AHEAD_SECS ||
        secsRemaining <= 0
      ) {
        return;
      }

      try {
        const refreshedSession = await refreshAuth.refreshSession();
        if (!refreshedSession?.token) return;

        setSession(stewardAuth.getSession());
        await syncSessionCookie(
          refreshedSession.token,
          refreshAuth.getRefreshToken() ?? undefined
        );
      } catch (error) {
        console.warn('[steward] auto-refresh failed', error);
      }
    };

    void checkAndRefresh();
    const interval = window.setInterval(() => {
      void checkAndRefresh();
    }, REFRESH_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshAuth, stewardAuth, syncSessionCookie]);

  return (
    <StewardAuthContext.Provider
      value={{ stewardAuth, session, isLoading, onLoginSuccess }}
    >
      {children}
    </StewardAuthContext.Provider>
  );
}
