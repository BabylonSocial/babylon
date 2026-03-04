/**
 * OpenAPI Specification API Route
 *
 * Serves the build-time generated OpenAPI 3.1 specification.
 * The spec is produced by `bun run generate:api:spec` from Zod schemas
 * in packages/api/src/openapi/paths/.
 *
 * @route GET /api/docs
 * @access Public
 */

import { NextResponse } from 'next/server';
import spec from '../../../../../../openapi.json';

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
