/**
 * Reputation Breakdown API
 *
 * @route GET /api/reputation/breakdown/[userId] - Get detailed reputation breakdown
 * @access Public
 *
 * @description
 * Returns detailed breakdown of reputation score components including PNL component
 * (40% weight), feedback component (40% weight), activity component (20% weight),
 * raw metrics, and confidence scores.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/reputation/breakdown/user_123');
 * const { breakdown, weights } = await response.json();
 * console.log(`PNL: ${breakdown.pnl} (${weights.pnl * 100}% weight)`);
 * ```
 *
 * @see {@link /lib/reputation/reputation-service} Reputation service
 */

import {
  addPublicReadHeaders,
  publicRateLimit,
  requireUserByIdentifier,
} from '@babylon/api';
import { getReputationBreakdown } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error, rateLimitInfo } = await publicRateLimit(request);
  if (error) return error;

  const { userId } = await params;

  const user = await requireUserByIdentifier(userId);

  const breakdown = await getReputationBreakdown(user.id);

  const res = NextResponse.json({
    success: true,
    userId: user.id,
    reputationScore: breakdown!.reputationScore,
    trustLevel: breakdown!.trustLevel,
    confidenceScore: breakdown!.confidenceScore,
    breakdown: breakdown!.breakdown,
    metrics: breakdown!.metrics,
    weights: {
      pnl: 0.4,
      feedback: 0.4,
      activity: 0.2,
    },
  });
  if (rateLimitInfo) addPublicReadHeaders(res, rateLimitInfo);
  return res;
}
