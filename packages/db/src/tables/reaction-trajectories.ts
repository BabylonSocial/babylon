import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const reactionTrajectories = pgTable(
  'reaction_trajectories',
  {
    id: text('id').primaryKey(),
    eventId: text('eventId').notNull(),
    eventType: text('eventType').notNull(),
    eventSeverity: integer('eventSeverity').notNull(),
    npcId: text('npcId').notNull(),
    npcRole: text('npcRole').notNull(),
    arcPhase: text('arcPhase'),
    orgContextJson: text('orgContextJson'),
    actionType: text('actionType').notNull(),
    actionAngle: text('actionAngle'),
    actionSentiment: text('actionSentiment'),
    postId: text('postId'),
    tradeDetailsJson: text('tradeDetailsJson'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    outcomeRecordedAt: timestamp('outcomeRecordedAt', { mode: 'date' }),
    outcomeLikes: integer('outcomeLikes'),
    outcomeComments: integer('outcomeComments'),
    outcomeReposts: integer('outcomeReposts'),
    outcomePriceMovement: decimal('outcomePriceMovement', {
      precision: 10,
      scale: 4,
    }),
    outcomeProfitLoss: decimal('outcomeProfitLoss', {
      precision: 18,
      scale: 2,
    }),
    outcomeOtherNpcs: integer('outcomeOtherNpcs'),
    outcomeHumans: integer('outcomeHumans'),
    reward: decimal('reward', { precision: 8, scale: 4 }),
    usedInTraining: boolean('usedInTraining').default(false),
  },
  (table) => [
    index('reaction_trajectories_eventId_idx').on(table.eventId),
    index('reaction_trajectories_npcId_idx').on(table.npcId),
    index('reaction_trajectories_createdAt_idx').on(table.createdAt),
    index('reaction_trajectories_pendingOutcome_idx').on(
      table.createdAt,
      table.outcomeRecordedAt
    ),
  ]
);

export type ReactionTrajectory = typeof reactionTrajectories.$inferSelect;
export type NewReactionTrajectory = typeof reactionTrajectories.$inferInsert;
