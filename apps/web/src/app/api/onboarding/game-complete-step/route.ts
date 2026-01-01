/**
 * Game Onboarding Complete Step API
 *
 * @route POST /api/onboarding/game-complete-step - Complete an onboarding step
 * @access Private (authenticated users only)
 *
 * @description
 * Marks an onboarding step as complete for the authenticated user.
 * Awards points for the completed step.
 */

import { authenticate, successResponse, withErrorHandling } from '@babylon/api';
import type { GameOnboardingStep } from '@babylon/db';
import { completeOnboardingStep } from '@babylon/engine';
import type { NextRequest } from 'next/server';

interface CompleteStepRequest {
  step: GameOnboardingStep;
}

/**
 * POST /api/onboarding/game-complete-step
 *
 * Completes an onboarding step for the authenticated user.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  const body = (await request.json()) as CompleteStepRequest;
  const { step } = body;

  if (!step) {
    throw new Error('Step is required');
  }

  const result = await completeOnboardingStep(user.userId, step);

  return successResponse({
    success: true,
    pointsAwarded: result.pointsAwarded,
    nextStep: result.nextStep,
    isComplete: result.isComplete,
  });
});
