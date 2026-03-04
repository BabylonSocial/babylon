/**
 * Game-to-Agent Feedback API
 *
 * @route POST /api/feedback/game-to-agent - Submit game feedback for agent
 * @access Public
 *
 * @description
 * Allows games to submit performance feedback for agents. Primary mechanism
 * for rating agent performance in games. Updates agent metrics and reputation.
 *
 * @example
 * ```typescript
 * await fetch('/api/feedback/game-to-agent', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     agentId: 'agent-id',
 *     gameId: 'game-id',
 *     score: 85,
 *     won: true
 *   })
 * });
 * ```
 */

import { submitFeedbackToAgent0 } from '@babylon/agents';
import {
  requireCronAuth,
  requireUserByIdentifier,
  withErrorHandling,
} from '@babylon/api';
import type { JsonValue } from '@babylon/db';
import { db } from '@babylon/db';
import { updateFeedbackMetrics, updateGameMetrics } from '@babylon/engine';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const GameFeedbackSchema = z.object({
  agentId: z.string().min(1, 'agentId is required'),
  gameId: z.string().min(1, 'gameId is required'),
  score: z.number().min(0).max(100),
  won: z.boolean(),
  comment: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireCronAuth(request, { jobName: 'GameFeedback' });
  const json = await request.json();
  const parsed = GameFeedbackSchema.parse(json);

  const body = parsed;

  const agent = await requireUserByIdentifier(body.agentId);

  // Check if feedback already exists for this game
  const existingFeedback = await db.feedback.findFirst({
    where: {
      toUserId: agent.id,
      gameId: body.gameId,
      interactionType: 'game_to_agent',
    },
  });

  if (existingFeedback) {
    logger.warn('Feedback already exists for this game', {
      feedbackId: existingFeedback.id,
      agentId: agent.id,
      gameId: body.gameId,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Feedback already exists for this game',
        feedbackId: existingFeedback.id,
      },
      { status: 409 }
    );
  }

  const now = new Date();
  const feedback = await db.feedback.create({
    data: {
      id: await generateSnowflakeId(),
      toUserId: agent.id,
      score: body.score,
      comment: body.comment,
      gameId: body.gameId,
      interactionType: 'game_to_agent',
      metadata: body.metadata as JsonValue | undefined,
      createdAt: now,
      updatedAt: now,
    },
  });

  logger.info('Game feedback created', {
    feedbackId: feedback.id,
    agentId: agent.id,
    gameId: body.gameId,
    score: body.score,
    won: body.won,
  });

  await updateGameMetrics(agent.id, body.score, body.won);
  await updateFeedbackMetrics(agent.id, body.score, {
    category: 'game_performance',
    interactionType: 'game_to_agent',
  });

  // Submit to Agent0 network (fire-and-forget with error handling)
  submitFeedbackToAgent0(feedback.id).catch((error) => {
    logger.error('Failed to submit game feedback to Agent0', {
      feedbackId: feedback.id,
      agentId: agent.id,
      gameId: body.gameId,
      error,
    });
  });

  const metrics = await db.agentPerformanceMetrics.findUnique({
    where: { userId: agent.id },
    select: {
      reputationScore: true,
      trustLevel: true,
      confidenceScore: true,
      gamesPlayed: true,
      gamesWon: true,
      averageGameScore: true,
      averageFeedbackScore: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      feedbackId: feedback.id,
      reputation: metrics,
    },
    { status: 201 }
  );
});
