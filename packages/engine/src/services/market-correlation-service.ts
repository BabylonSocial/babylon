/**
 * Market Correlation Service
 *
 * Applies cross-market cascade effects when narrative events occur.
 * Uses static correlation data to determine how events affecting one
 * organization should impact related organizations.
 *
 * @example
 * When TeslAI has a -10% event:
 * - NVIDAI (supplier, 0.3 multiplier) gets -3%
 * - AIPPLE (competitor, -0.15 multiplier) gets +1.5%
 *
 * @module services/market-correlation-service
 */

import { inArray } from '@babylon/db';
import { db, organizationState } from '@babylon/db/runtime';
import { type JsonValue, logger, PERP_MARKET_CONFIG } from '@babylon/shared';
import {
  correlations,
  getAffectedOrgs,
  type MarketCorrelation,
  type OrganizationRelationType,
} from '../data/organization-correlations';
import { formatError } from '../utils/error-utils';
import { PriceUpdateService } from './price-update-service';
import { StaticDataRegistry } from './static-data-registry';

/**
 * Result of applying cascade effects
 */
export interface CascadeResult {
  /** Number of organizations affected */
  affectedCount: number;
  /** Details of each cascade effect */
  effects: Array<{
    orgId: string;
    ticker: string | null;
    relationship: OrganizationRelationType;
    originalEffect: number;
    cascadeEffect: number;
    newPrice: number;
  }>;
}

/**
 * Apply cascade effects to related organizations when a primary org has a price event
 *
 * @param primaryOrgId - The organization that had the original event
 * @param priceChangePercent - The percentage change at the primary org (e.g., -0.10 for -10%)
 * @param eventSource - Description of what caused the original event (for logging)
 * @returns Cascade result with affected organizations
 */
export async function applyCascadeEffects(
  primaryOrgId: string,
  priceChangePercent: number,
  eventSource?: string
): Promise<CascadeResult> {
  const affectedOrgs = getAffectedOrgs(primaryOrgId);

  if (affectedOrgs.length === 0) {
    return { affectedCount: 0, effects: [] };
  }

  // Get current prices for affected orgs
  const orgIds = affectedOrgs.map((a) => a.orgId);
  const states = await db
    .select({
      id: organizationState.id,
      currentPrice: organizationState.currentPrice,
      basePrice: organizationState.basePrice,
    })
    .from(organizationState)
    .where(inArray(organizationState.id, orgIds));

  const stateByOrgId = new Map(states.map((s) => [s.id, s]));

  // Calculate and apply cascade effects
  const updates: Array<{
    organizationId: string;
    newPrice: number;
    source: 'event';
    reason: string;
    metadata: Record<string, JsonValue>;
  }> = [];

  const effects: CascadeResult['effects'] = [];

  for (const affected of affectedOrgs) {
    const state = stateByOrgId.get(affected.orgId);
    if (!state) continue;

    const basePrice = Number(state.basePrice);
    const currentPrice = Number(state.currentPrice ?? state.basePrice);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) continue;

    // Calculate cascade effect
    // Positive multiplier = same direction (suppliers hurt when customer hurts)
    // Negative multiplier = inverse direction (competitors benefit from rival's pain)
    const cascadeEffect = priceChangePercent * affected.multiplier;
    const rawPrice = currentPrice * (1 + cascadeEffect);

    // Clamp to basePrice bounds to prevent cascade-driven price explosion
    const hasValidBasePrice = Number.isFinite(basePrice) && basePrice > 0;
    if (!hasValidBasePrice) {
      logger.warn(
        'Missing basePrice for cascade target, using currentPrice fallback',
        { orgId: affected.orgId, currentPrice },
        'MarketCorrelationService'
      );
    }
    const minPrice = hasValidBasePrice
      ? basePrice * PERP_MARKET_CONFIG.PRICE_FLOOR_RATIO
      : currentPrice * 0.25;
    const maxPrice = hasValidBasePrice
      ? basePrice * PERP_MARKET_CONFIG.PRICE_CEILING_RATIO
      : currentPrice * 4.0;
    const newPrice = Math.max(minPrice, Math.min(maxPrice, rawPrice));

    if (!Number.isFinite(newPrice) || newPrice <= 0) continue;

    const org = StaticDataRegistry.getOrganization(affected.orgId);
    const ticker = org?.ticker ?? null;

    updates.push({
      organizationId: affected.orgId,
      newPrice,
      source: 'event',
      reason: `Cascade from ${primaryOrgId} (${affected.relationship})`,
      metadata: {
        primaryOrgId,
        relationship: affected.relationship,
        originalEffect: priceChangePercent,
        cascadeEffect,
        eventSource: eventSource ?? null,
      } as Record<string, string | number | boolean | null>,
    });

    effects.push({
      orgId: affected.orgId,
      ticker,
      relationship: affected.relationship,
      originalEffect: priceChangePercent,
      cascadeEffect,
      newPrice,
    });
  }

  // Apply all updates
  if (updates.length > 0) {
    try {
      const applied = await PriceUpdateService.applyUpdates(updates);
      logger.info(
        'Applied cascade effects',
        {
          primaryOrgId,
          originalEffect: priceChangePercent,
          affectedCount: applied.length,
          sample: effects.slice(0, 3).map((e) => ({
            ticker: e.ticker,
            relationship: e.relationship,
            cascadeEffect: e.cascadeEffect.toFixed(4),
          })),
        },
        'MarketCorrelationService'
      );
    } catch (error) {
      logger.warn(
        'Failed to apply cascade effects',
        {
          primaryOrgId,
          error: formatError(error),
        },
        'MarketCorrelationService'
      );
    }
  }

  return {
    affectedCount: effects.length,
    effects,
  };
}

/**
 * Get all correlation data for debugging/analysis
 */
export function getAllCorrelations(): MarketCorrelation[] {
  return [...correlations];
}

/**
 * Derive additional correlations from actor affiliations
 *
 * @description
 * Automatically creates correlation links between organizations
 * that share executives (based on actor affiliations).
 * This supplements the static correlation data.
 *
 * @returns Array of derived correlations from shared actors
 */
export function deriveCorrelationsFromActors(): MarketCorrelation[] {
  const derived: MarketCorrelation[] = [];

  // Get all actors with affiliations
  const actors = StaticDataRegistry.getAllActors();

  for (const actor of actors) {
    // Only consider S_TIER and A_TIER actors for correlation (executives)
    if (actor.tier !== 'S_TIER' && actor.tier !== 'A_TIER') continue;

    const affiliations = actor.affiliations ?? [];
    if (affiliations.length < 2) continue;

    // Create correlations between all affiliated organizations
    for (let i = 0; i < affiliations.length; i++) {
      for (let j = i + 1; j < affiliations.length; j++) {
        const org1 = affiliations[i]!;
        const org2 = affiliations[j]!;

        // Skip if correlation already exists in static data
        const existingCorrelation = correlations.find(
          (c) =>
            (c.primary === org1 && c.related === org2) ||
            (c.primary === org2 && c.related === org1)
        );

        if (!existingCorrelation) {
          // Create bidirectional correlation
          derived.push({
            primary: org1,
            related: org2,
            relationship: 'shared_executive',
            multiplier: actor.tier === 'S_TIER' ? 0.2 : 0.1,
            description: `Shared executive: ${actor.name}`,
          });
          derived.push({
            primary: org2,
            related: org1,
            relationship: 'shared_executive',
            multiplier: actor.tier === 'S_TIER' ? 0.2 : 0.1,
            description: `Shared executive: ${actor.name}`,
          });
        }
      }
    }
  }

  return derived;
}

/**
 * Get all correlations including dynamically derived ones
 */
export function getAllCorrelationsWithDerived(): MarketCorrelation[] {
  const staticCorrelations = getAllCorrelations();
  const derivedCorrelations = deriveCorrelationsFromActors();

  // Deduplicate (static takes precedence)
  const existingKeys = new Set(
    staticCorrelations.map((c) => `${c.primary}:${c.related}`)
  );

  const newDerived = derivedCorrelations.filter(
    (c) => !existingKeys.has(`${c.primary}:${c.related}`)
  );

  return [...staticCorrelations, ...newDerived];
}

/**
 * Market Correlation Service class
 */
export class MarketCorrelationService {
  async applyCascade(
    primaryOrgId: string,
    priceChangePercent: number,
    eventSource?: string
  ): Promise<CascadeResult> {
    return applyCascadeEffects(primaryOrgId, priceChangePercent, eventSource);
  }

  getCorrelations(): MarketCorrelation[] {
    return getAllCorrelations();
  }

  getCorrelationsWithDerived(): MarketCorrelation[] {
    return getAllCorrelationsWithDerived();
  }

  deriveFromActors(): MarketCorrelation[] {
    return deriveCorrelationsFromActors();
  }
}

// Singleton instance (camelCase for consistency with other services)
export const marketCorrelationService = new MarketCorrelationService();

// Backward-compatible alias (PascalCase) - deprecated
/** @deprecated Use marketCorrelationService instead */
export { marketCorrelationService as MarketCorrelationServiceInstance };
