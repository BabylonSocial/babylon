/**
 * Admin Load Test API
 *
 * @route POST /api/admin/load-test - Run load test
 * @route GET /api/admin/load-test - Get load test status/results
 * @access Admin
 *
 * @description
 * Load testing endpoint for admin. POST runs a load test with specified
 * scenario (LIGHT, NORMAL, HEAVY, STRESS). GET returns status or results.
 *
 * @example
 * ```typescript
 * await fetch('/api/admin/load-test', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${adminToken}` },
 *   body: JSON.stringify({ scenario: 'HEAVY' })
 * });
 * ```
 */

import {
  errorResponse,
  requireAdmin,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { logger } from '@babylon/shared';
import type { LoadTestResult } from '@babylon/testing';
import { LoadTestSimulator, TEST_SCENARIOS } from '@babylon/testing';
import { AdminLoadTestBody } from '@babylon/api/schemas';
import type { NextRequest } from 'next/server';

const LoadTestRequestSchema = AdminLoadTestBody;

// Store active load test
let activeTest: {
  simulator: LoadTestSimulator;
  promise: Promise<LoadTestResult>;
  startTime: Date;
  scenario: string;
} | null = null;

let lastTestResult: LoadTestResult | null = null;

/**
 * POST /api/admin/load-test
 * Start a new load test
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  // Check if test is already running
  if (activeTest) {
    return errorResponse('Load test already running', 'LOAD_TEST_RUNNING', 409);
  }

  // Parse request body
  const body = await request.json();
  const { scenario, baseUrl } = LoadTestRequestSchema.parse(body);

  // Get configuration
  const config = TEST_SCENARIOS[scenario];
  const testBaseUrl =
    baseUrl ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  logger.info(
    'Starting load test',
    {
      scenario,
      baseUrl: testBaseUrl,
      config,
    },
    'POST /api/admin/load-test'
  );

  // Start test
  const simulator = new LoadTestSimulator(testBaseUrl);
  const testPromise = simulator.runTest(config);

  activeTest = {
    simulator,
    promise: testPromise,
    startTime: new Date(),
    scenario,
  };

  // Handle test completion
  testPromise
    .then((result: LoadTestResult) => {
      lastTestResult = result;
      activeTest = null;

      logger.info(
        'Load test completed',
        {
          scenario,
          totalRequests: result.totalRequests,
          successRate: result.throughput.successRate,
        },
        'LoadTest'
      );
    })
    .catch((error: Error) => {
      logger.error('Load test failed', { error: error.message }, 'LoadTest');
      activeTest = null;
    });

  return successResponse({
    message: 'Load test started',
    scenario,
    config: {
      concurrentUsers: config.concurrentUsers,
      durationSeconds: config.durationSeconds,
      endpoints: config.endpoints.length,
    },
    startTime: activeTest.startTime,
  });
});

/**
 * GET /api/admin/load-test/status
 * Get current load test status
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  if (activeTest) {
    const runningTime = Date.now() - activeTest.startTime.getTime();

    return successResponse({
      status: 'running',
      scenario: activeTest.scenario,
      startTime: activeTest.startTime,
      runningTimeMs: runningTime,
      runningTimeSeconds: Math.floor(runningTime / 1000),
    });
  }

  return successResponse({
    status: 'idle',
    lastResult: lastTestResult
      ? {
          endTime: lastTestResult.endTime,
          totalRequests: lastTestResult.totalRequests,
          successRate: lastTestResult.throughput.successRate,
          avgResponseTime: lastTestResult.responseTime.mean,
        }
      : null,
  });
});
