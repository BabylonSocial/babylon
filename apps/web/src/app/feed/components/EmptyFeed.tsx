'use client';

import { Clock, FileText, Flame, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

type EmptyFeedVariant = 'latest' | 'hot' | 'following' | 'default';

interface EmptyFeedProps {
  variant: EmptyFeedVariant;
  isLoading?: boolean;
}

/**
 * EmptyFeed - Empty state component for different feed scenarios
 *
 * Variants:
 * - latest: No posts in the main feed yet
 * - hot: No hot posts in the last 24 hours
 * - following: User hasn't followed anyone
 * - default: Generic empty state
 */
export function EmptyFeed({ variant, isLoading = false }: EmptyFeedProps) {
  if (variant === 'latest') {
    return (
      <EmptyState
        icon={FileText}
        title="No Posts Yet"
        description="Engine is generating posts. Check terminal for tick logs. Posts appear within 60 seconds."
      />
    );
  }

  if (variant === 'hot') {
    return (
      <EmptyState
        icon={Flame}
        title="No Hot Posts Yet"
        description="Posts with the most engagement in the last 24 hours appear here. Like, comment, and share posts to heat things up!"
      />
    );
  }

  if (variant === 'following') {
    return (
      <EmptyState
        icon={Users}
        title="Not Following Anyone Yet"
        description={
          isLoading
            ? 'Loading following...'
            : 'Follow profiles to see their posts here. Visit a profile and click the Follow button.'
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Clock}
      title="No Posts Yet"
      description="Game tick runs every 60 seconds. Content will appear here as it's generated."
    />
  );
}
