/**
 * Agent Detail Page
 *
 * @description Detailed view for a single AI agent, displaying agent profile,
 * wallet, logs, performance metrics, and settings. Allows the agent owner to
 * manage the agent's configuration and monitor its activity.
 *
 * @page /agents/[agentId]
 * @access Authenticated (agent owner)
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AgentDetail,
  type AgentDetailData,
  AgentDetailNotFound,
} from '@/components/agents/AgentDetail';
import { PageContainer } from '@/components/shared/PageContainer';
import { useAuth } from '@/hooks/useAuth';

/**
 * Agent Detail Page Component
 *
 * @description Main component for displaying and managing a single agent.
 * Fetches agent data and renders the AgentDetail component.
 */
export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, ready, getAccessToken, login } = useAuth();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<AgentDetailData | null>(null);
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

  // Auth required — redirect to feed and show login
  useEffect(() => {
    if (!ready || authenticated) return;
    router.push('/feed');
    const timer = setTimeout(() => login(), 500);
    return () => clearTimeout(timer);
  }, [ready, authenticated, router, login]);

  if (!ready || !authenticated || loading) {
    return null;
  }

  if (!agent) {
    return (
      <PageContainer>
        <AgentDetailNotFound onBack={() => router.push('/agents')} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AgentDetail
        agent={agent}
        onUpdate={fetchAgent}
        onBack={() => router.push('/agents')}
        backLabel="Back"
      />
    </PageContainer>
  );
}
