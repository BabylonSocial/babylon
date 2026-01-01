'use client';

import type { GameOnboardingStep } from '@babylon/db';
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
 * Step display information
 */
export const STEP_INFO: Record<
  GameOnboardingStep,
  { title: string; description: string; points: number }
> = {
  welcome: {
    title: 'Welcome to Babylon!',
    description: 'Learn how to navigate the game and start trading.',
    points: 10,
  },
  explore_feed: {
    title: 'Explore the Feed',
    description: 'Scroll through the feed to see what NPCs are saying.',
    points: 20,
  },
  follow_npc: {
    title: 'Follow an NPC',
    description: 'Follow an NPC to see their posts in your feed.',
    points: 30,
  },
  view_markets: {
    title: 'View Markets',
    description: 'Check out the prediction and perpetual markets.',
    points: 20,
  },
  first_prediction: {
    title: 'Make Your First Prediction',
    description: 'Buy shares in a prediction market.',
    points: 50,
  },
  first_trade: {
    title: 'Make Your First Trade',
    description: 'Open a position in the perpetuals market.',
    points: 50,
  },
  complete: {
    title: 'Onboarding Complete!',
    description: 'You earned 180 points for completing the tutorial.',
    points: 0,
  },
};

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
      } catch {
        // Silently fail - onboarding is optional
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
    } catch {
      // Silently fail
    }
  }, []);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    try {
      await apiFetch('/api/onboarding/game-skip', { method: 'POST' });
      setStatus((prev) => (prev ? { ...prev, isComplete: true } : null));
      setShowTooltip(false);
    } catch {
      // Silently fail
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
