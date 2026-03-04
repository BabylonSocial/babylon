import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const HealthCheckResponse = z
  .object({
    status: z.literal('ok'),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    env: z.string().optional().meta({ description: 'NODE_ENV value' }),
  })
  .meta({ id: 'HealthCheckResponse' });

const SystemStatsResponse = z
  .object({
    success: z.literal(true),
    stats: z
      .record(z.string(), z.unknown())
      .meta({ description: 'Game engine statistics' }),
    engineStatus: z
      .record(z.string(), z.unknown())
      .meta({ description: 'Game engine status' }),
  })
  .meta({ id: 'SystemStatsResponse' });

export const systemPaths: ZodOpenApiPathsObject = {
  '/api/health': {
    get: {
      operationId: 'getHealth',
      tags: ['System'],
      summary: 'Health check',
      description: 'Returns server status, timestamp, and environment.',
      responses: {
        '200': {
          description: 'Service is healthy',
          content: { 'application/json': { schema: HealthCheckResponse } },
        },
      },
    },
  },
  '/api/stats': {
    get: {
      operationId: 'getStats',
      tags: ['System'],
      summary: 'System statistics',
      description:
        'Returns game engine statistics and status. Public endpoint with rate limiting.',
      responses: {
        '200': {
          description: 'System statistics',
          content: { 'application/json': { schema: SystemStatsResponse } },
        },
      },
    },
  },
};
