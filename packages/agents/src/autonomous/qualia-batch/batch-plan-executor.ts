import { callGroqDirect } from '../../llm/direct-groq';
import { logger } from '../../shared/logger';
import {
  executeDirectComment,
  executeDirectPost,
  executeDirectTrade,
} from '../DirectExecutors';
import type {
  BatchTickPlan,
  TickSimulationEvent,
} from './tick-simulation-types';

function sizeHintToAmount(
  hint: 'SMALL' | 'MEDIUM' | 'LARGE' | undefined
): number {
  if (hint === 'LARGE') {
    return 500;
  }
  if (hint === 'MEDIUM') {
    return 200;
  }
  return 75;
}

async function generateNpcPostContent(params: {
  displayName: string;
  mood: string;
  reason: string;
  eventSummary: string;
}): Promise<string> {
  const text = await callGroqDirect({
    prompt: `Write one short social post (max 220 chars) in voice of NPC "${params.displayName}".
Mood/personality hint: ${params.mood}
Planner reason: ${params.reason}
Context event: ${params.eventSummary}
Rules: no hashtags flood, no URL, believable in-universe tech satire. Plain text only.`,
    system: 'You output only the post body text, no quotes.',
    modelSize: 'small',
    temperature: 0.85,
    maxTokens: 120,
    purpose: 'response',
    actionType: 'npc_batch_post_gen',
  });
  return text.replace(/^["']|["']$/g, '').trim();
}

async function generateNpcCommentContent(params: {
  displayName: string;
  mood: string;
  reason: string;
  postSummary: string;
}): Promise<string> {
  const text = await callGroqDirect({
    prompt: `Write one short comment (max 200 chars) as NPC "${params.displayName}" on this post.
Mood: ${params.mood}
Planner reason: ${params.reason}
Post: ${params.postSummary}
Rules: no thread spam, one insight or reaction. Plain text only.`,
    system: 'You output only the comment body text, no quotes.',
    modelSize: 'small',
    temperature: 0.75,
    maxTokens: 100,
    purpose: 'response',
    actionType: 'npc_batch_comment_gen',
  });
  return text.replace(/^["']|["']$/g, '').trim();
}

export interface BatchPlanExecutionRowResult {
  agentId: string;
  action: string;
  success: boolean;
  detail?: string;
}

/**
 * Executes validated MVP batch plans (TRADE / POST / COMMENT); SKIP is a no-op.
 */
export async function executeValidatedBatchPlans(params: {
  plans: BatchTickPlan[];
  eventsById: Map<string, TickSimulationEvent>;
  displayNameByAgentId: Map<string, string>;
  moodByAgentId: Map<string, string>;
}): Promise<{
  results: BatchPlanExecutionRowResult[];
  actionsExecuted: number;
}> {
  const { plans, eventsById, displayNameByAgentId, moodByAgentId } = params;
  const results: BatchPlanExecutionRowResult[] = [];
  let actionsExecuted = 0;

  const sorted = [...plans].sort((a, b) => b.priority - a.priority);

  for (const plan of sorted) {
    try {
      if (plan.action === 'SKIP') {
        results.push({ agentId: plan.agentId, action: 'SKIP', success: true });
        continue;
      }

      const ev = plan.eventId ? eventsById.get(plan.eventId) : undefined;

      if (plan.action === 'TRADE') {
        if (!ev || ev.kind !== 'market_move' || !ev.metadata.ticker) {
          results.push({
            agentId: plan.agentId,
            action: 'TRADE',
            success: false,
            detail: 'Invalid trade event',
          });
          continue;
        }
        const side =
          plan.direction === 'SELL' ? 'open_short' : ('open_long' as const);
        const tradeResult = await executeDirectTrade({
          agentUserId: plan.agentId,
          marketType: 'perp',
          marketId: ev.metadata.ticker,
          side,
          amount: sizeHintToAmount(plan.sizeHint),
          reasoning: plan.reason,
          skipPerpResolution: true,
        });
        results.push({
          agentId: plan.agentId,
          action: 'TRADE',
          success: tradeResult.success,
          detail: tradeResult.error ?? tradeResult.ticker,
        });
        if (tradeResult.success) {
          actionsExecuted++;
        }
        continue;
      }

      const displayName =
        displayNameByAgentId.get(plan.agentId) ?? plan.agentId;
      const mood = moodByAgentId.get(plan.agentId) ?? '';

      if (plan.action === 'POST') {
        const eventSummary = ev?.summary ?? plan.reason;
        const content = await generateNpcPostContent({
          displayName,
          mood,
          reason: plan.reason,
          eventSummary,
        });
        const postResult = await executeDirectPost({
          agentUserId: plan.agentId,
          content,
        });
        results.push({
          agentId: plan.agentId,
          action: 'POST',
          success: postResult.success,
          detail: postResult.error ?? postResult.postId,
        });
        if (postResult.success) {
          actionsExecuted++;
        }
        continue;
      }

      if (plan.action === 'COMMENT') {
        if (!ev || ev.kind !== 'post' || !ev.metadata.postId) {
          results.push({
            agentId: plan.agentId,
            action: 'COMMENT',
            success: false,
            detail: 'Invalid comment target',
          });
          continue;
        }
        const content = await generateNpcCommentContent({
          displayName,
          mood,
          reason: plan.reason,
          postSummary: ev.summary,
        });
        const commentResult = await executeDirectComment({
          agentUserId: plan.agentId,
          postId: ev.metadata.postId,
          content,
        });
        results.push({
          agentId: plan.agentId,
          action: 'COMMENT',
          success: commentResult.success,
          detail: commentResult.error ?? commentResult.commentId,
        });
        if (commentResult.success) {
          actionsExecuted++;
        }
        continue;
      }

      logger.warn(
        'Unexpected batch plan action in executor',
        { action: plan.action, agentId: plan.agentId },
        'BatchPlanExecutor'
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      logger.error(
        'Batch plan execution failed for one row',
        { agentId: plan.agentId, action: plan.action, error: detail },
        'BatchPlanExecutor'
      );
      results.push({
        agentId: plan.agentId,
        action: plan.action,
        success: false,
        detail,
      });
    }
  }

  return { results, actionsExecuted };
}
