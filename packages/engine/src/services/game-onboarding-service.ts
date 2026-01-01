/**
 * Game Onboarding Service
 *
 * Manages the game tutorial flow for new users.
 * Tracks progress through onboarding steps and awards points.
 */

import {
  db,
  eq,
  type GameOnboardingRow,
  type GameOnboardingState,
  type GameOnboardingStep,
  gameOnboarding,
} from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';

/**
 * Points awarded for each onboarding step
 */
const STEP_POINTS: Record<GameOnboardingStep, number> = {
  welcome: 10,
  explore_feed: 20,
  follow_npc: 30,
  view_markets: 20,
  first_prediction: 50,
  first_trade: 50,
  complete: 0, // No points for completion marker
};

/**
 * Order of onboarding steps
 */
const STEP_ORDER: GameOnboardingStep[] = [
  'welcome',
  'explore_feed',
  'follow_npc',
  'view_markets',
  'first_prediction',
  'first_trade',
  'complete',
];

/**
 * Get the next step after completing a step
 */
function getNextStep(currentStep: GameOnboardingStep): GameOnboardingStep {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return 'complete';
  }
  return STEP_ORDER[currentIndex + 1]!;
}

/**
 * Create or get onboarding record for a user
 */
export async function getOrCreateOnboarding(
  userId: string
): Promise<GameOnboardingRow> {
  // Check if exists
  const [existing] = await db
    .select()
    .from(gameOnboarding)
    .where(eq(gameOnboarding.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create new onboarding record
  const id = await generateSnowflakeId();
  const now = new Date();
  const initialState: GameOnboardingState = {
    completedSteps: [],
    currentStep: 'welcome',
    startedAt: now,
    completedAt: null,
    rewards: [],
  };

  const [created] = await db
    .insert(gameOnboarding)
    .values({
      id,
      userId,
      currentStep: 'welcome',
      state: initialState,
      isComplete: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  logger.info(
    `Created game onboarding for user ${userId}`,
    { userId, onboardingId: id },
    'GameOnboarding'
  );

  return created!;
}

/**
 * Complete an onboarding step and award points
 */
export async function completeOnboardingStep(
  userId: string,
  step: GameOnboardingStep
): Promise<{
  success: boolean;
  pointsAwarded: number;
  nextStep: GameOnboardingStep;
  isComplete: boolean;
}> {
  const onboarding = await getOrCreateOnboarding(userId);
  const state = onboarding.state as GameOnboardingState;

  // Check if already completed
  if (state.completedSteps.includes(step)) {
    return {
      success: false,
      pointsAwarded: 0,
      nextStep: state.currentStep,
      isComplete: onboarding.isComplete,
    };
  }

  // Award points
  const points = STEP_POINTS[step];

  // Update state
  state.completedSteps.push(step);
  state.currentStep = getNextStep(step);
  state.rewards.push({ step, points });

  const isComplete = state.currentStep === 'complete';
  if (isComplete) {
    state.completedAt = new Date();
  }

  // Update database
  await db
    .update(gameOnboarding)
    .set({
      currentStep: state.currentStep,
      state,
      isComplete,
      updatedAt: new Date(),
    })
    .where(eq(gameOnboarding.userId, userId));

  logger.info(
    `User ${userId} completed onboarding step ${step}`,
    { userId, step, points, nextStep: state.currentStep, isComplete },
    'GameOnboarding'
  );

  // TODO: Award points to user balance (integrate with points service)
  // await pointsService.awardPoints(userId, points, `onboarding_${step}`);

  return {
    success: true,
    pointsAwarded: points,
    nextStep: state.currentStep,
    isComplete,
  };
}

/**
 * Get onboarding status for a user
 */
export async function getOnboardingStatus(userId: string): Promise<{
  currentStep: GameOnboardingStep;
  completedSteps: GameOnboardingStep[];
  totalPointsEarned: number;
  isComplete: boolean;
} | null> {
  const onboarding = await getOrCreateOnboarding(userId);
  const state = onboarding.state as GameOnboardingState;

  const totalPointsEarned = state.rewards.reduce((sum, r) => sum + r.points, 0);

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    totalPointsEarned,
    isComplete: onboarding.isComplete,
  };
}

/**
 * Skip onboarding for a user
 */
export async function skipOnboarding(userId: string): Promise<void> {
  const onboarding = await getOrCreateOnboarding(userId);

  await db
    .update(gameOnboarding)
    .set({
      isComplete: true,
      skippedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gameOnboarding.userId, userId));

  logger.info(
    `User ${userId} skipped onboarding`,
    { userId, onboardingId: onboarding.id },
    'GameOnboarding'
  );
}

/**
 * Check if a user needs onboarding
 */
export async function needsOnboarding(userId: string): Promise<boolean> {
  const [onboarding] = await db
    .select({
      isComplete: gameOnboarding.isComplete,
      skippedAt: gameOnboarding.skippedAt,
    })
    .from(gameOnboarding)
    .where(eq(gameOnboarding.userId, userId))
    .limit(1);

  if (!onboarding) {
    return true; // No record = needs onboarding
  }

  return !onboarding.isComplete && !onboarding.skippedAt;
}

/**
 * Game Onboarding Service class
 */
export class GameOnboardingService {
  async getOrCreate(userId: string): Promise<GameOnboardingRow> {
    return getOrCreateOnboarding(userId);
  }

  async completeStep(
    userId: string,
    step: GameOnboardingStep
  ): Promise<{
    success: boolean;
    pointsAwarded: number;
    nextStep: GameOnboardingStep;
    isComplete: boolean;
  }> {
    return completeOnboardingStep(userId, step);
  }

  async getStatus(userId: string) {
    return getOnboardingStatus(userId);
  }

  async skip(userId: string): Promise<void> {
    return skipOnboarding(userId);
  }

  async needsOnboarding(userId: string): Promise<boolean> {
    return needsOnboarding(userId);
  }

  getStepOrder(): GameOnboardingStep[] {
    return [...STEP_ORDER];
  }

  getStepPoints(): Record<GameOnboardingStep, number> {
    return { ...STEP_POINTS };
  }
}

// Singleton instance
export const gameOnboardingService = new GameOnboardingService();
