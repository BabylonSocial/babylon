'use client';

import { cn } from '@babylon/shared';
import { ArrowLeft, Bot, Loader2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { LoginButton } from '@/components/auth/LoginButton';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import {
  AgentConfigForm,
  EditProfileModal,
  ProfilePreviewCard,
} from './components';
import { useAgentForm } from './hooks';

const TOTAL_PROFILE_PICTURES = 100;
const TOTAL_BANNERS = 100;
const DEFAULT_MAX_DEPOSIT = 10000;

export default function CreateAgentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { ready, authenticated, getAccessToken } = useAuth();

  const balance = user?.reputationPoints ?? 0;

  // Show sign-in prompt for unauthenticated users
  if (!ready || !authenticated) {
    return (
      <PageContainer noPadding className="flex flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <Bot className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-bold text-foreground text-xl">
              Create an Agent
            </h2>
            <p className="mb-6 text-muted-foreground">
              Sign in to create and manage AI agents that can chat and trade
              autonomously
            </p>
            <LoginButton />
          </div>
        </div>
      </PageContainer>
    );
  }

  const [showEditModal, setShowEditModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    profileData,
    agentData,
    isInitialized,
    generatingField,
    updateProfileField,
    updateAgentField,
    setProfileData,
    regenerateField,
    clearDraft,
  } = useAgentForm();

  // User balance for max deposit - default to 10k if balance not available
  const maxDeposit = Math.max(
    100,
    Math.min(balance ?? DEFAULT_MAX_DEPOSIT, DEFAULT_MAX_DEPOSIT)
  );

  // Cycle through pre-made images with direction (next/prev)
  const cycleImage = useCallback(
    (type: 'profile' | 'cover', direction: 'next' | 'prev') => {
      const basePath =
        type === 'profile'
          ? '/assets/user-profiles/profile-'
          : '/assets/user-banners/banner-';
      const totalImages =
        type === 'profile' ? TOTAL_PROFILE_PICTURES : TOTAL_BANNERS;
      const current =
        type === 'profile'
          ? profileData.profileImageUrl
          : profileData.coverImageUrl;

      // Get current index from URL
      let currentIndex = 1;
      if (current?.includes(basePath)) {
        const match = current.match(/-(\d+)\.jpg/);
        if (match) {
          currentIndex = parseInt(match[1]!, 10);
        }
      }

      // Calculate next index based on direction
      let nextIndex: number;
      if (direction === 'next') {
        nextIndex = currentIndex >= totalImages ? 1 : currentIndex + 1;
      } else {
        nextIndex = currentIndex <= 1 ? totalImages : currentIndex - 1;
      }

      const newUrl = `${basePath}${nextIndex}.jpg`;
      updateProfileField(
        type === 'profile' ? 'profileImageUrl' : 'coverImageUrl',
        newUrl
      );
    },
    [profileData.profileImageUrl, profileData.coverImageUrl, updateProfileField]
  );

  // Handle agent creation
  const handleCreate = useCallback(async () => {
    // Validation
    if (!profileData.displayName.trim()) {
      toast.error('Agent name is required');
      return;
    }
    if (!agentData.system.trim()) {
      toast.error('System prompt is required');
      return;
    }

    setIsCreating(true);

    const token = await getAccessToken();
    if (!token) {
      toast.error('Please sign in to create an agent');
      setIsCreating(false);
      return;
    }

    // Split personality by newlines for bio array (original behavior)
    const bioArray = agentData.personality.split('\n').filter((b) => b.trim());

    // Append trading strategy to system prompt (original behavior)
    const systemPrompt = agentData.tradingStrategy.trim()
      ? `${agentData.system}\n\nTrading Strategy: ${agentData.tradingStrategy}`
      : agentData.system;

    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // API expects 'name', not 'displayName'
        name: profileData.displayName,
        // API expects 'description' for the profile bio
        description: profileData.bio,
        profileImageUrl: profileData.profileImageUrl,
        coverImageUrl: profileData.coverImageUrl,
        // Combined system prompt with trading strategy
        system: systemPrompt,
        // Bio array from personality split
        bio: bioArray,
        personality: agentData.personality,
        tradingStrategy: agentData.tradingStrategy,
        initialDeposit: agentData.initialDeposit,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      toast.error(errorData.error || 'Failed to create agent');
      setIsCreating(false);
      return;
    }

    const result = await response.json();
    clearDraft();
    toast.success('Agent created successfully!');
    router.push(`/agents/${result.agent.id}`);
  }, [profileData, agentData, getAccessToken, clearDraft, router]);

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl pb-24">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-[#0066FF]" />
            <div>
              <h1 className="font-bold text-3xl">Create AI Agent</h1>
              <p className="text-muted-foreground">
                Configure your autonomous trading agent
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Preview - Left Column */}
          <div className="space-y-4 lg:col-span-1">
            <ProfilePreviewCard
              profileData={profileData}
              onEdit={() => setShowEditModal(true)}
              onCycleProfilePic={(direction) =>
                cycleImage('profile', direction)
              }
              onCycleBanner={(direction) => cycleImage('cover', direction)}
              isLoading={!isInitialized}
            />

            {/* Balance Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Funding</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Initial Deposit</span>
                  <span className="font-medium font-mono">
                    {agentData.initialDeposit.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-medium font-mono">
                    {(balance ?? 0).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration - Right Column */}
          <div className="space-y-6 lg:col-span-2">
            {isInitialized ? (
              <>
                <AgentConfigForm
                  agentData={agentData}
                  generatingField={generatingField}
                  maxDeposit={maxDeposit}
                  onFieldChange={updateAgentField}
                  onRegenerate={regenerateField}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 border-border border-t pt-6">
                  <button
                    onClick={() => router.push('/agents')}
                    disabled={isCreating}
                    className={cn(
                      'rounded-lg border border-border px-6 py-3 font-medium transition-colors',
                      'text-muted-foreground hover:bg-muted hover:text-foreground',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !isInitialized}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all',
                      'bg-[#0066FF] text-primary-foreground hover:bg-[#2952d9]',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Agent'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {/* Loading skeleton for form */}
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-28 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profileData={profileData}
          onSave={setProfileData}
        />
      )}
    </PageContainer>
  );
}
