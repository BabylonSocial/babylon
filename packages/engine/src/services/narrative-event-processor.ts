/**
 * Narrative Event Processor
 *
 * Unified arc event system that:
 * 1. Processes arc state transitions for prediction questions
 * 2. Generates structured events that drive narrative and market movements
 * 3. Creates world events for feed content
 * 4. Triggers article generation for significant events
 *
 * This is the single source of truth for arc-driven content generation.
 */

import {
  type ArcState,
  type ArcStateType,
  and,
  arcStates,
  db,
  eq,
  type LongTermArcState,
  type MarketImpact,
  type PendingTransition,
  questionArcPlans,
  questions,
  type StructuredEventData,
  sql,
  worldEvents,
} from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';
import { secureRandom } from '../utils/entropy';
import type { BabylonLLMClient } from '../llm/openai-client';
import { toSafeDayNumber } from '../utils/date-utils';
import { generateArticlesForArcEvent } from './event-generation-helpers';

// LLM client reference for article generation
let llmClientRef: BabylonLLMClient | null = null;

/**
 * Set the LLM client for article generation.
 * Called from game-tick before processing arcs.
 */
export function setNarrativeProcessorLLMClient(client: BabylonLLMClient): void {
  llmClientRef = client;
}

/**
 * Day ranges for each arc state (for 30-day long-term arcs)
 */
const STATE_DAY_RANGES: Record<LongTermArcState, [number, number]> = {
  setup: [1, 3],
  tension: [4, 10],
  escalation: [11, 18],
  crisis: [19, 24],
  revelation: [25, 27],
  resolution: [28, 30],
};

/**
 * Minimum hours between event generations to prevent spam
 */
const EVENT_COOLDOWN_HOURS = 2;

/**
 * Get the expected arc state for a given day number (long-term arcs only)
 */
export function getExpectedState(dayNumber: number): LongTermArcState {
  for (const [state, [start, end]] of Object.entries(STATE_DAY_RANGES)) {
    if (dayNumber >= start && dayNumber <= end) {
      return state as LongTermArcState;
    }
  }
  // After day 30, remain in resolution
  return 'resolution';
}

/**
 * Check if a state transition should occur (long-term arcs only)
 */
export function evaluateStateTransition(
  arc: ArcState,
  dayNumber: number
): LongTermArcState | null {
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
        secureRandom() < transition.probability
      ) {
        return transition.targetState as LongTermArcState;
      }
    }
  }

  return null;
}

/**
 * Transition an arc to a new state (long-term arcs only)
 */
export async function transitionArcState(
  arcId: string,
  newState: LongTermArcState
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
 * Check if an event should be generated for this arc (long-term arcs only)
 */
export function shouldGenerateEvent(
  arc: ArcState,
  _dayNumber: number
): boolean {
  // Event generation probability based on state
  const probabilities: Record<LongTermArcState, number> = {
    setup: 0.3, // 30% chance per tick
    tension: 0.4,
    escalation: 0.5,
    crisis: 0.6,
    revelation: 0.7,
    resolution: 0.2,
  };

  const prob = probabilities[arc.currentState as LongTermArcState] ?? 0.3;

  // Reduce probability if we recently generated an event
  if (arc.lastEventAt) {
    const hoursSinceLastEvent =
      (Date.now() - arc.lastEventAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastEvent < EVENT_COOLDOWN_HOURS) {
      return false; // Cooldown
    }
  }

  return secureRandom() < prob;
}

/**
 * Generate a structured event for an arc based on current state
 */
export async function generateStructuredEvent(
  arc: ArcState,
  arcPlan: { insiderActorIds: string[]; deceiverActorIds: string[] } | null
): Promise<StructuredEventData> {
  // Event types appropriate for each state (long-term arcs only)
  const stateEventTypes: Record<
    LongTermArcState,
    StructuredEventData['type'][]
  > = {
    setup: ['rumor'],
    tension: ['rumor', 'leak', 'denial'],
    escalation: ['leak', 'denial', 'confirmation'],
    crisis: ['denial', 'confirmation', 'reversal'],
    revelation: ['confirmation', 'proof'],
    resolution: ['proof'],
  };

  const possibleTypes = stateEventTypes[
    arc.currentState as LongTermArcState
  ] ?? ['rumor'];
  const eventType =
    possibleTypes[Math.floor(secureRandom() * possibleTypes.length)]!;

  // Severity increases as arc progresses
  const severityByState: Record<LongTermArcState, number> = {
    setup: 1,
    tension: 2,
    escalation: 3,
    crisis: 4,
    revelation: 4,
    resolution: 5,
  };
  const baseSeverity =
    severityByState[arc.currentState as LongTermArcState] ?? 2;
  const severity = Math.min(5, baseSeverity + Math.floor(secureRandom() * 2)) as
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
    signalDirection = secureRandom() > 0.5 ? 'YES' : 'NO';
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
          : secureRandom() > 0.5
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
 * Create a world event from a structured arc event.
 * This makes the event visible in the feed and can trigger article generation.
 */
export async function createWorldEventFromArcEvent(
  structuredEvent: StructuredEventData,
  questionText: string,
  timestamp: Date,
  dayNumber?: number
): Promise<string> {
  // Map structured event type to world event description
  const descriptionTemplates: Record<StructuredEventData['type'], string[]> = {
    rumor: [
      'Unconfirmed reports suggest developments regarding {topic}',
      'Sources claim new information about {topic}',
      'Speculation grows around {topic}',
    ],
    leak: [
      'Leaked documents reveal details about {topic}',
      'Anonymous source exposes information on {topic}',
      'Internal memo surfaces regarding {topic}',
    ],
    denial: [
      'Officials deny reports about {topic}',
      'Spokesperson refutes claims regarding {topic}',
      'Strong denial issued concerning {topic}',
    ],
    confirmation: [
      'Sources confirm developments in {topic}',
      'Official statement verifies {topic}',
      'Breaking: Confirmation on {topic}',
    ],
    reversal: [
      'Unexpected reversal in {topic}',
      'Major shift reported on {topic}',
      'Surprise development contradicts earlier reports on {topic}',
    ],
    proof: [
      'Definitive evidence emerges on {topic}',
      'Documentation confirms outcome of {topic}',
      'Final proof released regarding {topic}',
    ],
  };

  const templates = descriptionTemplates[structuredEvent.type];
  const template = templates[Math.floor(secureRandom() * templates.length)]!;
  const topic =
    questionText.length > 80 ? questionText.slice(0, 80) + '...' : questionText;
  const description = template.replace('{topic}', topic);

  const eventId = await generateSnowflakeId();
  const safeDayNumber =
    typeof dayNumber === 'number' ? toSafeDayNumber(dayNumber) : undefined;

  await db.insert(worldEvents).values({
    id: eventId,
    eventType: structuredEvent.type,
    description,
    actors: structuredEvent.affectedActors,
    relatedQuestion: undefined, // Question number not available here
    visibility: structuredEvent.type === 'leak' ? 'leaked' : 'public',
    gameId: 'continuous',
    dayNumber: safeDayNumber,
    timestamp,
    pointsToward:
      structuredEvent.signalDirection === 'NEUTRAL'
        ? null
        : structuredEvent.signalDirection,
  });

  logger.info(
    'Created world event from arc event',
    {
      eventId,
      arcId: structuredEvent.arcId,
      type: structuredEvent.type,
      severity: structuredEvent.severity,
    },
    'NarrativeEventProcessor'
  );

  return eventId;
}

/**
 * Get question text by ID for world event creation
 */
async function getQuestionText(questionId: string): Promise<string> {
  const [question] = await db
    .select({ text: questions.text })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  return question?.text ?? 'Unknown question';
}

/**
 * Get affected stock tickers for a question.
 * Parses the question text for organization mentions and returns their tickers.
 */
async function getAffectedStocksForQuestion(
  questionId: string
): Promise<string[]> {
  try {
    const { organizations, questions } = await import('@babylon/db');
    const { StaticDataRegistry } = await import('./static-data-registry');

    // First, get the question text
    const [question] = await db
      .select({ text: questions.text })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!question) {
      return [];
    }

    // Get all organizations and look for mentions in the question text
    const allOrgs = StaticDataRegistry.getAllOrganizations();
    const questionTextLower = question.text.toLowerCase();

    const mentionedOrgs = allOrgs.filter((org) => {
      // Check if org name is mentioned in question
      const nameMatch = questionTextLower.includes(org.name.toLowerCase());
      // Check if ticker is mentioned (e.g., "$PEAR" or "PEAR")
      const tickerMatch =
        org.ticker &&
        (questionTextLower.includes(`$${org.ticker.toLowerCase()}`) ||
          questionTextLower.includes(org.ticker.toLowerCase()));
      // Check if original name is mentioned
      const originalMatch =
        org.originalName &&
        questionTextLower.includes(org.originalName.toLowerCase());

      return nameMatch || tickerMatch || originalMatch;
    });

    // Return tickers for mentioned orgs
    const tickers = mentionedOrgs
      .map((org) => org.ticker)
      .filter((t): t is string => t !== undefined && t !== null);

    // If no specific orgs found, fall back to getting some default stocks
    if (tickers.length === 0) {
      const defaultOrgs = await db
        .select({ ticker: organizations.ticker })
        .from(organizations)
        .where(sql`${organizations.ticker} IS NOT NULL`)
        .limit(2);

      return defaultOrgs
        .map((o) => o.ticker)
        .filter((t): t is string => t !== null);
    }

    return tickers;
  } catch (error) {
    logger.warn(
      'Failed to get affected stocks for question',
      {
        questionId,
        error: error instanceof Error ? error.message : String(error),
      },
      'NarrativeEventProcessor'
    );
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
    const structuredEvent = await generateStructuredEvent(
      arc,
      normalizedArcPlan
    );

    // Apply market impacts if event affects stocks
    if (structuredEvent.marketImpacts.length > 0) {
      const { applyEventToMarkets } = await import('./event-market-pipeline');
      const modifiersApplied = await applyEventToMarkets(structuredEvent);
      logger.info(
        `Applied ${modifiersApplied} market modifiers from event`,
        { arcId, modifiersApplied },
        'NarrativeEventProcessor'
      );
    }

    // Create a world event so it appears in the feed
    const now = new Date();
    const questionText = await getQuestionText(arc.questionId);
    const worldEventId = await createWorldEventFromArcEvent(
      structuredEvent,
      questionText,
      now,
      dayNumber
    );

    // Trigger article generation for significant events (severity >= 3)
    if (structuredEvent.severity >= 3 && llmClientRef) {
      try {
        // Get question details for article context
        const [question] = await db
          .select({
            id: questions.id,
            text: questions.text,
            questionNumber: questions.questionNumber,
          })
          .from(questions)
          .where(eq(questions.id, arc.questionId))
          .limit(1);

        if (question) {
          const articlesGenerated = await generateArticlesForArcEvent(
            worldEventId,
            'created', // Arc events are 'created' status
            question,
            llmClientRef,
            now,
            dayNumber
          );

          if (articlesGenerated > 0) {
            logger.info(
              `Generated ${articlesGenerated} articles for arc event`,
              { arcId, worldEventId, severity: structuredEvent.severity },
              'NarrativeEventProcessor'
            );
          }
        }
      } catch (articleError) {
        logger.warn(
          'Failed to generate articles for arc event',
          {
            arcId,
            worldEventId,
            error:
              articleError instanceof Error
                ? articleError.message
                : String(articleError),
          },
          'NarrativeEventProcessor'
        );
      }
    }

    const updateResult = await db
      .update(arcStates)
      .set({
        eventsGenerated: (arc.eventsGenerated ?? 0) + 1,
        lastEventAt: now,
        updatedAt: now,
      })
      .where(
        and(eq(arcStates.id, arcId), eq(arcStates.updatedAt, arc.updatedAt))
      )
      .returning({ id: arcStates.id });

    if (updateResult.length === 0) {
      // Optimistic lock conflict - another process updated the arc
      logger.warn(
        `Optimistic lock conflict for arc ${arcId}, skipping event`,
        { arcId },
        'NarrativeEventProcessor'
      );
      return {
        transitioned,
        eventGenerated: false,
        newState: newState ?? undefined,
      };
    }

    eventGenerated = true;

    logger.info(
      `Generated ${structuredEvent.type} event for arc ${arcId}`,
      {
        arcId,
        eventType: structuredEvent.type,
        severity: structuredEvent.severity,
        signalDirection: structuredEvent.signalDirection,
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
 * Create an arc state for a question.
 * Returns existing arc ID if one already exists (unique constraint).
 */
export async function createArcState(questionId: string): Promise<string> {
  // First check if arc already exists (idempotent)
  const [existing] = await db
    .select({ id: arcStates.id })
    .from(arcStates)
    .where(eq(arcStates.questionId, questionId))
    .limit(1);

  if (existing) {
    logger.debug(
      `Arc state already exists for question ${questionId}`,
      { arcId: existing.id, questionId },
      'NarrativeEventProcessor'
    );
    return existing.id;
  }

  const id = await generateSnowflakeId();
  const now = new Date();

  try {
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
  } catch (error) {
    // Handle unique constraint violation (race condition)
    if (error instanceof Error && error.message.includes('unique constraint')) {
      const [racedExisting] = await db
        .select({ id: arcStates.id })
        .from(arcStates)
        .where(eq(arcStates.questionId, questionId))
        .limit(1);

      if (racedExisting) {
        logger.debug(
          `Arc state created by another process for question ${questionId}`,
          { arcId: racedExisting.id, questionId },
          'NarrativeEventProcessor'
        );
        return racedExisting.id;
      }
    }
    throw error;
  }
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
