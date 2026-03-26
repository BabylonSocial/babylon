import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const trainingBatches = pgTable(
  'training_batches',
  {
    id: text('id').primaryKey(),
    batchId: text('batchId').notNull().unique(),
    scenarioId: text('scenarioId'),
    baseModel: text('baseModel').notNull(),
    modelVersion: text('modelVersion').notNull(),
    trajectoryIds: text('trajectoryIds').notNull(),
    rankingsJson: text('rankingsJson'),
    rewardsJson: text('rewardsJson').notNull(),
    trainingLoss: doublePrecision('trainingLoss'),
    policyImprovement: doublePrecision('policyImprovement'),
    status: text('status').notNull().default('pending'),
    error: text('error'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    startedAt: timestamp('startedAt', { mode: 'date' }),
    completedAt: timestamp('completedAt', { mode: 'date' }),
  },
  (table) => [
    index('training_batches_scenarioId_idx').on(table.scenarioId),
    index('training_batches_status_createdAt_idx').on(
      table.status,
      table.createdAt
    ),
  ]
);

export type TrainingBatch = typeof trainingBatches.$inferSelect;
export type NewTrainingBatch = typeof trainingBatches.$inferInsert;
