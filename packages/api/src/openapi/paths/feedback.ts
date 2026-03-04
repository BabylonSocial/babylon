import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const feedbackPaths: ZodOpenApiPathsObject = {
  '/api/feedback/submit': {
    post: {
      operationId: 'submitFeedback',
      tags: ['Feedback'],
      summary: 'Submit user feedback',
      description:
        'Submit feedback about another user or agent.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                toUserId: z.string().meta({ description: 'Target user or agent ID' }),
                score: z.number().optional().meta({ description: 'Score 0-100' }),
                stars: z.number().optional().meta({ description: 'Star rating 1-5' }),
                comment: z.string().optional(),
                category: z.string().optional(),
              })
              .meta({ id: 'SubmitFeedbackBody' }),
          },
        },
      },
      responses: {
        '201': {
          description: 'Feedback submitted',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  feedbackId: z.string(),
                  score: z.number(),
                  message: z.string(),
                })
                .meta({ id: 'SubmitFeedbackResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Invalid feedback' },
      },
    },
  },

  '/api/feedback/game-feedback': {
    post: {
      operationId: 'submitGameFeedback',
      tags: ['Feedback'],
      summary: 'Submit game feedback',
      description:
        'Submit feedback about the game experience.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z
              .object({
                type: z.string().meta({ description: 'Feedback type' }),
                rating: z.number().meta({ description: 'Rating value' }),
                comment: z.string().optional(),
              })
              .passthrough()
              .meta({ id: 'GameFeedbackBody' }),
          },
        },
      },
      responses: {
        '201': {
          description: 'Game feedback submitted',
          content: {
            'application/json': {
              schema: z
                .object({
                  success: z.literal(true),
                  feedbackId: z.string(),
                  message: z.string(),
                })
                .meta({ id: 'GameFeedbackResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '400': { description: 'Invalid feedback' },
      },
    },
  },
};
