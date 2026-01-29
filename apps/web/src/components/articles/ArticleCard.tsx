'use client';

import { cn } from '@babylon/shared';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { z } from 'zod';
import { Avatar } from '@/components/shared/Avatar';

const _ArticleCardPostSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  content: z.string(),
  fullContent: z.string().nullable().optional(),
  articleTitle: z.string().nullable().optional(),
  byline: z.string().nullable().optional(),
  biasScore: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  authorId: z.string(),
  authorName: z.string(),
  authorUsername: z.string().nullable().optional(),
  authorProfileImageUrl: z.string().nullable().optional(),
  timestamp: z.string(),
});

export type ArticleCardProps = {
  post: z.infer<typeof _ArticleCardPostSchema>;
  className?: string;
  onClick?: () => void;
};

export const ArticleCard = memo(function ArticleCard({
  post,
  className,
  onClick,
}: ArticleCardProps) {
  const router = useRouter();
  const publishedDate = new Date(post.timestamp);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
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
    timeAgo = publishedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year:
        publishedDate.getFullYear() !== now.getFullYear()
          ? 'numeric'
          : undefined,
    });
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/article/${post.id}`);
    }
  };

  return (
    <article
      className={cn(
        'px-4 py-4',
        'cursor-pointer transition-all duration-200 hover:bg-muted/30',
        'w-full overflow-hidden',
        'border-border border-b',
        className
      )}
      onClick={handleClick}
    >
      {/* Two-column layout: Avatar | Content */}
      <div className="flex gap-3">
        {/* Left column: Avatar */}
        <Link
          href={`/profile/${post.authorId}`}
          className="shrink-0 transition-opacity hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar
            id={post.authorId}
            name={post.authorName}
            type="business"
            size="md"
            src={post.authorProfileImageUrl || undefined}
          />
        </Link>

        {/* Right column: All content */}
        <div className="min-w-0 flex-1">
          {/* Author row: Name · @handle · Category | timeAgo right-aligned */}
          <div className="mb-2 flex items-center justify-between gap-1.5 text-[15px] leading-tight">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={`/profile/${post.authorId}`}
                className="truncate font-semibold text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {post.authorName}
              </Link>
              {post.authorUsername && (
                <Link
                  href={`/profile/${post.authorId}`}
                  className="truncate text-muted-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{post.authorUsername}
                </Link>
              )}
              {post.category && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="shrink-0 font-semibold text-[#0066FF] text-xs uppercase tracking-wide">
                    {post.category}
                  </span>
                </>
              )}
            </div>
            <time
              className="shrink-0 text-[15px] text-muted-foreground"
              title={publishedDate.toLocaleString()}
            >
              {timeAgo}
            </time>
          </div>

          {/* Cover image */}
          {post.imageUrl && (
            <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={post.imageUrl}
                alt={post.articleTitle || 'Article image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}

          {/* Article Title */}
          <h2 className="mb-1.5 line-clamp-2 font-bold text-foreground text-lg leading-tight">
            {post.articleTitle || 'Untitled Article'}
          </h2>

          {/* Summary */}
          <p className="mb-3 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
            {post.content}
          </p>

          {/* Footer */}
          <div className="flex flex-col gap-1">
            {post.byline && (
              <span className="truncate text-muted-foreground text-xs">
                {post.byline}
              </span>
            )}
            <span className="text-[#0066FF] text-sm">Read Full Article →</span>
          </div>
        </div>
      </div>
    </article>
  );
});
