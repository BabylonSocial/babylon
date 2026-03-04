/**
 * Active Market Biases API
 *
 * @route GET /api/markets/bias/active - Get active market biases
 * @access Public
 *
 * @description
 * Returns list of all active market biases configured in the system. Shows
 * current sentiment/price manipulations affecting markets. Used for transparency
 * and market analysis.
 *
 * @example
 * ```typescript
 * const { biases } = await fetch('/api/markets/bias/active')
 *   .then(r => r.json());
 * ```
 *
 * @see {@link /lib/feedback/bias-engine} Bias engine
 */

import { withErrorHandling } from '@babylon/api';
import { biasEngine } from '@babylon/engine';
import { NextResponse } from 'next/server';

export const GET = withErrorHandling(async function GET() {
  // Get all active biases from the singleton engine
  const activeBiases = biasEngine.getActiveBiases();

  // Format biases for API response
  const biases = activeBiases.map((bias) => ({
    entityId: bias.entityId,
    entityName: bias.entityName,
    direction: bias.direction,
    strength: bias.strength,
    createdAt: bias.createdAt.toISOString(),
    expiresAt: bias.expiresAt ? bias.expiresAt.toISOString() : null,
    decayRate: bias.decayRate,
    // Get current adjustment values
    adjustment: biasEngine.getBiasAdjustment(bias.entityId),
  }));

  return NextResponse.json({
    success: true,
    biases,
    count: biases.length,
  });
});
