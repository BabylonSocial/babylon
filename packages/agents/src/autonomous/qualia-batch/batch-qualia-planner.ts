import { callGroqDirect } from '../../llm/direct-groq';
import { logger } from '../../shared/logger';
import { extractFirstJsonObject } from '../decision-json';
import type {
  AgentQualiaRow,
  BatchTickPlan,
  TickSimulationEvent,
} from './tick-simulation-types';
import { batchPlannerResponseSchema } from './tick-simulation-types';

function buildPlannerPrompt(params: {
  windowLabel: string;
  events: TickSimulationEvent[];
  qualia: AgentQualiaRow[];
  opportunityLines: string[];
}): string {
  const eventBlock = params.events
    .map(
      (e) =>
        `${e.id} | ${e.kind} | vis=${e.visibility} | urg=${e.urgency} | ${e.summary}`
    )
    .join('\n');

  const qualiaBlock = params.qualia
    .map(
      (q) =>
        `${q.agentId} | ${q.displayName} | perceived=${q.perceivedEventIds.join(',')} | mood=${q.mood} | exp=${q.exposureLabel} | ${q.cooldownSummary}`
    )
    .join('\n');

  const oppBlock =
    params.opportunityLines.length > 0
      ? params.opportunityLines.join('\n')
      : '(none — prefer SKIP for most agents)';

  return `TIME WINDOW: ${params.windowLabel}

EVENTS:
${eventBlock}

AGENT QUALIA:
${qualiaBlock}

HIGH-SIGNAL OPPORTUNITIES (agent|event|score):
${oppBlock}

TASK: Output a JSON object with key "plans" — an array with EXACTLY one plan per agent listed in AGENT QUALIA (same agents, same count).
Each plan:
- agentId: string (must match an agent in AGENT QUALIA)
- action: SKIP | TRADE | POST | COMMENT
- eventId: string or null (null only for SKIP)
- priority: integer 0-100
- needsText: boolean (false for SKIP and TRADE; true for POST and COMMENT)
- direction: BUY | SELL | HOLD (only for TRADE; use HOLD to skip trading)
- sizeHint: SMALL | MEDIUM | LARGE (optional, for TRADE)
- reason: short string

Rules:
- SKIP: eventId null, needsText false, priority may be 0.
- TRADE: eventId must reference a market_move event id from EVENTS; needsText false; direction BUY or SELL (not HOLD).
- POST: needsText true; eventId should reference a relevant event id (world_event, market_move, or post).
- COMMENT: needsText true; eventId must reference a post:* event id to comment on.
- Most agents should SKIP when nothing compelling matches their perceived events.
Respond with ONLY valid JSON, no markdown.`;
}

export interface BatchPlannerInvokeResult {
  rawText: string;
  plans: BatchTickPlan[] | null;
  parseError?: string;
  durationMs: number;
}

export async function invokeBatchQualiaPlanner(params: {
  windowLabel: string;
  events: TickSimulationEvent[];
  qualia: AgentQualiaRow[];
  opportunityLines: string[];
}): Promise<BatchPlannerInvokeResult> {
  const prompt = buildPlannerPrompt(params);
  const maxTokens = Math.min(
    6000,
    Math.max(2500, 1200 + params.qualia.length * 80)
  );
  const started = Date.now();
  const rawText = await callGroqDirect({
    prompt,
    system:
      'You are a batch tick planner for a simulation. Output strict JSON only.',
    modelSize: 'small',
    temperature: 0.35,
    maxTokens,
    purpose: 'reasoning',
    actionType: 'npc_batch_qualia_planner',
  });
  const durationMs = Date.now() - started;

  const jsonStr = extractFirstJsonObject(rawText);
  if (!jsonStr) {
    return {
      rawText,
      plans: null,
      parseError: 'No JSON object in planner response',
      durationMs,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonStr);
  } catch (e) {
    return {
      rawText,
      plans: null,
      parseError: e instanceof Error ? e.message : 'JSON.parse failed',
      durationMs,
    };
  }

  const parsed = batchPlannerResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      rawText,
      plans: null,
      parseError: parsed.error.message,
      durationMs,
    };
  }

  return {
    rawText,
    plans: parsed.data.plans,
    durationMs,
  };
}

function perceivedSetForAgent(
  qualia: AgentQualiaRow[],
  agentId: string
): Set<string> | null {
  const row = qualia.find((q) => q.agentId === agentId);
  if (!row) {
    return null;
  }
  return new Set(row.perceivedEventIds);
}

export function validateAndCapBatchPlans(params: {
  plans: BatchTickPlan[];
  cohortIds: Set<string>;
  eventsById: Map<string, TickSimulationEvent>;
  qualia: AgentQualiaRow[];
  maxActionsPerTick: number;
}): { ok: true; plans: BatchTickPlan[] } | { ok: false; errors: string[] } {
  const { plans, cohortIds, eventsById, qualia, maxActionsPerTick } = params;
  const errors: string[] = [];

  if (plans.length !== cohortIds.size) {
    errors.push(`Expected ${cohortIds.size} plans, received ${plans.length}`);
  }

  const seenAgents = new Set<string>();
  for (const p of plans) {
    if (seenAgents.has(p.agentId)) {
      errors.push(`Duplicate plan for agent ${p.agentId}`);
    }
    seenAgents.add(p.agentId);
    if (!cohortIds.has(p.agentId)) {
      errors.push(`Unknown agentId ${p.agentId}`);
    }

    const perceived = perceivedSetForAgent(qualia, p.agentId);

    if (p.action === 'SKIP') {
      if (p.eventId !== null) {
        errors.push(`SKIP for ${p.agentId} must use eventId null`);
      }
      if (p.needsText) {
        errors.push(`SKIP for ${p.agentId} must have needsText false`);
      }
      continue;
    }

    if (p.eventId === null || p.eventId === '') {
      errors.push(`Non-SKIP action for ${p.agentId} requires eventId`);
      continue;
    }

    if (!perceived?.has(p.eventId)) {
      errors.push(`eventId ${p.eventId} not perceived by agent ${p.agentId}`);
    }

    const ev = eventsById.get(p.eventId);
    if (!ev) {
      errors.push(`Unknown eventId ${p.eventId} for ${p.agentId}`);
      continue;
    }

    if (p.action === 'TRADE') {
      if (p.needsText) {
        errors.push(`TRADE for ${p.agentId} must have needsText false`);
      }
      if (ev.kind !== 'market_move') {
        errors.push(`TRADE for ${p.agentId} must target market_move`);
      }
      if (p.direction !== 'BUY' && p.direction !== 'SELL') {
        errors.push(`TRADE for ${p.agentId} needs direction BUY or SELL`);
      }
    }

    if (p.action === 'POST') {
      if (!p.needsText) {
        errors.push(`POST for ${p.agentId} must have needsText true`);
      }
    }

    if (p.action === 'COMMENT') {
      if (!p.needsText) {
        errors.push(`COMMENT for ${p.agentId} must have needsText true`);
      }
      if (ev.kind !== 'post') {
        errors.push(`COMMENT for ${p.agentId} must target post event`);
      }
    }
  }

  for (const id of cohortIds) {
    if (!seenAgents.has(id)) {
      errors.push(`Missing plan for cohort agent ${id}`);
    }
  }

  const nonSkip = plans.filter((p) => p.action !== 'SKIP');
  const maxT = Math.max(1, Math.ceil(maxActionsPerTick / 2));
  const maxP = Math.max(1, Math.ceil(maxActionsPerTick / 2));
  const maxC = Math.max(1, Math.ceil(maxActionsPerTick / 2));

  const trades = nonSkip.filter((p) => p.action === 'TRADE').length;
  const posts = nonSkip.filter((p) => p.action === 'POST').length;
  const comments = nonSkip.filter((p) => p.action === 'COMMENT').length;

  if (nonSkip.length > maxActionsPerTick) {
    errors.push(
      `Too many non-SKIP actions: ${nonSkip.length} > ${maxActionsPerTick}`
    );
  }
  if (trades > maxT || posts > maxP || comments > maxC) {
    errors.push(
      `Per-type caps exceeded: trades=${trades} (max ${maxT}), posts=${posts} (max ${maxP}), comments=${comments} (max ${maxC})`
    );
  }

  if (errors.length > 0) {
    logger.warn(
      'Batch qualia planner validation failed',
      { errors: errors.slice(0, 12), errorCount: errors.length },
      'BatchQualiaPlanner'
    );
    return { ok: false, errors };
  }

  return { ok: true, plans };
}
