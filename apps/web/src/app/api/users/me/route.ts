/**
 * Current User Profile API
 *
 * @route GET /api/users/me
 * @access Authenticated
 *
 * @description
 * Returns the authenticated user's complete profile information including
 * profile status, social connections, reputation, and onboarding state.
 * Central endpoint for user session management and profile data.
 *
 * **Automatic User Creation:**
 * Creates a minimal user record in the database on first authentication if
 * one doesn't exist. This allows tracking of users through the onboarding
 * funnel and ensures a user record is always available for authenticated requests.
 *
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Returns the authenticated user complete profile including onboarding status, social connections, and reputation.
 *     security:
 *       - PrivyAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 *                 needsOnboarding:
 *                   type: boolean
 *                 needsOnchain:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     profileImageUrl:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     reputationPoints:
 *                       type: number
 *                     isAdmin:
 *                       type: boolean
 *                     stats:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *
 * **Profile Data Includes:**
 * - **Identity:** username, display name, bio, avatar, cover image
 * - **Onboarding Status:** profile completion, on-chain registration
 * - **Social Links:** Farcaster, Twitter connections and visibility settings
 * - **Blockchain:** wallet address, NFT token ID, on-chain status
 * - **Reputation:** reputation points, referral code, referral source
 * - **Stats:** cached profile statistics (posts, followers, following)
 * - **Permissions:** admin status, actor/agent flag
 *
 * **Onboarding States:**
 * - `needsOnboarding: true` - User exists in DB but hasn't completed profile setup
 * - `needsOnchain: true` - Profile complete but not registered on-chain
 * - Both false - Fully onboarded user
 *
 * **Profile Completeness:**
 * A profile is considered complete when user has:
 * - Set a username
 * - Added a bio
 * - Uploaded a profile image
 *
 * **Caching:**
 * Profile stats (posts, followers, etc.) are cached for performance.
 * Cache is invalidated on relevant user actions.
 *
 * @returns {object} User profile response
 * @property {boolean} authenticated - Always true (auth required)
 * @property {boolean} needsOnboarding - Whether user needs profile setup
 * @property {boolean} needsOnchain - Whether user needs on-chain registration
 * @property {object} user - User profile object (minimal record until profile completed)
 * @property {object} user.stats - Cached profile statistics
 *
 * **User Object Fields:**
 * @property {string} user.id - User ID
 * @property {string} user.privyId - Privy authentication ID
 * @property {string} user.username - Unique username
 * @property {string} user.displayName - Display name
 * @property {string} user.bio - User biography
 * @property {string} user.profileImageUrl - Profile image URL
 * @property {string} user.coverImageUrl - Cover image URL
 * @property {string} user.walletAddress - Blockchain wallet address
 * @property {boolean} user.onChainRegistered - On-chain registration status
 * @property {string} user.nftTokenId - Associated NFT token ID
 * @property {string} user.referralCode - User's referral code
 * @property {string} user.referredBy - Referrer's code (if referred)
 * @property {number} user.reputationPoints - Reputation score
 * @property {boolean} user.hasFarcaster - Farcaster connected
 * @property {boolean} user.hasTwitter - Twitter connected
 * @property {boolean} user.isAdmin - Admin privileges
 * @property {boolean} user.isActor - Agent/actor flag
 *
 * @throws {401} Unauthorized - authentication required
 * @throws {500} Internal server error
 *
 * @example
 * ```typescript
 * // Get current user profile
 * const response = await fetch('/api/users/me', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * const { user, needsOnboarding, needsOnchain } = await response.json();
 *
 * if (needsOnboarding) {
 *   // Redirect to onboarding flow
 *   router.push('/onboarding');
 * } else if (needsOnchain) {
 *   // Prompt for on-chain registration
 *   showOnchainModal();
 * } else {
 *   // User fully onboarded
 *   console.log(`Welcome, ${user.displayName}!`);
 * }
 * ```
 *
 * @see {@link /lib/cached-database-service} Profile stats caching
 * @see {@link /lib/api/auth-middleware} Authentication
 * @see {@link /src/app/onboarding/page.tsx} Onboarding flow
 * @see {@link /src/contexts/AuthContext.tsx} Auth context consumer
 */

import {
  authenticate,
  authenticateWithDbUser,
  ConflictError,
  ensureOfflineWalletReady,
  getPrivyClient,
  InternalServerError,
  PointsService,
  type PrivyUserWalletsLite,
  pickEmbeddedEvmWallet,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { and, db, eq, ne, or, sql, users } from '@babylon/db';
import {
  checkForAdminEmail,
  logger,
  type PrivyUserWithEmails,
} from '@babylon/shared';
import type { User as PrivyUser } from '@privy-io/server-auth';
import type { NextRequest } from 'next/server';
import {
  extractPrivyIdentitySnapshot,
  type PrivyIdentitySnapshot,
  shouldSyncMissingPrivyIdentity,
} from '@/lib/auth/privyIdentitySync';
import { getOptionalProfileStats } from '@/lib/users/profile-stats';
import { POST as updateProfilePOST } from '../[userId]/update-profile/route';

type PrivyUserWithWallets = PrivyUser &
  PrivyUserWithEmails &
  PrivyUserWalletsLite;

const userSelectFields = {
  id: users.id,
  privyId: users.privyId,
  privyWalletId: users.privyWalletId,
  offlineWalletReady: users.offlineWalletReady,
  offlineWalletReadyAt: users.offlineWalletReadyAt,
  username: users.username,
  displayName: users.displayName,
  bio: users.bio,
  profileImageUrl: users.profileImageUrl,
  coverImageUrl: users.coverImageUrl,
  walletAddress: users.walletAddress,
  email: users.email, // For displaying pending referrals
  emailVerified: users.emailVerified,
  emailNotificationsEnabled: users.emailNotificationsEnabled,
  emailNotificationsRealtime: users.emailNotificationsRealtime,
  emailNotificationsDailySummary: users.emailNotificationsDailySummary,
  emailNotificationsWeeklySummary: users.emailNotificationsWeeklySummary,
  emailNotificationsMonthlySummary: users.emailNotificationsMonthlySummary,
  profileComplete: users.profileComplete,
  hasUsername: users.hasUsername,
  hasBio: users.hasBio,
  hasProfileImage: users.hasProfileImage,
  onChainRegistered: users.onChainRegistered,
  nftTokenId: users.nftTokenId,
  agent0TokenId: users.agent0TokenId,
  referralCode: users.referralCode,
  referredBy: users.referredBy,
  reputationPoints: users.reputationPoints,
  virtualBalance: users.virtualBalance,
  pointsAwardedForProfile: users.pointsAwardedForProfile,
  pointsAwardedForFarcasterFollow: users.pointsAwardedForFarcasterFollow,
  pointsAwardedForTwitterFollow: users.pointsAwardedForTwitterFollow,
  pointsAwardedForDiscordJoin: users.pointsAwardedForDiscordJoin,
  pointsAwardedForEmail: users.pointsAwardedForEmail,
  hasFarcaster: users.hasFarcaster,
  hasTwitter: users.hasTwitter,
  hasDiscord: users.hasDiscord,
  farcasterUsername: users.farcasterUsername,
  farcasterFid: users.farcasterFid,
  twitterUsername: users.twitterUsername,
  twitterId: users.twitterId,
  discordUsername: users.discordUsername,
  showTwitterPublic: users.showTwitterPublic,
  showFarcasterPublic: users.showFarcasterPublic,
  showWalletPublic: users.showWalletPublic,
  isAdmin: users.isAdmin,
  isActor: users.isActor,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  gameGuideCompletedAt: users.gameGuideCompletedAt,
} as const;

type UserSelectResult = {
  id: string;
  privyId: string | null;
  privyWalletId: string | null;
  offlineWalletReady: boolean;
  offlineWalletReadyAt: Date | null;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  walletAddress: string | null;
  email: string | null;
  emailVerified: boolean;
  emailNotificationsEnabled: boolean;
  emailNotificationsRealtime: boolean;
  emailNotificationsDailySummary: boolean;
  emailNotificationsWeeklySummary: boolean;
  emailNotificationsMonthlySummary: boolean;
  profileComplete: boolean;
  hasUsername: boolean;
  hasBio: boolean;
  hasProfileImage: boolean;
  onChainRegistered: boolean;
  nftTokenId: number | null;
  agent0TokenId: number | null;
  referralCode: string | null;
  referredBy: string | null;
  reputationPoints: number;
  virtualBalance: string;
  pointsAwardedForProfile: boolean;
  pointsAwardedForFarcasterFollow: boolean;
  pointsAwardedForTwitterFollow: boolean;
  pointsAwardedForDiscordJoin: boolean;
  pointsAwardedForEmail: boolean;
  hasFarcaster: boolean;
  hasTwitter: boolean;
  hasDiscord: boolean;
  farcasterUsername: string | null;
  farcasterFid: string | null;
  twitterUsername: string | null;
  twitterId: string | null;
  discordUsername: string | null;
  showTwitterPublic: boolean;
  showFarcasterPublic: boolean;
  showWalletPublic: boolean;
  isAdmin: boolean;
  isActor: boolean;
  createdAt: Date;
  updatedAt: Date;
  gameGuideCompletedAt: Date | null;
};

async function syncMissingPrivyIdentityFields(
  dbUser: UserSelectResult,
  privyIdentity: PrivyIdentitySnapshot
): Promise<{
  user: UserSelectResult;
  newlyLinked: Array<'farcaster' | 'twitter'>;
}> {
  const updateData: Partial<typeof users.$inferInsert> = {};
  const newlyLinked: Array<'farcaster' | 'twitter'> = [];

  if ((!dbUser.email || !dbUser.emailVerified) && privyIdentity.email) {
    updateData.email = privyIdentity.email;
    updateData.emailVerified = true;
  }

  if (!dbUser.hasFarcaster && privyIdentity.farcasterFid) {
    const [existingFarcasterUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.farcasterFid, privyIdentity.farcasterFid),
          ne(users.id, dbUser.id)
        )
      )
      .limit(1);

    if (existingFarcasterUser) {
      logger.warn(
        'Privy Farcaster identity already linked to another user, skipping sync',
        {
          userId: dbUser.id,
          farcasterFid: privyIdentity.farcasterFid,
          conflictingUserId: existingFarcasterUser.id,
        },
        'GET /api/users/me'
      );
    } else {
      updateData.hasFarcaster = true;
      updateData.farcasterFid = privyIdentity.farcasterFid;
      if (privyIdentity.farcasterUsername) {
        updateData.farcasterUsername = privyIdentity.farcasterUsername;
      }
      newlyLinked.push('farcaster');
    }
  }

  if (!dbUser.hasTwitter && privyIdentity.twitterId) {
    const [existingTwitterUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.twitterId, privyIdentity.twitterId),
          ne(users.id, dbUser.id)
        )
      )
      .limit(1);

    if (existingTwitterUser) {
      logger.warn(
        'Privy X identity already linked to another user, skipping sync',
        {
          userId: dbUser.id,
          twitterId: privyIdentity.twitterId,
          conflictingUserId: existingTwitterUser.id,
        },
        'GET /api/users/me'
      );
    } else {
      updateData.hasTwitter = true;
      updateData.twitterId = privyIdentity.twitterId;
      if (privyIdentity.twitterUsername) {
        updateData.twitterUsername = privyIdentity.twitterUsername;
      }
      newlyLinked.push('twitter');
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { user: dbUser, newlyLinked };
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, dbUser.id))
    .returning(userSelectFields);

  return {
    user: updatedUser ?? dbUser,
    newlyLinked,
  };
}

async function awardPointsForNewPrivyIdentityLinks(
  userId: string,
  newlyLinked: Array<'farcaster' | 'twitter'>,
  privyIdentity: PrivyIdentitySnapshot
): Promise<void> {
  for (const platform of newlyLinked) {
    const pointsResult =
      platform === 'farcaster'
        ? await PointsService.awardFarcasterLink(
            userId,
            privyIdentity.farcasterUsername ?? undefined
          )
        : await PointsService.awardTwitterLink(
            userId,
            privyIdentity.twitterUsername ?? undefined
          );

    if (!pointsResult.success) {
      logger.warn(
        'Points service did not award points for Privy identity link',
        { userId, platform },
        'GET /api/users/me'
      );
      continue;
    }

    await PointsService.checkAndQualifyReferral(userId).catch((error) => {
      logger.warn(
        'Failed to check referral qualification after Privy identity sync',
        {
          userId,
          platform,
          error: error instanceof Error ? error.message : String(error),
        },
        'GET /api/users/me'
      );
    });
  }
}

function buildUserResponse(
  dbUser: UserSelectResult,
  stats: Awaited<ReturnType<typeof getOptionalProfileStats>>
) {
  return {
    id: dbUser.id,
    privyId: dbUser.privyId,
    privyWalletId: dbUser.privyWalletId,
    offlineWalletReady: dbUser.offlineWalletReady,
    offlineWalletReadyAt: dbUser.offlineWalletReadyAt?.toISOString() ?? null,
    username: dbUser.username,
    displayName: dbUser.displayName,
    bio: dbUser.bio,
    profileImageUrl: dbUser.profileImageUrl,
    coverImageUrl: dbUser.coverImageUrl,
    walletAddress: dbUser.walletAddress,
    email: dbUser.email,
    emailVerified: dbUser.emailVerified,
    emailNotificationsEnabled: dbUser.emailNotificationsEnabled,
    emailNotificationsRealtime: dbUser.emailNotificationsRealtime,
    emailNotificationsDailySummary: dbUser.emailNotificationsDailySummary,
    emailNotificationsWeeklySummary: dbUser.emailNotificationsWeeklySummary,
    emailNotificationsMonthlySummary: dbUser.emailNotificationsMonthlySummary,
    profileComplete: dbUser.profileComplete,
    hasUsername: dbUser.hasUsername,
    hasBio: dbUser.hasBio,
    hasProfileImage: dbUser.hasProfileImage,
    onChainRegistered: dbUser.onChainRegistered,
    nftTokenId: dbUser.nftTokenId,
    agent0TokenId: dbUser.agent0TokenId,
    referralCode: dbUser.referralCode,
    referredBy: dbUser.referredBy,
    reputationPoints: dbUser.reputationPoints,
    virtualBalance: Number(dbUser.virtualBalance ?? 0),
    pointsAwardedForProfile: dbUser.pointsAwardedForProfile,
    pointsAwardedForFarcasterFollow: dbUser.pointsAwardedForFarcasterFollow,
    pointsAwardedForTwitterFollow: dbUser.pointsAwardedForTwitterFollow,
    pointsAwardedForDiscordJoin: dbUser.pointsAwardedForDiscordJoin,
    pointsAwardedForEmail: dbUser.pointsAwardedForEmail,
    hasFarcaster: dbUser.hasFarcaster,
    hasTwitter: dbUser.hasTwitter,
    hasDiscord: dbUser.hasDiscord,
    farcasterUsername: dbUser.farcasterUsername,
    twitterUsername: dbUser.twitterUsername,
    discordUsername: dbUser.discordUsername,
    showTwitterPublic: dbUser.showTwitterPublic,
    showFarcasterPublic: dbUser.showFarcasterPublic,
    showWalletPublic: dbUser.showWalletPublic,
    isAdmin: dbUser.isAdmin,
    isActor: dbUser.isActor,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
    gameGuideCompletedAt: dbUser.gameGuideCompletedAt?.toISOString() ?? null,
    stats,
  };
}

async function updateReferrerForIncompleteUser(
  dbUser: UserSelectResult,
  referralCode: string
): Promise<UserSelectResult> {
  const normalizedCode = referralCode.trim();

  // First, try to find referrer by username (legacy system, case-insensitive)
  let [referrer] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${normalizedCode})`)
    .limit(1);

  // If not found by username, try by referralCode
  if (!referrer) {
    [referrer] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.referralCode, normalizedCode))
      .limit(1);
  }

  if (referrer && referrer.id !== dbUser.id) {
    const previousReferrer = dbUser.referredBy;

    const [updatedUser] = await db
      .update(users)
      .set({ referredBy: referrer.id })
      .where(eq(users.id, dbUser.id))
      .returning(userSelectFields);

    if (!updatedUser) {
      throw new InternalServerError('Failed to update user record');
    }

    if (previousReferrer && previousReferrer !== referrer.id) {
      logger.info(
        'Updated user with NEW referrer (latest referral wins)',
        {
          userId: updatedUser.id,
          previousReferrer,
          newReferrer: referrer.id,
          referrerUsername: referrer.username,
          referralCode,
        },
        'GET /api/users/me'
      );
    } else if (!previousReferrer) {
      logger.info(
        'Updated existing user with referrer',
        {
          userId: updatedUser.id,
          referrerId: referrer.id,
          referrerUsername: referrer.username,
          referralCode,
        },
        'GET /api/users/me'
      );
    }

    return updatedUser;
  }

  if (referrer?.id === dbUser.id) {
    logger.warn(
      'Self-referral attempt blocked for existing user',
      { userId: dbUser.id, referralCode },
      'GET /api/users/me'
    );
  }

  return dbUser;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);
  const privyId = authUser.privyId ?? authUser.userId;
  const canonicalUserId = authUser.dbUserId ?? authUser.userId;
  const clientEmbeddedWalletAddressRaw = request.headers.get(
    'x-embedded-wallet-address'
  );
  const clientEmbeddedWalletAddress =
    typeof clientEmbeddedWalletAddressRaw === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(clientEmbeddedWalletAddressRaw.trim())
      ? clientEmbeddedWalletAddressRaw.trim().toLowerCase()
      : null;
  const shouldForcePrivyIdentitySync =
    request.headers.get('x-sync-privy-identities') === '1';

  // Extract referralCode from query params (passed from frontend)
  const { searchParams } = new URL(request.url);
  const referralCode = searchParams.get('ref') || null;

  logger.info(
    'Fetching user profile',
    { privyId, dbUserId: authUser.dbUserId, hasReferralCode: !!referralCode },
    'GET /api/users/me'
  );

  let [dbUser] = await db
    .select(userSelectFields)
    .from(users)
    .where(eq(users.privyId, privyId))
    .limit(1);

  // Create minimal user record on first authentication
  if (!dbUser) {
    // Fetch user data from Privy to get email and social accounts
    let email: string | null = null;
    let farcasterUsername: string | null = null;
    let farcasterFid: string | null = null;
    let twitterUsername: string | null = null;
    let twitterId: string | null = null;
    let embeddedWalletAddress: string | null = null;
    let embeddedWalletId: string | null = null;

    const privyClient = getPrivyClient();
    const privyUser = (await privyClient.getUser(
      privyId
    )) as PrivyUserWithWallets;

    // Extract email from linked accounts
    if (privyUser.email?.address) {
      email = privyUser.email.address;
    }

    // Extract Farcaster info
    if (privyUser.farcaster) {
      farcasterUsername = privyUser.farcaster.username ?? null;
      farcasterFid = privyUser.farcaster.fid
        ? String(privyUser.farcaster.fid)
        : null;
    }

    // Extract Twitter info
    if (privyUser.twitter) {
      twitterUsername = privyUser.twitter.username ?? null;
      twitterId = privyUser.twitter.subject ?? null;
    }

    const embedded = pickEmbeddedEvmWallet(privyUser);
    if (embedded) {
      embeddedWalletId = embedded.walletId;
      embeddedWalletAddress = embedded.address.toLowerCase();
      authUser.walletAddress = embeddedWalletAddress;
    }

    logger.info(
      'Fetched Privy user data for new user',
      {
        privyId,
        hasEmail: !!email,
        hasFarcaster: !!farcasterUsername,
        hasTwitter: !!twitterUsername,
        hasEmbeddedWallet: !!embeddedWalletAddress,
      },
      'GET /api/users/me'
    );

    // Check if Farcaster or Twitter account is already linked to an existing user
    // If found, auto-link the new Privy session to the existing account
    // This allows users to login with their social account and access their existing Babylon account
    if (farcasterFid || twitterId) {
      const conditions = [];
      if (farcasterFid) {
        conditions.push(eq(users.farcasterFid, farcasterFid));
      }
      if (twitterId) {
        conditions.push(eq(users.twitterId, twitterId));
      }

      const existingUsersWithSocial = await db
        .select(userSelectFields)
        .from(users)
        .where(or(...conditions))
        .limit(2);

      // If multiple users found, it means Farcaster and Twitter belong to different accounts
      // Skip auto-linking to prevent linking the wrong account
      if (existingUsersWithSocial.length > 1) {
        logger.warn(
          'Multiple users found with conflicting social accounts - skipping auto-link',
          {
            newPrivyId: privyId,
            farcasterFid,
            twitterId,
            foundUserIds: existingUsersWithSocial.map((u) => u.id),
          },
          'GET /api/users/me'
        );

        // Return error to prevent insert failure due to unique constraint violation
        throw new ConflictError(
          'Your social accounts are linked to different existing users. Please contact support.',
          'User.socialAccounts'
        );
      } else if (existingUsersWithSocial.length === 1) {
        const existingUserWithSocial = existingUsersWithSocial[0]!;
        const matchedByFarcaster =
          !!farcasterFid &&
          existingUserWithSocial.farcasterFid === farcasterFid;
        const matchedByTwitter =
          !!twitterId && existingUserWithSocial.twitterId === twitterId;

        const linkedAccount =
          matchedByFarcaster && matchedByTwitter
            ? 'Farcaster+Twitter'
            : matchedByFarcaster
              ? 'Farcaster'
              : matchedByTwitter
                ? 'Twitter'
                : 'Unknown';

        logger.info(
          'Found existing user by social account - auto-linking new Privy session',
          {
            newPrivyId: privyId,
            oldPrivyId: existingUserWithSocial.privyId,
            existingUserId: existingUserWithSocial.id,
            existingUsername: existingUserWithSocial.username,
            linkedAccount,
            farcasterFid,
            twitterId,
          },
          'GET /api/users/me'
        );

        // Check if the new privyId is already linked to a different user
        const [existingUserWithPrivyId] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.privyId, privyId))
          .limit(1);

        if (
          existingUserWithPrivyId &&
          existingUserWithPrivyId.id !== existingUserWithSocial.id
        ) {
          logger.warn(
            'New privyId already linked to a different user - skipping auto-link to prevent account conflict',
            {
              newPrivyId: privyId,
              existingPrivyUserId: existingUserWithPrivyId.id,
              socialMatchUserId: existingUserWithSocial.id,
            },
            'GET /api/users/me'
          );
          // Skip auto-linking, let normal flow continue
        } else {
          // Update the existing user's privyId to the new one
          const [updatedUser] = await db
            .update(users)
            .set({
              privyId,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUserWithSocial.id))
            .returning(userSelectFields);

          if (updatedUser) {
            dbUser = updatedUser;

            logger.info(
              'Successfully linked new Privy session to existing user',
              {
                userId: updatedUser.id,
                username: updatedUser.username,
                newPrivyId: privyId,
              },
              'GET /api/users/me'
            );
          }
        }
      }
    }

    // If we found and linked to an existing user, skip the new user creation
    if (dbUser) {
      let linkedUser = dbUser;

      if (referralCode && !linkedUser.profileComplete) {
        linkedUser = await updateReferrerForIncompleteUser(
          linkedUser,
          referralCode
        );
      } else if (referralCode && linkedUser.profileComplete) {
        logger.warn(
          'Referral change blocked - profile already complete',
          {
            userId: linkedUser.id,
            referralCode,
            existingReferrer: linkedUser.referredBy,
          },
          'GET /api/users/me'
        );
      }

      // Get cached profile stats for the linked user
      const stats = await getOptionalProfileStats(
        linkedUser.id,
        'GET /api/users/me'
      );

      const responseUser = buildUserResponse(linkedUser, stats);

      const needsOnboarding = !linkedUser.profileComplete;
      const needsOnchain = false;

      logger.info(
        'Returning linked existing user profile',
        {
          userId: linkedUser.id,
          username: linkedUser.username,
          profileComplete: linkedUser.profileComplete,
          onChainRegistered: linkedUser.onChainRegistered,
          needsOnboarding,
          needsOnchain,
        },
        'GET /api/users/me'
      );

      return successResponse({
        authenticated: true,
        needsOnboarding,
        needsOnchain,
        user: responseUser,
      });
    }

    // Resolve referrer if referralCode provided
    let resolvedReferrerId: string | null = null;
    if (referralCode) {
      const normalizedCode = referralCode.trim();

      // First, try to find referrer by username (legacy system, case-insensitive)
      const [referrerByUsername] = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(sql`lower(${users.username}) = lower(${normalizedCode})`)
        .limit(1);

      if (referrerByUsername && referrerByUsername.id !== canonicalUserId) {
        resolvedReferrerId = referrerByUsername.id;

        logger.info(
          'Found valid referrer by username for new user',
          {
            referrerId: referrerByUsername.id,
            referrerUsername: referrerByUsername.username,
            referredUserId: canonicalUserId,
            referralCode: normalizedCode,
          },
          'GET /api/users/me'
        );
      } else if (referrerByUsername?.id === canonicalUserId) {
        logger.warn(
          'Self-referral attempt blocked (username lookup)',
          { userId: canonicalUserId, referralCode: normalizedCode },
          'GET /api/users/me'
        );
      } else {
        // If not found by username, try by referralCode
        const [referrerByCode] = await db
          .select({ id: users.id, username: users.username })
          .from(users)
          .where(eq(users.referralCode, normalizedCode))
          .limit(1);

        if (referrerByCode && referrerByCode.id !== canonicalUserId) {
          resolvedReferrerId = referrerByCode.id;

          logger.info(
            'Found valid referrer by referralCode for new user',
            {
              referrerId: referrerByCode.id,
              referrerUsername: referrerByCode.username,
              referredUserId: canonicalUserId,
              referralCode: normalizedCode,
            },
            'GET /api/users/me'
          );
        } else if (referrerByCode?.id === canonicalUserId) {
          logger.warn(
            'Self-referral attempt blocked (referralCode lookup)',
            { userId: canonicalUserId, referralCode: normalizedCode },
            'GET /api/users/me'
          );
        } else {
          logger.warn(
            'Invalid referral code provided (not found by username or referralCode)',
            { referralCode: normalizedCode, userId: canonicalUserId },
            'GET /api/users/me'
          );
        }
      }
    }

    logger.info(
      'Creating minimal user record on first authentication',
      {
        privyId,
        userId: canonicalUserId,
        walletAddress: authUser.walletAddress,
        referredBy: resolvedReferrerId,
        email,
        emailVerified: !!email,
        farcasterUsername,
        twitterUsername,
      },
      'GET /api/users/me'
    );

    const dbWalletAddress = embeddedWalletAddress?.toLowerCase() ?? null;

    // Check if user should be auto-promoted to admin based on email domain
    // SECURITY: Requires email verification (Privy emails are verified by design)
    // Check ALL linked emails, not just the primary one (handles users who linked admin email later)
    const { adminEmail, allVerifiedEmails } = checkForAdminEmail(privyUser);
    const shouldBeAdmin = adminEmail !== null;

    if (shouldBeAdmin) {
      logger.info(
        'Auto-promoting user to admin based on verified email domain',
        {
          privyId,
          emailDomain: adminEmail?.split('@')[1] ?? null,
          emailCount: allVerifiedEmails.length,
        },
        'GET /api/users/me'
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        id: canonicalUserId,
        privyId,
        privyWalletId: embeddedWalletId,
        walletAddress: dbWalletAddress,
        referredBy: resolvedReferrerId,
        email,
        farcasterUsername,
        farcasterFid,
        twitterUsername,
        twitterId,
        hasFarcaster: !!farcasterUsername,
        hasTwitter: !!twitterUsername,
        profileComplete: false,
        hasUsername: false,
        hasBio: false,
        hasProfileImage: false,
        isAdmin: shouldBeAdmin,
        updatedAt: new Date(),
      })
      .returning(userSelectFields);

    if (!newUser) {
      throw new InternalServerError('Failed to create user record');
    }
    dbUser = newUser;

    logger.info(
      'Minimal user record created',
      {
        userId: dbUser.id,
        privyId,
        referredBy: dbUser.referredBy,
        email: dbUser.email,
      },
      'GET /api/users/me'
    );
  } else if (referralCode && dbUser && !dbUser.profileComplete) {
    // User exists BUT profile not complete - update referredBy with latest referral code (latest wins!)
    // ⚠️ IMPORTANT: Only allow referral changes BEFORE profile completion to prevent gaming
    dbUser = await updateReferrerForIncompleteUser(dbUser, referralCode);
  } else if (referralCode && dbUser && dbUser.profileComplete) {
    // User has completed profile - don't allow referral changes anymore
    logger.warn(
      'Referral change blocked - profile already complete',
      { userId: dbUser.id, referralCode, existingReferrer: dbUser.referredBy },
      'GET /api/users/me'
    );
  }

  // At this point dbUser should always be defined (either fetched or created)
  if (!dbUser) {
    throw new InternalServerError('Failed to create or find user record');
  }

  // =====================================================================================
  // EMBEDDED WALLET BACKFILL
  // =====================================================================================
  //
  // This section handles backfilling/syncing embedded wallet information (privyWalletId
  // and walletAddress) from Privy. This is necessary because:
  //
  // 1. Users created before the embedded wallet refactor may not have privyWalletId stored.
  // 2. The wallet address may need to be synced if the user's embedded wallet changed
  //    (e.g., after account deletion/recreation or session relink).
  //
  // BEHAVIOR:
  // - On each request where wallet data is missing or mismatched, we call Privy's getUser API.
  // - This is intentional for the backfill phase and ensures eventual consistency.
  //
  // PERFORMANCE NOTE:
  // - The Privy API call adds ~100-200ms latency per request when backfill is needed.
  // - Once wallet data is persisted, subsequent requests skip the backfill.
  // - If this becomes a bottleneck in production, consider:
  //   1. Adding a Redis-based cooldown (skip backfill for N minutes after failure)
  //   2. Rate limiting backfill attempts per user session
  //   3. Moving backfill to a background job
  //
  // =====================================================================================
  const dbWalletLower = dbUser.walletAddress?.toLowerCase() ?? null;
  const shouldResyncWallet =
    !!clientEmbeddedWalletAddress &&
    clientEmbeddedWalletAddress !== dbWalletLower;
  const shouldEnsureOfflineWallet =
    !dbWalletLower ||
    !dbUser.privyWalletId ||
    !dbUser.offlineWalletReady ||
    shouldResyncWallet;

  if (shouldEnsureOfflineWallet) {
    try {
      const offlineWallet = await ensureOfflineWalletReady({ privyId });
      const resolvedAddress = offlineWallet.walletAddress.toLowerCase();

      if (
        shouldResyncWallet &&
        resolvedAddress &&
        resolvedAddress !== clientEmbeddedWalletAddress
      ) {
        logger.warn(
          'Client embedded wallet address mismatch; using Privy embedded wallet address',
          {
            userId: dbUser.id,
            dbWalletAddress: dbUser.walletAddress,
            clientEmbeddedWalletAddress,
            privyEmbeddedWalletAddress: resolvedAddress,
          },
          'GET /api/users/me'
        );
      }

      const [updated] = await db
        .update(users)
        .set({
          privyWalletId: offlineWallet.privyWalletId,
          walletAddress: resolvedAddress,
          offlineWalletReady: true,
          offlineWalletReadyAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, dbUser.id))
        .returning(userSelectFields);
      if (updated) dbUser = updated;
    } catch (error) {
      logger.warn(
        'Offline wallet provisioning failed during profile fetch; returning profile without blocking',
        {
          userId: dbUser.id,
          privyId,
          hasPrivyWalletId: !!dbUser.privyWalletId,
          hasWalletAddress: !!dbUser.walletAddress,
          shouldResyncWallet,
          error: error instanceof Error ? error.message : String(error),
        },
        'GET /api/users/me'
      );
    }
  }

  const needsPrivyIdentitySync =
    shouldForcePrivyIdentitySync &&
    shouldSyncMissingPrivyIdentity({
      hasFarcaster: dbUser.hasFarcaster,
      hasTwitter: dbUser.hasTwitter,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
    });
  const needsAdminPromotionCheck = !dbUser.isAdmin;

  if (needsPrivyIdentitySync || needsAdminPromotionCheck) {
    const privyClient = getPrivyClient();
    const privyUser = (await privyClient.getUser(
      privyId
    )) as PrivyUserWithWallets;
    const privyIdentity = extractPrivyIdentitySnapshot(privyUser);

    if (needsPrivyIdentitySync) {
      const syncResult = await syncMissingPrivyIdentityFields(
        dbUser,
        privyIdentity
      );
      dbUser = syncResult.user;

      if (syncResult.newlyLinked.length > 0) {
        logger.info(
          'Synced missing social identities from Privy',
          {
            userId: dbUser.id,
            newlyLinked: syncResult.newlyLinked,
            farcasterFid: privyIdentity.farcasterFid,
            twitterId: privyIdentity.twitterId,
          },
          'GET /api/users/me'
        );
      }

      await awardPointsForNewPrivyIdentityLinks(
        dbUser.id,
        syncResult.newlyLinked,
        privyIdentity
      );
    }

    // Auto-promote existing users to admin if they have a verified admin domain email.
    // This ensures users who later link/verify a company email get admin access.
    if (needsAdminPromotionCheck) {
      const { adminEmail, allVerifiedEmails } = checkForAdminEmail(privyUser);
      const shouldBeAdmin = adminEmail !== null;

      if (shouldBeAdmin) {
        logger.info(
          'Auto-promoting existing user to admin based on verified email domain',
          {
            userId: dbUser.id,
            emailDomain: adminEmail?.split('@')[1] ?? null,
            emailCount: allVerifiedEmails.length,
          },
          'GET /api/users/me'
        );

        const [updatedUser] = await db
          .update(users)
          .set({ isAdmin: true, updatedAt: new Date() })
          .where(eq(users.id, dbUser.id))
          .returning(userSelectFields);

        if (updatedUser) {
          dbUser = updatedUser;
        }
      }
    }
  }

  // Get cached profile stats
  const stats = await getOptionalProfileStats(dbUser.id, 'GET /api/users/me');

  const responseUser = buildUserResponse(dbUser, stats);

  const needsOnboarding = !dbUser.profileComplete;
  const needsOnchain = false;

  logger.info(
    'Authenticated user profile fetched',
    {
      userId: dbUser.id,
      username: dbUser.username,
      profileComplete: dbUser.profileComplete,
      onChainRegistered: dbUser.onChainRegistered,
      nftTokenId: dbUser.nftTokenId,
      needsOnboarding,
      needsOnchain,
    },
    'GET /api/users/me'
  );

  return successResponse({
    authenticated: true,
    needsOnboarding,
    needsOnchain,
    user: responseUser,
  });
});

const updateCurrentUserProfile = withErrorHandling(
  async (request: NextRequest) => {
    const authUser = await authenticateWithDbUser(request);

    return updateProfilePOST(request, {
      params: Promise.resolve({ userId: authUser.dbUserId }),
    });
  }
);

export const POST = withErrorHandling(async (request: NextRequest) => {
  return updateCurrentUserProfile(request);
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  return updateCurrentUserProfile(request);
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  return updateCurrentUserProfile(request);
});
