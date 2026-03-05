'use client';

import { useDeleteAgent, useUpdateAgent } from '@babylon/api-hooks';
import { cn } from '@babylon/shared';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Upload,
  X as XIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AgentConfigurationData,
  AgentConfigurationForm,
} from '@/components/agents/AgentConfigurationForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { uploadImage, validateImageFile } from '@/utils/upload-image';

const TOTAL_PROFILE_PICTURES = 100;
const TOTAL_BANNERS = 100;
const MAX_BIO_LENGTH = 160;

enum Step {
  Profile = 1,
  Prompts = 2,
  Settings = 3,
}

interface AgentData {
  id: string;
  username?: string | null;
  name: string;
  description?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  system: string;
  bio?: string[];
  personality?: string;
  tradingStrategy?: string;
  modelTier: 'free' | 'pro';
  isActive: boolean;
  autonomousEnabled: boolean;
  autonomousPosting?: boolean;
  autonomousCommenting?: boolean;
  autonomousDMs?: boolean;
  autonomousGroupChats?: boolean;
  a2aEnabled?: boolean;
}

interface AgentEditModalProps {
  agent: AgentData;
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * Agent Edit Modal
 *
 * Multi-step modal for editing an existing agent.
 * Follows the same UI pattern as the create agent flow.
 */
export function AgentEditModal({
  agent,
  onClose,
  onUpdate,
}: AgentEditModalProps) {
  const router = useRouter();
  const { mutateAsync: updateAgentMutation } = useUpdateAgent();
  const { mutateAsync: deleteAgentMutation } = useDeleteAgent();

  const [currentStep, setCurrentStep] = useState<Step>(Step.Profile);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile data (step 1)
  const [profileData, setProfileData] = useState({
    name: agent.name,
    description: agent.description || '',
    profileImageUrl: agent.profileImageUrl || '',
    coverImageUrl: agent.coverImageUrl || '',
  });

  // Prompts data (step 2)
  const [promptsData, setPromptsData] = useState({
    system: agent.system,
    personality:
      agent.personality ||
      (Array.isArray(agent.bio) ? agent.bio.filter((b) => b).join('\n') : ''),
    tradingStrategy: agent.tradingStrategy || '',
  });

  // Settings data (step 3)
  const [settingsData, setSettingsData] = useState<AgentConfigurationData>({
    modelTier: agent.modelTier,
    autonomousEnabled: agent.autonomousEnabled,
    autonomousPosting: agent.autonomousPosting || false,
    autonomousCommenting: agent.autonomousCommenting || false,
    autonomousDMs: agent.autonomousDMs || false,
    autonomousGroupChats: agent.autonomousGroupChats || false,
    a2aEnabled: agent.a2aEnabled || false,
  });

  // Image upload state
  const [uploadedProfileFile, setUploadedProfileFile] = useState<File | null>(
    null
  );
  const [uploadedBannerFile, setUploadedBannerFile] = useState<File | null>(
    null
  );
  const [profilePictureIndex, setProfilePictureIndex] = useState(() => {
    const match = agent.profileImageUrl?.match(/profile-(\d+)\.jpg/);
    return match?.[1] ? parseInt(match[1], 10) : 1;
  });
  const [bannerIndex, setBannerIndex] = useState(() => {
    const match = agent.coverImageUrl?.match(/banner-(\d+)\.jpg/);
    return match?.[1] ? parseInt(match[1], 10) : 1;
  });
  const [uploadedProfileImage, setUploadedProfileImage] = useState<
    string | null
  >(
    agent.profileImageUrl?.startsWith('/assets/')
      ? null
      : agent.profileImageUrl || null
  );
  const [uploadedBanner, setUploadedBanner] = useState<string | null>(
    agent.coverImageUrl?.startsWith('/assets/')
      ? null
      : agent.coverImageUrl || null
  );

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Computed current images
  const currentProfileImage = useMemo(() => {
    return (
      uploadedProfileImage ||
      `/assets/user-profiles/profile-${profilePictureIndex}.jpg`
    );
  }, [uploadedProfileImage, profilePictureIndex]);

  const currentBanner = useMemo(() => {
    return uploadedBanner || `/assets/user-banners/banner-${bannerIndex}.jpg`;
  }, [uploadedBanner, bannerIndex]);

  // Update profile data when images change
  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      profileImageUrl: currentProfileImage,
      coverImageUrl: currentBanner,
    }));
  }, [currentProfileImage, currentBanner]);

  // Cycle profile picture
  const cycleProfilePicture = useCallback((direction: 'next' | 'prev') => {
    setUploadedProfileImage(null);
    setUploadedProfileFile(null);
    setProfilePictureIndex((prev) => {
      if (direction === 'next') {
        return prev >= TOTAL_PROFILE_PICTURES ? 1 : prev + 1;
      }
      return prev <= 1 ? TOTAL_PROFILE_PICTURES : prev - 1;
    });
  }, []);

  // Cycle banner
  const cycleBanner = useCallback((direction: 'next' | 'prev') => {
    setUploadedBanner(null);
    setUploadedBannerFile(null);
    setBannerIndex((prev) => {
      if (direction === 'next') {
        return prev >= TOTAL_BANNERS ? 1 : prev + 1;
      }
      return prev <= 1 ? TOTAL_BANNERS : prev - 1;
    });
  }, []);

  const handleProfileImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedProfileFile(file);
        setUploadedProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleBannerUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBannerFile(file);
        setUploadedBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Handle save
  const handleSave = async () => {
    if (!profileData.name.trim()) {
      toast.error('Agent name is required');
      return;
    }
    if (!promptsData.system.trim()) {
      toast.error('System prompt is required');
      return;
    }

    setSaving(true);

    try {
      // Upload pending images using shared utility
      let finalProfileImageUrl = profileData.profileImageUrl;
      let finalCoverImageUrl = profileData.coverImageUrl;

      if (uploadedProfileFile) {
        try {
          finalProfileImageUrl = await uploadImage(
            uploadedProfileFile,
            'profile'
          );
        } catch {
          toast.error('Failed to upload profile image');
          setSaving(false);
          return;
        }
      }

      if (uploadedBannerFile) {
        try {
          finalCoverImageUrl = await uploadImage(uploadedBannerFile, 'cover');
        } catch {
          toast.error('Failed to upload cover image');
          setSaving(false);
          return;
        }
      }

      await updateAgentMutation({
        agentId: agent.id,
        data: {
          name: profileData.name,
          description: profileData.description,
          profileImageUrl: finalProfileImageUrl,
          coverImageUrl: finalCoverImageUrl,
          system: promptsData.tradingStrategy.trim()
            ? `${promptsData.system}\n\nTrading Strategy: ${promptsData.tradingStrategy}`
            : promptsData.system,
          personality: promptsData.personality,
          bio: promptsData.personality.trim()
            ? [promptsData.personality.trim()]
            : [],
          tradingStrategy: promptsData.tradingStrategy,
          modelTier: settingsData.modelTier,
          autonomousEnabled: settingsData.autonomousEnabled,
          autonomousPosting: settingsData.autonomousPosting,
          a2aEnabled: settingsData.a2aEnabled,
        } as Record<string, unknown>,
      });

      toast.success('Agent updated');
      onUpdate();
      onClose();
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete - performs the actual deletion after confirmation
  const handleDeleteConfirmed = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);

    try {
      await deleteAgentMutation({ agentId: agent.id });
      toast.success('Agent deleted');
      onClose();
      router.push('/agents');
    } catch {
      toast.error('Failed to delete agent');
    } finally {
      setDeleting(false);
    }
  };

  // Step content
  const stepContent = (
    <>
      {currentStep === Step.Profile && (
        <div className="space-y-6">
          {/* Profile Images Section */}
          <div className="relative mb-14 sm:mb-16">
            {/* Banner */}
            <div className="group relative h-24 overflow-hidden rounded-lg bg-muted sm:h-32">
              <img
                src={currentBanner}
                alt="Profile banner"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => cycleBanner('prev')}
                  className="rounded-full bg-background/90 p-1.5 hover:bg-background sm:p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <label className="cursor-pointer rounded-full bg-background/90 p-1.5 hover:bg-background sm:p-2">
                  <Upload className="h-4 w-4" />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => cycleBanner('next')}
                  className="rounded-full bg-background/90 p-1.5 hover:bg-background sm:p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Avatar - overlapping banner */}
            <div className="-bottom-12 sm:-bottom-14 absolute left-3 sm:left-4">
              <div className="group relative h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted sm:h-28 sm:w-28">
                <img
                  src={currentProfileImage}
                  alt="Profile picture"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => cycleProfilePicture('prev')}
                    className="rounded-full bg-background/90 p-1 hover:bg-background sm:p-1.5"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <label className="cursor-pointer rounded-full bg-background/90 p-1 hover:bg-background sm:p-1.5">
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => cycleProfilePicture('next')}
                    className="rounded-full bg-background/90 p-1 hover:bg-background sm:p-1.5"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Image upload info */}
          <p className="text-muted-foreground text-xs">
            Tap images to browse or upload custom.
            <br />
            Max 5MB, JPG/PNG/GIF/WebP.
          </p>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Display Name */}
            <div>
              <label
                htmlFor="edit-name"
                className="mb-2 block font-medium text-sm"
              >
                Display Name *
              </label>
              <input
                id="edit-name"
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={cn(
                  'w-full rounded-lg border border-border bg-muted px-4 py-3',
                  'focus:outline-none focus:ring-2 focus:ring-[#0066FF]'
                )}
                placeholder="My Awesome Agent"
              />
            </div>

            {/* Bio/Description */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="edit-description"
                  className="block font-medium text-sm"
                >
                  Bio
                </label>
                <span className="text-muted-foreground text-xs">
                  {profileData.description?.length ?? 0}/{MAX_BIO_LENGTH}
                </span>
              </div>
              <textarea
                id="edit-description"
                value={profileData.description ?? ''}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                maxLength={MAX_BIO_LENGTH}
                rows={3}
                className={cn(
                  'w-full resize-none rounded-lg border border-border bg-muted px-4 py-3',
                  'focus:outline-none focus:ring-2 focus:ring-[#0066FF]'
                )}
                placeholder="A short description of your agent..."
              />
              <p className="mt-1.5 text-muted-foreground text-xs">
                This will appear on your agent's profile.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 border-red-500/20 border-t pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-red-400 text-sm">Delete Agent</p>
                <p className="text-muted-foreground text-xs">
                  Permanently remove this agent. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-medium text-red-500 text-sm transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === Step.Prompts && (
        <div className="space-y-4">
          {/* System Prompt */}
          <div className="space-y-2">
            <label htmlFor="system" className="font-medium text-sm">
              System Prompt
            </label>
            <textarea
              id="system"
              value={promptsData.system}
              onChange={(e) =>
                setPromptsData((prev) => ({ ...prev, system: e.target.value }))
              }
              placeholder="You are a trading agent focused on..."
              rows={4}
              className={cn(
                'w-full resize-none rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm sm:px-4 sm:py-3',
                'focus:outline-none focus:ring-2 focus:ring-[#0066FF]'
              )}
            />
            <p className="text-muted-foreground text-xs">
              Core instructions defining agent behavior and capabilities.
            </p>
          </div>

          {/* Personality */}
          <div className="space-y-2">
            <label htmlFor="personality" className="font-medium text-sm">
              Personality
            </label>
            <textarea
              id="personality"
              value={promptsData.personality}
              onChange={(e) =>
                setPromptsData((prev) => ({
                  ...prev,
                  personality: e.target.value,
                }))
              }
              placeholder="Analytical and methodical..."
              rows={3}
              className={cn(
                'w-full resize-none rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm sm:px-4 sm:py-3',
                'focus:outline-none focus:ring-2 focus:ring-[#0066FF]'
              )}
            />
            <p className="text-muted-foreground text-xs">
              Character traits that influence communication style.
            </p>
          </div>

          {/* Trading Strategy */}
          <div className="space-y-2">
            <label htmlFor="tradingStrategy" className="font-medium text-sm">
              Trading Strategy
            </label>
            <textarea
              id="tradingStrategy"
              value={promptsData.tradingStrategy}
              onChange={(e) =>
                setPromptsData((prev) => ({
                  ...prev,
                  tradingStrategy: e.target.value,
                }))
              }
              placeholder="Focus on momentum indicators..."
              rows={3}
              className={cn(
                'w-full resize-none rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm sm:px-4 sm:py-3',
                'focus:outline-none focus:ring-2 focus:ring-[#0066FF]'
              )}
            />
            <p className="text-muted-foreground text-xs">
              Market analysis approach and position sizing rules.
            </p>
          </div>
        </div>
      )}

      {currentStep === Step.Settings && (
        <AgentConfigurationForm
          data={settingsData}
          onChange={setSettingsData}
          agentId={agent.id}
        />
      )}
    </>
  );

  // Step actions
  const stepActions = (
    <div className="flex gap-3">
      {currentStep === Step.Profile && (
        <>
          <span
            className="pointer-events-none flex-1 rounded-lg border border-transparent px-4 py-2.5 font-medium text-transparent sm:py-3"
            aria-hidden="true"
          >
            Back
          </span>
          <button
            onClick={() => setCurrentStep(Step.Prompts)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all sm:py-3',
              'bg-[#0066FF] text-primary-foreground hover:bg-[#2952d9]'
            )}
          >
            Continue
          </button>
        </>
      )}
      {currentStep === Step.Prompts && (
        <>
          <button
            onClick={() => setCurrentStep(Step.Profile)}
            className={cn(
              'flex-1 rounded-lg border border-border px-4 py-2.5 font-medium transition-colors sm:py-3',
              'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Back
          </button>
          <button
            onClick={() => setCurrentStep(Step.Settings)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all sm:py-3',
              'bg-[#0066FF] text-primary-foreground hover:bg-[#2952d9]'
            )}
          >
            Continue
          </button>
        </>
      )}
      {currentStep === Step.Settings && (
        <>
          <button
            onClick={() => setCurrentStep(Step.Prompts)}
            disabled={saving}
            className={cn(
              'flex-1 rounded-lg border border-border px-4 py-2.5 font-medium transition-colors sm:py-3',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all sm:py-3',
              'bg-[#0066FF] text-primary-foreground hover:bg-[#2952d9]',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </>
      )}
    </div>
  );

  const stepTitles: Record<Step, string> = {
    [Step.Profile]: 'Edit Profile',
    [Step.Prompts]: 'Configure Prompts',
    [Step.Settings]: 'Agent Settings',
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:p-4">
      <div
        className="relative flex h-full w-full flex-col bg-background md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[600px] md:max-w-3xl md:rounded-lg md:border md:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed */}
        <div className="shrink-0 border-border border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{stepTitles[currentStep]}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {stepContent}
        </div>

        {/* Footer - fixed */}
        <div className="shrink-0 border-border border-t px-4 py-3 sm:px-6 sm:py-4">
          {stepActions}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {agent.name}? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
