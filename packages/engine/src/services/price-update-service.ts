import { PerpDbAdapter, PerpMarketService } from '@babylon/core/markets/perps';
import { eq, getDbInstance } from '@babylon/db';
import { db, organizationState, organizations } from '@babylon/db/runtime';

import type { JsonValue } from '@babylon/shared';
import { logger, PERP_MARKET_CONFIG } from '@babylon/shared';
import { FEE_CONFIG } from '../config/fees';
import { broadcastToChannel } from './realtime-broadcaster';
import { WalletService } from './wallet-service';

export type PriceUpdateSource =
  | 'user_trade'
  | 'npc_trade'
  | 'event'
  | 'system'
  | 'volatility_simulation';

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

    const perpService = new PerpMarketService({
      db: new PerpDbAdapter(),
      wallet: {
        debit: ({ userId, amount, reason, description, relatedId }) =>
          WalletService.debit(
            userId,
            amount,
            reason,
            description ?? '',
            relatedId
          ),
        credit: ({ userId, amount, reason, description, relatedId }) =>
          WalletService.credit(
            userId,
            amount,
            reason,
            description ?? '',
            relatedId
          ),
        recordPnL: async ({ userId, pnl, reason, relatedId }) => {
          await WalletService.recordPnL(userId, pnl, reason, relatedId);
        },
        getBalance: (userId: string) => WalletService.getBalance(userId),
      },
      fees: {
        tradingFeeRate: FEE_CONFIG.TRADING_FEE_RATE,
        platformShare: FEE_CONFIG.PLATFORM_SHARE,
        referrerShare: FEE_CONFIG.REFERRER_SHARE,
        minFeeAmount: FEE_CONFIG.MIN_FEE_AMOUNT,
      },
    });
    const appliedUpdates: AppliedPriceUpdate[] = [];
    const priceMap = new Map<string, number>();
    const now = new Date();

    for (const update of updates) {
      if (!Number.isFinite(update.newPrice) || update.newPrice <= 0) {
        logger.warn(
          'Skipping invalid price update',
          { update },
          'PriceUpdateService'
        );
        continue;
      }

      const orgId = update.organizationId;

      // Prefer OrganizationState as the source of truth for dynamic pricing.
      // The `Organization` table is not guaranteed to be seeded in all envs.
      const [state] = await db
        .select({
          id: organizationState.id,
          currentPrice: organizationState.currentPrice,
          basePrice: organizationState.basePrice,
        })
        .from(organizationState)
        .where(eq(organizationState.id, orgId))
        .limit(1);

      // Best-effort: keep `Organization.currentPrice` in sync if the row exists.
      const [organization] = await db
        .select({
          id: organizations.id,
          currentPrice: organizations.currentPrice,
          initialPrice: organizations.initialPrice,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      // Resolve basePrice for bounds enforcement
      // Priority: organizationState.basePrice > organization.initialPrice
      const resolvedBasePrice = Number(
        state?.basePrice ?? organization?.initialPrice ?? 0
      );
      const hasValidBasePrice =
        Number.isFinite(resolvedBasePrice) && resolvedBasePrice > 0;

      // Central price clamp: enforce basePrice bounds on all updates
      let clampedNewPrice = update.newPrice;
      if (!hasValidBasePrice) {
        logger.warn(
          'Missing basePrice for price update, skipping bounds enforcement',
          { orgId, resolvedBasePrice },
          'PriceUpdateService'
        );
      }
      if (hasValidBasePrice) {
        const minPrice =
          resolvedBasePrice * PERP_MARKET_CONFIG.PRICE_FLOOR_RATIO;
        const maxPrice =
          resolvedBasePrice * PERP_MARKET_CONFIG.PRICE_CEILING_RATIO;
        clampedNewPrice = Math.max(
          minPrice,
          Math.min(maxPrice, clampedNewPrice)
        );
      }

      const oldPriceCandidate =
        organization?.currentPrice ??
        state?.currentPrice ??
        state?.basePrice ??
        clampedNewPrice;
      const oldPrice = Number(oldPriceCandidate ?? clampedNewPrice);
      const change = clampedNewPrice - oldPrice;
      const changePercent = oldPrice === 0 ? 0 : (change / oldPrice) * 100;

      if (organization) {
        await db
          .update(organizations)
          .set({ currentPrice: clampedNewPrice, updatedAt: now })
          .where(eq(organizations.id, organization.id));
      }

      // Keep runtime price state in sync (used across engine + widgets)
      // Ensure basePrice is always set to prevent null fallback drift
      await db
        .insert(organizationState)
        .values({
          id: orgId,
          currentPrice: clampedNewPrice,
          basePrice: resolvedBasePrice,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: organizationState.id,
          set: { currentPrice: clampedNewPrice, updatedAt: now },
        });

      await getDbInstance().recordPriceUpdate(
        orgId,
        clampedNewPrice,
        change,
        changePercent
      );

      priceMap.set(orgId, clampedNewPrice);

      appliedUpdates.push({
        organizationId: orgId,
        oldPrice,
        newPrice: clampedNewPrice,
        change,
        changePercent,
        source: update.source,
        reason: update.reason,
        metadata: update.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    if (priceMap.size > 0) {
      await perpService.applyPriceUpdates(priceMap);

      // Broadcast price updates (handled by API layer if available)
      try {
        const updatesForBroadcast: JsonValue = appliedUpdates.map((u) => ({
          organizationId: u.organizationId,
          oldPrice: u.oldPrice,
          newPrice: u.newPrice,
          change: u.change,
          changePercent: u.changePercent,
          source: u.source,
          reason: u.reason ?? null,
          metadata: u.metadata ?? null,
          timestamp: u.timestamp,
        }));

        await broadcastToChannel('markets', {
          type: 'price_update',
          updates: updatesForBroadcast,
        });

        // If any updates include a canonical perp ticker, also broadcast a
        // `perp_price_update` for real-time UI hooks/stores.
        const perpUpdates = appliedUpdates
          .map((u) => {
            const tickerRaw = u.metadata?.ticker;
            const ticker =
              typeof tickerRaw === 'string' && tickerRaw.length > 0
                ? tickerRaw.toUpperCase()
                : null;
            if (!ticker) return null;
            return {
              ticker,
              organizationId: u.organizationId,
              newPrice: u.newPrice,
              price: u.newPrice,
              change: u.change,
              changePercent: u.changePercent,
            };
          })
          .filter((u): u is NonNullable<typeof u> => u !== null);

        if (perpUpdates.length > 0) {
          await broadcastToChannel('markets', {
            type: 'perp_price_update',
            updates: perpUpdates,
          });
        }
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
