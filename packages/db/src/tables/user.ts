import {
  bigint,
  boolean,
  decimal,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

/** User - Main user table */
export const users = pgTable(
  'User',
  {
    id: text('id').primaryKey(),
    // Privy embedded wallet id (used for server-side wallet actions).
    // This is not the Privy user id (did:privy:...), it's the wallet resource id.
    privyWalletId: text('privyWalletId'),
    // Privy embedded Solana wallet id for agent-side Solana operations.
    privySolanaWalletId: text('privySolanaWalletId'),
    // Offline delegated wallet readiness (signer + policy attached in Privy).
    offlineWalletReady: boolean('offlineWalletReady').notNull().default(false),
    offlineWalletReadyAt: timestamp('offlineWalletReadyAt', { mode: 'date' }),
    solanaOfflineWalletReady: boolean('solanaOfflineWalletReady')
      .notNull()
      .default(false),
    solanaOfflineWalletReadyAt: timestamp('solanaOfflineWalletReadyAt', {
      mode: 'date',
    }),
    walletAddress: text('walletAddress').unique(),
    solanaWalletAddress: text('solanaWalletAddress').unique(),
    username: text('username').unique(),
    displayName: text('displayName'),
    bio: text('bio'),
    profileImageUrl: text('profileImageUrl'),
    isActor: boolean('isActor').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    personality: text('personality'),
    postStyle: text('postStyle'),
    postExample: text('postExample'),
    virtualBalance: decimal('virtualBalance', { precision: 18, scale: 2 })
      .notNull()
      .default('1000'),
    totalDeposited: decimal('totalDeposited', { precision: 18, scale: 2 })
      .notNull()
      .default('1000'),
    totalWithdrawn: decimal('totalWithdrawn', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    lifetimePnL: decimal('lifetimePnL', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    profileComplete: boolean('profileComplete').notNull().default(false),
    hasProfileImage: boolean('hasProfileImage').notNull().default(false),
    hasUsername: boolean('hasUsername').notNull().default(false),
    hasBio: boolean('hasBio').notNull().default(false),
    profileSetupCompletedAt: timestamp('profileSetupCompletedAt', {
      mode: 'date',
    }),
    farcasterUsername: text('farcasterUsername'),
    hasFarcaster: boolean('hasFarcaster').notNull().default(false),
    hasTwitter: boolean('hasTwitter').notNull().default(false),
    hasDiscord: boolean('hasDiscord').notNull().default(false),
    hasTelegram: boolean('hasTelegram').notNull().default(false),
    nftTokenId: integer('nftTokenId').unique(),
    onChainRegistered: boolean('onChainRegistered').notNull().default(false),
    pointsAwardedForFarcaster: boolean('pointsAwardedForFarcaster')
      .notNull()
      .default(false),
    pointsAwardedForFarcasterFollow: boolean('pointsAwardedForFarcasterFollow')
      .notNull()
      .default(false),
    pointsAwardedForProfile: boolean('pointsAwardedForProfile')
      .notNull()
      .default(false),
    pointsAwardedForProfileImage: boolean('pointsAwardedForProfileImage')
      .notNull()
      .default(false),
    pointsAwardedForTwitter: boolean('pointsAwardedForTwitter')
      .notNull()
      .default(false),
    pointsAwardedForTwitterFollow: boolean('pointsAwardedForTwitterFollow')
      .notNull()
      .default(false),
    pointsAwardedForDiscord: boolean('pointsAwardedForDiscord')
      .notNull()
      .default(false),
    pointsAwardedForDiscordJoin: boolean('pointsAwardedForDiscordJoin')
      .notNull()
      .default(false),
    pointsAwardedForTelegram: boolean('pointsAwardedForTelegram')
      .notNull()
      .default(false),
    pointsAwardedForUsername: boolean('pointsAwardedForUsername')
      .notNull()
      .default(false),
    pointsAwardedForWallet: boolean('pointsAwardedForWallet')
      .notNull()
      .default(false),
    pointsAwardedForReferralBonus: boolean('pointsAwardedForReferralBonus')
      .notNull()
      .default(false),
    pointsAwardedForShare: boolean('pointsAwardedForShare')
      .notNull()
      .default(false),
    pointsAwardedForPrivateGroup: boolean('pointsAwardedForPrivateGroup')
      .notNull()
      .default(false),
    pointsAwardedForPrivateChannel: boolean('pointsAwardedForPrivateChannel')
      .notNull()
      .default(false),
    referralCode: text('referralCode').unique(),
    referralCount: integer('referralCount').notNull().default(0),
    referredBy: text('referredBy'),
    registrationIpHash: text('registrationIpHash'),
    lastReferralIpHash: text('lastReferralIpHash'),
    registrationTxHash: text('registrationTxHash'),
    reputationPoints: integer('reputationPoints').notNull().default(1000),
    twitterUsername: text('twitterUsername'),
    bannerDismissCount: integer('bannerDismissCount').notNull().default(0),
    bannerLastShown: timestamp('bannerLastShown', { mode: 'date' }),
    coverImageUrl: text('coverImageUrl'),
    showFarcasterPublic: boolean('showFarcasterPublic').notNull().default(true),
    showTwitterPublic: boolean('showTwitterPublic').notNull().default(true),
    showWalletPublic: boolean('showWalletPublic').notNull().default(true),
    usernameChangedAt: timestamp('usernameChangedAt', { mode: 'date' }),
    agent0FeedbackCount: integer('agent0FeedbackCount'),
    agent0MetadataCID: text('agent0MetadataCID'),
    agent0RegisteredAt: timestamp('agent0RegisteredAt', { mode: 'date' }),
    agent0TokenId: integer('agent0TokenId'),
    agent0TrustScore: doublePrecision('agent0TrustScore'),
    solanaRegistered: boolean('solanaRegistered').notNull().default(false),
    solanaRegistryAssetId: text('solanaRegistryAssetId'),
    solanaMetadataUri: text('solanaMetadataUri'),
    solanaRegistrationTxHash: text('solanaRegistrationTxHash'),
    solanaRegisteredAt: timestamp('solanaRegisteredAt', { mode: 'date' }),
    bannedAt: timestamp('bannedAt', { mode: 'date' }),
    bannedBy: text('bannedBy'),
    bannedReason: text('bannedReason'),
    farcasterDisplayName: text('farcasterDisplayName'),
    farcasterFid: text('farcasterFid').unique(),
    farcasterPfpUrl: text('farcasterPfpUrl'),
    farcasterVerifiedAt: timestamp('farcasterVerifiedAt', { mode: 'date' }),
    isAdmin: boolean('isAdmin').notNull().default(false),
    isBanned: boolean('isBanned').notNull().default(false),
    isScammer: boolean('isScammer').notNull().default(false),
    isCSAM: boolean('isCSAM').notNull().default(false),
    appealCount: integer('appealCount').notNull().default(0),
    appealStaked: boolean('appealStaked').notNull().default(false),
    appealStakeAmount: decimal('appealStakeAmount', {
      precision: 18,
      scale: 2,
    }),
    appealStakeTxHash: text('appealStakeTxHash'),
    appealStatus: text('appealStatus'),
    appealSubmittedAt: timestamp('appealSubmittedAt', { mode: 'date' }),
    appealReviewedAt: timestamp('appealReviewedAt', { mode: 'date' }),
    falsePositiveHistory: json('falsePositiveHistory').$type<JsonValue>(),
    privyId: text('privyId').unique(),
    registrationBlockNumber: bigint('registrationBlockNumber', {
      mode: 'bigint',
    }),
    registrationGasUsed: bigint('registrationGasUsed', { mode: 'bigint' }),
    registrationTimestamp: timestamp('registrationTimestamp', { mode: 'date' }),
    role: text('role'),
    totalFeesEarned: decimal('totalFeesEarned', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    totalFeesPaid: decimal('totalFeesPaid', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    twitterAccessToken: text('twitterAccessToken'),
    twitterId: text('twitterId').unique(),
    twitterRefreshToken: text('twitterRefreshToken'),
    twitterTokenExpiresAt: timestamp('twitterTokenExpiresAt', { mode: 'date' }),
    twitterVerifiedAt: timestamp('twitterVerifiedAt', { mode: 'date' }),
    discordId: text('discordId').unique(),
    discordUsername: text('discordUsername'),
    discordAccessToken: text('discordAccessToken'),
    discordRefreshToken: text('discordRefreshToken'),
    discordTokenExpiresAt: timestamp('discordTokenExpiresAt', { mode: 'date' }),
    discordVerifiedAt: timestamp('discordVerifiedAt', { mode: 'date' }),
    telegramId: text('telegramId').unique(),
    telegramUsername: text('telegramUsername'),
    telegramVerifiedAt: timestamp('telegramVerifiedAt', { mode: 'date' }),
    tosAccepted: boolean('tosAccepted').notNull().default(false),
    tosAcceptedAt: timestamp('tosAcceptedAt', { mode: 'date' }),
    tosAcceptedVersion: text('tosAcceptedVersion').default('2025-11-11'),
    privacyPolicyAccepted: boolean('privacyPolicyAccepted')
      .notNull()
      .default(false),
    privacyPolicyAcceptedAt: timestamp('privacyPolicyAcceptedAt', {
      mode: 'date',
    }),
    privacyPolicyAcceptedVersion: text('privacyPolicyAcceptedVersion').default(
      '2025-11-11'
    ),
    invitePoints: integer('invitePoints').notNull().default(0),
    earnedPoints: integer('earnedPoints').notNull().default(0),
    bonusPoints: integer('bonusPoints').notNull().default(0),
    waitlistPosition: integer('waitlistPosition'),
    waitlistJoinedAt: timestamp('waitlistJoinedAt', { mode: 'date' }),
    isWaitlistActive: boolean('isWaitlistActive').notNull().default(false),
    isTest: boolean('isTest').notNull().default(false),
    pointsAwardedForEmail: boolean('pointsAwardedForEmail')
      .notNull()
      .default(false),
    emailVerified: boolean('emailVerified').notNull().default(false),
    email: text('email'),
    emailNotificationsEnabled: boolean('emailNotificationsEnabled')
      .notNull()
      .default(false),
    emailNotificationsRealtime: boolean('emailNotificationsRealtime')
      .notNull()
      .default(true),
    emailNotificationsDailySummary: boolean('emailNotificationsDailySummary')
      .notNull()
      .default(true),
    emailNotificationsWeeklySummary: boolean('emailNotificationsWeeklySummary')
      .notNull()
      .default(true),
    emailNotificationsMonthlySummary: boolean(
      'emailNotificationsMonthlySummary'
    )
      .notNull()
      .default(true),
    notificationDigestEnabled: boolean('notificationDigestEnabled')
      .notNull()
      .default(true),
    notificationDigestFrequency: text('notificationDigestFrequency')
      .notNull()
      .default('daily'),
    notificationDigestDeliveryChannel: text('notificationDigestDeliveryChannel')
      .notNull()
      .default('both'),
    notificationDigestLastSentAt: timestamp('notificationDigestLastSentAt', {
      mode: 'date',
    }),
    emailNotificationsUnsubscribedAt: timestamp(
      'emailNotificationsUnsubscribedAt',
      {
        mode: 'date',
      }
    ),
    waitlistGraduatedAt: timestamp('waitlistGraduatedAt', { mode: 'date' }),
    // Agent flags (config stored in UserAgentConfig table)
    isAgent: boolean('isAgent').notNull().default(false),
    managedBy: text('managedBy'),
    // Unified total points (wallet + positions, excludes agents)
    totalPoints: decimal('totalPoints', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    // Dirty flag for incremental totalPoints recompute
    totalPointsDirtyAt: timestamp('totalPointsDirtyAt', { mode: 'date' }),
    // Game guide completion tracking
    gameGuideCompletedAt: timestamp('gameGuideCompletedAt', { mode: 'date' }),
    // Profile chain sync tracking (database-first architecture)
    profileChainSyncNeeded: boolean('profileChainSyncNeeded')
      .notNull()
      .default(false),
    profileChainSyncAt: timestamp('profileChainSyncAt', { mode: 'date' }),
    profileChainSyncError: text('profileChainSyncError'),
    // Daily login streak tracking (BAB-88)
    dailyLoginStreak: integer('dailyLoginStreak').notNull().default(0),
    lastDailyLogin: timestamp('lastDailyLogin', { mode: 'date' }),
    longestStreak: integer('longestStreak').notNull().default(0),
    totalDailyLogins: integer('totalDailyLogins').notNull().default(0),
  },
  (table) => [
    index('User_displayName_idx').on(table.displayName),
    index('User_earnedPoints_idx').on(table.earnedPoints),
    index('User_invitePoints_idx').on(table.invitePoints),
    index('User_isActor_idx').on(table.isActor),
    // Admin stats indexes for optimized user signups queries
    index('User_createdAt_idx').on(table.createdAt),
    index('User_isActor_createdAt_idx').on(table.isActor, table.createdAt),
    index('User_isAgent_idx').on(table.isAgent),
    index('User_isAgent_createdAt_idx').on(table.isAgent, table.createdAt),
    index('User_isAgent_managedBy_idx').on(table.isAgent, table.managedBy),
    index('User_isBanned_isActor_idx').on(table.isBanned, table.isActor),
    index('User_isScammer_idx').on(table.isScammer),
    index('User_isCSAM_idx').on(table.isCSAM),
    index('User_managedBy_idx').on(table.managedBy),
    index('User_managedBy_isAgent_createdAt_idx').on(
      table.managedBy,
      table.isAgent,
      table.createdAt
    ),
    index('User_profileComplete_createdAt_idx').on(
      table.profileComplete,
      table.createdAt
    ),
    index('User_referralCode_idx').on(table.referralCode),
    index('User_reputationPoints_idx').on(table.reputationPoints),
    index('User_totalPoints_idx').on(table.totalPoints),
    index('User_username_idx').on(table.username),
    index('User_emailNotificationsEnabled_idx').on(
      table.emailNotificationsEnabled
    ),
    index('User_waitlistJoinedAt_idx').on(table.waitlistJoinedAt),
    index('User_waitlistPosition_idx').on(table.waitlistPosition),
    index('User_walletAddress_idx').on(table.walletAddress),
    index('User_registrationIpHash_idx').on(table.registrationIpHash),
    index('User_lastReferralIpHash_idx').on(table.lastReferralIpHash),
    // Index for efficient profile chain sync queries
    index('User_profileChainSyncNeeded_onChainRegistered_idx').on(
      table.profileChainSyncNeeded,
      table.onChainRegistered
    ),
    // Indexes for daily login streak (BAB-88)
    index('User_dailyLoginStreak_idx').on(table.dailyLoginStreak),
    index('User_longestStreak_idx').on(table.longestStreak),
    index('User_lastDailyLogin_idx').on(table.lastDailyLogin),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
