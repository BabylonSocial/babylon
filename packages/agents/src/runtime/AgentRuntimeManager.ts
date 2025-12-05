/**
 * Multi-Agent Runtime Manager
 *
 * Unified runtime factory for all agent types (USER_CONTROLLED, NPC, EXTERNAL).
 * Manages multiple concurrent Eliza agent runtimes in a serverless environment.
 * Each agent gets its own isolated runtime instance with its own character configuration.
 *
 * @remarks
 * Integrates with AgentRegistry for lifecycle management and agent discovery.
 * Supports runtime caching for warm container reuse in serverless environments.
 *
 * @packageDocumentation
 */

import { actors, db, eq, users } from '@babylon/db';
import {
  AgentRuntime,
  type Character,
  type Plugin,
  type UUID,
} from '@elizaos/core';
import { loadActorById, type ActorData } from '@babylon/engine';
import { logger } from '../shared/logger';
import { generateSnowflakeId } from '../shared/snowflake';
import {
  AgentType,
  type UnifiedAgentRegistration,
} from '../types/agent-registry';
import { agentRegistry } from '../services/agent-registry.service';
import type { JsonValue } from '../types/common';
import { babylonPlugin } from '../plugins/babylon';
import { enhanceRuntimeWithBabylon } from '../plugins/babylon/integration';
import { groqPlugin } from '../plugins/groq';
import { experiencePlugin } from '../plugins/plugin-experience/src';
import { trajectoryLoggerPlugin } from '../plugins/plugin-trajectory-logger/src';
import {
  wrapPluginActions,
  wrapPluginProviders,
} from '../plugins/plugin-trajectory-logger/src/action-interceptor';
import { TrajectoryLoggerService } from '../plugins/plugin-trajectory-logger/src/TrajectoryLoggerService';
import { openaiPlugin } from '@elizaos/plugin-openai';
import { anthropicPlugin } from '@elizaos/plugin-anthropic';

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

    const parseBio = (): string[] => {
      if (!agentUser.agentMessageExamples) {
        return [agentUser.bio || ''];
      }

      try {
        const parsed = JSON.parse(agentUser.agentMessageExamples as string);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        logger.warn(
          'agentMessageExamples is not an array, using bio',
          {
            agentId: agentUser.id,
            type: typeof parsed,
          },
          'AgentRuntimeManager'
        );
        return [agentUser.bio || ''];
      } catch (error) {
        const exampleValue = agentUser.agentMessageExamples;
        const displayValue =
          typeof exampleValue === 'string'
            ? exampleValue.substring(0, 50)
            : String(exampleValue);

        logger.warn(
          'Failed to parse agentMessageExamples, using bio',
          {
            agentId: agentUser.id,
            value: displayValue,
            error: error instanceof Error ? error.message : String(error),
          },
          'AgentRuntimeManager'
        );
        return [agentUser.bio || ''];
      }
    };

    const parseStyle = (): Record<string, JsonValue> | undefined => {
      if (!agentUser.agentStyle) {
        return undefined;
      }

      try {
        return JSON.parse(agentUser.agentStyle as string) as Record<
          string,
          JsonValue
        >;
      } catch (error) {
        const styleValue = agentUser.agentStyle;
        const displayValue =
          typeof styleValue === 'string'
            ? styleValue.substring(0, 50)
            : String(styleValue);

        logger.warn(
          'Failed to parse agentStyle, using defaults',
          {
            agentId: agentUser.id,
            value: displayValue,
            error: error instanceof Error ? error.message : String(error),
          },
          'AgentRuntimeManager'
        );
        return undefined;
      }
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
      system: agentUser.agentSystem || 'You are a helpful AI agent',
      bio: parseBio(),
      messageExamples: [],
      style: parseStyle(),
      plugins: [],
      settings: {
        // GROQ configuration (always available)
        GROQ_API_KEY: process.env.GROQ_API_KEY || '',
        LARGE_GROQ_MODEL: 'qwen/qwen3-32b',
        SMALL_GROQ_MODEL: 'llama-3.1-8b-instant',
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

    // Create runtime with groq, experience, and trajectory logger plugins
    // Type cast plugins to ensure compatibility across different @elizaos/core versions
    const plugins: Plugin[] = [
      experiencePlugin as Plugin,
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

    // Override adapter.log to prevent undefined logger errors
    runtime.adapter = {
      ...runtime.adapter,
      log: async (_params: {
        body: { [key: string]: unknown };
        entityId: string;
        roomId: string;
        type: string;
      }): Promise<void> => {
        // No-op to prevent errors
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
    registration: UnifiedAgentRegistration
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

    // Parse bio from agentMessageExamples or bio field
    const parseBio = (): string[] => {
      if (!agentUser.agentMessageExamples) {
        return [agentUser.bio || ''];
      }

      try {
        const parsed = JSON.parse(agentUser.agentMessageExamples as string);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [agentUser.bio || ''];
      } catch {
        return [agentUser.bio || ''];
      }
    };

    // Parse style
    const parseStyle = (): Record<string, JsonValue> | undefined => {
      if (!agentUser.agentStyle) {
        return undefined;
      }

      try {
        return JSON.parse(agentUser.agentStyle as string) as Record<
          string,
          JsonValue
        >;
      } catch {
        return undefined;
      }
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
    return this.createRuntimeWithPlugins(registration.agentId, character);
  }

  /**
   * Create runtime for NPC agent
   * Loads ActorData and creates Character from NPC configuration
   */
  private async createNpcRuntime(
    registration: UnifiedAgentRegistration
  ): Promise<AgentRuntime> {
    // Verify actor exists in database
    const [actor] = await db
      .select()
      .from(actors)
      .where(eq(actors.id, registration.agentId))
      .limit(1);

    if (!actor) {
      throw new Error(`Actor ${registration.agentId} not found in database`);
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
    registration: UnifiedAgentRegistration
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
   */
  private async createRuntimeWithPlugins(
    agentId: string,
    character: Character
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
      experiencePlugin as Plugin,
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

    // Override adapter.log to prevent undefined logger errors
    runtime.adapter = {
      ...runtime.adapter,
      log: async (_params: {
        body: { [key: string]: unknown };
        entityId: string;
        roomId: string;
        type: string;
      }): Promise<void> => {
        // No-op to prevent errors
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
    await this.enhanceWithBabylon(runtime, agentId, trajectoryLogger);

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
      GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      LARGE_GROQ_MODEL: 'qwen/qwen3-32b',
      SMALL_GROQ_MODEL: 'llama-3.1-8b-instant',
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
      try {
        await agentRegistry.clearRuntimeInstance(agentUserId);
      } catch {
        // Agent may not be in registry (unregistered agents), ignore error
        logger.debug(
          `Could not clear registry for ${agentUserId}, likely unregistered agent`,
          undefined,
          'AgentRuntimeManager'
        );
      }

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
