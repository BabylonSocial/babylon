/**
 * Multi-Agent Runtime Manager
 *
 * Runtime factory for all agent types (USER_CONTROLLED, NPC, EXTERNAL).
 * Manages multiple concurrent Eliza agent runtimes in a serverless environment.
 * Each agent gets its own isolated runtime instance with its own character configuration.
 *
 * @remarks
 * Integrates with AgentRegistry for lifecycle management and agent discovery.
 * Supports runtime caching for warm container reuse in serverless environments.
 *
 * @packageDocumentation
 */

import { db, eq, users } from '@babylon/db';
import {
  type ActorData,
  loadActorById,
  StaticDataRegistry,
} from '@babylon/engine';
import {
  AgentRuntime,
  type Character,
  type Plugin,
  type UUID,
} from '@elizaos/core';
import { anthropicPlugin } from '@elizaos/plugin-anthropic';
import { openaiPlugin } from '@elizaos/plugin-openai';
import { babylonPlugin } from '../plugins/babylon';
import { enhanceRuntimeWithBabylon } from '../plugins/babylon/integration';
import { groqPlugin } from '../plugins/groq';
import { agentCorePlugin } from '../plugins/plugin-agent-core/src';
// import { experiencePlugin } from '../plugins/plugin-experience/src';
import { trajectoryLoggerPlugin } from '../plugins/plugin-trajectory-logger/src';
import {
  wrapPluginActions,
  wrapPluginProviders,
} from '../plugins/plugin-trajectory-logger/src/action-interceptor';
import { TrajectoryLoggerService } from '../plugins/plugin-trajectory-logger/src/TrajectoryLoggerService';
import { agentRegistry } from '../services/agent-registry.service';
import { getAgentConfig } from '../shared/agent-config';
import { logger } from '../shared/logger';
import { generateSnowflakeId } from '../shared/snowflake';
import { type AgentRegistration, AgentType } from '../types/agent-registry';
import type { JsonValue } from '../types/common';

/**
 * Extended AgentRuntime with Babylon-specific properties
 * @internal
 */
interface ExtendedAgentRuntime extends AgentRuntime {
  currentModelVersion?: string;
  currentModel?: string;
  trajectoryLogger?: TrajectoryLoggerService;
}

/** Global runtime cache for warm container reuse */
const globalRuntimes = new Map<string, AgentRuntime>();

/** Global trajectory logger instances per agent */
const trajectoryLoggers = new Map<string, TrajectoryLoggerService>();

export class AgentRuntimeManager {
  private static instance: AgentRuntimeManager;

  private constructor() {
    logger.info(
      'AgentRuntimeManager initialized',
      undefined,
      'AgentRuntimeManager'
    );
  }

  public static getInstance(): AgentRuntimeManager {
    if (!AgentRuntimeManager.instance) {
      AgentRuntimeManager.instance = new AgentRuntimeManager();
    }
    return AgentRuntimeManager.instance;
  }

  /**
   * Gets or creates a runtime for any agent type
   *
   * Routes to type-specific factory based on registry entry, or falls back
   * to fallback USER_CONTROLLED if no registry entry exists.
   *
   * @param agentUserId - Agent user ID
   * @returns Agent runtime instance
   */
  public async getRuntime(agentUserId: string): Promise<AgentRuntime> {
    if (globalRuntimes.has(agentUserId)) {
      const runtime = globalRuntimes.get(agentUserId)!;
      logger.info(
        `Using cached runtime for agent ${agentUserId}`,
        undefined,
        'AgentRuntimeManager'
      );
      return runtime;
    }

    const registration = await agentRegistry.getAgentById(agentUserId);

    if (registration) {
      let runtime: AgentRuntime;
      switch (registration.type) {
        case AgentType.USER_CONTROLLED:
          runtime = await this.createUserAgentRuntime(registration);
          break;
        case AgentType.NPC:
          runtime = await this.createNpcRuntime(registration);
          break;
        case AgentType.EXTERNAL:
          runtime = await this.createExternalRuntime(registration);
          break;
        default:
          throw new Error(`Unknown agent type: ${registration.type}`);
      }

      // Update registry status to INITIALIZED
      // Generate unique runtime instance ID to track each runtime independently
      const runtimeInstanceId = await generateSnowflakeId();
      await agentRegistry.setRuntimeInstance(agentUserId, runtimeInstanceId);

      // Cache runtime
      globalRuntimes.set(agentUserId, runtime);

      logger.info(
        `Runtime created for ${registration.type} agent ${agentUserId}`,
        undefined,
        'AgentRuntimeManager'
      );

      return runtime;
    }

    // Fallback: Legacy behavior for USER_CONTROLLED agents not yet in registry
    // This maintains backward compatibility with existing code
    const [agentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agentUser) {
      throw new Error(`Agent user ${agentUserId} not found`);
    }

    if (!agentUser.isAgent) {
      throw new Error(`User ${agentUserId} is not an agent`);
    }

    // Get agent config from separate table
    const agentConfig = await getAgentConfig(agentUserId);

    const parseBio = (): string[] => {
      if (!agentConfig?.messageExamples) {
        return [agentUser.bio || ''];
      }

      const parsed =
        typeof agentConfig.messageExamples === 'string'
          ? JSON.parse(agentConfig.messageExamples)
          : agentConfig.messageExamples;
      if (Array.isArray(parsed)) {
        return parsed;
      }
      logger.warn(
        'messageExamples is not an array, using bio',
        {
          agentId: agentUser.id,
          type: typeof parsed,
        },
        'AgentRuntimeManager'
      );
      return [agentUser.bio || ''];
    };

    const parseStyle = (): Record<string, JsonValue> | undefined => {
      if (!agentConfig?.style) {
        return undefined;
      }

      const style =
        typeof agentConfig.style === 'string'
          ? JSON.parse(agentConfig.style)
          : agentConfig.style;
      return style as Record<string, JsonValue>;
    };

    logger.info(
      'Agent using Groq model',
      {
        agentId: agentUserId,
        model: 'groq-qwen-32b',
      },
      'AgentRuntimeManager'
    );

    // Build character from agent user config
    // Always use qwen 32b (TEXT_LARGE) - free chat, 1pt per tick
    const character: Character = {
      name: agentUser.displayName || agentUser.username || 'Agent',
      system: agentConfig?.systemPrompt || 'You are a helpful AI agent',
      bio: parseBio(),
      messageExamples: [],
      style: parseStyle(),
      plugins: [],
      settings: {
        // GROQ configuration (always available)
        GROQ_API_KEY: process.env.GROQ_API_KEY || '',
        GROQ_LARGE_MODEL:
          process.env.GROQ_LARGE_MODEL || 'llama-3.3-70b-versatile',
        GROQ_SMALL_MODEL:
          process.env.GROQ_SMALL_MODEL || 'llama-3.1-8b-instant',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      },
    };

    // Database configuration
    const dbPort = process.env.POSTGRES_DEV_PORT || 5432;
    const postgresUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      `postgres://postgres:password@localhost:${dbPort}/babylon`;

    logger.info(
      `Creating runtime for agent user ${agentUserId}`,
      undefined,
      'AgentRuntimeManager'
    );

    // Create trajectory logger service for this agent
    const trajectoryLogger = new TrajectoryLoggerService();
    trajectoryLoggers.set(agentUserId, trajectoryLogger);

    // Create runtime with groq, experience, trajectory logger, and agent core plugins
    // Type cast plugins to ensure compatibility across different @elizaos/core versions
    const plugins: Plugin[] = [
      agentCorePlugin as Plugin,
      // experiencePlugin as Plugin,
      trajectoryLoggerPlugin as Plugin,
      // Conditionally add LLM plugins based on available API keys
      ...(process.env.GROQ_API_KEY ? [groqPlugin as Plugin] : []),
      ...(process.env.ANTHROPIC_API_KEY ? [anthropicPlugin as Plugin] : []),
      ...(process.env.OPENAI_API_KEY ? [openaiPlugin as Plugin] : []),
    ];

    const runtimeConfig = {
      character,
      agentId: agentUserId as UUID,
      plugins,
      settings: {
        ...character.settings,
        POSTGRES_URL: postgresUrl,
      },
    };

    const runtime = new AgentRuntime(runtimeConfig) as ExtendedAgentRuntime;

    runtime.currentModel = 'groq';

    // Override adapter methods to prevent undefined errors
    // Babylon doesn't use ElizaOS's memory system, so we stub these out
    runtime.adapter = {
      ...runtime.adapter,
      log: async (_params: {
        body: { [key: string]: JsonValue };
        entityId: string;
        roomId: string;
        type: string;
      }): Promise<void> => {
        // No-op - Babylon uses its own logging
      },
      createMemory: async (
        memory: unknown,
        _tableName?: string
      ): Promise<UUID> => {
        // No-op - Babylon uses its own DB for message storage
        // Return the memory ID or generate one
        const memoryObj = memory as { id?: string } | null;
        return (memoryObj?.id || crypto.randomUUID()) as UUID;
      },
      getMemories: async (_params: unknown): Promise<unknown[]> => {
        // Return empty array - Babylon uses its own DB
        return [];
      },
    } as typeof runtime.adapter;

    // Configure logger
    if (!runtime.logger || !runtime.logger.log) {
      const customLogger = {
        log: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentUser.displayName}]`),
        info: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentUser.displayName}]`),
        warn: (msg: string) =>
          logger.warn(msg, undefined, `Agent[${agentUser.displayName}]`),
        error: (msg: string) =>
          logger.error(msg, new Error(msg), `Agent[${agentUser.displayName}]`),
        debug: (msg: string) =>
          logger.debug(msg, undefined, `Agent[${agentUser.displayName}]`),
        success: (msg: string) =>
          logger.info(`✓ ${msg}`, undefined, `Agent[${agentUser.displayName}]`),
        notice: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentUser.displayName}]`),
        level: 'info' as const,
        trace: (msg: string) =>
          logger.debug(msg, undefined, `Agent[${agentUser.displayName}]`),
        fatal: (msg: string) =>
          logger.error(msg, new Error(msg), `Agent[${agentUser.displayName}]`),
        progress: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentUser.displayName}]`),
        clear: () => (console.clear ? console.clear() : undefined),
        child: () => customLogger,
      };
      // customLogger matches the structure of runtime.logger
      runtime.logger = customLogger as typeof runtime.logger;
    }

    // Initialize runtime to signal services that runtime is ready
    // This prevents 30s timeout errors in services waiting for runtime initialization
    await runtime.initialize();

    // Wrap Babylon plugin BEFORE registering (so wrapped version is used)
    // This ensures all actions and provider accesses are logged when executed
    let wrappedBabylonPlugin = babylonPlugin;
    if (babylonPlugin.actions) {
      wrappedBabylonPlugin = wrapPluginActions(
        wrappedBabylonPlugin,
        trajectoryLogger
      );
    }
    if (babylonPlugin.providers) {
      wrappedBabylonPlugin = wrapPluginProviders(
        wrappedBabylonPlugin,
        trajectoryLogger
      );
    }

    // Enhance with wrapped Babylon plugin (so wrapped version is registered)
    await enhanceRuntimeWithBabylon(runtime, agentUserId, wrappedBabylonPlugin);

    // Store trajectory logger reference on runtime for easy access
    // This allows actions/providers to access the logger
    runtime.trajectoryLogger = trajectoryLogger;

    // Cache runtime
    globalRuntimes.set(agentUserId, runtime);

    logger.info(
      `Runtime created for agent user ${agentUserId}`,
      undefined,
      'AgentRuntimeManager'
    );

    // Register plugins
    const pluginRegistrationPromises: Promise<void>[] = [];
    const pluginsToLoad = plugins;

    for (const plugin of pluginsToLoad) {
      if (plugin) {
        pluginRegistrationPromises.push(runtime.registerPlugin(plugin));
      }
    }
    await Promise.all(pluginRegistrationPromises);

    return runtime;
  }

  /**
   * Create runtime for USER_CONTROLLED agent
   * Uses registry data or falls back to User model
   */
  private async createUserAgentRuntime(
    registration: AgentRegistration
  ): Promise<AgentRuntime> {
    if (!registration.userId) {
      throw new Error(
        `USER_CONTROLLED agent ${registration.agentId} missing userId`
      );
    }

    // Fetch full user data
    const [agentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, registration.userId))
      .limit(1);

    if (!agentUser) {
      throw new Error(`User ${registration.userId} not found`);
    }

    // Get agent config from separate table
    const userAgentConfig = await getAgentConfig(registration.userId);

    // Parse bio from messageExamples or bio field
    const parseBio = (): string[] => {
      if (!userAgentConfig?.messageExamples) {
        return [agentUser.bio || ''];
      }

      const parsed =
        typeof userAgentConfig.messageExamples === 'string'
          ? JSON.parse(userAgentConfig.messageExamples)
          : userAgentConfig.messageExamples;
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [agentUser.bio || ''];
    };

    // Parse style
    const parseStyle = (): Record<string, JsonValue> | undefined => {
      if (!userAgentConfig?.style) {
        return undefined;
      }

      const style =
        typeof userAgentConfig.style === 'string'
          ? JSON.parse(userAgentConfig.style)
          : userAgentConfig.style;
      return style as Record<string, JsonValue>;
    };

    // Build Character configuration
    const character: Character = {
      name: registration.name,
      system: registration.systemPrompt,
      bio: parseBio(),
      messageExamples: [],
      style: parseStyle(),
      plugins: [],
      settings: this.getModelSettings(),
    };

    // Create runtime with standard plugins
    // Pass userId for Babylon integration (User table lookup)
    return this.createRuntimeWithPlugins(
      registration.agentId,
      character,
      registration.userId
    );
  }

  /**
   * Create runtime for NPC agent
   * Loads ActorData and creates Character from NPC configuration
   */
  private async createNpcRuntime(
    registration: AgentRegistration
  ): Promise<AgentRuntime> {
    // Verify actor exists in static registry
    const actor = StaticDataRegistry.getActor(registration.agentId);

    if (!actor) {
      throw new Error(
        `Actor ${registration.agentId} not found in static registry`
      );
    }

    // Load full ActorData from JSON files
    const actorData: ActorData | null = loadActorById(actor.id);
    if (!actorData) {
      throw new Error(`ActorData ${actor.id} not found in data files`);
    }

    // Build Character configuration from ActorData
    // Use ActorData fields for rich NPC personality
    const bio: string[] = [];
    if (actorData.description) {
      bio.push(actorData.description);
    }
    if (actorData.pfpDescription) {
      bio.push(`Physical: ${actorData.pfpDescription}`);
    }
    if (actorData.role) {
      bio.push(`Role: ${actorData.role}`);
    }

    const character: Character = {
      name: registration.name,
      system: registration.systemPrompt,
      bio,
      messageExamples: [],
      plugins: [],
      settings: this.getModelSettings(),
    };

    // Create runtime with standard plugins
    return this.createRuntimeWithPlugins(registration.agentId, character);
  }

  /**
   * Create runtime for EXTERNAL agent
   * Minimal Character config for external agents using A2A/MCP protocols
   */
  private async createExternalRuntime(
    registration: AgentRegistration
  ): Promise<AgentRuntime> {
    // External agents may not have full Character config
    // Use minimal viable configuration
    const character: Character = {
      name: registration.name,
      system: registration.systemPrompt,
      bio: [registration.systemPrompt],
      messageExamples: [],
      plugins: [],
      settings: this.getModelSettings(),
    };

    // External agents may use different plugins
    // For now, use standard plugins (can be extended later)
    return this.createRuntimeWithPlugins(registration.agentId, character);
  }

  /**
   * Create AgentRuntime with standard plugin configuration
   * Shared logic for all agent types
   *
   * @param agentId - The agent's unique identifier (used for Eliza runtime)
   * @param character - Character configuration
   * @param userId - Optional User table ID for USER_CONTROLLED agents (used for Babylon integration)
   */
  private async createRuntimeWithPlugins(
    agentId: string,
    character: Character,
    userId?: string
  ): Promise<AgentRuntime> {
    // Database configuration
    const dbPort = process.env.POSTGRES_DEV_PORT || 5432;
    const postgresUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      `postgres://postgres:password@localhost:${dbPort}/babylon`;

    // Create trajectory logger service
    const trajectoryLogger = new TrajectoryLoggerService();
    trajectoryLoggers.set(agentId, trajectoryLogger);

    // Create runtime with standard plugins
    const plugins: Plugin[] = [
      agentCorePlugin as Plugin,
      // experiencePlugin as Plugin,
      trajectoryLoggerPlugin as Plugin,
      // Conditionally add LLM plugins based on available API keys
      ...(process.env.GROQ_API_KEY ? [groqPlugin as Plugin] : []),
      ...(process.env.ANTHROPIC_API_KEY ? [anthropicPlugin as Plugin] : []),
      ...(process.env.OPENAI_API_KEY ? [openaiPlugin as Plugin] : []),
    ];

    const runtimeConfig = {
      character,
      agentId: agentId as UUID,
      plugins,
      settings: {
        ...character.settings,
        POSTGRES_URL: postgresUrl,
      },
    };

    const runtime = new AgentRuntime(runtimeConfig) as ExtendedAgentRuntime;

    // Store model version on runtime for LLM call logging
    if (character.settings?.MODEL_VERSION) {
      runtime.currentModelVersion = character.settings.MODEL_VERSION as string;
    }
    runtime.currentModel = 'groq';

    // Override adapter methods to prevent undefined errors
    // Babylon doesn't use ElizaOS's memory system, so we stub these out
    runtime.adapter = {
      ...runtime.adapter,
      log: async (_params: {
        body: { [key: string]: JsonValue };
        entityId: string;
        roomId: string;
        type: string;
      }): Promise<void> => {
        // No-op - Babylon uses its own logging
      },
      createMemory: async (
        memory: unknown,
        _tableName?: string
      ): Promise<UUID> => {
        // No-op - Babylon uses its own DB for message storage
        // Return the memory ID or generate one
        const memoryObj = memory as { id?: string } | null;
        return (memoryObj?.id || crypto.randomUUID()) as UUID;
      },
      getMemories: async (_params: unknown): Promise<unknown[]> => {
        // Return empty array - Babylon uses its own DB
        return [];
      },
    } as typeof runtime.adapter;

    // Configure logger
    this.configureLogger(runtime, character.name);

    // Register plugins
    const pluginRegistrationPromises: Promise<void>[] = [];
    const pluginsToLoad = plugins;

    for (const plugin of pluginsToLoad) {
      if (plugin) {
        pluginRegistrationPromises.push(runtime.registerPlugin(plugin));
      }
    }
    await Promise.all(pluginRegistrationPromises);

    // Wrap and enhance with Babylon plugin
    // Use userId for USER_CONTROLLED agents (User table lookup), agentId for NPCs
    const babylonAgentId = userId || agentId;
    await this.enhanceWithBabylon(runtime, babylonAgentId, trajectoryLogger);

    // Store trajectory logger reference on runtime
    runtime.trajectoryLogger = trajectoryLogger;

    return runtime;
  }

  /**
   * Get model settings (Groq configuration)
   * Shared logic for model configuration
   */
  private getModelSettings(): Record<string, string> {
    return {
      // GROQ configuration (always available)
      // Keys must match what groq.ts plugin looks up via runtime.getSetting()
      GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      GROQ_LARGE_MODEL: process.env.GROQ_LARGE_MODEL || 'qwen/qwen3-32b',
      GROQ_SMALL_MODEL: process.env.GROQ_SMALL_MODEL || 'llama-3.1-8b-instant',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    };
  }

  /**
   * Configure runtime logger
   */
  private configureLogger(runtime: AgentRuntime, agentName: string): void {
    if (!runtime.logger || !runtime.logger.log) {
      const customLogger = {
        log: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentName}]`),
        info: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentName}]`),
        warn: (msg: string) =>
          logger.warn(msg, undefined, `Agent[${agentName}]`),
        error: (msg: string) =>
          logger.error(msg, new Error(msg), `Agent[${agentName}]`),
        debug: (msg: string) =>
          logger.debug(msg, undefined, `Agent[${agentName}]`),
        success: (msg: string) =>
          logger.info(`✓ ${msg}`, undefined, `Agent[${agentName}]`),
        notice: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentName}]`),
        level: 'info' as const,
        trace: (msg: string) =>
          logger.debug(msg, undefined, `Agent[${agentName}]`),
        fatal: (msg: string) =>
          logger.error(msg, new Error(msg), `Agent[${agentName}]`),
        progress: (msg: string) =>
          logger.info(msg, undefined, `Agent[${agentName}]`),
        clear: () => (console.clear ? console.clear() : undefined),
        child: () => customLogger,
      } as typeof runtime.logger;
      runtime.logger = customLogger;
    }
  }

  /**
   * Enhance runtime with Babylon plugin (wrapped for trajectory logging)
   */
  private async enhanceWithBabylon(
    runtime: AgentRuntime,
    agentId: string,
    trajectoryLogger: TrajectoryLoggerService
  ): Promise<void> {
    // Wrap Babylon plugin BEFORE registering (so wrapped version is used)
    let wrappedBabylonPlugin = babylonPlugin;
    if (babylonPlugin.actions) {
      wrappedBabylonPlugin = wrapPluginActions(
        wrappedBabylonPlugin,
        trajectoryLogger
      );
    }
    if (babylonPlugin.providers) {
      wrappedBabylonPlugin = wrapPluginProviders(
        wrappedBabylonPlugin,
        trajectoryLogger
      );
    }

    // Enhance with wrapped Babylon plugin
    await enhanceRuntimeWithBabylon(runtime, agentId, wrappedBabylonPlugin);
  }

  /**
   * Get trajectory logger for an agent
   */
  public getTrajectoryLogger(
    agentUserId: string
  ): TrajectoryLoggerService | null {
    return trajectoryLoggers.get(agentUserId) || null;
  }

  /**
   * Remove runtime from cache
   */
  public async clearRuntime(agentUserId: string): Promise<void> {
    if (globalRuntimes.has(agentUserId)) {
      globalRuntimes.delete(agentUserId);
      trajectoryLoggers.delete(agentUserId);

      // Update registry status if agent exists in registry
      await agentRegistry.clearRuntimeInstance(agentUserId);

      logger.info(
        `Runtime cleared for agent ${agentUserId}`,
        undefined,
        'AgentRuntimeManager'
      );
    }
  }

  public clearAllRuntimes(): void {
    globalRuntimes.clear();
    trajectoryLoggers.clear();
    logger.info('All runtimes cleared', undefined, 'AgentRuntimeManager');
  }

  public getRuntimeCount(): number {
    return globalRuntimes.size;
  }

  public hasRuntime(agentUserId: string): boolean {
    return globalRuntimes.has(agentUserId);
  }
}

// Export singleton instance (lazy initialization to avoid circular dependencies)
let _agentRuntimeManagerInstance: AgentRuntimeManager | null = null;

function getManagerInstance(): AgentRuntimeManager {
  if (!_agentRuntimeManagerInstance) {
    _agentRuntimeManagerInstance = AgentRuntimeManager.getInstance();
  }
  return _agentRuntimeManagerInstance;
}

export const agentRuntimeManager = {
  getInstance(): AgentRuntimeManager {
    return getManagerInstance();
  },
  async getRuntime(agentUserId: string) {
    return getManagerInstance().getRuntime(agentUserId);
  },
  getTrajectoryLogger(agentUserId: string) {
    return getManagerInstance().getTrajectoryLogger(agentUserId);
  },
  async clearRuntime(agentUserId: string) {
    return getManagerInstance().clearRuntime(agentUserId);
  },
  clearAllRuntimes() {
    return getManagerInstance().clearAllRuntimes();
  },
  getRuntimeCount() {
    return getManagerInstance().getRuntimeCount();
  },
  hasRuntime(agentUserId: string) {
    return getManagerInstance().hasRuntime(agentUserId);
  },
} as AgentRuntimeManager & { getInstance(): AgentRuntimeManager };
