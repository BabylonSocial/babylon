import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { HealthCheckResponse, SystemStatsResponse } from '../../schemas/system';

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
