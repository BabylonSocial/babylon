/**
 * Session Heartbeat Hook
 *
 * Tracks user sessions via periodic heartbeats for engagement metrics.
 * Heartbeats are sent every 5 minutes while the tab is visible.
 *
 * @module useSessionHeartbeat
 */

import { activityHeartbeat } from '@babylon/api-hooks';
import { generateUUID } from '@babylon/shared';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_KEY_PREFIX = 'bab_session_id';

/**
 * Gets or creates a session ID from sessionStorage, scoped to the user.
 * This ensures different users on the same browser get different session IDs.
 */
function getSessionId(userId: string): string {
  if (typeof window === 'undefined') return generateUUID();

  const storageKey = `${SESSION_KEY_PREFIX}:${userId}`;
  let id = sessionStorage.getItem(storageKey);
  if (!id) {
    id = generateUUID();
    sessionStorage.setItem(storageKey, id);
  }
  return id;
}

/**
 * Tracks user sessions via periodic heartbeat. Only active for authenticated users.
 */
export function useSessionHeartbeat(): void {
  const { authenticated, ready, user } = useAuth();
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const pageViewsRef = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const lastPathnameRef = useRef<string | null>(null);

  // Track page views via pathname changes (catches Next.js client-side navigation)
  useEffect(() => {
    if (!ready || !authenticated) return;

    // Only increment on actual navigation, not initial render
    if (
      lastPathnameRef.current !== null &&
      lastPathnameRef.current !== pathname
    ) {
      pageViewsRef.current += 1;
    }
    lastPathnameRef.current = pathname;
  }, [pathname, ready, authenticated]);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    // Get or create user-scoped session ID
    if (!sessionIdRef.current) {
      sessionIdRef.current = getSessionId(user.id);
    }
    const sessionId = sessionIdRef.current;

    const sendHeartbeat = (): void => {
      const pageViews = pageViewsRef.current;
      pageViewsRef.current = 0;

      void activityHeartbeat({
        sessionId,
        pageViews,
        lastPath: typeof window !== 'undefined' ? window.location.pathname : '',
      }).catch(() => {});
    };

    const resetInterval = (): void => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (isVisibleRef.current) sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    };

    const onVisibilityChange = (): void => {
      const wasVisible = isVisibleRef.current;
      isVisibleRef.current = document.visibilityState === 'visible';

      if (isVisibleRef.current && !wasVisible) {
        // Tab became visible - send heartbeat and reset interval
        // to avoid rapid-fire heartbeats if interval was about to fire
        sendHeartbeat();
        resetInterval();
      }
    };

    // Initial heartbeat and interval setup
    sendHeartbeat();
    resetInterval();

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authenticated, ready, user]);
}

/** Provider that enables session heartbeat for its subtree */
export function SessionHeartbeatProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  useSessionHeartbeat();
  return children;
}
