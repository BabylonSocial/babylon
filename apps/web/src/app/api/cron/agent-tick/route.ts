/**
 * Autonomous Agent Tick Cron Job API
 *
 * @route POST /api/cron/agent-tick - Execute agent tick
 * @access Cron (CRON_SECRET required)
 *
 * @description
 * Scheduled cron job that runs all autonomous agents, executing their configured
 * autonomous actions (trading, posting, commenting, DMs, group chats). Processes
 * agents in sequence with optional point deduction (configured via TICK_POINTS_COST).
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

import {
  AgentStatus,
  AgentType,
  acquireAgentLock,
  agentRegistry,
  agentRuntimeManager,
  agentService,
  autonomousCoordinator,
  getAutonomousFeatures,
  hasAnyAutonomousFeature,
  releaseAgentLock,
} from '@babylon/agents';
import {
  DistributedLockService,
  recordCronExecution,
  relayCronToStaging,
  verifyCronAuth,
} from '@babylon/api';
import type { User, UserAgentConfig } from '@babylon/db';
import { db, eq, inArray, userAgentConfigs, users } from '@babylon/db';
import { GROQ_MODELS, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ensureEngineServices } from '@/lib/engine/ensure-engine-services';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max - reduced from 800s to prevent long lock holds
export const dynamic = 'force-dynamic';

/**
 * Time budget for entire tick (ms). Stop processing new agents after this.
 * Set to 180s to leave headroom before function timeout (300s).
 */
const TICK_TIME_BUDGET_MS = 180_000; // 3 minutes

/**
 * Per-agent processing timeout (ms). Abort agent if exceeds this.
 * Prevents single slow agent from blocking entire tick.
 */
const PER_AGENT_TIMEOUT_MS = 90_000; // 90 seconds

/**
 * Custom error for agent timeouts. Using a typed error class instead of
 * string matching for more robust timeout detection in catch blocks.
 */
class AgentTimeoutError extends Error {
  constructor(
    public readonly agentId: string,
    timeoutMs: number
  ) {
    super(`Agent timeout after ${timeoutMs / 1000}s`);
    this.name = 'AgentTimeoutError';
  }
}

/**
 * Points cost per autonomous tick.
 * Set to 0 for free ticks, or a positive number to charge agents.
 * Used for both eligibility checks and deductions.
 */
const TICK_POINTS_COST = 0;

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
 * sequentially with distributed locking. Point deduction is configurable via TICK_POINTS_COST.
 * Supports staging environment relay.
 *
 * @param _req - Next.js request (CRON_SECRET required in Authorization header)
 * @returns Execution result with agents processed, paused, errors, and timing metrics
 * @throws {401} Invalid or missing CRON_SECRET
 */
export async function POST(_req: NextRequest) {
  ensureEngineServices();

  // 0. Verify cron authorization using centralized auth
  if (!verifyCronAuth(_req, { jobName: 'AgentTick' })) {
    logger.warn(
      'Unauthorized agent-tick request attempt',
      undefined,
      'AgentTick'
    );
    return NextResponse.json(
      { error: 'Unauthorized cron request' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const processId = `agent-tick-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
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

  // 1.5 Acquire global lock to prevent overlapping cron invocations
  // Duration matches function timeout (300s) to prevent overlap when ticks take longer than cron interval
  const globalLockAcquired = await DistributedLockService.acquireLock({
    lockId: 'agent-tick-global',
    durationMs: 300 * 1000, // 300 seconds (5 minutes) - matches function timeout
    operation: 'agent-tick-global',
    processId,
  });
  if (!globalLockAcquired) {
    logger.info(
      'Agent tick skipped - previous tick still running',
      { processId },
      'AgentTick'
    );
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Previous tick still running',
      processed: 0,
      skippedLocked: 0,
    });
  }

  // Wrap remaining logic in try-finally to ensure global lock release
  try {
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

    // Query via AgentRegistry for USER_CONTROLLED agents only
    // NPCs are now handled by the separate /api/cron/npc-tick endpoint
    const registeredAgents = await agentRegistry.discoverAgents({
      types: [AgentType.USER_CONTROLLED],
      statuses: [
        AgentStatus.ACTIVE,
        AgentStatus.INITIALIZED,
        AgentStatus.REGISTERED,
      ],
      limit: 500,
    });

    // Filter USER_CONTROLLED agents with autonomous features enabled (and sufficient balance if TICK_POINTS_COST > 0)
    // NPCs are handled by /api/cron/npc-tick
    const eligibleAgents: Array<{
      agentId: string;
      type: AgentType;
      name: string;
      user: User;
      config: UserAgentConfig | null;
    }> = [];

    // Collect all userIds from USER_CONTROLLED agents for batch fetching
    const userControlledAgents = registeredAgents.filter(
      (agent) => agent.type === AgentType.USER_CONTROLLED && agent.userId
    );
    const userIds = userControlledAgents.map((agent) => agent.userId!);

    // Batch fetch all users and configs in 2 queries (instead of 2N queries)
    let usersMap = new Map<string, User>();
    let configsMap = new Map<string, UserAgentConfig>();

    if (userIds.length > 0) {
      const [allUsers, allConfigs] = await Promise.all([
        db.select().from(users).where(inArray(users.id, userIds)),
        db
          .select()
          .from(userAgentConfigs)
          .where(inArray(userAgentConfigs.userId, userIds)),
      ]);

      usersMap = new Map(allUsers.map((u) => [u.id, u]));
      configsMap = new Map(allConfigs.map((c) => [c.userId, c]));
    }

    for (const agent of userControlledAgents) {
      const user = usersMap.get(agent.userId!);
      const config = configsMap.get(agent.userId!) ?? null;

      // Guard: USER_CONTROLLED agents must have a user record
      if (!user) {
        logger.warn(
          'USER_CONTROLLED agent missing user record - skipping',
          { agentId: agent.agentId, userId: agent.userId },
          'AgentTick'
        );
        continue;
      }

      // Check balance only if tick costs points
      const hasEnoughBalance =
        TICK_POINTS_COST <= 0 ||
        Number(user.virtualBalance ?? 0) >= TICK_POINTS_COST;

      if (user.isAgent && hasEnoughBalance && hasAnyAutonomousFeature(config)) {
        eligibleAgents.push({
          agentId: agent.agentId,
          type: agent.type,
          name: agent.name,
          user,
          config,
        });
      }
    }
    // NPCs are no longer processed here - they use /api/cron/npc-tick

    // Validation: Check if agents were found
    if (eligibleAgents.length === 0) {
      logger.info(
        'No eligible user agents found to run',
        {
          totalRegistered: registeredAgents.length,
          criteria: `USER agents with autonomous features enabled${TICK_POINTS_COST > 0 ? ` + balance >= ${TICK_POINTS_COST}` : ''}`,
        },
        'AgentTick'
      );

      return NextResponse.json({
        success: true,
        processed: 0,
        duration: Date.now() - startTime,
        results: [],
        skippedLocked: 0,
        message: 'No user agents found with autonomous features enabled',
      });
    }

    logger.info(
      `Found ${eligibleAgents.length} eligible user agents (${registeredAgents.length} total registered)`,
      { userAgents: eligibleAgents.length },
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
      method?: 'database' | 'a2a' | 'planning_coordinator' | 'multi_step';
    }> = [];
    let totalActionsExecuted = 0;
    let errors = 0;
    let skippedDueToLock = 0;
    let skippedDueToTimeBudget = 0;

    for (const eligibleAgent of eligibleAgents) {
      // Check tick-level time budget before processing each agent
      const tickElapsed = Date.now() - startTime;
      if (tickElapsed >= TICK_TIME_BUDGET_MS) {
        const remainingAgents = eligibleAgents.length - results.length;
        logger.warn(
          `Tick time budget exceeded (${Math.round(tickElapsed / 1000)}s) - skipping ${remainingAgents} remaining agents`,
          { processId, processed: results.length, remaining: remainingAgents },
          'AgentTick'
        );
        skippedDueToTimeBudget = remainingAgents;
        break;
      }

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

      // Only deduct points if cost is greater than 0
      if (TICK_POINTS_COST > 0) {
        // CRITICAL: Deduct points immediately after lock acquisition, BEFORE tick execution.
        // This ensures points are always charged once we commit to running the tick.
        // If we deducted after tick execution, errors in executeAutonomousTick() would
        // skip the deduction (catch block), allowing agents to get free actions on errors.
        await agentService.deductPoints(
          eligibleAgent.user.id,
          TICK_POINTS_COST,
          'Autonomous tick'
        );
      }

      // Process agent with error handling to ensure lock is always released
      try {
        // Use agent runtime manager for both USER and NPC agents
        const runtime = await agentRuntimeManager.getRuntime(
          eligibleAgent.agentId
        );

        // Determine enabled features from agent config
        const features = getAutonomousFeatures(eligibleAgent.config);
        const enabledFeatures: string[] = [];
        if (features.trading) enabledFeatures.push('trading');
        if (features.posting) enabledFeatures.push('posting');
        if (features.commenting) enabledFeatures.push('commenting');
        if (features.dms) enabledFeatures.push('DMs');
        if (features.groupChats) enabledFeatures.push('group chats');

        logger.info(
          `Processing agent ${eligibleAgent.name}`,
          { agentId: eligibleAgent.agentId, features: enabledFeatures },
          'AgentTick'
        );

        // Always record trajectories for RL training data collection
        // For USER_CONTROLLED agents, pass user.id (userId for User table lookup)
        // Wrap with per-agent timeout to prevent single agent from blocking tick
        //
        // Note on timeout behavior: When timeout fires, the underlying executeAutonomousTick
        // continues running in the background. This is intentional - we don't want to add
        // AbortSignal complexity throughout the coordinator. The per-agent lock (acquireAgentLock)
        // prevents duplicate execution: if this agent is still running when the next tick starts,
        // it will be skipped via the lock check. The timeout just prevents blocking OTHER agents.
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const tickResult = await Promise.race([
          autonomousCoordinator.executeAutonomousTick(
            eligibleAgent.user.id,
            runtime,
            true, // Always record trajectories
            false // isNpc = false for user agents
          ),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              logger.warn(
                `Agent ${eligibleAgent.name} timed out after ${PER_AGENT_TIMEOUT_MS / 1000}s - execution continues in background`,
                { agentId: eligibleAgent.agentId },
                'AgentTick'
              );
              reject(
                new AgentTimeoutError(
                  eligibleAgent.agentId,
                  PER_AGENT_TIMEOUT_MS
                )
              );
            }, PER_AGENT_TIMEOUT_MS);
          }),
        ]).finally(() => {
          // Clear timeout to prevent timer leak when main promise resolves first
          if (timeoutId) clearTimeout(timeoutId);
        });

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

        // Log tick for user agent
        await agentService.createLog(eligibleAgent.user.id, {
          type: 'tick',
          level: 'info',
          message: `Tick completed: ${actions.trades} trades, ${actions.posts} posts, ${actions.comments} comments, ${actions.dms} DMs, ${actions.groupMessages} group messages`,
          metadata: {
            pointsCost: TICK_POINTS_COST,
            duration: Date.now() - agentStartTime,
            modelSmall: GROQ_MODELS.FREE.modelId,
            modelLarge: GROQ_MODELS.PRO.modelId,
            enabledFeatures,
            actions,
            success: tickResult.success,
            method: tickResult.method,
          },
        });

        // Update agent config status
        await db
          .update(userAgentConfigs)
          .set({
            lastTickAt: new Date(),
            status: 'running',
            updatedAt: new Date(),
          })
          .where(eq(userAgentConfigs.userId, eligibleAgent.user.id));

        results.push({
          agentId: eligibleAgent.agentId,
          agentType: eligibleAgent.type,
          name: eligibleAgent.name,
          status: tickResult.success ? 'success' : 'completed_without_actions',
          pointsDeducted: TICK_POINTS_COST,
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
        const isTimeout = error instanceof AgentTimeoutError;
        errors++;
        logger.error(
          `Error processing agent ${eligibleAgent.name}`,
          {
            agentId: eligibleAgent.agentId,
            agentType: eligibleAgent.type,
            error: error instanceof Error ? error.message : String(error),
            isTimeout,
          },
          'AgentTick'
        );

        results.push({
          agentId: eligibleAgent.agentId,
          agentType: eligibleAgent.type,
          name: eligibleAgent.name,
          status: isTimeout ? 'timeout' : 'error',
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
        agentsSkippedTimeBudget: skippedDueToTimeBudget,
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
      // All eligible agents have at least one autonomous feature (pre-filtered during eligibility check)
      const agentsWithFeatures = eligibleAgents.length;

      logger.warn(
        'Agent tick completed but no actions were executed',
        {
          agentsProcessed: results.length,
          agentsWithFeatures,
        },
        'AgentTick'
      );
    }

    // Record metrics
    recordCronExecution('agent-tick', new Date(startTime), {
      success: true,
      processed: results.length - skippedDueToLock,
      totalActions: totalActionsExecuted,
      errorCount: errors,
    });

    return NextResponse.json({
      success: true,
      eligible: eligibleAgents.length,
      processed: results.length - skippedDueToLock,
      skippedLocked: skippedDueToLock,
      skippedTimeBudget: skippedDueToTimeBudget,
      duration,
      totalActions: totalActionsExecuted,
      errors,
      results,
    });
  } finally {
    // Always release global lock
    await DistributedLockService.releaseLock('agent-tick-global', processId);
  }
}
