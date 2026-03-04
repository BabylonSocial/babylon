/**
 * Manual Feedback Submission API
 *
 * @route POST /api/feedback/submit - Submit feedback
 * @access Public
 *
 * @description
 * Allows users to submit feedback manually with star ratings or scores.
 * Supports various feedback categories and optional comments.
 *
 * @example
 * ```typescript
 * await fetch('/api/feedback/submit', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     fromUserId: 'user-1',
 *     toUserId: 'user-2',
 *     stars: 5,
 *     comment: 'Great trader!'
 *   })
 * });
 * ```
 */

import { submitFeedbackToAgent0 } from '@babylon/agents';
import {
  authenticate,
  BusinessLogicError,
  requireUserByIdentifier,
  withErrorHandling,
} from '@babylon/api';
import { db } from '@babylon/db';
import { updateFeedbackMetrics } from '@babylon/engine';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const FeedbackSubmitSchema = z
  .object({
    toUserId: z.string().min(1, 'toUserId is required'),
    score: z.number().min(0).max(100).optional(),
    stars: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(5000).optional(),
    category: z.string().min(1).optional(),
  })
  .refine(({ score, stars }) => score !== undefined || stars !== undefined, {
    message: 'Either score or stars must be provided',
    path: ['score'],
  });

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authUser = await authenticate(request);

  const json = await request.json();
  const parsed = FeedbackSubmitSchema.parse(json);

  const body = parsed;

  const score = body.stars !== undefined ? body.stars * 20 : body.score!;

  const fromUser = await requireUserByIdentifier(authUser.userId);
  const toUser = await requireUserByIdentifier(body.toUserId);

  if (fromUser.id === toUser.id) {
    throw new BusinessLogicError(
      'Cannot submit feedback to yourself',
      'SELF_FEEDBACK'
    );
  }

  const now = new Date();
  const feedback = await db.feedback.create({
    data: {
      id: await generateSnowflakeId(),
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      score,
      comment: body.comment ?? null,
      category: body.category ?? 'general',
      interactionType: 'user_to_agent',
      createdAt: now,
      updatedAt: now,
    },
  });

  logger.info('Feedback submitted successfully', {
    feedbackId: feedback.id,
    fromUserId: fromUser.id,
    toUserId: toUser.id,
    score,
  });

  // Update feedback metrics
  await updateFeedbackMetrics(toUser.id, score, {
    category: body.category ?? 'general',
    interactionType: 'user_to_agent',
  });

  // Submit to Agent0 network if recipient is an agent (fire-and-forget with error handling)
  // Only submit if recipient has Agent0 token ID (checked inside submitFeedbackToAgent0)
  submitFeedbackToAgent0(feedback.id).catch((error) => {
    logger.error('Failed to submit feedback to Agent0', {
      feedbackId: feedback.id,
      error,
    });
  });

  return NextResponse.json(
    {
      success: true,
      feedbackId: feedback.id,
      score,
      message: 'Feedback submitted successfully',
    },
    { status: 201 }
  );
});
