/**
 * General Game Feedback API
 *
 * @route POST /api/feedback/game-feedback - Submit general game feedback
 * @access Authenticated
 */

import {
  authenticate,
  checkRateLimitAndDuplicates,
  createGameFeedback,
  getLinearConfig,
  RATE_LIMIT_CONFIGS,
  requireUserByIdentifier,
  successResponse,
  syncFeedbackToLinear,
  withErrorHandling,
} from '@babylon/api';
import { GameFeedbackSchema, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);

  const rateLimitError = checkRateLimitAndDuplicates(
    authUser.userId,
    null,
    RATE_LIMIT_CONFIGS.SUBMIT_FEEDBACK
  );
  if (rateLimitError) return rateLimitError;

  const parsed = GameFeedbackSchema.parse(await request.json());
  const fromUser = await requireUserByIdentifier(authUser.userId);

  // Create feedback using package-level service (handles scoring logic)
  const feedback = await createGameFeedback({
    userId: fromUser.id,
    parsed,
  });

  // Fire-and-forget Linear sync (documented in sync-feedback.ts)
  const linearConfig = getLinearConfig();
  if (linearConfig) {
    syncFeedbackToLinear(linearConfig, feedback.id, fromUser).catch(
      (error: unknown) => {
        // Distinguish timeout errors from other API errors for better observability
        if (error instanceof Error && error.name === 'AbortError') {
          logger.warn('Linear issue creation timed out', {
            feedbackId: feedback.id,
          });
        } else {
          logger.error('Linear issue creation failed', {
            feedbackId: feedback.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );
  }

  return successResponse(
    {
      success: true,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback!',
    },
    201
  );
});
