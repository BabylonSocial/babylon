'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PostCard } from '@/components/posts/PostCard';
import { PageContainer } from '@/components/shared/PageContainer';
import { logger } from '@babylon/shared';

interface PostData {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorProfileImageUrl?: string | null;
  timestamp: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  type?: string;
  isShared?: boolean;
}

interface TagInfo {
  id: string;
  displayName: string;
  category: string | null;
}

export default function GroupedTrendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagsParam = searchParams.get('tags') || '';
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<TagInfo[]>([]);

  const fetchPosts = useCallback(async () => {
    if (!tagsParam) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const response = await fetch(
      `/api/trending/group?tags=${tagsParam}&limit=50`
    );

    if (!response.ok) {
      logger.warn(
        'Failed to fetch grouped trending posts',
        { tagsParam },
        'GroupedTrendingPage'
      );
      setLoading(false);
      return;
    }

    const data = await response.json();

    if (data.success) {
      setPosts(data.posts || []);
      setTags(data.tags || []);
    }

    setLoading(false);
  }, [tagsParam]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleBack = () => {
    router.back();
  };

  return (
    <PageContainer>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 border-border border-b bg-background px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="rounded-full p-2 transition-colors hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-xl">
                {tags.length > 0
                  ? tags.map((t) => t.displayName).join(' • ')
                  : 'Grouped Trending'}
              </h1>
              {tags.length > 0 && tags[0]?.category && (
                <p className="text-muted-foreground text-sm">
                  {tags[0].category}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Feed content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <h2 className="mb-2 font-semibold text-xl">No posts found</h2>
                <p className="text-muted-foreground">
                  No posts found for these trending topics yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-feed space-y-0 px-6 py-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {posts.length > 0 && (
                <div className="py-4 text-center text-muted-foreground text-xs">
                  You&apos;re all caught up.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
