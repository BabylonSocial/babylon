'use client';

import type { GameOnboardingStep } from '@babylon/db';
import { ONBOARDING_STEP_INFO } from '@babylon/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from '@/utils/api-fetch';

/**
 * Onboarding status from API
 */
interface OnboardingStatus {
  currentStep: GameOnboardingStep;
  completedSteps: GameOnboardingStep[];
  totalPointsEarned: number;
  isComplete: boolean;
}

/**
 * Game onboarding context value
 */
interface GameOnboardingContextValue {
  status: OnboardingStatus | null;
  isLoading: boolean;
  completeStep: (step: GameOnboardingStep) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  needsOnboarding: boolean;
  showTooltip: boolean;
  setShowTooltip: (show: boolean) => void;
  currentTooltipStep: GameOnboardingStep | null;
}

const GameOnboardingContext = createContext<GameOnboardingContextValue | null>(
  null
);

/**
 * Step display information - imported from shared package
 */
export const STEP_INFO = ONBOARDING_STEP_INFO;

/**
 * Game Onboarding Provider
 *
 * Provides context for the game tutorial system.
 */
export function GameOnboardingProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch onboarding status on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await apiFetch('/api/onboarding/game-status');
        if (response.ok) {
          const data = (await response.json()) as OnboardingStatus;
          setStatus(data);
          // Show tooltip if not complete
          if (!data.isComplete) {
            setShowTooltip(true);
          }
        }
      } catch (error) {
        // Onboarding is optional, but log errors for debugging
        console.error('Failed to fetch onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, [userId]);

  // Complete a step
  const completeStep = useCallback(async (step: GameOnboardingStep) => {
    try {
      const response = await apiFetch('/api/onboarding/game-complete-step', {
        method: 'POST',
        body: JSON.stringify({ step }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          success: boolean;
          pointsAwarded: number;
          nextStep: GameOnboardingStep;
          isComplete: boolean;
        };

        if (data.success) {
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  completedSteps: [...prev.completedSteps, step],
                  currentStep: data.nextStep,
                  totalPointsEarned:
                    prev.totalPointsEarned + data.pointsAwarded,
                  isComplete: data.isComplete,
                }
              : null
          );
        }
      }
    } catch (error) {
      // Onboarding is optional, but log errors for debugging
      console.error('Failed to complete onboarding step:', error);
    }
  }, []);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    try {
      await apiFetch('/api/onboarding/game-skip', { method: 'POST' });
      setStatus((prev) => (prev ? { ...prev, isComplete: true } : null));
      setShowTooltip(false);
    } catch (error) {
      // Onboarding is optional, but log errors for debugging
      console.error('Failed to skip onboarding:', error);
    }
  }, []);

  const needsOnboarding =
    !!userId && !isLoading && !!status && !status.isComplete;
  const currentTooltipStep = needsOnboarding
    ? (status?.currentStep ?? null)
    : null;

  return (
    <GameOnboardingContext.Provider
      value={{
        status,
        isLoading,
        completeStep,
        skipOnboarding,
        needsOnboarding,
        showTooltip,
        setShowTooltip,
        currentTooltipStep,
      }}
    >
      {children}
    </GameOnboardingContext.Provider>
  );
}

/**
 * Hook to access game onboarding context
 */
export function useGameOnboarding(): GameOnboardingContextValue {
  const context = useContext(GameOnboardingContext);
  if (!context) {
    throw new Error(
      'useGameOnboarding must be used within a GameOnboardingProvider'
    );
  }
  return context;
}
