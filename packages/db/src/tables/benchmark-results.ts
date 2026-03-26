import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const benchmarkResults = pgTable(
  'benchmark_results',
  {
    id: text('id').primaryKey(),
    modelId: text('modelId').notNull(),
    benchmarkId: text('benchmarkId').notNull(),
    benchmarkPath: text('benchmarkPath').notNull(),
    runAt: timestamp('runAt', { mode: 'date' }).notNull().defaultNow(),
    totalPnl: doublePrecision('totalPnl').notNull(),
    predictionAccuracy: doublePrecision('predictionAccuracy').notNull(),
    perpWinRate: doublePrecision('perpWinRate').notNull(),
    optimalityScore: doublePrecision('optimalityScore').notNull(),
    detailedMetrics: json('detailedMetrics').$type<JsonValue>().notNull(),
    baselinePnlDelta: doublePrecision('baselinePnlDelta'),
    baselineAccuracyDelta: doublePrecision('baselineAccuracyDelta'),
    improved: boolean('improved'),
    duration: integer('duration').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('benchmark_results_modelId_idx').on(table.modelId),
    index('benchmark_results_benchmarkId_idx').on(table.benchmarkId),
    index('benchmark_results_runAt_idx').on(table.runAt),
    index('benchmark_results_optimalityScore_idx').on(table.optimalityScore),
  ]
);

export type BenchmarkResult = typeof benchmarkResults.$inferSelect;
export type NewBenchmarkResult = typeof benchmarkResults.$inferInsert;
