'use client';

import {
  type ClosePerpPosition200,
  closePerpPosition,
  type OpenPerpPosition200,
  openPerpPosition,
  type PerpOpenBody,
} from '@babylon/api-hooks';
import { useCallback } from 'react';
import type { TradeSide } from '@/types/markets';

export type { TradeSide } from '@/types/markets';

interface OpenPerpPayload {
  ticker: string;
  side: TradeSide;
  size: number;
  leverage: number;
}

/**
 * Hook for executing perpetual market trades.
 *
 * Uses the generated API client from @babylon/api-hooks for type-safe
 * requests with automatic Privy authentication via orvalFetch.
 */
export function usePerpTrade() {
  const openPos = useCallback(
    async (payload: OpenPerpPayload): Promise<OpenPerpPosition200> => {
      return openPerpPosition(payload as PerpOpenBody);
    },
    []
  );

  const closePos = useCallback(
    async (positionId: string): Promise<ClosePerpPosition200> => {
      return closePerpPosition(positionId, {});
    },
    []
  );

  return {
    openPosition: openPos,
    closePosition: closePos,
  };
}
