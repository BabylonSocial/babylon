/**
 * Market Bias Tuning API
 *
 * @route POST /api/markets/bias/tune - Tune market bias
 * @access Authenticated
 *
 * @description
 * Adjusts strength of existing market biases without full reconfiguration.
 * Setting strength to 0 deactivates the bias. Allows fine-tuning of bias
 * parameters.
 *
 * @example
 * ```typescript
 * await fetch('/api/markets/bias/tune', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     entityId: 'org-id',
 *     strength: 0.7
 *   })
 * });
 * ```
 *
 * @see {@link /lib/feedback/bias-engine} Bias engine
 */

import { requireAdmin, withErrorHandling } from '@babylon/api';
import { BiasTuneBody } from '@babylon/api/schemas';
import { biasEngine } from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const json = await request.json();
  const parsed = BiasTuneBody.parse(json);

  const body = parsed;

  if (body.strength === 0) {
    biasEngine.removeBias(body.entityId);

    logger.info(`Market bias deactivated for ${body.entityId}`, {
      entityId: body.entityId,
    });

    return NextResponse.json({
      success: true,
      message: `Bias deactivated for entity: ${body.entityId}`,
      bias: {
        entityId: body.entityId,
        strength: 0,
        active: false,
      },
    });
  }

  biasEngine.tuneBiasStrength(body.entityId, body.strength, body.decayRate);

  const updatedBias = biasEngine.getBiasAdjustment(body.entityId);

  logger.info(`Market bias tuned for ${body.entityId}`, {
    entityId: body.entityId,
    strength: body.strength,
    decayRate: body.decayRate,
  });

  return NextResponse.json({
    success: true,
    message: `Bias strength updated for entity: ${body.entityId}`,
    bias: {
      entityId: body.entityId,
      strength: body.strength,
      adjustment: updatedBias,
      decayRate: body.decayRate,
    },
  });
});
