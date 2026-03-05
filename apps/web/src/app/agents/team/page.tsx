'use client';

import type {
  FeedTagData,
  MessageTag,
  PerpsTagData,
  PnlTagData,
  PostTagData,
  PredictionsTagData,
} from '@babylon/shared';
import { cn } from '@babylon/shared';

/** Type guard for PerpsTagData */
function isPerpsTagData(data: unknown): data is PerpsTagData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'markets' in d || 'market' in d;
}

/** Type guard for PredictionsTagData */
function isPredictionsTagData(data: unknown): data is PredictionsTagData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'predictions' in d || 'prediction' in d || 'status' in d;
}

/** Type guard for PostTagData */
function isPostTagData(data: unknown): data is PostTagData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    'post' in d &&
    typeof d.post === 'object' &&
    d.post !== null &&
    'id' in (d.post as Record<string, unknown>)
  );
}

/** Type guard for FeedTagData */
function isFeedTagData(data: unknown): data is FeedTagData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'posts' in d && Array.isArray(d.posts);
}

/** Type guard for PnlTagData */
function isPnlTagData(data: unknown): data is PnlTagData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'balance' in d && typeof d.balance === 'number';
}

import { getAgent } from '@babylon/api-hooks';
import { MessageCircle, PanelRight, Plus, Users, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AgentCreate } from '@/components/agents/AgentCreate';
import { AgentEditModal } from '@/components/agents/AgentEditModal';
import { TeamChatView } from '@/components/chats';
import { PageContainer } from '@/components/shared/PageContainer';
import { Separator } from '@/components/shared/Separator';
import { Skeleton } from '@/components/shared/Skeleton';
import { SpotlightTutorial } from '@/components/tutorial/SpotlightTutorial';
import { TutorialHelpButton } from '@/components/tutorial/TutorialHelpButton';
import { useAuth } from '@/hooks/useAuth';
import { useTeamChat } from '@/hooks/useTeamChat';
import {
  type TeamScope,
  useTeamTradingSummary,
} from '@/hooks/useTeamTradingSummary';
import {
  TUTORIAL_PERPS_DATA,
  TUTORIAL_PERPS_ENTITY_ID,
} from './_components/tutorial/steps';
import { useAgentsTutorial } from './_components/tutorial/useAgentsTutorial';
import { AgentPnL } from './AgentPnL';
import { AgentPortfolio } from './AgentPortfolio';
import {
  BOTTOM_PANEL_COLLAPSED_HEIGHT,
  BOTTOM_PANEL_DEFAULT_HEIGHT,
  BottomPanel,
  type BottomPanelTab,
  type EntityType,
} from './BottomPanel';
import { ConversationList } from './ConversationList';
import { MemberList } from './MemberList';
import {
  FeedPanel,
  PanelErrorBoundary,
  PerpsPanel,
  PnlPanel,
  PostPanel,
  PredictionsPanel,
} from './panels';
import {
  RIGHT_SIDEBAR_DEFAULT_WIDTH,
  RightSidebar,
  type RightSidebarTab,
} from './RightSidebar';
import { TeamPnL } from './TeamPnL';
import { TeamPortfolio } from './TeamPortfolio';

// Lazy load AgentLogs for performance
const AgentLogs = dynamic(
  () =>
    import('@/components/agents/AgentLogs').then((m) => ({
      default: m.AgentLogs,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);

// Lazy load activity feed for performance
const AgentActivityFeed = dynamic(
  () =>
    import('@/components/agents/AgentActivityFeed').then((m) => ({
      default: m.AgentActivityFeed,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

// Lazy load user activity feed for performance
const UserActivity = dynamic(
  () => import('./UserActivity').then((m) => ({ default: m.UserActivity })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

/**
 * Agent Team Chat Page (Agents)
 *
 * A unified group chat containing all the user's agents.
 * Users can @mention specific agents to direct tasks.
 */
export default function TeamChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authenticated, user, login, getAccessToken } = useAuth();

  const {
    teamChat,
    chatDetails,
    loading,
    sending,
    error,
    sseConnected,
    isLoadingMore,
    hasMore,
    messageInput,
    handleInputChange,
    typingUsers,
    thinkingAgents,
    sendError,
    messagesEndRef,
    topSentinelRef,
    sendMessage,
    toggleReaction,
    handleScroll,
    scrollToBottom,
    refresh: refreshTeamChat,
    // Agent processing state
    processingAgentIds,
    stopAgent,
    // Tag agent in input (for sidebar click)
    tagAgentInInput,
    // Conversations (fresh chat)
    conversations,
    conversationsLoading,
    createConversation,
    switchConversation,
    renameConversation,
  } = useTeamChat();

  // Mobile view state - which tab is active on mobile
  type MobileView = 'chat' | 'agents' | 'panel';
  const [mobileView, setMobileView] = useState<MobileView>('chat');

  // Left sidebar collapse state (desktop only)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);

  // Right sidebar state
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(
    RIGHT_SIDEBAR_DEFAULT_WIDTH
  );
  const [rightSidebarTabs, setRightSidebarTabs] = useState<RightSidebarTab[]>(
    []
  );
  const [activeRightTabId, setActiveRightTabId] = useState<string | null>(null);

  // Bottom panel state
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [bottomPanelTab, setBottomPanelTab] =
    useState<BottomPanelTab>('activity');
  const [bottomPanelEntityId, setBottomPanelEntityId] = useState<string | null>(
    null
  );
  const [bottomPanelEntityType, setBottomPanelEntityType] =
    useState<EntityType | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(
    BOTTOM_PANEL_DEFAULT_HEIGHT
  );

  const [teamScope, setTeamScope] = useState<TeamScope>('owner_agents');

  // Calculate current bottom panel height for RightSidebar
  const currentBottomPanelHeight = bottomPanelOpen
    ? bottomPanelHeight
    : BOTTOM_PANEL_COLLAPSED_HEIGHT;

  // Create agent modal state
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);

  // Edit agent modal state - stores the agent ID to edit
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingAgentData, setEditingAgentData] = useState<{
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
  } | null>(null);

  // Tutorial
  const tutorial = useAgentsTutorial({
    onBeforeStart: () => {
      setMobileView('agents');
    },
  });

  // Open create-agent modal when user clicks "Next" on step 2 (Create New Agents)
  const prevTutorialStepRef = useRef(tutorial.currentStep);
  useEffect(() => {
    const prev = prevTutorialStepRef.current;
    prevTutorialStepRef.current = tutorial.currentStep;
    // Step index 1 = "Create New Agents"; advancing past it opens the modal
    if (tutorial.isActive && prev === 1 && tutorial.currentStep === 2) {
      setShowCreateAgentModal(true);
    }
  }, [tutorial.isActive, tutorial.currentStep]);

  // Open create-agent modal when navigated with ?create=true (e.g. from game guide)
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateAgentModal(true);
      router.replace('/agents/team', { scroll: false });
    }
  }, [searchParams, router]);

  // Build chat details with fake tutorial messages injected at the top
  const tutorialChatDetails = useMemo(() => {
    if (!chatDetails) return chatDetails;
    // Only inject when tutorial is active and on step 3+ (Team Chat)
    if (!tutorial.isActive || tutorial.currentStep < 2) return chatDetails;

    const agentSenderId = teamChat?.agents?.[0]?.id ?? 'tutorial-agent';
    const agentName =
      teamChat?.agents?.[0]?.displayName ??
      teamChat?.agents?.[0]?.username ??
      'Agent';
    const now = new Date().toISOString();

    const fakeUserMessage = {
      id: 'tutorial-msg-user',
      content: `@${agentName}, what are the top trending perpetual markets right now?`,
      senderId: user?.id ?? 'tutorial-user',
      createdAt: now,
      stableKey: 'tutorial-msg-user',
    };

    const fakeAgentMessage = {
      id: 'tutorial-msg-agent',
      content:
        "Here are the top trending perpetual markets I'm watching right now. BTC is showing strong momentum and ETH has interesting volume patterns.",
      senderId: agentSenderId,
      createdAt: now,
      stableKey: 'tutorial-msg-agent',
      metadata: {
        tags: [
          {
            type: 'perps' as const,
            label: 'Perps Markets',
            icon: 'TrendingUp' as const,
            entityId: TUTORIAL_PERPS_ENTITY_ID,
            data: TUTORIAL_PERPS_DATA,
          },
        ],
      },
    };

    return {
      ...chatDetails,
      messages: [fakeUserMessage, fakeAgentMessage],
    };
  }, [
    chatDetails,
    tutorial.isActive,
    tutorial.currentStep,
    teamChat?.agents,
    user?.id,
  ]);

  // Sync UI state with tutorial steps (switch mobile tabs, open panels)
  useEffect(() => {
    if (!tutorial.isActive) return;
    const step = tutorial.steps[tutorial.currentStep];
    if (!step) return;

    // On mobile, switch to the correct tab
    if (step.target === '[data-tour="agents-mobile-chat-tab"]') {
      setMobileView('agents');
    } else if (step.target === '[data-tour="agents-mobile-add"]') {
      setMobileView('agents');
    }

    // Step 5: auto-open right sidebar with tutorial perps data
    if (step.target === '[data-tour="agents-right-sidebar"]') {
      const tabId = `perps-id-${TUTORIAL_PERPS_ENTITY_ID}`;
      setRightSidebarTabs((prev) => {
        if (prev.some((t) => t.id === tabId)) return prev;
        return [
          ...prev,
          {
            id: tabId,
            type: 'perps' as const,
            title: 'Perps Markets',
            data: TUTORIAL_PERPS_DATA,
          },
        ];
      });
      setActiveRightTabId(tabId);
      setRightSidebarOpen(true);
    }

    // Step 6: close right sidebar for bottom panel step
    if (step.target === '[data-tour="agents-bottom-panel"]') {
      setRightSidebarOpen(false);
      setBottomPanelOpen(true);
    }
  }, [tutorial.isActive, tutorial.currentStep, tutorial.steps]);

  // Clean up right sidebar when tutorial is dismissed/completed
  useEffect(() => {
    if (tutorial.isActive) return;
    const tutorialTabId = `perps-id-${TUTORIAL_PERPS_ENTITY_ID}`;
    setRightSidebarTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tutorialTabId);
      if (filtered.length === prev.length) return prev; // no change
      if (filtered.length === 0) {
        queueMicrotask(() => setRightSidebarOpen(false));
      }
      return filtered;
    });
  }, [tutorial.isActive]);

  // Set default entity for bottom panel - defaults to user
  // Also validates that selected agent still exists (handles agent removal)
  useEffect(() => {
    // Default to user if no selection
    if (!bottomPanelEntityId && user?.id) {
      setBottomPanelEntityId(user.id);
      setBottomPanelEntityType('user');
      // Keep current tab - activity is now available for users
      return;
    }

    // If an agent is selected, validate it still exists
    if (bottomPanelEntityType === 'agent' && bottomPanelEntityId) {
      const agents = teamChat?.agents;
      const agentExists = agents?.some((a) => a.id === bottomPanelEntityId);
      if (!agentExists) {
        // Agent was removed, fall back to user
        if (user?.id) {
          setBottomPanelEntityId(user.id);
          setBottomPanelEntityType('user');
          // Switch to activity if on logs (logs not available for users)
          if (bottomPanelTab === 'logs') {
            setBottomPanelTab('activity');
          }
        } else {
          setBottomPanelEntityId(null);
          setBottomPanelEntityType(null);
        }
      }
    }
  }, [
    teamChat?.agents,
    bottomPanelEntityId,
    bottomPanelEntityType,
    user?.id,
    bottomPanelTab,
  ]);

  // Handle entity change from bottom panel
  const handleBottomPanelEntityChange = useCallback(
    (id: string, type: EntityType) => {
      setBottomPanelEntityId(id);
      setBottomPanelEntityType(type);
      // If switching to user/team and on logs tab, switch to activity/wallet (logs not available)
      if (type === 'user' && bottomPanelTab === 'logs') {
        setBottomPanelTab('activity');
      }
      if (
        type === 'team' &&
        (bottomPanelTab === 'logs' || bottomPanelTab === 'activity')
      ) {
        setBottomPanelTab('wallet');
      }
    },
    [bottomPanelTab]
  );

  const teamSummaryEnabled =
    Boolean(user?.id) &&
    ready &&
    authenticated &&
    bottomPanelOpen &&
    bottomPanelEntityType === 'team' &&
    (bottomPanelTab === 'wallet' || bottomPanelTab === 'pnl');

  const {
    summary: teamSummary,
    loading: teamSummaryLoading,
    error: teamSummaryError,
  } = useTeamTradingSummary({
    ownerId: user?.id,
    ownerName: user?.displayName || user?.username || 'You',
    enabled: teamSummaryEnabled,
    getAccessToken,
  });

  // Agent IDs set for settings icon on latest agent messages
  const agentIds = useMemo(
    () => new Set(teamChat?.agents.map((a) => a.id) ?? []),
    [teamChat?.agents]
  );

  // Handle sidebar "Settings" - open edit modal
  const handleViewSettings = useCallback(
    async (agentId: string) => {
      setEditingAgentId(agentId);

      try {
        const data = await getAgent(agentId);
        setEditingAgentData(
          data.agent as unknown as NonNullable<typeof editingAgentData>
        );
      } catch {
        toast.error('Failed to fetch agent details');
        setEditingAgentId(null);
      }
    },
    []
  );

  // Close a right sidebar tab - auto-closes sidebar when last tab is closed
  const closeRightTab = useCallback((tabId: string) => {
    setRightSidebarTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      // Close sidebar if this was the last tab
      if (newTabs.length === 0) {
        // Schedule to avoid state update during render
        queueMicrotask(() => setRightSidebarOpen(false));
      }
      return newTabs;
    });
  }, []);

  // Effect to sync activeRightTabId when tabs change (e.g., after closing)
  useEffect(() => {
    // If active tab no longer exists, select the last remaining tab or clear
    if (
      activeRightTabId &&
      !rightSidebarTabs.some((t) => t.id === activeRightTabId)
    ) {
      const lastTab = rightSidebarTabs[rightSidebarTabs.length - 1];
      setActiveRightTabId(lastTab?.id ?? null);
    }
  }, [rightSidebarTabs, activeRightTabId]);

  // Toggle right sidebar
  const toggleRightSidebar = useCallback(() => {
    setRightSidebarOpen((prev) => !prev);
  }, []);

  // Handle tag click from message bubble - opens panel in right sidebar
  // Uses messageId to create unique tabs for list views from different messages
  const handleTagClick = useCallback((tag: MessageTag, messageId: string) => {
    // Compute the tab ID
    // - For single-item views (with entityId): share tab across messages (e.g., same market)
    // - For list views (no entityId): unique per message to prevent overwrites
    const tabId = tag.entityId
      ? `${tag.type}-id-${tag.entityId}`
      : `${tag.type}-list-${messageId}`;

    setRightSidebarTabs((prev) => {
      // Check if a matching tab already exists
      const existingTab = prev.find((t) => t.id === tabId);

      if (existingTab) {
        // Tab exists - update the data for the existing tab
        return prev.map((t) =>
          t.id === existingTab.id
            ? { ...t, data: tag.data, title: tag.label }
            : t
        );
      }

      // Create new tab
      return [
        ...prev,
        {
          id: tabId,
          type: tag.type,
          title: tag.label,
          data: tag.data,
        },
      ];
    });

    // Set active tab and open sidebar outside the updater
    setActiveRightTabId(tabId);
    setRightSidebarOpen(true);
  }, []);

  // Handle query parameters for agent actions
  // - selectAgent: Tags the agent in the input (from agent profile redirect)
  // - openWallet: Opens bottom panel with wallet tab (from insufficient balance)
  // Combined into single effect to avoid race conditions if both params present
  useEffect(() => {
    if (loading || !teamChat) return;

    const agentIdToSelect = searchParams.get('selectAgent');
    const agentIdForWallet = searchParams.get('openWallet');

    // Nothing to do if no relevant query params
    if (!agentIdToSelect && !agentIdForWallet) return;

    // Handle selectAgent - tag the agent in the input
    if (agentIdToSelect) {
      const agent = teamChat.agents.find((a) => a.id === agentIdToSelect);
      if (agent) {
        tagAgentInInput(agent);
      }
    }

    // Handle openWallet - open bottom panel with wallet tab
    // (prioritize over selectAgent if both present)
    if (agentIdForWallet) {
      const agent = teamChat.agents.find((a) => a.id === agentIdForWallet);
      if (agent) {
        setBottomPanelEntityId(agent.id);
        setBottomPanelEntityType('agent');
        setBottomPanelTab('wallet');
        setBottomPanelOpen(true);
      }
    }

    // Clean up URL by removing query parameters
    router.replace('/agents/team', { scroll: false });
  }, [searchParams, loading, teamChat, tagAgentInInput, router]);

  // Scroll to bottom on initial load
  // Uses MutationObserver to keep scrolling as images/content load
  useEffect(() => {
    // Only scroll when loaded data
    if (!teamChat?.chatId || loading) return;

    // Find the visible scroll container (mobile and desktop render separate
    // TeamChatView instances — pick the one that's actually visible).
    const containers = document.querySelectorAll<HTMLElement>(
      '[data-chat-messages-container]'
    );
    let container: HTMLElement | null = null;
    for (const el of containers) {
      if (el.offsetHeight > 0) {
        container = el;
        break;
      }
    }
    if (!container) {
      scrollToBottom('instant');
      return;
    }

    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;
    const IDLE_MS = 500; // Stop after 500ms of no DOM changes
    const MAX_TIME = 2000; // Hard timeout after 2 seconds
    const startTime = Date.now();
    let isActive = true;

    const scrollToEnd = () => {
      container.scrollTop = container.scrollHeight;
    };

    const finish = () => {
      isActive = false;
      observer?.disconnect();
      if (idleTimeout) clearTimeout(idleTimeout);
    };

    // Scroll immediately
    scrollToEnd();

    // Watch for DOM changes (images loading, etc.) and scroll on each
    observer = new MutationObserver(() => {
      if (!isActive) return;

      // Check hard timeout
      if (Date.now() - startTime > MAX_TIME) {
        scrollToEnd();
        finish();
        return;
      }

      // Scroll on mutation
      scrollToEnd();

      // Reset idle timer - finish after no changes for IDLE_MS
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        scrollToEnd();
        finish();
      }, IDLE_MS);
    });

    // Observe childList and subtree for content changes
    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    // Start idle timer (will finish if no mutations happen)
    idleTimeout = setTimeout(() => {
      scrollToEnd();
      finish();
    }, IDLE_MS);

    return () => {
      observer?.disconnect();
      if (idleTimeout) clearTimeout(idleTimeout);
    };
  }, [teamChat?.chatId, loading, scrollToBottom]);

  // Auth required — redirect to feed and show login
  useEffect(() => {
    if (!ready || authenticated) return;
    router.push('/feed');
    const timer = setTimeout(() => login(), 500);
    return () => clearTimeout(timer);
  }, [ready, authenticated, router, login]);

  if (ready && !authenticated) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-56px-var(--bottom-nav-height))] flex-col md:h-dvh">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Member sidebar skeleton */}
          <div className="hidden w-80 flex-col border-border border-r p-4 lg:flex">
            <Skeleton className="mb-4 h-8 w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
          {/* Chat area skeleton */}
          <div className="flex flex-1 flex-col">
            <div className="p-4">
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex-1" />
          </div>
        </div>
      </div>
    );
  }

  // Error state - check BEFORE empty state so real errors are shown
  if (error) {
    return (
      <PageContainer noPadding className="flex flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 font-bold text-foreground text-xl">
              Failed to load Agents
            </h2>
            <p className="mb-6 text-muted-foreground">{error}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <div
      data-command-center-container
      className="relative mt-14 flex h-[calc(100dvh-56px-var(--bottom-nav-height))] flex-col overflow-hidden border-border md:mt-0 md:h-dvh lg:border-l"
    >
      {/* Mobile Tab Navigation - visible on small screens only */}
      <div
        data-tour="agents-mobile-tabs"
        className="flex h-12 shrink-0 items-center justify-around border-border border-b bg-background lg:hidden"
      >
        <button
          type="button"
          onClick={() => setMobileView('agents')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
            mobileView === 'agents'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-5 w-5" />
          <span>Agents</span>
        </button>
        <button
          type="button"
          data-tour="agents-mobile-chat-tab"
          onClick={() => setMobileView('chat')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
            mobileView === 'chat'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span>Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('panel')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
            mobileView === 'panel'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PanelRight className="h-5 w-5" />
          <span>Panel</span>
        </button>
      </div>

      {/* Mobile Content Views - visible on small screens only */}
      {/* Agents View (Mobile) */}
      <div
        className={cn(
          'min-h-0 flex-1 flex-col overflow-hidden bg-sidebar lg:hidden',
          mobileView === 'agents' ? 'flex' : 'hidden'
        )}
      >
        {/* Scrollable content wrapper */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Conversations Section */}
          <div className="p-3">
            <ConversationList
              conversations={conversations}
              loading={conversationsLoading}
              onNewChat={() => createConversation()}
              onSelectConversation={(id) => {
                switchConversation(id);
                setMobileView('chat');
              }}
              onRenameConversation={renameConversation}
            />
          </div>

          <Separator />

          {/* Agents Header */}
          <div className="flex items-center justify-between p-3">
            <h2 className="font-bold text-foreground text-xl">Agents</h2>
            <button
              type="button"
              data-tour="agents-mobile-add"
              onClick={() => setShowCreateAgentModal(true)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Add agent"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Member list - no longer needs flex-1 since parent scrolls */}
          <MemberList
            teamChat={teamChat}
            processingAgentIds={processingAgentIds}
            onTagAgent={(username) => {
              tagAgentInInput(username);
              setMobileView('chat');
            }}
            onStopAgent={stopAgent}
            onViewSettings={(agentId) => {
              handleViewSettings(agentId);
            }}
          />
        </div>
      </div>

      {/* Panel View (Mobile) - Right sidebar content */}
      <div
        className={`min-h-0 flex-1 flex-col overflow-hidden bg-background lg:hidden ${
          mobileView === 'panel' ? 'flex' : 'hidden'
        }`}
      >
        {rightSidebarTabs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-muted-foreground text-sm">
              No panels open. Click on message tags to open panels.
            </span>
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="shrink-0 overflow-x-auto border-border border-b bg-muted/30 px-2 py-1">
              <div className="flex items-center gap-1">
                {rightSidebarTabs.map((tab) => (
                  <div
                    key={tab.id}
                    role="tab"
                    aria-selected={activeRightTabId === tab.id}
                    tabIndex={0}
                    onClick={() => setActiveRightTabId(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveRightTabId(tab.id);
                      }
                    }}
                    className={`group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      activeRightTabId === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="max-w-[100px] truncate">{tab.title}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeRightTab(tab.id);
                      }}
                      className={`rounded p-0.5 text-muted-foreground opacity-0 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100 ${
                        activeRightTabId === tab.id ? 'opacity-100' : ''
                      }`}
                      aria-label={`Close ${tab.title}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-auto">
              {rightSidebarTabs.map((tab) => {
                if (tab.id !== activeRightTabId) return null;

                let content: React.ReactNode = null;

                if (tab.type === 'perps' && isPerpsTagData(tab.data)) {
                  content = <PerpsPanel data={tab.data} />;
                } else if (
                  tab.type === 'predictions' &&
                  isPredictionsTagData(tab.data)
                ) {
                  content = <PredictionsPanel data={tab.data} />;
                } else if (tab.type === 'post' && isPostTagData(tab.data)) {
                  content = <PostPanel data={tab.data} />;
                } else if (tab.type === 'feed' && isFeedTagData(tab.data)) {
                  content = <FeedPanel data={tab.data} />;
                } else if (tab.type === 'agent-pnl' && isPnlTagData(tab.data)) {
                  content = <PnlPanel data={tab.data} type="agent-pnl" />;
                } else if (tab.type === 'owner-pnl' && isPnlTagData(tab.data)) {
                  content = <PnlPanel data={tab.data} type="owner-pnl" />;
                }

                return (
                  <PanelErrorBoundary key={tab.id}>
                    {content}
                  </PanelErrorBoundary>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Mobile Chat View */}
      <div
        className={`min-h-0 flex-1 flex-col overflow-hidden bg-background lg:hidden ${
          mobileView === 'chat' ? 'flex' : 'hidden'
        }`}
      >
        <TeamChatView
          chatDetails={tutorialChatDetails}
          currentUserId={user?.id}
          authenticated={authenticated}
          sseConnected={sseConnected}
          hideHeader={true}
          loading={false}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          messageInput={messageInput}
          sending={sending}
          sendError={sendError}
          topSentinelRef={topSentinelRef}
          messagesEndRef={messagesEndRef}
          onMessageChange={handleInputChange}
          onSendMessage={sendMessage}
          onToggleReaction={toggleReaction}
          agents={[
            ...(user
              ? [
                  {
                    id: user.id,
                    username: user.username || null,
                    displayName: user.displayName || user.username || 'You',
                    profileImageUrl: user.profileImageUrl || null,
                  },
                ]
              : []),
            ...(teamChat?.agents.map((agent) => ({
              id: agent.id,
              username: agent.username,
              displayName: agent.displayName,
              profileImageUrl: agent.profileImageUrl,
            })) || []),
          ]}
          typingUsers={typingUsers}
          thinkingAgents={thinkingAgents}
          onShowMembers={() => setMobileView('agents')}
          onScroll={handleScroll}
          onTagClick={(tag, messageId) => {
            handleTagClick(tag, messageId);
            setMobileView('panel');
          }}
          agentIds={agentIds}
          onViewSettings={handleViewSettings}
          onInputFocus={() => {
            setTimeout(() => scrollToBottom('smooth'), 150);
          }}
        />
      </div>

      {/* Desktop Layout - hidden on mobile */}
      <div className="hidden min-h-0 flex-1 overflow-hidden lg:flex">
        {/* Member Sidebar - visible on lg+ when not collapsed */}
        {!leftSidebarCollapsed && (
          <>
            <div
              data-tour="agents-member-list"
              className="flex w-80 shrink-0 flex-col border-border border-r"
            >
              {/* Conversations Section */}
              <div className="p-3">
                <ConversationList
                  conversations={conversations}
                  loading={conversationsLoading}
                  onNewChat={() => createConversation()}
                  onSelectConversation={switchConversation}
                  onRenameConversation={renameConversation}
                />
              </div>

              <Separator />

              {/* Agents Header */}
              <div className="flex items-center justify-between p-3">
                <h2 className="font-bold text-foreground text-xl">Agents</h2>
                <div className="flex items-center gap-1">
                  <TutorialHelpButton onClick={tutorial.restart} />
                  <button
                    type="button"
                    data-tour="agents-add-button"
                    onClick={() => setShowCreateAgentModal(true)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label="Add agent"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Member list - extracted component */}
              <MemberList
                teamChat={teamChat}
                processingAgentIds={processingAgentIds}
                onTagAgent={tagAgentInInput}
                onStopAgent={stopAgent}
                onViewSettings={handleViewSettings}
              />
            </div>
          </>
        )}

        {/* Chat Content - min-width ensures chat doesn't get too small on desktop */}
        <div
          data-tour="agents-chat-area"
          className="flex min-h-0 min-w-0 flex-1 flex-col bg-background"
        >
          <TeamChatView
            chatDetails={tutorialChatDetails}
            currentUserId={user?.id}
            authenticated={authenticated}
            sseConnected={sseConnected}
            loading={false}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            messageInput={messageInput}
            sending={sending}
            sendError={sendError}
            topSentinelRef={topSentinelRef}
            messagesEndRef={messagesEndRef}
            onMessageChange={handleInputChange}
            onSendMessage={sendMessage}
            onToggleReaction={toggleReaction}
            agents={[
              // Include current user so they can mention themselves
              ...(user
                ? [
                    {
                      id: user.id,
                      username: user.username || null,
                      displayName: user.displayName || user.username || 'You',
                      profileImageUrl: user.profileImageUrl || null,
                    },
                  ]
                : []),
              // Include all agents
              ...(teamChat?.agents.map((agent) => ({
                id: agent.id,
                username: agent.username,
                displayName: agent.displayName,
                profileImageUrl: agent.profileImageUrl,
              })) || []),
            ]}
            typingUsers={typingUsers}
            thinkingAgents={thinkingAgents}
            onScroll={handleScroll}
            leftSidebarCollapsed={leftSidebarCollapsed}
            onToggleLeftSidebar={() => setLeftSidebarCollapsed((p) => !p)}
            rightSidebarOpen={rightSidebarOpen}
            onToggleRightSidebar={toggleRightSidebar}
            onTagClick={handleTagClick}
            agentIds={agentIds}
            onViewSettings={handleViewSettings}
            onInputFocus={() => {
              setTimeout(() => scrollToBottom('smooth'), 150);
            }}
          />
        </div>

        {/* Spacer for right sidebar - only on desktop to make room for fixed sidebar */}
        {rightSidebarOpen && (
          <div
            className="hidden shrink-0 lg:block"
            style={{ width: rightSidebarWidth }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Bottom Panel - spans full width, hidden on mobile */}
      <div className="hidden lg:contents">
        <BottomPanel
          isOpen={bottomPanelOpen}
          onToggle={() => setBottomPanelOpen((prev) => !prev)}
          activeTab={bottomPanelTab}
          onTabChange={setBottomPanelTab}
          selectedEntityId={bottomPanelEntityId}
          selectedEntityType={bottomPanelEntityType}
          onEntityChange={handleBottomPanelEntityChange}
          userId={user?.id}
          userName={user?.displayName || user?.username || 'You'}
          agents={
            teamChat?.agents.map((a) => ({
              id: a.id,
              name: a.displayName || a.username || 'Agent',
            })) || []
          }
          height={bottomPanelHeight}
          onHeightChange={setBottomPanelHeight}
        >
          {bottomPanelEntityId && bottomPanelEntityType && (
            <>
              {/* Activity Tab */}
              {bottomPanelTab === 'activity' && (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {bottomPanelEntityType === 'agent' ? (
                    <div className="p-4">
                      <AgentActivityFeed
                        agentId={bottomPanelEntityId}
                        limit={20}
                        showAgent={false}
                        showConnectionStatus={false}
                        emptyMessage="No activity from this agent yet."
                      />
                    </div>
                  ) : (
                    <div className="p-4">
                      <UserActivity userId={bottomPanelEntityId} />
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Tab */}
              {bottomPanelTab === 'wallet' &&
                (() => {
                  if (bottomPanelEntityType === 'team') {
                    return (
                      <TeamPortfolio
                        summary={teamSummary}
                        loading={teamSummaryLoading}
                        error={teamSummaryError}
                        scope={teamScope}
                        onScopeChange={setTeamScope}
                        onSelectMember={handleBottomPanelEntityChange}
                      />
                    );
                  }
                  if (bottomPanelEntityType === 'user') {
                    return (
                      <AgentPortfolio
                        entityType="user"
                        userId={bottomPanelEntityId}
                        entityName={
                          user?.displayName || user?.username || 'You'
                        }
                      />
                    );
                  }
                  const bottomAgent = teamChat?.agents.find(
                    (a) => a.id === bottomPanelEntityId
                  );
                  return (
                    <AgentPortfolio
                      entityType="agent"
                      agentId={bottomPanelEntityId}
                      entityName={
                        bottomAgent?.displayName ||
                        bottomAgent?.username ||
                        'Agent'
                      }
                    />
                  );
                })()}

              {/* PnL Tab */}
              {bottomPanelTab === 'pnl' &&
                (() => {
                  if (bottomPanelEntityType === 'team') {
                    return (
                      <TeamPnL
                        summary={teamSummary}
                        loading={teamSummaryLoading}
                        error={teamSummaryError}
                        scope={teamScope}
                        onScopeChange={setTeamScope}
                        onSelectMember={handleBottomPanelEntityChange}
                      />
                    );
                  }
                  if (bottomPanelEntityType === 'user') {
                    return (
                      <AgentPnL
                        entityType={'user' as const}
                        userId={bottomPanelEntityId}
                        entityName={
                          user?.displayName || user?.username || 'You'
                        }
                      />
                    );
                  }
                  const bottomAgent = teamChat?.agents.find(
                    (a) => a.id === bottomPanelEntityId
                  );
                  return (
                    <AgentPnL
                      entityType={'agent' as const}
                      agentId={bottomPanelEntityId}
                      entityName={
                        bottomAgent?.displayName ||
                        bottomAgent?.username ||
                        'Agent'
                      }
                    />
                  );
                })()}

              {/* Logs Tab - only for agents */}
              {bottomPanelTab === 'logs' &&
                bottomPanelEntityType === 'agent' && (
                  <div className="p-4">
                    <AgentLogs agentId={bottomPanelEntityId} />
                  </div>
                )}
            </>
          )}
        </BottomPanel>
      </div>

      {/* Right Sidebar - Fixed position overlay, desktop only */}
      {rightSidebarOpen && (
        <div className="hidden lg:block">
          <RightSidebar
            tabs={rightSidebarTabs}
            activeTabId={activeRightTabId}
            onTabSelect={setActiveRightTabId}
            onTabClose={closeRightTab}
            width={rightSidebarWidth}
            onWidthChange={setRightSidebarWidth}
            onClose={() => setRightSidebarOpen(false)}
            leftSidebarCollapsed={leftSidebarCollapsed}
            bottomPanelHeight={currentBottomPanelHeight}
          >
            {rightSidebarTabs
              .filter((tab) => tab.id === activeRightTabId)
              .map((tab) => {
                // Render panel based on tab type
                let content: React.ReactNode = null;

                if (tab.type === 'perps' && isPerpsTagData(tab.data)) {
                  content = <PerpsPanel data={tab.data} />;
                } else if (
                  tab.type === 'predictions' &&
                  isPredictionsTagData(tab.data)
                ) {
                  content = <PredictionsPanel data={tab.data} />;
                } else if (tab.type === 'post' && isPostTagData(tab.data)) {
                  content = <PostPanel data={tab.data} />;
                } else if (tab.type === 'feed' && isFeedTagData(tab.data)) {
                  content = <FeedPanel data={tab.data} />;
                } else if (tab.type === 'agent-pnl' && isPnlTagData(tab.data)) {
                  content = <PnlPanel data={tab.data} type="agent-pnl" />;
                } else if (tab.type === 'owner-pnl' && isPnlTagData(tab.data)) {
                  content = <PnlPanel data={tab.data} type="owner-pnl" />;
                } else if (content === null) {
                  // Fallback for unrecognized tab types, invalid data, or missing agentId
                  content = (
                    <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
                      <span className="text-sm">
                        Unable to display panel: {tab.type}
                      </span>
                    </div>
                  );
                }

                return (
                  <PanelErrorBoundary key={tab.id}>
                    {content}
                  </PanelErrorBoundary>
                );
              })}
          </RightSidebar>
        </div>
      )}

      {/* Create Agent Modal - AgentCreate handles its own modal display */}
      {showCreateAgentModal && (
        <AgentCreate
          onBack={() => setShowCreateAgentModal(false)}
          onSuccess={async (agent) => {
            setShowCreateAgentModal(false);
            await refreshTeamChat();
            // Use the agent parameter directly - don't rely on stale teamChat
            // The agent object from onSuccess contains the core data we need
            if (agent.username) {
              tagAgentInInput({
                id: agent.id,
                username: agent.username,
                displayName: agent.displayName ?? null,
                profileImageUrl: agent.profileImageUrl ?? null,
                isAgent: true,
                modelTier: agent.modelTier ?? 'pro',
                virtualBalance: agent.virtualBalance ?? 0,
              });
            }
          }}
          compact
        />
      )}

      {/* Edit Agent Modal */}
      {editingAgentId && editingAgentData && (
        <AgentEditModal
          agent={editingAgentData}
          onClose={() => {
            setEditingAgentId(null);
            setEditingAgentData(null);
          }}
          onUpdate={() => {
            refreshTeamChat();
          }}
        />
      )}

      <SpotlightTutorial
        isActive={tutorial.isActive && !showCreateAgentModal}
        currentStep={tutorial.currentStep}
        steps={tutorial.steps}
        next={tutorial.next}
        prev={tutorial.prev}
        dismiss={tutorial.dismiss}
      />
    </div>
  );
}
