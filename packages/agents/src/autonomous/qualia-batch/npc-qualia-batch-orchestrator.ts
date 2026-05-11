import type { StaticActor } from '@babylon/engine';
import { logger } from '../../shared/logger';
import type { AutonomousBatchTickConfig } from './autonomous-batch-tick-config';
import { computeNpcTickLlmBaseline } from './autonomous-tick-baseline';
import { executeValidatedBatchPlans } from './batch-plan-executor';
import {
  invokeBatchQualiaPlanner,
  validateAndCapBatchPlans,
} from './batch-qualia-planner';
import {
  canInvokeNpcQualiaPlanner,
  markNpcQualiaPlannerRan,
} from './npc-qualia-planner-cadence';
import {
  buildTickSimulationEventBatch,
  commitMarketMoveSignatures,
} from './tick-event-batch-builder';
import { pruneAgentEventOpportunities } from './tick-opportunity-pruner';
import { buildAgentQualiaRows } from './tick-qualia-builder';
import type {
  BatchTickPlan,
  TickSimulationEvent,
} from './tick-simulation-types';

export type NpcQualiaBatchSkippedReason =
  | 'disabled'
  | 'no_cohort'
  | 'quiet_window'
  | 'throttled'
  | 'planner_invoke_failed'
  | 'planner_parse_failed'
  | 'validation_failed';

export interface NpcQualiaBatchOrchestratorResult {
  enabled: boolean;
  shadow: boolean;
  execute: boolean;
  windowStart: string;
  windowEnd: string;
  cohortSize: number;
  eventCount: number;
  opportunityCount: number;
  baseline: ReturnType<typeof computeNpcTickLlmBaseline>;
  /** Estimated planner LLM calls (0 or 1). */
  plannerLlmCalls: number;
  /** Upper bound text-generation calls if execution runs all POST/COMMENT successes. */
  estimatedMaxTextCalls: number;
  skippedReason?: NpcQualiaBatchSkippedReason;
  validationErrors?: string[];
  validatedPlans?: BatchTickPlan[];
  plannerActionCounts?: {
    skips: number;
    trades: number;
    posts: number;
    comments: number;
  };
  plannerDurationMs?: number;
  executionDurationMs?: number;
  /** Rough character count as token proxy for logging. */
  plannerPromptCharEstimate?: number;
  executionResults?: Array<{
    agentId: string;
    action: string;
    success: boolean;
    detail?: string;
  }>;
  actionsExecuted?: number;
}

function eventsById(
  events: TickSimulationEvent[]
): Map<string, TickSimulationEvent> {
  return new Map(events.map((e) => [e.id, e]));
}

function countPlannerActions(plans: BatchTickPlan[]): {
  skips: number;
  trades: number;
  posts: number;
  comments: number;
} {
  return plans.reduce(
    (counts, plan) => {
      if (plan.action === 'SKIP') {
        counts.skips += 1;
      } else if (plan.action === 'TRADE') {
        counts.trades += 1;
      } else if (plan.action === 'POST') {
        counts.posts += 1;
      } else if (plan.action === 'COMMENT') {
        counts.comments += 1;
      }
      return counts;
    },
    { comments: 0, posts: 0, skips: 0, trades: 0 }
  );
}

/**
 * Single entry: build ledger + qualia, optional planner LLM, validation, optional execution.
 */
export async function runNpcQualiaBatchOrchestrator(params: {
  npcs: StaticActor[];
  windowEnd: Date;
  config: AutonomousBatchTickConfig;
}): Promise<NpcQualiaBatchOrchestratorResult> {
  const { npcs, windowEnd, config } = params;
  const windowStart = new Date(windowEnd.getTime() - config.eventWindowMs);

  const baseline = computeNpcTickLlmBaseline(npcs.length);

  const disabled: NpcQualiaBatchOrchestratorResult = {
    enabled: false,
    shadow: config.shadowPlanner,
    execute: config.executePlanner,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    cohortSize: npcs.length,
    eventCount: 0,
    opportunityCount: 0,
    baseline,
    plannerLlmCalls: 0,
    estimatedMaxTextCalls: 0,
    skippedReason: 'disabled',
  };

  if (npcs.length === 0) {
    return {
      ...disabled,
      skippedReason: 'no_cohort',
    };
  }

  const events = await buildTickSimulationEventBatch({
    windowStart,
    windowEnd,
  });

  if (events.length === 0) {
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: config.executePlanner,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: 0,
      opportunityCount: 0,
      baseline,
      plannerLlmCalls: 0,
      estimatedMaxTextCalls: 0,
      skippedReason: 'quiet_window',
      plannerPromptCharEstimate: 0,
    };
  }

  const qualia = await buildAgentQualiaRows({ npcs, events });
  const opportunities = pruneAgentEventOpportunities({
    qualia,
    events,
    maxOpportunities: config.maxOpportunities,
  });

  if (opportunities.length === 0) {
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: config.executePlanner,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: events.length,
      opportunityCount: 0,
      baseline,
      plannerLlmCalls: 0,
      estimatedMaxTextCalls: 0,
      skippedReason: 'quiet_window',
      plannerPromptCharEstimate: events.length * 80 + qualia.length * 100,
    };
  }

  const cohortIds = new Set(npcs.map((n) => n.id));
  const evMap = eventsById(events);

  const opportunityLines = opportunities.map(
    (o) => `${o.agentId}|${o.eventId}|${o.score.toFixed(1)}`
  );

  const windowLabel = `${windowStart.toISOString().slice(11, 19)}–${windowEnd.toISOString().slice(11, 19)} UTC`;

  const promptEstimate =
    events.length * 80 + qualia.length * 100 + opportunityLines.length * 40;

  const cadence = await canInvokeNpcQualiaPlanner(config.minIntervalMs);
  if (!cadence.allowed) {
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: config.executePlanner,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: events.length,
      opportunityCount: opportunities.length,
      baseline,
      plannerLlmCalls: 0,
      estimatedMaxTextCalls: 0,
      skippedReason: 'throttled',
      plannerPromptCharEstimate: promptEstimate,
    };
  }

  let invoke: Awaited<ReturnType<typeof invokeBatchQualiaPlanner>>;
  try {
    invoke = await invokeBatchQualiaPlanner({
      windowLabel,
      events,
      qualia,
      opportunityLines,
    });
  } catch (error) {
    await markNpcQualiaPlannerRan();
    logger.error(
      'NPC qualia batch planner threw',
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'NpcQualiaBatchOrchestrator'
    );
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: config.executePlanner,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: events.length,
      opportunityCount: opportunities.length,
      baseline,
      plannerLlmCalls: 1,
      estimatedMaxTextCalls: 0,
      skippedReason: 'planner_invoke_failed',
      plannerPromptCharEstimate: promptEstimate,
    };
  }

  await markNpcQualiaPlannerRan();

  if (!invoke.plans) {
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: config.executePlanner,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: events.length,
      opportunityCount: opportunities.length,
      baseline,
      plannerLlmCalls: 1,
      estimatedMaxTextCalls: 0,
      skippedReason: 'planner_parse_failed',
      validationErrors: invoke.parseError ? [invoke.parseError] : undefined,
      plannerDurationMs: invoke.durationMs,
      plannerPromptCharEstimate: promptEstimate,
    };
  }

  const validated = validateAndCapBatchPlans({
    plans: invoke.plans,
    cohortIds,
    eventsById: evMap,
    qualia,
    maxActionsPerTick: config.maxActionsPerTick,
  });

  if (!validated.ok) {
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: config.executePlanner,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: events.length,
      opportunityCount: opportunities.length,
      baseline,
      plannerLlmCalls: 1,
      estimatedMaxTextCalls: 0,
      skippedReason: 'validation_failed',
      validationErrors: validated.errors,
      plannerDurationMs: invoke.durationMs,
      plannerPromptCharEstimate: promptEstimate,
    };
  }

  const postComment = validated.plans.filter(
    (p) => p.action === 'POST' || p.action === 'COMMENT'
  );
  const estimatedMaxTextCalls = postComment.length;
  const plannerActionCounts = countPlannerActions(validated.plans);

  if (!config.executePlanner || config.shadowPlanner) {
    return {
      enabled: true,
      shadow: config.shadowPlanner,
      execute: false,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      cohortSize: npcs.length,
      eventCount: events.length,
      opportunityCount: opportunities.length,
      baseline,
      plannerLlmCalls: 1,
      estimatedMaxTextCalls,
      validatedPlans: validated.plans,
      plannerActionCounts,
      plannerDurationMs: invoke.durationMs,
      plannerPromptCharEstimate: promptEstimate,
    };
  }

  const displayNameByAgentId = new Map(npcs.map((n) => [n.id, n.name]));
  const moodByAgentId = new Map(
    npcs.map((n) => [n.id, n.personality?.slice(0, 120) ?? ''])
  );

  const executionStarted = Date.now();
  const exec = await executeValidatedBatchPlans({
    plans: validated.plans,
    eventsById: evMap,
    displayNameByAgentId,
    moodByAgentId,
  });
  const executionDurationMs = Date.now() - executionStarted;

  const tickersFromSuccessfulTrades = new Set<string>();
  for (const row of exec.results) {
    if (row.action !== 'TRADE' || !row.success) {
      continue;
    }
    const tradePlan = validated.plans.find(
      (p) => p.agentId === row.agentId && p.action === 'TRADE'
    );
    const tradeEv = tradePlan?.eventId
      ? evMap.get(tradePlan.eventId)
      : undefined;
    if (tradeEv?.kind === 'market_move' && tradeEv.metadata.ticker) {
      tickersFromSuccessfulTrades.add(tradeEv.metadata.ticker);
    }
  }
  if (tickersFromSuccessfulTrades.size > 0) {
    const marketEventsToCommit = events.filter((e) => {
      if (e.kind !== 'market_move') {
        return false;
      }
      const ticker = e.metadata.ticker;
      return (
        ticker !== undefined &&
        ticker !== '' &&
        tickersFromSuccessfulTrades.has(ticker)
      );
    });
    await commitMarketMoveSignatures(marketEventsToCommit);
  }

  return {
    enabled: true,
    shadow: false,
    execute: true,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    cohortSize: npcs.length,
    eventCount: events.length,
    opportunityCount: opportunities.length,
    baseline,
    plannerLlmCalls: 1,
    estimatedMaxTextCalls,
    validatedPlans: validated.plans,
    plannerActionCounts,
    plannerDurationMs: invoke.durationMs,
    executionDurationMs,
    plannerPromptCharEstimate: promptEstimate,
    executionResults: exec.results,
    actionsExecuted: exec.actionsExecuted,
  };
}
