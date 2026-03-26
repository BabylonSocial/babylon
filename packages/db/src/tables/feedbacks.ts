import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { users } from './user';

export const feedbacks = pgTable(
  'Feedback',
  {
    id: text('id').primaryKey(),
    fromUserId: text('fromUserId'),
    fromAgentId: text('fromAgentId'),
    toUserId: text('toUserId'),
    toAgentId: text('toAgentId'),
    score: integer('score').notNull(),
    rating: integer('rating'),
    comment: text('comment'),
    category: text('category'),
    gameId: text('gameId'),
    tradeId: text('tradeId'),
    positionId: text('positionId'),
    interactionType: text('interactionType').notNull(),
    onChainTxHash: text('onChainTxHash'),
    agent0TokenId: integer('agent0TokenId'),
    metadata: json('metadata').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('Feedback_createdAt_idx').on(table.createdAt),
    index('Feedback_fromUserId_idx').on(table.fromUserId),
    index('Feedback_gameId_idx').on(table.gameId),
    index('Feedback_interactionType_idx').on(table.interactionType),
    index('Feedback_score_idx').on(table.score),
    index('Feedback_toAgentId_idx').on(table.toAgentId),
    index('Feedback_toUserId_idx').on(table.toUserId),
    index('Feedback_toUserId_interactionType_idx').on(
      table.toUserId,
      table.interactionType
    ),
  ]
);

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  fromUser: one(users, {
    fields: [feedbacks.fromUserId],
    references: [users.id],
    relationName: 'Feedback_fromUserIdToUser',
  }),
  toUser: one(users, {
    fields: [feedbacks.toUserId],
    references: [users.id],
    relationName: 'Feedback_toUserIdToUser',
  }),
}));

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
