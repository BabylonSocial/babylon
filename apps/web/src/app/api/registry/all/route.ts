/**
 * Enhanced Registry API
 *
 * @route GET /api/registry/all - Get all registry entities
 * @access Public (optional authentication for RLS)
 *
 * @description
 * Fetches ALL entities from the ERC8004 registry and database including users,
 * actors (NPCs), agents (from Agent0 network), and apps (game platforms).
 *
 * @openapi
 * /api/registry/all:
 *   get:
 *     tags:
 *       - Registry
 *     summary: Get all registry entities
 *     description: Returns all entities from ERC8004 registry and database (optional auth for RLS)
 *     security:
 *       - PrivyAuth: []
 *     responses:
 *       200:
 *         description: Entities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                 actors:
 *                   type: array
 *                 agents:
 *                   type: array
 *                 apps:
 *                   type: array
 *       401:
 *         description: Unauthorized (optional)
 *
 * @example
 * ```typescript
 * const { users, actors, agents } = await fetch('/api/registry/all')
 *   .then(r => r.json());
 * ```
 */

import type { NextRequest } from 'next/server';
import { SubgraphClient } from '@babylon/agents';
import type { DrizzleClient } from '@babylon/db';
import { optionalAuth } from '@babylon/api';
import { asPublic } from '@babylon/db';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';

/**
 * GET /api/registry/all
 * Fetch all registry entities: users, actors, agents, and apps
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('type'); // 'users' | 'actors' | 'agents' | 'apps' | 'all'
  const search = searchParams.get('search') || '';
  const onChainOnly = searchParams.get('onChainOnly') === 'true';

  // Optional auth - registry is public
  await optionalAuth(request).catch(() => null);

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      const dbOperation = async (db: DrizzleClient) => {
        const conditions: Record<string, unknown>[] = [];
        
        if (onChainOnly) {
          conditions.push({ onChainRegistered: true });
        }
        
        if (search) {
          conditions.push({
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
              { bio: { contains: search, mode: 'insensitive' as const } },
            ],
          });
        }

        const where = conditions.length > 0 ? { AND: conditions } : {};

        const users = await db.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        // Get performance metrics for all users
        const userIds = users.map((u) => u.id);
        const metricsResults = await db.agentPerformanceMetrics.findMany({
          where: { userId: { in: userIds } },
        });
        const metricsMap = new Map(metricsResults.map((m) => [m.userId, m]));

        // Get counts for all users in parallel
        const [
          positionCounts,
          commentCounts,
          reactionCounts,
          followerCounts,
          followingCounts,
        ] = await Promise.all([
          Promise.all(
            userIds.map((id) => db.position.count({ where: { userId: id } }))
          ),
          Promise.all(
            userIds.map((id) => db.comment.count({ where: { authorId: id } }))
          ),
          Promise.all(
            userIds.map((id) => db.reaction.count({ where: { userId: id } }))
          ),
          Promise.all(
            userIds.map((id) => db.follow.count({ where: { followingId: id } }))
          ),
          Promise.all(
            userIds.map((id) => db.follow.count({ where: { followerId: id } }))
          ),
        ]);

        return users.map((user, index) => {
          const metrics = metricsMap.get(user.id);
          const compositeScore = metrics?.reputationScore ?? 0;
          const averageFeedbackScore = metrics?.averageFeedbackScore ?? 0;
          const totalFeedbackCount = metrics?.totalFeedbackCount ?? 0;

          return {
            type: 'user',
            id: user.id,
            name: user.displayName || user.username || 'Unknown',
            username: user.username,
            bio: user.bio,
            imageUrl: user.profileImageUrl,
            walletAddress: user.walletAddress,
            isActor: user.isActor,
            isBanned: user.isBanned,
            isScammer: user.isScammer,
            isCSAM: user.isCSAM,
            onChainRegistered: user.onChainRegistered,
            nftTokenId: user.nftTokenId,
            agent0TokenId: user.agent0TokenId,
            agent0MetadataCID: user.agent0MetadataCID,
            registrationTxHash: user.registrationTxHash,
            registrationTimestamp: user.registrationTimestamp,
            createdAt: user.createdAt,
            balance: user.virtualBalance.toString(),
            reputationPoints: Math.round(compositeScore),
            reputationScore: compositeScore,
            trustLevel: metrics?.trustLevel ?? 'UNRATED',
            onChainTrustScore: metrics?.onChainTrustScore ?? null,
            onChainAccuracyScore: metrics?.onChainAccuracyScore ?? null,
            averageFeedbackScore,
            totalFeedbackCount,
            stats: {
              positions: positionCounts[index] ?? 0,
              comments: commentCounts[index] ?? 0,
              reactions: reactionCounts[index] ?? 0,
              followers: followerCounts[index] ?? 0,
              following: followingCounts[index] ?? 0,
            },
          };
        });
      };

      return await asPublic(dbOperation);
    } catch (error) {
      logger.error(
        'Failed to fetch users from database',
        { error },
        'GET /api/registry/all'
      );
      return [];
    }
  };

  // Fetch actors (NPCs) from database
  const fetchActors = async () => {
    try {
      const dbOperation = async (db: DrizzleClient) => {
        const where = search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
                { role: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {};

        const actors = await db.actor.findMany({
          where,
          orderBy: { reputationPoints: 'desc' },
          take: 100,
        });

        // Get counts for all actors in parallel
        const actorIds = actors.map((a) => a.id);
        const [poolCounts, tradeCounts, followerCounts, followingCounts] =
          await Promise.all([
            Promise.all(
              actorIds.map((id) => db.pool.count({ where: { npcActorId: id } }))
            ),
            Promise.all(
              actorIds.map((id) =>
                db.npcTrade.count({ where: { npcActorId: id } })
              )
            ),
            Promise.all(
              actorIds.map((id) =>
                db.actorFollow.count({ where: { followingId: id } })
              )
            ),
            Promise.all(
              actorIds.map((id) =>
                db.actorFollow.count({ where: { followerId: id } })
              )
            ),
          ]);

        return actors.map((actor, index) => ({
          type: 'actor',
          id: actor.id,
          name: actor.name,
          description: actor.description,
          imageUrl: actor.profileImageUrl,
          domain: actor.domain,
          personality: actor.personality,
          tier: actor.tier,
          role: actor.role,
          balance: actor.tradingBalance.toString(),
          reputationPoints: actor.reputationPoints,
          createdAt: actor.createdAt,
          stats: {
            pools: poolCounts[index] ?? 0,
            trades: tradeCounts[index] ?? 0,
            followers: followerCounts[index] ?? 0,
            following: followingCounts[index] ?? 0,
          },
        }));
      };

      return await asPublic(dbOperation);
    } catch (error) {
      logger.error(
        'Failed to fetch actors from database',
        { error },
        'GET /api/registry/all'
      );
      return [];
    }
  };

  const fetchAgents = async () => {
    try {
      const subgraphClient = new SubgraphClient();
      const agents = await subgraphClient.searchAgents({
        type: 'agent',
        limit: 100,
      });

      return agents.map((agent) => {
        let parsedCapabilities: unknown = {};
        if (agent.capabilities) {
          try {
            parsedCapabilities = JSON.parse(agent.capabilities);
          } catch {
            parsedCapabilities = {};
          }
        }

        return {
          type: 'agent',
          id: `agent0-${agent.tokenId}`,
          tokenId: agent.tokenId,
          name: agent.name,
          walletAddress: agent.walletAddress,
          metadataCID: agent.metadataCID,
          mcpEndpoint: agent.mcpEndpoint,
          a2aEndpoint: agent.a2aEndpoint,
          capabilities: parsedCapabilities,
          reputation: agent.reputation,
        };
      });
    } catch (error) {
      logger.error(
        'Failed to fetch agents from subgraph',
        { error },
        'GET /api/registry/all'
      );
      return [];
    }
  };

  const fetchApps = async () => {
    try {
      const subgraphClient = new SubgraphClient();
      const apps = await subgraphClient.getGamePlatforms({
        minTrustScore: 0,
      });

      return apps.map((app) => {
        let parsedCapabilities: unknown = {};
        if (app.capabilities) {
          try {
            parsedCapabilities = JSON.parse(app.capabilities);
          } catch {
            parsedCapabilities = {};
          }
        }

        return {
          type: 'app',
          id: `app-${app.tokenId}`,
          tokenId: app.tokenId,
          name: app.name,
          walletAddress: app.walletAddress,
          metadataCID: app.metadataCID,
          mcpEndpoint: app.mcpEndpoint,
          a2aEndpoint: app.a2aEndpoint,
          capabilities: parsedCapabilities,
          reputation: app.reputation || 0,
        };
      });
    } catch (error) {
      logger.error(
        'Failed to fetch apps from subgraph',
        { error },
        'GET /api/registry/all'
      );
      return [];
    }
  };

  // Fetch based on entity type
  let users: Awaited<ReturnType<typeof fetchUsers>> = [];
  let actors: Awaited<ReturnType<typeof fetchActors>> = [];
  let agents: Awaited<ReturnType<typeof fetchAgents>> = [];
  let apps: Awaited<ReturnType<typeof fetchApps>> = [];

  if (!entityType || entityType === 'all' || entityType === 'users') {
    users = await fetchUsers();
  }
  if (!entityType || entityType === 'all' || entityType === 'actors') {
    actors = await fetchActors();
  }
  if (!entityType || entityType === 'all' || entityType === 'agents') {
    agents = await fetchAgents();
  }
  if (!entityType || entityType === 'all' || entityType === 'apps') {
    apps = await fetchApps();
  }

  const result = {
    users,
    actors,
    agents,
    apps,
    totals: {
      users: users.length,
      actors: actors.length,
      agents: agents.length,
      apps: apps.length,
      total: users.length + actors.length + agents.length + apps.length,
    },
  };

  logger.info(
    'Registry fetched successfully',
    result.totals,
    'GET /api/registry/all'
  );

  return successResponse(result);
});
