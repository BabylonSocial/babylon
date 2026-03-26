import { and, desc, gte, inArray, type Question } from '@babylon/db';
import { db, worldEvents } from '@babylon/db/runtime';
import { generateSnowflakeId, logger } from '@babylon/shared';
import { ArticleGenerator } from '../ArticleGenerator';
import type { BabylonLLMClient } from '../llm/openai-client';
import {
  type ArcEventStatus,
  NewsArticlePacingEngine,
} from '../NewsArticlePacingEngine';
import { toDateString, toSafeDayNumber } from '../utils/date-utils';
import { secureRandom, weightedPick } from '../utils/entropy';
import { formatError } from '../utils/error-utils';
import { worldFactsService } from '../world-facts-service';
import { persistArticle } from './article-persistence';
import {
  articleRateLimiter,
  breakingArticleRateLimiter,
} from './article-rate-limiter';
import {
  getArcPlan,
  getPhaseForDay,
  getSignalDirection,
} from './narrative-state-service';
import { StaticDataRegistry } from './static-data-registry';

/**
 * Singleton pacing engine for arc event coverage tracking.
 *
 * @remarks
 * **In-memory only** - This singleton tracks which events have been covered
 * by which organizations to prevent duplicate articles. The state is NOT
 * persisted to the database and will be lost on:
 * - Server restart/redeploy
 * - Serverless cold start
 * - Process termination
 *
 * This is acceptable because:
 * 1. The article rate limiter (DB-backed) provides primary flood protection
 * 2. Occasional duplicate articles after restart are not harmful
 * 3. Most events are covered within the typical serverless warm period
 */
const arcEventPacer = new NewsArticlePacingEngine();

// Minimal question type for event generation (only fields actually used)
// outcome is optional - only used for arc plan signal direction, and the code handles missing outcome
type QuestionForEvent = Pick<Question, 'id' | 'text' | 'questionNumber'> & {
  outcome?: boolean | null;
};

/**
 * Event types with weights and templates for variety
 */
type EventTypeConfig = {
  type: string;
  weight: number;
  templates: string[];
  visibility: 'public' | 'leaked' | 'private';
  requiresActors: boolean;
};

const EVENT_TYPES: EventTypeConfig[] = [
  {
    type: 'announcement',
    weight: 25,
    templates: [
      'Official statement released regarding {topic}',
      'Press release confirms developments in {topic}',
      'Spokesperson addresses questions about {topic}',
    ],
    visibility: 'public',
    requiresActors: false,
  },
  {
    type: 'leak',
    weight: 15,
    templates: [
      'Anonymous source reveals details about {topic}',
      'Internal documents surface regarding {topic}',
      'Whistleblower alleges new information on {topic}',
      'Leaked memo suggests developments in {topic}',
    ],
    visibility: 'leaked',
    requiresActors: false,
  },
  {
    type: 'meeting',
    weight: 12,
    templates: [
      'Key figures meet to discuss {topic}',
      'Emergency meeting called regarding {topic}',
      'Private gathering addresses {topic} concerns',
      'High-level discussions underway on {topic}',
    ],
    visibility: 'public',
    requiresActors: true,
  },
  {
    type: 'development',
    weight: 20,
    templates: [
      'New evidence emerges in {topic}',
      'Significant progress reported on {topic}',
      'Breaking: Major update on {topic}',
      'Sources confirm movement on {topic}',
    ],
    visibility: 'public',
    requiresActors: false,
  },
  {
    type: 'rumor',
    weight: 10,
    templates: [
      'Speculation grows around {topic}',
      'Unconfirmed reports suggest changes in {topic}',
      'Industry insiders whisper about {topic}',
      'Social media abuzz with theories on {topic}',
    ],
    visibility: 'public',
    requiresActors: false,
  },
  {
    type: 'scandal',
    weight: 8,
    templates: [
      'Controversy erupts over {topic}',
      'Allegations surface regarding {topic}',
      'Public outcry follows revelations about {topic}',
    ],
    visibility: 'public',
    requiresActors: true,
  },
  {
    type: 'revelation',
    weight: 10,
    templates: [
      'Investigation reveals new facts about {topic}',
      'Documentary evidence confirms {topic} details',
      'Analysis uncovers hidden aspects of {topic}',
    ],
    visibility: 'public',
    requiresActors: false,
  },
];

/**
 * Event types that warrant breaking news coverage.
 * These high-impact events trigger immediate article generation
 * with their own rate limit separate from regular scheduled articles.
 */
const BREAKING_EVENT_TYPES = ['scandal', 'leak', 'revelation'] as const;

/**
 * Select a random event type based on weights
 */
function selectEventType(): EventTypeConfig {
  return weightedPick(EVENT_TYPES, (config) => config.weight);
}

/**
 * Sanitize topic text by removing any remaining template variables
 */
function sanitizeTopic(topic: string): string {
  // Remove common template variables that may have leaked through
  return topic
    .replace(/\{resolutionDate\}/gi, 'the resolution date')
    .replace(/\{resolution_date\}/gi, 'the resolution date')
    .replace(/\{date\}/gi, 'the scheduled date')
    .replace(/\{[a-zA-Z_]+\}/g, '') // Remove any other template variables
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generate a description from template
 */
function generateDescription(
  template: string,
  topic: string,
  actors: string[]
): string {
  // Sanitize topic to remove any template variable leakage
  const cleanTopic = sanitizeTopic(topic);
  let description = template.replace('{topic}', cleanTopic);

  // Add actor names if template supports it
  if (actors.length > 0) {
    const actorNames = actors
      .map((id) => {
        const actor = StaticDataRegistry.getActor(id);
        return actor?.name || 'Unknown';
      })
      .filter((name) => name !== 'Unknown');

    if (actorNames.length > 0 && description.includes('Key figures')) {
      description = description.replace(
        'Key figures',
        actorNames.slice(0, 2).join(' and ')
      );
    }
  }

  return description;
}

/**
 * Select random actors relevant to a question
 */
function selectRelevantActors(maxActors: number = 2): string[] {
  const allActors = StaticDataRegistry.getAllActors();
  if (allActors.length === 0) return [];

  // Prefer S_TIER and A_TIER actors (most influential)
  const tieredActors = allActors.filter(
    (a) => a.tier === 'S_TIER' || a.tier === 'A_TIER'
  );
  const pool = tieredActors.length > 0 ? tieredActors : allActors;

  // Randomly select actors
  const selected: string[] = [];
  const shuffled = [...pool].sort(() => secureRandom() - 0.5);

  for (let i = 0; i < Math.min(maxActors, shuffled.length); i++) {
    const actor = shuffled[i];
    if (actor) {
      selected.push(actor.id);
    }
  }

  return selected;
}

/**
 * Generate diverse events based on active questions
 *
 * @description
 * Generates events with varied types (announcements, leaks, meetings, rumors, etc.)
 * and signal direction based on the narrative arc plan. Events have a `pointsToward`
 * field that indicates whether the event suggests YES or NO outcome.
 *
 * Event types are weighted to create realistic news cycles:
 * - Announcements (25%): Official statements
 * - Developments (20%): Progress updates
 * - Leaks (15%): Insider information
 * - Meetings (12%): Key figure gatherings
 * - Rumors (10%): Unconfirmed speculation
 * - Revelations (10%): Investigation results
 * - Scandals (8%): Controversies
 *
 * @param questions - Active questions to generate events for
 * @param timestamp - Timestamp for the generated events
 * @param currentDay - Current game day (optional, used for arc plan phase detection)
 * @param llmClient - Optional LLM client for breaking article generation
 * @returns Number of events created
 */
export async function generateEvents(
  questions: QuestionForEvent[],
  timestamp: Date,
  currentDay?: number,
  llmClient?: BabylonLLMClient
): Promise<number> {
  if (questions.length === 0) return 0;

  let eventsCreated = 0;
  const eventsToGenerate = Math.min(2, questions.length);

  for (let i = 0; i < eventsToGenerate; i++) {
    const question = questions[i];

    if (!question || !question.text) {
      continue;
    }

    // Validate integer fields to prevent overflow
    const questionNum =
      typeof question.questionNumber === 'number' &&
      Number.isFinite(question.questionNumber) &&
      question.questionNumber >= 0 &&
      question.questionNumber <= 2147483647
        ? question.questionNumber
        : undefined;

    const safeDayNumber =
      typeof currentDay === 'number' ? toSafeDayNumber(currentDay) : undefined;

    // Get arc plan for signal direction
    let pointsToward: 'YES' | 'NO' | null = null;
    let phase: 'early' | 'middle' | 'late' | 'climax' | undefined;

    if (currentDay !== undefined) {
      const arcPlan = await getArcPlan(question.id);
      if (arcPlan) {
        phase = getPhaseForDay(currentDay, arcPlan);
        // Events don't have an actor, so pass empty string
        // Use question.outcome if available, default to true
        const outcome = question.outcome ?? true;
        const signal = getSignalDirection(arcPlan, phase, '', outcome);
        pointsToward = signal.direction === 'NEUTRAL' ? null : signal.direction;

        logger.debug(
          'Event signal direction determined',
          {
            questionId: question.id,
            currentDay,
            phase,
            pointsToward,
            outcome,
          },
          'EventGeneration'
        );
      }
    }

    // Select event type with weighted randomness
    const eventConfig = selectEventType();

    // Select random template from the event type
    const templateIndex = Math.floor(
      secureRandom() * eventConfig.templates.length
    );
    const template = eventConfig.templates[templateIndex] || '{topic}';

    // Extract topic from question text (simplified extraction)
    const topic =
      question.text.length > 100
        ? question.text.slice(0, 100) + '...'
        : question.text;

    // Select actors if required by event type
    const actors = eventConfig.requiresActors ? selectRelevantActors(2) : [];

    // Generate description
    const description = generateDescription(template, topic, actors);

    // Adjust visibility based on phase (late game has more leaks/revelations)
    let visibility = eventConfig.visibility;
    if (phase === 'late' || phase === 'climax') {
      // In late game, even leaks become public knowledge faster
      if (visibility === 'leaked' && secureRandom() < 0.3) {
        visibility = 'public';
      }
    }

    const eventId = await generateSnowflakeId();

    await db.insert(worldEvents).values({
      id: eventId,
      eventType: eventConfig.type,
      description,
      actors,
      relatedQuestion: questionNum,
      visibility,
      gameId: 'continuous',
      dayNumber: safeDayNumber,
      timestamp: timestamp,
      pointsToward,
    });
    eventsCreated++;

    logger.debug(
      'Generated diverse event',
      {
        eventType: eventConfig.type,
        visibility,
        hasActors: actors.length > 0,
        questionId: question.id,
      },
      'EventGeneration'
    );

    // Trigger breaking article for high-impact events (scandals, leaks, revelations)
    // This adds unpredictability to article timing - users can't predict when breaking news appears
    if (llmClient) {
      try {
        const breakingArticles = await maybeGenerateBreakingArticle(
          eventId,
          eventConfig.type,
          question,
          llmClient,
          timestamp,
          safeDayNumber
        );
        if (breakingArticles > 0) {
          logger.info(
            'Breaking article generated from world event',
            {
              eventId,
              eventType: eventConfig.type,
              articlesCreated: breakingArticles,
            },
            'EventGeneration'
          );
        }
      } catch (error) {
        // Log the error but don't rethrow - the world event was already inserted,
        // so we don't want article generation failures to abort the surrounding loop
        logger.error(
          'Failed to generate breaking article from world event',
          {
            eventId,
            eventType: eventConfig.type,
            safeDayNumber,
            error: formatError(error),
          },
          'EventGeneration'
        );
      }
    }
  }

  return eventsCreated;
}

const ARC_PULSE_LOOKBACK_MS = 24 * 60 * 60 * 1000; // 24h
const ARC_PULSE_MAX_EVENTS_PER_TICK = 2;
const ARC_PULSE_INTERVAL_MS_BY_PHASE: Record<
  'early' | 'middle' | 'late' | 'climax',
  number
> = {
  early: 6 * 60 * 60 * 1000, // 6h
  middle: 4 * 60 * 60 * 1000, // 4h
  late: 2 * 60 * 60 * 1000, // 2h
  climax: 60 * 60 * 1000, // 1h
};

/**
 * Generate additional "arc pulse" events to keep narratives (and markets) active.
 *
 * @description
 * This is a lightweight approximation of "sub-arc events": for each active question,
 * if we haven't emitted a `WorldEvent` recently, emit a new one using the same
 * generation logic as `generateEvents()` (signal direction is still derived from the arc plan).
 *
 * This helps keep the feed and market context refreshed without relying on purely
 * synthetic volatility.
 */
export async function generateArcPulseEventsIfNeeded(
  questions: QuestionForEvent[],
  timestamp: Date,
  currentDay?: number
): Promise<number> {
  if (questions.length === 0) return 0;

  const questionNumbers = questions
    .map((q) =>
      typeof q.questionNumber === 'number' &&
      Number.isFinite(q.questionNumber) &&
      q.questionNumber >= 0 &&
      q.questionNumber <= 2147483647
        ? q.questionNumber
        : null
    )
    .filter((n): n is number => n !== null);

  if (questionNumbers.length === 0) return 0;

  const lookbackDate = new Date(timestamp.getTime() - ARC_PULSE_LOOKBACK_MS);
  const recent = await db
    .select({
      relatedQuestion: worldEvents.relatedQuestion,
      timestamp: worldEvents.timestamp,
    })
    .from(worldEvents)
    .where(
      and(
        inArray(worldEvents.relatedQuestion, questionNumbers),
        gte(worldEvents.timestamp, lookbackDate)
      )
    )
    .orderBy(desc(worldEvents.timestamp));

  const lastEventByQuestion = new Map<number, Date>();
  for (const row of recent) {
    const q = row.relatedQuestion;
    if (typeof q !== 'number') continue;
    if (!lastEventByQuestion.has(q)) {
      lastEventByQuestion.set(q, row.timestamp);
    }
  }

  let created = 0;

  for (const question of questions) {
    if (created >= ARC_PULSE_MAX_EVENTS_PER_TICK) break;

    const questionNum =
      typeof question.questionNumber === 'number' &&
      Number.isFinite(question.questionNumber) &&
      question.questionNumber >= 0 &&
      question.questionNumber <= 2147483647
        ? question.questionNumber
        : null;

    if (questionNum === null) continue;

    let intervalMs = ARC_PULSE_INTERVAL_MS_BY_PHASE.early;
    if (currentDay !== undefined) {
      const arcPlan = await getArcPlan(question.id);
      if (arcPlan) {
        const phase = getPhaseForDay(currentDay, arcPlan);
        intervalMs = ARC_PULSE_INTERVAL_MS_BY_PHASE[phase];
      }
    }

    const lastEventAt = lastEventByQuestion.get(questionNum) ?? null;
    if (
      lastEventAt &&
      timestamp.getTime() - lastEventAt.getTime() < intervalMs
    ) {
      continue;
    }

    const generated = await generateEvents([question], timestamp, currentDay);
    if (generated > 0) {
      created += generated;
      lastEventByQuestion.set(questionNum, timestamp);
    }
  }

  return created;
}

/**
 * Generate articles for an arc event (event-driven article generation)
 *
 * @description
 * Articles are now ONLY generated when arc events occur. This function:
 * 1. Checks which orgs haven't reported on this event's current status
 * 2. Generates 1-2 articles from uncovered orgs
 * 3. Records coverage to prevent duplicate reporting
 *
 * An org can only report on an event once per status. If the event
 * updates or resolves, they can report again.
 *
 * @param arcEventId - ID of the arc event
 * @param eventStatus - Current status of the event (created/updated/resolved)
 * @param question - Related question for context
 * @param llmClient - LLM client for article generation
 * @param timestamp - Timestamp for the articles
 * @param dayNumber - Current game day
 * @param options - Optional settings for article generation
 * @param options.skipRateLimit - If true, skip the internal articleRateLimiter check (used by breaking articles which have their own rate limiter)
 * @returns Number of articles created
 */
export async function generateArticlesForArcEvent(
  arcEventId: string,
  eventStatus: ArcEventStatus,
  question: QuestionForEvent,
  llmClient: BabylonLLMClient,
  timestamp: Date,
  dayNumber?: number,
  options?: { skipRateLimit?: boolean }
): Promise<number> {
  const { skipRateLimit = false } = options ?? {};

  // Check hourly article rate limit FIRST - this is the global throttle
  // Skip this check if caller has already checked a separate rate limiter (e.g., breaking articles)
  let remaining = 2; // Default max if skipping rate limit
  if (!skipRateLimit) {
    const rateLimitResult = await articleRateLimiter.canGenerateArticle();

    if (!rateLimitResult.allowed) {
      logger.info(
        'Skipping arc event article generation - hourly rate limit reached',
        {
          arcEventId,
          eventStatus,
          currentCount: rateLimitResult.currentCount,
          maxAllowed: rateLimitResult.maxAllowed,
        },
        'EventGeneration'
      );
      return 0;
    }
    remaining = rateLimitResult.remaining;
  }

  // Get news organizations that haven't reported on this event status
  const newsOrgs = StaticDataRegistry.getOrganizationsByType('media');
  if (newsOrgs.length === 0) {
    logger.warn(
      'No news organizations available for arc event articles',
      { arcEventId },
      'EventGeneration'
    );
    return 0;
  }

  // Select orgs that haven't covered this event status yet
  // Limit to remaining rate limit slots (not just max 2)
  const maxOrgsAllowed = Math.min(2, remaining);
  const orgsToPublish = arcEventPacer.selectOrgsForArcEvent(
    arcEventId,
    eventStatus,
    newsOrgs,
    maxOrgsAllowed
  );

  if (orgsToPublish.length === 0) {
    logger.debug(
      'All orgs have already covered this arc event status',
      { arcEventId, eventStatus },
      'EventGeneration'
    );
    return 0;
  }

  // Get actors for article context
  const actorsList = StaticDataRegistry.getTopActors(20);

  // Get world facts context for article generation with graceful fallback
  let worldFactsContext = '';
  try {
    worldFactsContext = await worldFactsService.generatePromptContext();
  } catch (error) {
    logger.warn(
      'Failed to fetch world facts context for arc event articles - proceeding without',
      {
        arcEventId,
        error: formatError(error),
      },
      'EventGeneration'
    );
  }

  // Initialize article generator
  const articleGen = new ArticleGenerator(llmClient);

  // Generate articles sequentially to ensure rate limit is respected per-article.
  // Parallel generation could cause race conditions where multiple articles pass
  // the initial check but exceed the limit when all complete.
  const results: Array<
    | { status: 'fulfilled'; value: number }
    | { status: 'rejected'; reason: unknown }
  > = [];

  for (const orgData of orgsToPublish) {
    // Re-check rate limit before each article to prevent race conditions
    // Skip this check if caller has already checked a separate rate limiter
    if (!skipRateLimit) {
      const { allowed: stillAllowed } =
        await articleRateLimiter.canGenerateArticle();
      if (!stillAllowed) {
        logger.info(
          'Rate limit reached during arc event article generation - stopping',
          { arcEventId, eventStatus, articlesGenerated: results.length },
          'EventGeneration'
        );
        break;
      }
    }

    const org = {
      id: orgData.id,
      name: orgData.name || 'Unknown Organization',
      description: orgData.description || '',
      type: (orgData.type as 'company' | 'media' | 'government') || 'media',
      canBeInvolved: orgData.canBeInvolved,
      initialPrice: orgData.initialPrice ?? undefined,
      currentPrice: orgData.initialPrice ?? undefined,
    };

    // Determine article stage based on event status
    const stage =
      eventStatus === 'created'
        ? 'breaking'
        : eventStatus === 'resolved'
          ? 'resolution'
          : 'commentary';

    try {
      const article = await articleGen.generateArticleForQuestion(
        {
          id: question.id,
          text: question.text,
          scenario: 1,
          outcome: question.outcome ?? false,
          rank: 1,
          createdDate: toDateString(new Date()),
          resolutionDate: '',
          status: 'active',
        },
        org,
        stage,
        actorsList.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description || '',
          domain: Array.isArray(a.domain) ? a.domain : [a.domain || 'tech'],
          personality: a.personality || undefined,
          tier: a.tier ?? undefined,
          affiliations: a.affiliations || [],
          postStyle: a.postStyle || undefined,
          postExample: a.postExample || '',
          role: a.role as 'main' | 'supporting' | 'extra' | undefined,
          initialLuck: (a.initialLuck as 'low' | 'medium' | 'high') || 'medium',
          initialMood: a.initialMood || 0,
        })),
        [], // Events are included in context via question
        worldFactsContext // World facts context for current game state
      );

      // Note: ArticleGenerator already applies character mapping internally,
      // so we use the article content directly without additional transformation.
      const articleTimestamp = article.publishedAt || timestamp;

      // Use shared persistence service (includes rate limit check and image generation)
      // Skip rate limit check in persistence if we're bypassing it (breaking articles have their own limiter)
      const persistResult = await persistArticle(
        {
          title: article.title || 'Untitled',
          summary: article.summary || '',
          content: article.content || '',
          authorOrgId: article.authorOrgId,
          gameId: 'continuous',
          dayNumber: dayNumber,
          byline: article.byline,
          biasScore: article.biasScore,
          sentiment: article.sentiment,
          slant: article.slant,
          category: article.category,
          timestamp: articleTimestamp,
          relatedQuestion: article.relatedQuestion,
        },
        { checkRateLimit: !skipRateLimit }
      );

      if (!persistResult.success) {
        if (persistResult.rateLimited) {
          logger.info(
            'Rate limit reached during arc event article persistence',
            { arcEventId, eventStatus, orgId: org.id },
            'EventGeneration'
          );
          results.push({
            status: 'rejected',
            reason: new Error('Rate limit exceeded during persistence'),
          });
          break; // Exit loop immediately - no point trying more orgs if rate limited
        }
        // Other persistence error
        results.push({
          status: 'rejected',
          reason: new Error(persistResult.error || 'Unknown persistence error'),
        });
        continue;
      }

      // Defensive guard: verify articleId exists after successful persistence
      if (!persistResult.articleId) {
        results.push({
          status: 'rejected',
          reason: new Error('Missing articleId after successful persistence'),
        });
        continue;
      }

      const articleId = persistResult.articleId;

      // Record that this org has covered this event status
      arcEventPacer.recordArcEventCoverage(
        arcEventId,
        org.id,
        eventStatus,
        articleId
      );

      logger.info(
        'Generated arc event article',
        {
          arcEventId,
          eventStatus,
          org: org.name,
          articleId,
          title: (article.title || 'Untitled').slice(0, 50),
        },
        'EventGeneration'
      );

      results.push({ status: 'fulfilled', value: 1 });
    } catch (error) {
      results.push({ status: 'rejected', reason: error });
      logger.warn(
        'Failed to generate arc event article',
        {
          arcEventId,
          eventStatus,
          orgId: org.id,
          orgName: org.name,
          error: formatError(error),
        },
        'EventGeneration'
      );
    }
  }

  const articlesCreated = results.reduce((sum, result) => {
    if (result.status === 'fulfilled') {
      return sum + result.value;
    }
    return sum;
  }, 0);

  // Use results.length for attempted count (reflects actual attempts, not orgsToPublish.length)
  // This is accurate when the loop exits early due to rate limiting
  logger.info(
    'Arc event articles generated',
    {
      arcEventId,
      eventStatus,
      articlesCreated,
      attempted: results.length,
    },
    'EventGeneration'
  );

  return articlesCreated;
}

/**
 * Maybe generate a breaking article for a significant world event.
 *
 * Breaking articles are triggered by high-impact events (scandals, leaks, revelations)
 * and use a separate rate limit from regular scheduled articles. This adds unpredictability
 * to article timing - users can't predict when breaking news will appear.
 *
 * @param eventId - The world event ID that triggered this
 * @param eventType - The type of world event (scandal, leak, revelation, etc.)
 * @param question - Related question for context
 * @param llmClient - LLM client for article generation
 * @param timestamp - Timestamp for the article
 * @param dayNumber - Current game day
 * @returns Number of articles created (0 if skipped, 1+ if generated)
 */
export async function maybeGenerateBreakingArticle(
  eventId: string,
  eventType: string,
  question: QuestionForEvent,
  llmClient: BabylonLLMClient,
  timestamp: Date,
  dayNumber?: number
): Promise<number> {
  // Only breaking-worthy events trigger articles
  if (
    !BREAKING_EVENT_TYPES.includes(
      eventType as (typeof BREAKING_EVENT_TYPES)[number]
    )
  ) {
    return 0;
  }

  // Use reservation pattern to prevent race conditions:
  // Reserve a slot before generation, release if it fails
  const reservationId = breakingArticleRateLimiter.tryReserveSlot();
  if (reservationId === null) {
    const { currentCount, maxAllowed } =
      breakingArticleRateLimiter.canGenerateArticle();
    logger.debug(
      'Breaking article skipped - rate limit reached',
      { eventId, eventType, currentCount, maxAllowed },
      'EventGeneration'
    );
    return 0;
  }

  logger.info(
    'Triggering breaking article for world event',
    { eventId, eventType, questionId: question.id, reservationId },
    'EventGeneration'
  );

  try {
    // Reuse the existing arc event article generation logic
    // This handles org selection, article generation, and persistence
    // Pass skipRateLimit=true since we've already reserved a slot
    const articlesCreated = await generateArticlesForArcEvent(
      eventId,
      'created', // Breaking articles are always fresh coverage
      question,
      llmClient,
      timestamp,
      dayNumber,
      { skipRateLimit: true }
    );

    // If we created more than 1 article, record the additional ones
    // (first one was already recorded via tryReserveSlot)
    for (let i = 1; i < articlesCreated; i++) {
      breakingArticleRateLimiter.recordBreakingArticle(timestamp.getTime());
    }

    // If no articles were created, release the reserved slot
    if (articlesCreated === 0) {
      breakingArticleRateLimiter.releaseSlot(reservationId);
    }

    return articlesCreated;
  } catch (error) {
    // Release the reserved slot on failure
    breakingArticleRateLimiter.releaseSlot(reservationId);
    throw error;
  }
}

/**
 * Get arc event coverage statistics
 */
export function getArcEventCoverageStats() {
  return arcEventPacer.getArcEventCoverageStats();
}

/**
 * Check if an event has already been covered by any organization at a specific status.
 * Uses the arcEventPacer to determine if the event has received coverage for the given status.
 *
 * @param eventId - The event/question ID to check
 * @param status - The status level to check (default: 'created')
 * @returns True if the event has been covered by at least one org at the specified status
 *
 * @remarks
 * **LIMITATION: In-memory tracking** - Event coverage tracking is stored in-memory
 * using a singleton `NewsArticlePacingEngine`. This means:
 * - Tracking is lost on server restart/redeploy (cold start)
 * - Multiple serverless instances don't share tracking state
 * - Occasional duplicate coverage is possible after deployments
 *
 * This is acceptable for our use case because:
 * 1. Duplicate articles occasionally are not harmful to user experience
 * 2. The article rate limiter provides the primary flood protection
 * 3. Events are typically covered within minutes, before most restarts
 *
 * For stricter duplicate prevention, consider DB-backed tracking with:
 * - A `covered_events` table with (eventId, orgId, status, articleId, timestamp)
 * - Query before generating to check existing coverage
 */
export function hasEventBeenCovered(
  eventId: string,
  status: ArcEventStatus = 'created'
): boolean {
  // Check if any org has covered this event at the specified status
  return arcEventPacer.hasEventBeenCoveredForStatus(eventId, status);
}

/**
 * Mark an event as covered by recording it in the pacer.
 * This prevents future duplicate coverage of the same event.
 *
 * @param eventId - The event/question ID that was covered
 * @param orgId - The organization that covered it
 * @param articleId - The generated article ID
 * @param status - The status at time of coverage (default: 'created')
 */
export function markEventAsCovered(
  eventId: string,
  orgId: string,
  articleId: string,
  status: ArcEventStatus = 'created'
): void {
  arcEventPacer.recordArcEventCoverage(eventId, orgId, status, articleId);
}
