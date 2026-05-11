import { getRedisClient, isRedisAvailable } from '@babylon/api';
import {
  and,
  db,
  desc,
  gte,
  isNull,
  lte,
  or,
  perpMarketSnapshots,
  posts,
  worldEvents,
} from '@babylon/db';
import { sql } from 'drizzle-orm';
import { logger } from '../../shared/logger';
import type { TickSimulationEvent } from './tick-simulation-types';

const MARKET_EVENT_SIGNATURE_TTL_SECONDS = 60 * 60 * 24;
const memoryMarketSignatures = new Map<string, string>();

function clampUrgency(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Exported for tests — stable bucket key for market-move dedupe. */
export function marketSignature(
  ticker: string,
  changePercent24h: number
): string {
  const pctBucket = Math.round(changePercent24h * 2) / 2;
  return `${ticker}:${pctBucket.toFixed(1)}`;
}

async function hasEmittedMarketMove(
  ticker: string,
  signature: string
): Promise<boolean> {
  const key = `npc-qualia-batch:market-signature:${ticker}`;
  const client = getRedisClient();
  if (client && isRedisAvailable()) {
    const previous = await client.get(key);
    return previous === signature;
  }

  const previous = memoryMarketSignatures.get(key);
  return previous === signature;
}

export async function commitMarketMoveSignatures(
  events: TickSimulationEvent[]
): Promise<void> {
  const signatures = events
    .filter((event) => event.kind === 'market_move')
    .map((event) => ({
      signature: event.metadata.marketSignature,
      ticker: event.metadata.ticker,
    }))
    .filter(
      (entry): entry is { signature: string; ticker: string } =>
        Boolean(entry.signature) && Boolean(entry.ticker)
    );

  if (signatures.length === 0) {
    return;
  }

  const client = getRedisClient();
  if (client && isRedisAvailable()) {
    const pipeline = client.pipeline();
    for (const { ticker, signature } of signatures) {
      pipeline.set(
        `npc-qualia-batch:market-signature:${ticker}`,
        signature,
        'EX',
        MARKET_EVENT_SIGNATURE_TTL_SECONDS
      );
    }
    await pipeline.exec();
    return;
  }

  for (const { ticker, signature } of signatures) {
    memoryMarketSignatures.set(
      `npc-qualia-batch:market-signature:${ticker}`,
      signature
    );
  }
  logger.debug(
    'Redis unavailable for market event dedupe; committed in-memory signatures',
    { count: signatures.length },
    'TickEventBatchBuilder'
  );
}

/**
 * Builds a compact objective event ledger for the NPC tick time window.
 */
export async function buildTickSimulationEventBatch(params: {
  windowStart: Date;
  windowEnd: Date;
}): Promise<TickSimulationEvent[]> {
  const { windowStart, windowEnd } = params;

  const [worldRows, postRows, perpRows] = await Promise.all([
    db
      .select({
        id: worldEvents.id,
        eventType: worldEvents.eventType,
        description: worldEvents.description,
        relatedQuestion: worldEvents.relatedQuestion,
        pointsToward: worldEvents.pointsToward,
        visibility: worldEvents.visibility,
        actors: worldEvents.actors,
        timestamp: worldEvents.timestamp,
      })
      .from(worldEvents)
      .where(
        and(
          gte(worldEvents.timestamp, windowStart),
          lte(worldEvents.timestamp, windowEnd)
        )
      )
      .orderBy(desc(worldEvents.timestamp))
      .limit(20),

    db
      .select({
        id: posts.id,
        content: posts.content,
        authorId: posts.authorId,
        timestamp: posts.timestamp,
      })
      .from(posts)
      .where(
        and(
          gte(posts.timestamp, windowStart),
          lte(posts.timestamp, windowEnd),
          isNull(posts.deletedAt),
          isNull(posts.commentOnPostId)
        )
      )
      .orderBy(desc(posts.timestamp))
      .limit(20),

    db
      .select({
        ticker: perpMarketSnapshots.ticker,
        name: perpMarketSnapshots.name,
        changePercent24h: perpMarketSnapshots.changePercent24h,
        currentPrice: perpMarketSnapshots.currentPrice,
        quoteUpdatedAt: perpMarketSnapshots.quoteUpdatedAt,
        updatedAt: perpMarketSnapshots.updatedAt,
      })
      .from(perpMarketSnapshots)
      .where(
        or(
          and(
            gte(perpMarketSnapshots.quoteUpdatedAt, windowStart),
            lte(perpMarketSnapshots.quoteUpdatedAt, windowEnd)
          ),
          and(
            gte(perpMarketSnapshots.updatedAt, windowStart),
            lte(perpMarketSnapshots.updatedAt, windowEnd)
          )
        )
      )
      .orderBy(desc(sql`abs(${perpMarketSnapshots.changePercent24h})`))
      .limit(12),
  ]);

  const events: TickSimulationEvent[] = [];

  for (const row of worldRows) {
    const summary = `${row.eventType}: ${row.description.slice(0, 120)}`;
    const rawVis = (row.visibility ?? 'public').toLowerCase();
    const vis: 'public' | 'private' | 'leaked' =
      rawVis === 'public'
        ? 'public'
        : rawVis.includes('leak')
          ? 'leaked'
          : 'private';
    events.push({
      id: `we:${row.id}`,
      kind: 'world_event',
      summary,
      visibility: vis,
      urgency: clampUrgency(
        55 +
          (row.relatedQuestion != null ? 15 : 0) +
          Math.min(20, row.description.length / 40)
      ),
      metadata: {
        relatedQuestion: row.relatedQuestion,
        pointsToward:
          row.pointsToward === 'yes' || row.pointsToward === 'no'
            ? row.pointsToward
            : null,
        actorIds: row.actors ?? [],
      },
    });
  }

  for (const row of postRows) {
    const preview = row.content.replace(/\s+/g, ' ').slice(0, 100);
    events.push({
      id: `post:${row.id}`,
      kind: 'post',
      summary: `Post: ${preview}`,
      visibility: 'public',
      urgency: clampUrgency(40 + Math.min(30, row.content.length / 80)),
      metadata: { postId: row.id, actorIds: [row.authorId] },
    });
  }

  for (const row of perpRows) {
    const pct = row.changePercent24h ?? 0;
    if (Math.abs(pct) < 2) {
      continue;
    }
    const signature = marketSignature(row.ticker, pct);
    if (await hasEmittedMarketMove(row.ticker, signature)) {
      continue;
    }
    events.push({
      id: `mkt:${row.ticker}`,
      kind: 'market_move',
      summary: `${row.ticker} (${row.name ?? row.ticker}) 24h ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% @ ${(row.currentPrice ?? 0).toFixed(2)}`,
      visibility: 'public',
      urgency: clampUrgency(45 + Math.min(40, Math.abs(pct) * 2)),
      metadata: { marketSignature: signature, ticker: row.ticker },
    });
  }

  return events;
}
