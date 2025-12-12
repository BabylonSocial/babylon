import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createChatClient,
  type UnreadCountResult,
} from '@/lib/chat-api-client';

export type UseChatUnreadCountOptions = {
  pollInterval?: number;
  enabled?: boolean;
};

export type UseChatUnreadCountReturn = {
  pendingDms: number;
  hasNewMessages: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

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

  const chatClient = useMemo(
    () => createChatClient(getAccessToken),
    [getAccessToken]
  );

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

  useEffect(() => {
    if (authenticated && enabled) {
      void fetchUnreadCount();
    }
  }, [authenticated, enabled, fetchUnreadCount]);

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
