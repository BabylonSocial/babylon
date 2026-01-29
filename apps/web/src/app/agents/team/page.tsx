'use client';

import { cn } from '@babylon/shared';
import {
  Activity,
  Bot,
  MessageCircle,
  Plus,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AgentCreate } from '@/components/agents/AgentCreate';
import {
  AgentDetail,
  type AgentDetailData,
  AgentDetailSkeleton,
  type AgentDetailTab,
} from '@/components/agents/AgentDetail';
import { TeamChatView } from '@/components/chats';
import { Avatar } from '@/components/shared/Avatar';
import { PageContainer } from '@/components/shared/PageContainer';
import { Separator } from '@/components/shared/Separator';
import { Skeleton } from '@/components/shared/Skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTeamChat } from '@/hooks/useTeamChat';
import { ActivityFilters, type ActivityType } from './ActivityFilters';
import { ConversationList } from './ConversationList';
import { MemberList } from './MemberList';

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
          <div key={i} className="rounded-lg border border-zinc-800 p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-zinc-800" />
                <div className="h-3 w-32 rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

/** Tab type for Agents */
type TabType = 'chat' | 'agents' | 'activity';

/** Agent data for agents tab */
interface AgentData {
  id: string;
  name: string;
  username?: string;
  description?: string;
  profileImageUrl?: string;
  virtualBalance?: number;
  isActive: boolean;
  autonomousEnabled: boolean;
  modelTier: 'free' | 'pro';
  status: string;
  lifetimePnL: string;
  totalTrades: number;
  winRate: number;
  lastTickAt?: string;
  lastChatAt?: string;
  createdAt: string;
}

/**
 * Agent Team Chat Page (Agents)
 *
 * A unified group chat containing all the user's agents.
 * Users can @mention specific agents to direct tasks.
 */
export default function TeamChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authenticated, user, getAccessToken, login } = useAuth();

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
    handleScroll,
    scrollToBottom,
    refresh: refreshTeamChat,
    // Agent selection
    selectedAgentIds,
    processingAgentIds,
    toggleAgentSelection,
    selectAgent,
    stopAgent,
    // Conversations (fresh chat)
    conversations,
    conversationsLoading,
    createConversation,
    switchConversation,
    renameConversation,
  } = useTeamChat();

  // Mobile member drawer state
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // Agents tab state
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentFilter, setAgentFilter] = useState<'all' | 'active' | 'idle'>(
    'all'
  );

  // Selected agent detail state (for viewing agent within Agents page)
  const [selectedAgentDetail, setSelectedAgentDetail] =
    useState<AgentDetailData | null>(null);
  const [selectedAgentLoading, setSelectedAgentLoading] = useState(false);
  const [selectedAgentDefaultTab, setSelectedAgentDefaultTab] =
    useState<AgentDetailTab>('activity');

  // Create agent view state
  const [showCreateAgent, setShowCreateAgent] = useState(false);

  // Activity tab filter state
  const [activityTypeFilter, setActivityTypeFilter] =
    useState<ActivityType>('all');
  const [activityAgentFilter, setActivityAgentFilter] = useState<string | null>(
    null
  );

  // Fetch agents for Agents tab
  const fetchAgents = useCallback(async () => {
    setAgentsLoading(true);
    const token = await getAccessToken();

    if (!token) {
      setAgentsLoading(false);
      return;
    }

    let url = '/api/agents';
    if (agentFilter === 'active') {
      url += '?autonomousTrading=true';
    } else if (agentFilter === 'idle') {
      url += '?autonomousTrading=false';
    }

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setAgentsLoading(false);
    }
  }, [getAccessToken, agentFilter]);

  // Fetch full agent detail when clicking an agent card
  const fetchAgentDetail = useCallback(
    async (agentId: string) => {
      setSelectedAgentLoading(true);
      const token = await getAccessToken();

      if (!token) {
        setSelectedAgentLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/agents/${agentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedAgentDetail(data.agent);
        }
      } catch (err) {
        console.error('Failed to fetch agent detail:', err);
      } finally {
        setSelectedAgentLoading(false);
      }
    },
    [getAccessToken]
  );

  // Clear selected agent (go back to grid)
  const clearSelectedAgent = useCallback(() => {
    setSelectedAgentDetail(null);
  }, []);

  // Handle sidebar "View Profile" - switch to Agents tab and show detail
  const handleViewProfile = useCallback(
    (agentId: string) => {
      router.push(`/profile/${agentId}`);
    },
    [router]
  );

  // Handle sidebar "Settings" - switch to Agents tab and show detail with Settings tab
  const handleViewSettings = useCallback(
    (agentId: string) => {
      setActiveTab('agents');
      setShowCreateAgent(false);
      setSelectedAgentDefaultTab('settings');
      fetchAgentDetail(agentId);
    },
    [fetchAgentDetail]
  );

  // Handle sidebar "Add Agent" - switch to Agents tab and show create form
  const handleAddAgent = useCallback(() => {
    setActiveTab('agents');
    setSelectedAgentDetail(null);
    setShowCreateAgent(true);
  }, []);

  // Fetch agents when switching to Agents tab or filter changes
  useEffect(() => {
    if (activeTab === 'agents' && authenticated) {
      fetchAgents();
    }
  }, [activeTab, authenticated, fetchAgents]);

  // Clear selected agent and create view when switching away from Agents tab
  useEffect(() => {
    if (activeTab !== 'agents') {
      setSelectedAgentDetail(null);
      setShowCreateAgent(false);
    }
  }, [activeTab]);

  // Handle selectAgent from query parameter (when redirected from agent profile)
  useEffect(() => {
    const agentIdToSelect = searchParams.get('selectAgent');
    if (agentIdToSelect && !loading && teamChat) {
      // Select the agent in the sidebar
      selectAgent(agentIdToSelect);
      // Clean up URL by removing the query parameter
      router.replace('/agents/team', { scroll: false });
    }
  }, [searchParams, loading, teamChat, selectAgent, router]);

  // Scroll to bottom when switching to chat tab or on initial load
  // Uses MutationObserver to keep scrolling as images/content load
  useEffect(() => {
    // Only scroll when on chat tab with loaded data
    if (activeTab !== 'chat' || !teamChat?.chatId || loading) return;

    const endMarker = messagesEndRef.current;
    if (!endMarker) return;

    // Find the scroll container
    const container = endMarker.closest('[data-chat-messages-container]');
    if (!container) {
      // Fallback: just scroll once
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
      endMarker.scrollIntoView({ behavior: 'auto', block: 'end' });
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
  }, [activeTab, teamChat?.chatId, loading, messagesEndRef, scrollToBottom]);

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
      <div className="flex h-[calc(100dvh-112px)] flex-col md:h-dvh">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Member sidebar skeleton */}
          <div className="hidden w-64 flex-col border-border border-r p-4 lg:flex">
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
    <div className="flex h-[calc(100dvh-112px)] flex-col md:h-dvh">
      {/* Mobile Member Drawer - only for Chat tab */}
      {showMemberDrawer && activeTab === 'chat' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setShowMemberDrawer(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel - slides in from right */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="slide-in-from-right fixed top-0 right-0 bottom-0 z-50 flex w-[280px] animate-in flex-col bg-sidebar duration-300 lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h3 id="drawer-title" className="font-semibold text-foreground">
                Agents
              </h3>
              <button
                onClick={() => setShowMemberDrawer(false)}
                className="rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Separator />

            {/* Conversations Section */}
            <div className="p-3">
              <ConversationList
                conversations={conversations}
                loading={conversationsLoading}
                onNewChat={() => createConversation()}
                onSelectConversation={switchConversation}
                onRenameConversation={renameConversation}
                onClose={() => setShowMemberDrawer(false)}
              />
            </div>

            <Separator />

            {/* Team Members Header */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm">
                Team Members
              </h3>
            </div>

            <Separator />

            {/* Member list - extracted component */}
            <MemberList
              teamChat={teamChat}
              onClose={() => setShowMemberDrawer(false)}
              selectedAgentIds={selectedAgentIds}
              processingAgentIds={processingAgentIds}
              onToggleAgent={toggleAgentSelection}
              onStopAgent={stopAgent}
              onViewProfile={handleViewProfile}
              onViewSettings={handleViewSettings}
              onAddAgent={handleAddAgent}
            />
          </div>
        </>
      )}

      {/* Tab Bar */}
      <div className="shrink-0 border-border border-b bg-background">
        <div className="flex gap-1 px-4 py-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors',
              activeTab === 'chat'
                ? 'bg-blue-500/10 text-blue-500'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors',
              activeTab === 'agents'
                ? 'bg-blue-500/10 text-blue-500'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Bot className="h-4 w-4" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors',
              activeTab === 'activity'
                ? 'bg-blue-500/10 text-blue-500'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Activity className="h-4 w-4" />
            Activity
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Member Sidebar - only visible on Chat tab for lg+ */}
        {activeTab === 'chat' && (
          <>
            <div className="hidden w-64 flex-col border-border border-r lg:flex">
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

              {/* Team Members Header */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground">Team Members</h3>
              </div>

              <Separator />

              {/* Member list - extracted component */}
              <MemberList
                teamChat={teamChat}
                selectedAgentIds={selectedAgentIds}
                processingAgentIds={processingAgentIds}
                onToggleAgent={toggleAgentSelection}
                onStopAgent={stopAgent}
                onViewProfile={handleViewProfile}
                onViewSettings={handleViewSettings}
                onAddAgent={handleAddAgent}
              />
            </div>

            <Separator orientation="vertical" className="hidden lg:block" />
          </>
        )}

        {/* Tab Content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <TeamChatView
              chatDetails={chatDetails}
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
              onShowMembers={() => setShowMemberDrawer(true)}
              onScroll={handleScroll}
              // Selected agents - persists after send, shows processing state
              selectedAgents={
                teamChat?.agents
                  .filter((a) => selectedAgentIds.has(a.id))
                  .map((a) => ({
                    id: a.id,
                    displayName: a.displayName || a.username || 'Agent',
                    profileImageUrl: a.profileImageUrl,
                    isProcessing: processingAgentIds.has(a.id),
                  })) || []
              }
              onRemoveSelectedAgent={toggleAgentSelection}
              // Disable input if any selected agent is processing
              hasProcessingSelected={
                selectedAgentIds.size > 0 &&
                Array.from(selectedAgentIds).some((id) =>
                  processingAgentIds.has(id)
                )
              }
            />
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div className="flex-1 overflow-y-auto">
              {/* Show AgentCreate when creating */}
              {showCreateAgent ? (
                <div className="p-4">
                  <AgentCreate
                    onBack={() => setShowCreateAgent(false)}
                    backLabel="Back to Agents"
                    onSuccess={async (agent) => {
                      setShowCreateAgent(false);
                      // Refresh team chat to include the new agent
                      await refreshTeamChat();
                      // Switch to chat tab
                      setActiveTab('chat');
                      // Select only the new agent (use selectAgent to avoid toggle issues)
                      selectAgent(agent.id);
                    }}
                    compact
                  />
                </div>
              ) : /* Show AgentDetail when an agent is selected */
              selectedAgentDetail ? (
                <div className="p-4">
                  <AgentDetail
                    agent={selectedAgentDetail}
                    onUpdate={() => fetchAgentDetail(selectedAgentDetail.id)}
                    onBack={clearSelectedAgent}
                    backLabel="Back to Agents"
                    compact
                    defaultTab={selectedAgentDefaultTab}
                  />
                </div>
              ) : selectedAgentLoading ? (
                <div className="p-4">
                  <AgentDetailSkeleton compact />
                </div>
              ) : (
                <div className="p-4">
                  {/* Header with filters and create button */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAgentFilter('all')}
                        className={cn(
                          'rounded-full px-4 py-2 font-medium text-sm transition-all',
                          agentFilter === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        )}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setAgentFilter('active')}
                        className={cn(
                          'rounded-full px-4 py-2 font-medium text-sm transition-all',
                          agentFilter === 'active'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        )}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setAgentFilter('idle')}
                        className={cn(
                          'rounded-full px-4 py-2 font-medium text-sm transition-all',
                          agentFilter === 'idle'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        )}
                      >
                        Idle
                      </button>
                    </div>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowCreateAgent(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create Agent
                    </Button>
                  </div>

                  {/* Agent Cards Grid */}
                  {agentsLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse rounded-lg bg-muted/30 p-6"
                        >
                          <div className="mb-4 flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="mb-2 h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 px-4 py-16">
                      <Bot className="mb-4 h-16 w-16 text-blue-500" />
                      <h3 className="mb-2 font-bold text-2xl">No Agents Yet</h3>
                      <p className="mb-6 max-w-md text-center text-muted-foreground text-sm">
                        Create your first AI agent to start trading and chatting
                      </p>
                      <Link href="/agents/create">
                        <Button className="gap-2">
                          <Plus className="h-5 w-5" />
                          Create Agent
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => {
                            setSelectedAgentDefaultTab('activity');
                            fetchAgentDetail(agent.id);
                          }}
                          className="h-full text-left"
                        >
                          <div className="flex h-full cursor-pointer flex-col rounded-lg border border-transparent bg-muted/30 p-6 transition-all hover:border-blue-500/30 hover:bg-muted">
                            {/* Header */}
                            <div className="mb-4 flex items-start gap-4">
                              <Avatar
                                id={agent.id}
                                name={agent.name}
                                type="user"
                                size="lg"
                                src={agent.profileImageUrl}
                              />
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate font-semibold text-lg">
                                  {agent.name}
                                </h3>
                                {agent.username && (
                                  <p className="truncate text-muted-foreground text-sm">
                                    @{agent.username}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <span
                                    className={
                                      agent.autonomousEnabled
                                        ? 'text-green-400'
                                        : 'text-muted-foreground'
                                    }
                                  >
                                    {agent.autonomousEnabled ? (
                                      <>
                                        <Activity className="mr-1 inline h-3 w-3" />
                                        Active
                                      </>
                                    ) : (
                                      'Idle'
                                    )}
                                  </span>
                                  <span className="text-muted-foreground">
                                    •
                                  </span>
                                  <span className="text-muted-foreground capitalize">
                                    {agent.modelTier}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="mb-4 flex-1">
                              {agent.description && (
                                <p className="line-clamp-2 text-muted-foreground text-sm">
                                  {agent.description}
                                </p>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="mt-auto grid grid-cols-2 gap-4 border-border border-t pt-4">
                              <div>
                                <div className="mb-1 text-muted-foreground text-xs">
                                  Balance
                                </div>
                                <div className="font-semibold">
                                  {Number(agent.virtualBalance ?? 0).toFixed(2)}{' '}
                                  pts
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-muted-foreground text-xs">
                                  P&L
                                </div>
                                <div
                                  className={cn(
                                    'flex items-center gap-1 font-semibold',
                                    parseFloat(agent.lifetimePnL) >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  )}
                                >
                                  <TrendingUp className="h-3 w-3" />
                                  {parseFloat(agent.lifetimePnL).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-muted-foreground text-xs">
                                  Trades
                                </div>
                                <div className="font-semibold">
                                  {agent.totalTrades}
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 text-muted-foreground text-xs">
                                  Win Rate
                                </div>
                                <div className="font-semibold">
                                  {(agent.winRate * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <h2 className="flex items-center gap-2 font-bold text-xl">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {activityAgentFilter
                    ? `Activity from ${teamChat?.agents.find((a) => a.id === activityAgentFilter)?.displayName || 'selected agent'}`
                    : 'Recent trades, posts, and comments from all your agents'}
                </p>
              </div>

              {/* Activity Filters */}
              <ActivityFilters
                activityType={activityTypeFilter}
                onActivityTypeChange={setActivityTypeFilter}
                selectedAgentId={activityAgentFilter}
                onAgentChange={setActivityAgentFilter}
                agents={
                  teamChat?.agents.map((agent) => ({
                    id: agent.id,
                    name: agent.displayName || agent.username || 'Agent',
                    username: agent.username || undefined,
                    profileImageUrl: agent.profileImageUrl,
                  })) || []
                }
                agentsLoading={loading}
                className="mb-6"
              />

              <AgentActivityFeed
                agentId={activityAgentFilter || undefined}
                type={activityTypeFilter}
                limit={30}
                showAgent={!activityAgentFilter}
                showConnectionStatus
                emptyMessage={
                  activityAgentFilter
                    ? 'No activity from this agent yet.'
                    : activityTypeFilter !== 'all'
                      ? `No ${activityTypeFilter} activity yet.`
                      : "No agent activity yet. Your agents' trades, posts, and comments will appear here."
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
