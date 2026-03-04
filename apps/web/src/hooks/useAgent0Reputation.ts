'use client';

import { useGetAgent } from '@babylon/api-hooks';
import { useCallback, useMemo } from 'react';

/**
 * Agent0 profile data structure
 */
interface Agent0Profile {
  tokenId: number;
  name: string;
  walletAddress: string;
  active: boolean;
  reputation?: {
    trustScore: number;
    accuracyScore: number;
    totalBets: number;
    winningBets: number;
  };
}

/**
 * Agent0 reputation summary
 */
interface Agent0ReputationSummary {
  count: number;
  averageScore: number;
}

/**
 * Hook return type
 */
interface UseAgent0ReputationReturn {
  profile: Agent0Profile | null;
  reputation: Agent0ReputationSummary | null;
  loading: boolean;
  error: Error | null;
  isAgent0Available: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Agent0 network reputation data for an agent
 *
 * @param agentId - The agent's database ID (used to lookup Agent0 tokenId)
 * @returns Agent0 profile, reputation summary, loading state, and availability
 */
export function useAgent0Reputation(
  agentId?: string
): UseAgent0ReputationReturn {
  const { data, isLoading, error, refetch } = useGetAgent(agentId ?? '', {
    query: {
      enabled: !!agentId,
      queryKey: ['/api/agents', agentId],
    },
  });

  const agent = data?.agent as Record<string, unknown> | undefined;

  const isAgent0Available = useMemo(
    () => !!agent?.agent0TokenId,
    [agent?.agent0TokenId]
  );

  const profile = useMemo<Agent0Profile | null>(() => {
    if (!agent?.agent0TokenId) return null;

    const rep = agent.reputation as Record<string, unknown> | undefined;

    return {
      tokenId: agent.agent0TokenId as number,
      name: agent.name as string,
      walletAddress: (agent.walletAddress as string) ?? '',
      active: (agent.isActive as boolean) ?? false,
      reputation: rep
        ? {
            trustScore: (rep.trustScore as number) ?? 0,
            accuracyScore: (rep.accuracyScore as number) ?? 0,
            totalBets: (rep.totalBets as number) ?? 0,
            winningBets: (rep.winningBets as number) ?? 0,
          }
        : undefined,
    };
  }, [agent]);

  const reputation = useMemo<Agent0ReputationSummary | null>(() => {
    const rep = agent?.reputation as Record<string, unknown> | undefined;
    if (rep?.feedbackCount === undefined) return null;
    return {
      count: rep.feedbackCount as number,
      averageScore: (rep.averageScore as number) ?? 0,
    };
  }, [agent?.reputation]);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    profile,
    reputation,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    isAgent0Available,
    refetch: handleRefetch,
  };
}
