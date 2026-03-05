/**
 * Market Bias Configuration API
 *
 * @route POST /api/markets/bias/configure - Configure market biases
 * @access Authenticated
 *
 * @description
 * Configures market biases for entities (organizations, people, etc.). Supports
 * setting new biases, removing existing ones, or bulk-setting multiple biases.
 * Used to manipulate market sentiment and prices for game mechanics.
 *
 * @example
 * ```typescript
 * // Set bias
 * await fetch('/api/markets/bias/configure', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     action: 'set',
 *     entityId: 'org-id',
 *     entityName: 'Organization',
 *     direction: 'up',
 *     strength: 0.5
 *   })
 * });
 * ```
 *
 * @see {@link /lib/feedback/bias-engine} Bias engine
 */

import { requireAdmin, withErrorHandling } from '@babylon/api';
import { BiasConfigBody } from '@babylon/api/schemas';
import { biasEngine } from '@babylon/engine';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const json = await request.json();
  const parsed = BiasConfigBody.parse(json);

  const body = parsed;

  if (body.action === 'set') {
    biasEngine.setBias(
      body.entityId,
      body.entityName,
      body.direction,
      body.strength,
      {
        durationHours: body.durationHours,
        decayRate: body.decayRate,
      }
    );

    const adjustment = biasEngine.getBiasAdjustment(body.entityId);

    return NextResponse.json(
      {
        success: true,
        message: `Bias configured: ${body.direction} ${body.entityName}`,
        bias: {
          entityId: body.entityId,
          entityName: body.entityName,
          direction: body.direction,
          strength: body.strength ?? 0.5,
          adjustment,
        },
      },
      { status: 201 }
    );
  }
  if (body.action === 'remove') {
    biasEngine.removeBias(body.entityId);

    return NextResponse.json({
      success: true,
      message: `Bias removed for entity: ${body.entityId}`,
    });
  }
  biasEngine.setBulkBiases(body.biases);

  return NextResponse.json(
    {
      success: true,
      message: `${body.biases.length} biases configured`,
      count: body.biases.length,
    },
    { status: 201 }
  );
});
