/**
 * Agent-to-Game Feedback API
 *
 * @route POST /api/feedback/agent-to-game - Submit agent feedback for a game
 * @access Public (agents identified via agentId)
 *
 * @description
 * Allows registered agents to rate games after participation (Phase 1 Yelp-style loop).
 * Stores feedback entries tied to the gameId for future analytics.
 */

import {
  requireCronAuth,
  requireUserByIdentifier,
  withErrorHandling,
} from '@babylon/api';
import { AgentToGameFeedbackSchema } from '@babylon/api/schemas';
import type { JsonObject } from '@babylon/db';
import { db } from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  requireCronAuth(request, { jobName: 'AgentToGameFeedback' });

  const payload = AgentToGameFeedbackSchema.parse(await request.json());

  const agent = await requireUserByIdentifier(payload.agentId, {
    id: true,
    isAgent: true,
  });

  if (!agent.isAgent) {
    return NextResponse.json(
      { success: false, error: 'ONLY_AGENTS_CAN_SUBMIT' },
      { status: 403 }
    );
  }

  const existingFeedback = await db.feedback.findFirst({
    where: {
      fromUserId: agent.id,
      gameId: payload.gameId,
      interactionType: 'agent_to_game',
    },
    select: { id: true },
  });

  if (existingFeedback) {
    return NextResponse.json(
      {
        success: false,
        error: 'Feedback already submitted for this game',
        feedbackId: existingFeedback.id,
      },
      { status: 409 }
    );
  }

  const metadataBase: JsonObject =
    payload.metadata &&
    typeof payload.metadata === 'object' &&
    !Array.isArray(payload.metadata)
      ? (payload.metadata as JsonObject)
      : {};

  const metadata: JsonObject = {
    ...metadataBase,
    ...(payload.tags ? { tags: payload.tags } : {}),
  };

  const feedback = await db.feedback.create({
    data: {
      id: await generateSnowflakeId(),
      fromUserId: agent.id,
      fromAgentId: agent.id,
      score: payload.score,
      comment: payload.comment,
      category: 'game_review',
      gameId: payload.gameId,
      interactionType: 'agent_to_game',
      metadata,
      updatedAt: new Date(),
    },
  });

  logger.info('Agent-to-game feedback created', {
    feedbackId: feedback.id,
    agentId: agent.id,
    gameId: payload.gameId,
    score: payload.score,
  });

  return NextResponse.json(
    {
      success: true,
      feedbackId: feedback.id,
    },
    { status: 201 }
  );
});
