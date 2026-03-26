/**
 * User Management Utilities
 *
 * @description Utilities for ensuring users exist in the database and managing
 * canonical user IDs. Handles user creation and updates based on authentication
 * information.
 */

import { eq, type User } from '@babylon/db';
import { db, users } from '@babylon/db/runtime';
import type { AuthenticatedUser } from '../auth-middleware';
import { cachedDb } from '../cache/cached-database-service';

/**
 * Options for ensuring user exists
 *
 * @description Configuration options for user creation/update.
 */
export interface EnsureUserOptions {
  displayName?: string;
  username?: string | null;
  isActor?: boolean;
}

export type CanonicalUser = Pick<
  User,
  | 'id'
  | 'privyId'
  | 'username'
  | 'displayName'
  | 'walletAddress'
  | 'isActor'
  | 'profileImageUrl'
>;

/**
 * Ensure user exists in database for authenticated user
 *
 * @description Creates or updates a user record based on authenticated user
 * information. Uses upsert to handle both new and existing users. Updates
 * dbUserId on the authenticated user object.
 *
 * @param {AuthenticatedUser} user - Authenticated user information
 * @param {EnsureUserOptions} [options={}] - Options for user creation/update
 * @returns {Promise<{user: CanonicalUser}>} Canonical user object
 *
 * @example
 * ```typescript
 * const { user } = await ensureUserForAuth(authUser, {
 *   username: 'alice',
 *   displayName: 'Alice'
 * });
 * ```
 */
export async function ensureUserForAuth(
  user: AuthenticatedUser,
  options: EnsureUserOptions = {}
): Promise<{ user: CanonicalUser }> {
  const privyId = user.privyId ?? user.userId;

  // Check if user exists
  const existing = await db
    .select({
      id: users.id,
      privyId: users.privyId,
      username: users.username,
      displayName: users.displayName,
      walletAddress: users.walletAddress,
      isActor: users.isActor,
      profileImageUrl: users.profileImageUrl,
    })
    .from(users)
    .where(eq(users.privyId, privyId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    // User exists - update if needed
    const existingUser = existing[0];
    const updateData: Partial<typeof users.$inferInsert> = {};

    if (
      user.walletAddress &&
      user.walletAddress !== existingUser.walletAddress
    ) {
      updateData.walletAddress = user.walletAddress;
    }
    if (
      options.username !== undefined &&
      options.username !== existingUser.username
    ) {
      updateData.username = options.username;
    }
    if (
      options.isActor !== undefined &&
      options.isActor !== existingUser.isActor
    ) {
      updateData.isActor = options.isActor;
    }
    if (options.displayName !== undefined && !existingUser.displayName) {
      updateData.displayName = options.displayName;
    }

    if (Object.keys(updateData).length > 0) {
      const oldUsername = existingUser.username;
      const oldPrivyId = existingUser.privyId;

      const updated = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
        .returning({
          id: users.id,
          privyId: users.privyId,
          username: users.username,
          displayName: users.displayName,
          walletAddress: users.walletAddress,
          isActor: users.isActor,
          profileImageUrl: users.profileImageUrl,
        });

      const updatedUser = updated[0]!;
      user.dbUserId = updatedUser.id;

      // Refresh identifier caches after any successful user update because lookups
      // now cache the full user row under identifier-based keys.
      const usernameChanged =
        options.username !== undefined && oldUsername !== updatedUser.username;
      const privyIdChanged = oldPrivyId !== updatedUser.privyId;

      await cachedDb.invalidateUserIdentifierCaches(
        {
          id: updatedUser.id,
          privyId: updatedUser.privyId,
          username: updatedUser.username,
        },
        {
          username: usernameChanged ? oldUsername : undefined,
          privyId: privyIdChanged ? oldPrivyId : undefined,
        }
      );

      return { user: updatedUser };
    }

    user.dbUserId = existingUser.id;
    return { user: existingUser };
  }

  // Create new user
  const createData: typeof users.$inferInsert = {
    id: user.dbUserId ?? user.userId,
    privyId,
    isActor: options.isActor ?? false,
    // New users start with 1000 virtual balance + 1000 base reputation (see db schema defaults).
    // totalPoints = wallet + rep; keep consistent so leaderboard doesn't show 0 until the cron recompute runs.
    totalPoints: '2000',
    totalPointsDirtyAt: new Date(),
    updatedAt: new Date(),
  };

  if (user.walletAddress) {
    createData.walletAddress = user.walletAddress;
  }
  if (options.username !== undefined) {
    createData.username = options.username ?? null;
  }
  if (options.displayName !== undefined) {
    createData.displayName = options.displayName;
  }

  const created = await db.insert(users).values(createData).returning({
    id: users.id,
    privyId: users.privyId,
    username: users.username,
    displayName: users.displayName,
    walletAddress: users.walletAddress,
    isActor: users.isActor,
    profileImageUrl: users.profileImageUrl,
  });

  const createdUser = created[0]!;
  user.dbUserId = createdUser.id;

  // Invalidate identifier caches for the new user (clears negative cache)
  await cachedDb.invalidateUserIdentifierCaches({
    id: createdUser.id,
    privyId: createdUser.privyId,
    username: createdUser.username,
  });

  return { user: createdUser };
}

/**
 * Get canonical user ID
 *
 * @description Returns the database user ID if available, otherwise falls
 * back to the authentication user ID. Ensures a consistent user ID format.
 *
 * @param {Pick<AuthenticatedUser, 'userId' | 'dbUserId'>} user - User object with IDs
 * @returns {string} Canonical user ID
 *
 * @example
 * ```typescript
 * const userId = getCanonicalUserId(authUser);
 * // Returns dbUserId if set, otherwise userId
 * ```
 */
export function getCanonicalUserId(
  user: Pick<AuthenticatedUser, 'userId' | 'dbUserId'>
): string {
  return user.dbUserId ?? user.userId;
}
