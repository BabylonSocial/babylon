/**
 * Multi-Step Executor for Autonomous Agent Ticks
 *
 * Implements an iterative decision loop where the LLM decides what action to take
 * based on current state and previous actions taken this tick.
 *
 * Key design: Services are "dumb executors" - all LLM reasoning happens HERE.
 * This eliminates double LLM calls and makes execution faster.
 */

import { actorState, chats, db, eq, users } from '@babylon/db';
import { StaticDataRegistry, WalletService } from '@babylon/engine';
import type { IAgentRuntime } from '@elizaos/core';
import { callGroqDirect } from '../llm/direct-groq';
import { getNpcGameContext } from '../plugins/babylon/providers/npc-game-context';
import { agentService } from '../services/AgentService';
import { getAgentConfig, getAutonomousFeatures } from '../shared/agent-config';
import { logger } from '../shared/logger';
import {
  executeDirectComment,
  executeDirectLike,
  executeDirectMessage,
  executeDirectPost,
  executeDirectRepost,
  executeDirectTrade,
} from './DirectExecutors';
import { topicDiversityService } from './TopicDiversityService';

import {
  Actions,
  type ActionTraceResult,
  type AgentTickContext,
  buildMultiStepDecisionPrompt,
  Features,
  getRequiredFeature,
  type MultiStepDecision,
} from './templates/multi-step-decision';

// Import utilities
import {
  gatherPendingChatMessages,
  gatherPendingCommentReplies,
  getAgentGroupChats,
  getAgentOwnPosts,
  getAgentPositions,
  getPerpMarkets,
  getPredictionMarkets,
  getRecentPosts,
} from './utils';

// =============================================================================
// Types
// =============================================================================

export interface MultiStepExecutorResult {
  success: boolean;
  actionsExecuted: {
    trades: number;
    posts: number;
    comments: number;
    messages: number;
    engagements: number;
  };
  iterations: number;
  trace: ActionTraceResult[];
  duration: number;
}

// =============================================================================
// Multi-Step Executor
// =============================================================================

export class MultiStepExecutor {
  private readonly maxIterations: number;

  constructor(maxIterations = 5) {
    this.maxIterations = maxIterations;
  }

  /**
   * Execute a multi-step autonomous tick for an agent
   *
   * The LLM decides what action to take at each step, seeing the results
   * of previous actions to make informed decisions.
   *
   * @param agentUserId - User ID for USER_CONTROLLED agents, or agentId for NPCs
   * @param runtime - Agent runtime
   * @param isNpc - Whether this is an NPC agent (skips User table lookup)
   */
  async execute(
    agentUserId: string,
    runtime: IAgentRuntime,
    isNpc = false
  ): Promise<MultiStepExecutorResult> {
    const startTime = Date.now();
    const trace: ActionTraceResult[] = [];

    logger.info(
      `[MultiStep] Starting multi-step execution for agent ${agentUserId}`,
      undefined,
      'MultiStepExecutor'
    );

    // Get agent info (for USER_CONTROLLED agents)
    let agent: typeof users.$inferSelect | undefined;
    if (!isNpc) {
      const [userAgent] = await db
        .select()
        .from(users)
        .where(eq(users.id, agentUserId))
        .limit(1);

      if (!userAgent) {
        throw new Error('Agent not found');
      }
      agent = userAgent;
    }

    // Get agent config (may be null for NPCs)
    const config = await getAgentConfig(agentUserId);
    const baseSystemPrompt =
      config?.systemPrompt ?? 'You are an autonomous trading agent on Babylon.';

    // Determine enabled features - NPCs have all features enabled by default
    // For USER_CONTROLLED agents: trading defaults to true, others default to false
    const enabledFeatures: string[] = [];
    if (isNpc) {
      enabledFeatures.push(
        Features.TRADING,
        Features.POSTING,
        Features.COMMENTING,
        Features.ENGAGING,
        Features.DMS,
        Features.GROUP_CHATS
      );
    } else {
      const features = getAutonomousFeatures(config);
      if (features.trading) enabledFeatures.push(Features.TRADING);
      if (features.posting) enabledFeatures.push(Features.POSTING);
      if (features.commenting) enabledFeatures.push(Features.COMMENTING);
      // User-controlled agents can also engage if they can comment
      if (features.commenting) enabledFeatures.push(Features.ENGAGING);
      if (features.dms) enabledFeatures.push(Features.DMS);
      if (features.groupChats) enabledFeatures.push(Features.GROUP_CHATS);
    }

    const balanceGuidance =
      'Trading guidance: If your balance is low or $0 but you have open positions, you can still sell/close positions to free balance. Do not assume trading is impossible; check your open positions and consider trimming or closing to unlock funds before switching to social-only actions.';
    const systemPrompt = enabledFeatures.includes(Features.TRADING)
      ? `${baseSystemPrompt}\n\n${balanceGuidance}`
      : baseSystemPrompt;

    // Get NPC game context ONCE before loop (arc awareness, world events)
    // Graceful degradation: if context fetch fails, continue without it
    let npcGameContext = '';
    if (isNpc) {
      try {
        npcGameContext = await getNpcGameContext(agentUserId);
      } catch (error) {
        logger.warn(
          'Failed to get NPC game context, continuing without it',
          {
            agentUserId,
            error: error instanceof Error ? error.message : String(error),
          },
          'MultiStepExecutor'
        );
      }
    }

    // Main iteration loop
    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      logger.info(
        `[MultiStep] Iteration ${iteration}/${this.maxIterations}`,
        { agentUserId, actionsCompleted: trace.length },
        'MultiStepExecutor'
      );

      // Compute per-iteration effectiveFeatures based on current trace
      // This enforces one-POST-per-tick: if we've already posted, remove 'posting'
      const hasPostedThisTick = trace.some(
        (r) => r.actionType === Actions.POST && r.success
      );
      const effectiveFeatures = hasPostedThisTick
        ? enabledFeatures.filter((f) => f !== Features.POSTING)
        : enabledFeatures;

      // Gather fresh context (state refreshes after each action)
      const context = await this.gatherContext(
        agentUserId,
        effectiveFeatures,
        isNpc
      );

      // Build decision prompt (systemPrompt passed separately to LLM system role)
      // For NPCs, get name from StaticDataRegistry; for users, use displayName
      const agentName = isNpc
        ? (StaticDataRegistry.getActor(agentUserId)?.name ?? agentUserId)
        : (agent?.displayName ?? agentUserId);
      const prompt = buildMultiStepDecisionPrompt({
        agentName,
        iterationCount: iteration,
        maxIterations: this.maxIterations,
        traceActionResults: trace,
        context,
        isNpc,
        npcGameContext,
      });

      // Get LLM decision
      const decisionResult = await this.getDecision(
        prompt,
        runtime,
        iteration,
        systemPrompt
      );

      if (!decisionResult) {
        logger.warn(
          `[MultiStep] Failed to parse decision at iteration ${iteration}, finishing`,
          undefined,
          'MultiStepExecutor'
        );
        break;
      }

      const { decision, rawResponse } = decisionResult;

      logger.info(
        `[MultiStep] Decision: ${decision.action || 'FINISH'}`,
        {
          thought: decision.thought.substring(0, 100),
          isFinish: decision.isFinish,
        },
        'MultiStepExecutor'
      );

      // Check if we should finish
      if (decision.isFinish || !decision.action) {
        logger.info(
          `[MultiStep] Agent decided to finish at iteration ${iteration}`,
          { thought: decision.thought },
          'MultiStepExecutor'
        );
        break;
      }

      // Execute the chosen action with parameters (pass effectiveFeatures for enforcement)
      const actionResult = await this.executeAction(
        agentUserId,
        decision.action,
        decision.parameters,
        effectiveFeatures,
        runtime,
        isNpc,
        { prompt, completion: rawResponse, thought: decision.thought }
      );

      trace.push(actionResult);

      // Small delay between iterations (reduced since no double LLM calls)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Aggregate results
    const result = this.aggregateResults(trace, startTime);

    logger.info(
      `[MultiStep] Completed in ${result.duration}ms with ${result.iterations} iterations`,
      {
        trades: result.actionsExecuted.trades,
        posts: result.actionsExecuted.posts,
        comments: result.actionsExecuted.comments,
        messages: result.actionsExecuted.messages,
      },
      'MultiStepExecutor'
    );

    return result;
  }

  /**
   * Gather current context for decision making
   * Uses utility functions for individual data fetching
   */
  private async gatherContext(
    agentUserId: string,
    enabledFeatures: string[],
    isNpc: boolean
  ): Promise<AgentTickContext> {
    // Get balance and PnL
    let balance = 0;
    let pnl = 0;
    let creator: { name: string; username?: string } | undefined;

    if (isNpc) {
      const [actor] = await db
        .select({ tradingBalance: actorState.tradingBalance })
        .from(actorState)
        .where(eq(actorState.id, agentUserId))
        .limit(1);

      if (!actor) {
        throw new Error(
          `NPC ${agentUserId} has no actorState record. Run NPC bootstrap to create it.`
        );
      }

      balance = Number(actor.tradingBalance);
      pnl = 0;
    } else {
      const walletBalance = await WalletService.getBalance(agentUserId);
      balance = walletBalance.balance;
      pnl = walletBalance.lifetimePnL;

      // Fetch creator info for user-controlled agents
      const [agentUser] = await db
        .select({ managedBy: users.managedBy })
        .from(users)
        .where(eq(users.id, agentUserId))
        .limit(1);

      if (agentUser?.managedBy) {
        const [creatorUser] = await db
          .select({
            displayName: users.displayName,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, agentUser.managedBy))
          .limit(1);

        if (creatorUser) {
          creator = {
            name: creatorUser.displayName || creatorUser.username || 'Unknown',
            username: creatorUser.username || undefined,
          };
        }
      }
    }

    // Only fetch data for enabled features (saves DB queries and tokens)
    const canTrade = enabledFeatures.includes(Features.TRADING);
    const canComment = enabledFeatures.includes(Features.COMMENTING);
    const canRespondDMs = enabledFeatures.includes(Features.DMS);
    const canGroupChat = enabledFeatures.includes(Features.GROUP_CHATS);
    const canPost = enabledFeatures.includes(Features.POSTING);

    // Gather context in parallel using utility functions
    const [
      predictionMarkets,
      perpMarkets,
      agentPositions,
      recentPosts,
      pendingCommentRepliesRaw,
      pendingChatMessagesRaw,
      agentGroupChats,
      agentOwnPosts,
    ] = await Promise.all([
      canTrade ? getPredictionMarkets() : Promise.resolve([]),
      canTrade ? getPerpMarkets() : Promise.resolve([]),
      getAgentPositions(agentUserId),
      canComment || canRespondDMs
        ? getRecentPosts(agentUserId)
        : Promise.resolve([]),
      canComment
        ? gatherPendingCommentReplies(agentUserId)
        : Promise.resolve([]),
      canRespondDMs || canGroupChat
        ? gatherPendingChatMessages(agentUserId)
        : Promise.resolve([]),
      canGroupChat ? getAgentGroupChats(agentUserId) : Promise.resolve([]),
      canPost ? getAgentOwnPosts(agentUserId) : Promise.resolve([]),
    ]);

    // Filter chat messages based on DMs vs group chats feature
    const pendingChatMessages = pendingChatMessagesRaw.filter((m) =>
      m.isGroupChat ? canGroupChat : canRespondDMs
    );

    // Get topic diversity guidance for this agent
    const diversityInstructions =
      topicDiversityService.getDiversityInstructions(agentUserId);
    const assignment = topicDiversityService.getAgentAssignment(agentUserId);

    return {
      balance,
      pnl,
      openPositions:
        agentPositions.predictions.length + agentPositions.perps.length,
      pendingCommentReplies: pendingCommentRepliesRaw.slice(0, 3),
      pendingChatMessages: pendingChatMessages.slice(0, 3),
      enabledFeatures,
      predictionMarkets,
      perpMarkets,
      recentPosts,
      agentPositions,
      groupChats: agentGroupChats,
      diversityInstructions,
      assignedMarketId: assignment?.marketId,
      personality: assignment?.personality,
      postStyle: assignment?.postStyle,
      agentOwnPosts,
      creator,
    };
  }

  /**
   * Get LLM decision with retry logic
   */
  private async getDecision(
    prompt: string,
    runtime: IAgentRuntime,
    _iteration: number,
    systemPrompt?: string
  ): Promise<{ decision: MultiStepDecision; rawResponse: string } | null> {
    const maxRetries = 3;

    const system = systemPrompt
      ? `${systemPrompt}\n\nIMPORTANT: Output valid JSON only. No markdown, no explanations.`
      : 'You are a decision-making agent. Output valid JSON only. No markdown, no explanations.';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await callGroqDirect({
        prompt,
        system,
        runtime,
        temperature: attempt > 1 ? 0.5 : 0.7,
        maxTokens: 1000,
        actionType: 'multi_step_decision',
        purpose: 'action',
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn(
          `[MultiStep] No JSON found in response (attempt ${attempt})`,
          { responsePreview: response.substring(0, 200) },
          'MultiStepExecutor'
        );
        continue;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]) as MultiStepDecision;

        if (typeof parsed.isFinish !== 'boolean') {
          parsed.isFinish = false;
        }
        if (!parsed.action) {
          parsed.action = '';
        }
        if (!parsed.parameters) {
          parsed.parameters = {};
        }
        if (!parsed.thought) {
          parsed.thought = '';
        }

        return { decision: parsed, rawResponse: response };
      } catch {
        logger.warn(
          `[MultiStep] Failed to parse JSON (attempt ${attempt})`,
          { json: jsonMatch[0].substring(0, 200) },
          'MultiStepExecutor'
        );
      }
    }

    return null;
  }

  /**
   * Execute a single action using DIRECT executors (no LLM calls)
   */
  private async executeAction(
    agentUserId: string,
    action: string,
    parameters: Record<string, unknown>,
    enabledFeatures: string[],
    _runtime: IAgentRuntime,
    isNpc: boolean,
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    const normalizedAction = action.toUpperCase();

    logger.info(
      `[MultiStep] Executing action: ${normalizedAction}`,
      { parameters, enabledFeatures },
      'MultiStepExecutor'
    );

    // Enforce enabled features
    const requiredFeature = getRequiredFeature(normalizedAction);
    if (requiredFeature && !enabledFeatures.includes(requiredFeature)) {
      logger.warn(
        `[MultiStep] Action ${normalizedAction} blocked - ${requiredFeature} not enabled`,
        { agentUserId, enabledFeatures },
        'MultiStepExecutor'
      );
      return {
        actionType: normalizedAction,
        success: false,
        summary: `Action blocked: ${requiredFeature} is not enabled for this agent`,
        error: `Feature "${requiredFeature}" is disabled`,
        parameters,
        timestamp: Date.now(),
      };
    }

    switch (normalizedAction) {
      case Actions.TRADE:
        return this.executeTrade(agentUserId, parameters);

      case Actions.POST:
        return this.executePost(agentUserId, parameters, isNpc, logContext);

      case Actions.COMMENT:
        return this.executeComment(agentUserId, parameters, logContext);

      case Actions.LIKE:
        return this.executeLike(agentUserId, parameters);

      case Actions.REPOST:
        return this.executeRepost(agentUserId, parameters);

      case Actions.REPLY_COMMENT:
        return this.executeReplyComment(agentUserId, parameters, logContext);

      case Actions.REPLY_CHAT:
        // Special validation: REPLY_CHAT needs either DMs or groupChats based on chat type
        return this.executeReplyChat(
          agentUserId,
          parameters,
          enabledFeatures,
          logContext
        );

      case Actions.DM:
        return this.executeDM(agentUserId, parameters, logContext);

      case Actions.GROUP_MESSAGE:
        return this.executeGroupMessage(agentUserId, parameters, logContext);

      case Actions.WAIT:
      case '':
        return {
          actionType: Actions.WAIT,
          success: true,
          summary: 'Agent decided to wait',
          parameters,
          timestamp: Date.now(),
        };

      default:
        logger.warn(
          `[MultiStep] Unknown action: ${normalizedAction}`,
          undefined,
          'MultiStepExecutor'
        );
        return {
          actionType: normalizedAction,
          success: false,
          summary: `Unknown action: ${normalizedAction}`,
          error: `Action "${normalizedAction}" is not recognized`,
          parameters,
          timestamp: Date.now(),
        };
    }
  }

  // ===========================================================================
  // Action Executors
  // ===========================================================================

  private async executeTrade(
    agentUserId: string,
    parameters: Record<string, unknown>
  ): Promise<ActionTraceResult> {
    const marketType = parameters.marketType as 'prediction' | 'perp';
    const marketId = parameters.marketId as string;
    const side = parameters.side as string;
    const amount = Number(parameters.amount || 100);
    const reasoning = parameters.reasoning as string | undefined;

    if (!marketId || !side) {
      return {
        actionType: Actions.TRADE,
        success: false,
        summary: 'Missing required parameters (marketId, side)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    const tradeResult = await executeDirectTrade({
      agentUserId,
      marketType: marketType || 'prediction',
      marketId,
      side: side as
        | 'buy_yes'
        | 'buy_no'
        | 'sell_yes'
        | 'sell_no'
        | 'open_long'
        | 'open_short'
        | 'close_position',
      amount,
      reasoning,
    });

    return {
      actionType: Actions.TRADE,
      success: tradeResult.success,
      summary: tradeResult.success
        ? `Traded ${side} $${amount} on ${tradeResult.marketId || tradeResult.ticker}`
        : `Trade failed: ${tradeResult.error}`,
      result: {
        success: tradeResult.success,
        marketId: tradeResult.marketId,
        ticker: tradeResult.ticker,
        side: tradeResult.side,
        shares: tradeResult.shares,
        error: tradeResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executePost(
    agentUserId: string,
    parameters: Record<string, unknown>,
    isNpc: boolean,
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    // PLAYER AGENT POST RATE LIMIT: Only 10% of post attempts succeed
    if (!isNpc && Math.random() > 0.1) {
      logger.info(
        `[MultiStep] POST blocked by rate limiter for player agent ${agentUserId}`,
        undefined,
        'MultiStepExecutor'
      );
      return {
        actionType: Actions.POST,
        success: false,
        summary: 'Post rate limited - focus on trading and engagement instead',
        error: 'Rate limited: try TRADE, COMMENT, LIKE, or REPOST instead',
        parameters,
        timestamp: Date.now(),
      };
    }

    const content = parameters.content as string;

    if (!content) {
      return {
        actionType: Actions.POST,
        success: false,
        summary: 'Missing content parameter',
        error: 'No content provided',
        parameters,
        timestamp: Date.now(),
      };
    }

    const postResult = await executeDirectPost({ agentUserId, content });

    if (postResult.success && logContext) {
      await agentService.createLog(agentUserId, {
        type: 'post',
        level: 'info',
        message: `Created post: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        prompt: logContext.prompt,
        completion: logContext.completion,
        thinking: logContext.thought,
        metadata: {
          postId: postResult.postId ?? null,
          contentLength: content.length,
        },
      });
    }

    return {
      actionType: Actions.POST,
      success: postResult.success,
      summary: postResult.success
        ? `Created post ${postResult.postId}`
        : `Post failed: ${postResult.error}`,
      result: {
        success: postResult.success,
        postId: postResult.postId,
        error: postResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeComment(
    agentUserId: string,
    parameters: Record<string, unknown>,
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    const postId = parameters.postId as string;
    const content = parameters.content as string;
    const parentCommentId = parameters.parentCommentId as string | undefined;

    if (!postId || !content) {
      return {
        actionType: Actions.COMMENT,
        success: false,
        summary: 'Missing required parameters (postId, content)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    const commentResult = await executeDirectComment({
      agentUserId,
      postId,
      content,
      parentCommentId,
    });

    if (commentResult.success && logContext) {
      await agentService.createLog(agentUserId, {
        type: 'comment',
        level: 'info',
        message: `Created comment on post ${postId}${parentCommentId ? ` (reply to ${parentCommentId})` : ''}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        prompt: logContext.prompt,
        completion: logContext.completion,
        thinking: logContext.thought,
        metadata: {
          commentId: commentResult.commentId ?? null,
          postId,
          parentCommentId: parentCommentId ?? null,
          contentLength: content.length,
        },
      });
    }

    return {
      actionType: Actions.COMMENT,
      success: commentResult.success,
      summary: commentResult.success
        ? `Created comment ${commentResult.commentId}`
        : `Comment failed: ${commentResult.error}`,
      result: {
        success: commentResult.success,
        commentId: commentResult.commentId,
        error: commentResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeLike(
    agentUserId: string,
    parameters: Record<string, unknown>
  ): Promise<ActionTraceResult> {
    const postId = parameters.postId as string;

    if (!postId) {
      return {
        actionType: Actions.LIKE,
        success: false,
        summary: 'Missing required parameter (postId)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    const likeResult = await executeDirectLike({ agentUserId, postId });

    await agentService.createLog(agentUserId, {
      type: 'like',
      level: likeResult.success ? 'info' : 'warn',
      message: likeResult.success
        ? `Liked post ${postId}`
        : `Like failed: ${likeResult.error}`,
      metadata: {
        postId,
        success: likeResult.success,
        liked: likeResult.liked ?? false,
        error: likeResult.error ?? null,
      },
    });

    return {
      actionType: Actions.LIKE,
      success: likeResult.success,
      summary: likeResult.success
        ? `Liked post ${postId}`
        : `Like failed: ${likeResult.error}`,
      result: {
        success: likeResult.success,
        liked: likeResult.liked,
        error: likeResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeRepost(
    agentUserId: string,
    parameters: Record<string, unknown>
  ): Promise<ActionTraceResult> {
    const postId = parameters.postId as string;
    const comment = parameters.comment as string | undefined;

    if (!postId) {
      return {
        actionType: Actions.REPOST,
        success: false,
        summary: 'Missing required parameter (postId)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    const repostResult = await executeDirectRepost({
      agentUserId,
      postId,
      comment,
    });

    await agentService.createLog(agentUserId, {
      type: 'repost',
      level: repostResult.success ? 'info' : 'warn',
      message: repostResult.success
        ? `Reposted ${postId}${comment ? ' with comment' : ''}`
        : `Repost failed: ${repostResult.error}`,
      metadata: {
        postId,
        success: repostResult.success,
        repostId: repostResult.repostId ?? null,
        quotePostId: repostResult.quotePostId ?? null,
        hasComment: !!comment,
        error: repostResult.error ?? null,
      },
    });

    return {
      actionType: Actions.REPOST,
      success: repostResult.success,
      summary: repostResult.success
        ? `Reposted ${postId}${comment ? ' with comment' : ''}`
        : `Repost failed: ${repostResult.error}`,
      result: {
        success: repostResult.success,
        repostId: repostResult.repostId,
        quotePostId: repostResult.quotePostId,
        error: repostResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeReplyComment(
    agentUserId: string,
    parameters: Record<string, unknown>,
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    const commentId = parameters.commentId as string;
    const postId = parameters.postId as string;
    const content = parameters.content as string;

    if (!commentId || !postId || !content) {
      return {
        actionType: Actions.REPLY_COMMENT,
        success: false,
        summary: 'Missing required parameters (commentId, postId, content)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    const commentResult = await executeDirectComment({
      agentUserId,
      postId,
      content,
      parentCommentId: commentId,
    });

    if (logContext) {
      await agentService.createLog(agentUserId, {
        type: 'comment',
        level: commentResult.success ? 'info' : 'warn',
        message: commentResult.success
          ? `Replied to comment ${commentId}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
          : `Reply failed: ${commentResult.error}`,
        prompt: logContext.prompt,
        completion: logContext.completion,
        thinking: logContext.thought,
        metadata: {
          commentId: commentResult.commentId ?? null,
          parentCommentId: commentId,
          postId,
          contentLength: content.length,
          error: commentResult.error ?? null,
        },
      });
    }

    return {
      actionType: Actions.REPLY_COMMENT,
      success: commentResult.success,
      summary: commentResult.success
        ? `Replied to comment ${commentId}`
        : `Reply failed: ${commentResult.error}`,
      result: {
        success: commentResult.success,
        commentId: commentResult.commentId,
        error: commentResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeReplyChat(
    agentUserId: string,
    parameters: Record<string, unknown>,
    enabledFeatures: string[],
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    const chatId = parameters.chatId as string;
    const content = parameters.content as string;

    if (!chatId || !content) {
      return {
        actionType: Actions.REPLY_CHAT,
        success: false,
        summary: 'Missing required parameters (chatId, content)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    // Look up the chat to determine if it's a group chat or DM
    const [chat] = await db
      .select({ isGroup: chats.isGroup })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      return {
        actionType: Actions.REPLY_CHAT,
        success: false,
        summary: 'Chat not found',
        error: 'Invalid chatId',
        parameters,
        timestamp: Date.now(),
      };
    }

    // Validate feature based on chat type
    const requiredFeature = chat.isGroup ? Features.GROUP_CHATS : Features.DMS;
    if (!enabledFeatures.includes(requiredFeature)) {
      return {
        actionType: Actions.REPLY_CHAT,
        success: false,
        summary: `Cannot reply: ${requiredFeature} feature is not enabled`,
        error: `Feature "${requiredFeature}" is disabled`,
        parameters,
        timestamp: Date.now(),
      };
    }

    const messageResult = await executeDirectMessage({
      agentUserId,
      chatId,
      content,
    });

    if (logContext) {
      await agentService.createLog(agentUserId, {
        type: 'chat',
        level: messageResult.success ? 'info' : 'warn',
        message: messageResult.success
          ? `Replied in chat ${chatId}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
          : `Chat reply failed: ${messageResult.error}`,
        prompt: logContext.prompt,
        completion: logContext.completion,
        thinking: logContext.thought,
        metadata: {
          messageId: messageResult.messageId ?? null,
          chatId,
          contentLength: content.length,
          error: messageResult.error ?? null,
        },
      });
    }

    return {
      actionType: Actions.REPLY_CHAT,
      success: messageResult.success,
      summary: messageResult.success
        ? `Replied in chat ${chatId}`
        : `Chat reply failed: ${messageResult.error}`,
      result: {
        success: messageResult.success,
        messageId: messageResult.messageId,
        error: messageResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeDM(
    agentUserId: string,
    parameters: Record<string, unknown>,
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    const recipientId = parameters.recipientId as string;
    const content = parameters.content as string;

    if (!recipientId || !content) {
      return {
        actionType: Actions.DM,
        success: false,
        summary: 'Missing required parameters (recipientId, content)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    if (recipientId === agentUserId) {
      return {
        actionType: Actions.DM,
        success: false,
        summary: 'Cannot DM yourself',
        error: 'Cannot DM yourself',
        parameters,
        timestamp: Date.now(),
      };
    }

    const messageResult = await executeDirectMessage({
      agentUserId,
      recipientId,
      content,
    });

    if (logContext) {
      await agentService.createLog(agentUserId, {
        type: 'dm',
        level: messageResult.success ? 'info' : 'warn',
        message: messageResult.success
          ? `Sent DM to ${recipientId}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
          : `Failed to send DM to ${recipientId}: ${messageResult.error}`,
        prompt: logContext.prompt,
        completion: logContext.completion,
        thinking: logContext.thought,
        metadata: {
          messageId: messageResult.messageId ?? null,
          recipientId,
          contentLength: content.length,
          error: messageResult.error ?? null,
        },
      });
    }

    return {
      actionType: Actions.DM,
      success: messageResult.success,
      summary: messageResult.success
        ? `Sent message ${messageResult.messageId} to ${recipientId}`
        : `Message failed: ${messageResult.error}`,
      result: {
        success: messageResult.success,
        messageId: messageResult.messageId,
        error: messageResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  private async executeGroupMessage(
    agentUserId: string,
    parameters: Record<string, unknown>,
    logContext?: { prompt: string; completion: string; thought: string }
  ): Promise<ActionTraceResult> {
    const chatId = parameters.chatId as string;
    const content = parameters.content as string;

    if (!chatId || !content) {
      return {
        actionType: Actions.GROUP_MESSAGE,
        success: false,
        summary: 'Missing required parameters (chatId, content)',
        error: 'Invalid parameters',
        parameters,
        timestamp: Date.now(),
      };
    }

    // Validate that the chat is actually a group chat
    const [chat] = await db
      .select({ isGroup: chats.isGroup })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat) {
      return {
        actionType: Actions.GROUP_MESSAGE,
        success: false,
        summary: 'Chat not found',
        error: 'Invalid chatId',
        parameters,
        timestamp: Date.now(),
      };
    }

    if (!chat.isGroup) {
      return {
        actionType: Actions.GROUP_MESSAGE,
        success: false,
        summary:
          'Cannot use GROUP_MESSAGE on a DM chat - use DM or REPLY_CHAT instead',
        error: 'Chat is not a group chat',
        parameters,
        timestamp: Date.now(),
      };
    }

    const groupMessageResult = await executeDirectMessage({
      agentUserId,
      chatId,
      content,
    });

    await agentService.createLog(agentUserId, {
      type: 'chat',
      level: groupMessageResult.success ? 'info' : 'warn',
      message: groupMessageResult.success
        ? `Sent group message to chat ${chatId}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
        : `Failed to send group message: ${groupMessageResult.error}`,
      prompt: logContext?.prompt ?? undefined,
      completion: logContext?.completion ?? undefined,
      thinking: logContext?.thought ?? undefined,
      metadata: {
        messageId: groupMessageResult.messageId ?? null,
        chatId,
        contentLength: content.length,
        error: groupMessageResult.error ?? null,
      },
    });

    return {
      actionType: Actions.GROUP_MESSAGE,
      success: groupMessageResult.success,
      summary: groupMessageResult.success
        ? `Sent message to group chat ${chatId}`
        : `Group message failed: ${groupMessageResult.error}`,
      result: {
        success: groupMessageResult.success,
        messageId: groupMessageResult.messageId,
        error: groupMessageResult.error,
      },
      parameters,
      timestamp: Date.now(),
    };
  }

  // ===========================================================================
  // Result Aggregation
  // ===========================================================================

  private aggregateResults(
    trace: ActionTraceResult[],
    startTime: number
  ): MultiStepExecutorResult {
    const counts = {
      trades: 0,
      posts: 0,
      comments: 0,
      messages: 0,
      engagements: 0,
    };

    for (const result of trace) {
      if (!result.success) continue;

      switch (result.actionType) {
        case Actions.TRADE:
          counts.trades++;
          break;
        case Actions.POST:
          counts.posts++;
          break;
        case Actions.COMMENT:
        case Actions.REPLY_COMMENT:
          counts.comments++;
          break;
        case Actions.DM:
        case Actions.GROUP_MESSAGE:
        case Actions.REPLY_CHAT:
          counts.messages++;
          break;
        case Actions.LIKE:
        case Actions.REPOST:
          counts.engagements++;
          break;
      }
    }

    const hasSuccessfulActions = trace.some(
      (r) => r.success && r.actionType !== Actions.WAIT
    );

    return {
      success: hasSuccessfulActions,
      actionsExecuted: counts,
      iterations: trace.length,
      trace,
      duration: Date.now() - startTime,
    };
  }
}

// Export singleton instance
export const multiStepExecutor = new MultiStepExecutor();
