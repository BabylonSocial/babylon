import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const rewardJudgments = pgTable(
  'reward_judgments',
  {
    id: text('id').primaryKey(),
    trajectoryId: text('trajectoryId').notNull().unique(),
    judgeModel: text('judgeModel').notNull(),
    judgeVersion: text('judgeVersion').notNull(),
    overallScore: doublePrecision('overallScore').notNull(),
    componentScoresJson: text('componentScoresJson'),
    rank: integer('rank'),
    normalizedScore: doublePrecision('normalizedScore'),
    groupId: text('groupId'),
    reasoning: text('reasoning').notNull(),
    strengthsJson: text('strengthsJson'),
    weaknessesJson: text('weaknessesJson'),
    criteriaJson: text('criteriaJson').notNull(),
    judgedAt: timestamp('judgedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('reward_judgments_overallScore_idx').on(table.overallScore),
    index('reward_judgments_groupId_rank_idx').on(table.groupId, table.rank),
  ]
);

export type RewardJudgment = typeof rewardJudgments.$inferSelect;
export type NewRewardJudgment = typeof rewardJudgments.$inferInsert;
