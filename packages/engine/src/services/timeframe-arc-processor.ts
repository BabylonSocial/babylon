/**
 * Timeframe Arc Processor
 *
 * Manages arc state transitions for markets of different timeframes.
 * Unlike the day-based narrative processor, this uses actual timestamps
 * to determine state transitions.
 *
 * ## Timeframe State Machines
 *
 * Each timeframe has a different set of states and transition speeds:
 *
 * FLASH (15-30 min):
 *   live ──────────────────────────────────────────> resolving
 *   └── No intermediate states, just active trading then resolution
 *
 * INTRADAY (1-6 hours):
 *   setup ──> active ──> climax ──> resolution
 *   └── 4 phases, ~25% of time each
 *
 * DAILY (12-48 hours):
 *   morning ──> midday ──> afternoon ──> evening ──> resolution
 *   └── 5 phases following market day pattern
 *
 * WEEKLY (3-7 days):
 *   setup ──> tension ──> escalation ──> crisis ──> resolution
 *   └── Similar to long-term but compressed
 *
 * MONTHLY+ (2+ weeks):
 *   setup ──> tension ──> escalation ──> crisis ──> revelation ──> resolution
 *   └── Full 6-phase narrative arc
 */

import {
  db,
  eq,
  timeframedMarkets,
  type TimeframedMarket,
} from '@babylon/db';
import { logger } from '@babylon/shared';
import {
  getCurrentArcState,
  getEventCooldownMs,
  getEventMultiplier,
  getStateBoundaries,
  TIMEFRAME_CONFIGS,
} from './market-timeframes';
import { subMarketService } from './sub-market-service';

// =============================================================================
// TYPES
// =============================================================================

export interface ArcTransitionResult {
  transitioned: boolean;
  previousState?: string;
  newState?: string;
  marketId: string;
}

export interface EventGenerationResult {
  generated: boolean;
  eventType?: string;
  marketId: string;
  reason?: string;
}

export interface TimeframeTickResult {
  marketsProcessed: number;
  transitionsOccurred: number;
  eventsGenerated: number;
  subMarketsSpawned: number;
  errors: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Event types by arc state - more specific for different timeframes */
const STATE_EVENT_TYPES: Record<string, string[]> = {
  // Long-term states
  setup: ['rumor', 'announcement', 'speculation'],
  tension: ['leak', 'insider_hint', 'market_signal'],
  escalation: ['confirmation', 'denial', 'controversy'],
  crisis: ['breaking_news', 'major_development', 'uncertainty_peak'],
  revelation: ['proof', 'official_statement', 'definitive_signal'],
  resolution: ['final_answer', 'market_close'],

  // Daily states
  morning: ['morning_news', 'pre_market', 'opening_signal'],
  midday: ['midday_update', 'volume_spike', 'institutional_move'],
  afternoon: ['afternoon_reversal', 'trend_continuation', 'volatility'],
  evening: ['closing_pressure', 'after_hours', 'final_moves'],

  // Intraday states
  active: ['price_move', 'volume_surge', 'breakout'],
  climax: ['peak_activity', 'decisive_move'],

  // Flash states
  live: ['live_event', 'real_time_update'],
  resolving: ['resolution_pending'],
};

/** Base probability of generating an event per tick, by state */
const STATE_EVENT_PROBABILITIES: Record<string, number> = {
  setup: 0.3,
  tension: 0.4,
  escalation: 0.5,
  crisis: 0.6,
  revelation: 0.7,
  resolution: 0.2, // Lower after resolution
  morning: 0.4,
  midday: 0.3,
  afternoon: 0.4,
  evening: 0.5,
  active: 0.5,
  climax: 0.7,
  live: 0.6,
  resolving: 0.1,
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class TimeframeArcProcessor {
  /**
   * Process all active markets for the current tick
   */
  async processTick(now: Date = new Date()): Promise<TimeframeTickResult> {
    const result: TimeframeTickResult = {
      marketsProcessed: 0,
      transitionsOccurred: 0,
      eventsGenerated: 0,
      subMarketsSpawned: 0,
      errors: [],
    };

    try {
      // Get all active markets
      const activeMarkets = await db
        .select()
        .from(timeframedMarkets)
        .where(eq(timeframedMarkets.isActive, true));

      logger.debug(
        `Processing ${activeMarkets.length} active markets`,
        {},
        'TimeframeArcProcessor'
      );

      for (const market of activeMarkets) {
        try {
          result.marketsProcessed++;

          // Check for resolution
          if (now >= market.endTime) {
            await this.resolveMarket(market);
            result.transitionsOccurred++;
            continue;
          }

          // Check for state transition
          const transition = await this.checkStateTransition(market, now);
          if (transition.transitioned) {
            result.transitionsOccurred++;
          }

          // Check for event generation
          const event = await this.tryGenerateEvent(market, now);
          if (event.generated) {
            result.eventsGenerated++;

            // Check for sub-market spawning
            if (event.eventType) {
              const spawned = await this.trySpawnSubMarket(market, event.eventType);
              if (spawned) {
                result.subMarketsSpawned++;
              }
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Market ${market.id}: ${msg}`);
          logger.error(
            `Error processing market`,
            { marketId: market.id, error: msg },
            'TimeframeArcProcessor'
          );
        }
      }

      logger.info(
        `Tick complete`,
        {
          processed: result.marketsProcessed,
          transitions: result.transitionsOccurred,
          events: result.eventsGenerated,
          spawns: result.subMarketsSpawned,
          errors: result.errors.length,
        },
        'TimeframeArcProcessor'
      );
    } catch (error) {
      logger.error(
        `Tick failed`,
        { error: error instanceof Error ? error.message : String(error) },
        'TimeframeArcProcessor'
      );
    }

    return result;
  }

  /**
   * Check if a market should transition to a new state
   */
  async checkStateTransition(
    market: TimeframedMarket,
    now: Date = new Date()
  ): Promise<ArcTransitionResult> {
    const expectedState = getCurrentArcState(
      market.startTime,
      market.endTime,
      market.timeframe,
      now
    );

    if (expectedState !== market.arcState) {
      logger.info(
        `State transition`,
        {
          marketId: market.id,
          from: market.arcState,
          to: expectedState,
          timeframe: market.timeframe,
        },
        'TimeframeArcProcessor'
      );

      await db
        .update(timeframedMarkets)
        .set({
          arcState: expectedState,
          arcStateEnteredAt: now,
          updatedAt: now,
        })
        .where(eq(timeframedMarkets.id, market.id));

      return {
        transitioned: true,
        previousState: market.arcState,
        newState: expectedState,
        marketId: market.id,
      };
    }

    return {
      transitioned: false,
      marketId: market.id,
    };
  }

  /**
   * Try to generate an event for a market
   */
  async tryGenerateEvent(
    market: TimeframedMarket,
    now: Date = new Date()
  ): Promise<EventGenerationResult> {
    // Check cooldown
    const cooldownMs = getEventCooldownMs(market.timeframe);
    if (market.lastEventAt) {
      const elapsed = now.getTime() - market.lastEventAt.getTime();
      if (elapsed < cooldownMs) {
        return {
          generated: false,
          marketId: market.id,
          reason: 'cooldown',
        };
      }
    }

    // Get base probability for current state
    const baseProbability = STATE_EVENT_PROBABILITIES[market.arcState] ?? 0.3;

    // Apply timeframe multiplier
    const multiplier = getEventMultiplier(market.timeframe);
    const probability = Math.min(1, baseProbability * multiplier);

    // Roll for event
    if (Math.random() > probability) {
      return {
        generated: false,
        marketId: market.id,
        reason: 'probability_check_failed',
      };
    }

    // Select event type
    const eventTypes = STATE_EVENT_TYPES[market.arcState] ?? ['generic_event'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    // Update market
    await db
      .update(timeframedMarkets)
      .set({
        eventsGenerated: (market.eventsGenerated ?? 0) + 1,
        lastEventAt: now,
        updatedAt: now,
      })
      .where(eq(timeframedMarkets.id, market.id));

    logger.debug(
      `Generated event`,
      {
        marketId: market.id,
        eventType,
        state: market.arcState,
        probability,
      },
      'TimeframeArcProcessor'
    );

    return {
      generated: true,
      eventType,
      marketId: market.id,
    };
  }

  /**
   * Try to spawn a sub-market from an event
   */
  async trySpawnSubMarket(
    market: TimeframedMarket,
    eventType: string
  ): Promise<boolean> {
    const config = TIMEFRAME_CONFIGS[market.timeframe];
    if (!config.canSpawnChildren) {
      return false;
    }

    try {
      const result = await subMarketService.trySpawnFromEvent({
        parentMarketId: market.id,
        eventType,
        category: market.category,
        timeframe: market.timeframe,
        templateVars: {
          // Default template vars - would be populated from actual event data
          org: 'Organization',
          ticker: 'TICK',
          threshold: '2',
        },
      });

      return result.spawned;
    } catch (error) {
      logger.warn(
        `Failed to spawn sub-market`,
        { marketId: market.id, error: error instanceof Error ? error.message : String(error) },
        'TimeframeArcProcessor'
      );
      return false;
    }
  }

  /**
   * Resolve a market that has reached its end time
   */
  async resolveMarket(market: TimeframedMarket): Promise<void> {
    const now = new Date();

    await db
      .update(timeframedMarkets)
      .set({
        isActive: false,
        isResolved: true,
        resolvedAt: now,
        arcState: 'resolution',
        updatedAt: now,
      })
      .where(eq(timeframedMarkets.id, market.id));

    logger.info(
      `Market resolved`,
      {
        marketId: market.id,
        timeframe: market.timeframe,
        duration: (now.getTime() - market.startTime.getTime()) / 1000 / 60,
      },
      'TimeframeArcProcessor'
    );
  }

  /**
   * Get the current phase boundaries for a market
   */
  getPhaseBoundaries(
    market: TimeframedMarket
  ): Array<{ state: string; start: Date; end: Date }> {
    return getStateBoundaries(
      market.startTime,
      market.endTime,
      market.timeframe
    );
  }

  /**
   * Get progress through current arc (0-1)
   */
  getArcProgress(market: TimeframedMarket, now: Date = new Date()): number {
    const totalDuration = market.endTime.getTime() - market.startTime.getTime();
    const elapsed = now.getTime() - market.startTime.getTime();
    return Math.max(0, Math.min(1, elapsed / totalDuration));
  }

  /**
   * Get time remaining until resolution
   */
  getTimeRemaining(market: TimeframedMarket, now: Date = new Date()): number {
    return Math.max(0, market.endTime.getTime() - now.getTime());
  }

  /**
   * Format time remaining as human-readable string
   */
  formatTimeRemaining(market: TimeframedMarket, now: Date = new Date()): string {
    const ms = this.getTimeRemaining(market, now);

    if (ms <= 0) return 'Resolved';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }
}

// Singleton instance
export const timeframeArcProcessor = new TimeframeArcProcessor();

// =============================================================================
// CRON TICK INTERVALS
// =============================================================================

/**
 * Recommended tick intervals for different use cases
 */
export const TICK_INTERVALS = {
  /** For flash markets - every 30 seconds */
  flash: 30 * 1000,
  /** For intraday markets - every 2 minutes */
  intraday: 2 * 60 * 1000,
  /** For daily+ markets - every 5 minutes */
  standard: 5 * 60 * 1000,
} as const;
