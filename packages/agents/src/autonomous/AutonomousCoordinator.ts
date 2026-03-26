/**
 * Autonomous Coordinator
 *
 * Central orchestrator for all autonomous agent behaviors.
 * Eliminates duplication and ensures proper coordination between services.
 *
 * Strategy:
 * 1. Prefer A2A when connected (better protocol compliance)
 * 2. Fallback to direct DB when A2A unavailable
 * 3. Batch operations for efficiency
 * 4. Smart response prioritization
 * 5. Optional trajectory recording for RL training
 */

import { and, eq, gte, or } from '@babylon/db';
import { db, markets, userAgentConfigs, users } from '@babylon/db/runtime';
import { trajectoryRecorder } from '@babylon/training';
import type { IAgentRuntime } from '@elizaos/core';
import {
  clearTrajectoryContext,
  setTrajectoryContext,
} from '../plugins/plugin-trajectory-logger/src/action-interceptor';
import { agentRuntimeManager } from '../runtime/AgentRuntimeManager';
import { getAgentConfig } from '../shared/agent-config';
import { logger } from '../shared/logger';

// Import services
import { autonomousPlanningCoordinator } from './AutonomousPlanningCoordinator';
import { multiStepExecutor } from './MultiStepExecutor';
import { priceAlertService } from './PriceAlertService';
import { topicDiversityService } from './TopicDiversityService';

export interface AutonomousTickResult {
  success: boolean;
  actionsExecuted: {
    trades: number;
    posts: number;
    comments: number;
    messages: number;
    groupMessages: number;
    engagements: number;
  };
  method: 'a2a' | 'database' | 'planning_coordinator' | 'multi_step';
  duration: number;
  trajectoryId?: string;
}

export class AutonomousCoordinator {
  /**
   * Execute complete autonomous tick for an agent
   * Now uses goal-oriented multi-action planning when goals are configured
   *
   * @param agentUserId - Agent user ID
   * @param runtime - Agent runtime
   * @param recordTrajectories - Enable trajectory recording for RL training (default: false)
   * @param isNpc - Whether this is an NPC agent (skips User table lookup)
   */
  async executeAutonomousTick(
    agentUserId: string,
    runtime: IAgentRuntime,
    recordTrajectories = false,
    isNpc = false
  ): Promise<AutonomousTickResult> {
    const startTime = Date.now();

    // Initialize trajectory recording if enabled
    let trajId: string | undefined;
    if (recordTrajectories) {
      trajId = await trajectoryRecorder.startTrajectory({
        agentId: agentUserId,
        metadata: {
          tickType: 'autonomous',
          startTime,
        },
      });

      // Set trajectory context on runtime for action/provider logging
      const trajectoryLogger =
        agentRuntimeManager.getTrajectoryLogger(agentUserId);
      if (trajectoryLogger && trajId) {
        setTrajectoryContext(runtime, trajId, trajectoryLogger);
        // Also set current trajectory ID on runtime for LLM call logging
        (runtime as { currentTrajectoryId?: string }).currentTrajectoryId =
          trajId;
      }
    }

    const result: AutonomousTickResult = {
      success: false,
      actionsExecuted: {
        trades: 0,
        posts: 0,
        comments: 0,
        messages: 0,
        groupMessages: 0,
        engagements: 0,
      },
      method: 'database',
      duration: 0,
      trajectoryId: trajId,
    };

    logger.info(
      `Starting autonomous tick for agent ${agentUserId}`,
      undefined,
      'AutonomousCoordinator'
    );

    // For NPCs, skip User table lookup (they don't have User records)
    // For USER_CONTROLLED agents, verify they exist in User table
    if (!isNpc) {
      const agentResult = await db
        .select({ id: users.id, isAgent: users.isAgent })
        .from(users)
        .where(eq(users.id, agentUserId))
        .limit(1);

      const agent = agentResult[0];
      if (!agent || !agent.isAgent) {
        throw new Error('Agent not found or not an agent');
      }
    }

    // Get agent config (only for USER_CONTROLLED agents, NPCs don't have UserAgentConfig)
    const config = isNpc ? null : await getAgentConfig(agentUserId);

    // Helper to clean up trajectory context
    const cleanupTrajectory = async (): Promise<void> => {
      if (recordTrajectories && trajId) {
        const finalState = await this.captureEnvironmentState(agentUserId);
        await trajectoryRecorder.endTrajectory(trajId, {
          finalBalance: finalState.agentBalance,
          finalPnL: finalState.agentPnL,
          gameKnowledge: {
            trueProbabilities: {},
            actualOutcomes: {},
          },
        });
        // Clear trajectory context from WeakMap and runtime
        clearTrajectoryContext(runtime);
        (runtime as { currentTrajectoryId?: string }).currentTrajectoryId =
          undefined;
      }
    };

    try {
      // Price alert pre-step: lightweight DB checks, no LLM calls
      // Only for user-controlled agents (NPCs don't have price alert configs)
      if (!isNpc) {
        const alertsSent = await priceAlertService.checkAlerts(agentUserId);
        if (alertsSent > 0) {
          logger.info(
            `[PriceAlert] ${alertsSent} alert(s) triggered for agent ${agentUserId}`,
            { agentUserId, alertsSent },
            'AutonomousCoordinator'
          );
        }
      }

      // Check if agent has goals configured
      const hasGoals =
        (await db.agentGoal.count({
          where: {
            agentUserId,
            status: 'active',
          },
        })) > 0;

      // Use planning coordinator if agent has goals and multi-action planning enabled
      if (hasGoals && config?.planningHorizon === 'multi') {
        logger.info(
          'Using goal-oriented planning coordinator',
          undefined,
          'AutonomousCoordinator'
        );

        // Generate comprehensive action plan
        const plan = await autonomousPlanningCoordinator.generateActionPlan(
          agentUserId,
          runtime
        );

        // Execute the plan
        const executionResult = await autonomousPlanningCoordinator.executePlan(
          agentUserId,
          runtime,
          plan
        );

        // Map results to standard format
        for (const actionResult of executionResult.results) {
          if (actionResult.success) {
            switch (actionResult.action.type) {
              case 'trade':
                result.actionsExecuted.trades++;
                break;
              case 'post':
                result.actionsExecuted.posts++;
                break;
              case 'comment':
              case 'respond':
                result.actionsExecuted.comments++;
                break;
              case 'message':
                result.actionsExecuted.messages++;
                break;
            }
          }
        }

        result.success = executionResult.successful > 0;
        result.method = 'planning_coordinator';
        result.duration = Date.now() - startTime;

        logger.info(
          'Completed autonomous tick via planning coordinator',
          {
            agentId: agentUserId,
            planned: executionResult.planned,
            executed: executionResult.executed,
            successful: executionResult.successful,
            duration: result.duration,
          },
          'AutonomousCoordinator'
        );

        return result;
      }

      // === USE MULTI-STEP EXECUTOR (Default Mode) ===
      // The multi-step executor lets the LLM decide what actions to take
      // based on current context, iterating up to 5 times per tick.
      logger.info(
        'Using multi-step executor for autonomous actions',
        undefined,
        'AutonomousCoordinator'
      );

      const multiStepResult = await multiStepExecutor.execute(
        agentUserId,
        runtime,
        isNpc
      );

      // Map multi-step results to standard format
      result.actionsExecuted.trades = multiStepResult.actionsExecuted.trades;
      result.actionsExecuted.posts = multiStepResult.actionsExecuted.posts;
      result.actionsExecuted.comments =
        multiStepResult.actionsExecuted.comments;
      result.actionsExecuted.messages =
        multiStepResult.actionsExecuted.messages;
      result.method = 'multi_step';
      result.success = multiStepResult.success;
      result.duration = multiStepResult.duration;

      logger.info(
        `Autonomous tick completed for agent ${agentUserId}`,
        {
          duration: result.duration,
          actions: result.actionsExecuted,
          method: result.method,
          trajectoryId: trajId,
        },
        'AutonomousCoordinator'
      );

      return result;
    } finally {
      // Always clean up trajectory context, even on exception
      await cleanupTrajectory();
    }
  }

  /**
   * Execute autonomous tick for all active agents
   */
  async executeTickForAllAgents(runtime: IAgentRuntime): Promise<{
    agentsProcessed: number;
    totalActions: number;
    errors: number;
  }> {
    // Get all agents with autonomous features enabled
    // Join users with userAgentConfigs to filter by autonomous settings
    const activeAgentResults = await db
      .select({
        id: users.id,
        displayName: users.displayName,
      })
      .from(users)
      .innerJoin(userAgentConfigs, eq(users.id, userAgentConfigs.userId))
      .where(
        and(
          eq(users.isAgent, true),
          or(
            eq(userAgentConfigs.autonomousTrading, true),
            eq(userAgentConfigs.autonomousPosting, true),
            eq(userAgentConfigs.autonomousCommenting, true),
            eq(userAgentConfigs.autonomousDMs, true),
            eq(userAgentConfigs.autonomousGroupChats, true)
          )
        )
      );

    logger.info(
      `Processing ${activeAgentResults.length} active agents`,
      undefined,
      'AutonomousCoordinator'
    );

    // TOPIC DIVERSITY: Seed tracker and assign topics before processing
    await this.initializeTopicDiversity(activeAgentResults.map((a) => a.id));

    let totalActions = 0;
    let errors = 0;

    for (const agent of activeAgentResults) {
      const tickResult = await this.executeAutonomousTick(agent.id, runtime);

      if (tickResult.success) {
        const actionCount = Object.values(tickResult.actionsExecuted).reduce(
          (sum, count) => sum + count,
          0
        );
        totalActions += actionCount;

        logger.info(
          `Agent ${agent.displayName}: ${actionCount} actions in ${tickResult.duration}ms`,
          undefined,
          'AutonomousCoordinator'
        );
      } else {
        errors++;
      }

      // Small delay between agents to avoid overwhelming system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      agentsProcessed: activeAgentResults.length,
      totalActions,
      errors,
    };
  }

  /**
   * Initialize topic diversity tracking and assignment for a batch of agents
   */
  private async initializeTopicDiversity(agentIds: string[]): Promise<void> {
    // Seed the topic tracker with recent posts
    await topicDiversityService.seedFromRecentPosts();

    // Get active prediction markets for topic assignment
    const activeMarkets = await db
      .select({
        id: markets.id,
        question: markets.question,
        yesShares: markets.yesShares,
        noShares: markets.noShares,
      })
      .from(markets)
      .where(and(eq(markets.resolved, false), gte(markets.endDate, new Date())))
      .limit(20);

    // Convert to format expected by diversity service
    const marketsForTopics = activeMarkets.map((m) => {
      const yesShares = Number(m.yesShares || 1);
      const noShares = Number(m.noShares || 1);
      const total = yesShares + noShares;
      return {
        id: m.id,
        question: m.question,
        yesPrice: yesShares / total,
        noPrice: noShares / total,
      };
    });

    // Assign topics to agents
    await topicDiversityService.assignTopicsToAgents(
      agentIds,
      marketsForTopics
    );

    // Log stats
    const stats = topicDiversityService.getTopicStats();
    logger.info(
      `Topic diversity initialized`,
      {
        agentsAssigned: agentIds.length,
        marketsAvailable: marketsForTopics.length,
        topicsTracked: stats.topicsTracked,
        mostCovered: stats.mostCovered.slice(0, 3),
      },
      'AutonomousCoordinator'
    );
  }

  /**
   * Capture current environment state for trajectory recording
   */
  private async captureEnvironmentState(agentUserId: string) {
    const agentResult = await db
      .select({
        virtualBalance: users.virtualBalance,
        lifetimePnL: users.lifetimePnL,
      })
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    const agent = agentResult[0];

    // Get open positions count
    const positionsCount = await db.perpPosition.count({
      where: {
        userId: agentUserId,
        closedAt: null,
      },
    });

    // Get active markets count
    const marketsCount = await db.market.count({
      where: {
        resolved: false,
      },
    });

    return {
      agentBalance: agent ? Number(agent.virtualBalance ?? 0) : 0,
      agentPnL: agent ? Number(agent.lifetimePnL ?? 0) : 0,
      openPositions: positionsCount,
      activeMarkets: marketsCount,
      timestamp: Date.now(),
    };
  }
}

export const autonomousCoordinator = new AutonomousCoordinator();
