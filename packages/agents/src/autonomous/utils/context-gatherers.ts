/**
 * Context Gathering Utilities
 *
 * Fetches market data, positions, posts, and other context
 * for agent decision making.
 */

import {
  and,
  desc,
  eq,
  getDbInstance,
  gte,
  ilike,
  inArray,
  isNull,
  listAgentGroupChatsWithMemberCounts,
  listTeamGroupIds,
  lte,
  ne,
  sql,
} from '@babylon/db';
import {
  chatParticipants,
  chats,
  comments,
  db,
  groups,
  markets,
  perpPositions,
  positions,
  posts,
  reactions,
  shares,
  users,
} from '@babylon/db/runtime';
import { StaticDataRegistry } from '@babylon/engine';
import { logger } from '../../shared/logger';
import type {
  AgentOwnPostContext,
  PerpMarketContext,
  PerpPositionContext,
  PostContext,
  PredictionMarketContext,
  PredictionPositionContext,
} from '../templates/multi-step-decision';
import { formatTimeHeld, getTimeAgo } from './time-helpers';

// =============================================================================
// Market Context
// =============================================================================

/**
 * Get active prediction markets with pricing
 */
export async function getPredictionMarkets(): Promise<
  PredictionMarketContext[]
> {
  const activeMarkets = await db
    .select()
    .from(markets)
    .where(and(eq(markets.resolved, false), gte(markets.endDate, new Date())))
    .orderBy(desc(markets.createdAt))
    .limit(8);

  return activeMarkets.map((m) => {
    const yesShares = Number(m.yesShares || 1);
    const noShares = Number(m.noShares || 1);
    const total = yesShares + noShares;

    return {
      id: m.id,
      question: m.question,
      yesPrice: yesShares / total,
      noPrice: noShares / total,
      volume: total,
      endDate: m.endDate?.toISOString().split('T')[0] ?? 'Unknown',
    };
  });
}

/**
 * Get perp markets with current prices
 */
export async function getPerpMarkets(): Promise<PerpMarketContext[]> {
  const orgStates = await getDbInstance().getOrganizationsByPrice();
  const result: PerpMarketContext[] = [];

  for (const state of orgStates.slice(0, 8)) {
    const staticOrg = StaticDataRegistry.getOrganization(state.id);
    if (!staticOrg || staticOrg.type !== 'company' || !staticOrg.ticker)
      continue;

    const currentPrice = state.currentPrice ?? staticOrg.initialPrice ?? 100;
    const initialPrice = staticOrg.initialPrice ?? 100;
    const changePercent = ((currentPrice - initialPrice) / initialPrice) * 100;

    result.push({
      ticker: staticOrg.ticker,
      name: staticOrg.name,
      currentPrice,
      initialPrice,
      changePercent,
    });
  }

  return result;
}

// =============================================================================
// Position Context
// =============================================================================

/**
 * Get agent's current positions with full context including time held and price movement
 */
export async function getAgentPositions(agentUserId: string): Promise<{
  predictions: PredictionPositionContext[];
  perps: PerpPositionContext[];
}> {
  const now = Date.now();

  // Prediction positions - fetch more fields
  const predPositions = await db
    .select({
      marketId: positions.marketId,
      side: positions.side,
      shares: positions.shares,
      avgPrice: positions.avgPrice,
      createdAt: positions.createdAt,
    })
    .from(positions)
    .where(
      and(eq(positions.userId, agentUserId), eq(positions.status, 'active'))
    )
    .limit(10);

  // Get market data for positions (question + current prices)
  const marketIds = predPositions
    .map((p) => p.marketId)
    .filter(Boolean) as string[];
  const marketData = new Map<
    string,
    { question: string; yesPrice: number; noPrice: number }
  >();
  if (marketIds.length > 0) {
    const marketsData = await db
      .select({
        id: markets.id,
        question: markets.question,
        yesShares: markets.yesShares,
        noShares: markets.noShares,
      })
      .from(markets)
      .where(inArray(markets.id, marketIds));
    for (const m of marketsData) {
      const yesShares = Number(m.yesShares || 1);
      const noShares = Number(m.noShares || 1);
      const total = yesShares + noShares;
      marketData.set(m.id, {
        question: m.question,
        yesPrice: yesShares / total,
        noPrice: noShares / total,
      });
    }
  }

  const predictions: PredictionPositionContext[] = predPositions
    .filter((p) => p.marketId)
    .map((p) => {
      const market = marketData.get(p.marketId as string);
      const avgPrice = Number(p.avgPrice || 0.5);
      const isYes = p.side === true;
      const currentPrice = market
        ? isYes
          ? market.yesPrice
          : market.noPrice
        : avgPrice;
      const pnlPercent =
        avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
      const timeHeldMs = p.createdAt
        ? now - new Date(p.createdAt).getTime()
        : 0;

      return {
        marketId: p.marketId as string,
        question: market?.question ?? 'Unknown',
        side: isYes ? 'YES' : 'NO',
        shares: Number(p.shares || 0),
        avgPrice,
        currentPrice,
        pnlPercent,
        timeHeld: formatTimeHeld(timeHeldMs),
        timeHeldMs,
      };
    });

  // Perp positions - fetch more fields including entry price and opened time
  const perpPositionsList = await db
    .select({
      ticker: perpPositions.ticker,
      side: perpPositions.side,
      size: perpPositions.size,
      entryPrice: perpPositions.entryPrice,
      currentPrice: perpPositions.currentPrice,
      unrealizedPnL: perpPositions.unrealizedPnL,
      unrealizedPnLPercent: perpPositions.unrealizedPnLPercent,
      openedAt: perpPositions.openedAt,
    })
    .from(perpPositions)
    .where(
      and(eq(perpPositions.userId, agentUserId), isNull(perpPositions.closedAt))
    )
    .limit(10);

  const perps: PerpPositionContext[] = perpPositionsList.map((p) => {
    const entryPrice = Number(p.entryPrice || 100);
    const currentPrice = Number(p.currentPrice || entryPrice);
    const timeHeldMs = p.openedAt ? now - new Date(p.openedAt).getTime() : 0;

    // Calculate P&L percent based on side
    let pnlPercent = Number(p.unrealizedPnLPercent || 0);
    if (pnlPercent === 0 && entryPrice > 0) {
      const priceChange = currentPrice - entryPrice;
      const isLong = p.side === 'long';
      pnlPercent = (priceChange / entryPrice) * 100 * (isLong ? 1 : -1);
    }

    return {
      ticker: p.ticker,
      side: p.side,
      size: Number(p.size || 0),
      pnl: Number(p.unrealizedPnL || 0),
      pnlPercent,
      entryPrice,
      currentPrice,
      timeHeld: formatTimeHeld(timeHeldMs),
      timeHeldMs,
    };
  });

  return { predictions, perps };
}

// =============================================================================
// Social Context
// =============================================================================

/**
 * Get agent's group chats for potential sharing
 * Excludes team chats (Agents) - agents shouldn't auto-respond there
 */
export async function getAgentGroupChats(
  agentUserId: string
): Promise<{ id: string; name: string; memberCount: number }[]> {
  try {
    const teamGroupIds = new Set(await listTeamGroupIds());

    const groupChatsWithCount = await listAgentGroupChatsWithMemberCounts(
      agentUserId,
      10
    );

    // Filter out team chats
    const filteredChats = groupChatsWithCount.filter(
      (chat) => !chat.groupId || !teamGroupIds.has(chat.groupId)
    );

    return filteredChats.slice(0, 5).map((chat) => ({
      id: chat.id,
      name: chat.name ?? 'Group Chat',
      memberCount: chat.memberCount,
    }));
  } catch (error) {
    logger.warn(
      'Failed to fetch agent group chats',
      {
        agentUserId,
        error: error instanceof Error ? error.message : String(error),
      },
      'ContextGatherers'
    );
    return [];
  }
}

/**
 * Resolve a group chat by name for an agent.
 * Returns the chatId of the first matching group chat the agent is a member of.
 * Used for channel resolution when agents reference groups by name rather than ID.
 */
export async function resolveGroupChatByName(
  agentUserId: string,
  groupName: string
): Promise<string | null> {
  // Sanitize input to prevent ilike pattern injection
  const sanitized = groupName.replace(/[%_\\]/g, '').trim();
  if (sanitized.length < 2) return null;

  const results = await db
    .select({ chatId: chats.id })
    .from(chatParticipants)
    .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
    .innerJoin(groups, eq(chats.groupId, groups.id))
    .where(
      and(
        eq(chatParticipants.userId, agentUserId),
        eq(chats.isGroup, true),
        ilike(groups.name, `%${sanitized}%`)
      )
    )
    .limit(1);

  return results[0]?.chatId ?? null;
}

/**
 * Resolve a user by their username.
 * Returns the userId or null if not found.
 */
export async function resolveUserByUsername(
  username: string
): Promise<string | null> {
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  if (!clean) return null;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, clean))
    .limit(1);

  return user?.id ?? null;
}

/**
 * Get agent's own recent posts for self-awareness
 */
export async function getAgentOwnPosts(
  agentUserId: string
): Promise<AgentOwnPostContext[]> {
  try {
    const recentOwnPosts = await db
      .select({
        id: posts.id,
        content: posts.content,
        timestamp: posts.timestamp,
      })
      .from(posts)
      .where(and(eq(posts.authorId, agentUserId), isNull(posts.deletedAt)))
      .orderBy(desc(posts.timestamp))
      .limit(5);

    if (recentOwnPosts.length === 0) {
      return [];
    }

    // Get engagement counts for these posts
    const postIds = recentOwnPosts.map((p) => p.id);
    const [likeCounts, commentCounts] = await Promise.all([
      db
        .select({
          postId: reactions.postId,
          count: sql<number>`count(*)`,
        })
        .from(reactions)
        .where(
          and(inArray(reactions.postId, postIds), eq(reactions.type, 'like'))
        )
        .groupBy(reactions.postId),
      db
        .select({
          postId: comments.postId,
          count: sql<number>`count(*)`,
        })
        .from(comments)
        .where(
          and(inArray(comments.postId, postIds), isNull(comments.deletedAt))
        )
        .groupBy(comments.postId),
    ]);

    const likeCountMap = new Map<string, number>();
    const commentCountMap = new Map<string, number>();
    for (const row of likeCounts) {
      if (row.postId) likeCountMap.set(row.postId, Number(row.count));
    }
    for (const row of commentCounts) {
      if (row.postId) commentCountMap.set(row.postId, Number(row.count));
    }

    return recentOwnPosts.map((p) => ({
      content: p.content,
      timeAgo: getTimeAgo(p.timestamp),
      likeCount: likeCountMap.get(p.id) ?? 0,
      commentCount: commentCountMap.get(p.id) ?? 0,
    }));
  } catch (error) {
    logger.warn(
      'Failed to fetch agent own posts',
      {
        agentUserId,
        error: error instanceof Error ? error.message : String(error),
      },
      'ContextGatherers'
    );
    return [];
  }
}

/**
 * Get recent posts to potentially engage with
 */
export async function getRecentPosts(
  agentUserId: string
): Promise<PostContext[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  const recentPostsRaw = await db
    .select({
      id: posts.id,
      content: posts.content,
      authorId: posts.authorId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        ne(posts.authorId, agentUserId),
        isNull(posts.deletedAt),
        gte(posts.timestamp, oneDayAgo),
        lte(posts.timestamp, now)
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(8);

  // Get author names
  const authorIds = [...new Set(recentPostsRaw.map((p) => p.authorId))];
  const authorNames = new Map<string, string>();

  for (const authorId of authorIds) {
    // Check static registry first
    const actor = StaticDataRegistry.getActor(authorId);
    if (actor) {
      authorNames.set(authorId, actor.name);
      continue;
    }
    const org = StaticDataRegistry.getOrganization(authorId);
    if (org) {
      authorNames.set(authorId, org.name);
      continue;
    }
  }

  // Fetch remaining from DB
  const missingIds = authorIds.filter((id) => !authorNames.has(id));
  if (missingIds.length > 0) {
    const dbUsers = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
      })
      .from(users)
      .where(inArray(users.id, missingIds));
    for (const u of dbUsers) {
      authorNames.set(u.id, u.displayName || u.username || 'User');
    }
  }

  // Fetch agent's existing engagement on these posts
  const postIds = recentPostsRaw.map((p) => p.id);
  const agentComments = new Map<string, string>();
  const agentLikes = new Set<string>();
  const agentReposts = new Set<string>();
  const postLikeCounts = new Map<string, number>();
  const postRepostCounts = new Map<string, number>();
  const postCommentCounts = new Map<string, number>();

  if (postIds.length > 0) {
    // Fetch agent's existing comments (top-level only)
    const existingComments = await db
      .select({
        postId: comments.postId,
        content: comments.content,
      })
      .from(comments)
      .where(
        and(
          inArray(comments.postId, postIds),
          eq(comments.authorId, agentUserId),
          isNull(comments.parentCommentId),
          isNull(comments.deletedAt)
        )
      );

    for (const comment of existingComments) {
      if (comment.postId) {
        agentComments.set(comment.postId, comment.content);
      }
    }

    // Execute all engagement queries in parallel
    const [
      existingLikes,
      existingReposts,
      likeCounts,
      repostCounts,
      commentCounts,
    ] = await Promise.all([
      db
        .select({ postId: reactions.postId })
        .from(reactions)
        .where(
          and(
            inArray(reactions.postId, postIds),
            eq(reactions.userId, agentUserId),
            eq(reactions.type, 'like')
          )
        ),
      db
        .select({ postId: shares.postId })
        .from(shares)
        .where(
          and(inArray(shares.postId, postIds), eq(shares.userId, agentUserId))
        ),
      db
        .select({
          postId: reactions.postId,
          count: sql<number>`count(*)`,
        })
        .from(reactions)
        .where(
          and(inArray(reactions.postId, postIds), eq(reactions.type, 'like'))
        )
        .groupBy(reactions.postId),
      db
        .select({
          postId: shares.postId,
          count: sql<number>`count(*)`,
        })
        .from(shares)
        .where(inArray(shares.postId, postIds))
        .groupBy(shares.postId),
      db
        .select({
          postId: comments.postId,
          count: sql<number>`count(*)`,
        })
        .from(comments)
        .where(
          and(inArray(comments.postId, postIds), isNull(comments.deletedAt))
        )
        .groupBy(comments.postId),
    ]);

    for (const like of existingLikes) {
      if (like.postId) agentLikes.add(like.postId);
    }

    for (const repost of existingReposts) {
      agentReposts.add(repost.postId);
    }

    for (const row of likeCounts) {
      if (row.postId) postLikeCounts.set(row.postId, Number(row.count));
    }

    for (const row of repostCounts) {
      postRepostCounts.set(row.postId, Number(row.count));
    }

    for (const row of commentCounts) {
      if (row.postId) postCommentCounts.set(row.postId, Number(row.count));
    }
  }

  return recentPostsRaw.map((p) => ({
    id: p.id,
    authorId: p.authorId,
    authorName: authorNames.get(p.authorId) || 'User',
    content: p.content,
    commentCount: postCommentCounts.get(p.id) ?? 0,
    likeCount: postLikeCounts.get(p.id) ?? 0,
    repostCount: postRepostCounts.get(p.id) ?? 0,
    timeAgo: getTimeAgo(p.createdAt),
    agentComment: agentComments.get(p.id),
    agentLiked: agentLikes.has(p.id),
    agentReposted: agentReposts.has(p.id),
  }));
}
