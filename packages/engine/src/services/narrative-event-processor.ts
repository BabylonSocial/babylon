/**
 * Narrative Event Processor
 *
 * Processes arc state transitions and generates structured events
 * that drive both narrative and market movements.
 */

import {
  type ArcState,
  type ArcStateType,
  arcStates,
  db,
  eq,
  type MarketImpact,
  type PendingTransition,
  questionArcPlans,
  type StructuredEventData,
  sql,
} from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';

/**
 * Day ranges for each arc state
 */
const STATE_DAY_RANGES: Record<ArcStateType, [number, number]> = {
  setup: [1, 3],
  tension: [4, 10],
  escalation: [11, 18],
  crisis: [19, 24],
  revelation: [25, 27],
  resolution: [28, 30],
};

/**
 * Get the expected arc state for a given day number
 */
export function getExpectedState(dayNumber: number): ArcStateType {
  for (const [state, [start, end]] of Object.entries(STATE_DAY_RANGES)) {
    if (dayNumber >= start && dayNumber <= end) {
      return state as ArcStateType;
    }
  }
  // After day 30, remain in resolution
  return 'resolution';
}

/**
 * Check if a state transition should occur
 */
export function evaluateStateTransition(
  arc: ArcState,
  dayNumber: number
): ArcStateType | null {
  const expectedState = getExpectedState(dayNumber);

  if (expectedState !== arc.currentState) {
    return expectedState;
  }

  // Check pending transitions
  // Cast from unknown since JSONB columns don't have type info at runtime
  const pending = (arc.pendingTransitions as PendingTransition[] | null) ?? [];
  for (const transition of pending) {
    if (dayNumber >= transition.triggerDay) {
      // Probability check
      if (
        transition.probability === undefined ||
        Math.random() < transition.probability
      ) {
        return transition.targetState;
      }
    }
  }

  return null;
}

/**
 * Transition an arc to a new state
 */
export async function transitionArcState(
  arcId: string,
  newState: ArcStateType
): Promise<void> {
  const now = new Date();

  await db
    .update(arcStates)
    .set({
      currentState: newState,
      stateEnteredAt: now,
      updatedAt: now,
      // Clear pending transitions that triggered
      pendingTransitions: [],
    })
    .where(eq(arcStates.id, arcId));

  logger.info(
    `Arc ${arcId} transitioned to ${newState}`,
    { arcId, newState },
    'NarrativeEventProcessor'
  );
}

/**
 * Check if an event should be generated for this arc
 */
export function shouldGenerateEvent(
  arc: ArcState,
  _dayNumber: number
): boolean {
  // Event generation probability based on state
  const probabilities: Record<ArcStateType, number> = {
    setup: 0.3, // 30% chance per tick
    tension: 0.4,
    escalation: 0.5,
    crisis: 0.6,
    revelation: 0.7,
    resolution: 0.2,
  };

  const prob = probabilities[arc.currentState] ?? 0.3;

  // Reduce probability if we recently generated an event
  if (arc.lastEventAt) {
    const hoursSinceLastEvent =
      (Date.now() - arc.lastEventAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastEvent < 2) {
      return false; // Cooldown
    }
  }

  return Math.random() < prob;
}

/**
 * Generate a structured event for an arc based on current state
 */
export async function generateStructuredEvent(
  arc: ArcState,
  arcPlan: { insiderActorIds: string[]; deceiverActorIds: string[] } | null
): Promise<StructuredEventData> {
  // Event types appropriate for each state
  const stateEventTypes: Record<ArcStateType, StructuredEventData['type'][]> = {
    setup: ['rumor'],
    tension: ['rumor', 'leak', 'denial'],
    escalation: ['leak', 'denial', 'confirmation'],
    crisis: ['denial', 'confirmation', 'reversal'],
    revelation: ['confirmation', 'proof'],
    resolution: ['proof'],
  };

  const possibleTypes = stateEventTypes[arc.currentState] ?? ['rumor'];
  const eventType =
    possibleTypes[Math.floor(Math.random() * possibleTypes.length)]!;

  // Severity increases as arc progresses
  const severityByState: Record<ArcStateType, number> = {
    setup: 1,
    tension: 2,
    escalation: 3,
    crisis: 4,
    revelation: 4,
    resolution: 5,
  };
  const baseSeverity = severityByState[arc.currentState] ?? 2;
  const severity = Math.min(5, baseSeverity + Math.floor(Math.random() * 2)) as
    | 1
    | 2
    | 3
    | 4
    | 5;

  // Signal direction based on event type and state
  let signalDirection: 'YES' | 'NO' | 'NEUTRAL';
  if (eventType === 'denial' || eventType === 'reversal') {
    signalDirection = 'NO';
  } else if (eventType === 'confirmation' || eventType === 'proof') {
    signalDirection = 'YES';
  } else {
    signalDirection = Math.random() > 0.5 ? 'YES' : 'NO';
  }

  // Signal strength increases with severity
  const signalStrength = 0.3 + severity * 0.14;

  // Affected actors from arc plan
  const affectedActors = [
    ...(arcPlan?.insiderActorIds ?? []),
    ...(arcPlan?.deceiverActorIds ?? []),
  ].slice(0, 5);

  // Get affected stocks from question context
  const affectedStocks = await getAffectedStocksForQuestion(arc.questionId);

  // Generate market impacts based on event type and severity
  const marketImpacts: MarketImpact[] = affectedStocks.map((ticker) => ({
    stockTicker: ticker,
    direction:
      signalDirection === 'YES'
        ? 'up'
        : signalDirection === 'NO'
          ? 'down'
          : Math.random() > 0.5
            ? 'up'
            : 'down',
    magnitude: severity <= 2 ? 'minor' : severity <= 4 ? 'moderate' : 'major',
    duration:
      eventType === 'rumor' || eventType === 'denial'
        ? 'hours'
        : eventType === 'proof'
          ? 'days'
          : 'hours',
  }));

  const event: StructuredEventData = {
    arcId: arc.id,
    type: eventType,
    severity,
    affectedActors,
    affectedStocks,
    affectedQuestions: [arc.questionId],
    signalDirection,
    signalStrength,
    marketImpacts,
  };

  return event;
}

/**
 * Get affected stock tickers for a question.
 * Looks up organizations mentioned in the question or related to it.
 */
async function getAffectedStocksForQuestion(
  _questionId: string
): Promise<string[]> {
  try {
    // Get organizations that might be affected by this question
    // For now, get a sample of active stocks - in production this would
    // be based on question metadata or NLP parsing of the question text
    const { organizations } = await import('@babylon/db');

    const orgs = await db
      .select({ ticker: organizations.ticker })
      .from(organizations)
      .where(sql`${organizations.ticker} IS NOT NULL`)
      .limit(2);

    return orgs.map((o) => o.ticker).filter((t): t is string => t !== null);
  } catch {
    return [];
  }
}

/**
 * Process a single arc tick - check for transitions and event generation
 */
export async function processArcTick(
  arcId: string,
  dayNumber: number
): Promise<{
  transitioned: boolean;
  eventGenerated: boolean;
  newState?: ArcStateType;
}> {
  // Get arc state
  const [arc] = await db
    .select()
    .from(arcStates)
    .where(eq(arcStates.id, arcId))
    .limit(1);

  if (!arc) {
    logger.warn(`Arc ${arcId} not found`, { arcId }, 'NarrativeEventProcessor');
    return { transitioned: false, eventGenerated: false };
  }

  // Check for state transitions
  const newState = evaluateStateTransition(arc, dayNumber);
  let transitioned = false;

  if (newState) {
    await transitionArcState(arcId, newState);
    transitioned = true;
  }

  // Check if event should be generated
  const shouldGenerate = shouldGenerateEvent(arc, dayNumber);
  let eventGenerated = false;

  if (shouldGenerate) {
    // Get arc plan for actor assignments
    const [arcPlan] = await db
      .select({
        insiderActorIds: questionArcPlans.insiderActorIds,
        deceiverActorIds: questionArcPlans.deceiverActorIds,
      })
      .from(questionArcPlans)
      .where(eq(questionArcPlans.questionId, arc.questionId))
      .limit(1);

    // Normalize null arrays to empty arrays
    const normalizedArcPlan = arcPlan
      ? {
          insiderActorIds: arcPlan.insiderActorIds ?? [],
          deceiverActorIds: arcPlan.deceiverActorIds ?? [],
        }
      : null;
    const event = await generateStructuredEvent(arc, normalizedArcPlan);

    // Apply market impacts if event affects stocks
    if (event.marketImpacts.length > 0) {
      const { applyEventToMarkets } = await import('./event-market-pipeline');
      const modifiersApplied = await applyEventToMarkets(event);
      logger.info(
        `Applied ${modifiersApplied} market modifiers from event`,
        { arcId, modifiersApplied },
        'NarrativeEventProcessor'
      );
    }

    // Update arc state
    await db
      .update(arcStates)
      .set({
        eventsGenerated: (arc.eventsGenerated ?? 0) + 1,
        lastEventAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(arcStates.id, arcId));

    eventGenerated = true;

    logger.info(
      `Generated ${event.type} event for arc ${arcId}`,
      {
        arcId,
        eventType: event.type,
        severity: event.severity,
        signalDirection: event.signalDirection,
      },
      'NarrativeEventProcessor'
    );
  }

  return {
    transitioned,
    eventGenerated,
    newState: newState ?? undefined,
  };
}

/**
 * Create an arc state for a question
 */
export async function createArcState(questionId: string): Promise<string> {
  const id = await generateSnowflakeId();
  const now = new Date();

  await db.insert(arcStates).values({
    id,
    questionId,
    currentState: 'setup',
    stateEnteredAt: now,
    eventsGenerated: 0,
    pendingTransitions: [],
    createdAt: now,
    updatedAt: now,
  });

  logger.info(
    `Created arc state for question ${questionId}`,
    { arcId: id, questionId },
    'NarrativeEventProcessor'
  );

  return id;
}

/**
 * Narrative Event Processor Service class
 */
export class NarrativeEventProcessorService {
  getExpectedState(dayNumber: number): ArcStateType {
    return getExpectedState(dayNumber);
  }

  async processArcTick(
    arcId: string,
    dayNumber: number
  ): Promise<{
    transitioned: boolean;
    eventGenerated: boolean;
    newState?: ArcStateType;
  }> {
    return processArcTick(arcId, dayNumber);
  }

  async createArcState(questionId: string): Promise<string> {
    return createArcState(questionId);
  }
}

// Singleton instance
export const narrativeEventProcessor = new NarrativeEventProcessorService();
