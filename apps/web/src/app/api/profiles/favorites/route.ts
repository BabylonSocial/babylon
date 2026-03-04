/**
 * Profiles Favorites API
 *
 * @route GET /api/profiles/favorites - Get favorited profiles
 * @access Authenticated
 *
 * @description
 * Returns list of profiles favorited by the authenticated user. Supports
 * pagination.
 *
 * @example
 * ```typescript
 * const { favorites } = await fetch('/api/profiles/favorites?limit=20', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * }).then(r => r.json());
 * ```
 */

import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { asUser } from '@babylon/db';
import { logger, PaginationSchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * GET /api/profiles/favorites
 * Get list of profiles the authenticated user has favorited
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await authenticate(request);

  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  };
  PaginationSchema.partial().parse(queryParams);

  // Get favorited profiles with RLS
  const favoritedProfiles = await asUser(user, async (db) => {
    // Get favorited profiles
    const favorites = await db.favorite.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get user details for each favorited user
    const targetUserIds = favorites.map((f) => f.targetUserId);
    const targetUsers = await db.user.findMany({
      where: {
        id: { in: targetUserIds },
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        profileImageUrl: true,
        bio: true,
        isActor: true,
      },
    });
    const userMap = new Map(targetUsers.map((u) => [u.id, u]));

    // Get post counts and favorite counts for each profile
    const profiles = await Promise.all(
      favorites.map(async (favorite) => {
        const targetUser = userMap.get(favorite.targetUserId);
        if (!targetUser) return null;

        const [postCount, favoriteCount] = await Promise.all([
          db.post.count({
            where: { authorId: targetUser.id },
          }),
          db.favorite.count({
            where: { targetUserId: targetUser.id },
          }),
        ]);

        return {
          id: targetUser.id,
          displayName: targetUser.displayName,
          username: targetUser.username,
          profileImageUrl: targetUser.profileImageUrl,
          bio: targetUser.bio,
          isActor: targetUser.isActor,
          postCount,
          favoriteCount,
          favoritedAt: favorite.createdAt,
          isFavorited: true,
        };
      })
    );

    return profiles.filter((p): p is NonNullable<typeof p> => p !== null);
  });

  logger.info(
    'Favorited profiles fetched successfully',
    { userId: user.userId, count: favoritedProfiles.length },
    'GET /api/profiles/favorites'
  );

  return successResponse({
    profiles: favoritedProfiles,
    total: favoritedProfiles.length,
  });
});
