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

import { db } from '@babylon/db';
import type { IAgentRuntime } from '@elizaos/core';
import { WalletService } from '@babylon/engine';
import { trajectoryRecorder } from '@babylon/training';
import { setTrajectoryContext } from '../plugins/plugin-trajectory-logger/src/action-interceptor';
import { agentRuntimeManager } from '../runtime/AgentRuntimeManager';
import { logger } from '../shared/logger';
import type { BabylonRuntime } from '../plugins/babylon/types';

// Import services
import { autonomousA2AService } from './AutonomousA2AService';
import { autonomousBatchResponseService } from './AutonomousBatchResponseService';
import { autonomousCommentingService } from './AutonomousCommentingService';
// import { autonomousDMService } from './AutonomousDMService' // Not used yet
import { autonomousGroupChatService } from './AutonomousGroupChatService';
import { autonomousPlanningCoordinator } from './AutonomousPlanningCoordinator';
import { autonomousPostingService } from './AutonomousPostingService';
import { autonomousTradingService } from './AutonomousTradingService';

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
  method: 'a2a' | 'database' | 'planning_coordinator';
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
   */
  async executeAutonomousTick(
    agentUserId: string,
    runtime: IAgentRuntime,
    recordTrajectories = false
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

    // Get agent config
    const agent = await db.user.findUnique({
      where: { id: agentUserId },
      select: {
        isAgent: true,
        autonomousTrading: true,
        autonomousPosting: true,
        autonomousCommenting: true,
        autonomousDMs: true,
        autonomousGroupChats: true,
        agentPlanningHorizon: true,
        agentGoals: true,
      },
    });

    if (!agent || !agent.isAgent) {
      throw new Error('Agent not found or not an agent');
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
    if (hasGoals && agent.agentPlanningHorizon === 'multi') {
      logger.info(
        'Using goal-oriented planning coordinator',
        undefined,
        'AutonomousCoordinator'
      );

      try {
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
      } catch (error) {
        logger.error(
          'Planning coordinator failed',
          error,
          'AutonomousCoordinator'
        );
        throw error; // Fail fast - don't fall back silently
      }
    }

    // Check if A2A client is connected
    const useA2A = !!(runtime as BabylonRuntime).a2aClient?.isConnected();

    logger.info(
      `Using ${useA2A ? 'A2A protocol' : 'direct database'} for autonomous actions`,
      undefined,
      'AutonomousCoordinator'
    );
    result.method = useA2A ? 'a2a' : 'database';

    // === PRIORITY 1: RESPONSES (Always do first) ===
    // Use batch response service for intelligent response handling
    const responses = await autonomousBatchResponseService.processBatch(
      agentUserId,
      runtime
    );
    result.actionsExecuted.comments += responses; // Comments include replies
    result.actionsExecuted.messages += responses; // Messages include DM responses

    // === PRIORITY 2: TRADING ===
    if (agent.autonomousTrading) {
      // Capture initial state if recording trajectories
      let initialState:
        | {
            agentBalance: number;
            agentPnL: number;
            openPositions: number;
            activeMarkets: number;
            timestamp: number;
          }
        | undefined;
      if (recordTrajectories && trajId) {
        initialState = await this.captureEnvironmentState(agentUserId);
        trajectoryRecorder.startStep(trajId, initialState);
      }

      let tradeInfo: {
        marketId?: string;
        ticker?: string;
        side?: string;
        marketType?: 'prediction' | 'perp';
      } = {};

      if (useA2A) {
        const tradeResult = await autonomousA2AService.executeA2ATrade(
          agentUserId,
          runtime
        );
        if (tradeResult.success) {
          result.actionsExecuted.trades++;
          tradeInfo = {
            marketId: tradeResult.marketId,
            ticker: tradeResult.ticker,
            side: tradeResult.side,
            marketType: tradeResult.marketType,
          };
        }
      } else {
        const tradeResult = await autonomousTradingService.executeTrades(
          agentUserId,
          runtime
        );
        result.actionsExecuted.trades += tradeResult.tradesExecuted;
        tradeInfo = {
          marketId: tradeResult.marketId,
          ticker: tradeResult.ticker,
          side: tradeResult.side,
          marketType: tradeResult.marketType,
        };
      }

      // Complete trajectory step if recording
      if (recordTrajectories && trajId && initialState) {
        const afterState = await this.captureEnvironmentState(agentUserId);
        const pnlChange = afterState.agentPnL - initialState.agentPnL;

        // Calculate reward
        let reward = 0;
        if (result.actionsExecuted.trades > 0) {
          reward = 0.1; // Small positive reward for taking action

          // If we can detect immediate P&L change, use it
          if (pnlChange !== 0) {
            reward = Math.max(-1, Math.min(1, pnlChange / 1000));
          }
        }

        trajectoryRecorder.completeStep(
          trajId,
          {
            actionType: 'TRADING_DECISION',
            parameters: {
              method: useA2A ? 'a2a' : 'database',
              pnlChange,
              initialPnL: initialState.agentPnL,
              finalPnL: afterState.agentPnL,
              marketId: tradeInfo.marketId,
              ticker: tradeInfo.ticker,
              side: tradeInfo.side,
              marketType: tradeInfo.marketType,
            },
            success: result.actionsExecuted.trades > 0,
          },
          reward
        );
      }
    }

    // === PRIORITY 3: SOCIAL (Posting) ===
    if (agent.autonomousPosting) {
      if (useA2A) {
        try {
          const trendingResult = await autonomousA2AService.engageWithTrending(
            agentUserId,
            runtime
          );
          result.actionsExecuted.engagements += trendingResult.engagements;
        } catch (a2aError) {
          logger.warn(
            'A2A trending engagement failed, continuing with direct posting',
            { error: a2aError instanceof Error ? a2aError.message : String(a2aError) },
            'AutonomousCoordinator'
          );
        }
      }

      // Capture initial state if recording trajectories
      if (recordTrajectories && trajId) {
        const initialState = await this.captureEnvironmentState(agentUserId);
        trajectoryRecorder.startStep(trajId, initialState);
      }

      const postId = await autonomousPostingService.createAgentPost(
        agentUserId,
        runtime
      );
      if (postId) {
        result.actionsExecuted.posts++;
      }

      // Complete trajectory step if recording
      if (recordTrajectories && trajId) {
        const reward = postId ? 0.1 : 0; // Small positive reward for creating content
        trajectoryRecorder.completeStep(
          trajId,
          {
            actionType: 'CREATE_POST',
            parameters: { postId },
            success: !!postId,
            result: postId ? { postId } : undefined,
          },
          reward
        );
      }
    }

    // === PRIORITY 4: ENGAGEMENT (Commenting) ===
    if (agent.autonomousCommenting) {
      // Capture initial state if recording trajectories
      if (recordTrajectories && trajId) {
        const initialState = await this.captureEnvironmentState(agentUserId);
        trajectoryRecorder.startStep(trajId, initialState);
      }

      const commentId = await autonomousCommentingService.createAgentComment(
        agentUserId,
        runtime
      );
      if (commentId) {
        result.actionsExecuted.comments++;
      }

      // Complete trajectory step if recording
      if (recordTrajectories && trajId) {
        const reward = commentId ? 0.05 : 0; // Small positive reward for engagement
        trajectoryRecorder.completeStep(
          trajId,
          {
            actionType: 'CREATE_COMMENT',
            parameters: { commentId },
            success: !!commentId,
            result: commentId ? { commentId } : undefined,
          },
          reward
        );
      }
    }

    // === PRIORITY 5: POSITION MONITORING ===
    if (agent.autonomousTrading && useA2A) {
      // Use A2A for position monitoring (better data access)
      const monitorResult = await autonomousA2AService.monitorPositions(
        agentUserId,
        runtime
      );
      result.actionsExecuted.trades += monitorResult.actionsTaken;
    }

    // === PRIORITY 6: COMMUNITY (DMs handled by batch, groups separate) ===
    if (agent.autonomousGroupChats) {
      // Group chats use direct DB (batch service doesn't handle groups yet)
      const groupMessages =
        await autonomousGroupChatService.participateInGroupChats(
          agentUserId,
          runtime
        );
      result.actionsExecuted.groupMessages += groupMessages;
    }

    /**
     * DMs are handled by batch response service above.
     * No need for separate DM service - avoiding duplication.
     */

    result.success = true;
    result.duration = Date.now() - startTime;

    // End trajectory recording if enabled
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
    }

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
    const activeAgents = await db.user.findMany({
      where: {
        isAgent: true,
        OR: [
          { autonomousTrading: true },
          { autonomousPosting: true },
          { autonomousCommenting: true },
          { autonomousDMs: true },
          { autonomousGroupChats: true },
        ],
      },
      select: { id: true, displayName: true },
    });

    logger.info(
      `Processing ${activeAgents.length} active agents`,
      undefined,
      'AutonomousCoordinator'
    );

    let totalActions = 0;
    let errors = 0;

    for (const agent of activeAgents) {
      const result = await this.executeAutonomousTick(agent.id, runtime);

      if (result.success) {
        const actionCount = Object.values(result.actionsExecuted).reduce(
          (sum, count) => sum + count,
          0
        );
        totalActions += actionCount;

        logger.info(
          `Agent ${agent.displayName}: ${actionCount} actions in ${result.duration}ms`,
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
      agentsProcessed: activeAgents.length,
      totalActions,
      errors,
    };
  }

  /**
   * Capture current environment state for trajectory recording
   */
  private async captureEnvironmentState(agentUserId: string) {
    const agent = await db.user.findUnique({
      where: { id: agentUserId },
      select: {
        virtualBalance: true,
        lifetimePnL: true,
        reputationPoints: true,
      },
    });

    const balance = await WalletService.getBalance(agentUserId);

    const [positions, perpPositions] = await Promise.all([
      db.position.count({ where: { userId: agentUserId, status: 'active' } }),
      db.perpPosition.count({ where: { userId: agentUserId, closedAt: null } }),
    ]);

    const activeMarkets = await db.market.count({
      where: { resolved: false, endDate: { gte: new Date() } },
    });

    return {
      agentBalance: Number(balance.balance),
      agentPnL: Number(agent?.lifetimePnL ?? 0),
      openPositions: positions + perpPositions,
      activeMarkets,
      timestamp: Date.now(),
    };
  }
}

export const autonomousCoordinator = new AutonomousCoordinator();
