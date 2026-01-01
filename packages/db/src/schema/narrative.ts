import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { questions } from './markets';

/**
 * Arc state types for narrative state machine
 */
export type ArcStateType =
  | 'setup' // Days 1-3: Introduce question
  | 'tension' // Days 4-10: Early signals, misdirection
  | 'escalation' // Days 11-18: Conflicting signals
  | 'crisis' // Days 19-24: Peak uncertainty
  | 'revelation' // Days 25-27: Truth emerges
  | 'resolution'; // Days 28-30: Definitive answer

/**
 * Pending state transition
 */
export interface PendingTransition {
  targetState: ArcStateType;
  triggerDay: number;
  triggerEventType?: string;
  probability?: number;
}

/**
 * Market impact from a structured event
 */
export interface MarketImpact {
  stockTicker: string;
  direction: 'up' | 'down';
  magnitude: 'minor' | 'moderate' | 'major';
  duration: 'instant' | 'hours' | 'days';
}

/**
 * Structured event types for narrative
 */
export type StructuredEventType =
  | 'rumor'
  | 'leak'
  | 'denial'
  | 'confirmation'
  | 'reversal'
  | 'proof';

/**
 * Structured event data stored in events table
 */
export interface StructuredEventData {
  arcId: string;
  type: StructuredEventType;
  severity: 1 | 2 | 3 | 4 | 5;
  affectedActors: string[];
  affectedStocks: string[];
  affectedQuestions: string[];
  signalDirection: 'YES' | 'NO' | 'NEUTRAL';
  signalStrength: number;
  marketImpacts: MarketImpact[];
}

/**
 * QuestionArcPlan - Narrative arc configuration for a prediction question.
 * Stores timing milestones and actor assignments for signal generation.
 */
export const questionArcPlans = pgTable(
  'QuestionArcPlan',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),

    // Narrative timing (day numbers)
    uncertaintyPeakDay: integer('uncertaintyPeakDay').notNull(),
    clarityOnsetDay: integer('clarityOnsetDay').notNull(),
    verificationDay: integer('verificationDay').notNull(),

    // Actor assignments
    insiderActorIds: jsonb('insiderActorIds').$type<string[]>().default([]),
    deceiverActorIds: jsonb('deceiverActorIds').$type<string[]>().default([]),

    // Phase signal ratios (correctSignals / totalSignals)
    phaseRatios: jsonb('phaseRatios')
      .$type<{ early: number; middle: number; late: number; climax: number }>()
      .notNull(),

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

/**
 * ArcState - Tracks the current state of a narrative arc state machine.
 * Each question has an associated arc state that transitions through phases.
 */
export const arcStates = pgTable(
  'ArcState',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),

    // State machine
    currentState: text('currentState').$type<ArcStateType>().notNull(),
    stateEnteredAt: timestamp('stateEnteredAt', { mode: 'date' }).notNull(),

    // Event tracking
    eventsGenerated: integer('eventsGenerated').notNull().default(0),
    lastEventAt: timestamp('lastEventAt', { mode: 'date' }),

    // Pending transitions - cast to PendingTransition[] when reading/writing
    pendingTransitions: jsonb('pendingTransitions').default(sql`'[]'::jsonb`),

    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (t) => [
    index('ArcState_questionId_idx').on(t.questionId),
    index('ArcState_currentState_idx').on(t.currentState),
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
