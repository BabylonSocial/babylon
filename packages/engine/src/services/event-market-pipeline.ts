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
  db,
  eq,
  organizationState,
  type PriceModifier,
  sql,
  type StructuredEventData,
} from '@babylon/db';
import { logger } from '@babylon/shared';
import { secureRandom } from '../utils/entropy';
import { parseModifiersSafe, validatePriceModifier } from './jsonb-validators';
import { StaticDataRegistry } from './static-data-registry';

/**
 * Maximum retry attempts for optimistic locking conflicts
 */
const MAX_RETRIES = 3;

/**
 * Price bounds to prevent invalid prices
 */
const MIN_PRICE_MULTIPLIER = 0.01; // Minimum 1% of base price
const MAX_PRICE_MULTIPLIER = 100; // Maximum 100x of base price

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

  for (const impact of event.marketImpacts) {
    try {
      const magnitude = MAGNITUDE_MULTIPLIERS[impact.magnitude];
      // Bound the effect to prevent extreme values
      const rawEffect = impact.direction === 'up' ? 1 + magnitude : 1 - magnitude;
      const effect = Math.max(MIN_PRICE_MULTIPLIER, Math.min(MAX_PRICE_MULTIPLIER, rawEffect));
      const decayRate = DECAY_RATES[impact.duration];
      const durationHours = DURATION_HOURS[impact.duration];

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
        { error: error instanceof Error ? error.message : String(error) },
        'EventMarketPipeline'
      );
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
    const existingModifiers = parseModifiersSafe(state.activeModifiers, { orgId });

    // Filter expired modifiers and bound effect values
    const validModifiers: PriceModifier[] = existingModifiers
      .filter((m) => new Date(m.expiresAt).getTime() > now.getTime())
      .map((m) => ({
        ...m,
        effect: Math.max(MIN_PRICE_MULTIPLIER, Math.min(MAX_PRICE_MULTIPLIER, m.effect)),
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

    // Brief delay before retry
    await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
  }

  logger.error(
    `Failed to add modifier after ${MAX_RETRIES} attempts (optimistic lock conflicts)`,
    { stockIdOrTicker, orgId },
    'EventMarketPipeline'
  );
}

/**
 * Calculate the current price based on fundamentals and modifiers
 */
export function calculateCurrentPrice(
  basePrice: number,
  sentiment: number,
  modifiers: PriceModifier[]
): number {
  let price = basePrice;
  const now = new Date();

  // Apply all active modifiers with decay
  for (const mod of modifiers) {
    const appliedAt = new Date(mod.appliedAt);
    const expiresAt = new Date(mod.expiresAt);

    // Skip expired modifiers
    if (expiresAt.getTime() < now.getTime()) {
      continue;
    }

    // Bound effect to prevent extreme values
    const boundedEffect = Math.max(MIN_PRICE_MULTIPLIER, Math.min(MAX_PRICE_MULTIPLIER, mod.effect));

    const hoursSince = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60);
    const decayedEffect =
      1 + (boundedEffect - 1) * Math.exp(-mod.decayRate * hoursSince);
    price *= decayedEffect;
  }

  // Apply sentiment-based volatility (small random component)
  // Uses secureRandom for deterministic testing and to prevent manipulation
  const volatility = (Math.abs(sentiment) / 100) * 0.02;
  const noise = (secureRandom() - 0.5) * 2 * volatility;
  price *= 1 + noise;

  // Bound final price
  const minPrice = basePrice * MIN_PRICE_MULTIPLIER;
  const maxPrice = basePrice * MAX_PRICE_MULTIPLIER;
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
    const storedModifiers = parseModifiersSafe(state.activeModifiers, { orgId });

    // Clean up expired modifiers and bound effects
    const activeModifiers = storedModifiers
      .filter((m) => new Date(m.expiresAt).getTime() > now.getTime())
      .map((m) => ({
        ...m,
        effect: Math.max(MIN_PRICE_MULTIPLIER, Math.min(MAX_PRICE_MULTIPLIER, m.effect)),
      }));

    // Calculate new price
    const newPrice = calculateCurrentPrice(
      state.basePrice,
      state.sentiment ?? 0,
      activeModifiers
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

    // Brief delay before retry
    await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
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
    modifiers: PriceModifier[]
  ): number {
    return calculateCurrentPrice(basePrice, sentiment, modifiers);
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
