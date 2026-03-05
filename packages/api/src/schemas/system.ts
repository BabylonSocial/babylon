import { z } from 'zod';

export const HealthCheckResponse = z
  .object({
    status: z.literal('ok'),
    timestamp: z.string().meta({ description: 'ISO 8601 timestamp' }),
    env: z.string().optional().meta({ description: 'NODE_ENV value' }),
  })
  .meta({ id: 'HealthCheckResponse' });

export const SystemStatsResponse = z
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
