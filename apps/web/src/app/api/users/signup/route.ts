/**
 * User Signup API
 *
 * @route POST /api/users/signup - Complete user signup/onboarding
 * @access Authenticated
 *
 * @description
 * Completes off-chain user onboarding with profile creation, referral handling,
 * social account linking, and points awards. Supports waitlist users, legal
 * acceptance tracking, and identity token verification from Privy.
 *
 * @openapi
 * /api/users/signup:
 *   post:
 *     tags:
 *       - Users
 *     summary: Complete user signup
 *     description: Completes off-chain onboarding with profile creation and points awards
 *     security:
 *       - PrivyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - displayName
 *             properties:
 *               username:
 *                 type: string
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImageUrl:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               referralCode:
 *                 type: string
 *               identityToken:
 *                 type: string
 *                 description: Privy identity token for social account linking
 *               isWaitlist:
 *                 type: boolean
 *                 default: false
 *               tosAccepted:
 *                 type: boolean
 *               privacyPolicyAccepted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Signup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 referral:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Username taken or invalid input
 *       401:
 *         description: Unauthorized
 *
 * @example
 * ```typescript
 * await fetch('/api/users/signup', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     username: 'alice',
 *     displayName: 'Alice',
 *     bio: 'Hello world',
 *     referralCode: 'friend123'
 *   })
 * });
 * ```
 *
 * @see {@link /lib/services/points-service} Points service
 * @see {@link /lib/onboarding/types} Onboarding types
 */

import type { User as PrivyUser } from '@privy-io/server-auth';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { and, db, eq, follows, referrals, users, withTransaction } from '@babylon/db';
import { isRetryableError, withRetry } from '@babylon/db';
import { toDatabaseErrorType } from '@babylon/db';
import { authenticate, getPrivyClient } from '@babylon/api';
import { POINTS } from '@babylon/shared';
import { ConflictError, InternalServerError } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import type { OnboardingProfilePayload } from '@babylon/shared';
import { trackServerEvent } from '@/lib/posthog/server';
import { notifyNewAccount } from '@babylon/api';
import { PointsService } from '@babylon/api';
import { getOrCreateReferralCode } from '@babylon/api';
import { generateSnowflakeId } from '@babylon/shared';
import { getHashedClientIp } from '@babylon/api';
import { OnboardingProfileSchema } from '@babylon/shared';
import type { JsonValue } from '@babylon/api';

interface SignupRequestBody {
  username: string;
  displayName: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  referralCode?: string | null;
  identityToken?: string | null;
  isWaitlist?: boolean; // Mark user as waitlist during signup
  tosAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
}

type PrivyWalletLite = {
  id?: string | null;
  address?: string;
  chainType?: string;
  walletClientType?: string | null;
};

type PrivyUserWithSmartWallet = PrivyUser & {
  smartWallet?: { address?: string | null };
  wallet?: PrivyWalletLite;
  linkedAccounts?: Array<
    PrivyWalletLite & {
      type?: string;
    }
  >;
};

function pickEmbeddedEvmWallet(user: PrivyUserWithSmartWallet): PrivyWalletLite | null {
  const candidates: PrivyWalletLite[] = [];
  if (user.wallet) candidates.push(user.wallet);
  if (Array.isArray(user.linkedAccounts)) {
    for (const acc of user.linkedAccounts) {
      if (acc?.type === 'wallet') candidates.push(acc);
    }
  }
  return (
    candidates.find(
      (w) =>
        (w.walletClientType === 'privy' || Boolean(w.id)) &&
        (!w.chainType || w.chainType === 'ethereum') &&
        typeof w.address === 'string'
    ) ?? null
  );
}

async function ensureSmartWalletAddress(
  privyClient: ReturnType<typeof getPrivyClient>,
  privyId: string
): Promise<{ smartWalletAddress: string | null; embeddedWalletAddress: string | null }> {
  try {
    const user = (await privyClient.getUser(privyId)) as PrivyUserWithSmartWallet;
    let smartWalletAddress = user.smartWallet?.address?.toLowerCase() ?? null;
    let embeddedWallet = pickEmbeddedEvmWallet(user);

    if (!smartWalletAddress) {
      const updated = (await privyClient.createWallets({
        userId: privyId,
        createEthereumSmartWallet: true,
        // Only create a new embedded wallet if none exists
        createEthereumWallet: !embeddedWallet,
      })) as PrivyUserWithSmartWallet;

      smartWalletAddress = updated.smartWallet?.address?.toLowerCase() ?? null;
      embeddedWallet = embeddedWallet ?? pickEmbeddedEvmWallet(updated);
    }

    return {
      smartWalletAddress,
      embeddedWalletAddress: embeddedWallet?.address?.toLowerCase() ?? null,
    };
  } catch (error) {
    logger.warn(
      'Failed to ensure smart wallet for user',
      { privyId, error },
      'POST /api/users/signup'
    );
    return { smartWalletAddress: null, embeddedWalletAddress: null };
  }
}

const SignupSchema = OnboardingProfileSchema.extend({
  identityToken: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  isWaitlist: z.boolean().optional().default(false),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);
  const body = (await request.json()) as
    | SignupRequestBody
    | Record<string, JsonValue>;

  const parsedBody = SignupSchema.parse(body);
  const {
    identityToken,
    referralCode: rawReferralCode,
    isWaitlist,
    ...profileData
  } = parsedBody;
  const parsedProfile = profileData as OnboardingProfilePayload;
  const referralCode = rawReferralCode?.trim() || null;

  const canonicalUserId = authUser.dbUserId ?? authUser.userId;
  const privyId = authUser.privyId ?? authUser.userId;
  // Prefer Privy smart wallet (AA) address over legacy/linked wallets
  let walletAddress = authUser.walletAddress?.toLowerCase() ?? null;

  // Capture and hash IP address for self-referral detection
  const registrationIpHash = getHashedClientIp(request.headers);

  // Fetch identity data from Privy if token provided
  let identityFarcasterUsername: string | undefined;
  let identityTwitterUsername: string | undefined;

  if (identityToken) {
    try {
      const privyClient = getPrivyClient();
      const identityUser: PrivyUser =
        await privyClient.getUserFromIdToken(identityToken);

      identityFarcasterUsername = identityUser.farcaster?.username ?? undefined;
      identityTwitterUsername = identityUser.twitter?.username ?? undefined;
    } catch (error) {
      logger.warn(
        'Failed to decode identity token during signup',
        { error },
        'POST /api/users/signup'
      );
    }
  } else {
    logger.info(
      'Signup received no identity token; proceeding with provided payload only',
      undefined,
      'POST /api/users/signup'
    );
  }

  // Check for imported social data from onboarding flow
  const importedTwitter = parsedProfile.importedFrom === 'twitter';
  const importedFarcaster = parsedProfile.importedFrom === 'farcaster';

  // Ensure smart wallet exists and prefer its address for DB persistence
  const privyClient = getPrivyClient();
  const { smartWalletAddress, embeddedWalletAddress } = await ensureSmartWalletAddress(
    privyClient,
    privyId
  );
  walletAddress =
    smartWalletAddress ??
    embeddedWalletAddress ??
    authUser.walletAddress?.toLowerCase() ??
    null;

  // Wrap transaction with retry logic for connection errors
  const result = await withRetry(
    async () => {
      return await withTransaction(async (tx) => {
        // Check if username is already taken by another user
        const [existingUsername] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, parsedProfile.username))
          .limit(1);

        if (existingUsername && existingUsername.id !== canonicalUserId) {
          throw new ConflictError('Username is already taken', 'User.username');
        }

        // Check if wallet address is already linked to another user
        if (walletAddress) {
          const [existingWallet] = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.walletAddress, walletAddress))
            .limit(1);

          if (existingWallet && existingWallet.id !== canonicalUserId) {
            throw new ConflictError(
              'Wallet address is already linked to another account',
              'User.walletAddress'
            );
          }
        }

        // Resolve referral (if provided AND not already set)
        let resolvedReferrerId: string | null = null;
        let resolvedReferralRecordId: string | null = null;
        const normalizedCode = referralCode?.trim() || null;

        // Check if user already has referredBy (set in /api/users/me)
        const [existingUser] = await tx
          .select({ referredBy: users.referredBy })
          .from(users)
          .where(eq(users.id, canonicalUserId))
          .limit(1);

        // Only resolve referral if not already set
        if (!existingUser?.referredBy && normalizedCode) {
          // First, try to find referrer by username (legacy system)
          const [referrerByUsername] = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, normalizedCode))
            .limit(1);

          if (referrerByUsername && referrerByUsername.id !== canonicalUserId) {
            resolvedReferrerId = referrerByUsername.id;
          } else {
            // If not found by username, look up who owns this referral code
            const [referralOwner] = await tx
              .select({ id: users.id })
              .from(users)
              .where(eq(users.referralCode, normalizedCode))
              .limit(1);

            if (referralOwner && referralOwner.id !== canonicalUserId) {
              resolvedReferrerId = referralOwner.id;
            }
          }

          // Note: Referral record will be created AFTER user upsert to satisfy FK constraint
        } else if (existingUser?.referredBy) {
          // User already has referredBy (set in /api/users/me)
          resolvedReferrerId = existingUser.referredBy;
          logger.info(
            'Using existing referredBy from user record',
            {
              userId: canonicalUserId,
              referredBy: resolvedReferrerId,
            },
            'POST /api/users/signup'
          );
        }

        const baseUserData: Partial<typeof users.$inferInsert> = {
          username: parsedProfile.username,
          displayName: parsedProfile.displayName,
          email: parsedProfile.email || null,
          bio: parsedProfile.bio ?? '',
          profileImageUrl: parsedProfile.profileImageUrl ?? null,
          coverImageUrl: parsedProfile.coverImageUrl ?? null,
          walletAddress,
          profileComplete: true,
          profileSetupCompletedAt: new Date(), // Track when profile was completed
          hasUsername: true,
          hasBio: Boolean(
            parsedProfile.bio && parsedProfile.bio.trim().length > 0
          ),
          hasProfileImage: Boolean(parsedProfile.profileImageUrl),
          // Waitlist users start with 100 points instead of 1000
          ...(isWaitlist ? { reputationPoints: 100 } : {}),
          // Store IP hash for self-referral detection
          ...(registrationIpHash ? { registrationIpHash } : {}),
          // Legal acceptance (GDPR compliance)
          ...(parsedProfile.tosAccepted
            ? {
                tosAccepted: true,
                tosAcceptedAt: new Date(),
                tosAcceptedVersion: '2025-11-11',
              }
            : {}),
          ...(parsedProfile.privacyPolicyAccepted
            ? {
                privacyPolicyAccepted: true,
                privacyPolicyAcceptedAt: new Date(),
                privacyPolicyAcceptedVersion: '2025-11-11',
              }
            : {}),
        };

        // Handle Farcaster from Privy identity or onboarding import
        if (identityFarcasterUsername || importedFarcaster) {
          baseUserData.hasFarcaster = true;
          baseUserData.farcasterUsername =
            parsedProfile.farcasterUsername ?? identityFarcasterUsername;
          if (parsedProfile.farcasterFid) {
            baseUserData.farcasterFid = parsedProfile.farcasterFid;
          }
        }

        // Handle Twitter from Privy identity or onboarding import
        if (identityTwitterUsername || importedTwitter) {
          baseUserData.hasTwitter = true;
          baseUserData.twitterUsername =
            parsedProfile.twitterUsername ?? identityTwitterUsername;
          if (parsedProfile.twitterId) {
            baseUserData.twitterId = parsedProfile.twitterId;
          }
        }

        // Upsert user (insert or update)
        let user: typeof users.$inferSelect;
        const [existingUserRecord] = await tx
          .select()
          .from(users)
          .where(eq(users.id, canonicalUserId))
          .limit(1);

        if (existingUserRecord) {
          // Update existing user
          const [updatedUser] = await tx
            .update(users)
            .set({
              ...baseUserData,
              referredBy: resolvedReferrerId ?? existingUserRecord.referredBy,
              updatedAt: new Date(),
            })
            .where(eq(users.id, canonicalUserId))
            .returning();
          if (!updatedUser) {
            throw new InternalServerError('Failed to update user record');
          }
          user = updatedUser;
        } else {
          // Create new user
          const [newUser] = await tx
            .insert(users)
            .values({
              id: canonicalUserId,
              privyId,
              ...baseUserData,
              referredBy: resolvedReferrerId,
              updatedAt: new Date(),
            })
            .returning();
          if (!newUser) {
            throw new InternalServerError('Failed to create user record');
          }
          user = newUser;
        }

        // Create referral record AFTER user exists (to satisfy FK constraint)
        if (resolvedReferrerId && normalizedCode) {
          // Check if referral record already exists
          const [existingReferral] = await tx
            .select({ id: referrals.id })
            .from(referrals)
            .where(
              and(
                eq(referrals.referralCode, normalizedCode),
                eq(referrals.referredUserId, user.id)
              )
            )
            .limit(1);

          if (existingReferral) {
            // Update existing record
            await tx
              .update(referrals)
              .set({ status: 'pending' })
              .where(eq(referrals.id, existingReferral.id));
            resolvedReferralRecordId = existingReferral.id;
          } else {
            // Create new referral record
            const referralId = await generateSnowflakeId();
            const [referralRecord] = await tx
              .insert(referrals)
              .values({
                id: referralId,
                referrerId: resolvedReferrerId,
                referralCode: normalizedCode,
                referredUserId: user.id,
                status: 'pending',
              })
              .returning({ id: referrals.id });
            if (!referralRecord) {
              throw new InternalServerError('Failed to create referral record');
            }
            resolvedReferralRecordId = referralRecord.id;
          }
        }

        return {
          user,
          referrerId: resolvedReferrerId,
          referralRecordId: resolvedReferralRecordId,
        };
      });
    },
    3, // maxRetries
    200 // delayMs
  ).catch((error: unknown) => {
    // Improve error message for connection errors
    if (isRetryableError(toDatabaseErrorType(error))) {
      logger.error(
        'Database connection error during signup transaction',
        { error: error instanceof Error ? error.message : String(error) },
        'POST /api/users/signup'
      );
      throw new Error(
        'Database connection error. Please try again in a moment.'
      );
    }
    throw error;
  });

  // Generate referral code for new user (ensures they can refer others immediately)
  await getOrCreateReferralCode(result.user.id);

  // Award points for social account linking
  const pointsAwarded = {
    farcaster: 0,
    twitter: 0,
    wallet: 0,
    profile: 0,
    referral: 0,
    referralBonus: 0,
  };

  // Award referral points if user was referred
  if (result.referrerId) {
    // Award points to REFERRER
    const referralResult = await PointsService.awardReferralSignup(
      result.referrerId,
      result.user.id
    );
    pointsAwarded.referral = referralResult.pointsAwarded;

    // Only proceed with referral rewards if referrer was successfully awarded
    if (referralResult.success) {
      // Award bonus to NEW USER (referee) for using referral code
      const refereeBonus = await PointsService.awardPoints(
        result.user.id,
        POINTS.REFERRAL_BONUS,
        'referral_bonus',
        { referrerId: result.referrerId }
      );
      pointsAwarded.referralBonus = refereeBonus.pointsAwarded;

      // Update referral status to completed
      if (result.referralRecordId) {
        await db
          .update(referrals)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(referrals.id, result.referralRecordId));
      }

      // Auto-follow the referrer (new user follows the person who referred them)
      // Check if follow already exists
      const [existingFollow] = await db
        .select({ id: follows.id })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, result.user.id),
            eq(follows.followingId, result.referrerId)
          )
        )
        .limit(1);

      if (!existingFollow) {
        const followId = await generateSnowflakeId();
        await db.insert(follows).values({
          id: followId,
          followerId: result.user.id,
          followingId: result.referrerId,
        });
      }

      logger.info(
        'Awarded referral points to both referrer and referee',
        {
          referrerId: result.referrerId,
          referredUserId: result.user.id,
          referrerPoints: referralResult.pointsAwarded,
          refereeBonus: refereeBonus.pointsAwarded,
        },
        'POST /api/users/signup'
      );
    } else {
      // Referral was blocked (self-referral, weekly limit, etc.)
      // Update referral status to rejected
      if (result.referralRecordId) {
        await db
          .update(referrals)
          .set({ status: 'rejected' })
          .where(eq(referrals.id, result.referralRecordId));
      }

      logger.warn(
        'Referral blocked - referrer not rewarded',
        {
          referrerId: result.referrerId,
          referredUserId: result.user.id,
          error: referralResult.error,
        },
        'POST /api/users/signup'
      );
    }
  }

  if (identityFarcasterUsername || importedFarcaster) {
    const farcasterUsername =
      parsedProfile.farcasterUsername ?? identityFarcasterUsername;
    if (farcasterUsername) {
      const pointsResult = await PointsService.awardFarcasterLink(
        result.user.id,
        farcasterUsername
      );
      pointsAwarded.farcaster = pointsResult.pointsAwarded;
      logger.info(
        'Awarded Farcaster link points',
        {
          userId: result.user.id,
          username: farcasterUsername,
          points: pointsResult.pointsAwarded,
        },
        'POST /api/users/signup'
      );
    }
  }
  if (identityTwitterUsername || importedTwitter) {
    const twitterUsername =
      parsedProfile.twitterUsername ?? identityTwitterUsername;
    if (twitterUsername) {
      const pointsResult = await PointsService.awardTwitterLink(
        result.user.id,
        twitterUsername
      );
      pointsAwarded.twitter = pointsResult.pointsAwarded;
      logger.info(
        'Awarded Twitter link points',
        {
          userId: result.user.id,
          username: twitterUsername,
          points: pointsResult.pointsAwarded,
        },
        'POST /api/users/signup'
      );
    }
  }
  if (walletAddress) {
    const pointsResult = await PointsService.awardWalletConnect(
      result.user.id,
      walletAddress
    );
    pointsAwarded.wallet = pointsResult.pointsAwarded;
    logger.info(
      'Awarded wallet connect points',
      {
        userId: result.user.id,
        address: walletAddress,
        points: pointsResult.pointsAwarded,
      },
      'POST /api/users/signup'
    );
  }

  if (!result.user.pointsAwardedForProfile) {
    const pointsResult = await PointsService.awardProfileCompletion(
      result.user.id
    );
    pointsAwarded.profile = pointsResult.pointsAwarded;
    logger.info(
      'Awarded profile completion points',
      { userId: result.user.id, points: pointsResult.pointsAwarded },
      'POST /api/users/signup'
    );
  }

  const totalPointsAwarded = Object.values(pointsAwarded).reduce(
    (sum, p) => sum + p,
    0
  );

  logger.info(
    'User completed off-chain onboarding',
    {
      userId: result.user.id,
      hasReferrer: Boolean(result.referrerId),
      pointsAwarded: pointsAwarded,
      totalPointsAwarded: totalPointsAwarded,
      hasFarcaster: result.user.hasFarcaster,
      hasTwitter: result.user.hasTwitter,
    },
    'POST /api/users/signup'
  );

  try {
    await notifyNewAccount(result.user.id);
  } catch (error) {
    logger.warn(
      'Failed to send welcome notification',
      { userId: result.user.id, error },
      'POST /api/users/signup'
    );
  }

  // Track signup with PostHog
  await trackServerEvent(result.user.id, 'signup_completed', {
    username: result.user.username,
    hasReferrer: Boolean(result.referrerId),
    hasFarcaster: result.user.hasFarcaster,
    hasTwitter: result.user.hasTwitter,
    hasProfileImage: result.user.hasProfileImage,
    hasBio: result.user.hasBio,
    onChainRegistered: result.user.onChainRegistered,
    pointsAwarded: totalPointsAwarded,
    pointsBreakdown: pointsAwarded,
    importedFrom: parsedProfile.importedFrom || null,
  });

  return successResponse({
    user: {
      id: result.user.id,
      privyId: result.user.privyId,
      username: result.user.username,
      displayName: result.user.displayName,
      bio: result.user.bio,
      profileImageUrl: result.user.profileImageUrl,
      coverImageUrl: result.user.coverImageUrl,
      walletAddress: result.user.walletAddress,
      profileComplete: result.user.profileComplete,
      hasUsername: result.user.hasUsername,
      hasBio: result.user.hasBio,
      hasProfileImage: result.user.hasProfileImage,
      onChainRegistered: result.user.onChainRegistered,
      nftTokenId: result.user.nftTokenId,
      referralCode: result.user.referralCode,
      referredBy: result.user.referredBy,
      reputationPoints: result.user.reputationPoints,
      pointsAwardedForProfile: result.user.pointsAwardedForProfile,
      hasFarcaster: result.user.hasFarcaster,
      hasTwitter: result.user.hasTwitter,
      farcasterUsername: result.user.farcasterUsername,
      twitterUsername: result.user.twitterUsername,
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString(),
    },
    referral: result.referrerId
      ? {
          referrerId: result.referrerId,
          referralRecordId: result.referralRecordId,
        }
      : null,
  });
});
