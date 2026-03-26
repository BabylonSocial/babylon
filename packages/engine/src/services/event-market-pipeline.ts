/**
 * Event to Market Pipeline
 *
 * Applies narrative events to market prices deterministically.
 * Events create price modifiers that decay over time.
 *
 * Features:
 * - Optimistic locking for concurrent updates
 * - Zod validation for JSONB data
 * - Price bounds validation
 * - Atomic sentiment updates using SQL
 */

import {
  and,
  eq,
  inArray,
  type PriceModifier,
  type StructuredEventData,
  sql,
} from '@babylon/db';
import { db, organizationState } from '@babylon/db/runtime';
import { logger, PERP_MARKET_CONFIG } from '@babylon/shared';
import { secureRandom } from '../utils/entropy';
import { formatError } from '../utils/error-utils';
import { parseModifiersSafe, validatePriceModifier } from './jsonb-validators';
import { applyCascadeEffects } from './market-correlation-service';
import { PriceUpdateService } from './price-update-service';
import { StaticDataRegistry } from './static-data-registry';

/**
 * Maximum retry attempts for optimistic locking conflicts
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (in milliseconds)
 */
const BACKOFF_BASE_DELAY_MS = 10;

/**
 * Maximum delay cap for exponential backoff (in milliseconds)
 */
const BACKOFF_MAX_DELAY_MS = 160;

/**
 * Shared backoff delay helper for consistent contention handling.
 * Implements exponential backoff capped at BACKOFF_MAX_DELAY_MS.
 *
 * @param attempt - Current retry attempt (0-indexed)
 */
async function backoffDelay(attempt: number): Promise<void> {
  const delay = Math.min(
    BACKOFF_BASE_DELAY_MS * 2 ** attempt,
    BACKOFF_MAX_DELAY_MS
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Price bounds to prevent invalid prices
 */
const MIN_EVENT_MULTIPLIER = 0.5; // Minimum 50% of base price per event
const MAX_EVENT_MULTIPLIER = 1.5; // Maximum 150% of base price per event

/**
 * Resolve a ticker to an organization ID.
 * Returns null if the ticker doesn't match any organization.
 */
function resolveTickerToOrgId(ticker: string): string | null {
  const orgs = StaticDataRegistry.getAllOrganizations();
  const org = orgs.find(
    (o) => o.ticker?.toLowerCase() === ticker.toLowerCase()
  );
  return org?.id ?? null;
}

/**
 * Magnitude multipliers for market impacts
 */
const MAGNITUDE_MULTIPLIERS = {
  minor: 0.02, // 2%
  moderate: 0.05, // 5%
  major: 0.12, // 12%
} as const;

/**
 * Decay rates per hour for different durations
 */
const DECAY_RATES = {
  instant: 0.5, // Decays 50% per hour
  hours: 0.1, // Decays 10% per hour
  days: 0.02, // Decays 2% per hour
} as const;

/**
 * Duration to expiry in hours
 */
const DURATION_HOURS = {
  instant: 2,
  hours: 8,
  days: 24,
} as const;

/**
 * Apply a structured event's market impacts to stock prices
 */
export async function applyEventToMarkets(
  event: StructuredEventData
): Promise<number> {
  let modifiersApplied = 0;
  const multiplierByOrgId = new Map<
    string,
    { multiplier: number; tickers: Set<string> }
  >();

  for (const impact of event.marketImpacts) {
    try {
      // Validate lookups before using them to avoid NaN effects
      const magnitude = MAGNITUDE_MULTIPLIERS[impact.magnitude];
      if (magnitude === undefined) {
        logger.error(
          `Invalid magnitude in market impact`,
          {
            arcId: event.arcId,
            stockTicker: impact.stockTicker,
            invalidMagnitude: impact.magnitude,
            validMagnitudes: Object.keys(MAGNITUDE_MULTIPLIERS),
          },
          'EventMarketPipeline'
        );
        continue;
      }

      const decayRate = DECAY_RATES[impact.duration];
      const durationHours = DURATION_HOURS[impact.duration];
      if (decayRate === undefined || durationHours === undefined) {
        logger.error(
          `Invalid duration in market impact`,
          {
            arcId: event.arcId,
            stockTicker: impact.stockTicker,
            invalidDuration: impact.duration,
            validDurations: Object.keys(DURATION_HOURS),
          },
          'EventMarketPipeline'
        );
        continue;
      }

      // Bound the effect to prevent extreme values
      const rawEffect =
        impact.direction === 'up' ? 1 + magnitude : 1 - magnitude;
      const effect = Math.max(
        MIN_EVENT_MULTIPLIER,
        Math.min(MAX_EVENT_MULTIPLIER, rawEffect)
      );

      const now = new Date();
      const modifier: PriceModifier = {
        eventId: event.arcId, // Use arcId as event identifier
        effect,
        decayRate,
        appliedAt: now.toISOString(),
        expiresAt: new Date(
          now.getTime() + durationHours * 60 * 60 * 1000
        ).toISOString(),
      };

      // Validate modifier before applying
      validatePriceModifier(modifier);

      await addPriceModifier(impact.stockTicker, modifier);
      modifiersApplied++;

      const orgId =
        resolveTickerToOrgId(impact.stockTicker) ?? impact.stockTicker;
      const existing = multiplierByOrgId.get(orgId);
      if (existing) {
        existing.multiplier *= effect;
        existing.tickers.add(impact.stockTicker);
      } else {
        multiplierByOrgId.set(orgId, {
          multiplier: effect,
          tickers: new Set([impact.stockTicker]),
        });
      }

      logger.info(
        `Applied price modifier to ${impact.stockTicker}`,
        {
          ticker: impact.stockTicker,
          direction: impact.direction,
          magnitude: impact.magnitude,
          effect: effect.toFixed(4),
        },
        'EventMarketPipeline'
      );
    } catch (error) {
      logger.error(
        `Failed to apply modifier to ${impact.stockTicker}`,
        { error: formatError(error) },
        'EventMarketPipeline'
      );
    }
  }

  // Apply immediate price impacts so narrative events visibly move markets.
  // This keeps the "market modifiers" behavior but removes the user-facing
  // impression that narrative has no effect.
  if (multiplierByOrgId.size > 0) {
    const orgIds = [...multiplierByOrgId.keys()];
    const states = await db
      .select({
        id: organizationState.id,
        currentPrice: organizationState.currentPrice,
        basePrice: organizationState.basePrice,
      })
      .from(organizationState)
      .where(inArray(organizationState.id, orgIds));

    const stateByOrgId = new Map(states.map((s) => [s.id, s]));

    const updates = orgIds
      .map((orgId) => {
        const entry = multiplierByOrgId.get(orgId);
        if (!entry) return null;

        // Clamp combined multiplier to avoid extreme compounding from multiple impacts.
        const combinedMultiplier = Math.max(
          MIN_EVENT_MULTIPLIER,
          Math.min(MAX_EVENT_MULTIPLIER, entry.multiplier)
        );

        const state = stateByOrgId.get(orgId);
        const basePrice = Number(state?.basePrice);
        const currentPrice = Number(state?.currentPrice ?? state?.basePrice);
        if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null;

        // Apply multiplier to currentPrice but clamp to basePrice bounds
        // to prevent exponential compounding across repeated events
        const rawPrice = currentPrice * combinedMultiplier;
        const minPrice =
          Number.isFinite(basePrice) && basePrice > 0
            ? basePrice * PERP_MARKET_CONFIG.PRICE_FLOOR_RATIO
            : currentPrice * 0.25;
        const maxPrice =
          Number.isFinite(basePrice) && basePrice > 0
            ? basePrice * PERP_MARKET_CONFIG.PRICE_CEILING_RATIO
            : currentPrice * 4.0;
        const newPrice = Math.max(minPrice, Math.min(maxPrice, rawPrice));
        if (!Number.isFinite(newPrice) || newPrice <= 0) return null;

        const canonicalTicker =
          StaticDataRegistry.getOrganization(orgId)?.ticker;

        return {
          organizationId: orgId,
          newPrice,
          source: 'event' as const,
          reason: `Narrative event (${event.type}) market impact`,
          metadata: {
            arcId: event.arcId,
            ticker:
              typeof canonicalTicker === 'string' && canonicalTicker.length > 0
                ? canonicalTicker
                : null,
            tickers: [...entry.tickers],
          },
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null);

    if (updates.length > 0) {
      try {
        const applied = await PriceUpdateService.applyUpdates(updates);
        logger.info(
          'Applied narrative price updates',
          {
            arcId: event.arcId,
            eventType: event.type,
            count: applied.length,
            sample: applied.slice(0, 3).map((u) => ({
              organizationId: u.organizationId,
              oldPrice: Number(u.oldPrice.toFixed(4)),
              newPrice: Number(u.newPrice.toFixed(4)),
              changePercent: Number(u.changePercent.toFixed(4)),
            })),
          },
          'EventMarketPipeline'
        );

        // Apply cascade effects to related organizations
        // Each primary org that had a price change may affect suppliers, competitors, partners
        for (const update of applied) {
          if (Math.abs(update.changePercent) > 1) {
            // Only cascade for >1% moves (changePercent is in % units, e.g. 5.0 = 5%)
            try {
              // Convert percent to fraction for applyCascadeEffects (expects e.g. -0.10 for -10%)
              const cascadeResult = await applyCascadeEffects(
                update.organizationId,
                update.changePercent / 100,
                `${event.type} event (arcId: ${event.arcId})`
              );
              if (cascadeResult.affectedCount > 0) {
                logger.debug(
                  'Applied cascade effects',
                  {
                    primaryOrg: update.organizationId,
                    primaryChange: update.changePercent.toFixed(4),
                    cascadeCount: cascadeResult.affectedCount,
                  },
                  'EventMarketPipeline'
                );
              }
            } catch (cascadeError) {
              logger.warn(
                'Failed to apply cascade effects',
                {
                  organizationId: update.organizationId,
                  error: formatError(cascadeError),
                },
                'EventMarketPipeline'
              );
            }
          }
        }
      } catch (error) {
        // Price application is best-effort; modifiers are persisted regardless.
        logger.warn(
          'Failed to apply narrative price updates',
          { error: formatError(error) },
          'EventMarketPipeline'
        );
      }
    }
  }

  return modifiersApplied;
}

/**
 * Add a price modifier to a stock with optimistic locking
 * @param stockIdOrTicker - Either an organization ID or a ticker symbol
 */
export async function addPriceModifier(
  stockIdOrTicker: string,
  modifier: PriceModifier
): Promise<void> {
  // Resolve ticker to org ID if needed
  const orgId = resolveTickerToOrgId(stockIdOrTicker) ?? stockIdOrTicker;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Get current state with updatedAt for optimistic locking
    const [state] = await db
      .select({
        activeModifiers: organizationState.activeModifiers,
        updatedAt: organizationState.updatedAt,
      })
      .from(organizationState)
      .where(eq(organizationState.id, orgId))
      .limit(1);

    if (!state) {
      logger.warn(
        `Cannot add modifier: OrganizationState not found for ${stockIdOrTicker}`,
        { stockIdOrTicker, resolvedOrgId: orgId },
        'EventMarketPipeline'
      );
      return;
    }

    // Use Zod validation for safe parsing
    const now = new Date();
    const existingModifiers = parseModifiersSafe(state.activeModifiers, {
      orgId,
    });

    // Filter expired modifiers and bound effect values
    const validModifiers: PriceModifier[] = existingModifiers
      .filter((m) => new Date(m.expiresAt).getTime() > now.getTime())
      .map((m) => ({
        ...m,
        effect: Math.max(
          MIN_EVENT_MULTIPLIER,
          Math.min(MAX_EVENT_MULTIPLIER, m.effect)
        ),
      }));

    // Add new modifier
    validModifiers.push(modifier);

    // Update database with optimistic locking
    const result = await db
      .update(organizationState)
      .set({
        activeModifiers: validModifiers,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationState.id, orgId),
          eq(organizationState.updatedAt, state.updatedAt)
        )
      )
      .returning({ id: organizationState.id });

    if (result.length > 0) {
      // Success
      return;
    }

    // Optimistic lock conflict - retry
    logger.debug(
      `Optimistic lock conflict adding modifier to ${orgId}, attempt ${attempt + 1}/${MAX_RETRIES}`,
      { orgId, attempt },
      'EventMarketPipeline'
    );

    // Exponential backoff delay before retry
    await backoffDelay(attempt);
  }

  logger.error(
    `Failed to add modifier after ${MAX_RETRIES} attempts (optimistic lock conflicts)`,
    { stockIdOrTicker, orgId },
    'EventMarketPipeline'
  );
}

/**
 * Calculate the current price based on fundamentals and modifiers
 *
 * @param basePrice - Base price before modifiers
 * @param sentiment - Current sentiment (-100 to 100)
 * @param modifiers - Active price modifiers
 * @param rng - Optional RNG function returning 0-1, defaults to deterministic (0.5) for predictable pricing. Pass secureRandom() for production noise.
 */
export function calculateCurrentPrice(
  basePrice: number,
  sentiment: number,
  modifiers: PriceModifier[],
  rng: () => number = () => 0.5
): number {
  let price = basePrice;
  const now = new Date();

  // Pre-compute bounds for clamping during the loop
  const minPrice = basePrice * MIN_EVENT_MULTIPLIER;
  const maxPrice = basePrice * MAX_EVENT_MULTIPLIER;

  // Apply all active modifiers with decay, clamping after each to avoid overflow
  for (const mod of modifiers) {
    const appliedAt = new Date(mod.appliedAt);
    const expiresAt = new Date(mod.expiresAt);

    // Skip expired modifiers
    if (expiresAt.getTime() < now.getTime()) {
      continue;
    }

    // Bound effect to prevent extreme values
    const boundedEffect = Math.max(
      MIN_EVENT_MULTIPLIER,
      Math.min(MAX_EVENT_MULTIPLIER, mod.effect)
    );

    const hoursSince = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60);
    let decayedEffect =
      1 + (boundedEffect - 1) * Math.exp(-mod.decayRate * hoursSince);

    // Clamp decayed effect to prevent extreme per-modifier impact
    decayedEffect = Math.max(
      MIN_EVENT_MULTIPLIER,
      Math.min(MAX_EVENT_MULTIPLIER, decayedEffect)
    );

    price *= decayedEffect;

    // Clamp price after each modifier to avoid overflow from sequential multiplications
    price = Math.max(minPrice, Math.min(maxPrice, price));
  }

  // Apply sentiment-based volatility (small random component)
  // Uses provided rng function (defaults to 0.5 for deterministic behavior)
  const volatility = (Math.abs(sentiment) / 100) * 0.02;
  const noise = (rng() - 0.5) * 2 * volatility;
  price *= 1 + noise;

  // Bound final price (minPrice and maxPrice already computed above)
  return Math.max(minPrice, Math.min(maxPrice, price));
}

/**
 * Update a stock's current price based on its fundamentals with optimistic locking
 * @param stockIdOrTicker - Either an organization ID or a ticker symbol
 */
export async function updateStockPrice(
  stockIdOrTicker: string
): Promise<number | null> {
  // Resolve ticker to org ID if needed
  const orgId = resolveTickerToOrgId(stockIdOrTicker) ?? stockIdOrTicker;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const [state] = await db
      .select({
        basePrice: organizationState.basePrice,
        sentiment: organizationState.sentiment,
        activeModifiers: organizationState.activeModifiers,
        updatedAt: organizationState.updatedAt,
      })
      .from(organizationState)
      .where(eq(organizationState.id, orgId))
      .limit(1);

    if (!state || !state.basePrice) {
      return null;
    }

    // Use Zod validation for safe parsing
    const now = new Date();
    const storedModifiers = parseModifiersSafe(state.activeModifiers, {
      orgId,
    });

    // Clean up expired modifiers and bound effects
    const activeModifiers = storedModifiers
      .filter((m) => new Date(m.expiresAt).getTime() > now.getTime())
      .map((m) => ({
        ...m,
        effect: Math.max(
          MIN_EVENT_MULTIPLIER,
          Math.min(MAX_EVENT_MULTIPLIER, m.effect)
        ),
      }));

    // Calculate new price with production-level random noise
    const newPrice = calculateCurrentPrice(
      state.basePrice,
      state.sentiment ?? 0,
      activeModifiers,
      secureRandom
    );

    // Update database with optimistic locking
    const result = await db
      .update(organizationState)
      .set({
        currentPrice: newPrice,
        activeModifiers,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationState.id, orgId),
          eq(organizationState.updatedAt, state.updatedAt)
        )
      )
      .returning({ id: organizationState.id });

    if (result.length > 0) {
      return newPrice;
    }

    // Optimistic lock conflict - retry
    logger.debug(
      `Optimistic lock conflict updating price for ${orgId}, attempt ${attempt + 1}/${MAX_RETRIES}`,
      { orgId, attempt },
      'EventMarketPipeline'
    );

    // Exponential backoff delay before retry
    await backoffDelay(attempt);
  }

  logger.error(
    `Failed to update price after ${MAX_RETRIES} attempts (optimistic lock conflicts)`,
    { stockIdOrTicker, orgId },
    'EventMarketPipeline'
  );
  return null;
}

/**
 * Update sentiment for a stock using atomic SQL increment
 * @param stockIdOrTicker - Either an organization ID or a ticker symbol
 */
export async function updateStockSentiment(
  stockIdOrTicker: string,
  sentimentChange: number
): Promise<void> {
  // Resolve ticker to org ID if needed
  const orgId = resolveTickerToOrgId(stockIdOrTicker) ?? stockIdOrTicker;

  // Check if state exists first
  const [state] = await db
    .select({
      id: organizationState.id,
      sentiment: organizationState.sentiment,
    })
    .from(organizationState)
    .where(eq(organizationState.id, orgId))
    .limit(1);

  if (!state) {
    logger.warn(
      `Cannot update sentiment: OrganizationState not found for ${stockIdOrTicker}`,
      { stockIdOrTicker, resolvedOrgId: orgId },
      'EventMarketPipeline'
    );
    return;
  }

  const oldSentiment = state.sentiment ?? 0;

  // Use SQL to atomically increment sentiment with bounds
  await db
    .update(organizationState)
    .set({
      sentiment: sql`GREATEST(-100, LEAST(100, COALESCE(${organizationState.sentiment}, 0) + ${sentimentChange}))`,
      updatedAt: new Date(),
    })
    .where(eq(organizationState.id, orgId));

  logger.debug(
    `Updated sentiment for ${stockIdOrTicker}`,
    {
      stockIdOrTicker,
      resolvedOrgId: orgId,
      oldSentiment,
      change: sentimentChange,
    },
    'EventMarketPipeline'
  );
}

/**
 * Event Market Pipeline Service class
 */
export class EventMarketPipelineService {
  async applyEvent(event: StructuredEventData): Promise<number> {
    return applyEventToMarkets(event);
  }

  async addModifier(stockId: string, modifier: PriceModifier): Promise<void> {
    return addPriceModifier(stockId, modifier);
  }

  calculatePrice(
    basePrice: number,
    sentiment: number,
    modifiers: PriceModifier[],
    rng?: () => number
  ): number {
    return calculateCurrentPrice(basePrice, sentiment, modifiers, rng);
  }

  async updatePrice(stockId: string): Promise<number | null> {
    return updateStockPrice(stockId);
  }

  async updateSentiment(stockId: string, change: number): Promise<void> {
    return updateStockSentiment(stockId, change);
  }
}

// Singleton instance
export const eventMarketPipeline = new EventMarketPipelineService();
