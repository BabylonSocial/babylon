'use client';

import { Repeat2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent,
  type MouseEvent,
  memo,
  useEffect,
  useState,
} from 'react';
import { InteractionBar } from '@/components/interactions';
import { ModerationMenu } from '@/components/moderation/ModerationMenu';
import { Avatar } from '@/components/shared/Avatar';
import { TaggedText } from '@/components/shared/TaggedText';
import {
  isNpcIdentifier,
  VerifiedBadge,
} from '@/components/shared/VerifiedBadge';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useAuth } from '@/hooks/useAuth';
import { getProfileUrl } from '@babylon/shared';
import { cn } from '@babylon/shared';
import type { PostInteraction } from '@babylon/shared';

/**
 * Post card component for displaying feed posts.
 *
 * Displays a post with author info, content, timestamp, and interaction bar.
 * Supports reposts, quote posts, articles, and regular posts. Handles
 * client-side repost parsing if API doesn't provide metadata. Includes
 * moderation menu and responsive behavior.
 *
 * Features:
 * - Author avatar and verified badge
 * - Tagged text parsing (@mentions, #hashtags, $cashtags)
 * - Repost/quote post display
 * - Article type support
 * - Interaction bar (like, comment, share)
 * - Moderation menu
 * - Responsive layout
 *
 * @param props - PostCard component props
 * @returns Post card element
 *
 * @example
 * ```tsx
 * <PostCard
 *   post={postData}
 *   showInteractions={true}
 *   onCommentClick={() => openComments()}
 * />
 * ```
 */
export interface PostCardProps {
  post: {
    id: string;
    type?: string; // "post" | "article"
    content: string;
    articleTitle?: string | null;
    byline?: string | null;
    biasScore?: number | null;
    sentiment?: string | null;
    category?: string | null;
    authorId: string;
    authorName: string;
    authorUsername?: string | null;
    authorProfileImageUrl?: string | null;
    timestamp: string;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    isLiked?: boolean;
    isShared?: boolean;
    deletedAt?: string | null; // Soft delete timestamp
    // Repost metadata
    isRepost?: boolean;
    isQuote?: boolean; // True if it has quote commentary
    quoteComment?: string | null; // The quote commentary text
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
  className?: string;
  onCommentClick?: () => void;
  showInteractions?: boolean;
  isDetail?: boolean;
}

export const PostCard = memo(function PostCard({
  post,
  className,
  onCommentClick,
  showInteractions = true,
  isDetail = false,
}: PostCardProps) {
  const router = useRouter();
  const { fontSize } = useFontSize();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 640);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const postDate = new Date(post.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - postDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  let timeAgo: string;
  if (diffMinutes < 1) {
    timeAgo = 'Just now';
  } else if (diffMinutes < 60) {
    timeAgo = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`;
  } else {
    // Show date for posts older than 24 hours
    timeAgo = postDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year:
        postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  const initialInteractions: PostInteraction = {
    postId: post.id,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    shareCount: post.shareCount ?? 0,
    isLiked: post.isLiked ?? false,
    isShared: post.isShared ?? false,
  };

  // Determine if this is a simple repost (no quote) or a quote post
  // Simple repost: isRepost && !isQuote (or !quoteComment)
  // Quote post: isRepost && isQuote (or has quoteComment)
  const isSimpleRepost = post.isRepost && !post.isQuote && !post.quoteComment;

  // For QUOTE posts, show the REPOSTER's info in the header
  // For simple reposts, show the ORIGINAL author's info
  const displayAuthorId =
    isSimpleRepost && post.originalPost
      ? post.originalPost.authorId
      : post.authorId;
  const displayAuthorName =
    isSimpleRepost && post.originalPost
      ? post.originalPost.authorName
      : post.authorName;
  const displayAuthorUsername =
    isSimpleRepost && post.originalPost
      ? post.originalPost.authorUsername
      : post.authorUsername;
  const displayAuthorProfileImageUrl =
    isSimpleRepost && post.originalPost
      ? post.originalPost.authorProfileImageUrl
      : post.authorProfileImageUrl;

  const authorIsNPC = isNpcIdentifier(displayAuthorId);
  const showVerifiedBadge = authorIsNPC;

  // For quote posts with deleted originals, link to the quote post itself
  // For other reposts, link to the original post (if it exists)
  const quotedPostId = post.originalPost
    ? post.originalPostId
    : post.isRepost && post.isQuote
      ? post.id
      : null;

  // Internal click handler that navigates to the correct post
  // For simple reposts, navigate to the original post
  // For quote posts and regular posts, navigate to the post itself
  const handleCardClick = () => {
    // For simple reposts, go to the original post
    if (isSimpleRepost && post.originalPostId) {
      router.push(`/post/${post.originalPostId}`);
    } else {
      // For quote posts and regular posts, go to this post
      router.push(`/post/${post.id}`);
    }
  };

  const handleQuotedPostClick = (event: MouseEvent<HTMLDivElement>) => {
    // Always stop propagation to prevent parent card click
    event.preventDefault();
    event.stopPropagation();

    // Only navigate if we have a valid post ID
    if (quotedPostId) {
      router.push(`/post/${quotedPostId}`);
    }
  };

  const handleQuotedPostKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    // Always stop propagation to prevent parent card click
    event.preventDefault();
    event.stopPropagation();

    // Only navigate if we have a valid post ID
    if (quotedPostId) {
      router.push(`/post/${quotedPostId}`);
    }
  };

  // If post is deleted, show a minimal placeholder
  if (post.deletedAt) {
    return (
      <article
        className={cn(
          'px-4 py-3',
          'w-full overflow-hidden',
          'border-border/5 border-b',
          className
        )}
      >
        <div className="flex items-center justify-center py-8 text-muted-foreground italic">
          (no post)
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'px-4 py-3',
        !isDetail &&
          'cursor-pointer transition-all duration-200 hover:bg-muted/30',
        'w-full overflow-hidden',
        'border-border/5 border-b',
        className
      )}
      style={{
        fontSize: `${fontSize}rem`,
      }}
      onClick={!isDetail ? handleCardClick : undefined}
    >
      {/* Repost Indicator - Only show for simple reposts (not quote posts) */}
      {isSimpleRepost && (
        <div className="mb-3 flex items-center gap-3 text-muted-foreground text-sm">
          <Repeat2 size={14} className="text-green-600" />
          <span>
            Reposted by{' '}
            {user?.id === post.authorId ? (
              <span className="font-semibold text-foreground">you</span>
            ) : (
              <Link
                href={getProfileUrl(post.authorId, post.authorUsername)}
                className="font-semibold text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {post.authorName}
              </Link>
            )}
          </span>
        </div>
      )}

      {/* Row 1: Avatar + Name/Handle/Timestamp Header */}
      {!isSimpleRepost && (
        <div className="mb-3 flex w-full items-start gap-3">
          {/* Avatar - Clickable, Round - Shows original author for simple reposts, reposter for quote posts */}
          <Link
            href={getProfileUrl(displayAuthorId, displayAuthorUsername)}
            className="shrink-0 transition-opacity hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              id={displayAuthorId}
              name={displayAuthorName}
              type={post.type === 'article' ? 'business' : 'actor'}
              size="md"
              src={displayAuthorProfileImageUrl || undefined}
              scaleFactor={
                isDetail
                  ? fontSize
                  : fontSize * (isDesktop ? 1.4 : isMobile ? 0.8 : 1)
              }
            />
          </Link>

          {/* Header: Name/Handle block on left, Timestamp and Menu on right */}
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            {/* Name and Handle stacked vertically - Shows original author for simple reposts, reposter for quote posts */}
            <div className="flex min-w-0 flex-col">
              {/* Name row with verified badge */}
              <div className="flex min-w-0 items-center gap-1.5">
                <Link
                  href={getProfileUrl(displayAuthorId, displayAuthorUsername)}
                  className="truncate font-semibold text-foreground text-lg hover:underline sm:text-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayAuthorName}
                </Link>
                {showVerifiedBadge && (
                  <VerifiedBadge size="md" className="sm:h-6 sm:w-6" />
                )}
              </div>
              {/* Handle row */}
              <Link
                href={getProfileUrl(displayAuthorId, displayAuthorUsername)}
                className="truncate text-base text-muted-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{displayAuthorUsername || displayAuthorId}
              </Link>
            </div>
            {/* Timestamp and Moderation Menu - Right aligned */}
            <div className="flex shrink-0 items-center gap-2">
              <time
                className="text-base text-muted-foreground"
                title={postDate.toLocaleString()}
              >
                {timeAgo}
              </time>
              {/* Show moderation menu only if not your own post */}
              {user && user.id !== displayAuthorId && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ModerationMenu
                    targetUserId={displayAuthorId}
                    targetUsername={displayAuthorUsername || undefined}
                    targetDisplayName={displayAuthorName}
                    targetProfileImageUrl={
                      displayAuthorProfileImageUrl || undefined
                    }
                    postId={post.id}
                    isNPC={authorIsNPC}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Post Content - Full width */}
      {post.type === 'article' ? (
        // Article card - Show title, summary, and "Read more" button
        <div className="mb-3 w-full">
          {/* Article title with Read More Button */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2 className="flex-1 font-bold text-foreground text-lg leading-tight sm:text-xl">
              {post.articleTitle || 'Untitled Article'}
            </h2>
            {!isDetail && (
              <button
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#0066FF] px-3 py-2 font-semibold text-primary-foreground text-sm transition-colors hover:bg-[#2952d9]"
                onClick={handleCardClick}
              >
                Read Full Article →
              </button>
            )}
          </div>

          {/* Article metadata */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            {post.byline && <span>{post.byline}</span>}
          </div>

          {/* Article summary */}
          <div className="mb-3 whitespace-pre-wrap break-words text-foreground leading-relaxed">
            {post.content}
          </div>
        </div>
      ) : post.isRepost ? (
        // Repost (with or without quote comment) - show embedded card
        <div className="mb-4 w-full">
          {/* Quote comment (if present) */}
          {post.quoteComment && (
            <div className="post-content mb-4 whitespace-pre-wrap break-words text-foreground leading-relaxed">
              <TaggedText
                text={post.quoteComment}
                onTagClick={(tag) => {
                  // Extract tag name (remove # prefix) and convert to slug
                  const tagName = tag.startsWith('#') ? tag.slice(1) : tag;
                  const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
                  router.push(`/trending/${encodeURIComponent(tagSlug)}`);
                }}
              />
            </div>
          )}

          {/* Embedded original post */}
          <div
            className={cn(
              'rounded-xl border border-white/10 p-4',
              'bg-white/5',
              'overflow-hidden transition-colors',
              quotedPostId
                ? 'cursor-pointer hover:bg-white/[0.07]'
                : 'cursor-default'
            )}
            role={quotedPostId ? 'link' : undefined}
            tabIndex={quotedPostId ? 0 : undefined}
            aria-label={quotedPostId ? 'View quoted post' : undefined}
            onClick={handleQuotedPostClick}
            onKeyDown={handleQuotedPostKeyDown}
          >
            {post.originalPost ? (
              <>
                {/* Original post author */}
                <div className="mb-3 flex items-start gap-3">
                  <Link
                    href={getProfileUrl(
                      post.originalPost.authorId,
                      post.originalPost.authorUsername
                    )}
                    className="shrink-0 transition-opacity hover:opacity-80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Avatar
                      id={post.originalPost.authorId}
                      name={post.originalPost.authorName}
                      type="actor"
                      size="sm"
                      src={post.originalPost.authorProfileImageUrl || undefined}
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={getProfileUrl(
                          post.originalPost.authorId,
                          post.originalPost.authorUsername
                        )}
                        className="truncate font-semibold text-foreground hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.originalPost.authorName}
                      </Link>
                      {isNpcIdentifier(post.originalPost.authorId) && (
                        <VerifiedBadge size="sm" />
                      )}
                    </div>
                    <Link
                      href={getProfileUrl(
                        post.originalPost.authorId,
                        post.originalPost.authorUsername
                      )}
                      className="text-foreground/50 text-sm hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      @
                      {post.originalPost.authorUsername ||
                        post.originalPost.authorId}
                    </Link>
                  </div>
                </div>

                {/* Original post content */}
                <div className="whitespace-pre-wrap break-words text-foreground/90 leading-relaxed">
                  <TaggedText
                    text={post.originalPost.content}
                    onTagClick={(tag) => {
                      // Extract tag name (remove # prefix) and convert to slug
                      const tagName = tag.startsWith('#') ? tag.slice(1) : tag;
                      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
                      router.push(`/trending/${encodeURIComponent(tagSlug)}`);
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-foreground/50 italic">
                This post has been deleted
              </div>
            )}
          </div>
        </div>
      ) : (
        // Regular post - Show content as normal
        <div className="post-content mb-4 w-full whitespace-pre-wrap break-words text-foreground leading-relaxed">
          <TaggedText
            text={post.content || ''}
            onTagClick={(tag) => {
              // Extract tag name (remove # prefix) and convert to slug
              const tagName = tag.startsWith('#') ? tag.slice(1) : tag;
              const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
              router.push(`/trending/${encodeURIComponent(tagSlug)}`);
            }}
          />
        </div>
      )}

      {/* Row 3: Interaction Bar - Full width */}
      {showInteractions && (
        <div onClick={(e) => e.stopPropagation()} className="w-full">
          <InteractionBar
            postId={post.id}
            initialInteractions={initialInteractions}
            onCommentClick={onCommentClick}
            postData={post}
          />
        </div>
      )}
    </article>
  );
});
