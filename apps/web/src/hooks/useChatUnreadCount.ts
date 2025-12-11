/**
 * Chat Unread Count Hook
 *
 * Fetches and manages unread message counts using the Chat API.
 * Provides pending DM count and new message indicator for UI badges.
 */

import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createChatClient,
  type UnreadCountResult,
} from '@/lib/chat-api-client';

/**
 * Options for the unread count hook
 */
export type UseChatUnreadCountOptions = {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollInterval?: number;
  /** Enable/disable polling (default: true when authenticated) */
  enabled?: boolean;
};

/**
 * Return type for the unread count hook
 */
export type UseChatUnreadCountReturn = {
  /** Number of pending DM requests */
  pendingDms: number;
  /** Whether there are new messages in the last 24h */
  hasNewMessages: boolean;
  /** Whether the count is currently loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Manually refresh the count */
  refresh: () => Promise<void>;
};

/**
 * Hook for fetching unread message counts
 *
 * Uses the Chat API's `chat.getUnreadCount` endpoint to fetch
 * pending DM count and new message indicator. Supports automatic
 * polling for real-time badge updates.
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { pendingDms, hasNewMessages, refresh } = useChatUnreadCount();
 *
 * return (
 *   <ChatIcon>
 *     {(pendingDms > 0 || hasNewMessages) && <Badge />}
 *   </ChatIcon>
 * );
 * ```
 */
export function useChatUnreadCount(
  options: UseChatUnreadCountOptions = {}
): UseChatUnreadCountReturn {
  const { pollInterval = 30000, enabled = true } = options;

  const { getAccessToken, authenticated } = usePrivy();
  const [data, setData] = useState<UnreadCountResult>({
    pendingDms: 0,
    hasNewMessages: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create chat client
  const chatClient = useMemo(
    () => createChatClient(getAccessToken),
    [getAccessToken]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!authenticated) {
      setData({ pendingDms: 0, hasNewMessages: false });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatClient.chat.getUnreadCount();
      setData({
        pendingDms: result.pendingDms,
        hasNewMessages: result.hasNewMessages,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, chatClient]);

  // Initial fetch
  useEffect(() => {
    if (authenticated && enabled) {
      void fetchUnreadCount();
    }
  }, [authenticated, enabled, fetchUnreadCount]);

  // Polling
  useEffect(() => {
    if (!authenticated || !enabled || pollInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [authenticated, enabled, pollInterval, fetchUnreadCount]);

  return {
    pendingDms: data.pendingDms,
    hasNewMessages: data.hasNewMessages,
    isLoading,
    error,
    refresh: fetchUnreadCount,
  };
}
