/**
 * Game Onboarding Skip API
 *
 * @route POST /api/onboarding/game-skip - Skip the onboarding tutorial
 * @access Private (authenticated users only)
 *
 * @description
 * Allows a user to skip the game onboarding tutorial.
 * Sets the onboarding as complete without awarding any points.
 */

import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { skipOnboarding } from '@babylon/engine';
import type { NextRequest } from 'next/server';

/**
 * POST /api/onboarding/game-skip
 *
 * Skips the onboarding tutorial for the authenticated user.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  await skipOnboarding(user.userId);

  return successResponse({ success: true });
});
