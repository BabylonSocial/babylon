/**
 * Article Frequency Service
 *
 * Dynamically adjusts article generation frequency based on:
 * - Active timeframed markets (flash, intraday, daily, etc.)
 * - Current arc states (crisis/revelation = more articles)
 * - Recent events (events trigger immediate article opportunities)
 *
 * Goal: Match article frequency to market activity for realistic news coverage.
 */

import { db, eq, timeframedMarkets } from '@babylon/db';
import { logger } from '@babylon/shared';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Base article probability by timeframe
 * Shorter timeframes = more frequent articles relative to duration
 */
const BASE_ARTICLE_PROBABILITY: Record<string, number> = {
  flash: 0.5, // 50% - Flash markets need immediate coverage
  intraday: 0.3, // 30% - Intraday gets frequent updates
  daily: 0.2, // 20% - Daily markets get morning/evening coverage
  weekly: 0.15, // 15% - Weekly gets a few articles
  monthly: 0.1, // 10% - Monthly gets periodic coverage
  quarterly: 0.08, // 8% - Quarterly is more subdued
  longterm: 0.05, // 5% - Long-term is the baseline
};

/**
 * Arc state multipliers - certain states generate more news
 */
const ARC_STATE_MULTIPLIERS: Record<string, number> = {
  // High activity states
  crisis: 2.0,
  revelation: 2.5,
  climax: 2.0,
  resolving: 1.5,

  // Medium activity states
  escalation: 1.5,
  tension: 1.3,
  active: 1.3,
  evening: 1.2,

  // Normal activity states
  setup: 1.0,
  morning: 1.0,
  midday: 1.0,
  afternoon: 1.0,
  live: 1.0,

  // Low activity states
  resolution: 0.8,
};

/**
 * Minimum article probability (never go below this)
 */
const MIN_ARTICLE_PROBABILITY = 0.05;

/**
 * Maximum article probability (cap to prevent spam)
 */
const MAX_ARTICLE_PROBABILITY = 0.6;

/**
 * Event-triggered article probability
 * When a narrative event occurs, this is the chance for an article
 */
const EVENT_ARTICLE_PROBABILITY = 0.7;

// =============================================================================
// SERVICE
// =============================================================================

export interface ArticleFrequencyContext {
  /** Current timestamp */
  now: Date;
  /** Whether there was a recent narrative event */
  hasRecentEvent?: boolean;
  /** The type of recent event if any */
  recentEventType?: string;
  /** Force a specific probability (for testing) */
  forceProb?: number;
}

export interface ArticleFrequencyResult {
  /** Should an article be generated? */
  shouldGenerate: boolean;
  /** The calculated probability */
  probability: number;
  /** Reason for the decision */
  reason: string;
  /** Active markets that influenced the decision */
  activeMarkets: number;
}

/**
 * Article Frequency Service
 *
 * Calculates dynamic article generation probability based on current
 * market activity and narrative state.
 */
export class ArticleFrequencyService {
  /**
   * Calculate the probability of generating an article right now
   */
  async calculateArticleProbability(
    context: ArticleFrequencyContext
  ): Promise<number> {
    if (context.forceProb !== undefined) {
      return context.forceProb;
    }

    // If there's a recent event, use event probability
    if (context.hasRecentEvent) {
      return EVENT_ARTICLE_PROBABILITY;
    }

    // Get active timeframed markets
    const activeMarkets = await db
      .select({
        timeframe: timeframedMarkets.timeframe,
        arcState: timeframedMarkets.arcState,
      })
      .from(timeframedMarkets)
      .where(eq(timeframedMarkets.isActive, true));

    if (activeMarkets.length === 0) {
      // No active timeframed markets - use baseline
      return MIN_ARTICLE_PROBABILITY;
    }

    // Calculate weighted probability based on active markets
    let totalProbability = 0;
    let marketCount = 0;

    for (const market of activeMarkets) {
      const baseProbability =
        BASE_ARTICLE_PROBABILITY[market.timeframe] ?? MIN_ARTICLE_PROBABILITY;
      const stateMultiplier =
        ARC_STATE_MULTIPLIERS[market.arcState] ?? 1.0;

      totalProbability += baseProbability * stateMultiplier;
      marketCount++;
    }

    // Average across active markets, with a boost for having multiple active markets
    const avgProbability = totalProbability / marketCount;
    const multiMarketBoost = 1 + Math.log10(Math.max(1, marketCount)) * 0.2;

    const finalProbability = Math.min(
      MAX_ARTICLE_PROBABILITY,
      Math.max(MIN_ARTICLE_PROBABILITY, avgProbability * multiMarketBoost)
    );

    logger.debug(
      `Calculated article probability: ${(finalProbability * 100).toFixed(1)}%`,
      {
        activeMarkets: marketCount,
        avgProbability: (avgProbability * 100).toFixed(1),
        multiMarketBoost: multiMarketBoost.toFixed(2),
      },
      'ArticleFrequencyService'
    );

    return finalProbability;
  }

  /**
   * Determine if an article should be generated right now
   */
  async shouldGenerateArticle(
    context: ArticleFrequencyContext
  ): Promise<ArticleFrequencyResult> {
    const probability = await this.calculateArticleProbability(context);

    // Get active market count for logging
    const activeMarkets = await db
      .select()
      .from(timeframedMarkets)
      .where(eq(timeframedMarkets.isActive, true));

    const roll = Math.random();
    const shouldGenerate = roll < probability;

    let reason: string;
    if (context.hasRecentEvent) {
      reason = `Event-triggered (${context.recentEventType})`;
    } else if (activeMarkets.length === 0) {
      reason = 'No active timeframed markets - baseline probability';
    } else {
      reason = `${activeMarkets.length} active markets - dynamic probability`;
    }

    return {
      shouldGenerate,
      probability,
      reason,
      activeMarkets: activeMarkets.length,
    };
  }

  /**
   * Get recommended articles per hour based on current market activity
   */
  async getRecommendedArticlesPerHour(): Promise<number> {
    const activeMarkets = await db
      .select({
        timeframe: timeframedMarkets.timeframe,
        arcState: timeframedMarkets.arcState,
      })
      .from(timeframedMarkets)
      .where(eq(timeframedMarkets.isActive, true));

    if (activeMarkets.length === 0) {
      return 2; // Baseline: 2 articles per hour
    }

    // Count markets by timeframe
    const timeframeCounts: Record<string, number> = {};
    for (const market of activeMarkets) {
      timeframeCounts[market.timeframe] =
        (timeframeCounts[market.timeframe] ?? 0) + 1;
    }

    // Calculate recommended rate
    let articlesPerHour = 2; // Base rate

    // Flash markets need the most coverage
    if (timeframeCounts.flash) {
      articlesPerHour += timeframeCounts.flash * 4; // +4 per flash market
    }
    if (timeframeCounts.intraday) {
      articlesPerHour += timeframeCounts.intraday * 2; // +2 per intraday market
    }
    if (timeframeCounts.daily) {
      articlesPerHour += timeframeCounts.daily * 0.5; // +0.5 per daily market
    }

    // Cap at reasonable maximum
    return Math.min(20, articlesPerHour);
  }

  /**
   * Get the probability that an organization should generate an article
   * given the current timeframe context
   */
  getTimeframeProbability(timeframe: string, arcState: string): number {
    const baseProbability =
      BASE_ARTICLE_PROBABILITY[timeframe] ?? MIN_ARTICLE_PROBABILITY;
    const stateMultiplier = ARC_STATE_MULTIPLIERS[arcState] ?? 1.0;

    return Math.min(
      MAX_ARTICLE_PROBABILITY,
      Math.max(MIN_ARTICLE_PROBABILITY, baseProbability * stateMultiplier)
    );
  }
}

// Singleton instance
export const articleFrequencyService = new ArticleFrequencyService();
