'use client';

import {
  listAgents as fetchAgents,
  getUserBalance as fetchUserBalance,
  getUserPositions as fetchUserPositions,
} from '@babylon/api-hooks';
import { logger } from '@babylon/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type TeamScope = 'owner_agents' | 'agents_only';

export interface TeamTotals {
  walletBalance: number;
  lifetimePnL: number;
  unrealizedPnL: number;
  currentPnL: number;
  openPositions: number;
}

export interface TeamMemberTradingSummary {
  /** Maps to EntityType for panel selection: owner → 'user', agent → 'agent' */
  entityType: 'owner' | 'agent';
  id: string;
  name: string;
  username: string | null;
  walletBalance: number;
  lifetimePnL: number;
  unrealizedPnL: number;
  currentPnL: number;
  openPositions: number;
}

export interface TeamTradingSummary {
  ownerId: string;
  ownerName: string;
  members: TeamMemberTradingSummary[]; // includes owner + agents
  totals: TeamTotals;
  agentsOnlyTotals: TeamTotals;
  updatedAt: string | null;
}

function toNumber(
  value: string | number | undefined | null,
  fallback = 0
): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sumMemberTotals(members: TeamMemberTradingSummary[]): TeamTotals {
  return members.reduce(
    (acc, m) => ({
      walletBalance: acc.walletBalance + m.walletBalance,
      lifetimePnL: acc.lifetimePnL + m.lifetimePnL,
      unrealizedPnL: acc.unrealizedPnL + m.unrealizedPnL,
      currentPnL: acc.currentPnL + m.currentPnL,
      openPositions: acc.openPositions + m.openPositions,
    }),
    {
      walletBalance: 0,
      lifetimePnL: 0,
      unrealizedPnL: 0,
      currentPnL: 0,
      openPositions: 0,
    }
  );
}

interface AgentsApiAgent {
  id: string;
  username?: string | null;
  name?: string | null;
  virtualBalance?: number;
  lifetimePnL?: string | number;
}

interface AgentsApiResponse {
  success: boolean;
  agents: AgentsApiAgent[];
}

interface UserBalanceApiResponse {
  balance: string;
  lifetimePnL: string;
}

type PositionWithUnrealizedPnL = {
  unrealizedPnL: number;
  isAgentPosition?: boolean;
  agentId?: string | null;
};

interface PositionsApiResponse {
  perpetuals?: {
    positions?: PositionWithUnrealizedPnL[];
  };
  predictions?: {
    positions?: PositionWithUnrealizedPnL[];
  };
  timestamp?: string;
}

function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error && e.name === 'AbortError') return true;
  return false;
}

export function useTeamTradingSummary({
  ownerId,
  ownerName,
  enabled,
}: {
  ownerId: string | null | undefined;
  ownerName: string;
  enabled: boolean;
  /** @deprecated No longer needed - orvalFetch handles auth automatically */
  getAccessToken?: () => Promise<string | null>;
}): {
  summary: TeamTradingSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerBalance, setOwnerBalance] =
    useState<UserBalanceApiResponse | null>(null);
  const [agents, setAgents] = useState<AgentsApiAgent[] | null>(null);
  const [positions, setPositions] = useState<PositionsApiResponse | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshNonce is an intentional trigger to force re-fetch
  useEffect(() => {
    if (!enabled || !ownerId) return;

    let cancelled = false;
    const abort = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const [balanceJson, positionsJson, agentsJson] = await Promise.all([
          fetchUserBalance(ownerId, {
            signal: abort.signal,
          }) as Promise<UserBalanceApiResponse>,
          fetchUserPositions(
            ownerId,
            { type: 'all', status: 'open' },
            { signal: abort.signal }
          ) as Promise<PositionsApiResponse>,
          fetchAgents(undefined, {
            signal: abort.signal,
          }) as Promise<AgentsApiResponse>,
        ]);

        if (cancelled) return;

        setOwnerBalance(balanceJson);
        setPositions(positionsJson);
        setAgents(agentsJson.agents ?? []);
      } catch (e) {
        if (cancelled || isAbortError(e)) return;
        const message =
          e instanceof SyntaxError
            ? 'Invalid response from server. Please try again.'
            : e instanceof Error
              ? e.message
              : 'Failed to load team summary';
        setError(message);
        logger.error(
          'Failed to fetch team trading summary',
          { error: e instanceof Error ? e.message : String(e), ownerId },
          'useTeamTradingSummary'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [enabled, ownerId, refreshNonce]);

  const summary = useMemo<TeamTradingSummary | null>(() => {
    if (!ownerId) return null;
    if (!ownerBalance || !positions || !agents) return null;

    // Aggregate unrealized PnL and counts per member (ownerId for owner).
    const byMember = new Map<
      string,
      { unrealizedPnL: number; openPositions: number }
    >();

    const addPosition = (memberId: string, unrealized: number) => {
      const cur = byMember.get(memberId) ?? {
        unrealizedPnL: 0,
        openPositions: 0,
      };
      byMember.set(memberId, {
        unrealizedPnL: cur.unrealizedPnL + unrealized,
        openPositions: cur.openPositions + 1,
      });
    };

    const perpPositions = positions.perpetuals?.positions ?? [];
    for (const p of perpPositions) {
      const memberId = p.isAgentPosition ? (p.agentId ?? ownerId) : ownerId;
      addPosition(memberId, toNumber(p.unrealizedPnL));
    }

    const predictionPositions = positions.predictions?.positions ?? [];
    for (const p of predictionPositions) {
      const memberId = p.isAgentPosition ? (p.agentId ?? ownerId) : ownerId;
      addPosition(memberId, toNumber(p.unrealizedPnL));
    }

    const ownerWallet = toNumber(ownerBalance.balance);
    const ownerLifetime = toNumber(ownerBalance.lifetimePnL);
    const ownerUnrealized = byMember.get(ownerId)?.unrealizedPnL ?? 0;
    const ownerOpenPositions = byMember.get(ownerId)?.openPositions ?? 0;

    const ownerRow: TeamMemberTradingSummary = {
      entityType: 'owner',
      id: ownerId,
      name: ownerName,
      username: null,
      walletBalance: ownerWallet,
      lifetimePnL: ownerLifetime,
      unrealizedPnL: ownerUnrealized,
      currentPnL: ownerLifetime + ownerUnrealized,
      openPositions: ownerOpenPositions,
    };

    const agentRows: TeamMemberTradingSummary[] = agents.map((a) => {
      const id = a.id;
      const unrealized = byMember.get(id)?.unrealizedPnL ?? 0;
      const openPositions = byMember.get(id)?.openPositions ?? 0;
      const walletBalance = toNumber(a.virtualBalance);
      const lifetimePnL = toNumber(a.lifetimePnL);
      const name = a.name ?? 'Agent';

      return {
        entityType: 'agent',
        id,
        name,
        username: a.username ?? null,
        walletBalance,
        lifetimePnL,
        unrealizedPnL: unrealized,
        currentPnL: lifetimePnL + unrealized,
        openPositions,
      };
    });

    const members = [ownerRow, ...agentRows];
    const totals = sumMemberTotals(members);
    const agentsOnlyTotals = sumMemberTotals(agentRows);

    return {
      ownerId,
      ownerName,
      members,
      totals,
      agentsOnlyTotals,
      updatedAt: positions.timestamp ?? null,
    };
  }, [ownerId, ownerName, ownerBalance, positions, agents]);

  return { summary, loading, error, refresh };
}
