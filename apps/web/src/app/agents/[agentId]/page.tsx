/**
 * Agent Detail Page
 *
 * @description Detailed view for a single AI agent, displaying agent profile,
 * wallet, logs, performance metrics, and settings. Allows the agent owner to
 * manage the agent's configuration and monitor its activity.
 *
 * @page /agents/[agentId]
 * @access Authenticated (agent owner)
 *
 * @features
 * - Agent profile display (name, description, avatar, bio, personality, trading strategy)
 * - Wallet management (balance, deposit, withdraw, transaction history)
 * - Activity logs (autonomous actions, AI interactions, trading decisions)
 * - Performance metrics (P&L, win rate, total trades, profitable trades)
 * - Agent settings (autonomous mode, model tier, on-chain registration)
 * - Agent deletion
 * - Error handling and status display
 *
 * @note Chat with agent is available via the Chats page (/chats)
 *
 * @example
 * ```tsx
 * // Accessible at /agents/[agentId]
 * // Requires authentication and agent ownership
 * <AgentDetailPage />
 * ```
 */

'use client';

import { cn } from '@babylon/shared';
import {
  Activity,
  ArrowLeft,
  Bot,
  ExternalLink,
  FileText,
  Settings,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/shared/Avatar';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

// Performance: Lazy load tab components - only one is visible at a time
// Each tab component is ~10-30KB, lazy loading reduces initial bundle significantly
const AgentActivityFeed = dynamic(
  () =>
    import('@/components/agents/AgentActivityFeed').then((m) => ({
      default: m.AgentActivityFeed,
    })),
  { ssr: false, loading: () => <TabLoadingSkeleton /> }
);

const AgentLogs = dynamic(
  () =>
    import('@/components/agents/AgentLogs').then((m) => ({
      default: m.AgentLogs,
    })),
  { ssr: false, loading: () => <TabLoadingSkeleton /> }
);

const AgentPerformance = dynamic(
  () =>
    import('@/components/agents/AgentPerformance').then((m) => ({
      default: m.AgentPerformance,
    })),
  { ssr: false, loading: () => <TabLoadingSkeleton /> }
);

const AgentSettings = dynamic(
  () =>
    import('@/components/agents/AgentSettings').then((m) => ({
      default: m.AgentSettings,
    })),
  { ssr: false, loading: () => <TabLoadingSkeleton /> }
);

const AgentWallet = dynamic(
  () =>
    import('@/components/agents/AgentWallet').then((m) => ({
      default: m.AgentWallet,
    })),
  { ssr: false, loading: () => <TabLoadingSkeleton /> }
);

// Loading skeleton for tab content
function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/**
 * Agent data structure
 */
interface Agent {
  id: string;
  name: string;
  username?: string;
  description?: string;
  profileImageUrl?: string;
  system: string;
  bio?: string[];
  personality?: string;
  tradingStrategy?: string;
  virtualBalance?: number;
  isActive: boolean;
  autonomousEnabled: boolean;
  modelTier: 'free' | 'pro';
  status: string;
  errorMessage?: string;
  lifetimePnL: string;
  totalTrades: number;
  profitableTrades: number;
  winRate: number;
  lastTickAt?: string;
  lastChatAt?: string;
  walletAddress?: string;
  agent0TokenId?: number;
  onChainRegistered: boolean;
  a2aEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agent Detail Page Component
 *
 * @description Main component for displaying and managing a single agent.
 * Fetches agent data, displays it in a tabbed interface, and provides
 * management capabilities.
 *
 * @returns {JSX.Element} Agent detail page
 */
export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, ready, getAccessToken } = useAuth();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    const token = await getAccessToken();

    if (!token) {
      console.error('No access token available');
      toast.error('Authentication required');
      router.push('/agents');
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/agents/${agentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {
      toast.error('Failed to load agent');
      setLoading(false);
      throw new Error('Failed to load agent');
    });

    if (res.ok) {
      const data = await res.json();
      setAgent(data.agent);
    } else {
      toast.error('Agent not found');
      router.push('/agents');
    }

    setLoading(false);
  }, [agentId, getAccessToken, router]);

  useEffect(() => {
    if (ready && authenticated && agentId) {
      fetchAgent();
    }
  }, [ready, authenticated, agentId, fetchAgent]);

  if (!ready || !authenticated) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-7xl space-y-6 p-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-7xl space-y-6 p-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!agent) {
    return (
      <PageContainer>
        <div className="p-4">
          <div className="flex flex-col items-center justify-center rounded-lg border border-[#0066FF]/20 bg-gradient-to-br from-[#0066FF]/10 to-purple-500/10 px-4 py-16">
            <Bot className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 font-bold text-2xl">Agent Not Found</h3>
            <p className="mb-6 text-muted-foreground text-sm">
              This agent doesn't exist or you don't have access to it
            </p>
            <Link href="/agents">
              <button className="rounded-lg bg-[#0066FF] px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-[#2952d9]">
                Back to Agents
              </button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl space-y-6 p-4">
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
        </div>

        {/* Agent Info Card */}
        <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <Avatar
              id={agent.id}
              name={agent.name}
              type="user"
              size="lg"
              src={agent.profileImageUrl}
              imageUrl={agent.profileImageUrl}
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="mb-1 font-bold text-2xl">{agent.name}</h1>
                  {agent.username && (
                    <p className="mb-1 text-muted-foreground">
                      @{agent.username}
                    </p>
                  )}
                </div>
                {agent.username && (
                  <Link
                    href={`/profile/${agent.username}`}
                    className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Profile
                  </Link>
                )}
              </div>
              {agent.description && (
                <p className="mb-2 text-foreground/80">{agent.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span
                  className={
                    agent.autonomousEnabled
                      ? 'text-green-400'
                      : 'text-foreground/80'
                  }
                >
                  {agent.autonomousEnabled ? (
                    <>
                      <Activity className="mr-1 inline h-3 w-3" />
                      Autonomous Active
                    </>
                  ) : (
                    'Autonomous Disabled'
                  )}
                </span>
                <span className="text-foreground">•</span>
                <span className="text-foreground/80 capitalize">
                  {agent.modelTier} Mode
                </span>
                {agent.onChainRegistered && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-blue-400">
                      Agent0 #{agent.agent0TokenId}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 place-items-center gap-4 border-border border-t pt-6 text-center">
            <div>
              <div className="mb-1 text-muted-foreground text-xs">Balance</div>
              <div className="font-semibold text-[#0066FF] text-xl">
                {(agent.virtualBalance ?? 0).toFixed(2)} pts
              </div>
            </div>
            <div>
              <div className="mb-1 text-muted-foreground text-xs">
                Lifetime P&L
              </div>
              <div
                className={cn(
                  'font-semibold text-xl',
                  parseFloat(agent.lifetimePnL) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                )}
              >
                {parseFloat(agent.lifetimePnL).toFixed(2)} pts
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-primary-foreground"
            >
              <Activity className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-primary-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-primary-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="data-[state=active]:bg-[#0066FF] data-[state=active]:text-primary-foreground"
            >
              <Bot className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="activity">
              <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
                <AgentActivityFeed
                  agentId={agent.id}
                  limit={50}
                  showConnectionStatus={true}
                  emptyMessage="No activity yet. Your agent will show trades, posts, and comments here."
                />
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <AgentPerformance agent={agent} agentId={agent.id} />
            </TabsContent>

            <TabsContent value="logs">
              <AgentLogs agentId={agent.id} />
            </TabsContent>

            <TabsContent value="settings">
              <AgentSettings agent={agent} onUpdate={fetchAgent} />
            </TabsContent>

            <TabsContent value="wallet">
              <AgentWallet agent={agent} onUpdate={fetchAgent} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
}
