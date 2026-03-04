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

import {
  authenticate,
  checkRateLimitAsync,
  RATE_LIMIT_CONFIGS,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { getOnboardingStatus, skipOnboarding } from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/onboarding/game-skip
 *
 * Skips the onboarding tutorial for the authenticated user.
 */

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  // Rate limit: prevent abusive rapid calls to skip onboarding
  const rateLimit = await checkRateLimitAsync(
    user.userId,
    RATE_LIMIT_CONFIGS.UPDATE_PROFILE // 5 per minute - reasonable for profile-like updates
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  await skipOnboarding(user.userId);

  logger.info(
    `User skipped onboarding`,
    { userId: user.userId },
    'GameOnboarding'
  );

  const onboardingStatus = await getOnboardingStatus(user.userId);

  return successResponse({ success: true, onboardingStatus });
});
