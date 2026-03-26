import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { ScheduledEvent } from './narrative-types';
import { questions } from './questions';

export const questionArcPlans = pgTable(
  'QuestionArcPlan',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    uncertaintyPeakDay: integer('uncertaintyPeakDay').notNull(),
    clarityOnsetDay: integer('clarityOnsetDay').notNull(),
    verificationDay: integer('verificationDay').notNull(),
    insiderActorIds: jsonb('insiderActorIds').$type<string[]>().default([]),
    deceiverActorIds: jsonb('deceiverActorIds').$type<string[]>().default([]),
    phaseRatios: jsonb('phaseRatios')
      .$type<{ early: number; middle: number; late: number; climax: number }>()
      .notNull(),
    eventSchedule: jsonb('eventSchedule')
      .$type<ScheduledEvent[]>()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [index('QuestionArcPlan_questionId_idx').on(t.questionId)]
);

export const questionArcPlansRelations = relations(
  questionArcPlans,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionArcPlans.questionId],
      references: [questions.id],
    }),
  })
);

export type QuestionArcPlan = typeof questionArcPlans.$inferSelect;
export type NewQuestionArcPlan = typeof questionArcPlans.$inferInsert;
