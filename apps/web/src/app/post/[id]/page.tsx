'use client';

import { useGetPostById } from '@babylon/api-hooks';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { FeedCommentSection } from '@/components/feed/FeedCommentSection';
import { InteractionBar } from '@/components/interactions';
import { PostCard } from '@/components/posts/PostCard';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useInteractionStore } from '@/stores/interactionStore';

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

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { id: postId } = use(params);
  const router = useRouter();
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Function to open comment modal when comment button is clicked
  const handleCommentClick = () => {
    setIsCommentModalOpen(true);
  };

  // Back: go to previous page (e.g. quote post, profile); fallback to feed when no history (direct link / new tab)
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  // Extended post type that includes fields the API returns beyond the generated schema
  type ExtendedPostData = {
    id: string;
    type?: string;
    content: string;
    fullContent?: string | null;
    articleTitle?: string | null;
    byline?: string | null;
    biasScore?: number | null;
    sentiment?: string | null;
    slant?: string | null;
    category?: string | null;
    authorId: string;
    authorName: string;
    authorUsername?: string | null;
    authorProfileImageUrl?: string | null;
    timestamp: string;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    isLiked: boolean;
    isShared: boolean;
    isRepost?: boolean;
    isQuote?: boolean;
    quoteComment?: string | null;
    originalPostId?: string | null;
    originalPost?: {
      id: string;
      content: string;
      authorId: string;
      authorName: string;
      authorUsername: string | null;
      authorProfileImageUrl: string | null;
      timestamp: string;
    } | null;
  };

  const { data: postResponse, isLoading, error: queryError } = useGetPostById(postId);

  // Transform the API response into the expected shape
  const [post, setPost] = useState<ExtendedPostData | null>(null);

  useEffect(() => {
    if (!postResponse) {
      setPost(null);
      return;
    }

    // Access the raw response data which may have extra fields beyond the generated type
    const rawData = postResponse as unknown as Record<string, unknown>;
    const postData = (rawData.data || rawData.post || rawData) as Record<string, unknown>;

    // If this is an article-type post, redirect to /article/[id]
    if (postData.type === 'article' && postData.fullContent) {
      router.replace(`/article/${postId}`);
      return;
    }

    const mapped: ExtendedPostData = {
      id: postData.id as string,
      type: (postData.type as string) || 'post',
      content: postData.content as string,
      fullContent: (postData.fullContent as string) || null,
      articleTitle: (postData.articleTitle as string) || null,
      byline: (postData.byline as string) || null,
      biasScore: postData.biasScore !== undefined ? (postData.biasScore as number) : null,
      sentiment: (postData.sentiment as string) || null,
      slant: (postData.slant as string) || null,
      category: (postData.category as string) || null,
      authorId: postData.authorId as string,
      authorName: postData.authorName as string || (postData.author as Record<string, unknown>)?.displayName as string || '',
      authorUsername: (postData.authorUsername as string) || (postData.author as Record<string, unknown>)?.username as string || null,
      authorProfileImageUrl: (postData.authorProfileImageUrl as string) || (postData.author as Record<string, unknown>)?.profileImageUrl as string || null,
      timestamp: (postData.timestamp || postData.createdAt) as string,
      likeCount: (postData.likeCount as number) ?? 0,
      commentCount: (postData.commentCount as number) ?? 0,
      shareCount: (postData.shareCount as number) ?? 0,
      isLiked: (postData.isLiked as boolean) ?? false,
      isShared: (postData.isShared as boolean) ?? false,
      isRepost: (postData.isRepost as boolean) || false,
      isQuote: (postData.isQuote as boolean) || false,
      quoteComment: (postData.quoteComment as string) || null,
      originalPostId: (postData.originalPostId as string) || null,
      originalPost: (postData.originalPost as ExtendedPostData['originalPost']) || null,
    };

    setPost(mapped);

    // Update the interaction store with fresh API data
    const interactionPostId = mapped.originalPostId || postId;
    const { postInteractions } = useInteractionStore.getState();
    const storeData = postInteractions.get(interactionPostId);

    if (mapped.likeCount !== undefined || mapped.commentCount !== undefined) {
      const store = useInteractionStore.getState();
      const updatedInteractions = new Map(store.postInteractions);
      updatedInteractions.set(interactionPostId, {
        postId: interactionPostId,
        likeCount: mapped.likeCount,
        commentCount: mapped.commentCount,
        shareCount: mapped.shareCount,
        isLiked: storeData?.isLiked ?? mapped.isLiked,
        isShared: storeData?.isShared ?? mapped.isShared,
      });
      useInteractionStore.setState({ postInteractions: updatedInteractions });
    }
  }, [postResponse, postId, router]);

  const error = queryError ? 'Failed to load post' : null;

  // Subscribe to interaction store changes and update post state
  useEffect(() => {
    const unsubscribe = useInteractionStore.subscribe((state) => {
      const storeData = state.postInteractions.get(postId);
      if (storeData) {
        setPost((prev) => {
          if (!prev) return null;

          // Only update if values actually changed to avoid unnecessary re-renders
          if (
            prev.likeCount === storeData.likeCount &&
            prev.commentCount === storeData.commentCount &&
            prev.shareCount === storeData.shareCount &&
            prev.isLiked === storeData.isLiked &&
            prev.isShared === storeData.isShared
          ) {
            return prev;
          }

          return {
            ...prev,
            likeCount: storeData.likeCount,
            commentCount: storeData.commentCount,
            shareCount: storeData.shareCount,
            isLiked: storeData.isLiked,
            isShared: storeData.isShared,
          };
        });
      }
    });

    return () => unsubscribe();
  }, [postId]);

  if (isLoading) {
    return (
      <PageContainer
        noPadding
        className="!overflow-visible flex w-full flex-col"
      >
        <div className="relative flex min-h-screen flex-1">
          {/* Desktop loading */}
          <div className="hidden min-w-0 flex-1 flex-col border-border lg:flex lg:border-r lg:border-l">
            <div className="flex-1 bg-background">
              <div className="w-full lg:mx-auto lg:max-w-[700px]">
                <div className="space-y-4 sm:px-4 sm:py-6">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>
          </div>
          <WidgetSidebar showLatestNews={false} showMarkets={false} />
          {/* Mobile loading */}
          <div className="flex flex-1 flex-col lg:hidden">
            <div className="space-y-4 sm:px-4 sm:py-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !post) {
    return (
      <PageContainer
        noPadding
        className="!overflow-visible flex w-full flex-col"
      >
        <div className="relative flex min-h-screen flex-1">
          {/* Desktop error */}
          <div className="hidden min-w-0 flex-1 flex-col border-border lg:flex lg:border-r lg:border-l">
            <div className="flex flex-1 flex-col items-center justify-center bg-background">
              <div className="text-center">
                <h1 className="mb-2 font-bold text-2xl">Post Not Found</h1>
                <p className="mb-4 text-muted-foreground">
                  {error || 'The post you are looking for does not exist.'}
                </p>
                <button
                  onClick={() => router.push('/feed')}
                  className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Back to Feed
                </button>
              </div>
            </div>
          </div>
          <WidgetSidebar showLatestNews={false} showMarkets={false} />
          {/* Mobile error */}
          <div className="flex flex-1 flex-col items-center justify-center lg:hidden">
            <div className="px-4 text-center">
              <h1 className="mb-2 font-bold text-2xl">Post Not Found</h1>
              <p className="mb-4 text-muted-foreground">
                {error || 'The post you are looking for does not exist.'}
              </p>
              <button
                onClick={() => router.push('/feed')}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Back to Feed
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer noPadding className="!overflow-visible flex w-full flex-col">
      <div className="relative flex min-h-screen flex-1">
        {/* Desktop: Post content area */}
        <div className="hidden min-w-0 flex-1 flex-col border-border lg:flex lg:border-r lg:border-l">
          {/* Desktop: Top bar with back button */}
          <div className="sticky top-0 z-10 shrink-0 bg-background shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#0066FF]" />
                  <h1 className="font-semibold text-lg">Post</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Post content */}
          <div className="flex-1 bg-background">
            <div className="w-full lg:mx-auto lg:max-w-[700px]">
              {/* Post */}
              <div className="border-border border-b">
                {post.type === 'article' &&
                post.fullContent &&
                post.fullContent.length > 100 ? (
                  // Article detail view - Only show if has substantial full content (> 100 chars)
                  <article className="px-4 py-4 sm:px-6 sm:py-5">
                    {/* Category badge */}
                    {post.category && (
                      <div className="mb-4">
                        <span className="rounded bg-[#0066FF]/20 px-3 py-1 font-semibold text-[#0066FF] text-sm uppercase">
                          {post.category}
                        </span>
                      </div>
                    )}

                    {/* Article title */}
                    <h1 className="mb-4 font-bold text-3xl text-foreground leading-tight sm:text-4xl">
                      {post.articleTitle || 'Untitled Article'}
                    </h1>

                    {/* Article metadata */}
                    <div className="mb-6 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                      <span className="font-semibold text-[#0066FF]">
                        {post.authorName}
                      </span>
                      {post.byline && (
                        <>
                          <span>·</span>
                          <span>{post.byline}</span>
                        </>
                      )}
                      <span>·</span>
                      <time>
                        {new Date(post.timestamp).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>

                    {/* Full article content */}
                    <div className="prose prose-lg prose-invert mb-6 max-w-none">
                      {post.fullContent.split('\n\n').map((paragraph, i) => (
                        <p
                          key={i}
                          className="mb-4 text-base text-foreground leading-relaxed sm:text-lg"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Interaction bar */}
                    <div className="mt-6 border-border border-t pt-4">
                      <InteractionBar
                        postId={post.id}
                        initialInteractions={{
                          postId: post.id,
                          likeCount: post.likeCount,
                          commentCount: post.commentCount,
                          shareCount: post.shareCount,
                          isLiked: post.isLiked,
                          isShared: post.isShared,
                        }}
                        postData={post}
                        onCommentClick={handleCommentClick}
                      />
                    </div>
                  </article>
                ) : (
                  // Regular post
                  <PostCard
                    post={post}
                    showInteractions={true}
                    isDetail
                    onCommentClick={handleCommentClick}
                  />
                )}
              </div>

              {/* Comments Section - Always visible below the post */}
              <FeedCommentSection postId={postId} postData={post} />
            </div>
          </div>
        </div>

        {/* Widget sidebar - desktop only */}
        <WidgetSidebar showLatestNews={false} showMarkets={false} />

        {/* Mobile/Tablet: Single column layout */}
        <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
          {/* Mobile header */}
          <div className="sticky top-0 z-10 shrink-0 border-border border-b bg-background">
            <div className="flex items-center gap-4 px-4 py-3">
              <button
                onClick={handleBack}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#0066FF]" />
                <h1 className="font-semibold text-lg">Post</h1>
              </div>
            </div>
          </div>

          {/* Mobile content */}
          <div className="flex-1 overflow-y-auto">
            {/* Post */}
            <div className="border-border border-b">
              {post.type === 'article' &&
              post.fullContent &&
              post.fullContent.length > 100 ? (
                // Article detail view - Only show if has substantial full content (> 100 chars)
                <article className="px-4 py-4 sm:px-6 sm:py-5">
                  {/* Category badge */}
                  {post.category && (
                    <div className="mb-4">
                      <span className="rounded bg-[#0066FF]/20 px-3 py-1 font-semibold text-[#0066FF] text-sm uppercase">
                        {post.category}
                      </span>
                    </div>
                  )}

                  {/* Article title */}
                  <h1 className="mb-4 font-bold text-2xl text-foreground leading-tight sm:text-3xl">
                    {post.articleTitle || 'Untitled Article'}
                  </h1>

                  {/* Article metadata */}
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                    <span className="font-semibold text-[#0066FF]">
                      {post.authorName}
                    </span>
                    {post.byline && (
                      <>
                        <span>·</span>
                        <span>{post.byline}</span>
                      </>
                    )}
                    <span>·</span>
                    <time>
                      {new Date(post.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>

                  {/* Full article content */}
                  <div className="prose prose-invert mb-4 max-w-none">
                    {post.fullContent.split('\n\n').map((paragraph, i) => (
                      <p
                        key={i}
                        className="mb-4 text-base text-foreground leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Interaction bar */}
                  <div className="mt-4 border-border border-t pt-4">
                    <InteractionBar
                      postId={post.id}
                      initialInteractions={{
                        postId: post.id,
                        likeCount: post.likeCount,
                        commentCount: post.commentCount,
                        shareCount: post.shareCount,
                        isLiked: post.isLiked,
                        isShared: post.isShared,
                      }}
                      postData={post}
                      onCommentClick={handleCommentClick}
                    />
                  </div>
                </article>
              ) : (
                // Regular post
                <PostCard
                  post={post}
                  showInteractions={true}
                  isDetail
                  onCommentClick={handleCommentClick}
                />
              )}
            </div>

            {/* Comments Section - Always visible below the post */}
            <FeedCommentSection postId={postId} postData={post} />
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {isCommentModalOpen && (
        <FeedCommentSection
          postId={postId}
          postData={post}
          onClose={() => setIsCommentModalOpen(false)}
        />
      )}
    </PageContainer>
  );
}
