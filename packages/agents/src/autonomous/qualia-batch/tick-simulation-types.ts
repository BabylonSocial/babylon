import { z } from 'zod';

export type TickEventKind = 'world_event' | 'market_move' | 'post';

export type TickEventVisibility = 'public' | 'private' | 'leaked';

export interface TickSimulationEvent {
  id: string;
  kind: TickEventKind;
  summary: string;
  visibility: TickEventVisibility;
  /** 0–100 importance / urgency for pruning */
  urgency: number;
  metadata: {
    ticker?: string;
    postId?: string;
    marketSignature?: string;
    relatedQuestion?: number | null;
    pointsToward?: 'yes' | 'no' | null;
    actorIds?: string[];
  };
}

export interface AgentQualiaRow {
  agentId: string;
  displayName: string;
  perceivedEventIds: string[];
  mood: string;
  exposureLabel: 'low' | 'medium' | 'high';
  cooldownSummary: string;
}

export interface PrunedOpportunity {
  agentId: string;
  eventId: string;
  score: number;
}

export type BatchTickAction = 'SKIP' | 'TRADE' | 'POST' | 'COMMENT';

export interface BatchTickPlan {
  agentId: string;
  action: BatchTickAction;
  eventId: string | null;
  priority: number;
  needsText: boolean;
  direction?: 'BUY' | 'SELL' | 'HOLD';
  sizeHint?: 'SMALL' | 'MEDIUM' | 'LARGE';
  reason: string;
}

export const batchTickPlanSchema = z.object({
  agentId: z.string().min(1),
  action: z.enum(['SKIP', 'TRADE', 'POST', 'COMMENT']),
  eventId: z.string().min(1).nullable(),
  priority: z.number().int().min(0).max(100),
  needsText: z.boolean(),
  direction: z.enum(['BUY', 'SELL', 'HOLD']).optional(),
  sizeHint: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  reason: z.string().min(1).max(500),
});

export const batchPlannerResponseSchema = z.object({
  plans: z.array(batchTickPlanSchema),
});
