import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import type { ArcStateType, PendingTransition } from './narrative-types';
import { questions } from './questions';

export const arcStates = pgTable(
  'ArcState',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    currentState: text('currentState').$type<ArcStateType>().notNull(),
    stateEnteredAt: timestamp('stateEnteredAt', { mode: 'date' }).notNull(),
    eventsGenerated: integer('eventsGenerated').notNull().default(0),
    lastEventAt: timestamp('lastEventAt', { mode: 'date' }),
    pendingTransitions: jsonb('pendingTransitions')
      .$type<PendingTransition[]>()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    index('ArcState_currentState_idx').on(t.currentState),
    unique('ArcState_questionId_unique').on(t.questionId),
  ]
);

export const arcStatesRelations = relations(arcStates, ({ one }) => ({
  question: one(questions, {
    fields: [arcStates.questionId],
    references: [questions.id],
  }),
}));

export type ArcState = typeof arcStates.$inferSelect;
export type NewArcState = typeof arcStates.$inferInsert;
