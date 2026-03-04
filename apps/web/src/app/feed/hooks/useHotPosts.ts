import { getHotFeed } from '@babylon/api-hooks';
import { type FeedPost, logger } from '@babylon/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseHotPostsOptions {
  enabled?: boolean;
}

interface UseHotPostsResult {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Hook for fetching hot/trending posts ranked by engagement score.
 * Auto-refreshes every 60 seconds when enabled.
 */
export function useHotPosts(
  options: UseHotPostsOptions = {}
): UseHotPostsResult {
  const { enabled = true } = options;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshControllerRef = useRef<AbortController | null>(null);
  const intervalControllerRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(
    async (showLoading = true, signal?: AbortSignal) => {
      if (showLoading) setLoading(true);

      try {
        const data = await getHotFeed({ limit: '50' }, { signal });

        // Check if aborted after fetch
        if (signal?.aborted) return;

        setPosts((data.posts ?? []) as unknown as FeedPost[]);
        setError(null);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        logger.error('Error fetching hot posts', { error: err }, 'useHotPosts');
        setError('Network error while fetching posts');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  const refresh = useCallback(() => {
    // Abort any previous refresh request before starting a new one
    refreshControllerRef.current?.abort();
    const controller = new AbortController();
    refreshControllerRef.current = controller;
    return fetchPosts(false, controller.signal);
  }, [fetchPosts]);

  // Initial fetch when enabled
  useEffect(() => {
    if (!enabled) {
      hasFetched.current = false;
      setLoading(false);
      // Abort any ongoing requests when disabled
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      refreshControllerRef.current?.abort();
      refreshControllerRef.current = null;
      intervalControllerRef.current?.abort();
      intervalControllerRef.current = null;
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Create abort controller for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;
    void fetchPosts(true, controller.signal);

    return () => {
      controller.abort();
      refreshControllerRef.current?.abort();
    };
  }, [enabled, fetchPosts]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      // Abort previous interval fetch if still running
      intervalControllerRef.current?.abort();
      const controller = new AbortController();
      intervalControllerRef.current = controller;
      void fetchPosts(false, controller.signal);
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(id);
      intervalControllerRef.current?.abort();
      intervalControllerRef.current = null;
    };
  }, [enabled, fetchPosts]);

  return { posts, loading, error, refresh };
}
