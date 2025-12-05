import { db, eq, getDbInstance, organizations } from '@babylon/db';
import { logger } from '@babylon/shared';
import { getReadyPerpsEngine } from '@babylon/engine';
import type { JsonValue } from '@babylon/shared';

export type PriceUpdateSource = 'user_trade' | 'npc_trade' | 'event' | 'system';

export interface PriceUpdateInput {
  organizationId: string;
  newPrice: number;
  source: PriceUpdateSource;
  reason?: string;
  metadata?: Record<string, JsonValue>;
}

export interface AppliedPriceUpdate {
  organizationId: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  changePercent: number;
  source: PriceUpdateSource;
  reason?: string;
  metadata?: Record<string, JsonValue>;
  timestamp: string;
}

export class PriceUpdateService {
  /**
   * Apply a batch of price updates with persistence, engine sync, and SSE broadcast
   */
  static async applyUpdates(
    updates: PriceUpdateInput[]
  ): Promise<AppliedPriceUpdate[]> {
    if (updates.length === 0) return [];

    const perpsEngine = await getReadyPerpsEngine();
    const appliedUpdates: AppliedPriceUpdate[] = [];
    const priceMap = new Map<string, number>();

    for (const update of updates) {
      if (!Number.isFinite(update.newPrice) || update.newPrice <= 0) {
        logger.warn(
          'Skipping invalid price update',
          { update },
          'PriceUpdateService'
        );
        continue;
      }

      const [organization] = await db
        .select({
          id: organizations.id,
          currentPrice: organizations.currentPrice,
        })
        .from(organizations)
        .where(eq(organizations.id, update.organizationId))
        .limit(1);

      if (!organization) {
        logger.warn(
          'Organization not found for price update',
          { organizationId: update.organizationId },
          'PriceUpdateService'
        );
        continue;
      }

      const oldPrice = Number(organization.currentPrice ?? update.newPrice);
      const change = update.newPrice - oldPrice;
      const changePercent = oldPrice === 0 ? 0 : (change / oldPrice) * 100;

      await db
        .update(organizations)
        .set({ currentPrice: update.newPrice, updatedAt: new Date() })
        .where(eq(organizations.id, organization.id));

      await getDbInstance().recordPriceUpdate(
        organization.id,
        update.newPrice,
        change,
        changePercent
      );

      priceMap.set(organization.id, update.newPrice);

      appliedUpdates.push({
        organizationId: organization.id,
        oldPrice,
        newPrice: update.newPrice,
        change,
        changePercent,
        source: update.source,
        reason: update.reason,
        metadata: update.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    if (priceMap.size > 0) {
      perpsEngine.updatePositions(priceMap);

      // Broadcast price updates (handled by API layer if available)
      try {
        const { broadcastToChannel } = await import('@babylon/api');
        await broadcastToChannel('markets', {
          type: 'price_update',
          updates: JSON.parse(JSON.stringify(appliedUpdates)) as JsonValue,
        });
      } catch {
        // Broadcast is optional - engine can work without it
      }

      logger.info(
        `Applied ${appliedUpdates.length} organization price updates`,
        { count: appliedUpdates.length },
        'PriceUpdateService'
      );
    }

    return appliedUpdates;
  }
}
