import {
  and,
  comments,
  db,
  desc,
  gte,
  inArray,
  isNull,
  npcTrades,
  perpPositions,
  posts,
} from '@babylon/db';
import type { StaticActor } from '@babylon/engine';
import type {
  AgentQualiaRow,
  TickSimulationEvent,
} from './tick-simulation-types';

/** Exported for unit tests — world_event visibility rules for qualia rows. */
export function actorSeesWorldEvent(
  agentId: string,
  event: TickSimulationEvent
): boolean {
  if (event.kind !== 'world_event') {
    return true;
  }
  if (event.visibility === 'public') {
    return true;
  }
  if (event.visibility === 'leaked') {
    return true;
  }
  const actors = event.metadata.actorIds ?? [];
  return actors.includes(agentId);
}

function recencyLabel(
  value: Date | null | undefined,
  now: Date,
  cooldownMs: number
): 'ready' | 'blocked' {
  if (!value) {
    return 'ready';
  }
  return now.getTime() - value.getTime() >= cooldownMs ? 'ready' : 'blocked';
}

function exposureLabel(size: number): 'low' | 'medium' | 'high' {
  if (size >= 1_000) {
    return 'high';
  }
  if (size >= 100) {
    return 'medium';
  }
  return 'low';
}

async function buildQualiaSignals(agentIds: string[]): Promise<
  Map<
    string,
    {
      exposure: 'low' | 'medium' | 'high';
      cooldownSummary: string;
    }
  >
> {
  if (agentIds.length === 0) {
    return new Map();
  }

  const now = new Date();
  const recentSince = new Date(now.getTime() - 60 * 60 * 1000);
  const [positions, trades, recentPosts, recentComments] = await Promise.all([
    db
      .select({
        userId: perpPositions.userId,
        size: perpPositions.size,
      })
      .from(perpPositions)
      .where(
        and(
          inArray(perpPositions.userId, agentIds),
          isNull(perpPositions.closedAt)
        )
      ),
    db
      .select({
        agentId: npcTrades.npcActorId,
        executedAt: npcTrades.executedAt,
      })
      .from(npcTrades)
      .where(
        and(
          inArray(npcTrades.npcActorId, agentIds),
          gte(npcTrades.executedAt, recentSince)
        )
      )
      .orderBy(desc(npcTrades.executedAt)),
    db
      .select({
        agentId: posts.authorId,
        timestamp: posts.timestamp,
      })
      .from(posts)
      .where(
        and(
          inArray(posts.authorId, agentIds),
          gte(posts.timestamp, recentSince),
          isNull(posts.commentOnPostId),
          isNull(posts.deletedAt)
        )
      )
      .orderBy(desc(posts.timestamp)),
    db
      .select({
        agentId: comments.authorId,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .where(
        and(
          inArray(comments.authorId, agentIds),
          gte(comments.createdAt, recentSince),
          isNull(comments.deletedAt)
        )
      )
      .orderBy(desc(comments.createdAt)),
  ]);

  const positionSizeByAgent = new Map<string, number>();
  for (const p of positions) {
    positionSizeByAgent.set(
      p.userId,
      (positionSizeByAgent.get(p.userId) ?? 0) + Math.abs(Number(p.size ?? 0))
    );
  }

  const lastTradeByAgent = new Map<string, Date>();
  for (const trade of trades) {
    if (!lastTradeByAgent.has(trade.agentId)) {
      lastTradeByAgent.set(trade.agentId, trade.executedAt);
    }
  }

  const lastPostByAgent = new Map<string, Date>();
  for (const post of recentPosts) {
    if (!lastPostByAgent.has(post.agentId)) {
      lastPostByAgent.set(post.agentId, post.timestamp);
    }
  }

  const lastCommentByAgent = new Map<string, Date>();
  for (const comment of recentComments) {
    if (!lastCommentByAgent.has(comment.agentId)) {
      lastCommentByAgent.set(comment.agentId, comment.createdAt);
    }
  }

  return new Map(
    agentIds.map((agentId) => [
      agentId,
      {
        exposure: exposureLabel(positionSizeByAgent.get(agentId) ?? 0),
        cooldownSummary: [
          `trade:${recencyLabel(lastTradeByAgent.get(agentId), now, 5 * 60 * 1000)}`,
          `post:${recencyLabel(lastPostByAgent.get(agentId), now, 20 * 60 * 1000)}`,
          `comment:${recencyLabel(lastCommentByAgent.get(agentId), now, 5 * 60 * 1000)}`,
        ].join(' '),
      },
    ])
  );
}

/**
 * Derives per-NPC perceived events from the objective batch (subjective slice).
 */
export async function buildAgentQualiaRows(params: {
  npcs: StaticActor[];
  events: TickSimulationEvent[];
}): Promise<AgentQualiaRow[]> {
  const { npcs, events } = params;
  const signals = await buildQualiaSignals(npcs.map((npc) => npc.id));

  return npcs.map((npc) => {
    const perceived = events
      .filter((e) => {
        if (e.kind === 'post') {
          return true;
        }
        if (e.kind === 'market_move') {
          return true;
        }
        return actorSeesWorldEvent(npc.id, e);
      })
      .map((e) => e.id);

    const mood =
      npc.personality?.replace(/\s+/g, ' ').slice(0, 60) ?? 'neutral';
    const signal = signals.get(npc.id);

    return {
      agentId: npc.id,
      displayName: npc.name,
      perceivedEventIds: perceived,
      mood,
      exposureLabel: signal?.exposure ?? 'low',
      cooldownSummary:
        signal?.cooldownSummary ?? 'trade:ready post:ready comment:ready',
    };
  });
}
