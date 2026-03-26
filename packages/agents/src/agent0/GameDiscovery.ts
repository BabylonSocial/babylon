/**
 * Game Discovery Service
 *
 * Enables external agents to discover Babylon and other games
 * through the Agent0 registry on Ethereum mainnet.
 * Uses Agent0 SDK directly.
 */

import { db } from '@babylon/db/runtime';

import type { SDK } from 'agent0-sdk';
import { z } from 'zod';
import { logger } from '../shared/logger';
import { IPFSPublisher } from './IPFSPublisher';

const GameConfigValueSchema = z.object({
  tokenId: z.number(),
});

export interface DiscoverableGame {
  tokenId: number;
  name: string;
  type: string;
  metadataCID: string;
  endpoints: {
    a2a: string;
    mcp: string;
    api: string;
    docs?: string;
    websocket?: string;
  };
  capabilities: {
    markets: string[];
    actions: string[];
    protocols: string[];
    socialFeatures?: boolean;
    realtime?: boolean;
  };
  reputation?: {
    trustScore: number;
  };
}

export class GameDiscovery {
  private ipfsPublisher: IPFSPublisher;
  private sdk?: SDK;

  constructor(sdk?: SDK) {
    this.ipfsPublisher = new IPFSPublisher();
    this.sdk = sdk;
  }

  /**
   * Discover games by type (prediction markets, trading games, etc.)
   * This is what external agents call to find Babylon
   *
   * @remarks
   * Uses Agent0 SDK directly with v1.5.2 unified search API.
   */
  async discoverGames(filters: {
    type?: string; // "game-platform", "prediction-market", etc.
    skills?: string[]; // Agent skills like "prediction", "perpetuals"
    minReputation?: number;
  }): Promise<DiscoverableGame[]> {
    const games: DiscoverableGame[] = [];

    if (!this.sdk) {
      return games;
    }

    try {
      // Search for game platforms using unified search
      const agents = await this.sdk.searchAgents({
        a2aSkills: filters.skills,
        active: true,
      });

      for (const agent of agents) {
        // Extract agentId number from chainId:tokenId format
        const tokenId = Number.parseInt(agent.agentId.split(':')[1] || '0', 10);

        // Get MCP and A2A endpoints from agent summary
        // SDK v1.5.2 provides endpoint URLs directly in AgentSummary
        const mcpEndpoint = agent.mcp || '';
        const a2aEndpoint = agent.a2a || '';

        games.push({
          tokenId,
          name: agent.name,
          type: 'game-platform', // Default type
          metadataCID: '', // Not available in AgentSummary
          endpoints: {
            a2a: a2aEndpoint,
            mcp: mcpEndpoint,
            api: '',
            docs: undefined,
            websocket: undefined,
          },
          capabilities: {
            markets: agent.a2aSkills || [],
            actions: agent.mcpTools || [],
            protocols: agent.supportedTrusts || [],
            socialFeatures: undefined,
            realtime: undefined,
          },
          reputation: undefined, // Not available in search results
        });
      }
    } catch (error) {
      logger.error(
        'Agent0 discovery failed',
        error instanceof Error ? error : new Error(String(error)),
        'GameDiscovery'
      );
      // Return empty array but error is logged for debugging
    }

    if (filters.type) {
      return games.filter((g) => g.type === filters.type);
    }

    return games;
  }

  /**
   * Find Babylon specifically with retry logic
   */
  async findBabylon(maxRetries = 3): Promise<DiscoverableGame | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(
        `Discovering Babylon (attempt ${attempt}/${maxRetries})...`,
        undefined,
        'GameDiscovery'
      );

      const games = await this.discoverGames({
        type: 'game-platform',
        skills: ['prediction'],
      });

      const babylon = games.find(
        (g) =>
          g.name.toLowerCase().includes('babylon') ||
          g.name.toLowerCase().includes('prediction market')
      );

      if (babylon) {
        const isValid = await this.validateEndpoints(babylon);
        if (isValid) {
          logger.info(
            `✅ Found and validated Babylon: ${babylon.name} (token: ${babylon.tokenId})`,
            undefined,
            'GameDiscovery'
          );
          return babylon;
        }
        logger.warn(
          `Babylon found but endpoints failed validation (attempt ${attempt}/${maxRetries})`,
          undefined,
          'GameDiscovery'
        );
      } else {
        logger.warn(
          `Babylon not found in registry (attempt ${attempt}/${maxRetries})`,
          undefined,
          'GameDiscovery'
        );
      }

      if (process.env.NEXT_RUNTIME === 'nodejs') {
        const config = await db.gameConfig.findUnique({
          where: { key: 'agent0_registration' },
        });

        const validation = GameConfigValueSchema.safeParse(config?.value);
        if (validation.success) {
          const tokenId = validation.data.tokenId;

          if (this.sdk) {
            try {
              // loadAgent expects AgentId (string format: "chainId:tokenId")
              const agent = await this.sdk.loadAgent(`1:${tokenId}`);
              const regFile = agent.getRegistrationFile();

              if (regFile) {
                const metadata = regFile.agentURI
                  ? await this.ipfsPublisher.fetchMetadata(regFile.agentURI)
                  : null;

                return {
                  tokenId,
                  name: regFile.name,
                  type: (metadata?.type as string) || 'game-platform',
                  metadataCID: regFile.agentURI || '',
                  endpoints: {
                    a2a: metadata?.endpoints?.a2a || agent.a2aEndpoint || '',
                    mcp: metadata?.endpoints?.mcp || agent.mcpEndpoint || '',
                    api: metadata?.endpoints?.api || '',
                    docs: metadata?.endpoints?.docs,
                    websocket: metadata?.endpoints?.websocket,
                  },
                  capabilities: {
                    markets:
                      (metadata?.capabilities?.markets as string[]) ||
                      agent.a2aSkills ||
                      [],
                    actions:
                      (metadata?.capabilities?.actions as string[]) ||
                      agent.mcpTools ||
                      [],
                    protocols:
                      (metadata?.capabilities?.protocols as string[]) || [],
                    socialFeatures: metadata?.capabilities?.socialFeatures as
                      | boolean
                      | undefined,
                    realtime: metadata?.capabilities?.realtime as
                      | boolean
                      | undefined,
                  },
                };
              }
            } catch {
              // Agent0 lookup failed
            }
          }
        }
      }

      if (attempt < maxRetries) {
        const backoffMs = 1000 * attempt;
        logger.info(
          `Retrying in ${backoffMs}ms...`,
          undefined,
          'GameDiscovery'
        );
        await this.sleep(backoffMs);
      }
    }

    return null;
  }

  /**
   * Validate that game endpoints are accessible
   */
  private async validateEndpoints(game: DiscoverableGame): Promise<boolean> {
    logger.debug(
      `Validating endpoints for ${game.name}...`,
      undefined,
      'GameDiscovery'
    );

    const validations: Promise<boolean>[] = [];

    if (game.endpoints.mcp) {
      validations.push(this.validateMCPEndpoint(game.endpoints.mcp));
    }

    if (game.endpoints.api) {
      validations.push(this.validateAPIEndpoint(game.endpoints.api));
    }

    const results = await Promise.all(validations);
    const anyValid = results.some((r) => r);

    logger.debug(
      anyValid
        ? `✅ Endpoints validated for ${game.name}`
        : `❌ No valid endpoints found for ${game.name}`,
      undefined,
      'GameDiscovery'
    );

    return anyValid;
  }

  /**
   * Validate MCP endpoint
   */
  private async validateMCPEndpoint(mcpUrl: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(mcpUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!(
      data &&
      typeof data === 'object' &&
      'name' in data &&
      'tools' in data
    );
  }

  /**
   * Validate API endpoint
   */
  private async validateAPIEndpoint(apiUrl: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/markets`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    return response.ok || response.status === 401 || response.status === 403;
  }

  /**
   * Sleep utility for retry backoff
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get game metadata by token ID
   */
  async getGameByTokenId(tokenId: number): Promise<DiscoverableGame | null> {
    if (!this.sdk) {
      return null;
    }

    try {
      // loadAgent expects AgentId (string format: "chainId:tokenId")
      const agent = await this.sdk.loadAgent(`1:${tokenId}`);
      const regFile = agent.getRegistrationFile();

      if (!regFile) {
        return null;
      }

      const metadata = regFile.agentURI
        ? await this.ipfsPublisher.fetchMetadata(regFile.agentURI)
        : null;

      return {
        tokenId,
        name: regFile.name,
        type: (metadata?.type as string) || 'game-platform',
        metadataCID: regFile.agentURI || '',
        endpoints: {
          a2a: metadata?.endpoints?.a2a || agent.a2aEndpoint || '',
          mcp: metadata?.endpoints?.mcp || agent.mcpEndpoint || '',
          api: metadata?.endpoints?.api || '',
          docs: metadata?.endpoints?.docs,
          websocket: metadata?.endpoints?.websocket,
        },
        capabilities: {
          markets:
            (metadata?.capabilities?.markets as string[]) ||
            agent.a2aSkills ||
            [],
          actions:
            (metadata?.capabilities?.actions as string[]) ||
            agent.mcpTools ||
            [],
          protocols: (metadata?.capabilities?.protocols as string[]) || [],
          socialFeatures: metadata?.capabilities?.socialFeatures as
            | boolean
            | undefined,
          realtime: metadata?.capabilities?.realtime as boolean | undefined,
        },
        reputation: undefined, // Not available from loadAgent
      };
    } catch {
      return null;
    }
  }
}

/**
 * Get or create singleton GameDiscovery instance
 */
let gameDiscoveryInstance: GameDiscovery | null = null;

export function getGameDiscoveryService(sdk?: SDK): GameDiscovery {
  if (!gameDiscoveryInstance) {
    gameDiscoveryInstance = new GameDiscovery(sdk);
  }
  return gameDiscoveryInstance;
}
