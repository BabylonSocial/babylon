'use client';

import type { InteractionBarProps } from '@babylon/shared';
import { cn } from '@babylon/shared';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FeedCommentSection } from '@/components/feed/FeedCommentSection';
import { useAuth } from '@/hooks/useAuth';
import { useInteractionStore } from '@/stores/interactionStore';
import { DeleteButton } from './DeleteButton';
import { LikeButton } from './LikeButton';
import { RepostButton } from './RepostButton';

/**
 * Interaction bar component for post interactions.
 *
 * Displays like, comment, and share buttons with counts. Manages
 * interaction state via Zustand store with polling for real-time
 * updates. Opens comment section or login modal based on auth state.
 *
 * Features:
 * - Like button with reaction picker
 * - Comment button with count
 * - Share/repost button
 * - Delete button (for post author)
 * - Real-time count updates via polling
 *
 * @param props - InteractionBar component props
 * @returns Interaction bar element
 *
 * @example
 * ```tsx
 * <InteractionBar
 *   postId="post-123"
 *   initialInteractions={{
 *     likeCount: 10,
 *     commentCount: 5,
 *     shareCount: 2
 *   }}
 * />
 * ```
 */
export function InteractionBar({
  postId,
  initialInteractions,
  onCommentClick,
  className,
  postData,
}: InteractionBarProps) {
  const [showComments, setShowComments] = useState(false);
  const { postInteractions } = useInteractionStore();
  const { authenticated, login } = useAuth();

  // Determine if this is a simple repost (no quote commentary)
  // Simple repost: has originalPostId but no quote commentary
  // Quote post: has originalPostId AND has quote commentary (isQuote or quoteComment)
  const isSimpleRepost =
    postData?.originalPostId && !postData?.isQuote && !postData?.quoteComment;

  // For SIMPLE reposts only, use the original post ID for tracking interactions
  // This ensures interactions on a simple repost affect the original post
  // For QUOTE posts, use the quote post's own ID (they have independent interactions)
  const interactionPostId =
    isSimpleRepost && postData?.originalPostId
      ? postData.originalPostId
      : postId;

  // Get interaction data from store (synced via polling) or fall back to initial values
  const storeData = postInteractions.get(interactionPostId);
  const likeCount = storeData?.likeCount ?? initialInteractions?.likeCount ?? 0;
  const commentCount =
    storeData?.commentCount ?? initialInteractions?.commentCount ?? 0;
  const shareCount =
    storeData?.shareCount ?? initialInteractions?.shareCount ?? 0;
  const isLiked = storeData?.isLiked ?? initialInteractions?.isLiked ?? false;
  const isShared =
    storeData?.isShared ?? initialInteractions?.isShared ?? false;

  // Sync store with API data while preserving optimistic updates
  // - Always update counts from API (source of truth for totals)
  // - Preserve isLiked/isShared from store if user has interacted (optimistic state)
  // - Don't update during loading (optimistic update in progress)
  useEffect(() => {
    if (!initialInteractions) return;

    const store = useInteractionStore.getState();
    const currentStoreData = store.postInteractions.get(interactionPostId);
    const isLoading = store.loadingStates.get(interactionPostId);

    // Don't overwrite if there's an in-progress optimistic update
    if (isLoading) return;

    const newLikeCount = initialInteractions.likeCount ?? 0;
    const newCommentCount = initialInteractions.commentCount ?? 0;
    const newShareCount = initialInteractions.shareCount ?? 0;

    // Check if counts have changed to prevent unnecessary updates
    const countsChanged =
      !currentStoreData ||
      currentStoreData.likeCount !== newLikeCount ||
      currentStoreData.commentCount !== newCommentCount ||
      currentStoreData.shareCount !== newShareCount;

    if (countsChanged) {
      const updatedInteractions = new Map(store.postInteractions);
      updatedInteractions.set(interactionPostId, {
        postId: interactionPostId,
        // Always use fresh counts from API
        likeCount: newLikeCount,
        commentCount: newCommentCount,
        shareCount: newShareCount,
        // Preserve user's interaction state from store, fallback to API
        isLiked:
          currentStoreData?.isLiked ?? initialInteractions.isLiked ?? false,
        isShared:
          currentStoreData?.isShared ?? initialInteractions.isShared ?? false,
      });
      useInteractionStore.setState({ postInteractions: updatedInteractions });
    }
  }, [interactionPostId, initialInteractions]);

  const handleCommentClick = () => {
    if (!authenticated) {
      login();
      return;
    }
    // If custom onCommentClick is provided, use that instead of opening our own modal
    if (onCommentClick) {
      onCommentClick();
    } else {
      setShowComments(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          className,
          'mt-2 flex w-full items-center justify-between gap-6 text-muted-foreground'
        )}
      >
        {/* Comment button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering post onClick
            handleCommentClick();
          }}
          className={cn(
            'flex items-center gap-1',
            'bg-transparent transition-all duration-200 hover:opacity-70',
            'cursor-pointer text-muted-foreground text-xs'
          )}
        >
          <MessageCircle size={18} />
          {commentCount > 0 && (
            <span className="font-medium tabular-nums">{commentCount}</span>
          )}
        </button>

        {/* Share button */}
        <div onClick={(e) => e.stopPropagation()}>
          <RepostButton
            postId={interactionPostId}
            shareCount={shareCount}
            initialShared={isShared}
            size="sm"
            showCount
            postData={
              postData
                ? {
                    id: postData.id,
                    content: postData.content,
                    authorId: postData.authorId,
                    authorName: postData.authorName,
                    authorUsername: postData.authorUsername,
                    authorProfileImageUrl: postData.authorProfileImageUrl,
                    timestamp: postData.timestamp,
                  }
                : undefined
            }
          />
        </div>

        {/* Like button with reaction picker */}
        <div onClick={(e) => e.stopPropagation()}>
          <LikeButton
            targetId={interactionPostId}
            targetType="post"
            initialLiked={isLiked}
            initialCount={likeCount}
            size="sm"
            showCount
          />
        </div>

        {/* Delete button (only visible to post author) */}
        <div onClick={(e) => e.stopPropagation()}>
          <DeleteButton
            postId={postId}
            postAuthorId={postData?.authorId || ''}
            size="sm"
          />
        </div>
      </div>

      {/* Comment modal - only if custom onCommentClick is not provided */}
      {!onCommentClick && showComments && postData && (
        <FeedCommentSection
          postId={postId}
          postData={{
            id: postData.id,
            content: postData.content,
            authorId: postData.authorId,
            authorName: postData.authorName,
            authorUsername: postData.authorUsername ?? null,
            authorProfileImageUrl: postData.authorProfileImageUrl ?? null,
            timestamp: postData.timestamp,
            likeCount: postData.likeCount ?? 0,
            commentCount: postData.commentCount ?? 0,
            shareCount: postData.shareCount ?? 0,
            isLiked: postData.isLiked ?? false,
            isShared: postData.isShared ?? false,
          }}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  );
}
