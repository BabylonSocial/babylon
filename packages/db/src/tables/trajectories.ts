import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const trajectories = pgTable(
  'trajectories',
  {
    id: text('id').primaryKey(),
    trajectoryId: text('trajectoryId').notNull().unique(),
    agentId: text('agentId').notNull(),
    archetype: varchar('archetype', { length: 50 }),
    startTime: timestamp('startTime', { mode: 'date' }).notNull(),
    endTime: timestamp('endTime', { mode: 'date' }).notNull(),
    durationMs: integer('durationMs').notNull(),
    windowId: varchar('windowId', { length: 50 }),
    windowHours: integer('windowHours').notNull().default(1),
    episodeId: varchar('episodeId', { length: 100 }),
    scenarioId: varchar('scenarioId', { length: 100 }),
    batchId: varchar('batchId', { length: 100 }),
    stepsJson: text('stepsJson').notNull(),
    rewardComponentsJson: text('rewardComponentsJson').notNull(),
    metricsJson: text('metricsJson').notNull(),
    metadataJson: text('metadataJson').notNull(),
    totalReward: doublePrecision('totalReward').notNull(),
    episodeLength: integer('episodeLength').notNull(),
    finalStatus: text('finalStatus').notNull(),
    finalBalance: doublePrecision('finalBalance'),
    finalPnL: doublePrecision('finalPnL'),
    tradesExecuted: integer('tradesExecuted'),
    postsCreated: integer('postsCreated'),
    aiJudgeReward: doublePrecision('aiJudgeReward'),
    aiJudgeReasoning: text('aiJudgeReasoning'),
    judgedAt: timestamp('judgedAt', { mode: 'date' }),
    isTrainingData: boolean('isTrainingData').notNull().default(true),
    isEvaluation: boolean('isEvaluation').notNull().default(false),
    usedInTraining: boolean('usedInTraining').notNull().default(false),
    trainedInBatch: text('trainedInBatch'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('trajectories_agentId_startTime_idx').on(
      table.agentId,
      table.startTime
    ),
    index('trajectories_aiJudgeReward_idx').on(table.aiJudgeReward),
    index('trajectories_isTrainingData_usedInTraining_idx').on(
      table.isTrainingData,
      table.usedInTraining
    ),
    index('trajectories_scenarioId_createdAt_idx').on(
      table.scenarioId,
      table.createdAt
    ),
    index('trajectories_trainedInBatch_idx').on(table.trainedInBatch),
    index('trajectories_windowId_agentId_idx').on(
      table.windowId,
      table.agentId
    ),
    index('trajectories_windowId_idx').on(table.windowId),
    index('trajectories_archetype_idx').on(table.archetype),
  ]
);

export type Trajectory = typeof trajectories.$inferSelect;
export type NewTrajectory = typeof trajectories.$inferInsert;
