/**
 * Read paths for PerpMarketSnapshot that need the raw Drizzle client (PostgreSQL).
 * Keeps `getRawDrizzle` usage inside @babylon/db only.
 */
import { sql } from 'drizzle-orm';
import { getRawDrizzle } from './db';
import { perpMarketSnapshots } from './tables/perp-market-snapshots';

export type PerpSnapshotA2aListingRow = {
  ticker: string;
  name: string | null;
  organizationId: string;
  currentPrice: number;
  change24h: number | null;
  changePercent24h: number | null;
  volume24h: number | null;
  openInterest: number | null;
  fundingRate: unknown;
};

export async function listPerpMarketSnapshotsForA2a(
  limit: number
): Promise<PerpSnapshotA2aListingRow[]> {
  const drizzle = getRawDrizzle();
  return drizzle
    .select({
      ticker: perpMarketSnapshots.ticker,
      name: perpMarketSnapshots.name,
      organizationId: perpMarketSnapshots.organizationId,
      currentPrice: perpMarketSnapshots.currentPrice,
      change24h: perpMarketSnapshots.change24h,
      changePercent24h: perpMarketSnapshots.changePercent24h,
      volume24h: perpMarketSnapshots.volume24h,
      openInterest: perpMarketSnapshots.openInterest,
      fundingRate: perpMarketSnapshots.fundingRate,
    })
    .from(perpMarketSnapshots)
    .limit(limit);
}

export async function getPerpMarketSnapshotPriceRowByTickerIgnoreCase(
  ticker: string
): Promise<{
  ticker: string;
  currentPrice: number;
  change24h: number | null;
} | null> {
  const drizzle = getRawDrizzle();
  const rows = await drizzle
    .select({
      ticker: perpMarketSnapshots.ticker,
      currentPrice: perpMarketSnapshots.currentPrice,
      change24h: perpMarketSnapshots.change24h,
    })
    .from(perpMarketSnapshots)
    .where(sql`lower(${perpMarketSnapshots.ticker}) = lower(${ticker})`)
    .limit(1);

  return rows[0] ?? null;
}
