import {
  disconnectTwitter as disconnectTwitterApi,
  getGetTwitterAuthStatusQueryKey,
  useGetTwitterAuthStatus,
} from '@babylon/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Represents the current Twitter authentication status.
 */
interface TwitterAuthStatus {
  /** Whether Twitter is currently connected */
  connected: boolean;
  /** Twitter screen name/username */
  screenName?: string;
  /** When the connection was established */
  connectedAt?: Date;
}

/**
 * Return type for the useTwitterAuth hook.
 */
interface UseTwitterAuthReturn {
  /** Current Twitter auth status, or null if not checked yet */
  authStatus: TwitterAuthStatus | null;
  /** Whether auth status is currently loading */
  loading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Function to initiate Twitter OAuth connection */
  connectTwitter: (returnPath?: string) => void;
  /** Function to disconnect Twitter account */
  disconnectTwitter: () => Promise<void>;
  /** Function to manually refresh auth status */
  refreshStatus: () => Promise<void>;
}

/**
 * Hook for managing Twitter OAuth authentication for posting posts.
 *
 * Provides functionality to connect and disconnect Twitter accounts via
 * OAuth 2.0. Automatically checks auth status on mount and when the user
 * changes. Handles OAuth callback redirects automatically.
 */
export function useTwitterAuth(): UseTwitterAuthReturn {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useGetTwitterAuthStatus({
    query: {
      enabled: !!user?.id,
      queryKey: getGetTwitterAuthStatusQueryKey(),
    },
  });

  const authStatus: TwitterAuthStatus | null = data
    ? {
        connected: data.connected ?? false,
        screenName: data.username,
      }
    : null;

  // Check for successful auth callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const twitterAuth = urlParams.get('twitter_auth');

    if (twitterAuth === 'success') {
      void refetch();

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('twitter_auth');
      window.history.replaceState({}, '', url.toString());
    }
  }, [refetch]);

  const connectTwitter = useCallback(
    (_returnPath?: string) => {
      if (!user?.id) return;
      window.location.href = '/api/auth/twitter/initiate';
    },
    [user?.id]
  );

  const handleDisconnect = useCallback(async () => {
    if (!user?.id) return;

    await disconnectTwitterApi();
    void queryClient.invalidateQueries({
      queryKey: getGetTwitterAuthStatusQueryKey(),
    });
  }, [user?.id, queryClient]);

  const refreshStatus = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    authStatus,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    connectTwitter,
    disconnectTwitter: handleDisconnect,
    refreshStatus,
  };
}
