/**
 * MCP Tool Handlers
 *
 * Handlers for executing MCP tools
 */

import { db, eq, users } from '@babylon/db';
import { logger, generateSnowflakeId, getAPIBaseUrl } from '@babylon/shared';
import type { JsonValue, StringRecord } from '@babylon/shared';
import type { AuthenticatedAgent } from '../types/mcp';
import type {
  GetMarketsArgs,
  GetMarketsResult,
  PlaceBetArgs,
  PlaceBetResult,
  GetBalanceResult,
  GetPositionsArgs,
  GetPositionsResult,
  ClosePositionArgs,
  ClosePositionResult,
  GetMarketDataArgs,
  GetMarketDataResult,
  QueryFeedArgs,
  QueryFeedResult,
  BuySharesArgs,
  BuySharesResult,
  SellSharesArgs,
  SellSharesResult,
  OpenPositionArgs,
  OpenPositionResult,
  GetMarketPricesArgs,
  GetMarketPricesResult,
  GetPerpetualsArgs,
  GetPerpetualsResult,
  GetTradesArgs,
  GetTradesResult,
  GetTradeHistoryArgs,
  GetTradeHistoryResult,
  CreatePostArgs,
  CreatePostResult,
  DeletePostArgs,
  DeletePostResult,
  LikePostArgs,
  LikePostResult,
  UnlikePostArgs,
  UnlikePostResult,
  SharePostArgs,
  SharePostResult,
  GetCommentsArgs,
  GetCommentsResult,
  CreateCommentArgs,
  CreateCommentResult,
  DeleteCommentArgs,
  DeleteCommentResult,
  LikeCommentArgs,
  LikeCommentResult,
  GetPostsByTagArgs,
  GetPostsByTagResult,
  GetUserProfileArgs,
  GetUserProfileResult,
  UpdateProfileArgs,
  UpdateProfileResult,
  FollowUserArgs,
  FollowUserResult,
  UnfollowUserArgs,
  UnfollowUserResult,
  GetFollowersArgs,
  GetFollowersResult,
  GetFollowingArgs,
  GetFollowingResult,
  SearchUsersArgs,
  SearchUsersResult,
  GetUserWalletArgs,
  GetUserWalletResult,
  GetUserStatsArgs,
  GetUserStatsResult,
  GetChatsArgs,
  GetChatsResult,
  GetChatMessagesArgs,
  GetChatMessagesResult,
  SendMessageArgs,
  SendMessageResult,
  CreateGroupArgs,
  CreateGroupResult,
  LeaveChatArgs,
  LeaveChatResult,
  GetUnreadCountArgs,
  GetUnreadCountResult,
  GetNotificationsArgs,
  GetNotificationsResult,
  MarkNotificationsReadArgs,
  MarkNotificationsReadResult,
  GetGroupInvitesArgs,
  GetGroupInvitesResult,
  AcceptGroupInviteArgs,
  AcceptGroupInviteResult,
  DeclineGroupInviteArgs,
  DeclineGroupInviteResult,
  GetLeaderboardArgs,
  GetLeaderboardResult,
  GetSystemStatsArgs,
  GetSystemStatsResult,
  GetReferralCodeArgs,
  GetReferralCodeResult,
  GetReferralsArgs,
  GetReferralsResult,
  GetReferralStatsArgs,
  GetReferralStatsResult,
  GetReputationArgs,
  GetReputationResult,
  GetReputationBreakdownArgs,
  GetReputationBreakdownResult,
  GetTrendingTagsArgs,
  GetTrendingTagsResult,
  GetOrganizationsArgs,
  GetOrganizationsResult,
  PaymentRequestArgs,
  PaymentRequestResult,
  PaymentReceiptArgs,
  PaymentReceiptResult,
  BlockUserArgs,
  BlockUserResult,
  UnblockUserArgs,
  UnblockUserResult,
  MuteUserArgs,
  MuteUserResult,
  UnmuteUserArgs,
  UnmuteUserResult,
  ReportUserArgs,
  ReportUserResult,
  ReportPostArgs,
  ReportPostResult,
  GetBlocksArgs,
  GetBlocksResult,
  GetMutesArgs,
  GetMutesResult,
  CheckBlockStatusArgs,
  CheckBlockStatusResult,
  CheckMuteStatusArgs,
  CheckMuteStatusResult,
  CreateEscrowPaymentArgs,
  CreateEscrowPaymentResult,
  VerifyEscrowPaymentArgs,
  VerifyEscrowPaymentResult,
  RefundEscrowPaymentArgs,
  RefundEscrowPaymentResult,
  ListEscrowPaymentsArgs,
  ListEscrowPaymentsResult,
  AppealBanArgs,
  AppealBanResult,
  AppealBanWithEscrowArgs,
  AppealBanWithEscrowResult,
  FavoriteProfileArgs,
  FavoriteProfileResult,
  UnfavoriteProfileArgs,
  UnfavoriteProfileResult,
  GetFavoritesArgs,
  GetFavoritesResult,
  GetFavoritePostsArgs,
  GetFavoritePostsResult,
  TransferPointsArgs,
  TransferPointsResult,
  MCPToolResult,
} from '../types/mcp';
import {
  validateGetMarketsArgs,
  validatePlaceBetArgs,
  validateGetBalanceArgs,
  validateGetPositionsArgs,
  validateClosePositionArgs,
  validateGetMarketDataArgs,
  validateQueryFeedArgs,
  validateBuySharesArgs,
  validateSellSharesArgs,
  validateOpenPositionArgs,
  validateGetMarketPricesArgs,
  validateGetPerpetualsArgs,
  validateGetTradesArgs,
  validateGetTradeHistoryArgs,
  validateCreatePostArgs,
  validateDeletePostArgs,
  validateLikePostArgs,
  validateUnlikePostArgs,
  validateSharePostArgs,
  validateGetCommentsArgs,
  validateCreateCommentArgs,
  validateDeleteCommentArgs,
  validateLikeCommentArgs,
  validateGetPostsByTagArgs,
  validateGetUserProfileArgs,
  validateUpdateProfileArgs,
  validateFollowUserArgs,
  validateUnfollowUserArgs,
  validateGetFollowersArgs,
  validateGetFollowingArgs,
  validateSearchUsersArgs,
  validateGetUserWalletArgs,
  validateGetUserStatsArgs,
  validateGetChatsArgs,
  validateGetChatMessagesArgs,
  validateSendMessageArgs,
  validateCreateGroupArgs,
  validateLeaveChatArgs,
  validateGetUnreadCountArgs,
  validateGetNotificationsArgs,
  validateMarkNotificationsReadArgs,
  validateGetGroupInvitesArgs,
  validateAcceptGroupInviteArgs,
  validateDeclineGroupInviteArgs,
  validateGetLeaderboardArgs,
  validateGetSystemStatsArgs,
  validateGetReferralCodeArgs,
  validateGetReferralsArgs,
  validateGetReferralStatsArgs,
  validateGetReputationArgs,
  validateGetReputationBreakdownArgs,
  validateGetTrendingTagsArgs,
  validateGetOrganizationsArgs,
  validatePaymentRequestArgs,
  validatePaymentReceiptArgs,
  validateBlockUserArgs,
  validateUnblockUserArgs,
  validateMuteUserArgs,
  validateUnmuteUserArgs,
  validateReportUserArgs,
  validateReportPostArgs,
  validateGetBlocksArgs,
  validateGetMutesArgs,
  validateCheckBlockStatusArgs,
  validateCheckMuteStatusArgs,
  validateCreateEscrowPaymentArgs,
  validateVerifyEscrowPaymentArgs,
  validateRefundEscrowPaymentArgs,
  validateListEscrowPaymentsArgs,
  validateAppealBanArgs,
  validateAppealBanWithEscrowArgs,
  validateFavoriteProfileArgs,
  validateUnfavoriteProfileArgs,
  validateGetFavoritesArgs,
  validateGetFavoritePostsArgs,
  validateTransferPointsArgs,
} from '../utils/tool-args-validation';
import {
  handleCreateEscrowPayment,
  handleVerifyEscrowPayment,
  handleRefundEscrowPayment,
  handleListEscrowPayments,
  handleAppealBanWithEscrow,
} from '@babylon/a2a';
import type { JsonRpcRequest, JsonRpcParams } from '@babylon/a2a';

/**
 * Execute get_markets tool
 */
export async function executeGetMarkets(
  args: GetMarketsArgs,
  agent: AuthenticatedAgent
): Promise<GetMarketsResult> {
  logger.debug(
    `Agent ${agent.agentId} requesting markets (type: ${args.type || 'all'})`,
    undefined,
    'MCP'
  );

  const where: { resolved?: boolean } = {};
  if (args.type === 'prediction') {
    // Only prediction markets
  } else if (args.type === 'perpetuals') {
    // Only perpetuals (not implemented yet)
    return { markets: [] };
  }

  const markets = await db.market.findMany({
    where: {
      resolved: false,
      ...where,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return {
    markets: markets.map((m) => ({
      id: m.id,
      question: m.question,
      yesShares: m.yesShares.toString(),
      noShares: m.noShares.toString(),
      liquidity: m.liquidity.toString(),
      endDate: m.endDate.toISOString(),
    })),
  };
}

/**
 * Execute place_bet tool
 */
export async function executePlaceBet(
  agent: AuthenticatedAgent,
  args: PlaceBetArgs
): Promise<PlaceBetResult> {
  logger.info(`Agent ${agent.agentId} placing bet:`, args, 'MCP');

  // Call the existing market API logic
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/markets/${args.marketId}/bet`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: agent.userId,
        side: args.side,
        amount: args.amount,
      }),
    }
  );

  const result = (await response.json()) as PlaceBetResult;
  return result;
}

/**
 * Execute get_balance tool
 */
export async function executeGetBalance(
  agent: AuthenticatedAgent
): Promise<GetBalanceResult> {
  const [user] = await db
    .select({
      virtualBalance: users.virtualBalance,
      lifetimePnL: users.lifetimePnL,
    })
    .from(users)
    .where(eq(users.id, agent.userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    balance: user.virtualBalance.toString(),
    lifetimePnL: user.lifetimePnL.toString(),
  };
}

/**
 * Execute get_positions tool
 */
export async function executeGetPositions(
  agent: AuthenticatedAgent,
  args: GetPositionsArgs
): Promise<GetPositionsResult> {
  const where: {
    userId: { equals: string };
    marketId?: { equals: string };
  } = {
    userId: { equals: agent.userId },
  };

  if (args.marketId) {
    where.marketId = { equals: args.marketId };
  }

  const positionsRaw = await db.position.findMany({
    where,
    take: args.limit,
    skip: args.offset,
  });

  // Get markets separately
  const marketIds = positionsRaw
    .map((p) => p.marketId)
    .filter((id): id is string => !!id);
  const markets =
    marketIds.length > 0
      ? await db.market.findMany({
          where: { id: { in: marketIds } },
          select: { id: true, question: true },
        })
      : [];

  const marketsMap = new Map(markets.map((m) => [m.id, m]));

  return {
    positions: positionsRaw.map((p) => ({
      id: p.id,
      marketId: p.marketId,
      question: marketsMap.get(p.marketId)?.question ?? null,
      side: p.side ? 'YES' : 'NO',
      shares: p.shares.toString(),
      avgPrice: p.avgPrice.toString(),
    })),
  };
}

/**
 * Execute close_position tool
 */
export async function executeClosePosition(
  agent: AuthenticatedAgent,
  args: ClosePositionArgs
): Promise<ClosePositionResult> {
  logger.info(`Agent ${agent.agentId} closing position:`, args, 'MCP');

  // Call the existing close position API logic
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/positions/${args.positionId}/close`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: agent.userId,
      }),
    }
  );

  const result = (await response.json()) as ClosePositionResult;
  return result;
}

/**
 * Execute get_market_data tool
 */
export async function executeGetMarketData(
  agent: AuthenticatedAgent,
  args: GetMarketDataArgs
): Promise<GetMarketDataResult> {
  logger.debug(
    `Agent ${agent.agentId} requesting market data for ${args.marketId}`,
    undefined,
    'MCP'
  );

  const market = await db.market.findUnique({
    where: { id: args.marketId },
  });

  if (!market) {
    throw new Error('Market not found');
  }

  return {
    id: market.id,
    question: market.question,
    description: market.description,
    yesShares: market.yesShares.toString(),
    noShares: market.noShares.toString(),
    liquidity: market.liquidity.toString(),
    resolved: market.resolved,
    resolution: market.resolution,
    endDate: market.endDate.toISOString(),
  };
}

/**
 * Execute query_feed tool
 */
export async function executeQueryFeed(
  agent: AuthenticatedAgent,
  args: QueryFeedArgs
): Promise<QueryFeedResult> {
  logger.debug(`Agent ${agent.agentId} querying feed`, args, 'MCP');

  const now = new Date();
  const posts = await db.post.findMany({
    where: args.questionId
      ? {
          // Filter by question if provided
          // Note: questionId might need to be mapped from market/question
          deletedAt: null, // Filter out deleted posts
          timestamp: { lte: now }, // ✅ No future posts
        }
      : {
          deletedAt: null, // Filter out deleted posts
          timestamp: { lte: now }, // ✅ No future posts
        },
    orderBy: { timestamp: 'desc' },
    take: args.limit || 20,
  });

  return {
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      authorId: p.authorId,
      timestamp: p.timestamp.toISOString(),
    })),
  };
}

// ============================================================================
// Market Operations - Additional Handlers
// ============================================================================

/**
 * Execute buy_shares tool
 */
export async function executeBuyShares(
  agent: AuthenticatedAgent,
  args: BuySharesArgs
): Promise<BuySharesResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/markets/predictions/${args.marketId}/buy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: agent.userId,
        outcome: args.outcome,
        amount: args.amount,
      }),
    }
  );
  return (await response.json()) as BuySharesResult;
}

/**
 * Execute sell_shares tool
 */
export async function executeSellShares(
  agent: AuthenticatedAgent,
  args: SellSharesArgs
): Promise<SellSharesResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const position = await db.position.findUnique({
    where: { id: args.positionId },
  });
  if (!position || position.userId !== agent.userId) {
    throw new Error('Position not found or access denied');
  }
  const response = await fetch(
    `${apiBaseUrl}/api/markets/predictions/${position.marketId}/sell`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: agent.userId,
        shares: args.shares,
      }),
    }
  );
  return (await response.json()) as SellSharesResult;
}

/**
 * Execute open_position tool
 */
export async function executeOpenPosition(
  agent: AuthenticatedAgent,
  args: OpenPositionArgs
): Promise<OpenPositionResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/markets/perps/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: agent.userId,
      ticker: args.ticker,
      side: args.side,
      amount: args.amount,
      leverage: args.leverage,
    }),
  });
  return (await response.json()) as OpenPositionResult;
}

/**
 * Execute get_market_prices tool
 */
export async function executeGetMarketPrices(
  _agent: AuthenticatedAgent,
  args: GetMarketPricesArgs
): Promise<GetMarketPricesResult> {
  const market = await db.market.findUnique({
    where: { id: args.marketId },
  });
  if (!market) {
    throw new Error('Market not found');
  }
  const totalShares = Number(market.yesShares) + Number(market.noShares);
  const yesPrice = totalShares > 0 ? Number(market.yesShares) / totalShares : 0.5;
  const noPrice = totalShares > 0 ? Number(market.noShares) / totalShares : 0.5;
  return {
    marketId: market.id,
    yesPrice,
    noPrice,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Execute get_perpetuals tool
 */
export async function executeGetPerpetuals(
  _agent: AuthenticatedAgent,
  _args: GetPerpetualsArgs
): Promise<GetPerpetualsResult> {
  // Perpetuals not fully implemented yet
  return { markets: [] };
}

/**
 * Execute get_trades tool
 */
export async function executeGetTrades(
  _agent: AuthenticatedAgent,
  args: GetTradesArgs
): Promise<GetTradesResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const url = new URL(`${apiBaseUrl}/api/trades`);
  if (args.marketId) url.searchParams.set('marketId', args.marketId);
  if (args.limit) url.searchParams.set('limit', args.limit.toString());
  const response = await fetch(url.toString());
  const data = (await response.json()) as { trades: unknown[] };
  return {
    trades: data.trades.map((t: unknown) => {
      const trade = t as {
        id: string;
        marketId: string;
        userId: string;
        side: boolean;
        shares: string;
        price: string;
        timestamp: Date | string;
      };
      return {
        id: trade.id,
        marketId: trade.marketId,
        userId: trade.userId,
        side: trade.side ? 'YES' : 'NO',
        shares: trade.shares,
        price: trade.price,
        timestamp:
          trade.timestamp instanceof Date
            ? trade.timestamp.toISOString()
            : trade.timestamp,
      };
    }),
  };
}

/**
 * Execute get_trade_history tool
 */
export async function executeGetTradeHistory(
  _agent: AuthenticatedAgent,
  args: GetTradeHistoryArgs
): Promise<GetTradeHistoryResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const url = new URL(`${apiBaseUrl}/api/markets/predictions/${args.userId}/trades`);
  if (args.limit) url.searchParams.set('limit', args.limit.toString());
  const response = await fetch(url.toString());
  const data = (await response.json()) as { trades: unknown[] };
  return {
    trades: data.trades.map((t: unknown) => {
      const trade = t as {
        id: string;
        marketId: string;
        side: boolean;
        shares: string;
        price: string;
        timestamp: Date | string;
      };
      return {
        id: trade.id,
        marketId: trade.marketId,
        side: trade.side ? 'YES' : 'NO',
        shares: trade.shares,
        price: trade.price,
        timestamp:
          trade.timestamp instanceof Date
            ? trade.timestamp.toISOString()
            : trade.timestamp,
      };
    }),
  };
}

// ============================================================================
// Social Features - Handlers
// ============================================================================

/**
 * Execute create_post tool
 */
export async function executeCreatePost(
  agent: AuthenticatedAgent,
  args: CreatePostArgs
): Promise<CreatePostResult> {
  const postId = await generateSnowflakeId();
  const post = await db.post.create({
    data: {
      id: postId,
      content: args.content,
      authorId: agent.userId,
      type: args.type || 'post',
      timestamp: new Date(),
    },
  });
  return {
    success: true,
    postId: post.id,
    content: post.content,
  };
}

/**
 * Execute delete_post tool
 */
export async function executeDeletePost(
  agent: AuthenticatedAgent,
  args: DeletePostArgs
): Promise<DeletePostResult> {
  const post = await db.post.findUnique({ where: { id: args.postId } });
  if (!post) {
    throw new Error('Post not found');
  }
  if (post.authorId !== agent.userId) {
    throw new Error('Unauthorized: You can only delete your own posts');
  }
  await db.post.update({
    where: { id: args.postId },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}

/**
 * Execute like_post tool
 */
export async function executeLikePost(
  agent: AuthenticatedAgent,
  args: LikePostArgs
): Promise<LikePostResult> {
  const existing = await db.reaction.findFirst({
    where: {
      postId: args.postId,
      userId: agent.userId,
      type: 'like',
    },
  });
  if (existing) {
    return { success: true, liked: true };
  }
  await db.reaction.create({
    data: {
      id: await generateSnowflakeId(),
      postId: args.postId,
      userId: agent.userId,
      type: 'like',
    },
  });
  return { success: true, liked: true };
}

/**
 * Execute unlike_post tool
 */
export async function executeUnlikePost(
  agent: AuthenticatedAgent,
  args: UnlikePostArgs
): Promise<UnlikePostResult> {
  // agent used implicitly for userId in deleteMany where clause
  await db.reaction.deleteMany({
    where: {
      postId: args.postId,
      userId: agent.userId,
      type: 'like',
    },
  });
  return { success: true };
}

/**
 * Execute share_post tool
 */
export async function executeSharePost(
  agent: AuthenticatedAgent,
  args: SharePostArgs
): Promise<SharePostResult> {
  const shareId = await generateSnowflakeId();
  await db.share.create({
    data: {
      id: shareId,
      userId: agent.userId,
      postId: args.postId,
    },
  });
  return { success: true, shareId };
}

/**
 * Execute get_comments tool
 */
export async function executeGetComments(
  _agent: AuthenticatedAgent,
  args: GetCommentsArgs
): Promise<GetCommentsResult> {
  const commentsList = await db.comment.findMany({
    where: {
      postId: args.postId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: args.limit || 50,
  });
  const commentIds = commentsList.map((c) => c.id);
  const reactionsList = await db.reaction.findMany({
    where: {
      commentId: { in: commentIds },
      type: 'like',
    },
  });
  const likesMap = new Map<string, number>();
  for (const reaction of reactionsList) {
    if (reaction.commentId) {
      likesMap.set(
        reaction.commentId,
        (likesMap.get(reaction.commentId) || 0) + 1
      );
    }
  }
  return {
    comments: commentsList.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      content: c.content,
      timestamp: c.createdAt.toISOString(),
      likes: likesMap.get(c.id) || 0,
    })),
  };
}

/**
 * Execute create_comment tool
 */
export async function executeCreateComment(
  agent: AuthenticatedAgent,
  args: CreateCommentArgs
): Promise<CreateCommentResult> {
  const commentId = await generateSnowflakeId();
  const comment = await db.comment.create({
    data: {
      id: commentId,
      postId: args.postId,
      authorId: agent.userId,
      content: args.content,
      updatedAt: new Date(),
    },
  });
  return {
    success: true,
    commentId: comment.id,
    content: comment.content,
  };
}

/**
 * Execute delete_comment tool
 */
export async function executeDeleteComment(
  agent: AuthenticatedAgent,
  args: DeleteCommentArgs
): Promise<DeleteCommentResult> {
  const comment = await db.comment.findUnique({
    where: { id: args.commentId },
  });
  if (!comment) {
    throw new Error('Comment not found');
  }
  if (comment.authorId !== agent.userId) {
    throw new Error('Unauthorized: You can only delete your own comments');
  }
  await db.comment.update({
    where: { id: args.commentId },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}

/**
 * Execute like_comment tool
 */
export async function executeLikeComment(
  agent: AuthenticatedAgent,
  args: LikeCommentArgs
): Promise<LikeCommentResult> {
  const existing = await db.reaction.findFirst({
    where: {
      commentId: args.commentId,
      userId: agent.userId,
      type: 'like',
    },
  });
  if (!existing) {
    await db.reaction.create({
      data: {
        id: await generateSnowflakeId(),
        commentId: args.commentId,
        userId: agent.userId,
        type: 'like',
      },
    });
  }
  return { success: true };
}

/**
 * Execute get_posts_by_tag tool
 */
export async function executeGetPostsByTag(
  _agent: AuthenticatedAgent,
  args: GetPostsByTagArgs
): Promise<GetPostsByTagResult> {
  const tag = await db.tag.findFirst({
    where: { name: args.tag },
  });
  if (!tag) {
    return { posts: [] };
  }
  const postTagsList = await db.postTag.findMany({
    where: { tagId: tag.id },
    take: args.limit || 20,
    skip: args.offset || 0,
    orderBy: { createdAt: 'desc' },
  });
  const postIds = postTagsList.map((pt) => pt.postId);
  const postsList = await db.post.findMany({
    where: {
      id: { in: postIds },
      deletedAt: null,
    },
    orderBy: { timestamp: 'desc' },
  });
  return {
    posts: postsList.map((p) => ({
      id: p.id,
      content: p.content,
      authorId: p.authorId,
      timestamp: p.timestamp.toISOString(),
    })),
  };
}

// ============================================================================
// User Management - Handlers
// ============================================================================

/**
 * Execute get_user_profile tool
 */
export async function executeGetUserProfile(
  _agent: AuthenticatedAgent,
  args: GetUserProfileArgs
): Promise<GetUserProfileResult> {
  const user = await db.user.findUnique({
    where: { id: args.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      profileImageUrl: true,
      reputationPoints: true,
      virtualBalance: true,
    },
  });
  if (!user) {
    throw new Error('User not found');
  }
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    profileImageUrl: user.profileImageUrl,
    reputationPoints: Number(user.reputationPoints || 0),
    virtualBalance: user.virtualBalance.toString(),
  };
}

/**
 * Execute update_profile tool
 */
export async function executeUpdateProfile(
  agent: AuthenticatedAgent,
  args: UpdateProfileArgs
): Promise<UpdateProfileResult> {
  const updateData: {
    displayName?: string;
    bio?: string;
    username?: string;
    profileImageUrl?: string;
  } = {};
  if (args.displayName !== undefined) updateData.displayName = args.displayName;
  if (args.bio !== undefined) updateData.bio = args.bio;
  if (args.username !== undefined) updateData.username = args.username;
  if (args.profileImageUrl !== undefined)
    updateData.profileImageUrl = args.profileImageUrl;
  const user = await db.user.update({
    where: { id: agent.userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      profileImageUrl: true,
      reputationPoints: true,
      virtualBalance: true,
    },
  });
  return {
    success: true,
    profile: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      reputationPoints: Number(user.reputationPoints || 0),
      virtualBalance: user.virtualBalance.toString(),
    },
  };
}

/**
 * Execute follow_user tool
 */
export async function executeFollowUser(
  agent: AuthenticatedAgent,
  args: FollowUserArgs
): Promise<FollowUserResult> {
  if (args.userId === agent.userId) {
    throw new Error('Cannot follow yourself');
  }
  const existing = await db.follow.findFirst({
    where: {
      followerId: agent.userId,
      followingId: args.userId,
    },
  });
  if (existing) {
    return { success: true };
  }
  await db.follow.create({
    data: {
      id: await generateSnowflakeId(),
      followerId: agent.userId,
      followingId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute unfollow_user tool
 */
export async function executeUnfollowUser(
  agent: AuthenticatedAgent,
  args: UnfollowUserArgs
): Promise<UnfollowUserResult> {
  await db.follow.deleteMany({
    where: {
      followerId: agent.userId,
      followingId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute get_followers tool
 */
export async function executeGetFollowers(
  _agent: AuthenticatedAgent,
  args: GetFollowersArgs
): Promise<GetFollowersResult> {
  const followersList = await db.follow.findMany({
    where: { followingId: args.userId },
    take: args.limit || 50,
    orderBy: { createdAt: 'desc' },
  });
  const followerIds = followersList.map((f) => f.followerId);
  const usersList = await db.user.findMany({
    where: { id: { in: followerIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
    },
  });
  const usersMap = new Map(usersList.map((u) => [u.id, u]));
  return {
    followers: followersList.map((f) => {
      const user = usersMap.get(f.followerId);
      return {
        id: f.followerId,
        username: user?.username || null,
        displayName: user?.displayName || null,
        profileImageUrl: user?.profileImageUrl || null,
      };
    }),
  };
}

/**
 * Execute get_following tool
 */
export async function executeGetFollowing(
  _agent: AuthenticatedAgent,
  args: GetFollowingArgs
): Promise<GetFollowingResult> {
  const followingList = await db.follow.findMany({
    where: { followerId: args.userId },
    take: args.limit || 50,
    orderBy: { createdAt: 'desc' },
  });
  const followingIds = followingList.map((f) => f.followingId);
  const usersList = await db.user.findMany({
    where: { id: { in: followingIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
    },
  });
  const usersMap = new Map(usersList.map((u) => [u.id, u]));
  return {
    following: followingList.map((f) => {
      const user = usersMap.get(f.followingId);
      return {
        id: f.followingId,
        username: user?.username || null,
        displayName: user?.displayName || null,
        profileImageUrl: user?.profileImageUrl || null,
      };
    }),
  };
}

/**
 * Execute search_users tool
 */
export async function executeSearchUsers(
  _agent: AuthenticatedAgent,
  args: SearchUsersArgs
): Promise<SearchUsersResult> {
  const usersList = await db.user.findMany({
    where: {
      OR: [
        { username: { contains: args.query, mode: 'insensitive' } },
        { displayName: { contains: args.query, mode: 'insensitive' } },
      ],
    },
    take: args.limit || 20,
    select: {
      id: true,
      username: true,
      displayName: true,
      reputationPoints: true,
    },
  });
  return {
    users: usersList.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      reputationPoints: Number(u.reputationPoints || 0),
    })),
  };
}

/**
 * Execute get_user_wallet tool
 */
export async function executeGetUserWallet(
  _agent: AuthenticatedAgent,
  args: GetUserWalletArgs
): Promise<GetUserWalletResult> {
  const user = await db.user.findUnique({
    where: { id: args.userId },
    select: {
      walletAddress: true,
      virtualBalance: true,
      totalDeposited: true,
      totalWithdrawn: true,
    },
  });
  if (!user) {
    throw new Error('User not found');
  }
  return {
    walletAddress: user.walletAddress,
    virtualBalance: user.virtualBalance.toString(),
    totalDeposited: user.totalDeposited.toString(),
    totalWithdrawn: user.totalWithdrawn.toString(),
  };
}

/**
 * Execute get_user_stats tool
 */
export async function executeGetUserStats(
  _agent: AuthenticatedAgent,
  args: GetUserStatsArgs
): Promise<GetUserStatsResult> {
  const [user, postsCount, commentsCount, reactionsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: args.userId },
      select: {
        reputationPoints: true,
        virtualBalance: true,
        lifetimePnL: true,
      },
    }),
    db.post.count({
      where: { authorId: args.userId, deletedAt: null },
    }),
    db.comment.count({
      where: { authorId: args.userId, deletedAt: null },
    }),
    db.reaction.count({
      where: { userId: args.userId, type: 'like' },
    }),
  ]);
  if (!user) {
    throw new Error('User not found');
  }
  return {
    totalPosts: postsCount,
    totalComments: commentsCount,
    totalLikes: reactionsCount,
    reputationPoints: Number(user.reputationPoints || 0),
    virtualBalance: user.virtualBalance.toString(),
    lifetimePnL: user.lifetimePnL.toString(),
  };
}

// ============================================================================
// Chats & Messaging - Handlers
// ============================================================================

/**
 * Execute get_chats tool
 */
export async function executeGetChats(
  agent: AuthenticatedAgent,
  _args: GetChatsArgs
): Promise<GetChatsResult> {
  // Get all chats where user is a participant
  const participants = await db.chatParticipant.findMany({
    where: {
      userId: agent.userId,
      isActive: true,
    },
    select: { chatId: true },
  });
  const participantChatIds = participants.map((p) => p.chatId);
  const chatsList =
    participantChatIds.length > 0
      ? await db.chat.findMany({
          where: { id: { in: participantChatIds } },
        })
      : [];
  const chatIds = chatsList.map((c) => c.id);
  const lastMessages = await Promise.all(
    chatIds.map(async (chatId) => {
      const lastMessage = await db.message.findFirst({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
      });
      return { chatId, lastMessage };
    })
  );
  // For now, return 0 unread count (read tracking not implemented in schema)
  const unreadCounts = chatIds.map((chatId) => ({ chatId, count: 0 }));
  const unreadMap = new Map(unreadCounts.map((u) => [u.chatId, u.count]));
  const lastMessageMap = new Map(
    lastMessages.map((lm) => [lm.chatId, lm.lastMessage])
  );
  return {
    chats: chatsList.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.isGroup ? ('group' as const) : ('dm' as const),
      lastMessageAt: lastMessageMap.get(c.id)?.createdAt.toISOString() || null,
      unreadCount: unreadMap.get(c.id) || 0,
    })),
  };
}

/**
 * Execute get_chat_messages tool
 */
export async function executeGetChatMessages(
  _agent: AuthenticatedAgent,
  args: GetChatMessagesArgs
): Promise<GetChatMessagesResult> {
  const messagesList = await db.message.findMany({
    where: { chatId: args.chatId },
    orderBy: { createdAt: 'desc' },
    take: args.limit || 50,
    skip: args.offset || 0,
  });
  return {
    messages: messagesList.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      authorId: m.senderId,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    })),
  };
}

/**
 * Execute send_message tool
 */
export async function executeSendMessage(
  agent: AuthenticatedAgent,
  args: SendMessageArgs
): Promise<SendMessageResult> {
  const messageId = await generateSnowflakeId();
  const message = await db.message.create({
    data: {
      id: messageId,
      chatId: args.chatId,
      senderId: agent.userId,
      content: args.content,
    },
  });
  return {
    success: true,
    messageId: message.id,
  };
}

/**
 * Execute create_group tool
 */
export async function executeCreateGroup(
  agent: AuthenticatedAgent,
  args: CreateGroupArgs
): Promise<CreateGroupResult> {
  const chatId = await generateSnowflakeId();
  const chat = await db.chat.create({
    data: {
      id: chatId,
      name: args.name,
      description: args.description,
      isGroup: true,
      createdBy: agent.userId,
      updatedAt: new Date(),
    },
  });
  const participantIds = await Promise.all([
    generateSnowflakeId(),
    ...args.memberIds.map(() => generateSnowflakeId()),
  ]);
  await db.chatParticipant.createMany({
    data: [
      { id: participantIds[0]!, chatId, userId: agent.userId },
      ...args.memberIds.map((memberId, idx) => ({
        id: participantIds[idx + 1]!,
        chatId,
        userId: memberId,
      })),
    ],
  });
  return {
    success: true,
    chatId: chat.id,
    name: chat.name || '',
  };
}

/**
 * Execute leave_chat tool
 */
export async function executeLeaveChat(
  agent: AuthenticatedAgent,
  args: LeaveChatArgs
): Promise<LeaveChatResult> {
  // agent used for userId in updateMany where clause
  await db.chatParticipant.updateMany({
    where: {
      chatId: args.chatId,
      userId: agent.userId,
    },
    data: { isActive: false },
  });
  return { success: true };
}

/**
 * Execute get_unread_count tool
 */
export async function executeGetUnreadCount(
  _agent: AuthenticatedAgent,
  _args: GetUnreadCountArgs
): Promise<GetUnreadCountResult> {
  // Read tracking not implemented in schema yet, return 0
  return { unreadCount: 0 };
}

// ============================================================================
// Notifications - Handlers
// ============================================================================

/**
 * Execute get_notifications tool
 */
export async function executeGetNotifications(
  agent: AuthenticatedAgent,
  args: GetNotificationsArgs
): Promise<GetNotificationsResult> {
  const notificationsList = await db.notification.findMany({
    where: { userId: agent.userId },
    orderBy: { createdAt: 'desc' },
    take: args.limit || 100,
  });
  return {
    notifications: notificationsList.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: n.read,
      timestamp: n.createdAt.toISOString(),
    })),
  };
}

/**
 * Execute mark_notifications_read tool
 */
export async function executeMarkNotificationsRead(
  agent: AuthenticatedAgent,
  args: MarkNotificationsReadArgs
): Promise<MarkNotificationsReadResult> {
  await db.notification.updateMany({
    where: {
      id: { in: args.notificationIds },
      userId: agent.userId,
    },
    data: { read: true },
  });
  return {
    success: true,
    markedCount: args.notificationIds.length,
  };
}

/**
 * Execute get_group_invites tool
 */
export async function executeGetGroupInvites(
  agent: AuthenticatedAgent,
  _args: GetGroupInvitesArgs
): Promise<GetGroupInvitesResult> {
  const invitesList = await db.chatInvite.findMany({
    where: {
      invitedUserId: agent.userId,
      status: 'pending',
    },
  });
  const chatIds = invitesList.map((inv) => inv.chatId);
  const chatsMap = new Map(
    (
      await db.chat.findMany({
        where: { id: { in: chatIds } },
        select: { id: true, name: true },
      })
    ).map((c) => [c.id, c])
  );
  return {
    invites: invitesList.map((invite) => ({
      id: invite.id,
      groupId: invite.chatId,
      groupName: chatsMap.get(invite.chatId)?.name || null,
      inviterId: invite.invitedBy,
      timestamp: invite.invitedAt.toISOString(),
    })),
  };
}

/**
 * Execute accept_group_invite tool
 */
export async function executeAcceptGroupInvite(
  agent: AuthenticatedAgent,
  args: AcceptGroupInviteArgs
): Promise<AcceptGroupInviteResult> {
  const invite = await db.chatInvite.findUnique({
    where: { id: args.inviteId },
  });
  if (!invite || invite.invitedUserId !== agent.userId) {
    throw new Error('Invite not found or access denied');
  }
  await db.chatInvite.update({
    where: { id: args.inviteId },
    data: { status: 'accepted' },
  });
  await db.chatParticipant.create({
    data: {
      id: await generateSnowflakeId(),
      chatId: invite.chatId,
      userId: agent.userId,
      invitedBy: invite.invitedBy,
    },
  });
  return {
    success: true,
    chatId: invite.chatId,
  };
}

/**
 * Execute decline_group_invite tool
 */
export async function executeDeclineGroupInvite(
  agent: AuthenticatedAgent,
  args: DeclineGroupInviteArgs
): Promise<DeclineGroupInviteResult> {
  const invite = await db.chatInvite.findUnique({
    where: { id: args.inviteId },
  });
  if (!invite || invite.invitedUserId !== agent.userId) {
    throw new Error('Invite not found or access denied');
  }
  await db.chatInvite.update({
    where: { id: args.inviteId },
    data: { status: 'declined' },
  });
  return { success: true };
}

// ============================================================================
// Leaderboard & Stats - Handlers
// ============================================================================

/**
 * Execute get_leaderboard tool
 */
export async function executeGetLeaderboard(
  _agent: AuthenticatedAgent,
  args: GetLeaderboardArgs
): Promise<GetLeaderboardResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const url = new URL(`${apiBaseUrl}/api/leaderboard`);
  if (args.page) url.searchParams.set('page', args.page.toString());
  if (args.pageSize) url.searchParams.set('pageSize', args.pageSize.toString());
  if (args.pointsType) url.searchParams.set('pointsType', args.pointsType);
  if (args.minPoints) url.searchParams.set('minPoints', args.minPoints.toString());
  const response = await fetch(url.toString());
  const data = (await response.json()) as {
    leaderboard: Array<{
      rank: number;
      userId: string;
      username: string | null;
      displayName: string | null;
      points: number;
    }>;
    pagination: { page: number; pageSize: number; total: number };
  };
  return data;
}

/**
 * Execute get_system_stats tool
 */
export async function executeGetSystemStats(
  _agent: AuthenticatedAgent,
  _args: GetSystemStatsArgs
): Promise<GetSystemStatsResult> {
  const [userCount, postCount, marketCount, activeMarketCount] =
    await Promise.all([
      db.user.count(),
      db.post.count({ where: { deletedAt: null } }),
      db.market.count(),
      db.market.count({ where: { resolved: false } }),
    ]);
  return {
    users: userCount,
    posts: postCount,
    markets: marketCount,
    activeMarkets: activeMarketCount,
  };
}

// ============================================================================
// Referrals & Rewards - Handlers
// ============================================================================

/**
 * Execute get_referral_code tool
 */
export async function executeGetReferralCode(
  agent: AuthenticatedAgent,
  _args: GetReferralCodeArgs
): Promise<GetReferralCodeResult> {
  const user = await db.user.findUnique({
    where: { id: agent.userId },
    select: { referralCode: true },
  });
  if (!user || !user.referralCode) {
    throw new Error('Referral code not found');
  }
  return { referralCode: user.referralCode };
}

/**
 * Execute get_referrals tool
 */
export async function executeGetReferrals(
  agent: AuthenticatedAgent,
  _args: GetReferralsArgs
): Promise<GetReferralsResult> {
  const referralsList = await db.referral.findMany({
    where: { referrerId: agent.userId },
    orderBy: { createdAt: 'desc' },
  });
  const referredUserIds = referralsList
    .map((r) => r.referredUserId)
    .filter((id): id is string => id !== null);
  const usersList = await db.user.findMany({
    where: { id: { in: referredUserIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });
  const usersMap = new Map(usersList.map((u) => [u.id, u]));
  return {
    referrals: referralsList
      .filter((r) => r.referredUserId !== null)
      .map((r) => {
        const user = usersMap.get(r.referredUserId!);
        return {
          id: r.id,
          referredUserId: r.referredUserId!,
          username: user?.username || null,
          displayName: user?.displayName || null,
          createdAt: r.createdAt.toISOString(),
        };
      }),
  };
}

/**
 * Execute get_referral_stats tool
 */
export async function executeGetReferralStats(
  agent: AuthenticatedAgent,
  _args: GetReferralStatsArgs
): Promise<GetReferralStatsResult> {
  const [user, referralsList] = await Promise.all([
    db.user.findUnique({
      where: { id: agent.userId },
      select: { referralCode: true },
    }),
    db.referral.findMany({
      where: { referrerId: agent.userId },
    }),
  ]);
  // Referrer earnings not in schema, return 0 for now
  const totalEarnings = 0;
  return {
    totalReferrals: referralsList.length,
    totalEarnings,
    referralCode: user?.referralCode || '',
  };
}

// ============================================================================
// Reputation - Handlers
// ============================================================================

/**
 * Execute get_reputation tool
 */
export async function executeGetReputation(
  agent: AuthenticatedAgent,
  args: GetReputationArgs
): Promise<GetReputationResult> {
  const userId = args.userId || agent.userId;
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/reputation/${userId}`);
  const data = (await response.json()) as GetReputationResult;
  return data;
}

/**
 * Execute get_reputation_breakdown tool
 */
export async function executeGetReputationBreakdown(
  _agent: AuthenticatedAgent,
  args: GetReputationBreakdownArgs
): Promise<GetReputationBreakdownResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/reputation/breakdown/${args.userId}`
  );
  const data = (await response.json()) as GetReputationBreakdownResult;
  return data;
}

// ============================================================================
// Trending & Discovery - Handlers
// ============================================================================

/**
 * Execute get_trending_tags tool
 */
export async function executeGetTrendingTags(
  _agent: AuthenticatedAgent,
  args: GetTrendingTagsArgs
): Promise<GetTrendingTagsResult> {
  const trendingTagsList = await db.trendingTag.findMany({
    orderBy: { rank: 'asc' },
    take: args.limit || 20,
  });
  const tagIds = trendingTagsList.map((tt) => tt.tagId);
  const tagsList = await db.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true },
  });
  const tagsMap = new Map(tagsList.map((t) => [t.id, t]));
  return {
    tags: trendingTagsList.map((tt) => ({
      tag: tagsMap.get(tt.tagId)?.name || '',
      postCount: tt.postCount,
      trendScore: tt.score || 0,
    })),
  };
}

// ============================================================================
// Organizations - Handlers
// ============================================================================

/**
 * Execute get_organizations tool
 */
export async function executeGetOrganizations(
  _agent: AuthenticatedAgent,
  args: GetOrganizationsArgs
): Promise<GetOrganizationsResult> {
  const orgsList = await db.organization.findMany({
    take: args.limit || 50,
    orderBy: { createdAt: 'desc' },
  });
  return {
    organizations: orgsList.map((org) => ({
      id: org.id,
      name: org.name,
      description: org.description,
    })),
  };
}

// ============================================================================
// x402 Micropayments - Handlers
// ============================================================================

/**
 * Execute payment_request tool
 */
export async function executePaymentRequest(
  agent: AuthenticatedAgent,
  args: PaymentRequestArgs
): Promise<PaymentRequestResult> {
  // agent used for userId in request body
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/payments/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: args.from || agent.userId,
      to: args.to,
      amount: args.amount,
      service: args.service,
      metadata: args.metadata,
    }),
  });
  return (await response.json()) as PaymentRequestResult;
}

/**
 * Execute payment_receipt tool
 */
export async function executePaymentReceipt(
  _agent: AuthenticatedAgent,
  args: PaymentReceiptArgs
): Promise<PaymentReceiptResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/payments/receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: args.requestId,
      txHash: args.txHash,
    }),
  });
  return (await response.json()) as PaymentReceiptResult;
}

// ============================================================================
// Moderation - Handlers
// ============================================================================

/**
 * Execute block_user tool
 */
export async function executeBlockUser(
  agent: AuthenticatedAgent,
  args: BlockUserArgs
): Promise<BlockUserResult> {
  if (args.userId === agent.userId) {
    throw new Error('Cannot block yourself');
  }
  const existing = await db.userBlock.findFirst({
    where: {
      blockerId: agent.userId,
      blockedId: args.userId,
    },
  });
  if (existing) {
    return { success: true };
  }
  await db.userBlock.create({
    data: {
      id: await generateSnowflakeId(),
      blockerId: agent.userId,
      blockedId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute unblock_user tool
 */
export async function executeUnblockUser(
  agent: AuthenticatedAgent,
  args: UnblockUserArgs
): Promise<UnblockUserResult> {
  await db.userBlock.deleteMany({
    where: {
      blockerId: agent.userId,
      blockedId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute mute_user tool
 */
export async function executeMuteUser(
  agent: AuthenticatedAgent,
  args: MuteUserArgs
): Promise<MuteUserResult> {
  if (args.userId === agent.userId) {
    throw new Error('Cannot mute yourself');
  }
  const existing = await db.userMute.findFirst({
    where: {
      muterId: agent.userId,
      mutedId: args.userId,
    },
  });
  if (existing) {
    return { success: true };
  }
  await db.userMute.create({
    data: {
      id: await generateSnowflakeId(),
      muterId: agent.userId,
      mutedId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute unmute_user tool
 */
export async function executeUnmuteUser(
  agent: AuthenticatedAgent,
  args: UnmuteUserArgs
): Promise<UnmuteUserResult> {
  await db.userMute.deleteMany({
    where: {
      muterId: agent.userId,
      mutedId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute report_user tool
 */
export async function executeReportUser(
  agent: AuthenticatedAgent,
  args: ReportUserArgs
): Promise<ReportUserResult> {
  const reportId = await generateSnowflakeId();
  await db.report.create({
    data: {
      id: reportId,
      reporterId: agent.userId,
      reportedUserId: args.userId,
      reason: args.reason,
      reportType: 'user',
      category: 'moderation',
      updatedAt: new Date(),
    },
  });
  return { success: true, reportId };
}

/**
 * Execute report_post tool
 */
export async function executeReportPost(
  agent: AuthenticatedAgent,
  args: ReportPostArgs
): Promise<ReportPostResult> {
  const reportId = await generateSnowflakeId();
  await db.report.create({
    data: {
      id: reportId,
      reporterId: agent.userId,
      reportedPostId: args.postId,
      reason: args.reason,
      reportType: 'post',
      category: 'moderation',
      updatedAt: new Date(),
    },
  });
  return { success: true, reportId };
}

/**
 * Execute get_blocks tool
 */
export async function executeGetBlocks(
  agent: AuthenticatedAgent,
  _args: GetBlocksArgs
): Promise<GetBlocksResult> {
  const blocksList = await db.userBlock.findMany({
    where: { blockerId: agent.userId },
    orderBy: { createdAt: 'desc' },
  });
  const blockedIds = blocksList.map((b) => b.blockedId);
  const usersList = await db.user.findMany({
    where: { id: { in: blockedIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });
  const usersMap = new Map(usersList.map((u) => [u.id, u]));
  return {
    blockedUsers: blocksList.map((b) => {
      const user = usersMap.get(b.blockedId);
      return {
        userId: b.blockedId,
        username: user?.username || null,
        displayName: user?.displayName || null,
        blockedAt: b.createdAt.toISOString(),
      };
    }),
  };
}

/**
 * Execute get_mutes tool
 */
export async function executeGetMutes(
  agent: AuthenticatedAgent,
  _args: GetMutesArgs
): Promise<GetMutesResult> {
  const mutesList = await db.userMute.findMany({
    where: { muterId: agent.userId },
    orderBy: { createdAt: 'desc' },
  });
  const mutedIds = mutesList.map((m) => m.mutedId);
  const usersList = await db.user.findMany({
    where: { id: { in: mutedIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });
  const usersMap = new Map(usersList.map((u) => [u.id, u]));
  return {
    mutedUsers: mutesList.map((m) => {
      const user = usersMap.get(m.mutedId);
      return {
        userId: m.mutedId,
        username: user?.username || null,
        displayName: user?.displayName || null,
        mutedAt: m.createdAt.toISOString(),
      };
    }),
  };
}

/**
 * Execute check_block_status tool
 */
export async function executeCheckBlockStatus(
  agent: AuthenticatedAgent,
  args: CheckBlockStatusArgs
): Promise<CheckBlockStatusResult> {
  const block = await db.userBlock.findFirst({
    where: {
      blockerId: agent.userId,
      blockedId: args.userId,
    },
  });
  return {
    isBlocked: !!block,
    blockedAt: block?.createdAt.toISOString() || null,
  };
}

/**
 * Execute check_mute_status tool
 */
export async function executeCheckMuteStatus(
  agent: AuthenticatedAgent,
  args: CheckMuteStatusArgs
): Promise<CheckMuteStatusResult> {
  const mute = await db.userMute.findFirst({
    where: {
      muterId: agent.userId,
      mutedId: args.userId,
    },
  });
  return {
    isMuted: !!mute,
    mutedAt: mute?.createdAt.toISOString() || null,
  };
}

// ============================================================================
// Moderation Escrow - Handlers
// ============================================================================

/**
 * Execute create_escrow_payment tool
 */
export async function executeCreateEscrowPayment(
  agent: AuthenticatedAgent,
  args: CreateEscrowPaymentArgs
): Promise<CreateEscrowPaymentResult> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: 'a2a.createEscrowPayment',
    params: {
      recipientId: args.recipientId,
      amountUSD: args.amountUSD,
      reason: args.reason,
      recipientWalletAddress: args.recipientWalletAddress,
    } as JsonRpcParams,
    id: 1,
  };
  const response = await handleCreateEscrowPayment(agent.agentId, request);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result as unknown as CreateEscrowPaymentResult;
}

/**
 * Execute verify_escrow_payment tool
 */
export async function executeVerifyEscrowPayment(
  agent: AuthenticatedAgent,
  args: VerifyEscrowPaymentArgs
): Promise<VerifyEscrowPaymentResult> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: 'a2a.verifyEscrowPayment',
    params: {
      escrowId: args.escrowId,
      txHash: args.txHash,
      fromAddress: args.fromAddress,
      toAddress: args.toAddress,
      amount: args.amount,
    } as JsonRpcParams,
    id: 1,
  };
  const response = await handleVerifyEscrowPayment(agent.agentId, request);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result as unknown as VerifyEscrowPaymentResult;
}

/**
 * Execute refund_escrow_payment tool
 */
export async function executeRefundEscrowPayment(
  agent: AuthenticatedAgent,
  args: RefundEscrowPaymentArgs
): Promise<RefundEscrowPaymentResult> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: 'a2a.refundEscrowPayment',
    params: {
      escrowId: args.escrowId,
      refundTxHash: args.refundTxHash,
      reason: args.reason,
    } as JsonRpcParams,
    id: 1,
  };
  const response = await handleRefundEscrowPayment(agent.agentId, request);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result as unknown as RefundEscrowPaymentResult;
}

/**
 * Execute list_escrow_payments tool
 */
export async function executeListEscrowPayments(
  agent: AuthenticatedAgent,
  args: ListEscrowPaymentsArgs
): Promise<ListEscrowPaymentsResult> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: 'a2a.listEscrowPayments',
    params: {
      recipientId: args.recipientId,
      adminId: args.adminId,
      status: args.status,
      limit: args.limit,
      offset: args.offset,
    } as JsonRpcParams,
    id: 1,
  };
  const response = await handleListEscrowPayments(agent.agentId, request);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result as unknown as ListEscrowPaymentsResult;
}

// ============================================================================
// Ban Appeals - Handlers
// ============================================================================

/**
 * Execute appeal_ban tool
 */
export async function executeAppealBan(
  agent: AuthenticatedAgent,
  args: AppealBanArgs
): Promise<AppealBanResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/moderation/appeal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: agent.userId,
      reason: args.reason,
    }),
  });
  return (await response.json()) as AppealBanResult;
}

/**
 * Execute appeal_ban_with_escrow tool
 */
export async function executeAppealBanWithEscrow(
  agent: AuthenticatedAgent,
  args: AppealBanWithEscrowArgs
): Promise<AppealBanWithEscrowResult> {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: 'a2a.appealBanWithEscrow',
    params: {
      reason: args.reason,
      escrowPaymentTxHash: args.escrowPaymentTxHash,
    } as JsonRpcParams,
    id: 1,
  };
  const response = await handleAppealBanWithEscrow(agent.agentId, request);
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result as unknown as AppealBanWithEscrowResult;
}

// ============================================================================
// Favorites - Handlers
// ============================================================================

/**
 * Execute favorite_profile tool
 */
export async function executeFavoriteProfile(
  agent: AuthenticatedAgent,
  args: FavoriteProfileArgs
): Promise<FavoriteProfileResult> {
  if (args.userId === agent.userId) {
    throw new Error('Cannot favorite yourself');
  }
  const existing = await db.favorite.findFirst({
    where: {
      userId: agent.userId,
      targetUserId: args.userId,
    },
  });
  if (existing) {
    return { success: true };
  }
  await db.favorite.create({
    data: {
      id: await generateSnowflakeId(),
      userId: agent.userId,
      targetUserId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute unfavorite_profile tool
 */
export async function executeUnfavoriteProfile(
  agent: AuthenticatedAgent,
  args: UnfavoriteProfileArgs
): Promise<UnfavoriteProfileResult> {
  await db.favorite.deleteMany({
    where: {
      userId: agent.userId,
      targetUserId: args.userId,
    },
  });
  return { success: true };
}

/**
 * Execute get_favorites tool
 */
export async function executeGetFavorites(
  agent: AuthenticatedAgent,
  args: GetFavoritesArgs
): Promise<GetFavoritesResult> {
  const favoritesList = await db.favorite.findMany({
    where: { userId: agent.userId },
    take: args.limit || 50,
    skip: args.offset || 0,
    orderBy: { createdAt: 'desc' },
  });
  const targetUserIds = favoritesList.map((f) => f.targetUserId);
  const usersList = await db.user.findMany({
    where: { id: { in: targetUserIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
    },
  });
  const usersMap = new Map(usersList.map((u) => [u.id, u]));
  return {
    favorites: favoritesList.map((f) => {
      const user = usersMap.get(f.targetUserId);
      return {
        userId: f.targetUserId,
        username: user?.username || null,
        displayName: user?.displayName || null,
        profileImageUrl: user?.profileImageUrl || null,
        favoritedAt: f.createdAt.toISOString(),
      };
    }),
  };
}

/**
 * Execute get_favorite_posts tool
 */
export async function executeGetFavoritePosts(
  agent: AuthenticatedAgent,
  args: GetFavoritePostsArgs
): Promise<GetFavoritePostsResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const url = new URL(`${apiBaseUrl}/api/posts/feed/favorites`);
  if (args.limit) url.searchParams.set('limit', args.limit.toString());
  if (args.offset) url.searchParams.set('offset', args.offset.toString());
  const response = await fetch(url.toString(), {
    headers: { 'X-User-Id': agent.userId },
  });
  const data = (await response.json()) as { posts: unknown[] };
  return {
    posts: data.posts.map((p: unknown) => {
      const post = p as {
        id: string;
        content: string;
        authorId: string;
        timestamp: Date | string;
      };
      return {
        id: post.id,
        content: post.content,
        authorId: post.authorId,
        timestamp:
          post.timestamp instanceof Date
            ? post.timestamp.toISOString()
            : post.timestamp,
      };
    }),
  };
}

// ============================================================================
// Points Transfer - Handlers
// ============================================================================

/**
 * Execute transfer_points tool
 */
export async function executeTransferPoints(
  agent: AuthenticatedAgent,
  args: TransferPointsArgs
): Promise<TransferPointsResult> {
  const apiBaseUrl =
    getAPIBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/points/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromUserId: agent.userId,
      recipientId: args.recipientId,
      amount: args.amount,
      message: args.message,
    }),
  });
  const result = (await response.json()) as TransferPointsResult;
  return result;
}

// ============================================================================
// Tool Router
// ============================================================================

/**
 * Execute MCP tool by name
 */
export async function executeTool(
  toolName: string,
  args: StringRecord<JsonValue>,
  agent: AuthenticatedAgent
): Promise<MCPToolResult> {
  switch (toolName) {
    // Existing tools
    case 'get_markets': {
      const validatedArgs = validateGetMarketsArgs(args);
      return await executeGetMarkets(validatedArgs, agent);
    }
    case 'place_bet': {
      const validatedArgs = validatePlaceBetArgs(args);
      return await executePlaceBet(agent, validatedArgs);
    }
    case 'get_balance': {
      validateGetBalanceArgs(args);
      return await executeGetBalance(agent);
    }
    case 'get_positions': {
      const validatedArgs = validateGetPositionsArgs(args);
      return await executeGetPositions(agent, validatedArgs);
    }
    case 'close_position': {
      const validatedArgs = validateClosePositionArgs(args);
      return await executeClosePosition(agent, validatedArgs);
    }
    case 'get_market_data': {
      const validatedArgs = validateGetMarketDataArgs(args);
      return await executeGetMarketData(agent, validatedArgs);
    }
    case 'query_feed': {
      const validatedArgs = validateQueryFeedArgs(args);
      return await executeQueryFeed(agent, validatedArgs);
    }
    // Market Operations
    case 'buy_shares': {
      const validatedArgs = validateBuySharesArgs(args);
      return await executeBuyShares(agent, validatedArgs);
    }
    case 'sell_shares': {
      const validatedArgs = validateSellSharesArgs(args);
      return await executeSellShares(agent, validatedArgs);
    }
    case 'open_position': {
      const validatedArgs = validateOpenPositionArgs(args);
      return await executeOpenPosition(agent, validatedArgs);
    }
    case 'get_market_prices': {
      const validatedArgs = validateGetMarketPricesArgs(args);
      return await executeGetMarketPrices(agent, validatedArgs);
    }
    case 'get_perpetuals': {
      validateGetPerpetualsArgs(args);
      return await executeGetPerpetuals(agent, {} as GetPerpetualsArgs);
    }
    case 'get_trades': {
      const validatedArgs = validateGetTradesArgs(args);
      return await executeGetTrades(agent, validatedArgs);
    }
    case 'get_trade_history': {
      const validatedArgs = validateGetTradeHistoryArgs(args);
      return await executeGetTradeHistory(agent, validatedArgs);
    }
    // Social Features
    case 'create_post': {
      const validatedArgs = validateCreatePostArgs(args);
      return await executeCreatePost(agent, validatedArgs);
    }
    case 'delete_post': {
      const validatedArgs = validateDeletePostArgs(args);
      return await executeDeletePost(agent, validatedArgs);
    }
    case 'like_post': {
      const validatedArgs = validateLikePostArgs(args);
      return await executeLikePost(agent, validatedArgs);
    }
    case 'unlike_post': {
      const validatedArgs = validateUnlikePostArgs(args);
      return await executeUnlikePost(agent, validatedArgs);
    }
    case 'share_post': {
      const validatedArgs = validateSharePostArgs(args);
      return await executeSharePost(agent, validatedArgs);
    }
    case 'get_comments': {
      const validatedArgs = validateGetCommentsArgs(args);
      return await executeGetComments(agent, validatedArgs);
    }
    case 'create_comment': {
      const validatedArgs = validateCreateCommentArgs(args);
      return await executeCreateComment(agent, validatedArgs);
    }
    case 'delete_comment': {
      const validatedArgs = validateDeleteCommentArgs(args);
      return await executeDeleteComment(agent, validatedArgs);
    }
    case 'like_comment': {
      const validatedArgs = validateLikeCommentArgs(args);
      return await executeLikeComment(agent, validatedArgs);
    }
    case 'get_posts_by_tag': {
      const validatedArgs = validateGetPostsByTagArgs(args);
      return await executeGetPostsByTag(agent, validatedArgs);
    }
    // User Management
    case 'get_user_profile': {
      const validatedArgs = validateGetUserProfileArgs(args);
      return await executeGetUserProfile(agent, validatedArgs);
    }
    case 'update_profile': {
      const validatedArgs = validateUpdateProfileArgs(args);
      return await executeUpdateProfile(agent, validatedArgs);
    }
    case 'follow_user': {
      const validatedArgs = validateFollowUserArgs(args);
      return await executeFollowUser(agent, validatedArgs);
    }
    case 'unfollow_user': {
      const validatedArgs = validateUnfollowUserArgs(args);
      return await executeUnfollowUser(agent, validatedArgs);
    }
    case 'get_followers': {
      const validatedArgs = validateGetFollowersArgs(args);
      return await executeGetFollowers(agent, validatedArgs);
    }
    case 'get_following': {
      const validatedArgs = validateGetFollowingArgs(args);
      return await executeGetFollowing(agent, validatedArgs);
    }
    case 'search_users': {
      const validatedArgs = validateSearchUsersArgs(args);
      return await executeSearchUsers(agent, validatedArgs);
    }
    case 'get_user_wallet': {
      const validatedArgs = validateGetUserWalletArgs(args);
      return await executeGetUserWallet(agent, validatedArgs);
    }
    case 'get_user_stats': {
      const validatedArgs = validateGetUserStatsArgs(args);
      return await executeGetUserStats(agent, validatedArgs);
    }
    // Chats & Messaging
    case 'get_chats': {
      const validatedArgs = validateGetChatsArgs(args);
      return await executeGetChats(agent, validatedArgs);
    }
    case 'get_chat_messages': {
      const validatedArgs = validateGetChatMessagesArgs(args);
      return await executeGetChatMessages(agent, validatedArgs);
    }
    case 'send_message': {
      const validatedArgs = validateSendMessageArgs(args);
      return await executeSendMessage(agent, validatedArgs);
    }
    case 'create_group': {
      const validatedArgs = validateCreateGroupArgs(args);
      return await executeCreateGroup(agent, validatedArgs);
    }
    case 'leave_chat': {
      const validatedArgs = validateLeaveChatArgs(args);
      return await executeLeaveChat(agent, validatedArgs);
    }
    case 'get_unread_count': {
      validateGetUnreadCountArgs(args);
      return await executeGetUnreadCount(agent, {} as GetUnreadCountArgs);
    }
    // Notifications
    case 'get_notifications': {
      const validatedArgs = validateGetNotificationsArgs(args);
      return await executeGetNotifications(agent, validatedArgs);
    }
    case 'mark_notifications_read': {
      const validatedArgs = validateMarkNotificationsReadArgs(args);
      return await executeMarkNotificationsRead(agent, validatedArgs);
    }
    case 'get_group_invites': {
      validateGetGroupInvitesArgs(args);
      return await executeGetGroupInvites(agent, {} as GetGroupInvitesArgs);
    }
    case 'accept_group_invite': {
      const validatedArgs = validateAcceptGroupInviteArgs(args);
      return await executeAcceptGroupInvite(agent, validatedArgs);
    }
    case 'decline_group_invite': {
      const validatedArgs = validateDeclineGroupInviteArgs(args);
      return await executeDeclineGroupInvite(agent, validatedArgs);
    }
    // Leaderboard & Stats
    case 'get_leaderboard': {
      const validatedArgs = validateGetLeaderboardArgs(args);
      return await executeGetLeaderboard(agent, validatedArgs);
    }
    case 'get_system_stats': {
      validateGetSystemStatsArgs(args);
      return await executeGetSystemStats(agent, {} as GetSystemStatsArgs);
    }
    // Referrals & Rewards
    case 'get_referral_code': {
      validateGetReferralCodeArgs(args);
      return await executeGetReferralCode(agent, {} as GetReferralCodeArgs);
    }
    case 'get_referrals': {
      validateGetReferralsArgs(args);
      return await executeGetReferrals(agent, {} as GetReferralsArgs);
    }
    case 'get_referral_stats': {
      validateGetReferralStatsArgs(args);
      return await executeGetReferralStats(agent, {} as GetReferralStatsArgs);
    }
    // Reputation
    case 'get_reputation': {
      const validatedArgs = validateGetReputationArgs(args);
      return await executeGetReputation(agent, validatedArgs);
    }
    case 'get_reputation_breakdown': {
      const validatedArgs = validateGetReputationBreakdownArgs(args);
      return await executeGetReputationBreakdown(agent, validatedArgs);
    }
    // Trending & Discovery
    case 'get_trending_tags': {
      const validatedArgs = validateGetTrendingTagsArgs(args);
      return await executeGetTrendingTags(agent, validatedArgs);
    }
    // Organizations
    case 'get_organizations': {
      const validatedArgs = validateGetOrganizationsArgs(args);
      return await executeGetOrganizations(agent, validatedArgs);
    }
    // x402 Micropayments
    case 'payment_request': {
      const validatedArgs = validatePaymentRequestArgs(args);
      return await executePaymentRequest(agent, validatedArgs);
    }
    case 'payment_receipt': {
      const validatedArgs = validatePaymentReceiptArgs(args);
      return await executePaymentReceipt(agent, validatedArgs);
    }
    // Moderation
    case 'block_user': {
      const validatedArgs = validateBlockUserArgs(args);
      return await executeBlockUser(agent, validatedArgs);
    }
    case 'unblock_user': {
      const validatedArgs = validateUnblockUserArgs(args);
      return await executeUnblockUser(agent, validatedArgs);
    }
    case 'mute_user': {
      const validatedArgs = validateMuteUserArgs(args);
      return await executeMuteUser(agent, validatedArgs);
    }
    case 'unmute_user': {
      const validatedArgs = validateUnmuteUserArgs(args);
      return await executeUnmuteUser(agent, validatedArgs);
    }
    case 'report_user': {
      const validatedArgs = validateReportUserArgs(args);
      return await executeReportUser(agent, validatedArgs);
    }
    case 'report_post': {
      const validatedArgs = validateReportPostArgs(args);
      return await executeReportPost(agent, validatedArgs);
    }
    case 'get_blocks': {
      validateGetBlocksArgs(args);
      return await executeGetBlocks(agent, {} as GetBlocksArgs);
    }
    case 'get_mutes': {
      validateGetMutesArgs(args);
      return await executeGetMutes(agent, {} as GetMutesArgs);
    }
    case 'check_block_status': {
      const validatedArgs = validateCheckBlockStatusArgs(args);
      return await executeCheckBlockStatus(agent, validatedArgs);
    }
    case 'check_mute_status': {
      const validatedArgs = validateCheckMuteStatusArgs(args);
      return await executeCheckMuteStatus(agent, validatedArgs);
    }
    // Moderation Escrow
    case 'create_escrow_payment': {
      const validatedArgs = validateCreateEscrowPaymentArgs(args);
      return await executeCreateEscrowPayment(agent, validatedArgs);
    }
    case 'verify_escrow_payment': {
      const validatedArgs = validateVerifyEscrowPaymentArgs(args);
      return await executeVerifyEscrowPayment(agent, validatedArgs);
    }
    case 'refund_escrow_payment': {
      const validatedArgs = validateRefundEscrowPaymentArgs(args);
      return await executeRefundEscrowPayment(agent, validatedArgs);
    }
    case 'list_escrow_payments': {
      const validatedArgs = validateListEscrowPaymentsArgs(args);
      return await executeListEscrowPayments(agent, validatedArgs);
    }
    // Ban Appeals
    case 'appeal_ban': {
      const validatedArgs = validateAppealBanArgs(args);
      return await executeAppealBan(agent, validatedArgs);
    }
    case 'appeal_ban_with_escrow': {
      const validatedArgs = validateAppealBanWithEscrowArgs(args);
      return await executeAppealBanWithEscrow(agent, validatedArgs);
    }
    // Favorites
    case 'favorite_profile': {
      const validatedArgs = validateFavoriteProfileArgs(args);
      return await executeFavoriteProfile(agent, validatedArgs);
    }
    case 'unfavorite_profile': {
      const validatedArgs = validateUnfavoriteProfileArgs(args);
      return await executeUnfavoriteProfile(agent, validatedArgs);
    }
    case 'get_favorites': {
      const validatedArgs = validateGetFavoritesArgs(args);
      return await executeGetFavorites(agent, validatedArgs);
    }
    case 'get_favorite_posts': {
      const validatedArgs = validateGetFavoritePostsArgs(args);
      return await executeGetFavoritePosts(agent, validatedArgs);
    }
    // Points Transfer
    case 'transfer_points': {
      const validatedArgs = validateTransferPointsArgs(args);
      return await executeTransferPoints(agent, validatedArgs);
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
