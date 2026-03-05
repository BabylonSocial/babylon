/**
 * Moderation Settings Page
 *
 * Manage blocked and muted users
 */

'use client';

import { getListBlocksQueryKey, getListMutesQueryKey, useBlockUser, useListBlocks, useListMutes, useMuteUser } from '@babylon/api-hooks';
import { cn } from '@babylon/shared';
import { Ban, Trash2, UserX, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/shared/Avatar';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'blocked' | 'muted';

export default function ModerationSettingsPage() {
  const { authenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('blocked');

  const {
    data: blocksData,
    isLoading: blocksLoading,
    refetch: refetchBlocks,
  } = useListBlocks(undefined, {
    query: { queryKey: getListBlocksQueryKey(), enabled: authenticated },
  });

  const {
    data: mutesData,
    isLoading: mutesLoading,
    refetch: refetchMutes,
  } = useListMutes(undefined, {
    query: { queryKey: getListMutesQueryKey(), enabled: authenticated },
  });

  const blockedUsers = blocksData?.blocks ?? [];
  const mutedUsers = mutesData?.mutes ?? [];
  const loading = blocksLoading || mutesLoading;

  const blockUserMutation = useBlockUser();
  const muteUserMutation = useMuteUser();

  const handleUnblock = async (userId: string, displayName: string) => {
    try {
      await blockUserMutation.mutateAsync({
        userId,
        data: { action: 'unblock' },
      });
      toast.success(`Unblocked ${displayName}`);
      refetchBlocks();
    } catch {
      toast.error('Failed to unblock user');
    }
  };

  const handleUnmute = async (userId: string, displayName: string) => {
    try {
      await muteUserMutation.mutateAsync({
        userId,
        data: { action: 'unmute' },
      });
      toast.success(`Unmuted ${displayName}`);
      refetchMutes();
    } catch {
      toast.error('Failed to unmute user');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!authenticated) {
    return (
      <PageContainer className="pt-14 md:pt-0">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Please log in to view moderation settings.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-14 md:pt-0">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 font-bold text-3xl">Moderation Settings</h1>
          <p className="text-muted-foreground">
            Manage your blocked and muted users
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-border border-b">
          <button
            onClick={() => setActiveTab('blocked')}
            className={cn(
              '-mb-[1px] flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors',
              activeTab === 'blocked'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Ban className="h-4 w-4" />
            Blocked ({blockedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('muted')}
            className={cn(
              '-mb-[1px] flex items-center gap-2 border-b-2 px-4 py-2 font-medium transition-colors',
              activeTab === 'muted'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <VolumeX className="h-4 w-4" />
            Muted ({mutedUsers.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {/* Blocked Users */}
            {activeTab === 'blocked' && (
              <div className="space-y-3">
                {blockedUsers.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card py-12 text-center">
                    <UserX className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No blocked users</p>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Users you block will appear here
                    </p>
                  </div>
                ) : (
                  blockedUsers.map((block) => {
                    const user = block.blocked;
                    if (!user) return null;
                    const displayName =
                      user.displayName || user.username || 'User';

                    return (
                      <div
                        key={block.id}
                        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                      >
                        <Avatar
                          src={user.profileImageUrl || undefined}
                          alt={displayName}
                          size="md"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{displayName}</div>
                          {user.username && (
                            <div className="text-muted-foreground text-sm">
                              @{user.username}
                            </div>
                          )}
                          <div className="mt-1 text-muted-foreground text-xs">
                            Blocked {formatDate(block.createdAt)}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnblock(user.id, displayName)}
                          className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 transition-colors hover:bg-muted/80"
                        >
                          <Trash2 className="h-4 w-4" />
                          Unblock
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Muted Users */}
            {activeTab === 'muted' && (
              <div className="space-y-3">
                {mutedUsers.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card py-12 text-center">
                    <VolumeX className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No muted users</p>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Users you mute will appear here
                    </p>
                  </div>
                ) : (
                  mutedUsers.map((mute) => {
                    const user = mute.muted;
                    if (!user) return null;
                    const displayName =
                      user.displayName || user.username || 'User';

                    return (
                      <div
                        key={mute.id}
                        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                      >
                        <Avatar
                          src={user.profileImageUrl || undefined}
                          alt={displayName}
                          size="md"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{displayName}</div>
                          {user.username && (
                            <div className="text-muted-foreground text-sm">
                              @{user.username}
                            </div>
                          )}
                          <div className="mt-1 text-muted-foreground text-xs">
                            Muted {formatDate(mute.createdAt)}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnmute(user.id, displayName)}
                          className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 transition-colors hover:bg-muted/80"
                        >
                          <Trash2 className="h-4 w-4" />
                          Unmute
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
