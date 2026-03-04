'use client';

import type { AgentSummary } from '@babylon/api-hooks';
import { getListAgentsQueryKey, useListAgents } from '@babylon/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

export interface OwnedAgentData {
  id: string;
  name: string;
  username?: string;
  profileImageUrl?: string;
  virtualBalance: number;
  modelTier: 'free' | 'pro';
}

interface UseOwnedAgentsReturn {
  agents: Map<string, OwnedAgentData>;
  loading: boolean;
  error: string | null;
  isOwnAgent: (userId: string) => boolean;
  getAgentData: (userId: string) => OwnedAgentData | undefined;
  refresh: () => Promise<void>;
  updateAgentBalance: (agentId: string, newBalance: number) => void;
}

export function useOwnedAgents(): UseOwnedAgentsReturn {
  const { authenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useListAgents(undefined, {
    query: {
      enabled: !!authenticated && !!user,
      staleTime: 30_000,
      queryKey: getListAgentsQueryKey(),
    },
  });

  const agents = useMemo(() => {
    const map = new Map<string, OwnedAgentData>();
    if (!data?.agents) return map;
    for (const agent of data.agents) {
      map.set(agent.id, {
        id: agent.id,
        name: agent.name || agent.username || 'Agent',
        username: agent.username,
        profileImageUrl: agent.profileImageUrl,
        virtualBalance: Number(agent.virtualBalance ?? 0),
        modelTier: agent.modelTier === 'pro' ? 'pro' : 'free',
      });
    }
    return map;
  }, [data?.agents]);

  const isOwnAgent = useCallback(
    (userId: string): boolean => agents.has(userId),
    [agents]
  );

  const getAgentData = useCallback(
    (userId: string): OwnedAgentData | undefined => agents.get(userId),
    [agents]
  );

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateAgentBalance = useCallback(
    (agentId: string, newBalance: number) => {
      queryClient.setQueryData(
        getListAgentsQueryKey(),
        (old: { success: boolean; agents: AgentSummary[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            agents: old.agents.map((a) =>
              a.id === agentId ? { ...a, virtualBalance: newBalance } : a
            ),
          };
        }
      );
    },
    [queryClient]
  );

  return useMemo(
    () => ({
      agents,
      loading: isLoading,
      error: error
        ? error instanceof Error
          ? error.message
          : String(error)
        : null,
      isOwnAgent,
      getAgentData,
      refresh,
      updateAgentBalance,
    }),
    [
      agents,
      isLoading,
      error,
      isOwnAgent,
      getAgentData,
      refresh,
      updateAgentBalance,
    ]
  );
}
