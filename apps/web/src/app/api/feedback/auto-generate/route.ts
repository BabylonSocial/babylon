/**
 * Auto-Generate Feedback API
 *
 * @route POST /api/feedback/auto-generate - Auto-generate feedback
 * @access Public
 *
 * @description
 * Automatically generates feedback for completed games or trades. Calculates
 * performance scores and updates agent metrics. Supports game and trade completion.
 *
 * @example
 * ```typescript
 * await fetch('/api/feedback/auto-generate', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     type: 'game',
 *     agentId: 'agent-id',
 *     gameId: 'game-id',
 *     metrics: { won: true, pnl: 100 }
 *   })
 * });
 * ```
 */

import { submitFeedbackToAgent0 } from '@babylon/agents';
import {
  InternalServerError,
  requireCronAuth,
  requireUserByIdentifier,
  withErrorHandling,
} from '@babylon/api';
import { AutoGenerateFeedbackRequestSchema } from '@babylon/api/schemas';
import {
  generateGameCompletionFeedback,
  generateTradeCompletionFeedback,
} from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireCronAuth(request, { jobName: 'AutoGenerateFeedback' });

  const json = await request.json();
  const parsed = AutoGenerateFeedbackRequestSchema.parse(json);

  const body = parsed;

  const agent = await requireUserByIdentifier(body.agentId);

  if (body.type === 'game') {
    const feedback = await generateGameCompletionFeedback(
      agent.id,
      body.gameId,
      body.metrics
    );

    if (!feedback) {
      throw new InternalServerError('Failed to create game feedback');
    }

    // Submit to Agent0 network (fire-and-forget with error handling)
    submitFeedbackToAgent0(feedback.id).catch((error) => {
      logger.error('Failed to submit auto-generated game feedback to Agent0', {
        feedbackId: feedback.id,
        agentId: agent.id,
        gameId: body.gameId,
        error,
      });
    });

    return NextResponse.json(
      {
        success: true,
        feedbackId: feedback.id,
        type: 'game',
        score: feedback.score,
        message: 'Game feedback generated successfully',
      },
      { status: 201 }
    );
  }
  const feedback = await generateTradeCompletionFeedback(
    agent.id,
    body.tradeId,
    body.metrics
  );

  if (!feedback) {
    throw new InternalServerError('Failed to create trade feedback');
  }

  // Submit to Agent0 network (fire-and-forget with error handling)
  submitFeedbackToAgent0(feedback.id).catch((error) => {
    logger.error('Failed to submit auto-generated trade feedback to Agent0', {
      feedbackId: feedback.id,
      agentId: agent.id,
      tradeId: body.tradeId,
      error,
    });
  });

  return NextResponse.json(
    {
      success: true,
      feedbackId: feedback.id,
      type: 'trade',
      score: feedback.score,
      message: 'Trade feedback generated successfully',
    },
    { status: 201 }
  );
});
