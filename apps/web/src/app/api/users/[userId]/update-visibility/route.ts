/**
 * User Visibility Preferences API
 *
 * @route POST /api/users/[userId]/update-visibility - Update visibility preferences
 * @access Authenticated (own profile only)
 *
 * @description
 * Updates social media visibility preferences (Twitter, Farcaster, wallet address).
 * Controls which social accounts are shown publicly on user profile.
 *
 * @example
 * ```typescript
 * await fetch(`/api/users/${userId}/update-visibility`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     platform: 'twitter',
 *     visible: true
 *   })
 * });
 * ```
 */

import {
  AuthorizationError,
  authenticate,
  requireUserByIdentifier,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { db, eq, users } from '@babylon/db';
import { logger, UserIdParamSchema } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const UpdateVisibilityRequestSchema = z.object({
  platform: z.enum(['twitter', 'farcaster', 'wallet']),
  visible: z.boolean(),
});

export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
  ) => {
    // Authenticate user
    const authUser = await authenticate(request);
    const params = await context.params;
    const { userId } = UserIdParamSchema.parse(params);
    const targetUser = await requireUserByIdentifier(userId, { id: true });
    const canonicalUserId = targetUser.id;

    // Verify user is updating their own preferences
    if (authUser.userId !== canonicalUserId) {
      throw new AuthorizationError(
        'You can only update your own visibility preferences',
        'visibility-preferences',
        'update'
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { platform, visible } = UpdateVisibilityRequestSchema.parse(body);

    // Build update data based on platform
    const updateData: Partial<typeof users.$inferInsert> = {};
    switch (platform) {
      case 'twitter':
        updateData.showTwitterPublic = visible;
        break;
      case 'farcaster':
        updateData.showFarcasterPublic = visible;
        break;
      case 'wallet':
        updateData.showWalletPublic = visible;
        break;
    }

    // Update user visibility preference
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, canonicalUserId))
      .returning({
        id: users.id,
        showTwitterPublic: users.showTwitterPublic,
        showFarcasterPublic: users.showFarcasterPublic,
        showWalletPublic: users.showWalletPublic,
      });

    logger.info(
      `User ${canonicalUserId} updated ${platform} visibility to ${visible}`,
      { userId: canonicalUserId, platform, visible },
      'POST /api/users/[userId]/update-visibility'
    );

    return successResponse({
      success: true,
      visibility: {
        twitter: updatedUser?.showTwitterPublic ?? false,
        farcaster: updatedUser?.showFarcasterPublic ?? false,
        wallet: updatedUser?.showWalletPublic ?? false,
      },
    });
  }
);
