/**
 * Organizations API
 *
 * @route GET /api/organizations - Get organizations
 * @access Public
 *
 * @description
 * Returns list of organizations in the game world. Supports filtering by IDs
 * for batch lookups. Organizations represent groups, factions, and institutions
 * in the Babylon game world.
 *
 * @example
 * ```typescript
 * // Get all organizations
 * const response = await fetch('/api/organizations');
 * const { organizations } = await response.json();
 *
 * // Get specific organizations
 * const batch = await fetch('/api/organizations?ids=org1,org2');
 * ```
 *
 * @see {@link /lib/db/context} RLS context
 */

import { addPublicReadHeaders, publicRateLimit } from '@babylon/api';
import { StaticDataRegistry } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/organizations
 *
 * @description Get organizations, optionally filtered by IDs
 *
 * @param {NextRequest} request - Request object
 *
 * @returns {Promise<NextResponse>} Organizations data
 */
export async function GET(request: NextRequest) {
  const { error, rateLimitInfo } = await publicRateLimit(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  const allOrgs = StaticDataRegistry.getAllOrganizations();

  const organizations = idsParam
    ? allOrgs
        .filter((org) => idsParam.split(',').includes(org.id))
        .map((org) => ({
          id: org.id,
          name: org.name,
          type: org.type,
          description: org.description ?? null,
        }))
    : allOrgs.slice(0, 100).map((org) => ({
        id: org.id,
        name: org.name,
        type: org.type,
        description: org.description ?? null,
      }));

  const res = NextResponse.json({
    success: true,
    organizations,
  });
  if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
  return res;
}
