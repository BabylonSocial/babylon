'use client';

import type { FeedPost } from '@babylon/shared';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InlineComposer } from '@/components/feed/InlineComposer';
import { FeedToggle } from '@/components/shared/FeedToggle';
import { PageContainer } from '@/components/shared/PageContainer';
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator';
import { FeedSkeleton } from '@/components/shared/Skeleton';
import { useWidgetRefresh } from '@/contexts/WidgetRefreshContext';
import { useAuth } from '@/hooks/useAuth';
import { useErrorToasts } from '@/hooks/useErrorToasts';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useFeedStore } from '@/stores/feedStore';
import { useGameStore } from '@/stores/gameStore';
import { EmptyFeed, PostList } from './components';
import { useFeedPosts, useFollowingPosts, useHotPosts } from './hooks';

// Performance: Lazy load heavy components
const WidgetSidebar = dynamic(
  () =>
    import('@/components/shared/WidgetSidebar').then((m) => ({
      default: m.WidgetSidebar,
    })),
  {
    ssr: false,
    loading: () => <div className="hidden w-96 flex-none xl:block" />,
  }
);

const TradesFeed = dynamic(
  () =>
    import('@/components/trades/TradesFeed').then((m) => ({
      default: m.TradesFeed,
    })),
  { ssr: false }
);

type FeedTab = 'latest' | 'hot' | 'following' | 'trades';

/**
 * FeedClient - Main feed page orchestrator
 *
 * This component orchestrates the feed experience by:
 * - Managing tab state (latest, following, trades)
 * - Coordinating data fetching hooks
 * - Handling pull-to-refresh
 * - Rendering inline post composer
 *
 * Heavy components are lazy loaded:
 * - WidgetSidebar (desktop only)
 * - TradesFeed (trades tab only)
 */
export function FeedClient() {
  const router = useRouter();
  const { authenticated } = useAuth();
  const { refreshAll: refreshWidgets } = useWidgetRefresh();
  const { registerOptimisticPostCallback, unregisterOptimisticPostCallback } =
    useFeedStore();

  // Tab state
  const [tab, setTab] = useState<FeedTab>('latest');

  // Actor names for display
  const [actorNames, setActorNames] = useState<Map<string, string>>(new Map());

  // Scroll container ref for TradesFeed
  const scrollContainerRefObject = useRef<HTMLDivElement | null>(null);

  // Enable error toasts
  useErrorToasts();

  // Data fetching hooks
  const {
    posts: latestPosts,
    loading: latestLoading,
    loadingMore,
    hasMore,
    cursor,
    fetchPosts,
    refresh: refreshLatest,
    addOptimisticPost,
  } = useFeedPosts({ enabled: tab === 'latest' });

  const { posts: followingPosts, loading: followingLoading } =
    useFollowingPosts({ enabled: tab === 'following' });

  const { posts: hotPosts, loading: hotLoading } = useHotPosts({
    enabled: tab === 'hot',
  });

  // Game timeline posts (viewer mode fallback)
  const { allGames, startTime, currentTimeMs } = useGameStore();
  const currentDate = startTime ? new Date(startTime + currentTimeMs) : null;

  const timelinePosts = useMemo(() => {
    if (!startTime || !currentDate || allGames.length === 0) return [];

    const items: Array<{
      id: string;
      content: string;
      author: string;
      authorId: string;
      authorName: string;
      timestamp: string;
      timestampMs: number;
    }> = [];

    allGames.forEach((g) => {
      g.timeline?.forEach((day) => {
        day.feedPosts?.forEach((post) => {
          const ts = new Date(post.timestamp).getTime();
          items.push({
            id: `game-${g.id}-${post.timestamp}`,
            content: post.content,
            author: post.author,
            authorId: post.author,
            authorName: post.authorName,
            timestamp: post.timestamp,
            timestampMs: ts,
          });
        });
      });
    });

    const currentAbs = startTime + currentTimeMs;
    return items
      .filter((p) => p.timestampMs <= currentAbs)
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .map(({ timestampMs: _, ...rest }) => rest as FeedPost);
  }, [allGames, startTime, currentTimeMs, currentDate]);

  // Select posts based on current tab
  const currentPosts = useMemo(() => {
    if (tab === 'following') return followingPosts;
    if (tab === 'hot') return hotPosts;
    if (latestPosts.length > 0) return latestPosts;
    if (startTime && allGames.length > 0) return timelinePosts;
    return latestPosts;
  }, [
    tab,
    latestPosts,
    followingPosts,
    hotPosts,
    timelinePosts,
    startTime,
    allGames,
  ]);

  const isLoading =
    (tab === 'latest' && latestLoading) ||
    (tab === 'hot' && hotLoading) ||
    (tab === 'following' && followingLoading);

  // Load actor names
  useEffect(() => {
    const loadActorNames = async () => {
      const response = await fetch('/api/actors');
      if (!response.ok) return;
      const data = (await response.json()) as {
        actors?: Array<{ id: string; name: string }>;
      };
      const nameMap = new Map<string, string>();
      data.actors?.forEach((actor) => {
        nameMap.set(actor.id, actor.name);
      });
      setActorNames(nameMap);
    };
    loadActorNames();
  }, []);

  // Register optimistic post callback
  useEffect(() => {
    const handleOptimisticPost = (post: FeedPost) => {
      addOptimisticPost(post);
    };

    registerOptimisticPostCallback(handleOptimisticPost);
    return () => {
      unregisterOptimisticPostCallback();
    };
  }, [
    registerOptimisticPostCallback,
    unregisterOptimisticPostCallback,
    addOptimisticPost,
  ]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (tab === 'latest') {
      await refreshLatest();
      refreshWidgets();
    }
  }, [tab, refreshLatest, refreshWidgets]);

  const {
    pullDistance,
    isRefreshing,
    containerRef: scrollContainerCallbackRef,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: tab === 'latest' || tab === 'trades',
  });

  const scrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollContainerCallbackRef(node);
      if (scrollContainerRefObject.current !== node) {
        scrollContainerRefObject.current = node;
      }
    },
    [scrollContainerCallbackRef]
  );

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (tab === 'latest' && cursor) {
      void fetchPosts(cursor, true);
    }
  }, [tab, cursor, fetchPosts]);

  // Handle post creation
  const handlePostCreated = useCallback(
    (newPost: {
      id: string;
      content: string;
      authorId: string;
      authorName: string;
      authorUsername?: string | null;
      authorProfileImageUrl?: string | null;
      timestamp: string;
    }) => {
      const optimisticPost: FeedPost = {
        id: newPost.id,
        content: newPost.content,
        author: newPost.authorId,
        authorId: newPost.authorId,
        authorName: newPost.authorName,
        authorUsername: newPost.authorUsername || undefined,
        authorProfileImageUrl: newPost.authorProfileImageUrl || undefined,
        timestamp: newPost.timestamp,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        isShared: false,
      };

      addOptimisticPost(optimisticPost);

      if (window.location.pathname !== '/feed') {
        router.push('/feed');
      }
    },
    [addOptimisticPost, router]
  );

  // Render content based on tab and state
  const renderContent = () => {
    if (tab === 'trades') {
      return <TradesFeed containerRef={scrollContainerRefObject} />;
    }

    if (isLoading) {
      return (
        <div className="w-full">
          <FeedSkeleton count={5} />
        </div>
      );
    }

    if (currentPosts.length === 0) {
      if (tab === 'latest') return <EmptyFeed variant="latest" />;
      if (tab === 'hot') return <EmptyFeed variant="hot" />;
      if (tab === 'following')
        return <EmptyFeed variant="following" isLoading={followingLoading} />;
      return <EmptyFeed variant="default" />;
    }

    return (
      <PostList
        posts={currentPosts}
        actorNames={actorNames}
        hasMore={tab === 'latest' && hasMore}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
      />
    );
  };

  return (
    <PageContainer noPadding className="flex w-full flex-col">
      <div ref={scrollContainerRef} className="relative flex flex-1">
        {/* Feed area */}
        <div className="flex min-w-0 flex-1 flex-col border-[rgba(120,120,120,0.15)] lg:border-r lg:border-l">
          {/* Header with tabs */}
          <div className="sticky top-0 z-10 flex-shrink-0 bg-background shadow-sm">
            <FeedToggle activeTab={tab} onTabChange={setTab} />
          </div>

          {/* Feed content */}
          <div className="flex-1 bg-background">
            <div className="w-full lg:mx-auto lg:max-w-[700px]">
              <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isRefreshing}
              />

              {/* Inline Composer - shown on latest tab for authenticated users */}
              {authenticated && tab === 'latest' && (
                <InlineComposer onPostCreated={handlePostCreated} />
              )}

              <div>{renderContent()}</div>
            </div>
          </div>
        </div>

        {/* Widget sidebar - lazy loaded, desktop only */}
        <WidgetSidebar />
      </div>
    </PageContainer>
  );
}
