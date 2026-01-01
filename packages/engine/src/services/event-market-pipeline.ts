/**
 * Event to Market Pipeline
 *
 * Applies narrative events to market prices deterministically.
 * Events create price modifiers that decay over time.
 */

import {
  db,
  eq,
  organizationState,
  type PriceModifier,
  type StructuredEventData,
} from '@babylon/db';
import { logger } from '@babylon/shared';

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
      const effect = impact.direction === 'up' ? 1 + magnitude : 1 - magnitude;
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
 * Add a price modifier to a stock
 */
export async function addPriceModifier(
  stockId: string,
  modifier: PriceModifier
): Promise<void> {
  // Get current state
  const [state] = await db
    .select({
      activeModifiers: organizationState.activeModifiers,
    })
    .from(organizationState)
    .where(eq(organizationState.id, stockId))
    .limit(1);

  if (!state) {
    logger.warn(
      `Cannot add modifier: OrganizationState not found for ${stockId}`,
      { stockId },
      'EventMarketPipeline'
    );
    return;
  }

  // Get existing modifiers and filter expired
  // Cast from unknown since JSONB columns don't have type info at runtime
  const now = new Date();
  const existingModifiers =
    (state.activeModifiers as PriceModifier[] | null) ?? [];
  const modifiers: PriceModifier[] = existingModifiers.filter(
    (m) => new Date(m.expiresAt).getTime() > now.getTime()
  );

  // Add new modifier
  modifiers.push(modifier);

  // Update database
  await db
    .update(organizationState)
    .set({
      activeModifiers: modifiers,
      updatedAt: now,
    })
    .where(eq(organizationState.id, stockId));
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

    const hoursSince = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60);
    const decayedEffect =
      1 + (mod.effect - 1) * Math.exp(-mod.decayRate * hoursSince);
    price *= decayedEffect;
  }

  // Apply sentiment-based volatility (small random component)
  const volatility = (Math.abs(sentiment) / 100) * 0.02;
  const noise = (Math.random() - 0.5) * 2 * volatility;
  price *= 1 + noise;

  return price;
}

/**
 * Update a stock's current price based on its fundamentals
 */
export async function updateStockPrice(
  stockId: string
): Promise<number | null> {
  const [state] = await db
    .select({
      basePrice: organizationState.basePrice,
      sentiment: organizationState.sentiment,
      activeModifiers: organizationState.activeModifiers,
    })
    .from(organizationState)
    .where(eq(organizationState.id, stockId))
    .limit(1);

  if (!state || !state.basePrice) {
    return null;
  }

  // Clean up expired modifiers
  // Cast from unknown since JSONB columns don't have type info at runtime
  const now = new Date();
  const storedModifiers =
    (state.activeModifiers as PriceModifier[] | null) ?? [];
  const activeModifiers = storedModifiers.filter(
    (m) => new Date(m.expiresAt).getTime() > now.getTime()
  );

  // Calculate new price
  const newPrice = calculateCurrentPrice(
    state.basePrice,
    state.sentiment ?? 0,
    activeModifiers
  );

  // Update database
  await db
    .update(organizationState)
    .set({
      currentPrice: newPrice,
      activeModifiers,
      updatedAt: now,
    })
    .where(eq(organizationState.id, stockId));

  return newPrice;
}

/**
 * Update sentiment for a stock based on event
 */
export async function updateStockSentiment(
  stockId: string,
  sentimentChange: number
): Promise<void> {
  const [state] = await db
    .select({
      sentiment: organizationState.sentiment,
    })
    .from(organizationState)
    .where(eq(organizationState.id, stockId))
    .limit(1);

  if (!state) {
    logger.warn(
      `Cannot update sentiment: OrganizationState not found for ${stockId}`,
      { stockId },
      'EventMarketPipeline'
    );
    return;
  }

  const currentSentiment = state.sentiment ?? 0;
  const newSentiment = Math.max(
    -100,
    Math.min(100, currentSentiment + sentimentChange)
  );

  await db
    .update(organizationState)
    .set({
      sentiment: newSentiment,
      updatedAt: new Date(),
    })
    .where(eq(organizationState.id, stockId));

  logger.debug(
    `Updated sentiment for ${stockId}`,
    { stockId, oldSentiment: currentSentiment, newSentiment },
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
