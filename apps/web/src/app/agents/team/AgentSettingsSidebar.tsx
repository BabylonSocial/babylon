'use client';

import { useDeleteAgent, useUpdateAgent } from '@babylon/api-hooks';
import { cn, GROQ_MODELS } from '@babylon/shared';
import {
  Camera,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useCollapsibleHeight } from '@/hooks/useCollapsibleHeight';
import { MODEL_TIER_POINTS_COST } from '@/lib/constants';

interface AgentData {
  id: string;
  name: string;
  description?: string;
  profileImageUrl?: string;
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

interface AgentSettingsSidebarProps {
  agent: AgentData;
  onUpdate: () => void;
}

type SectionKey = 'basic' | 'personality' | 'model' | 'danger';

/** Animated collapsible component */
function Collapsible({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const { contentRef, height } = useCollapsibleHeight(isOpen);

  return (
    <div
      style={{
        height: height === undefined ? 'auto' : height,
        overflow: 'hidden',
        transition: 'height 200ms ease-out, opacity 200ms ease-out',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

/**
 * Compact agent settings component optimized for sidebar display.
 * Uses accordion pattern to save space.
 */
export function AgentSettingsSidebar({
  agent,
  onUpdate,
}: AgentSettingsSidebarProps) {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { mutateAsync: updateAgentMutation } = useUpdateAgent();
  const { mutateAsync: deleteAgentMutation } = useDeleteAgent();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['basic'])
  );
  const [profileImage, setProfileImage] = useState<{
    file: File | null;
    preview: string | null;
  }>({ file: null, preview: null });
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    profileImageUrl: agent.profileImageUrl || '',
    system: agent.system,
    personality:
      agent.personality ||
      (Array.isArray(agent.bio) ? agent.bio.filter((b) => b).join('\n') : ''),
    tradingStrategy: agent.tradingStrategy || '',
    modelTier: agent.modelTier,
    isActive: agent.isActive,
    autonomousEnabled: agent.autonomousEnabled,
    autonomousPosting: agent.autonomousPosting || false,
    autonomousCommenting: agent.autonomousCommenting || false,
    autonomousDMs: agent.autonomousDMs || false,
    autonomousGroupChats: agent.autonomousGroupChats || false,
    a2aEnabled: agent.a2aEnabled || false,
  });

  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSections((prev) => {
      // If clicking the already open section, close it
      if (prev.has(section)) {
        return new Set();
      }
      // Otherwise, open only this section (close others)
      return new Set([section]);
    });
  }, []);

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage({ file, preview: reader.result as string });
      setFormData((prev) => ({ ...prev, profileImageUrl: '' }));
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setProfileImage({ file: null, preview: null });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = await getAccessToken();
    if (!token) {
      toast.error('Authentication required');
      setSaving(false);
      return;
    }

    try {
      const updatedData = { ...formData };

      if (profileImage.file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profileImage.file);
        uploadFormData.append('type', 'profile');

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          toast.error('Failed to upload profile image');
          setSaving(false);
          return;
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData?.url?.trim()) {
          toast.error('Invalid upload response');
          setSaving(false);
          return;
        }
        updatedData.profileImageUrl = uploadData.url;
      }

      await updateAgentMutation({
        agentId: agent.id,
        data: {
          ...updatedData,
          bio: updatedData.personality.trim()
            ? [updatedData.personality.trim()]
            : [],
          system: updatedData.tradingStrategy.trim()
            ? `${updatedData.system}\n\nTrading Strategy: ${updatedData.tradingStrategy}`
            : updatedData.system,
        },
      });

      toast.success('Agent updated');
      setProfileImage({ file: null, preview: null });
      onUpdate();
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${agent.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAgentMutation({ agentId: agent.id });
      toast.success('Agent deleted');
      router.push('/agents');
    } catch {
      toast.error('Failed to delete agent');
    } finally {
      setDeleting(false);
    }
  };

  // Accordion section header component
  const SectionHeader = ({
    section,
    title,
    danger = false,
  }: {
    section: SectionKey;
    title: string;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className={cn(
        'flex w-full items-center justify-between py-2 text-left font-medium text-sm transition-colors',
        danger
          ? 'text-red-400 hover:text-red-300'
          : 'text-foreground hover:text-foreground/80'
      )}
    >
      <span>{title}</span>
      <ChevronDown
        className={cn(
          'h-4 w-4 transition-transform',
          expandedSections.has(section) && 'rotate-180'
        )}
      />
    </button>
  );

  // Toggle switch row component
  const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-xs">{label}</div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 scale-90"
      />
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable content */}
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {/* Basic Info Section */}
        <div className="border-border border-b pb-1">
          <SectionHeader section="basic" title="Basic Info" />
          <Collapsible isOpen={expandedSections.has('basic')}>
            <div className="space-y-3 pt-1 pb-3">
              {/* Profile Image - Centered */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="group relative h-16 w-16 cursor-pointer overflow-hidden rounded-full border border-border bg-muted"
                  onClick={() => profileImageInputRef.current?.click()}
                >
                  {profileImage.preview || formData.profileImageUrl ? (
                    <img
                      src={profileImage.preview || formData.profileImageUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  className="hidden"
                  disabled={saving}
                />
                <span className="text-[11px] text-muted-foreground">
                  Click to change
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1 block text-muted-foreground text-xs">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Agent name"
                  className="h-8 text-sm"
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-muted-foreground text-xs">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description..."
                  rows={2}
                  className="min-h-[60px] resize-y text-sm"
                  disabled={saving}
                />
              </div>
            </div>
          </Collapsible>
        </div>

        {/* Personality Section */}
        <div className="border-border border-b pb-1">
          <SectionHeader section="personality" title="Personality" />
          <Collapsible isOpen={expandedSections.has('personality')}>
            <div className="space-y-3 pt-1 pb-3">
              <div>
                <label className="mb-1 block text-muted-foreground text-xs">
                  Important Directions
                </label>
                <Textarea
                  value={formData.system}
                  onChange={(e) =>
                    setFormData({ ...formData, system: e.target.value })
                  }
                  placeholder="You are an AI agent who..."
                  rows={3}
                  className="min-h-[70px] resize-y text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-muted-foreground text-xs">
                  Personality
                </label>
                <Textarea
                  value={formData.personality}
                  onChange={(e) =>
                    setFormData({ ...formData, personality: e.target.value })
                  }
                  placeholder="Personality traits..."
                  rows={3}
                  className="min-h-[70px] resize-y text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-muted-foreground text-xs">
                  Trading Strategy
                </label>
                <Textarea
                  value={formData.tradingStrategy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tradingStrategy: e.target.value,
                    })
                  }
                  placeholder="Trading approach..."
                  rows={3}
                  className="min-h-[70px] resize-y text-sm"
                  disabled={saving}
                />
              </div>
            </div>
          </Collapsible>
        </div>

        {/* Model & Features Section */}
        <div className="border-border border-b pb-1">
          <SectionHeader section="model" title="Model & Features" />
          <Collapsible isOpen={expandedSections.has('model')}>
            <div className="space-y-3 pt-1 pb-3">
              {/* Model Tier */}
              <div>
                <label className="mb-2 block text-muted-foreground text-xs">
                  Model Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, modelTier: 'free' })
                    }
                    disabled={saving}
                    className={cn(
                      'rounded-md border p-2 text-left text-xs transition-colors',
                      formData.modelTier === 'free'
                        ? 'border-[#0066FF] bg-[#0066FF]/10'
                        : 'border-border hover:border-[#0066FF]/50'
                    )}
                  >
                    <div className="font-medium">Free</div>
                    <div className="text-[10px] text-muted-foreground">
                      {GROQ_MODELS.FREE.displayName}
                    </div>
                    <div className="mt-0.5 text-[9px] text-muted-foreground/70">
                      {GROQ_MODELS.FREE.description}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, modelTier: 'pro' })
                    }
                    disabled={saving}
                    className={cn(
                      'rounded-md border p-2 text-left text-xs transition-colors',
                      formData.modelTier === 'pro'
                        ? 'border-[#0066FF] bg-[#0066FF]/10'
                        : 'border-border hover:border-[#0066FF]/50'
                    )}
                  >
                    <div className="font-medium">Pro</div>
                    <div className="text-[10px] text-muted-foreground">
                      {GROQ_MODELS.PRO.displayName}
                    </div>
                    <div className="mt-0.5 text-[9px] text-muted-foreground/70">
                      {GROQ_MODELS.PRO.description}
                    </div>
                    <div className="mt-0.5 font-medium text-[#0066FF] text-[9px]">
                      {MODEL_TIER_POINTS_COST.pro} pt/msg
                    </div>
                  </button>
                </div>
              </div>

              {/* Autonomous Features Info */}
              <div className="flex gap-2 rounded-md border border-primary/20 bg-accent/50 p-2">
                <Info className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-[11px] text-foreground/80">
                  {formData.autonomousEnabled
                    ? 'Trading enabled - agent will execute trades'
                    : 'Trading disabled - enable below to auto-trade'}
                </p>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-1">
                <ToggleRow
                  label="Autonomous Trading"
                  description="Execute trades on markets"
                  checked={formData.autonomousEnabled}
                  onChange={(checked) =>
                    setFormData({ ...formData, autonomousEnabled: checked })
                  }
                />
                <ToggleRow
                  label="Autonomous Posting"
                  description="Create posts automatically"
                  checked={formData.autonomousPosting}
                  onChange={(checked) =>
                    setFormData({ ...formData, autonomousPosting: checked })
                  }
                />
                <ToggleRow
                  label="Autonomous Commenting"
                  description="Comment on posts"
                  checked={formData.autonomousCommenting}
                  onChange={(checked) =>
                    setFormData({ ...formData, autonomousCommenting: checked })
                  }
                />
                <ToggleRow
                  label="Autonomous DMs"
                  description="Respond to direct messages"
                  checked={formData.autonomousDMs}
                  onChange={(checked) =>
                    setFormData({ ...formData, autonomousDMs: checked })
                  }
                />
                <ToggleRow
                  label="Group Chats"
                  description="Participate in group chats"
                  checked={formData.autonomousGroupChats}
                  onChange={(checked) =>
                    setFormData({ ...formData, autonomousGroupChats: checked })
                  }
                />
                <ToggleRow
                  label="Enable A2A Server"
                  description="Allow agent-to-agent connections"
                  checked={formData.a2aEnabled}
                  onChange={(checked) =>
                    setFormData({ ...formData, a2aEnabled: checked })
                  }
                />
              </div>

              {/* A2A Server Link */}
              {formData.a2aEnabled && (
                <div className="rounded-md border border-[#0066FF]/20 bg-[#0066FF]/5 p-2">
                  <div className="mb-1 font-medium text-xs">
                    A2A Server Link
                  </div>
                  <div className="flex items-center gap-1 rounded border border-border bg-background p-1.5">
                    <code className="flex-1 overflow-x-auto text-[9px]">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/api/agents/${agent.id}/a2a`
                        : `/api/agents/${agent.id}/a2a`}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const url =
                          typeof window !== 'undefined'
                            ? `${window.location.origin}/api/agents/${agent.id}/a2a`
                            : `/api/agents/${agent.id}/a2a`;
                        navigator.clipboard.writeText(url);
                        toast.success('Copied');
                      }}
                      className="shrink-0 rounded p-1 hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <a
                      href={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}/api/agents/${agent.id}/.well-known/agent-card`
                          : `/api/agents/${agent.id}/.well-known/agent-card`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded p-1 hover:bg-muted"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Collapsible>
        </div>

        {/* Danger Zone Section */}
        <div className="pb-1">
          <SectionHeader section="danger" title="Danger Zone" danger />
          <Collapsible isOpen={expandedSections.has('danger')}>
            <div className="pt-1 pb-3">
              <p className="mb-2 text-[11px] text-muted-foreground">
                Permanently delete this agent. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-medium text-red-400 text-xs transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {deleting ? 'Deleting...' : 'Delete Agent'}
              </button>
            </div>
          </Collapsible>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="shrink-0 border-border border-t bg-background p-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-[#0055DD] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
