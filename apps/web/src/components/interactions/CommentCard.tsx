'use client';

import type { CommentCardProps, CommentData } from '@babylon/shared';
import { cn, getProfileUrl } from '@babylon/shared';
import {
  Edit2,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ModerationMenu } from '@/components/moderation/ModerationMenu';
import { formatTimeAgo } from '@/components/posts/CommentPreview';
import { Avatar } from '@/components/shared/Avatar';
import { TaggedText } from '@/components/shared/TaggedText';
import {
  isNpcIdentifier,
  VerifiedBadge,
} from '@/components/shared/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { useMenuPosition } from '@/hooks/useMenuPosition';
import { MAX_REPLY_COUNT } from '@/lib/constants';
import { CommentInput } from './CommentInput';
import { LikeButton } from './LikeButton';

// Menu dimensions for edit/delete dropdown
const MENU_HEIGHT = 100;
const MENU_WIDTH = 120;

/**
 * Recursive reply type for counting
 */
interface ReplyWithReplies {
  replies?: ReplyWithReplies[];
}

/**
 * Count total replies recursively
 */
function countAllReplies(replies: ReplyWithReplies[]): number {
  let count = replies.length;
  for (const reply of replies) {
    if (reply.replies && reply.replies.length > 0) {
      count += countAllReplies(reply.replies);
    }
  }
  return count;
}

/**
 * Comment card component for displaying comments with Twitter-like threading.
 *
 * Displays a comment with user avatar, content, timestamp, and actions
 * (like, reply, edit, delete). Uses page-based navigation for replies -
 * clicking the reply count navigates to a dedicated comment thread page.
 *
 * @param props - CommentCard component props
 * @returns Comment card element
 *
 * @example
 * ```tsx
 * <CommentCard
 *   comment={commentData}
 *   postId="post-123"
 *   onReply={handleReply}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function CommentCard({
  comment,
  postId,
  onReply,
  onEdit,
  onDelete,
  onReplySubmit,
  className,
}: CommentCardProps) {
  const router = useRouter();
  const { user, authenticated, login } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // Use custom hook for menu positioning
  const {
    buttonRef: actionButtonRef,
    menuPosition,
    updatePosition,
    mounted,
  } = useMenuPosition(showActions, {
    menuHeight: MENU_HEIGHT,
    menuWidth: MENU_WIDTH,
    padding: 4,
  });

  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = hasReplies ? countAllReplies(comment.replies) : 0;

  const showVerifiedBadge = isNpcIdentifier(comment.userId);
  const isOwnComment = user?.id === comment.userId;
  const authorIsNPC = isNpcIdentifier(comment.userId);

  const handleReply = () => {
    if (!authenticated) {
      login();
      return;
    }
    setIsReplying(true);
    if (onReply) {
      onReply(comment.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowActions(false);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
    setShowActions(false);
  };

  // Navigate to comment thread page
  const handleNavigateToThread = () => {
    router.push(`/comment/${comment.id}`);
  };

  return (
    <div
      className={cn(
        'border-border border-b px-4 py-4',
        'cursor-pointer transition-all duration-200 hover:bg-muted/30',
        className
      )}
      onClick={handleNavigateToThread}
    >
      <div className="flex gap-3">
        {/* Avatar - Round */}
        <Link
          href={getProfileUrl(comment.userId, comment.userUsername)}
          className="shrink-0 transition-opacity hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            id={comment.userId}
            name={comment.userName}
            size="sm"
            src={comment.userAvatar || undefined}
            imageUrl={comment.userAvatar || undefined}
          />
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header: Username/handle on left, timestamp and actions on right */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Link
                href={getProfileUrl(comment.userId, comment.userUsername)}
                className="truncate font-semibold text-sm hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {comment.userName}
              </Link>
              {showVerifiedBadge && (
                <VerifiedBadge size="sm" className="-ml-1" />
              )}
              <Link
                href={getProfileUrl(comment.userId, comment.userUsername)}
                className="truncate text-muted-foreground text-xs hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{comment.userUsername || comment.userName}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Timestamp - Right aligned */}
              <span className="text-muted-foreground text-xs">
                {formatTimeAgo(new Date(comment.createdAt).toISOString())}
              </span>

              {/* Actions menu - different for own vs others' comments */}
              {isOwnComment ? (
                // Own comment: Show Edit/Delete
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    ref={actionButtonRef}
                    type="button"
                    onClick={() => {
                      if (!showActions) {
                        updatePosition();
                      }
                      setShowActions(!showActions);
                    }}
                    className="rounded-lg p-2 transition-colors hover:bg-muted"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </button>

                  {/* Only render portal on client side (mounted check for SSR compatibility) */}
                  {showActions &&
                    mounted &&
                    createPortal(
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowActions(false)}
                        />

                        {/* Dropdown */}
                        <div
                          className="fade-in slide-in-from-top-2 fixed z-50 min-w-[120px] animate-in rounded-md border border-border bg-popover py-1 shadow-lg duration-150"
                          style={{
                            top: menuPosition.openUpward
                              ? 'auto'
                              : menuPosition.top,
                            bottom: menuPosition.openUpward
                              ? menuPosition.windowHeight - menuPosition.top
                              : 'auto',
                            left: menuPosition.left,
                          }}
                        >
                          <button
                            type="button"
                            onClick={handleEdit}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-destructive text-sm transition-colors hover:bg-muted"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>,
                      document.body
                    )}
                </div>
              ) : user ? (
                // Other user's comment: Show ModerationMenu (Follow/Mute/Block/Report)
                <div onClick={(e) => e.stopPropagation()}>
                  <ModerationMenu
                    targetUserId={comment.userId}
                    targetUsername={comment.userUsername || undefined}
                    targetDisplayName={comment.userName}
                    targetProfileImageUrl={comment.userAvatar || undefined}
                    isNPC={authorIsNPC}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Replying to indicator */}
          {comment.parentCommentId && comment.parentCommentAuthorName && (
            <div className="mb-1 flex items-center gap-1 text-muted-foreground text-xs">
              <span>Replying to</span>
              <span className="font-medium text-primary">
                @{comment.parentCommentAuthorName}
              </span>
            </div>
          )}

          {/* Comment body */}
          {isEditing ? (
            <div className="mb-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] w-full resize-none rounded-md border border-border bg-muted p-2 text-sm focus:border-border focus:outline-none"
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="rounded-md bg-primary px-3 py-1 text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <p className="whitespace-pre-wrap break-words text-foreground text-sm">
                <TaggedText
                  text={comment.content}
                  onTagClick={(tag) => {
                    if (tag.startsWith('@')) {
                      // Handle @mentions - route to profile
                      const username = tag.slice(1);
                      router.push(getProfileUrl('', username));
                    } else if (tag.startsWith('$')) {
                      // Handle $cashtags - route to markets
                      const symbol = tag.slice(1);
                      router.push(
                        `/markets?search=${encodeURIComponent(symbol)}`
                      );
                    }
                  }}
                />
              </p>
            </div>
          )}

          {/* Footer actions - matches feed post InteractionBar style */}
          <div
            className="mt-2 flex w-full items-center justify-between gap-6 text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reply button */}
            <button
              type="button"
              onClick={handleReply}
              className={cn(
                'flex items-center gap-1',
                'bg-transparent transition-all duration-200 hover:opacity-70',
                'cursor-pointer text-muted-foreground text-xs',
                isReplying && 'text-[#0066FF]'
              )}
            >
              <MessageCircle size={18} />
              {hasReplies && (
                <span className="font-medium tabular-nums">
                  {replyCount >= MAX_REPLY_COUNT
                    ? `${MAX_REPLY_COUNT}+`
                    : replyCount}
                </span>
              )}
            </button>

            {/* Repost button (placeholder - not yet implemented) */}
            <div>
              <button
                type="button"
                disabled
                className="flex cursor-default items-center gap-1 text-muted-foreground/40 text-xs"
              >
                <Repeat2 size={18} />
              </button>
            </div>

            {/* Like button */}
            <div>
              <LikeButton
                targetId={comment.id}
                targetType="comment"
                initialLiked={comment.isLiked}
                initialCount={comment.likeCount}
                size="sm"
                showCount
              />
            </div>

            {/* Empty spacer to match post InteractionBar's 4-column layout */}
            <div />
          </div>

          {/* Reply input */}
          {isReplying && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <CommentInput
                postId={postId}
                parentCommentId={comment.id}
                placeholder={`Reply to ${comment.userName}...`}
                replyingToName={comment.userName}
                autoFocus
                onSubmit={async (replyComment: CommentData) => {
                  setIsReplying(false);
                  // Call onReplySubmit callback if provided to handle optimistic update
                  if (onReplySubmit && replyComment) {
                    onReplySubmit(replyComment);
                  }
                }}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
