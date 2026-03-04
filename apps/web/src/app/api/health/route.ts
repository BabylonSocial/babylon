import { NextResponse } from 'next/server';

/**
 * Health Check API
 *
 * @description
 * Health check endpoint for monitoring service availability. Returns server status,
 * timestamp, and environment information. Used by:
 * - CI/CD pipelines (GitHub Actions) to verify deployment readiness
 * - Load balancers for health checks
 * - Monitoring services (Datadog, New Relic, etc.)
 * - Uptime monitoring tools
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/health');
 * const data = await response.json();
 * // { status: 'ok', timestamp: '2024-01-15T12:00:00.000Z', env: 'production' }
 * ```
 *
 * @see {@link https://github.com/BabylonSocial/babylon/blob/main/.github/workflows/ci.yml} CI/CD usage
 */

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    },
    { status: 200 }
  );
}
