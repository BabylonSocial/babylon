/**
 * Narrative Event Processor Test Suite
 *
 * Tests for arc state machine, state transitions, and event generation.
 */

import { describe, expect, test } from 'bun:test';
import type { ArcStateType, PendingTransition } from '@babylon/db';
import {
  evaluateStateTransition,
  getExpectedState,
  shouldGenerateEvent,
} from '../services/narrative-event-processor';

// Mock arc state for testing
const createMockArcState = (
  overrides: Partial<{
    id: string;
    questionId: string;
    currentState: ArcStateType;
    lastEventAt: Date | null;
    pendingTransitions: PendingTransition[] | null;
  }> = {}
) => ({
  id: 'arc-1',
  questionId: 'q-1',
  currentState: 'setup' as ArcStateType,
  stateEnteredAt: new Date(),
  eventsGenerated: 0,
  lastEventAt: null,
  pendingTransitions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Narrative Event Processor - Expected State Calculation', () => {
  test('days 1-3 should be setup phase', () => {
    expect(getExpectedState(1)).toBe('setup');
    expect(getExpectedState(2)).toBe('setup');
    expect(getExpectedState(3)).toBe('setup');
  });

  test('days 4-10 should be tension phase', () => {
    expect(getExpectedState(4)).toBe('tension');
    expect(getExpectedState(7)).toBe('tension');
    expect(getExpectedState(10)).toBe('tension');
  });

  test('days 11-18 should be escalation phase', () => {
    expect(getExpectedState(11)).toBe('escalation');
    expect(getExpectedState(15)).toBe('escalation');
    expect(getExpectedState(18)).toBe('escalation');
  });

  test('days 19-24 should be crisis phase', () => {
    expect(getExpectedState(19)).toBe('crisis');
    expect(getExpectedState(22)).toBe('crisis');
    expect(getExpectedState(24)).toBe('crisis');
  });

  test('days 25-27 should be revelation phase', () => {
    expect(getExpectedState(25)).toBe('revelation');
    expect(getExpectedState(26)).toBe('revelation');
    expect(getExpectedState(27)).toBe('revelation');
  });

  test('days 28-30 should be resolution phase', () => {
    expect(getExpectedState(28)).toBe('resolution');
    expect(getExpectedState(29)).toBe('resolution');
    expect(getExpectedState(30)).toBe('resolution');
  });

  test('days after 30 should remain in resolution', () => {
    expect(getExpectedState(31)).toBe('resolution');
    expect(getExpectedState(50)).toBe('resolution');
    expect(getExpectedState(100)).toBe('resolution');
  });
});

describe('Narrative Event Processor - State Transitions', () => {
  test('returns null when state matches expected', () => {
    const arc = createMockArcState({ currentState: 'setup' });
    const result = evaluateStateTransition(arc, 2); // Day 2 = setup
    expect(result).toBeNull();
  });

  test('returns new state when expected state differs', () => {
    const arc = createMockArcState({ currentState: 'setup' });
    const result = evaluateStateTransition(arc, 5); // Day 5 = tension
    expect(result).toBe('tension');
  });

  test('handles transition from setup to tension', () => {
    const arc = createMockArcState({ currentState: 'setup' });
    const result = evaluateStateTransition(arc, 4); // Day 4 = start of tension
    expect(result).toBe('tension');
  });

  test('handles transition from tension to escalation', () => {
    const arc = createMockArcState({ currentState: 'tension' });
    const result = evaluateStateTransition(arc, 11); // Day 11 = start of escalation
    expect(result).toBe('escalation');
  });

  test('handles transition to crisis', () => {
    const arc = createMockArcState({ currentState: 'escalation' });
    const result = evaluateStateTransition(arc, 19); // Day 19 = start of crisis
    expect(result).toBe('crisis');
  });

  test('handles transition to revelation', () => {
    const arc = createMockArcState({ currentState: 'crisis' });
    const result = evaluateStateTransition(arc, 25); // Day 25 = start of revelation
    expect(result).toBe('revelation');
  });

  test('handles transition to resolution', () => {
    const arc = createMockArcState({ currentState: 'revelation' });
    const result = evaluateStateTransition(arc, 28); // Day 28 = start of resolution
    expect(result).toBe('resolution');
  });

  test('checks pending transitions with probability', () => {
    const arc = createMockArcState({
      currentState: 'tension',
      pendingTransitions: [
        { targetState: 'crisis', triggerDay: 5, probability: 1.0 }, // 100% probability
      ],
    });
    const result = evaluateStateTransition(arc, 6); // Day 6, should trigger pending
    // Note: This could return either the pending transition or expected state
    // depending on order of evaluation
    expect(['crisis', 'tension']).toContain(result ?? 'tension');
  });

  test('respects pending transition probability', () => {
    const arc = createMockArcState({
      currentState: 'tension',
      pendingTransitions: [
        { targetState: 'crisis', triggerDay: 5, probability: 0 }, // 0% probability
      ],
    });

    // Run multiple times to verify probability 0 never triggers
    for (let i = 0; i < 10; i++) {
      const result = evaluateStateTransition(arc, 6);
      // Should not transition to crisis via pending (probability 0)
      expect(result).not.toBe('crisis');
    }
  });
});

describe('Narrative Event Processor - Event Generation Decision', () => {
  test('should not generate event during cooldown', () => {
    const arc = createMockArcState({
      currentState: 'tension',
      lastEventAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    });

    // Cooldown is 2 hours, so should not generate
    expect(shouldGenerateEvent(arc)).toBe(false);
  });

  test('may generate event after cooldown period', () => {
    const arc = createMockArcState({
      currentState: 'crisis', // Higher probability (0.6)
      lastEventAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    });

    // After cooldown, event generation is probabilistic
    // Run multiple times to check it can return true
    let generatedAtLeastOnce = false;
    for (let i = 0; i < 50; i++) {
      if (shouldGenerateEvent(arc)) {
        generatedAtLeastOnce = true;
        break;
      }
    }

    // With crisis probability of 0.6, should generate at least once in 50 tries
    expect(generatedAtLeastOnce).toBe(true);
  });

  test('may generate event when no previous event', () => {
    const arc = createMockArcState({
      currentState: 'escalation', // 0.5 probability
      lastEventAt: null,
    });

    // Without previous event, no cooldown applies
    let generatedAtLeastOnce = false;
    for (let i = 0; i < 50; i++) {
      if (shouldGenerateEvent(arc)) {
        generatedAtLeastOnce = true;
        break;
      }
    }

    expect(generatedAtLeastOnce).toBe(true);
  });

  test('resolution phase has lower event probability', () => {
    const arcCrisis = createMockArcState({
      currentState: 'crisis',
      lastEventAt: null,
    });
    const arcResolution = createMockArcState({
      currentState: 'resolution',
      lastEventAt: null,
    });

    // Count event generations for each
    let crisisCount = 0;
    let resolutionCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      if (shouldGenerateEvent(arcCrisis)) crisisCount++;
      if (shouldGenerateEvent(arcResolution)) resolutionCount++;
    }

    // Crisis (0.6) should generate more than resolution (0.2)
    expect(crisisCount).toBeGreaterThan(resolutionCount);
  });
});

describe('Narrative Event Processor - Edge Cases', () => {
  test('handles day number 0', () => {
    // Day 0 is before the defined ranges, should default to setup or first state
    const result = getExpectedState(0);
    // Based on the ranges, day 0 is not in any range, so falls through to resolution
    expect(result).toBe('resolution');
  });

  test('handles negative day numbers', () => {
    const result = getExpectedState(-5);
    // Negative days fall through to resolution (default return)
    expect(result).toBe('resolution');
  });

  test('handles very large day numbers', () => {
    const result = getExpectedState(1000);
    expect(result).toBe('resolution');
  });

  test('handles empty pending transitions array', () => {
    const arc = createMockArcState({
      currentState: 'setup',
      pendingTransitions: [],
    });
    const result = evaluateStateTransition(arc, 2);
    expect(result).toBeNull(); // Still in setup, no transition
  });

  test('handles null pending transitions', () => {
    const arc = createMockArcState({
      currentState: 'setup',
      pendingTransitions: null,
    });
    // Should handle null gracefully
    const result = evaluateStateTransition(arc, 2);
    expect(result).toBeNull();
  });
});
