'use client';

import {
  getGetUnreadCountQueryKey,
  useGetUnreadCount,
} from '@babylon/api-hooks';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for polling unread and pending message counts.
 *
 * Uses the generated useGetUnreadCount hook with TanStack Query's
 * refetchInterval for automatic polling every 30 seconds.
 */
export function useUnreadMessages() {
  const { authenticated } = useAuth();

  const { data, isLoading } = useGetUnreadCount({
    query: {
      enabled: authenticated,
      staleTime: 10_000,
      refetchInterval: authenticated ? 30_000 : false,
      queryKey: getGetUnreadCountQueryKey(),
    },
  });

  const pendingDMs = data?.pendingDMs ?? 0;
  const hasNewMessages = data?.hasNewMessages ?? false;

  return {
    pendingDMs,
    hasNewMessages,
    totalUnread: pendingDMs + (hasNewMessages ? 1 : 0),
    isLoading,
  };
}
