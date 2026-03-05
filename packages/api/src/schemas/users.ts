import { OnboardingProfileSchema, SnowflakeIdSchema } from '@babylon/shared';
import { z } from 'zod';

export const UserBalanceResponse = z
  .object({
    balance: z
      .string()
      .meta({ description: 'Virtual balance as decimal string' }),
    totalDeposited: z
      .string()
      .meta({ description: 'Total deposited as decimal string' }),
    totalWithdrawn: z
      .string()
      .meta({ description: 'Total withdrawn as decimal string' }),
    lifetimePnL: z
      .string()
      .meta({ description: 'Lifetime PnL as decimal string' }),
  })
  .meta({ id: 'UserBalanceResponse' });

export const UserStats = z
  .object({
    followers: z.number(),
    following: z.number(),
    positions: z.number(),
    comments: z.number(),
    reactions: z.number(),
    posts: z.number(),
  })
  .meta({ id: 'UserStats' });

export const UserProfile = z
  .object({
    id: z.string(),
    privyId: z.string(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    coverImageUrl: z.string().nullable(),
    walletAddress: z.string().nullable(),
    email: z.string().nullable(),
    emailVerified: z.boolean(),
    profileComplete: z.boolean(),
    hasUsername: z.boolean(),
    hasBio: z.boolean(),
    hasProfileImage: z.boolean(),
    onChainRegistered: z.boolean(),
    nftTokenId: z.string().nullable(),
    agent0TokenId: z.string().nullable(),
    referralCode: z.string().nullable(),
    referredBy: z.string().nullable(),
    reputationPoints: z.number(),
    virtualBalance: z.number(),
    isAdmin: z.boolean(),
    isActor: z.boolean(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    stats: UserStats.optional(),
  })
  .meta({ id: 'UserProfile' });

export const UserPublicStats = z
  .object({
    positions: z.number(),
    comments: z.number(),
    reactions: z.number(),
    followers: z.number(),
    following: z.number(),
    posts: z.number(),
  })
  .meta({ id: 'UserPublicStats' });

export const UserPublicProfile = z
  .object({
    id: z.string(),
    walletAddress: z.string().nullable(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    coverImageUrl: z.string().nullable(),
    isActor: z.boolean(),
    isAgent: z.boolean(),
    managedBy: z.string().nullable(),
    profileComplete: z.boolean(),
    onChainRegistered: z.boolean(),
    nftTokenId: z.string().nullable(),
    virtualBalance: z.number(),
    lifetimePnL: z.number(),
    reputationPoints: z.number(),
    totalPoints: z.number(),
    referralCode: z.string().nullable(),
    hasFarcaster: z.boolean(),
    hasTwitter: z.boolean(),
    farcasterUsername: z.string().nullable(),
    twitterUsername: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    stats: UserPublicStats,
  })
  .meta({ id: 'UserPublicProfile' });

export const SearchUserResult = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
    isAgent: z.boolean().optional(),
  })
  .meta({ id: 'SearchUserResult' });

export const FollowUser = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
    followedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    isActor: z.boolean(),
    isMutualFollow: z.boolean().optional(),
  })
  .meta({ id: 'FollowUser' });

export const FollowTarget = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
  })
  .meta({ id: 'FollowTarget' });

export const Activity = z
  .object({
    id: z.string(),
    type: z.enum(['points', 'post', 'comment', 'trade']),
    description: z.string(),
    points: z.number().optional(),
    referenceId: z.string().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'Activity' });

export const UserCommentPreview = z
  .object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    userId: z.string(),
    userName: z.string(),
    userUsername: z.string().nullable(),
    userAvatar: z.string().nullable(),
    likeCount: z.number(),
  })
  .meta({ id: 'UserCommentPreview' });

export const UserOriginalPost = z
  .object({
    id: z.string(),
    content: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    authorUsername: z.string().nullable(),
    authorProfileImageUrl: z.string().nullable(),
    timestamp: z.string(),
  })
  .meta({ id: 'UserOriginalPost' });

export const UserPost = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    content: z.string(),
    fullContent: z.string().optional(),
    articleTitle: z.string().optional(),
    byline: z.string().optional(),
    category: z.string().optional(),
    author: z.string(),
    authorId: z.string(),
    authorName: z.string(),
    authorUsername: z.string().nullable(),
    authorProfileImageUrl: z.string().nullable(),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    gameId: z.string().optional(),
    dayNumber: z.number().optional(),
    likeCount: z.number(),
    commentCount: z.number(),
    shareCount: z.number(),
    isLiked: z.boolean(),
    isShared: z.boolean(),
    commentPreviews: z.array(UserCommentPreview).optional(),
    isRepost: z.boolean().optional(),
    isQuote: z.boolean().optional(),
    quoteComment: z.string().nullable().optional(),
    originalPostId: z.string().optional(),
    originalPost: UserOriginalPost.nullable().optional(),
  })
  .meta({ id: 'UserPost' });

export const ApiKey = z
  .object({
    id: z.string(),
    name: z.string(),
    maskedKey: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    lastUsedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
  })
  .meta({ id: 'ApiKey' });

export const BlockRecord = z
  .object({
    id: z.string(),
    blockerId: z.string(),
    blockedId: z.string(),
    reason: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'BlockRecord' });

export const MuteRecord = z
  .object({
    id: z.string(),
    muterId: z.string(),
    mutedId: z.string(),
    reason: z.string().nullable(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
  })
  .meta({ id: 'MuteRecord' });

export const FavoriteProfile = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
    isActor: z.boolean(),
    postCount: z.number(),
    favoriteCount: z.number(),
    favoritedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    isFavorited: z.boolean(),
  })
  .meta({ id: 'FavoriteProfile' });

export const FavoriteTarget = z
  .object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    bio: z.string().nullable(),
  })
  .meta({ id: 'FavoriteTarget' });

export const PortfolioBreakdownResponse = z
  .object({
    wallet: z.number(),
    agents: z.number(),
    positions: z.number(),
    available: z.number(),
    originalAmount: z.number(),
    totalAssets: z.number(),
    totalPnL: z.number(),
    agentCount: z.number(),
    totalPoints: z.number(),
  })
  .meta({ id: 'PortfolioBreakdownResponse' });

export const userIdPath = z.object({
  userId: z.string().meta({ description: 'User ID' }),
});

export const profileIdPath = z.object({
  id: z.string().meta({ description: 'Profile / User ID' }),
});

export const PointsTransaction = z
  .object({
    id: z.string(),
    userId: z.string(),
    amount: z.number(),
    pointsBefore: z.number().optional(),
    pointsAfter: z.number().optional(),
    reason: z.string(),
    metadata: z.string().nullable().optional(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    paymentRequestId: z.string().nullable().optional(),
    paymentTxHash: z.string().nullable().optional(),
    paymentAmount: z.string().nullable().optional(),
    paymentVerified: z.boolean().optional(),
    paymentProvider: z.string().nullable().optional(),
  })
  .meta({ id: 'PointsTransaction' });

export const PointsHistoryResponse = z
  .object({
    transactions: z.array(PointsTransaction),
  })
  .meta({ id: 'PointsHistoryResponse' });

export const CreateApiKeyBody = z
  .object({
    name: z.string().optional(),
  })
  .meta({ id: 'CreateApiKeyBody' });

export const DeleteAccountBody = z
  .object({
    confirmation: z.literal('DELETE MY ACCOUNT'),
    reason: z.string().optional(),
  })
  .meta({ id: 'DeleteAccountBody' });

export const LinkSocialBody = z
  .object({
    platform: z.enum(['farcaster', 'twitter', 'wallet']),
    username: z.string().optional(),
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
  })
  .meta({ id: 'LinkSocialBody' });

export const ShareRequestBody = z
  .object({
    platform: z.enum(['twitter', 'farcaster', 'link', 'telegram', 'discord']),
    contentType: z.enum([
      'post',
      'profile',
      'market',
      'referral',
      'leaderboard',
    ]),
    contentId: z.string().optional(),
    url: z.string().url().optional(),
  })
  .meta({ id: 'ShareRequestBody' });

export const UpdateVisibilityBody = z
  .object({
    platform: z.enum(['twitter', 'farcaster', 'wallet']),
    visible: z.boolean(),
  })
  .meta({ id: 'UpdateVisibilityBody' });

export const VerifyShareBody = z
  .object({
    shareId: SnowflakeIdSchema,
    platform: z.enum(['twitter', 'farcaster']),
    postUrl: z.string().url().optional(),
  })
  .meta({ id: 'VerifyShareBody' });

export const SignupBody = OnboardingProfileSchema.extend({
  identityToken: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  isWaitlist: z.boolean().optional().default(false),
}).meta({ id: 'SignupBody' });
