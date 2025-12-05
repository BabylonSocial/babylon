/**
 * Agent Service v2 - Agents are Users
 *
 * Core service for agent lifecycle management. Agents are implemented as users
 * with isAgent=true, allowing them to participate fully in the platform.
 *
 * @remarks
 * Architecture: Agents ARE users (isAgent=true), not separate entities.
 * They can post, comment, join chats, trade, and do everything users can do.
 * The creating user "manages" them via the managedBy field.
 *
 * @packageDocumentation
 */

import {
  agentLogs,
  agentMessages,
  agentPointsTransactions,
  agentTrades,
  and,
  db,
  desc,
  eq,
  pointsTransactions,
  type User,
  users,
  withTransaction,
} from '@babylon/db';
import { agentRuntimeManager } from '../runtime/AgentRuntimeManager';
import { AuthorizationError } from '../errors';
import { logger } from '../shared/logger';
import { getService } from './interfaces';
import { generateSnowflakeId } from '../shared/snowflake';
import type { AgentCapabilities } from '@babylon/shared';
import type { JsonValue } from '../types/common';
import { agentIdentityService } from '../identity/AgentIdentityService';
import type { AgentPerformance, CreateAgentParams } from '../types';

/**
 * Service for agent lifecycle management
 */
export class AgentServiceV2 {
  /**
   * Creates a new agent (creates a full User with isAgent=true)
   *
   * Creates a complete user account with agent capabilities, wallet, and
   * initial configuration. The agent can immediately participate in all
   * platform activities.
   *
   * @param params - Agent creation parameters
   * @returns Created user/agent entity
   * @throws Error if manager not found or insufficient points for deposit
   */
  async createAgent(params: CreateAgentParams): Promise<User> {
    const {
      userId: managerUserId,
      name,
      description,
      profileImageUrl,
      coverImageUrl,
      system,
      bio,
      personality,
      tradingStrategy,
      initialDeposit,
    } = params;

    const managerResult = await db
      .select()
      .from(users)
      .where(eq(users.id, managerUserId))
      .limit(1);

    const manager = managerResult[0];
    if (!manager) throw new Error('Manager user not found');

    if (initialDeposit && initialDeposit > 0) {
      const totalPoints = manager.reputationPoints;
      if (totalPoints < initialDeposit) {
        throw new Error(
          `Insufficient points. Have: ${totalPoints}, Need: ${initialDeposit}`
        );
      }
    }

    const baseUsername = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const agentUsername = `agent_${baseUsername}_${randomSuffix}`;
    const agentUserId = await generateSnowflakeId();
    // 3. OpenAI (if OPENAI_API_KEY available)

    const agent = await withTransaction(async (tx) => {
      const newAgentResult = await tx
        .insert(users)
        .values({
          id: agentUserId,
          username: agentUsername,
          displayName: name,
          bio:
            description ||
            `AI agent managed by ${manager.displayName || manager.username}`,
          profileImageUrl: profileImageUrl || null,
          coverImageUrl: coverImageUrl || null,
          isAgent: true,
          managedBy: managerUserId,
          agentSystem: system ?? null,
          agentPersonality: personality ?? null,
          agentTradingStrategy: tradingStrategy ?? null,
          agentMessageExamples: bio
            ? JSON.parse(JSON.stringify(bio))
            : undefined,
          agentPointsBalance: initialDeposit || 0,
          agentTotalDeposited: initialDeposit || 0,
          virtualBalance: '0',
          totalDeposited: '0',
          reputationPoints: 0,
          profileComplete: true,
          hasUsername: true,
          hasBio: Boolean(description),
          hasProfileImage: Boolean(profileImageUrl),
          a2aEnabled: true, // Enable A2A by default for all agents
          updatedAt: new Date(),
        })
        .returning();

      const newAgent = newAgentResult[0]!;

      if (initialDeposit && initialDeposit > 0) {
        const initialManagerPoints = manager.reputationPoints;

        await tx
          .update(users)
          .set({
            reputationPoints: manager.reputationPoints - initialDeposit,
            agentCount: manager.agentCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(users.id, managerUserId));

        await tx.insert(agentPointsTransactions).values({
          id: await generateSnowflakeId(),
          agentUserId,
          managerUserId,
          type: 'deposit',
          amount: initialDeposit,
          balanceBefore: 0,
          balanceAfter: initialDeposit,
          description: 'Initial deposit',
        });

        await tx.insert(pointsTransactions).values({
          id: await generateSnowflakeId(),
          userId: managerUserId,
          amount: -initialDeposit,
          pointsBefore: initialManagerPoints,
          pointsAfter: initialManagerPoints - initialDeposit,
          reason: `Deposit to agent: ${name}`,
          metadata: JSON.stringify({ agentUserId, agentName: name }),
        });
      } else {
        await tx
          .update(users)
          .set({
            agentCount: manager.agentCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(users.id, managerUserId));
      }

      await tx.insert(agentLogs).values({
        id: await generateSnowflakeId(),
        agentUserId,
        type: 'system',
        level: 'info',
        message: `Agent created: ${name}`,
        metadata: { initialDeposit: initialDeposit || 0 },
      });

      return newAgent;
    });

    logger.info(
      `Agent user created: ${agentUserId} managed by ${managerUserId}`,
      undefined,
      'AgentService'
    );

    // Register agent in registry if service is available
    const agentRegistry = getService('agentRegistry');
    if (agentRegistry) {
      try {
        const capabilities: AgentCapabilities = {
          strategies: [
            'prediction_markets',
            'social_interaction',
            ...(tradingStrategy
              ? [`trading_${tradingStrategy.toLowerCase()}`]
              : []),
          ],
          markets: ['prediction', 'perpetual', 'spot'],
          actions: [
            'trade',
            'post',
            'comment',
            'like',
            'message',
            'analyze_market',
            'manage_portfolio',
          ],
          version: '1.0.0',
          x402Support: true,
          platform: 'babylon',
          userType: 'user_controlled',
          gameNetwork: {
            chainId: Number.parseInt(
              process.env.NEXT_PUBLIC_CHAIN_ID || '84532'
            ), // Base Sepolia default
            registryAddress:
              process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_BASE_SEPOLIA ||
              '0x0000000000000000000000000000000000000000',
            reputationAddress:
              process.env.NEXT_PUBLIC_REPUTATION_SYSTEM_BASE_SEPOLIA,
          },
          skills: [],
          domains: [],
        };

        await agentRegistry.registerUserAgent({
          userId: agentUserId,
          name: name,
          systemPrompt:
            system ||
            'You are a helpful AI agent on Babylon prediction market.',
          capabilities,
        });

        logger.info(
          `Agent ${agentUserId} registered in registry`,
          undefined,
          'AgentService'
        );
      } catch (error) {
        logger.error(
          `Failed to register agent ${agentUserId} in registry`,
          error instanceof Error ? error : new Error(String(error)),
          'AgentService'
        );
        // Don't fail the whole operation if registry fails
      }
    }

    if (this.shouldAutoSetupAgentIdentity()) {
      void this.setupAgentIdentity(agentUserId);
    }

    return agent;
  }

  async getAgent(
    agentUserId: string,
    managerUserId?: string
  ): Promise<User | null> {
    const agentResult = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    const agent = agentResult[0];
    if (!agent) return null;
    if (!agent.isAgent) throw new Error('User is not an agent');
    if (managerUserId && agent.managedBy !== managerUserId) {
      throw new AuthorizationError(
        'You do not have permission to access this agent. You can only chat with agents you own.',
        'agent',
        'chat'
      );
    }
    return agent;
  }

  async listUserAgents(
    managerUserId: string,
    filters?: { autonomousTrading?: boolean }
  ): Promise<User[]> {
    const query = db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isAgent, true),
          eq(users.managedBy, managerUserId),
          ...(filters?.autonomousTrading !== undefined
            ? [eq(users.autonomousTrading, filters.autonomousTrading)]
            : [])
        )
      )
      .orderBy(desc(users.createdAt));

    return query;
  }

  async updateAgent(
    agentUserId: string,
    managerUserId: string,
    updates: Partial<{
      name: string;
      description: string;
      profileImageUrl: string;
      system: string;
      bio: string[]; // Bio array for ElizaOS agentMessageExamples
      personality: string;
      tradingStrategy: string;
      modelTier: 'free' | 'pro';
      autonomousTrading: boolean;
      autonomousPosting: boolean;
      autonomousCommenting: boolean;
      autonomousDMs: boolean;
      autonomousGroupChats: boolean;
      a2aEnabled: boolean;
    }>
  ): Promise<User> {
    await this.getAgent(agentUserId, managerUserId); // Verify ownership

    if (
      updates.system ||
      updates.personality ||
      updates.modelTier ||
      updates.bio
    ) {
      await agentRuntimeManager.clearRuntime(agentUserId);
    }

    const userUpdates: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name) userUpdates.displayName = updates.name;
    if (updates.description) userUpdates.bio = updates.description;
    if (updates.profileImageUrl !== undefined)
      userUpdates.profileImageUrl = updates.profileImageUrl;
    if (updates.system) userUpdates.agentSystem = updates.system;
    if (updates.bio)
      userUpdates.agentMessageExamples = JSON.stringify(updates.bio); // Store as JSON for ElizaOS
    if (updates.personality) userUpdates.agentPersonality = updates.personality;
    if (updates.tradingStrategy)
      userUpdates.agentTradingStrategy = updates.tradingStrategy;
    if (updates.modelTier) userUpdates.agentModelTier = updates.modelTier;
    if (updates.autonomousTrading !== undefined)
      userUpdates.autonomousTrading = updates.autonomousTrading;
    if (updates.autonomousPosting !== undefined)
      userUpdates.autonomousPosting = updates.autonomousPosting;
    if (updates.autonomousCommenting !== undefined)
      userUpdates.autonomousCommenting = updates.autonomousCommenting;
    if (updates.autonomousDMs !== undefined)
      userUpdates.autonomousDMs = updates.autonomousDMs;
    if (updates.autonomousGroupChats !== undefined)
      userUpdates.autonomousGroupChats = updates.autonomousGroupChats;
    if (updates.a2aEnabled !== undefined)
      userUpdates.a2aEnabled = updates.a2aEnabled;

    const updatedAgentResult = await db
      .update(users)
      .set(userUpdates)
      .where(eq(users.id, agentUserId))
      .returning();

    const updatedAgent = updatedAgentResult[0]!;

    await db.insert(agentLogs).values({
      id: await generateSnowflakeId(),
      agentUserId,
      type: 'system',
      level: 'info',
      message: 'Agent configuration updated',
      metadata: updates,
    });

    logger.info(`Agent updated: ${agentUserId}`, undefined, 'AgentService');
    return updatedAgent;
  }

  async deleteAgent(agentUserId: string, managerUserId: string): Promise<void> {
    const agent = await this.getAgent(agentUserId, managerUserId);
    if (!agent) throw new Error('Agent not found');

    await withTransaction(async (tx) => {
      // Return remaining points to manager
      if (agent.agentPointsBalance > 0) {
        const managerResult = await tx
          .select({ reputationPoints: users.reputationPoints })
          .from(users)
          .where(eq(users.id, managerUserId))
          .limit(1);

        const currentPoints = managerResult[0]?.reputationPoints || 0;

        await tx
          .update(users)
          .set({
            reputationPoints: currentPoints + agent.agentPointsBalance,
            updatedAt: new Date(),
          })
          .where(eq(users.id, managerUserId));

        await tx.insert(pointsTransactions).values({
          id: await generateSnowflakeId(),
          userId: managerUserId,
          amount: agent.agentPointsBalance,
          pointsBefore: 0,
          pointsAfter: 0,
          reason: `Agent deleted, points returned: ${agent.displayName}`,
          metadata: JSON.stringify({
            agentUserId,
            agentName: agent.displayName,
          }),
        });
      }

      // Decrement agent count
      const managerResult = await tx
        .select({ agentCount: users.agentCount })
        .from(users)
        .where(eq(users.id, managerUserId))
        .limit(1);

      const currentAgentCount = managerResult[0]?.agentCount || 0;

      await tx
        .update(users)
        .set({
          agentCount: Math.max(0, currentAgentCount - 1),
          updatedAt: new Date(),
        })
        .where(eq(users.id, managerUserId));

      // Soft delete agent user
      await tx.delete(users).where(eq(users.id, agentUserId));
    });

    // Clear runtime from agent runtime manager
    await agentRuntimeManager.clearRuntime(agentUserId);

    logger.info(`Agent deleted: ${agentUserId}`, undefined, 'AgentService');
  }

  async depositPoints(
    agentUserId: string,
    managerUserId: string,
    amount: number
  ): Promise<User> {
    if (amount <= 0) throw new Error('Amount must be positive');
    const agent = await this.getAgent(agentUserId, managerUserId);
    if (!agent) throw new Error('Agent not found');

    const managerResult = await db
      .select()
      .from(users)
      .where(eq(users.id, managerUserId))
      .limit(1);

    const manager = managerResult[0];
    if (!manager) throw new Error('Manager not found');

    const totalPoints = manager.reputationPoints;
    if (totalPoints < amount) {
      throw new Error(
        `Insufficient points. Have: ${totalPoints}, Need: ${amount}`
      );
    }

    const updatedAgent = await withTransaction(async (tx) => {
      const updatedResult = await tx
        .update(users)
        .set({
          agentPointsBalance: agent.agentPointsBalance + amount,
          agentTotalDeposited: agent.agentTotalDeposited + amount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, agentUserId))
        .returning();

      await tx
        .update(users)
        .set({
          reputationPoints: manager.reputationPoints - amount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, managerUserId));

      await tx.insert(agentPointsTransactions).values({
        id: await generateSnowflakeId(),
        agentUserId,
        managerUserId,
        type: 'deposit',
        amount,
        balanceBefore: agent.agentPointsBalance,
        balanceAfter: agent.agentPointsBalance + amount,
        description: 'Points deposit',
      });

      await tx.insert(pointsTransactions).values({
        id: await generateSnowflakeId(),
        userId: managerUserId,
        amount: -amount,
        pointsBefore: totalPoints,
        pointsAfter: totalPoints - amount,
        reason: `Deposit to agent: ${agent.displayName}`,
        metadata: JSON.stringify({ agentUserId, agentName: agent.displayName }),
      });

      return updatedResult[0]!;
    });

    logger.info(
      `Deposited ${amount} points to agent ${agentUserId}`,
      undefined,
      'AgentService'
    );
    return updatedAgent;
  }

  async withdrawPoints(
    agentUserId: string,
    managerUserId: string,
    amount: number
  ): Promise<User> {
    if (amount <= 0) throw new Error('Amount must be positive');
    const agent = await this.getAgent(agentUserId, managerUserId);
    if (!agent) throw new Error('Agent not found');
    if (agent.agentPointsBalance < amount) {
      throw new Error(
        `Insufficient balance. Have: ${agent.agentPointsBalance}, Need: ${amount}`
      );
    }

    const updatedAgent = await withTransaction(async (tx) => {
      const updatedResult = await tx
        .update(users)
        .set({
          agentPointsBalance: agent.agentPointsBalance - amount,
          agentTotalWithdrawn: agent.agentTotalWithdrawn + amount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, agentUserId))
        .returning();

      const managerResult = await tx
        .select({ reputationPoints: users.reputationPoints })
        .from(users)
        .where(eq(users.id, managerUserId))
        .limit(1);

      const managerPoints = managerResult[0]?.reputationPoints || 0;

      await tx
        .update(users)
        .set({
          reputationPoints: managerPoints + amount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, managerUserId));

      await tx.insert(agentPointsTransactions).values({
        id: await generateSnowflakeId(),
        agentUserId,
        managerUserId,
        type: 'withdraw',
        amount: -amount,
        balanceBefore: agent.agentPointsBalance,
        balanceAfter: agent.agentPointsBalance - amount,
        description: 'Points withdrawal',
      });

      await tx.insert(pointsTransactions).values({
        id: await generateSnowflakeId(),
        userId: managerUserId,
        amount,
        pointsBefore: 0,
        pointsAfter: 0,
        reason: `Withdrawal from agent: ${agent.displayName}`,
        metadata: JSON.stringify({ agentUserId, agentName: agent.displayName }),
      });

      return updatedResult[0]!;
    });

    logger.info(
      `Withdrew ${amount} points from agent ${agentUserId}`,
      undefined,
      'AgentService'
    );
    return updatedAgent;
  }

  async deductPoints(
    agentUserId: string,
    amount: number,
    reason: string,
    relatedId?: string
  ): Promise<number> {
    const agentResult = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    const agent = agentResult[0];
    if (!agent || !agent.isAgent) throw new Error('Agent not found');
    if (agent.agentPointsBalance < amount) {
      throw new Error(
        `Insufficient balance. Have: ${agent.agentPointsBalance}, Need: ${amount}`
      );
    }

    const updated = await withTransaction(async (tx) => {
      const result = await tx
        .update(users)
        .set({
          agentPointsBalance: agent.agentPointsBalance - amount,
          agentTotalPointsSpent: agent.agentTotalPointsSpent + amount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, agentUserId))
        .returning();

      // Create points transaction with proper relations
      await tx.insert(agentPointsTransactions).values({
        id: await generateSnowflakeId(),
        type: reason.includes('chat')
          ? 'spend_chat'
          : reason.includes('post')
            ? 'spend_post'
            : 'spend_tick',
        amount: -amount,
        balanceBefore: agent.agentPointsBalance,
        balanceAfter: agent.agentPointsBalance - amount,
        description: reason,
        relatedId: relatedId ?? null,
        agentUserId: agentUserId,
        managerUserId: agent.managedBy || agentUserId,
      });

      return result[0]!;
    });

    return updated.agentPointsBalance;
  }

  async getPerformance(agentUserId: string): Promise<AgentPerformance> {
    const agentResult = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    const agent = agentResult[0];
    if (!agent || !agent.isAgent) throw new Error('Agent not found');

    // Get trades with pnl
    const trades = await db
      .select()
      .from(agentTrades)
      .where(eq(agentTrades.agentUserId, agentUserId));

    const tradesWithPnl = trades.filter((t) => t.pnl !== null);
    const avgTradeSize =
      tradesWithPnl.length > 0
        ? tradesWithPnl.reduce((sum, t) => sum + t.amount, 0) /
          tradesWithPnl.length
        : 0;

    return {
      lifetimePnL: Number(agent.lifetimePnL),
      totalTrades: tradesWithPnl.length,
      profitableTrades: tradesWithPnl.filter((t) => t.pnl && t.pnl > 0).length,
      winRate:
        tradesWithPnl.length > 0
          ? tradesWithPnl.filter((t) => t.pnl && t.pnl > 0).length /
            tradesWithPnl.length
          : 0,
      avgTradeSize,
    };
  }

  async getChatHistory(agentUserId: string, limit = 50) {
    return db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.agentUserId, agentUserId))
      .orderBy(desc(agentMessages.createdAt))
      .limit(limit);
  }

  async getLogs(
    agentUserId: string,
    filters?: { type?: string; level?: string; limit?: number }
  ) {
    const query = db
      .select()
      .from(agentLogs)
      .where(
        and(
          eq(agentLogs.agentUserId, agentUserId),
          ...(filters?.type ? [eq(agentLogs.type, filters.type)] : []),
          ...(filters?.level ? [eq(agentLogs.level, filters.level)] : [])
        )
      )
      .orderBy(desc(agentLogs.createdAt))
      .limit(filters?.limit || 100);

    return query;
  }

  async createLog(
    agentUserId: string,
    log: {
      type:
        | 'chat'
        | 'tick'
        | 'trade'
        | 'error'
        | 'system'
        | 'post'
        | 'comment'
        | 'dm';
      level: 'info' | 'warn' | 'error' | 'debug';
      message: string;
      prompt?: string;
      completion?: string;
      thinking?: string;
      metadata?: Record<string, JsonValue>;
    }
  ) {
    const result = await db
      .insert(agentLogs)
      .values({
        id: await generateSnowflakeId(),
        agentUserId,
        type: log.type,
        level: log.level,
        message: log.message,
        prompt: log.prompt ?? null,
        completion: log.completion ?? null,
        thinking: log.thinking ?? null,
        metadata: log.metadata || undefined,
      })
      .returning();

    return result[0]!;
  }

  private shouldAutoSetupAgentIdentity(): boolean {
    if (process.env.AUTO_CREATE_AGENT_WALLETS === 'false') {
      return false;
    }

    // Require Privy credentials outside development so we do not spam errors
    const hasPrivyConfig = Boolean(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET
    );

    if (!hasPrivyConfig && process.env.NODE_ENV !== 'development') {
      logger.warn(
        'Skipping automatic agent identity setup - Privy credentials missing',
        undefined,
        'AgentService'
      );
      return false;
    }

    return true;
  }

  private async setupAgentIdentity(agentUserId: string): Promise<void> {
    const skipAgent0Registration = process.env.AGENT0_ENABLED !== 'true';

    try {
      const agent = await agentIdentityService.setupAgentIdentity(agentUserId, {
        skipAgent0Registration,
      });

      logger.info(
        'Agent identity setup complete',
        {
          agentUserId,
          walletProvisioned: Boolean(agent.walletAddress),
          agent0TokenId: agent.agent0TokenId,
          skippedAgent0: skipAgent0Registration,
        },
        'AgentService'
      );
    } catch (error) {
      logger.error(
        'Agent identity setup failed',
        { agentUserId, error },
        'AgentService'
      );
    }
  }
}

export const agentService = new AgentServiceV2();
