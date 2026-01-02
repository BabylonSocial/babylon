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
import {
  generateSnowflakeId,
  getNextOnboardingStep,
  logger,
  ONBOARDING_STEP_ORDER,
  ONBOARDING_STEP_POINTS,
} from '@babylon/shared';
import { EarnedPointsService } from './earned-points-service';

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
  const points = ONBOARDING_STEP_POINTS[step];

  // Update state
  state.completedSteps.push(step);
  state.currentStep = getNextOnboardingStep(step);
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

  // Award bonus points to user balance
  if (points > 0) {
    try {
      await EarnedPointsService.awardBonusPoints(
        userId,
        points,
        `onboarding_${step}`
      );
    } catch (error) {
      // Log but don't fail - onboarding completion is more important
      logger.warn(
        `Failed to award bonus points for onboarding step`,
        {
          userId,
          step,
          points,
          error: error instanceof Error ? error.message : String(error),
        },
        'GameOnboarding'
      );
    }
  }

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
    return [...ONBOARDING_STEP_ORDER];
  }

  getStepPoints(): Record<GameOnboardingStep, number> {
    return { ...ONBOARDING_STEP_POINTS };
  }
}

// Singleton instance
export const gameOnboardingService = new GameOnboardingService();
