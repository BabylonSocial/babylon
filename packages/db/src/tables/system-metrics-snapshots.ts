import {
  decimal,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const systemMetricsSnapshots = pgTable(
  'SystemMetricsSnapshot',
  {
    id: text('id').primaryKey(),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
    environment: text('environment').notNull(),
    totalUsers: integer('totalUsers').notNull(),
    activeUsers: integer('activeUsers').notNull(),
    newSignups: integer('newSignups').notNull(),
    tradingVolume: decimal('tradingVolume', {
      precision: 18,
      scale: 2,
    }).notNull(),
    activeMarkets: integer('activeMarkets').notNull(),
    openPositions: integer('openPositions').notNull(),
    perpVolume: decimal('perpVolume', { precision: 18, scale: 2 })
      .notNull()
      .default('0'),
    activePerpPositions: integer('activePerpPositions').notNull().default(0),
    postsCreated: integer('postsCreated').notNull().default(0),
    commentsCreated: integer('commentsCreated').notNull().default(0),
    reactionsCreated: integer('reactionsCreated').notNull().default(0),
    totalVirtualBalance: decimal('totalVirtualBalance', {
      precision: 20,
      scale: 2,
    }).notNull(),
    feesCollectedHourly: decimal('feesCollectedHourly', {
      precision: 18,
      scale: 2,
    }).notNull(),
    apiUptime: doublePrecision('apiUptime').notNull(),
    avgResponseTime: doublePrecision('avgResponseTime').notNull(),
    errorRate: doublePrecision('errorRate').notNull(),
    cronJobsHealthy: integer('cronJobsHealthy').notNull().default(0),
    cronJobsUnhealthy: integer('cronJobsUnhealthy').notNull().default(0),
    extendedMetrics: json('extendedMetrics').$type<JsonValue>(),
    snapshotDurationMs: integer('snapshotDurationMs').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('SystemMetricsSnapshot_timestamp_environment_unique_idx').on(
      table.timestamp,
      table.environment
    ),
    index('SystemMetricsSnapshot_environment_timestamp_idx').on(
      table.environment,
      table.timestamp
    ),
    index('SystemMetricsSnapshot_createdAt_idx').on(table.createdAt),
  ]
);

export type SystemMetricsSnapshot = typeof systemMetricsSnapshots.$inferSelect;
export type NewSystemMetricsSnapshot =
  typeof systemMetricsSnapshots.$inferInsert;
