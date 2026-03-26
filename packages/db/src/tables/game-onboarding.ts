import type { GameOnboardingStep } from '@babylon/shared';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './user';

export type { GameOnboardingStep } from '@babylon/shared';

/**
 * Game onboarding state stored in JSONB
 * Note: startedAt and completedAt are ISO date strings since JSONB serializes dates as strings
 */
export interface GameOnboardingState {
  completedSteps: GameOnboardingStep[];
  currentStep: GameOnboardingStep;
  startedAt: string | null;
  completedAt: string | null;
  rewards: Array<{ step: GameOnboardingStep; points: number }>;
}

/**
 * Default game onboarding state.
 * This constant is used to generate the SQL default for the state column,
 * ensuring TypeScript validates the default against the GameOnboardingState interface.
 */
export const DEFAULT_GAME_ONBOARDING_STATE: GameOnboardingState = {
  completedSteps: [],
  currentStep: 'welcome',
  startedAt: null,
  completedAt: null,
  rewards: [],
};

/** GameOnboarding - Tracks user's game tutorial progress */
export const gameOnboarding = pgTable(
  'GameOnboarding',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    currentStep: text('currentStep')
      .$type<GameOnboardingStep>()
      .notNull()
      .default('welcome'),

    state: jsonb('state')
      .$type<GameOnboardingState>()
      .default(DEFAULT_GAME_ONBOARDING_STATE),

    isComplete: boolean('isComplete').notNull().default(false),
    skippedAt: timestamp('skippedAt', { mode: 'date' }),

    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('GameOnboarding_isComplete_idx').on(table.isComplete),
    index('GameOnboarding_currentStep_idx').on(table.currentStep),
  ]
);

export type GameOnboardingRow = typeof gameOnboarding.$inferSelect;
export type NewGameOnboardingRow = typeof gameOnboarding.$inferInsert;

export const gameOnboardingRelations = relations(gameOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [gameOnboarding.userId],
    references: [users.id],
  }),
}));
