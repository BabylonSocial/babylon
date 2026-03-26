import { relations } from 'drizzle-orm';
import { rewardJudgments } from './reward-judgments';
import { trajectories } from './trajectories';
import { users } from './user';

export const trajectoriesRelations = relations(trajectories, ({ one }) => ({
  agent: one(users, {
    fields: [trajectories.agentId],
    references: [users.id],
  }),
  rewardJudgment: one(rewardJudgments, {
    fields: [trajectories.trajectoryId],
    references: [rewardJudgments.trajectoryId],
  }),
}));

export const rewardJudgmentsRelations = relations(
  rewardJudgments,
  ({ one }) => ({
    trajectory: one(trajectories, {
      fields: [rewardJudgments.trajectoryId],
      references: [trajectories.trajectoryId],
    }),
  })
);
