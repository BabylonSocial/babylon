import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Price modifier applied from narrative events
 * Note: Dates stored as ISO strings for JSONB compatibility
 */
export interface PriceModifier {
  eventId: string;
  effect: number; // Multiplier (1.05 = +5%)
  decayRate: number; // Per-hour decay rate
  appliedAt: string; // ISO date string
  expiresAt: string; // ISO date string
}

/**
 * Stock fundamentals for narrative-driven pricing
 */
export interface StockFundamentals {
  basePrice: number;
  sentiment: number; // -100 to +100
  activeModifiers: PriceModifier[];
}

/**
 * OrganizationState - Dynamic runtime state for organizations
 *
 * Static organization data is in TypeScript (StaticDataRegistry from @babylon/engine).
 * This table stores only fields that change during gameplay.
 */
export const organizationState = pgTable(
  'OrganizationState',
  {
    id: text('id').primaryKey(),
    currentPrice: doublePrecision('currentPrice'),

    // Fundamentals for narrative-driven pricing
    basePrice: doublePrecision('basePrice'),
    sentiment: integer('sentiment').default(0), // -100 to +100
    // Cast to PriceModifier[] when reading/writing in services
    activeModifiers: jsonb('activeModifiers').default(sql`'[]'::jsonb`),

    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('OrganizationState_currentPrice_idx').on(table.currentPrice),
    index('OrganizationState_sentiment_idx').on(table.sentiment),
  ]
);

// Type exports
export type OrganizationStateRow = typeof organizationState.$inferSelect;
export type NewOrganizationStateRow = typeof organizationState.$inferInsert;
