import {
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const trainedModels = pgTable(
  'trained_models',
  {
    id: text('id').primaryKey(),
    modelId: text('modelId').notNull().unique(),
    version: text('version').notNull(),
    baseModel: text('baseModel').notNull(),
    trainingBatch: text('trainingBatch'),
    status: text('status').notNull().default('training'),
    deployedAt: timestamp('deployedAt', { mode: 'date' }),
    archivedAt: timestamp('archivedAt', { mode: 'date' }),
    storagePath: text('storagePath').notNull(),
    benchmarkScore: doublePrecision('benchmarkScore'),
    accuracy: doublePrecision('accuracy'),
    avgReward: doublePrecision('avgReward'),
    evalMetrics: json('evalMetrics').$type<JsonValue>(),
    wandbRunId: text('wandbRunId'),
    wandbArtifactId: text('wandbArtifactId'),
    huggingFaceRepo: text('huggingFaceRepo'),
    agentsUsing: integer('agentsUsing').notNull().default(0),
    totalInferences: integer('totalInferences').notNull().default(0),
    lastBenchmarked: timestamp('lastBenchmarked', { mode: 'date' }),
    benchmarkCount: integer('benchmarkCount').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('trained_models_status_idx').on(table.status),
    index('trained_models_version_idx').on(table.version),
    index('trained_models_deployedAt_idx').on(table.deployedAt),
    index('trained_models_lastBenchmarked_idx').on(table.lastBenchmarked),
  ]
);

export type TrainedModel = typeof trainedModels.$inferSelect;
export type NewTrainedModel = typeof trainedModels.$inferInsert;
