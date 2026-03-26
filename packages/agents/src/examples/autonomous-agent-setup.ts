/**
 * Autonomous Agent Setup Example
 *
 * Complete example showing how to set up an autonomous agent
 * with the new batch processing and dashboard system.
 */

import { eq } from '@babylon/db';
import { db, users } from '@babylon/db/runtime';
import type { Character } from '@elizaos/core';
import { AgentRuntime, ModelType } from '@elizaos/core';
import { autonomousCoordinator } from '../autonomous';
import { babylonPlugin } from '../plugins/babylon';
import { groqPlugin } from '../plugins/groq';
import { getAgentConfig } from '../shared/agent-config';
import { logger } from '../shared/logger';

/**
 * Example 1: Basic Autonomous Agent Setup
 */
export async function setupBasicAutonomousAgent(agentUserId: string): Promise<{
  agent: {
    id: string;
    displayName: string | null;
    isAgent: boolean;
    systemPrompt: string | null;
  };
  runtime: AgentRuntime;
}> {
  // 1. Load agent from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, agentUserId))
    .limit(1);

  if (!user) {
    throw new Error('Agent not found');
  }

  // Get agent config from separate table
  const config = await getAgentConfig(agentUserId);

  // Check if at least one autonomous feature is enabled
  const hasAutonomousFeatures =
    config?.autonomousTrading ||
    config?.autonomousPosting ||
    config?.autonomousCommenting ||
    config?.autonomousDMs ||
    config?.autonomousGroupChats;

  if (!hasAutonomousFeatures) {
    throw new Error('Agent does not have any autonomous features enabled');
  }

  // 2. Create Eliza character from agent config
  const character: Character = {
    name: user.displayName || user.username || 'Agent',
    username: user.username || 'agent',
    system: config?.systemPrompt || 'You are a helpful AI agent on Babylon.',
    bio: user.bio ? JSON.parse(user.bio) : [],

    settings: {
      // Always use TEXT_LARGE (qwen 32b) - free chat, 1pt per tick
      model: ModelType.TEXT_LARGE,
      temperature: 0.7,
      maxTokens: 1000,
    },

    plugins: [], // Will be added to runtime instead
  };

  // Build the agent object to return
  const agent = {
    id: user.id,
    displayName: user.displayName,
    isAgent: user.isAgent,
    systemPrompt: config?.systemPrompt ?? null,
  };

  // 3. Initialize runtime with plugins
  logger.info(
    `Initializing runtime for agent ${user.displayName}`,
    undefined,
    'AgentSetup'
  );
  logger.info(
    `GROQ_API_KEY available: ${!!process.env.GROQ_API_KEY}`,
    undefined,
    'AgentSetup'
  );

  const runtime = new AgentRuntime({
    agentId: user.id as `${string}-${string}-${string}-${string}-${string}`,
    character,
    databaseAdapter: undefined, // Using our own database setup
  } as ConstructorParameters<typeof AgentRuntime>[0]);

  // CRITICAL: Set logger on runtime (use console.bind pattern from otc-agent working implementation)
  // Provide all required properties for the Logger type
  if (!runtime.logger || !runtime.logger.log) {
    runtime.logger = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
      trace: console.trace
        ? console.trace.bind(console)
        : (..._args: unknown[]) => {},
      fatal: console.error.bind(console),
      success: console.info.bind(console),
      progress: console.info.bind(console),
      clear: () => (console.clear ? console.clear() : undefined),
      child: (_bindings: Record<string, unknown>) => runtime.logger,
      level: 'info', // default level, adjust if necessary
    };
  }

  // Register plugins manually
  logger.info(`Registering groqPlugin...`, undefined, 'AgentSetup');
  await runtime.registerPlugin(groqPlugin);

  logger.info(`Registering babylonPlugin...`, undefined, 'AgentSetup');
  await runtime.registerPlugin(babylonPlugin);

  // Not calling runtime.initialize() since we don't use SQL plugin
  // Database setup is handled separately

  logger.info(`Runtime fully initialized and ready`, undefined, 'AgentSetup');

  return { agent, runtime };
}

/**
 * Example 2: Start Autonomous Tick Loop
 */
export async function startAutonomousTickLoop(
  agentUserId: string,
  tickIntervalMinutes: number = 5
) {
  const { agent, runtime } = await setupBasicAutonomousAgent(agentUserId);

  const tickIntervalMs = tickIntervalMinutes * 60 * 1000;

  logger.info(
    `Starting autonomous tick loop for ${agent.displayName} (every ${tickIntervalMinutes} minutes)`,
    undefined,
    'AgentSetup'
  );

  // Execute first tick immediately
  await executeTickWithLogging(agentUserId, runtime);

  // Set up recurring ticks
  const tickInterval = setInterval(async () => {
    await executeTickWithLogging(agentUserId, runtime);
  }, tickIntervalMs);

  // Return cleanup function
  return {
    stop: () => {
      clearInterval(tickInterval);
      logger.info(
        `Stopped autonomous tick loop for ${agent.displayName}`,
        undefined,
        'AgentSetup'
      );
    },
    agent,
    runtime,
  };
}

/**
 * Helper: Execute tick with comprehensive logging
 */
async function executeTickWithLogging(
  agentUserId: string,
  runtime: AgentRuntime
) {
  logger.info(`Starting tick for agent ${agentUserId}`, undefined, 'AgentTick');

  const result = await autonomousCoordinator.executeAutonomousTick(
    agentUserId,
    runtime
  );

  logger.info(
    `Tick completed for agent ${agentUserId}`,
    {
      success: result.success,
      trades: result.actionsExecuted.trades,
      posts: result.actionsExecuted.posts,
      comments: result.actionsExecuted.comments,
      messages: result.actionsExecuted.messages,
      engagements: result.actionsExecuted.engagements,
    },
    'AgentTick'
  );

  // Alert on anomalies
  if (result.duration > 30000) {
    logger.warn(
      `Slow tick detected: ${result.duration}ms`,
      { agentUserId },
      'AgentTick'
    );
  }

  return result;
}

/**
 * Example 3: Advanced Setup with Custom Config
 */
export async function setupAdvancedAutonomousAgent(
  agentUserId: string,
  config: {
    tickInterval?: number;
    enableTrading?: boolean;
    enablePosting?: boolean;
    enableCommenting?: boolean;
    maxActionsPerTick?: number;
  }
) {
  const { agent, runtime } = await setupBasicAutonomousAgent(agentUserId);

  async function customTick() {
    logger.info(
      `Dashboard loaded for ${agent.displayName}`,
      undefined,
      'AgentTick'
    );

    // Execute coordinated tick
    const result = await autonomousCoordinator.executeAutonomousTick(
      agentUserId,
      runtime
    );

    // Check limits
    const totalActions = Object.values(result.actionsExecuted).reduce(
      (sum, count) => sum + count,
      0
    );

    if (config.maxActionsPerTick && totalActions > config.maxActionsPerTick) {
      logger.warn(
        `Agent exceeded max actions per tick: ${totalActions} > ${config.maxActionsPerTick}`,
        { agentUserId },
        'AgentTick'
      );
    }

    return result;
  }

  // Start with custom config
  const tickInterval = setInterval(
    customTick,
    (config.tickInterval || 5) * 60 * 1000
  );

  return {
    stop: () => clearInterval(tickInterval),
    agent,
    runtime,
    executeCustomTick: customTick,
  };
}

/**
 * Example 4: Multi-Agent Coordinator
 */
export async function startMultiAgentSystem(agentUserIds: string[]) {
  const agents: Array<{
    stop: () => void;
    agent: {
      id: string;
      displayName: string | null;
      isAgent: boolean;
      systemPrompt: string | null;
    };
    runtime: AgentRuntime;
  }> = [];

  for (const agentUserId of agentUserIds) {
    const setup = await startAutonomousTickLoop(agentUserId, 5);
    agents.push(setup);

    logger.info(
      `Started agent ${setup.agent.displayName}`,
      undefined,
      'MultiAgentSystem'
    );
  }

  logger.info(
    `Multi-agent system started with ${agents.length} agents`,
    undefined,
    'MultiAgentSystem'
  );

  // Return control interface
  return {
    agents,
    stopAll: () => {
      agents.forEach((agent) => agent.stop());
      logger.info('All agents stopped', undefined, 'MultiAgentSystem');
    },
    getAgents: () => {
      return agents.map(({ agent }) => ({
        agentId: agent.id,
        displayName: agent.displayName,
      }));
    },
  };
}

/**
 * Example 5: Test Single Tick (for debugging)
 */
export async function testSingleTick(agentUserId: string) {
  logger.info('=== Testing Single Autonomous Tick ===', undefined, 'AgentTest');

  const { agent, runtime } = await setupBasicAutonomousAgent(agentUserId);

  logger.info(
    `Testing agent: ${agent.displayName} (${agent.id})`,
    undefined,
    'AgentTest'
  );

  // Execute one tick
  const result = await autonomousCoordinator.executeAutonomousTick(
    agentUserId,
    runtime
  );

  // Calculate total actions
  const totalActions = Object.values(result.actionsExecuted).reduce(
    (sum, count) => sum + count,
    0
  );

  logger.info('=== Tick Test Complete ===', undefined, 'AgentTest');
  logger.info(`Success: ${result.success}`, undefined, 'AgentTest');
  logger.info(`Method: ${result.method}`, undefined, 'AgentTest');
  logger.info(`Duration: ${result.duration}ms`, undefined, 'AgentTest');
  logger.info(`Total Actions: ${totalActions}`, undefined, 'AgentTest');
  logger.info(`Breakdown:`, result.actionsExecuted, 'AgentTest');

  return {
    agent,
    result,
    totalActions,
  };
}

/**
 * Example Usage in Application:
 *
 * ```typescript
 * import { startAutonomousTickLoop } from '@babylon/agents/examples'
 *
 * // Start an autonomous agent
 * const { stop } = await startAutonomousTickLoop('agent-user-id', 5)
 *
 * // Stop it later
 * stop()
 * ```
 *
 * Or for multiple agents:
 *
 * ```typescript
 * import { startMultiAgentSystem } from '@babylon/agents/examples'
 *
 * const system = await startMultiAgentSystem([
 *   'agent-1-id',
 *   'agent-2-id',
 *   'agent-3-id'
 * ])
 *
 * // Check stats
 * const stats = await system.getStats()
 * console.log(stats)
 *
 * // Stop all agents
 * system.stopAll()
 * ```
 */
