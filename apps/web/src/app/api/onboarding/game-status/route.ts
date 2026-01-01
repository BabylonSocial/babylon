/**
 * Game Onboarding Status API
 *
 * @route GET /api/onboarding/game-status - Get game onboarding status
 * @access Private (authenticated users only)
 *
 * @description
 * Returns the current game tutorial onboarding status for the authenticated user.
 */

import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import { getOrCreateOnboarding } from '@babylon/engine';
import type { NextRequest } from 'next/server';

/**
 * GET /api/onboarding/game-status
 *
 * Returns current game onboarding status for the authenticated user.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  const onboarding = await getOrCreateOnboarding(user.userId);
  const state = onboarding.state;

  // Calculate total points earned
  const totalPointsEarned =
    state?.rewards?.reduce(
      (sum: number, r: { points: number }) => sum + r.points,
      0
    ) ?? 0;

  return successResponse({
    currentStep: onboarding.currentStep,
    completedSteps: state?.completedSteps ?? [],
    totalPointsEarned,
    isComplete: onboarding.isComplete,
  });
});
