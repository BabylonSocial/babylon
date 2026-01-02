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
import { completeOnboardingStep } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Valid onboarding steps for validation
 */
const GameOnboardingStepSchema = z.enum([
  'welcome',
  'explore_feed',
  'follow_npc',
  'view_markets',
  'first_prediction',
  'first_trade',
  'complete',
]);

const CompleteStepRequestSchema = z.object({
  step: GameOnboardingStepSchema,
});

/**
 * POST /api/onboarding/game-complete-step
 *
 * Completes an onboarding step for the authenticated user.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticate(request);

  const body = await request.json();
  const { step } = CompleteStepRequestSchema.parse(body);

  const result = await completeOnboardingStep(user.userId, step);

  return successResponse({
    success: true,
    pointsAwarded: result.pointsAwarded,
    nextStep: result.nextStep,
    isComplete: result.isComplete,
  });
});
