/**
 * Autonomous Agent Tick Cron Job API
 *
 * @route POST /api/cron/agent-tick - Execute agent tick
 * @access Cron (CRON_SECRET required)
 *
 * @description
 * Scheduled cron job that runs all autonomous agents, executing their configured
 * autonomous actions (trading, posting, commenting, DMs, group chats). Processes
 * agents in sequence, deducting points and logging activities. Auto-pauses agents
 * with insufficient points.
 *
 * @openapi
 * /api/cron/agent-tick:
 *   post:
 *     tags:
 *       - Cron
 *     summary: Execute agent tick
 *     description: Runs all autonomous agents with coordinated execution (requires CRON_SECRET)
 *     security:
 *       - CronSecret: []
 *     responses:
 *       200:
 *         description: Agent tick executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 agentsProcessed:
 *                   type: integer
 *                 agentsPaused:
 *                   type: integer
 *                 errors:
 *                   type: array
 *       401:
 *         description: Invalid or missing CRON_SECRET
 *
 * @example
 * ```typescript
 * await fetch('/api/cron/agent-tick', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
 * });
 * ```
 *
 * @see {@link /lib/services/autonomous-coordinator} Autonomous coordinator
 * @see {@link /lib/agents/services/AgentService} Agent service
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { User } from '@babylon/db';
import { db } from '@babylon/db';
import {
  agentRuntimeManager,
  agentService,
  autonomousCoordinator,
} from '@babylon/agents';
import { logger } from '@babylon/shared';
import {
  acquireAgentLock,
  releaseAgentLock,
} from '@babylon/agents';
import { agentRegistry } from '@babylon/agents';
import { relayCronToStaging } from '@babylon/api';
import { AgentStatus, AgentType } from '@babylon/agents';

// Vercel function configuration
// Note: vercel.json overrides this with 800 seconds (13.3 minutes)
export const maxDuration = 800; // 13.3 minutes max for agent tick (matches vercel.json)
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/agent-tick
 *
 * Alias for POST endpoint to support GET requests from cron services.
 *
 * @param req - Next.js request
 * @returns Same response as POST endpoint
 */
export async function GET(req: NextRequest) {
  return POST(req);
}

/**
 * POST /api/cron/agent-tick
 *
 * Executes autonomous agent tick, running all active agents through their configured
 * autonomous actions (trading, posting, commenting, DMs, group chats). Processes agents
 * sequentially with distributed locking, deducts points, logs activities, and auto-pauses
 * agents with insufficient points. Supports staging environment relay.
 *
 * @param _req - Next.js request (CRON_SECRET required in Authorization header)
 * @returns Execution result with agents processed, paused, errors, and timing metrics
 * @throws {401} Invalid or missing CRON_SECRET
 */
export async function POST(_req: NextRequest) {
  const startTime = Date.now();
  const processId = `agent-tick-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  logger.info('Agent tick started', { processId }, 'AgentTick');

  // 1. Relay to staging if REDIRECT_CRON_STAGING is enabled
  const relayResult = await relayCronToStaging(_req, 'agent-tick');
  if (relayResult.forwarded) {
    logger.info(
      'Cron execution relayed to staging - skipping local execution',
      {
        status: relayResult.status,
        error: relayResult.error,
      },
      'AgentTick'
    );
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Relayed to staging environment',
      relayStatus: relayResult.status,
      processed: 0,
      skippedLocked: 0,
    });
  }

  // 2. Check GAME_START environment variable (manual override)
  const gameStartEnv = process.env.GAME_START?.toLowerCase();
  if (gameStartEnv === 'false' || gameStartEnv === '0') {
    logger.info(
      '⏸️  Game disabled via GAME_START env var - skipping tick',
      {
        GAME_START: process.env.GAME_START,
      },
      'AgentTick'
    );
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Game disabled via GAME_START environment variable',
      processed: 0,
      skippedLocked: 0,
    });
  }

  // 3. Check Game status from database
  const gameState = await db.game.findFirst({
    where: { isContinuous: true },
  });

  // Skip if no continuous game exists
  if (!gameState) {
    logger.info(
      '⏸️  Agent tick skipped (No continuous game found)',
      {
        status: 'skipped',
      },
      'AgentTick'
    );

    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'No continuous game found',
      duration: Date.now() - startTime,
      processed: 0,
      skippedLocked: 0,
    });
  }

  // Skip if game exists but is not running
  if (!gameState.isRunning) {
    logger.info(
      '⏸️  Agent tick paused (Game is not running)',
      {
        gameId: gameState.id,
        status: 'paused',
      },
      'AgentTick'
    );

    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Game is paused',
      gameId: gameState.id,
      duration: Date.now() - startTime,
      processed: 0,
      skippedLocked: 0,
    });
  }

  // NEW: Query via AgentRegistry to include both USER agents and NPCs
  const registeredAgents = await agentRegistry.discoverAgents({
    types: [AgentType.USER_CONTROLLED, AgentType.NPC],
    statuses: [AgentStatus.ACTIVE, AgentStatus.INITIALIZED, AgentStatus.REGISTERED],
    limit: 500, // Increase limit to ensure we process all agents in test environments
  });

  // Filter agents with sufficient points and autonomous features enabled
  const eligibleAgents: Array<{
    agentId: string;
    type: AgentType;
    name: string;
    user: User | null;
  }> = [];

  for (const agent of registeredAgents) {
    if (agent.type === AgentType.USER_CONTROLLED && agent.userId) {
      // Check User-specific autonomous settings and points
      const user = await db.user.findUnique({
        where: { id: agent.userId },
      });

      if (
        user &&
        user.isAgent &&
        user.agentPointsBalance >= 1 &&
        (user.autonomousTrading ||
          user.autonomousPosting ||
          user.autonomousCommenting ||
          user.autonomousDMs ||
          user.autonomousGroupChats)
      ) {
        eligibleAgents.push({
          agentId: agent.agentId,
          type: agent.type,
          name: agent.name,
          user,
        });
      }
    } else if (agent.type === AgentType.NPC) {
      // NPCs are always eligible if registered and active
      eligibleAgents.push({
        agentId: agent.agentId,
        type: agent.type,
        name: agent.name,
        user: null,
      });
    }
  }

  // Validation: Check if agents were found
  if (eligibleAgents.length === 0) {
    logger.warn(
      'No eligible agents found to run',
      {
        totalRegistered: registeredAgents.length,
        criteria:
          'USER agents with autonomous features + points >= 1, or active NPCs',
      },
      'AgentTick'
    );

    return NextResponse.json({
      success: true,
      processed: 0,
      duration: Date.now() - startTime,
      results: [],
      skippedLocked: 0,
      warning:
        'No agents found with autonomous features enabled and sufficient points',
    });
  }

  logger.info(
    `Found ${eligibleAgents.length} eligible autonomous agents (${registeredAgents.length} total registered)`,
    {
      userAgents: eligibleAgents.filter(
        (a) => a.type === AgentType.USER_CONTROLLED
      ).length,
      npcAgents: eligibleAgents.filter((a) => a.type === AgentType.NPC).length,
    },
    'AgentTick'
  );

  const results: Array<{
    agentId: string;
    agentType: AgentType;
    name: string;
    status: string;
    reason?: string;
    error?: string;
    pointsDeducted?: number;
    duration: number;
    actions?: number;
    method?: 'database' | 'a2a' | 'planning_coordinator';
  }> = [];
  let totalActionsExecuted = 0;
  let errors = 0;
  let skippedDueToLock = 0;

  for (const eligibleAgent of eligibleAgents) {
    const agentStartTime = Date.now();

    // Try to acquire lock for this agent - skip if already running
    const lockAcquired = await acquireAgentLock(
      eligibleAgent.agentId,
      processId
    );

    if (!lockAcquired) {
      // Agent is still running from previous tick - skip it
      skippedDueToLock++;
      logger.info(
        `Skipping agent ${eligibleAgent.name} - still running from previous tick`,
        {
          agentId: eligibleAgent.agentId,
          agentType: eligibleAgent.type,
        },
        'AgentTick'
      );

      results.push({
        agentId: eligibleAgent.agentId,
        agentType: eligibleAgent.type,
        name: eligibleAgent.name,
        status: 'skipped',
        reason: 'locked',
        duration: Date.now() - agentStartTime,
      });

      continue;
    }

    try {
      // Always 1pt per tick for USER agents (NPCs don't use points)
      const pointsCost =
        eligibleAgent.type === AgentType.USER_CONTROLLED ? 1 : 0;

      if (
        eligibleAgent.type === AgentType.USER_CONTROLLED &&
        eligibleAgent.user
      ) {
        await agentService.deductPoints(
          eligibleAgent.user.id,
          pointsCost,
          'Autonomous tick'
        );
      }

      // Use agent runtime manager for both USER and NPC agents
      const runtime = await agentRuntimeManager.getRuntime(
        eligibleAgent.agentId
      );

      // Determine enabled features based on agent type
      const enabledFeatures: string[] = [];
      if (
        eligibleAgent.type === AgentType.USER_CONTROLLED &&
        eligibleAgent.user
      ) {
        if (eligibleAgent.user.autonomousTrading)
          enabledFeatures.push('trading');
        if (eligibleAgent.user.autonomousPosting)
          enabledFeatures.push('posting');
        if (eligibleAgent.user.autonomousCommenting)
          enabledFeatures.push('commenting');
        if (eligibleAgent.user.autonomousDMs) enabledFeatures.push('DMs');
        if (eligibleAgent.user.autonomousGroupChats)
          enabledFeatures.push('group chats');
      } else if (eligibleAgent.type === AgentType.NPC) {
        // NPCs have all autonomous features enabled by default
        enabledFeatures.push(
          'trading',
          'posting',
          'commenting',
          'DMs',
          'group chats'
        );
      }

      // Enable trajectory recording for RL training data collection
      // Can be toggled via environment variable
      const recordTrajectories =
        process.env.RECORD_AGENT_TRAJECTORIES === 'true';

      const tickResult = await autonomousCoordinator.executeAutonomousTick(
        eligibleAgent.agentId,
        runtime,
        recordTrajectories
      );

      // Validation: Verify tick executed successfully
      if (!tickResult.success) {
        logger.warn(
          `Agent ${eligibleAgent.name} tick completed but was not successful`,
          {
            agentId: eligibleAgent.agentId,
            agentType: eligibleAgent.type,
            method: tickResult.method,
            duration: tickResult.duration,
          },
          'AgentTick'
        );
      }

      const actions = {
        trades: tickResult.actionsExecuted.trades,
        posts: tickResult.actionsExecuted.posts,
        comments: tickResult.actionsExecuted.comments,
        dms: tickResult.actionsExecuted.messages,
        groupMessages: tickResult.actionsExecuted.groupMessages,
      };

      // Calculate total actions
      const agentActionCount = Object.values(actions).reduce(
        (sum, count) => sum + count,
        0
      );
      totalActionsExecuted += agentActionCount;

      // Validation: Warn if agent has features enabled but took no actions
      if (enabledFeatures.length > 0 && agentActionCount === 0) {
        logger.warn(
          `Agent ${eligibleAgent.name} has features enabled but took no actions`,
          {
            agentId: eligibleAgent.agentId,
            agentType: eligibleAgent.type,
            enabledFeatures,
            method: tickResult.method,
          },
          'AgentTick'
        );
      }

      const modelUsed = 'qwen/qwen3-32b';

      // Log tick for USER agents only (NPCs don't have agentService logs yet)
      if (
        eligibleAgent.type === AgentType.USER_CONTROLLED &&
        eligibleAgent.user
      ) {
        await agentService.createLog(eligibleAgent.user.id, {
          type: 'tick',
          level: 'info',
          message: `Tick completed: ${actions.trades} trades, ${actions.posts} posts, ${actions.comments} comments, ${actions.dms} DMs, ${actions.groupMessages} group messages`,
          metadata: {
            pointsCost,
            duration: Date.now() - agentStartTime,
            modelUsed,
            enabledFeatures,
            actions,
            success: tickResult.success,
            method: tickResult.method,
          },
        });

        // Update User status for USER agents
        await db.user.update({
          where: { id: eligibleAgent.user.id },
          data: {
            agentLastTickAt: new Date(),
            agentStatus: 'running',
          },
        });
      }

      results.push({
        agentId: eligibleAgent.agentId,
        agentType: eligibleAgent.type,
        name: eligibleAgent.name,
        status: tickResult.success ? 'success' : 'completed_without_actions',
        pointsDeducted: pointsCost,
        duration: Date.now() - agentStartTime,
        actions: agentActionCount,
        method: tickResult.method,
      });

      logger.info(
        `Agent ${eligibleAgent.name} (${eligibleAgent.type}) tick completed in ${Date.now() - agentStartTime}ms`,
        {
          agentId: eligibleAgent.agentId,
          agentType: eligibleAgent.type,
          actions: agentActionCount,
          method: tickResult.method,
          success: tickResult.success,
        },
        'AgentTick'
      );
    } catch (error) {
      errors++;
      logger.error(
        `Failed to process agent ${eligibleAgent.name} (${eligibleAgent.type})`,
        error,
        'AgentTick'
      );

      results.push({
        agentId: eligibleAgent.agentId,
        agentType: eligibleAgent.type,
        name: eligibleAgent.name,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - agentStartTime,
      });
    } finally {
      // Always release the lock, even on error
      await releaseAgentLock(eligibleAgent.agentId, processId);
    }
  }

  const duration = Date.now() - startTime;

  // Validation: Log summary metrics
  logger.info(
    `Agent tick completed in ${duration}ms`,
    {
      agentsEligible: eligibleAgents.length,
      agentsProcessed: results.length - skippedDueToLock,
      agentsSkippedLocked: skippedDueToLock,
      totalActions: totalActionsExecuted,
      errors,
      averageActionsPerAgent:
        results.length > 0
          ? (
              totalActionsExecuted / (results.length - skippedDueToLock || 1)
            ).toFixed(2)
          : 0,
    },
    'AgentTick'
  );

  // Validation: Warn if no actions were executed
  if (totalActionsExecuted === 0 && results.length > 0) {
    // Count agents with autonomous features enabled
    const agentsWithFeatures = eligibleAgents.filter((a) => {
      if (a.type === AgentType.NPC) return true; // NPCs always have features enabled
      if (a.type === AgentType.USER_CONTROLLED && a.user) {
        return (
          a.user.autonomousTrading ||
          a.user.autonomousPosting ||
          a.user.autonomousCommenting ||
          a.user.autonomousDMs ||
          a.user.autonomousGroupChats
        );
      }
      return false;
    }).length;

    logger.warn(
      'Agent tick completed but no actions were executed',
      {
        agentsProcessed: results.length,
        agentsWithFeatures,
        userAgents: eligibleAgents.filter(
          (a) => a.type === AgentType.USER_CONTROLLED
        ).length,
        npcAgents: eligibleAgents.filter((a) => a.type === AgentType.NPC)
          .length,
      },
      'AgentTick'
    );
  }

  return NextResponse.json({
    success: true,
    eligible: eligibleAgents.length,
    processed: results.length - skippedDueToLock,
    skippedLocked: skippedDueToLock,
    duration,
    totalActions: totalActionsExecuted,
    errors,
    results,
  });
}
