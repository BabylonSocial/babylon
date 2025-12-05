/**
 * Create Agent Page
 *
 * @description Interface for creating new AI agents with profile configuration,
 * personality settings, system prompts, and trading strategies. Supports AI-powered
 * field generation, image uploads, and draft saving.
 *
 * @page /agents/create
 * @access Authenticated
 *
 * @features
 * - Agent profile creation (username, display name, bio, images)
 * - AI-powered field generation (name, description, system prompt, bio, personality, trading strategy)
 * - Agent configuration (system prompt, personality, trading strategy)
 * - Image selection (profile and cover images from asset library)
 * - Draft saving to localStorage
 * - Initial deposit configuration
 * - Form validation
 * - Agent creation with API integration
 *
 * @example
 * ```tsx
 * // Accessible at /agents/create
 * // Requires authentication
 * <CreateAgentPage />
 * ```
 */

'use client';

import {
  ArrowLeft,
  Bot,
  Camera,
  ChevronLeft,
  ChevronRight,
  Coins,
  Edit2,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AgentTemplate } from '@babylon/agents/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@babylon/shared';

/**
 * Local storage key for saving agent drafts
 */
const STORAGE_KEY = 'babylon_agent_draft';

/**
 * Total number of profile pictures available in the asset library
 */
const TOTAL_PROFILE_PICTURES = 100;

/**
 * Name component pools for generating unique agent names
 */
const NAME_PREFIXES = [
  // Greek letters
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho',
  'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
  // Tech/Cyber
  'Quantum', 'Neo', 'Cyber', 'Nexus', 'Apex', 'Vertex', 'Pulse', 'Flux',
  'Vector', 'Helix', 'Prism', 'Matrix', 'Cipher', 'Binary', 'Neural',
  // Nature/Elements
  'Nova', 'Solar', 'Lunar', 'Stellar', 'Cosmic', 'Astral', 'Phoenix',
  'Storm', 'Thunder', 'Frost', 'Ember', 'Shadow', 'Dawn', 'Dusk',
  // Power/Status
  'Iron', 'Steel', 'Titan', 'Atlas', 'Orion', 'Vortex', 'Blaze', 'Spark',
  'Echo', 'Phantom', 'Specter', 'Raven', 'Falcon', 'Hawk', 'Eagle',
  // Abstract
  'Zen', 'Aura', 'Axiom', 'Lumen', 'Photon', 'Quark', 'Volt', 'Arc',
];

const NAME_SUFFIXES = [
  // Role-based
  'Trader', 'Agent', 'Bot', 'AI', 'Mind', 'Brain', 'Sage', 'Oracle',
  // Technical
  'Core', 'Node', 'Edge', 'Prime', 'Pro', 'Max', 'Ultra', 'Plus',
  'X', 'Zero', 'One', 'Protocol', 'System', 'Engine', 'Logic',
  // Abstract
  'Flow', 'Wave', 'Sync', 'Link', 'Net', 'Hub', 'Lab', 'Works',
  'Force', 'Drive', 'Pulse', 'Signal', 'Stream', 'Grid', 'Mesh',
];

/**
 * Generate a unique random agent name
 * Combines prefix + suffix + numeric identifier for uniqueness
 * 
 * Total combinations: 65 prefixes × 35 suffixes × 9000 numbers = 20,475,000+
 */
const generateAgentName = (): string => {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]!;
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]!;
  
  // Always add a unique 4-digit identifier (1000-9999) for guaranteed uniqueness
  const number = Math.floor(Math.random() * 9000) + 1000;
  
  return `${prefix}${suffix}-${number}`;
};

/**
 * Profile form data structure
 */
type ProfileFormData = {
  username: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
  coverImageUrl: string;
};

/**
 * Edit modal state for profile editing
 */
type EditModalState = {
  isOpen: boolean;
  formData: ProfileFormData;
  profileImage: { file: File | null; preview: string | null };
  coverImage: { file: File | null; preview: string | null };
  error: string | null;
};

/**
 * Create Agent Page Component
 *
 * @description Main component for creating new AI agents with comprehensive
 * configuration options and AI-powered assistance.
 *
 * @returns {JSX.Element} Create agent page
 */
export default function CreateAgentPage() {
  const router = useRouter();
  const { user, authenticated, ready, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  // Profile state (Babylon profile fields) - single source of truth
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: '',
    displayName: '',
    bio: '',
    profileImageUrl: '',
    coverImageUrl: '',
  });

  // Agent configuration state
  const [agentData, setAgentData] = useState({
    system: '',
    personality: '',
    tradingStrategy: '',
    initialDeposit: 100,
  });

  // Edit profile modal state
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    formData: {
      username: '',
      displayName: '',
      bio: '',
      profileImageUrl: '',
      coverImageUrl: '',
    },
    profileImage: { file: null, preview: null },
    coverImage: { file: null, preview: null },
    error: null,
  });

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract index from image URL
  const getImageIndex = (url: string, type: 'profile' | 'banner'): number => {
    const match = url.match(
      new RegExp(`${type === 'profile' ? 'profile' : 'banner'}-(\\d+)\\.jpg`)
    );
    return match ? parseInt(match[1]!, 10) : 1;
  };

  // Helper to get current image URLs (for display)
  const getCurrentProfileImage = (): string => {
    if (editModal.isOpen && editModal.profileImage.preview) {
      return editModal.profileImage.preview;
    }
    return profileData.profileImageUrl || `/assets/user-profiles/profile-1.jpg`;
  };

  const getCurrentBanner = (): string => {
    if (editModal.isOpen && editModal.coverImage.preview) {
      return editModal.coverImage.preview;
    }
    return profileData.coverImageUrl || `/assets/user-banners/banner-1.jpg`;
  };

  // Load template and initialize
  useEffect(() => {
    const loadTemplate = async () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Only load saved data if it has all required fields
          if (
            parsed.profileData &&
            parsed.profileData.displayName &&
            parsed.profileData.username
          ) {
            setProfileData(parsed.profileData);
          }
          if (parsed.agentData && parsed.agentData.system) {
            setAgentData(parsed.agentData);
          }
          // If profile data is complete, use saved draft
          if (
            parsed.profileData &&
            parsed.profileData.displayName &&
            parsed.profileData.username
          ) {
            setIsInitialized(true);
            return;
          }
        } catch (error) {
          console.error('Failed to parse saved data:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Load random template and customize with unique name
      try {
        const indexResponse = await fetch('/api/agent-templates');
        if (!indexResponse.ok) throw new Error('Failed to load template index');

        const index = (await indexResponse.json()) as { templates: string[] };
        if (!index.templates || index.templates.length === 0) {
          throw new Error('No templates available');
        }

        const randomTemplate =
          index.templates[Math.floor(Math.random() * index.templates.length)]!;

        const templateResponse = await fetch(
          `/api/agent-templates/${randomTemplate}`
        );
        if (!templateResponse.ok) throw new Error('Failed to load template');

        const template = (await templateResponse.json()) as AgentTemplate;

        // Generate agent name
        const agentName = generateAgentName();

        // Replace placeholders
        const processedTemplate = {
          ...template,
          name: template.name.replace('{{agentName}}', agentName),
          system: template.system.replace(/{{agentName}}/g, agentName),
          personality: template.personality.replace(/{{agentName}}/g, agentName),
          tradingStrategy: template.tradingStrategy.replace(/{{agentName}}/g, agentName),
        };

        // Set random images
        const randomPfp =
          Math.floor(Math.random() * TOTAL_PROFILE_PICTURES) + 1;
        const randomBanner =
          Math.floor(Math.random() * TOTAL_PROFILE_PICTURES) + 1;

        // Initialize form data
        setProfileData({
          username: agentName.toLowerCase().replace(/\s+/g, ''),
          displayName: processedTemplate.name,
          bio: processedTemplate.description,
          profileImageUrl: `/assets/user-profiles/profile-${randomPfp}.jpg`,
          coverImageUrl: `/assets/user-banners/banner-${randomBanner}.jpg`,
        });

        setAgentData({
          system: processedTemplate.system,
          personality: processedTemplate.bio,
          tradingStrategy: processedTemplate.tradingStrategy,
          initialDeposit: 100,
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load template:', error);
        toast.error('Failed to load agent template. Using defaults.');

        // Fallback to defaults
        const agentName = generateAgentName();
        const randomPfp =
          Math.floor(Math.random() * TOTAL_PROFILE_PICTURES) + 1;
        const randomBanner =
          Math.floor(Math.random() * TOTAL_PROFILE_PICTURES) + 1;

        setProfileData({
          username: agentName.toLowerCase().replace(/\s+/g, ''),
          displayName: agentName,
          bio: 'An AI-powered trading agent ready to analyze markets.',
          profileImageUrl: `/assets/user-profiles/profile-${randomPfp}.jpg`,
          coverImageUrl: `/assets/user-banners/banner-${randomBanner}.jpg`,
        });

        setAgentData({
          system: `You are ${agentName}, an AI trading agent. You analyze market data, identify opportunities, and make informed trading decisions. You communicate clearly and provide reasoning for your trades.`,
          personality: 'Analytical and precise. Communicates with confidence while acknowledging uncertainty. Focuses on data-driven insights.',
          tradingStrategy: 'Combines technical and fundamental analysis. Uses risk management with position sizing. Monitors key indicators and market sentiment.',
          initialDeposit: 100,
        });

        setIsInitialized(true);
      }
    };

    loadTemplate();
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profileData,
          agentData,
        })
      );
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [profileData, agentData, isInitialized]);

  const updateAgentField = (field: string, value: string | number) => {
    setAgentData((prev) => ({ ...prev, [field]: value }));
  };

  const cycleProfilePicture = (direction: 'next' | 'prev') => {
    const currentUrl = editModal.isOpen
      ? editModal.profileImage.preview || profileData.profileImageUrl
      : profileData.profileImageUrl;

    const currentIndex = getImageIndex(currentUrl, 'profile');
    const newIndex =
      direction === 'next'
        ? currentIndex >= TOTAL_PROFILE_PICTURES
          ? 1
          : currentIndex + 1
        : currentIndex <= 1
          ? TOTAL_PROFILE_PICTURES
          : currentIndex - 1;

    const newUrl = `/assets/user-profiles/profile-${newIndex}.jpg`;

    if (editModal.isOpen) {
      setEditModal((prev) => ({
        ...prev,
        profileImage: { file: null, preview: newUrl },
      }));
    } else {
      setProfileData((prev) => ({ ...prev, profileImageUrl: newUrl }));
    }
  };

  const cycleBanner = (direction: 'next' | 'prev') => {
    const currentUrl = editModal.isOpen
      ? editModal.coverImage.preview || profileData.coverImageUrl
      : profileData.coverImageUrl;

    const currentIndex = getImageIndex(currentUrl, 'banner');
    const newIndex =
      direction === 'next'
        ? currentIndex >= TOTAL_PROFILE_PICTURES
          ? 1
          : currentIndex + 1
        : currentIndex <= 1
          ? TOTAL_PROFILE_PICTURES
          : currentIndex - 1;

    const newUrl = `/assets/user-banners/banner-${newIndex}.jpg`;

    if (editModal.isOpen) {
      setEditModal((prev) => ({
        ...prev,
        coverImage: { file: null, preview: newUrl },
      }));
    } else {
      setProfileData((prev) => ({ ...prev, coverImageUrl: newUrl }));
    }
  };

  const handleProfileImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedTypes.includes(file.type)) {
      setEditModal((prev) => ({
        ...prev,
        error: 'Please select a valid image file',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditModal((prev) => ({
        ...prev,
        error: 'File size must be less than 10MB',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditModal((prev) => ({
        ...prev,
        profileImage: { file, preview: reader.result as string },
        error: null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedTypes.includes(file.type)) {
      setEditModal((prev) => ({
        ...prev,
        error: 'Please select a valid image file',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditModal((prev) => ({
        ...prev,
        error: 'File size must be less than 10MB',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditModal((prev) => ({
        ...prev,
        coverImage: { file, preview: reader.result as string },
        error: null,
      }));
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = () => {
    setEditModal({
      isOpen: true,
      formData: { ...profileData },
      profileImage: { file: null, preview: profileData.profileImageUrl },
      coverImage: { file: null, preview: profileData.coverImageUrl },
      error: null,
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      formData: {
        username: '',
        displayName: '',
        bio: '',
        profileImageUrl: '',
        coverImageUrl: '',
      },
      profileImage: { file: null, preview: null },
      coverImage: { file: null, preview: null },
      error: null,
    });
    if (profileImageInputRef.current) profileImageInputRef.current.value = '';
    if (bannerImageInputRef.current) bannerImageInputRef.current.value = '';
  };

  const saveProfileModal = () => {
    // Update profile data with form data and image URLs
    setProfileData({
      ...editModal.formData,
      profileImageUrl:
        editModal.profileImage.preview || profileData.profileImageUrl,
      coverImageUrl: editModal.coverImage.preview || profileData.coverImageUrl,
    });

    closeEditModal();
    toast.success('Profile updated!');
  };

  const handleRegenerateField = async (field: string) => {
    setGeneratingField(field);

    try {
      const token = await getAccessToken();

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/agents/generate-field', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldName: field,
          currentValue: agentData[field as keyof typeof agentData],
          context: {
            name: profileData.displayName,
            description: profileData.bio,
            system: agentData.system,
            personality: agentData.personality,
            tradingStrategy: agentData.tradingStrategy,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate field');
      }

      const result = await response.json();

      // Strip any <think>...</think> tags that may come from reasoning models
      const strippedValue = (result.value as string)
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();

      // For personality, split by | and join with \n (no \n\n allowed)
      if (field === 'personality') {
        const personalityLines = strippedValue
          .split('|')
          .map((s: string) => s.trim())
          .filter((s: string) => s);
        updateAgentField('personality', personalityLines.join('\n'));
      } else {
        // Replace \n\n with \n for other fields
        const cleaned = strippedValue.replace(/\n\n+/g, '\n');
        updateAgentField(field, cleaned);
      }

      toast.success(`Regenerated ${field}!`);
    } catch (error) {
      console.error('Error generating field:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate field'
      );
    } finally {
      setGeneratingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!profileData.displayName.trim()) {
      toast.error('Agent name is required');
      return;
    }
    if (!agentData.system.trim()) {
      toast.error('System prompt is required');
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Split personality by \n and filter empty lines for bio array
      const bioArray = agentData.personality
        .split('\n')
        .filter((b) => b.trim());

      // Append trading strategy to system prompt
      const systemPrompt = agentData.tradingStrategy.trim()
        ? `${agentData.system}\n\nTrading Strategy: ${agentData.tradingStrategy}`
        : agentData.system;

      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.displayName,
          description: profileData.bio,
          profileImageUrl: profileData.profileImageUrl,
          coverImageUrl: profileData.coverImageUrl,
          system: systemPrompt,
          bio: bioArray,
          personality: agentData.personality,
          tradingStrategy: agentData.tradingStrategy,
          initialDeposit: agentData.initialDeposit,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const errorMsg = error.error || 'Failed to create agent';
        toast.error(errorMsg);
        return;
      }

      const data = (await res.json()) as { agent: { id: string } };

      // Clear draft
      localStorage.removeItem(STORAGE_KEY);

      toast.success('Agent created successfully!');
      router.push(`/agents/${data.agent.id}`);
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create agent'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <PageContainer>
        <div className="p-4">
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#0066FF]/20 bg-gradient-to-br from-[#0066FF]/10 to-purple-500/10 px-4 py-16">
            <Bot className="mb-4 h-16 w-16 text-[#0066FF]" />
            <h3 className="mb-2 font-bold text-2xl">Create an Agent</h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground text-sm">
              Please sign in to create an AI agent
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const totalPoints = user?.reputationPoints || 0;

  if (!isInitialized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <Loader2 className="mb-4 h-16 w-16 animate-spin text-[#0066FF]" />
          <h3 className="mb-2 font-bold text-2xl">Loading Agent Template</h3>
          <p className="max-w-md text-center text-muted-foreground text-sm">
            Preparing your agent...
          </p>
        </div>
      </PageContainer>
    );
  }

  const currentProfileImage = getCurrentProfileImage();
  const currentBanner = getCurrentBanner();

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl pb-24">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/agents')}
            variant="ghost"
            className="mb-4 flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Button>
          <div className="mb-2 flex items-center gap-3">
            <Bot className="h-8 w-8 text-[#0066FF]" />
            <h1 className="font-bold text-3xl">Create New Agent</h1>
          </div>
          <p className="text-muted-foreground">
            Create your AI agent with a unique personality and trading strategy
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Preview Card */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-xl">
                <Bot className="h-5 w-5 text-[#0066FF]" />
                Agent Profile
              </h2>
              <Button
                type="button"
                onClick={openEditModal}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/20 bg-background/50">
              {/* Banner */}
              <div className="relative h-32 bg-muted">
                <Image
                  src={currentBanner}
                  alt="Banner"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Profile Info */}
              <div className="px-4 pb-4">
                {/* Profile Picture */}
                <div className="-mt-12 relative mb-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background">
                    <Image
                      src={currentProfileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Name & Description */}
                <h3 className="mb-1 font-bold text-xl">
                  {profileData.displayName}
                </h3>
                <p className="mb-1 text-muted-foreground text-sm">
                  @{profileData.username}
                </p>
                {profileData.bio && (
                  <p className="mb-3 text-muted-foreground text-sm">
                    {profileData.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Agent Configuration */}
          <div className="space-y-6 border-border border-t pt-2">
            <h2 className="flex items-center gap-2 font-semibold text-xl">
              <Bot className="h-5 w-5 text-[#0066FF]" />
              Agent Configuration
            </h2>

            {/* Important Directions */}
            <div>
              <label className="mb-2 block flex items-center justify-between font-medium text-sm">
                <span>
                  Important Directions <span className="text-red-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRegenerateField('system')}
                  disabled={generatingField === 'system'}
                  className="flex items-center gap-1 text-[#0066FF] text-xs hover:text-[#2952d9] disabled:opacity-50"
                >
                  {generatingField === 'system' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Regenerate
                    </>
                  )}
                </button>
              </label>
              <Textarea
                value={agentData.system}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  // Replace \n\n with \n
                  const cleaned = e.target.value.replace(/\n\n+/g, '\n');
                  updateAgentField('system', cleaned);
                }}
                placeholder="Important instructions for how your agent should behave..."
                rows={6}
                className="w-full resize-none rounded-lg border-white/20 px-4 py-3 transition-colors focus:border-white/60 focus:ring-0"
              />
              <p className="mt-1.5 text-muted-foreground text-xs">
                Defines how your agent thinks and behaves
              </p>
            </div>

            {/* Personality (maps to ElizaOS bio array) */}
            <div>
              <label className="mb-2 block flex items-center justify-between font-medium text-sm">
                <span>Personality</span>
                <button
                  type="button"
                  onClick={() => handleRegenerateField('personality')}
                  disabled={generatingField === 'personality'}
                  className="flex items-center gap-1 text-[#0066FF] text-xs hover:text-[#2952d9] disabled:opacity-50"
                >
                  {generatingField === 'personality' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Regenerate
                    </>
                  )}
                </button>
              </label>
              <Textarea
                value={agentData.personality}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  // Replace \n\n with \n
                  const cleaned = e.target.value.replace(/\n\n+/g, '\n');
                  updateAgentField('personality', cleaned);
                }}
                placeholder="Describe the agent's personality, communication style, and temperament. e.g. Confident and assertive, but also friendly and approachable. Speaks in clear, concise language and isn't afraid to challenge assumptions."
                rows={4}
                className="w-full resize-none rounded-lg border-white/20 px-4 py-3 transition-colors focus:border-white/60 focus:ring-0"
              />
            </div>

            {/* Trading Strategy */}
            <div>
              <label className="mb-2 block flex items-center justify-between font-medium text-sm">
                <span>Trading Strategy</span>
                <button
                  type="button"
                  onClick={() => handleRegenerateField('tradingStrategy')}
                  disabled={generatingField === 'tradingStrategy'}
                  className="flex items-center gap-1 text-[#0066FF] text-xs hover:text-[#2952d9] disabled:opacity-50"
                >
                  {generatingField === 'tradingStrategy' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Regenerate
                    </>
                  )}
                </button>
              </label>
              <Textarea
                value={agentData.tradingStrategy}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  // Replace \n\n with \n
                  const cleaned = e.target.value.replace(/\n\n+/g, '\n');
                  updateAgentField('tradingStrategy', cleaned);
                }}
                placeholder="Describe trading approach..."
                rows={5}
                className="w-full resize-none rounded-lg border-white/20 px-4 py-3 transition-colors focus:border-white/60 focus:ring-0"
              />
              <p className="mt-1.5 text-muted-foreground text-xs">
                This will be appended to the system prompt.
              </p>
            </div>
          </div>

          {/* Initial Deposit */}
          <div className="space-y-6 border-border border-t pt-2">
            <div className="space-y-4">
              {/* Label and Input Row */}
              <div className="flex items-center gap-4">
                <label className="flex flex-shrink-0 items-center gap-2 font-semibold text-lg">
                  <Coins className="h-5 w-5 text-[#0066FF]" />
                  Deposit Points to Agent
                </label>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="number"
                    value={agentData.initialDeposit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value =
                        e.target.value === ''
                          ? 0
                          : parseInt(e.target.value) || 0;
                      updateAgentField('initialDeposit', Math.max(0, value));
                    }}
                    min={0}
                    max={totalPoints}
                    placeholder="Enter amount"
                    className={cn(
                      'h-12 flex-1 rounded-lg border-white/20 px-4 font-medium text-lg transition-colors focus:border-white/60 focus:ring-0',
                      '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                      (agentData.initialDeposit > totalPoints ||
                        agentData.initialDeposit < 0) &&
                        'border-red-500/50 focus:border-red-500'
                    )}
                  />
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {[0, 100, 1000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() =>
                          updateAgentField(
                            'initialDeposit',
                            Math.min(amount, totalPoints)
                          )
                        }
                        className={cn(
                          'rounded-lg px-3 py-1.5 font-medium text-sm transition-colors',
                          'border border-white/20 hover:border-[#0066FF]/50 hover:bg-[#0066FF]/10',
                          agentData.initialDeposit === amount &&
                            'border-[#0066FF] bg-[#0066FF]/20 text-[#0066FF]',
                          amount > totalPoints &&
                            'cursor-not-allowed opacity-50'
                        )}
                        disabled={amount > totalPoints}
                      >
                        {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Balance Info */}
              <p className="text-muted-foreground text-xs">
                Your balance:{' '}
                <span className="font-medium text-foreground">
                  {totalPoints.toLocaleString()} pts
                </span>
              </p>

              {/* Error Messages */}
              {(agentData.initialDeposit > totalPoints ||
                agentData.initialDeposit < 0) && (
                <div className="fade-in slide-in-from-top-1 flex animate-in items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 duration-200">
                  <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <X className="h-3 w-3 text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-red-400 text-xs">
                      {agentData.initialDeposit < 0
                        ? 'Invalid amount'
                        : 'Insufficient balance'}
                    </p>
                    <p className="mt-0.5 text-red-400/80 text-xs">
                      {agentData.initialDeposit < 0
                        ? 'Amount must be 0 or greater'
                        : `You have ${totalPoints.toLocaleString()} points available`}
                    </p>
                  </div>
                </div>
              )}

              {/* Info Message */}
              <p className="text-muted-foreground text-xs">
                Your agent spends points for chat messages and autonomous
                trading decisions. You can add more points anytime.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-border border-t pt-6">
            <Button
              type="submit"
              disabled={loading || agentData.initialDeposit > totalPoints}
              className={cn(
                'flex w-full items-center justify-center gap-2',
                'bg-[#0066FF] text-primary-foreground hover:bg-[#2952d9]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'rounded-lg px-6 py-3 font-medium transition-all'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating Agent...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Create Agent</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Edit Profile Modal */}
        {editModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:px-4 md:py-3">
            <div className="flex h-full w-full flex-col border-0 bg-background md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-xl md:border md:border-border">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-border border-b bg-background px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <button
                    onClick={closeEditModal}
                    className="shrink-0 rounded-full p-2 transition-colors hover:bg-muted active:bg-muted"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h2 className="truncate font-bold text-lg sm:text-xl">
                    Edit Profile
                  </h2>
                </div>
                <button
                  onClick={saveProfileModal}
                  className="min-h-[44px] shrink-0 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm hover:bg-primary/90 active:bg-primary/90 sm:px-6"
                >
                  Save
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* Banner Image Section */}
                <div className="relative h-32 bg-muted sm:h-48">
                  {currentBanner && (
                    <Image
                      src={currentBanner}
                      alt="Banner"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <input
                      ref={bannerImageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cycleBanner('prev')}
                        className="rounded-full bg-black/60 p-2 text-primary-foreground transition-colors hover:bg-black/80"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => bannerImageInputRef.current?.click()}
                        className="flex min-h-[44px] items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-primary-foreground transition-colors hover:bg-black/80 active:bg-black/80 sm:px-4"
                        aria-label="Change banner"
                      >
                        <Camera className="h-4 w-4 shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">
                          Change banner
                        </span>
                      </button>
                      <button
                        onClick={() => cycleBanner('next')}
                        className="rounded-full bg-black/60 p-2 text-primary-foreground transition-colors hover:bg-black/80"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Image Section */}
                <div className="-mt-12 sm:-mt-16 mb-6 px-4">
                  <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                    <div className="h-full w-full overflow-hidden rounded-full border-4 border-background">
                      {currentProfileImage && (
                        <Image
                          src={currentProfileImage}
                          alt="Profile"
                          width={128}
                          height={128}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                    {/* Mobile: Visible buttons */}
                    <div className="-bottom-2 -right-2 absolute flex items-center gap-1 sm:hidden">
                      <button
                        onClick={() => cycleProfilePicture('prev')}
                        className="rounded-full border-2 border-background bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => profileImageInputRef.current?.click()}
                        className="rounded-full border-2 border-background bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
                        aria-label="Change profile picture"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => cycleProfilePicture('next')}
                        className="rounded-full border-2 border-background bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Desktop: Hover overlay */}
                    <div className="absolute inset-0 hidden items-center justify-center gap-1 rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100 sm:flex">
                      <button
                        onClick={() => cycleProfilePicture('prev')}
                        className="rounded-full bg-black/60 p-1.5 text-primary-foreground transition-colors hover:bg-black/80"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => profileImageInputRef.current?.click()}
                        className="rounded-full bg-black/60 p-2 text-primary-foreground transition-colors hover:bg-black/80"
                        aria-label="Change profile picture"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => cycleProfilePicture('next')}
                        className="rounded-full bg-black/60 p-1.5 text-primary-foreground transition-colors hover:bg-black/80"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5 px-4 pb-6">
                  {/* Error Message */}
                  {editModal.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400">
                      <X className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{editModal.error}</span>
                    </div>
                  )}

                  {/* Display Name */}
                  <div>
                    <label
                      htmlFor="edit-displayName"
                      className="mb-2 block font-medium text-muted-foreground text-sm"
                    >
                      Display Name
                    </label>
                    <input
                      id="edit-displayName"
                      type="text"
                      value={editModal.formData.displayName}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          formData: {
                            ...prev.formData,
                            displayName: e.target.value,
                          },
                        }))
                      }
                      placeholder="Agent name"
                      className="min-h-[44px] w-full rounded-lg border border-white/20 bg-muted/50 px-4 py-3 text-base text-foreground transition-colors focus:border-white/60 focus:outline-none focus:ring-0"
                      maxLength={50}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label
                      htmlFor="edit-username"
                      className="mb-2 block font-medium text-muted-foreground text-sm"
                    >
                      Username
                    </label>
                    <div className="flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 bg-muted/50 px-4 py-3 focus-within:border-white/60">
                      <span className="shrink-0 text-muted-foreground">@</span>
                      <input
                        id="edit-username"
                        type="text"
                        value={editModal.formData.username}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              username: e.target.value,
                            },
                          }))
                        }
                        placeholder="username"
                        className="min-w-0 flex-1 bg-transparent text-base text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="edit-bio"
                      className="mb-2 block font-medium text-muted-foreground text-sm"
                    >
                      Description
                    </label>
                    <textarea
                      id="edit-bio"
                      value={editModal.formData.bio}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, bio: e.target.value },
                        }))
                      }
                      placeholder="Brief description of your agent..."
                      rows={3}
                      maxLength={200}
                      className="w-full resize-none rounded-lg border border-white/20 bg-muted/50 px-4 py-3 text-base text-foreground transition-colors focus:border-white/60 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
