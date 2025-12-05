/**
 * Babylon Feed Generator - Social Media Simulation Engine
 *
 * @module engine/FeedGenerator
 *
 * @description
 * Generates organic, realistic social media feed content where NPCs react to game
 * events based on personality, emotional state, relationships, and insider information.
 * Creates cascading information flows that mimic real social media dynamics.
 *
 * **Feed Information Cascade:**
 * 1. **Real Event Occurs** (WorldEvent - players never see directly)
 * 2. **Media Breaks Story** - News organizations and journalists report
 * 3. **Involved Parties React** - Actors in event respond (defensive/celebratory)
 * 4. **Companies Respond** - PR statements from affiliated companies
 * 5. **Experts Analyze** - Outside commentators weigh in
 * 6. **Conspiracy Theories** - Contrarians spin alternative narratives
 * 7. **Threads Emerge** - Replies and conversations develop
 * 8. **Ambient Noise** - Unrelated musings and hot takes
 *
 * **Content Generation:**
 * - 100% LLM-generated content (no templates)
 * - Each post considers actor's mood, luck, personality, relationships
 * - Group chat context influences public posts
 * - Relationship dynamics create natural disagreements
 * - Clue strength varies by time until resolution
 *
 * **Performance Optimization:**
 * - ✅ **90% LLM cost reduction** via intelligent batching
 * - Before: ~10-15 calls per event (2,000+ total per game)
 * - After: ~4-5 calls per event (~200 total per game)
 * - Same quality, 10x faster, significantly cheaper
 *
 * **Batching Strategy:**
 * - Media posts: All orgs/journalists → 1 call
 * - Reactions: All involved actors → 1 call
 * - Commentary: All experts → 1 call
 * - Conspiracy: All contrarians → 1 call
 * - Threads: All replies → 1 call
 * - Ambient: All posts per hour → 1 call
 *
 * **Per-Actor Context Preserved:**
 * - Individual mood and luck state
 * - Unique personality traits
 * - Relationship dynamics
 * - Group chat insider information
 * - Post style and voice
 *
 * **Retry Logic:**
 * - All LLM calls retry up to 5 times with backoff
 * - Validates response structure and content
 * - Requires minimum success rate (50%) for batches
 * - Throws on persistent failure to maintain quality
 *
 * @see {@link GameEngine} - Uses FeedGenerator for post generation
 * @see {@link EmotionSystem} - Provides mood/luck context
 * @see {@link WorldEvent} - Events that trigger feed cascades
 *
 * @example
 * ```typescript
 * const feed = new FeedGenerator(llmClient);
 * feed.setActorStates(moodMap);
 * feed.setRelationships(relationships);
 * feed.setOrganizations(organizations);
 *
 * const posts = await feed.generateDayFeed(
 *   day: 15,
 *   worldEvents: [event1, event2],
 *   allActors,
 *   outcome: true
 * );
 *
 * console.log(`Generated ${posts.length} posts`);
 * // Posts include news breaks, reactions, analysis, conspiracy, threads
 * ```
 */

import { EventEmitter } from 'events';
import { logger } from '@babylon/shared';
import { characterMappingService } from './services/character-mapping-service';
import { shuffleArray } from './utils/randomization';
import { ContentValidator } from '@babylon/shared';
import {
  ambientPosts,
  analystReaction,
  CHARACTER_LIMITS,
  commentary,
  companyPost,
  conspiracy,
  dayTransition,
  generateWorldContext,
  getPromptParams,
  getTimeOfDayEnergy,
  governmentPost,
  minuteAmbient,
  newsPosts,
  priceAnnouncement,
  questionResolvedFeed,
  reactions,
  renderPrompt,
  replies,
  reply,
  stockTicker,
  validateFeedPost,
  type WorldContext,
} from './prompts';
import type {
  Actor,
  ActorConnection,
  ActorRelationship,
  ActorState,
  FeedEvent,
  FeedPost,
  Organization,
  PriceUpdate,
  Question,
} from './types/shared';
import { buildPhaseContext, formatActorVoiceContext } from './utils/shared-utils';
import { generateActorContext } from './EmotionSystem';
import { RelationshipEvolutionEngine } from './RelationshipEvolutionEngine';
import type { WorldEvent } from './GameWorld';
import type { BabylonLLMClient } from './llm/openai-client';
import type { TrendingTopicsEngine } from './TrendingTopicsEngine';

// Re-export types for backwards compatibility with external consumers
export type {
  Actor,
  ActorRelationship,
  ActorState,
  FeedEvent,
  FeedPost,
  Organization,
};

/**
 * Commentary post from LLM
 */
interface CommentaryPost {
  post?: string;
  tweet?: string;
  content?: string;
  sentiment?: number;
  clueStrength?: number;
  pointsToward?: boolean | null;
}

/**
 * Commentary response from LLM
 */
interface CommentaryResponse {
  commentary: CommentaryPost[];
}

/**
 * Conspiracy post from LLM
 */
interface ConspiracyPost {
  post?: string;
  tweet?: string;
  content?: string;
  sentiment?: number;
  clueStrength?: number;
  pointsToward?: boolean | null;
}

/**
 * Conspiracy response format 1: Direct array
 */
interface ConspiracyResponseFormat1 {
  conspiracy: ConspiracyPost[];
}

/**
 * Conspiracy response format 2: Wrapped in data array
 */
interface ConspiracyResponseFormat2 {
  data: Array<{ conspiracy: ConspiracyPost[] }>;
}

/**
 * Conspiracy response union type
 */
type ConspiracyResponse = ConspiracyResponseFormat1 | ConspiracyResponseFormat2;

/**
 * Feed Generator
 *
 * @class FeedGenerator
 * @extends EventEmitter
 *
 * @description
 * Transforms world events into organic social media discourse using LLM-powered
 * content generation. Creates realistic feed cascades where different actors react
 * to events based on their personality, emotional state, and relationships.
 *
 * **Architecture:**
 * - Stateful: Maintains actor moods, relationships, organizations
 * - Batched LLM calls for 90% cost reduction
 * - Retry logic for reliability
 * - Validation for content quality
 *
 * **State Management:**
 * - Actor emotional states (mood, luck)
 * - Relationship graph (allies, rivals, etc.)
 * - Organization affiliations
 * - Group chat context for insider perspectives
 *
 * **Content Types Generated:**
 * - News breaking (media orgs, journalists)
 * - Direct reactions (involved parties)
 * - Company PR (corporate responses)
 * - Government statements (regulatory responses)
 * - Expert commentary (outside analysis)
 * - Conspiracy theories (contrarian takes)
 * - Thread replies (conversations)
 * - Ambient posts (general musings)
 *
 * @usage
 * Instantiated by GameEngine and GameWorld for feed generation.
 */
export class FeedGenerator extends EventEmitter {
  private llm?: BabylonLLMClient;
  private actorStates: Map<string, ActorState> = new Map();
  private relationships: ActorRelationship[] | ActorConnection[] = [];
  private relationshipContextCache: Map<string, string> = new Map(); // Cache relationship prompts
  private organizations: Organization[] = [];
  private actorGroupContexts: Map<string, string> = new Map();
  private worldContext: WorldContext | null = null;
  private _npcPersonas: Map<
    string,
    {
      reliability: number;
      insiderOrgs: string[];
      willingToLie: boolean;
      selfInterest: string;
    }
  > = new Map();
  private trendingTopics?: TrendingTopicsEngine;
  private trendContext = '';

  /**
   * Emoji regex pattern for stripping emojis from content.
   * Covers most common emoji Unicode ranges.
   */
  private static readonly EMOJI_REGEX =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;

  /**
   * Apply post-processing to generated content.
   *
   * Performs multiple cleanup operations:
   * 1. Strips hashtags (LLMs tend to add them despite instructions)
   * 2. Strips emojis (same issue)
   * 3. Normalizes whitespace (multiple spaces → single space)
   * 4. Replaces real names with parody names via character mapping
   *
   * @param content - Generated content to process
   * @returns Cleaned content with hashtags/emojis removed and names fixed
   */
  private async postProcessContent(content: string): Promise<string> {
    let processed = content;

    // 1. Strip hashtags (LLMs love to add them despite instructions)
    const hashtagMatches = processed.match(/#\w+/g);
    if (hashtagMatches && hashtagMatches.length > 0) {
      logger.debug(
        `Stripping ${hashtagMatches.length} hashtag(s) from content`,
        { hashtags: hashtagMatches.join(', ') },
        'FeedGenerator'
      );
      processed = processed.replace(/#\w+/g, '');
    }

    // 2. Strip emojis
    const emojiMatches = processed.match(FeedGenerator.EMOJI_REGEX);
    if (emojiMatches && emojiMatches.length > 0) {
      logger.debug(
        `Stripping ${emojiMatches.length} emoji(s) from content`,
        { emojis: emojiMatches.join('') },
        'FeedGenerator'
      );
      processed = processed.replace(FeedGenerator.EMOJI_REGEX, '');
    }

    // 3. Normalize whitespace (multiple spaces → single space)
    processed = processed.replace(/\s+/g, ' ').trim();

    // 4. Replace real names with parody names (existing functionality)
    const transformed = await characterMappingService.transformText(processed);
    if (transformed.replacementCount > 0) {
      logger.warn(
        `Fixed ${transformed.replacementCount} real name(s) in generated content`,
        {
          original: content.substring(0, 100),
          fixed: transformed.transformedText.substring(0, 100),
        },
        'FeedGenerator'
      );
    }

    return transformed.transformedText;
  }

  /**
   * Validate post content and return validation result.
   *
   * Used to check if generated content passes all validation rules
   * before accepting it. Logs violations for monitoring.
   *
   * @param content - Post content to validate
   * @param postType - Type of post (determines character limit)
   * @returns Validation result with isValid flag and cleanContent
   */
  private validatePostContent(
    content: string,
    postType: keyof typeof CHARACTER_LIMITS
  ): { isValid: boolean; cleanContent: string; violations: string[] } {
    const result = validateFeedPost(content, {
      maxLength: CHARACTER_LIMITS[postType],
      postType,
    });

    if (!result.isValid) {
      logger.warn('Post validation failed', {
        violations: result.violations,
        postType,
        contentPreview: content.substring(0, 100),
      });
    }

    return {
      isValid: result.isValid,
      cleanContent: content,
      violations: result.violations,
    };
  }

  /**
   * Create a new FeedGenerator
   *
   * @param llm - Optional LLM client for content generation
   *
   * @description
   * If LLM is not provided, generation methods will return empty arrays or throw.
   * In production, always provide an LLM client.
   */
  constructor(llm?: BabylonLLMClient) {
    super();
    this.llm = llm;
  }

  /**
   * Set trending topics engine
   *
   * @param engine - TrendingTopicsEngine instance
   *
   * @description
   * Sets the trending topics engine for accessing current trends in feed generation.
   * Trends are added to actor context automatically.
   *
   * @usage
   * Called once by GameEngine during initialization.
   *
   * @example
   * ```typescript
   * const trends = new TrendingTopicsEngine(llm);
   * feed.setTrendingTopics(trends);
   * ```
   */
  setTrendingTopics(engine: TrendingTopicsEngine) {
    this.trendingTopics = engine;
  }

  /**
   * Update trend context (call before feed generation)
   *
   * @description
   * Fetches current trending topics and updates internal context string.
   * This context is automatically added to all actor prompts.
   *
   * @usage
   * Called by GameEngine before each tick's feed generation.
   *
   * @throws Never throws - returns safe default if trending engine not set
   */
  updateTrendContext() {
    if (!this.trendingTopics) {
      // Safe default - compact format
      this.trendContext = 'TRENDING TOPICS: (not initialized)';
      return;
    }

    const context = this.trendingTopics.getDetailedTrendContext();

    // Validate context is never empty
    if (!context || context.trim().length === 0) {
      throw new Error(
        'TrendingTopicsEngine returned empty context - this should never happen'
      );
    }

    this.trendContext = context;
  }

  /**
   * Set actor group chat contexts
   *
   * @param contexts - Map of actorId to group chat context string
   *
   * @description
   * Group chat context includes all groups the actor is in plus recent messages.
   * This context influences their public posts (e.g., "my sources say...").
   *
   * @usage
   * Called by GameEngine before each feed generation.
   *
   * @example
   * ```typescript
   * const contexts = new Map([
   *   ['actor-1', 'Member of: Tech Insiders, Wall Street Pros\nRecent: "Merger looking good"'],
   *   ['actor-2', 'Member of: Political Circle\nRecent: "Investigation ongoing"']
   * ]);
   * feed.setActorGroupContexts(contexts);
   * ```
   */
  setActorGroupContexts(contexts: Map<string, string>) {
    this.actorGroupContexts = contexts;
  }

  /**
   * Set organizations for this game
   *
   * @param organizations - Array of all game organizations
   *
   * @description
   * Organizations include media companies, tech companies, government agencies, etc.
   * Used for generating company responses and determining affiliations.
   *
   * @usage
   * Called once during GameEngine initialization.
   */
  setOrganizations(organizations: Organization[]) {
    this.organizations = organizations || [];
  }

  /**
   * Set NPC personas for consistent behavior
   *
   * @param personas - Map of actorId to persona assignment
   *
   * @description
   * NPC personas define reliability, insider knowledge, and deception tendencies.
   * Used to create consistent behavior patterns that agents can learn.
   *
   * **Persona Effects:**
   * - High reliability NPCs are more accurate in their posts
   * - Insiders have access to non-public information
   * - Deceivers will lie strategically for self-interest
   * - Biases influence post tone and sentiment
   *
   * @usage
   * Called once during GameGenerator initialization.
   *
   * @example
   * ```typescript
   * const personas = personaGenerator.assignPersonas(actors, orgs);
   * feed.setNPCPersonas(personas);
   * ```
   */
  setNPCPersonas(
    personas: Map<
      string,
      {
        reliability: number;
        insiderOrgs: string[];
        willingToLie: boolean;
        selfInterest: string;
      }
    >
  ) {
    this._npcPersonas = personas;
  }

  /**
   * Set actor emotional states for current day
   *
   * @param states - Map of actorId to emotional state (mood, luck)
   *
   * @description
   * Actor states are updated daily based on events and trading outcomes.
   * These states influence post tone, sentiment, and content.
   *
   * @usage
   * Called by GameEngine each day before feed generation.
   *
   * @example
   * ```typescript
   * const states = new Map([
   *   ['actor-1', { mood: 0.8, luck: 'high' }],
   *   ['actor-2', { mood: -0.5, luck: 'low' }]
   * ]);
   * feed.setActorStates(states);
   * ```
   */
  setActorStates(states: Map<string, ActorState>) {
    this.actorStates = states;
  }

  /**
   * Set relationships between actors
   *
   * @param relationships - Array of actor relationships (supports both formats)
   *
   * @description
   * Relationships affect how actors reference each other in posts and reactions.
   * Supports both ActorRelationship (new) and deprecated ActorConnection formats
   * for backward compatibility.
   *
   * **Relationship Effects:**
   * - Rivals: Critical, competitive posts
   * - Allies: Supportive, collaborative posts
   * - Neutral: Objective, balanced posts
   *
   * @usage
   * Called once during GameEngine initialization and updated as relationships evolve.
   */
  setRelationships(relationships: ActorRelationship[] | ActorConnection[]) {
    this.relationships = relationships;
    // Clear cache when relationships are updated
    this.relationshipContextCache.clear();
  }

  /**
   * Get relationship context from database for an actor (cached and efficient)
   * Returns simple text list for direct prompt injection
   */
  async getActorRelationships(actorId: string): Promise<string> {
    // Check cache first (efficient - no database query)
    if (this.relationshipContextCache.has(actorId)) {
      return this.relationshipContextCache.get(actorId)!;
    }

    // Fetch from database (only if not cached)
    const engine = new RelationshipEvolutionEngine();
    const context = await engine.getRelationshipContextForActor(actorId);

    // Cache it (subsequent calls are instant)
    this.relationshipContextCache.set(actorId, context);

    return context;
  }

  /**
   * Generate complete feed for a game day
   *
   * @param day - Game day number (1-30)
   * @param worldEvents - Events that occurred this day
   * @param allActors - All game actors
   * @returns Array of feed posts sorted chronologically
   *
   * @description
   * Generates a full day's worth of social media activity by creating cascading
   * reactions to world events. Simulates realistic information flow where events
   * trigger media coverage, reactions, analysis, and discussions.
   *
   * **Information Cascade (Like Real Social Media):**
   * 1. **Event Occurs** - WorldEvent happens (players never see directly)
   * 2. **Media Breaks Story** - Journalists and news orgs report
   * 3. **Involved Parties React** - Defensive if bad, celebratory if good
   * 4. **Companies Respond** - PR statements from affiliated orgs
   * 5. **Experts Analyze** - Outside commentators weigh in
   * 6. **Conspiracy Theories** - Contrarians spin wild narratives
   * 7. **Threads Develop** - Replies and conversations emerge
   * 8. **Ambient Noise** - Unrelated posts throughout the day
   *
   * **Generation Process:**
   * - For each event: Generate full cascade (2-4 batched LLM calls)
   * - Add ambient posts for each hour (24 batched LLM calls)
   * - Generate replies to 30-50% of posts (batched)
   * - Sort by timestamp for chronological feed
   *
   * **Batching Optimization:**
   * - Event cascade: 4-5 LLM calls (vs 10-15 individual)
   * - Ambient: 24 calls (vs 200+ individual)
   * - Total: ~200 calls per game (vs 2000+)
   * - 90% cost reduction, same quality
   *
   * **Content Quality:**
   * - 100% LLM-generated (no templates)
   * - Per-actor context preserved in batches
   * - Mood, luck, relationships affect content
   * - Group chat insights reflected in posts
   *
   * **Outcome Parameter:**
   * Used for narrative coherence and atmospheric context, not for determining
   * event truthfulness (events have their own pointsToward values).
   *
   * @example
   * ```typescript
   * const posts = await feed.generateDayFeed(
   *   15, // Day 15
   *   [event1, event2, event3], // World events
   *   allActors,
   *   true // Outcome is YES (for narrative coherence)
   * );
   *
   * console.log(`Generated ${posts.length} posts for Day 15`);
   *
   * // Posts are sorted chronologically
   * posts.forEach(post => {
   *   console.log(`${post.timestamp}: @${post.authorName} - ${post.content}`);
   * });
   * ```
   */
  async generateDayFeed(
    day: number,
    worldEvents: WorldEvent[],
    allActors: Actor[]
  ): Promise<FeedPost[]> {
    // Validate inputs using canonical validator (fail-fast)
    ContentValidator.validateDayNumber(day, 'generateDayFeed');
    ContentValidator.validateNotEmpty(
      allActors,
      'allActors in generateDayFeed'
    );

    const feed: FeedPost[] = [];

    // Generate world context once per day for all prompts
    this.worldContext = await generateWorldContext({ maxActors: 50 });

    // Derive outcome from events for narrative coherence (not from parameter)
    // Uses majority of event hints to determine overall direction
    const yesEvents = worldEvents.filter(
      (e) => e.pointsToward === 'YES'
    ).length;
    const noEvents = worldEvents.filter((e) => e.pointsToward === 'NO').length;
    const derivedOutcome = yesEvents > noEvents;

    try {
      // For each world event, generate cascading reactions
      for (let eventIndex = 0; eventIndex < worldEvents.length; eventIndex++) {
        const worldEvent = worldEvents[eventIndex];
        if (!worldEvent) continue; // Skip if event doesn't exist
        const eventFeed = await this.generateEventCascade(
          day,
          worldEvent,
          allActors,
          derivedOutcome,
          eventIndex
        );
        feed.push(...eventFeed);
      }

      // Add some standalone commentary unrelated to specific events
      const ambientNoise = await this.generateAmbientFeed(
        day,
        allActors,
        derivedOutcome
      );
      feed.push(...ambientNoise);

      // Generate replies (30-50% of existing posts get replies)
      const replies = await this.generateReplies(day, feed, allActors);
      feed.push(...replies);

      // Generate reposts (10-20% of existing posts get reposted)
      const reposts = await this.generateReposts(day, feed, allActors);
      feed.push(...reposts);

      // Sort by timestamp for realistic feed flow
      return feed.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } finally {
      // Clear world context after generation
      this.worldContext = null;
    }
  }

  /**
   * Generate cascading feed posts for a single world event
   * Information cascade: News Break → Direct Reactions → Analysis → Conspiracy → Threads
   * OPTIMIZED: Uses batched LLM calls (10-15 calls → 4-5 calls per event)
   */
  private async generateEventCascade(
    day: number,
    worldEvent: WorldEvent,
    allActors: Actor[],
    outcome: boolean,
    eventIndex = 0
  ): Promise<FeedPost[]> {
    const cascade: FeedPost[] = [];
    const baseTime = `2025-10-${String(day).padStart(2, '0')}T`;
    // Offset hours based on event index so each event's posts are at different times
    const baseHourOffset = eventIndex * 4; // Events spaced 4 hours apart

    // 1. MEDIA ORGANIZATIONS BREAK THE STORY (if public event) - BATCHED
    if (
      worldEvent.visibility === 'public' ||
      worldEvent.visibility === 'leaked'
    ) {
      const mediaOrgs = this.organizations
        .filter((o) => o.type === 'media')
        .slice(0, 2);
      const journalists = allActors
        .filter(
          (a) => a.domain?.includes('media') || a.domain?.includes('journalism')
        )
        .slice(0, 1);

      // ✅ BATCH: All media + journalists in ONE call
      const allMediaActors = [...mediaOrgs, ...journalists];
      if (allMediaActors.length > 0) {
        const mediaPosts = await this.generateMediaPostsBatch(
          allMediaActors,
          worldEvent,
          allActors,
          outcome
        );

        mediaPosts.forEach((post, i) => {
          const isOrg = i < mediaOrgs.length;
          const entity = isOrg
            ? mediaOrgs[i]
            : journalists[i - mediaOrgs.length];
          if (!entity) return; // Skip if entity doesn't exist

          // Fail-fast: Validate required fields using canonical validator
          ContentValidator.validatePostContent(
            post.post,
            `media post from ${entity.name}`
          );
          ContentValidator.validateEntityName(entity.name, `media entity ${i}`);

          cascade.push({
            id: `${worldEvent.id}-${isOrg ? 'media' : 'news'}-${i}`,
            day,
            timestamp: `${baseTime}${String((9 + baseHourOffset + i * 2) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
            type: 'news',
            content: post.post,
            author: entity.id,
            authorName: entity.name,
            relatedEvent: worldEvent.id,
            sentiment: post.sentiment ?? 0,
            clueStrength: post.clueStrength ?? 0,
            pointsToward: post.pointsToward ?? null,
          });
        });
      }
    }

    // 2. INVOLVED PARTIES REACT - BATCHED
    const involvedActors = worldEvent.actors
      .map((id) => allActors.find((a) => a.id === id))
      .filter((a): a is Actor => a !== undefined);

    if (involvedActors.length > 0) {
      // ✅ BATCH: All reactions in ONE call
      const reactions = await this.generateReactionsBatch(
        involvedActors,
        worldEvent,
        outcome
      );

      // Collect companies that need to respond
      const companiesToRespond: Array<{
        company: Organization;
        actor: Actor;
        index: number;
      }> = [];

      reactions.forEach((reaction, i) => {
        const actor = involvedActors[i];
        if (!actor) return; // Skip if actor doesn't exist

        cascade.push({
          id: `${worldEvent.id}-reaction-${actor.id}`,
          day,
          timestamp: `${baseTime}${String((12 + baseHourOffset + i * 3) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
          type: 'reaction',
          content: reaction.post,
          author: actor.id,
          authorName: actor.name,
          relatedEvent: worldEvent.id,
          sentiment: reaction.sentiment,
          clueStrength: reaction.clueStrength,
          pointsToward: reaction.pointsToward,
        });

        // Collect company affiliations for batch processing
        if (actor.affiliations) {
          const affiliatedCompanies = this.organizations
            .filter(
              (o) => o.type === 'company' && actor.affiliations?.includes(o.id)
            )
            .slice(0, 1); // Usually just one company responds per actor

          affiliatedCompanies.forEach((company) => {
            companiesToRespond.push({ company, actor, index: i });
          });
        }
      });

      // Process company responses (usually 0-2 per event, so batching would be minimal gain)
      // Using sequential processing to maintain proper async/await
      for (const { company, actor, index: i } of companiesToRespond) {
        const companyPost = await this.generateCompanyPost(
          company,
          worldEvent,
          actor,
          outcome
        );

        cascade.push({
          id: `${worldEvent.id}-company-${company.id}`,
          day,
          timestamp: `${baseTime}${String((13 + baseHourOffset + i * 3) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
          type: 'reaction',
          content: companyPost.post,
          author: company.id,
          authorName: company.name,
          relatedEvent: worldEvent.id,
          sentiment: companyPost.sentiment,
          clueStrength: companyPost.clueStrength,
          pointsToward: companyPost.pointsToward,
        });
      }
    }

    // 2b. GOVERNMENT RESPONSES (if applicable) - Single call, usually 0-1 per event
    if (worldEvent.type === 'scandal' || worldEvent.type === 'revelation') {
      const govOrgs = this.organizations
        .filter((o) => o.type === 'government')
        .slice(0, 1);

      for (const gov of govOrgs) {
        const govPost = await this.generateGovernmentPost(
          gov,
          worldEvent,
          allActors,
          outcome
        );

        cascade.push({
          id: `${worldEvent.id}-govt-${gov.id}`,
          day,
          timestamp: `${baseTime}${String((15 + baseHourOffset) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
          type: 'reaction',
          content: govPost.post,
          author: gov.id,
          authorName: gov.name,
          relatedEvent: worldEvent.id,
          sentiment: govPost.sentiment,
          clueStrength: govPost.clueStrength,
          pointsToward: govPost.pointsToward,
        });
      }
    }

    // 3. EXPERTS AND COMMENTATORS - BATCHED
    const commentators = allActors
      .filter(
        (a) =>
          !worldEvent.actors.includes(a.id) && // Not directly involved
          (a.domain?.includes('tech') ||
            a.domain?.includes('policy') ||
            a.role === 'supporting')
      )
      .slice(0, 2);

    if (commentators.length > 0) {
      // ✅ BATCH: All commentary in ONE call
      const commentary = await this.generateCommentaryBatch(
        commentators,
        worldEvent
      );

      commentary.forEach((post, i) => {
        const commentator = commentators[i];
        if (!commentator) return; // Skip if commentator doesn't exist

        cascade.push({
          id: `${worldEvent.id}-expert-${i}`,
          day,
          timestamp: `${baseTime}${String((14 + baseHourOffset + i * 2) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
          type: 'reaction',
          content: post.post,
          author: commentator.id,
          authorName: commentator.name,
          relatedEvent: worldEvent.id,
          sentiment: post.sentiment,
          clueStrength: post.clueStrength,
          pointsToward: post.pointsToward,
        });
      });
    }

    // 4. CONSPIRACISTS AND CONTRARIANS - BATCHED
    const conspiracists = allActors
      .filter(
        (a) =>
          a.personality?.includes('contrarian') ||
          a.personality?.includes('paranoid') ||
          a.description?.toLowerCase().includes('conspiracy')
      )
      .slice(0, 1 + Math.floor(Math.random() * 2)); // 1-2 conspiracy posts

    if (conspiracists.length > 0) {
      // ✅ BATCH: All conspiracy posts in ONE call
      const conspiracyPosts = await this.generateConspiracyPostsBatch(
        conspiracists,
        worldEvent
      );

      conspiracyPosts.forEach((post, i) => {
        const actor = conspiracists[i % conspiracists.length];
        if (actor) {
          cascade.push({
            id: `${worldEvent.id}-conspiracy-${i}`,
            day,
            timestamp: `${baseTime}${String((16 + baseHourOffset + i * 3) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
            type: 'reaction',
            content: post.post,
            author: actor.id,
            authorName: actor.name,
            relatedEvent: worldEvent.id,
            sentiment: post.sentiment,
            clueStrength: post.clueStrength,
            pointsToward: post.pointsToward,
          });
        }
      });
    }

    // 5. THREAD DEVELOPMENT - BATCHED
    if (cascade.length >= 2) {
      const thread = await this.generateThread(day, cascade, allActors);
      cascade.push(...thread);
    }

    return cascade;
  }

  /**
   * BATCHED: Generate media posts for multiple organizations/journalists in ONE call
   * Reduces N calls → 1 call
   *
   * @description
   * Generates media posts WITHOUT knowing predetermined outcome.
   * Uses event hints for framing.
   */
  private async generateMediaPostsBatch(
    mediaEntities: (Organization | Actor)[],
    worldEvent: WorldEvent,
    allActors: Actor[],
    outcome: boolean
  ): Promise<
    Array<{
      post: string;
      sentiment: number;
      clueStrength: number;
      pointsToward: boolean | null;
    }>
  > {
    if (!this.llm || mediaEntities.length === 0) {
      return [];
    }

    const potentialSource = allActors.find((a) =>
      worldEvent.actors.includes(a.id)
    );

    // Format variables for prompt template
    const sourceContext = potentialSource
      ? `Sources close to ${potentialSource.name} leaked information.`
      : '';

    // Frame based on event hint, enhanced with outcome knowledge for subtle guidance
    const baseFrame =
      worldEvent.pointsToward === 'YES'
        ? 'Frame with positive spin on this development'
        : worldEvent.pointsToward === 'NO'
          ? 'Emphasize problems and concerns'
          : 'Report objectively - implications unclear';

    // Use outcome to add subtle directional guidance without being explicit
    const outcomeFrame = outcome
      ? `${baseFrame}. The underlying trend suggests positive momentum, but report objectively without stating conclusions.`
      : `${baseFrame}. The underlying trend suggests challenges ahead, but report objectively without stating conclusions.`;

    const mediaList = mediaEntities
      .map((entity, i) => {
        const isOrg = 'type' in entity && entity.type === 'media';
        const voiceContext = formatActorVoiceContext(entity);
        let emotionalContext = '';
        let personaContext = '';

        if (!isOrg && 'id' in entity) {
          const state = this.actorStates.get(entity.id);
          emotionalContext = state
            ? '\n   ' +
              generateActorContext(
                state.mood,
                state.luck,
                undefined,
                this.relationships,
                entity.id
              ).replace(/\n/g, '\n   ')
            : '';

          const persona = this._npcPersonas.get(entity.id);
          if (persona) {
            personaContext = `\n   Reliability: ${(persona.reliability * 100).toFixed(0)}%`;
            if (persona.insiderOrgs.length > 0) {
              personaContext += ` | Insider at: ${persona.insiderOrgs.join(', ')}`;
            }
          }
        }

        return `${i + 1}. ${entity.name}
   About: ${entity.description}
   ${isOrg ? 'Style: Media organization - use "Breaking:", "Exclusive:", "Sources say:"' : 'Style: Journalist - more objective reporting'}${voiceContext}${emotionalContext}${personaContext}
   Max 280 chars, provocative and attention-grabbing. Match your writing style.
   NO hashtags or emojis.`;
      })
      .join('\n');

    const prompt = renderPrompt(newsPosts, {
      eventDescription:
        worldEvent.description || worldEvent.type || 'Event occurred',
      eventType: worldEvent.type || 'development',
      sourceContext: sourceContext || '',
      outcomeFrame: outcomeFrame || 'Report objectively',
      mediaCount: mediaEntities.length.toString(),
      mediaList: mediaList || '',
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(newsPosts);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<{
        posts: Array<{
          post?: string;
          tweet?: string;
          sentiment: number;
          clueStrength: number;
          pointsToward: boolean | null;
        }>;
      }>(
        prompt,
        undefined, // Don't validate schema to handle various response formats
        { ...params, promptType: 'feed_generate_news_posts_batch' }
      );

      if (!response) {
        logger.warn(
          `LLM returned null/undefined media response (attempt ${attempt + 1}/${maxRetries})`,
          undefined,
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Check if response is valid object
      if (typeof response !== 'object' || response === null) {
        logger.warn(
          `LLM returned non-object media response (attempt ${attempt + 1}/${maxRetries})`,
          { type: typeof response },
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Log raw response structure on first attempt for monitoring
      if (attempt === 0) {
        logger.info(
          'Media batch raw response structure',
          {
            hasResponse: !!response,
            hasPosts: 'posts' in response,
            postsType: (response as { posts?: unknown }).posts
              ? typeof (response as { posts?: unknown }).posts
              : 'undefined',
            isArray: Array.isArray((response as { posts?: unknown }).posts),
            sampleKeys: response ? Object.keys(response).slice(0, 5) : [],
          },
          'FeedGenerator'
        );
      }

      // Handle XML nested structure: { posts: [...] } or { posts: { post: [...] } } or { response: { posts: {...} } }
      type PostItem = {
        post?: string;
        tweet?: string;
        content?: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      };
      let posts: PostItem[] = [];

      // Check if wrapped in response object first
      const responseData =
        'response' in response &&
        response.response &&
        typeof response.response === 'object'
          ? (response.response as {
              posts?: PostItem[] | { post: PostItem[] | PostItem };
            })
          : response;

      if ('posts' in responseData && responseData.posts) {
        if (Array.isArray(responseData.posts)) {
          posts = responseData.posts;
        } else if (
          typeof responseData.posts === 'object' &&
          'post' in responseData.posts
        ) {
          const nested = responseData.posts.post;
          posts = Array.isArray(nested) ? nested : [nested];
        } else {
          // Log unexpected response structure for monitoring
          logger.warn(
            'Unexpected posts structure',
            {
              type: typeof responseData.posts,
              keys: Object.keys(responseData.posts),
            },
            'FeedGenerator'
          );
        }
      } else {
        logger.warn(
          'Response has no posts field',
          {
            responseKeys: Object.keys(responseData),
            hasResponse: 'response' in response,
          },
          'FeedGenerator'
        );
      }

      // Log post structure for monitoring
      if (attempt === 0 && posts.length > 0) {
        logger.info(
          'Sample post structure',
          {
            postKeys: Object.keys(posts[0] || {}),
            hasPost: 'post' in (posts[0] || {}),
            hasTweet: 'tweet' in (posts[0] || {}),
            postValue: typeof (posts[0] as Record<string, unknown>)?.post,
          },
          'FeedGenerator'
        );
      }

      // Type helper for posts that may have different content field names
      type PostWithContent = {
        post?: string;
        tweet?: string;
        content?: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      };

      const validPosts = posts
        .filter((p): p is PostWithContent => {
          // Handle various content field names: post, tweet, or content
          const content = p.post || p.tweet || p.content;
          return Boolean(
            content && typeof content === 'string' && content.trim().length > 0
          );
        })
        .map((p) => ({
          post: p.post || p.tweet || p.content!,
          sentiment: p.sentiment ?? 0,
          clueStrength: p.clueStrength ?? 0.5,
          pointsToward: p.pointsToward ?? null,
        }));

      // Apply post-processing (hashtag/emoji stripping, name mapping) and validation
      const processedPosts = await Promise.all(
        validPosts.map(async (p) => {
          const processedPost = await this.postProcessContent(p.post);
          const validation = this.validatePostContent(processedPost, 'JOURNALIST');
          return {
            post: validation.cleanContent,
            sentiment: p.sentiment,
            clueStrength: p.clueStrength,
            pointsToward: p.pointsToward,
            isValid: validation.isValid,
            violations: validation.violations,
          };
        })
      );

      // Check if any posts failed validation
      const invalidPosts = processedPosts.filter((p) => !p.isValid);
      if (invalidPosts.length > 0) {
        const violationCount = invalidPosts.reduce(
          (sum, p) => sum + p.violations.length,
          0
        );
        logger.warn(
          `Validation failed for ${invalidPosts.length} media post(s) (attempt ${attempt + 1}/${maxRetries})`,
          {
            violations: invalidPosts.flatMap((p) => p.violations),
            violationCount,
            attempt: attempt + 1,
          },
          'FeedGenerator'
        );

        // Retry if we haven't exhausted attempts
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Filter to only valid posts
      const validProcessedPosts = processedPosts
        .filter((p) => p.isValid)
        .map((p) => ({
          post: p.post,
          sentiment: p.sentiment,
          clueStrength: p.clueStrength,
          pointsToward: p.pointsToward,
        }));

      const minRequired = Math.ceil(mediaEntities.length * 0.5);

      if (validProcessedPosts.length >= minRequired) {
        // Limit to requested count to match with entities
        return validProcessedPosts.slice(0, mediaEntities.length);
      }

      logger.warn(
        `Invalid media batch (attempt ${attempt + 1}/${maxRetries}). Expected ${mediaEntities.length}, got ${validProcessedPosts.length} valid (need ${minRequired}+). Posts array length: ${posts.length}`,
        {
          attempt: attempt + 1,
          maxRetries,
          expected: mediaEntities.length,
          got: validProcessedPosts.length,
          minRequired,
          postsReceived: posts.length,
        },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(
      `Failed to generate media posts batch after ${maxRetries} attempts`
    );
  }

  /**
   * BATCHED: Generate reactions for multiple actors in ONE call
   * Preserves per-actor context (mood, luck, personality)
   * Uses ONLY worldEvent.pointsToward hint - no predetermined outcome knowledge
   *
   * @description
   * Generates reactions WITHOUT knowing question outcomes.
   * Actors react based on event hints and their own context/bias.
   */
  private async generateReactionsBatch(
    actors: Actor[],
    worldEvent: WorldEvent,
    outcome: boolean
  ): Promise<
    Array<{
      post: string;
      sentiment: number;
      clueStrength: number;
      pointsToward: boolean | null;
    }>
  > {
    if (!this.llm || actors.length === 0) {
      return [];
    }

    const actorContexts = actors.map((actor) => {
      const state = this.actorStates.get(actor.id);
      const emotionalContext = state
        ? generateActorContext(
            state.mood,
            state.luck,
            undefined,
            this.relationships,
            actor.id
          )
        : '';

      return {
        actor,
        emotionalContext,
      };
    });

    // Use event's explicit hint, enhanced with outcome knowledge for subtle guidance
    const baseEventContext = worldEvent.pointsToward
      ? `This development suggests things are trending toward ${worldEvent.pointsToward}.`
      : 'The implications of this development are uncertain. React based on your own perspective and biases.';

    // Add subtle outcome-based context without being explicit
    const outcomeContext = outcome
      ? ' The broader context suggests positive momentum, but react based on your own analysis and biases.'
      : ' The broader context suggests challenges ahead, but react based on your own analysis and biases.';

    const eventContext = baseEventContext + outcomeContext;

    const actorsList = actorContexts
      .map((ctx, i) => {
        const persona = this._npcPersonas.get(ctx.actor.id);

        // Add persona context if available
        let personaContext = '';
        if (persona) {
          const reliabilityPct = (persona.reliability * 100).toFixed(0);
          personaContext = `\n   PERSONA: Reliability ${reliabilityPct}%`;

          if (persona.insiderOrgs.length > 0) {
            personaContext += ` | Insider at: ${persona.insiderOrgs.join(', ')}`;
          }

          if (persona.willingToLie) {
            personaContext += ` | Strategic: Will deceive for ${persona.selfInterest}`;
          }
        }

        return `${i + 1}. You are ${ctx.actor.name}: ${ctx.actor.description}
   Affiliated: ${ctx.actor.affiliations?.join(', ') || 'independent'}
   ${ctx.emotionalContext}${formatActorVoiceContext(ctx.actor)}
   ${personaContext}
   ${this.actorGroupContexts.get(ctx.actor.id) || ''}

   React to event. Your private group chats inform your perspective.
   ${persona?.willingToLie ? 'You may lie or mislead if it benefits your ' + persona.selfInterest + '.' : ''}
   Write as YOURSELF (first person). Max 280 chars. No hashtags/emojis.`;
      })
      .join('\n');

    const prompt = renderPrompt(reactions, {
      eventDescription:
        worldEvent.description || worldEvent.type || 'Event occurred',
      eventContext: eventContext || 'React to this development',
      actorCount: actors.length.toString(),
      actorsList: actorsList || '',
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(reactions);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<{
        reactions: Array<{
          post?: string;
          tweet?: string;
          sentiment: number;
          clueStrength: number;
          pointsToward: boolean | null;
        }>;
      }>(
        prompt,
        undefined, // Don't validate schema to handle various response formats
        { ...params, promptType: 'feed_generate_reactions_batch' }
      );

      if (!response) {
        logger.warn(
          `LLM returned null/undefined reactions response (attempt ${attempt + 1}/${maxRetries})`,
          undefined,
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Handle XML nested structure: { reactions: [...] } or { reactions: { reaction: [...] } } or { response: { reactions: {...} } }
      type ReactionItem = {
        post?: string;
        tweet?: string;
        content?: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      };
      let reactions: ReactionItem[] = [];

      // Check if wrapped in response object first
      const responseData =
        'response' in response &&
        response.response &&
        typeof response.response === 'object'
          ? (response.response as {
              reactions?:
                | ReactionItem[]
                | { reaction: ReactionItem[] | ReactionItem };
            })
          : response;

      if ('reactions' in responseData && responseData.reactions) {
        if (Array.isArray(responseData.reactions)) {
          reactions = responseData.reactions;
        } else if (
          typeof responseData.reactions === 'object' &&
          'reaction' in responseData.reactions
        ) {
          const nested = responseData.reactions.reaction;
          reactions = Array.isArray(nested) ? nested : [nested];
        }
      }

      const filteredReactions = reactions
        .filter((r): r is ReactionItem => {
          // Handle various content field names: post, tweet, or content
          const content = r.post || r.tweet || r.content;
          return Boolean(
            content && typeof content === 'string' && content.trim().length > 0
          );
        })
        .map((r) => ({
          post: r.post || r.tweet || r.content || '',
          sentiment: r.sentiment ?? 0,
          clueStrength: r.clueStrength ?? 0.5,
          pointsToward: r.pointsToward ?? null,
        }));

      // Apply post-processing (hashtag/emoji stripping, name mapping) and validation
      const processedReactions = await Promise.all(
        filteredReactions.map(async (r) => {
          const processedPost = await this.postProcessContent(r.post);
          const validation = this.validatePostContent(processedPost, 'REACTION');
          return {
            post: validation.cleanContent,
            sentiment: r.sentiment,
            clueStrength: r.clueStrength,
            pointsToward: r.pointsToward,
            isValid: validation.isValid,
            violations: validation.violations,
          };
        })
      );

      // Check if any posts failed validation
      const invalidReactions = processedReactions.filter((r) => !r.isValid);
      if (invalidReactions.length > 0) {
        const violationCount = invalidReactions.reduce(
          (sum, r) => sum + r.violations.length,
          0
        );
        logger.warn(
          `Validation failed for ${invalidReactions.length} reaction(s) (attempt ${attempt + 1}/${maxRetries})`,
          {
            violations: invalidReactions.flatMap((r) => r.violations),
            violationCount,
            attempt: attempt + 1,
          },
          'FeedGenerator'
        );

        // Retry if we haven't exhausted attempts
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Filter to only valid reactions
      const validReactions = processedReactions
        .filter((r) => r.isValid)
        .map((r) => ({
          post: r.post,
          sentiment: r.sentiment,
          clueStrength: r.clueStrength,
          pointsToward: r.pointsToward,
        }));

      const minRequired = Math.ceil(actors.length * 0.5);

      if (validReactions.length >= minRequired) {
        // Limit to requested count to match with actors
        return validReactions.slice(0, actors.length);
      }

      logger.warn(
        `Invalid reactions batch (attempt ${attempt + 1}/${maxRetries}). Expected ${actors.length}, got ${validReactions.length} valid (need ${minRequired}+)`,
        {
          attempt: attempt + 1,
          maxRetries,
          expected: actors.length,
          got: validReactions.length,
          minRequired,
        },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(
      `Failed to generate reactions batch after ${maxRetries} attempts`
    );
  }

  /**
   * BATCHED: Generate commentary for multiple experts in ONE call
   *
   * @description
   * Generates expert commentary WITHOUT knowing predetermined outcome.
   * Uses event hints and expert bias/mood for framing.
   */
  private async generateCommentaryBatch(
    commentators: Actor[],
    worldEvent: WorldEvent
  ): Promise<
    Array<{
      post: string;
      sentiment: number;
      clueStrength: number;
      pointsToward: boolean | null;
    }>
  > {
    if (!this.llm || commentators.length === 0) {
      return [];
    }

    const contexts = commentators.map((actor) => {
      const state = this.actorStates.get(actor.id);
      const emotionalContext = state
        ? generateActorContext(
            state.mood,
            state.luck,
            undefined,
            this.relationships,
            actor.id
          )
        : '';

      return { actor, emotionalContext };
    });

    // Frame based on event hint, not global outcome
    const eventGuidance =
      worldEvent.pointsToward === 'YES'
        ? 'This development appears positive - lean optimistic'
        : worldEvent.pointsToward === 'NO'
          ? 'This development raises concerns - lean skeptical'
          : 'Analyze objectively - implications unclear';

    const commentatorsList = contexts
      .map((ctx, i) => {
        const persona = this._npcPersonas.get(ctx.actor.id);

        let personaContext = '';
        if (persona) {
          personaContext = `\n   Reliability: ${(persona.reliability * 100).toFixed(0)}%`;
          const expertise = (persona as { expertise?: string[] }).expertise;
          if (expertise && expertise.length > 0) {
            personaContext += ` | Expert in: ${expertise.join(', ')}`;
          }
        }

        return `${i + 1}. ${ctx.actor.name}
   About: ${ctx.actor.description}
   Domain: ${ctx.actor.domain?.join(', ')}
   ${ctx.emotionalContext}${formatActorVoiceContext(ctx.actor)}${personaContext}

   Write analysis as outside observer (max 140 chars).
   ${eventGuidance}
   Let mood subtly influence tone. Match your writing style.
   NO hashtags or emojis.`;
      })
      .join('\n');

    const prompt = renderPrompt(commentary, {
      eventDescription:
        worldEvent.description || worldEvent.type || 'Event occurred',
      commentatorCount: commentators.length.toString(),
      commentatorsList: commentatorsList || '',
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(commentary);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<CommentaryResponse>(
        prompt,
        undefined, // Don't validate schema to handle various response formats
        { ...params, promptType: 'feed_generate_commentary_batch' }
      );

      if (!response) {
        logger.warn(
          `LLM returned null/undefined commentary response (attempt ${attempt + 1}/${maxRetries})`,
          undefined,
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Handle XML nested structure: { commentary: [...] } or { commentary: { comment: [...] } } or { response: { commentary: {...} } }
      let commentary: CommentaryPost[] = [];

      // Check if wrapped in response object first
      const responseData =
        'response' in response &&
        response.response &&
        typeof response.response === 'object'
          ? (response.response as {
              commentary?:
                | CommentaryPost[]
                | { comment: CommentaryPost[] | CommentaryPost };
            })
          : response;

      if ('commentary' in responseData && responseData.commentary) {
        if (Array.isArray(responseData.commentary)) {
          commentary = responseData.commentary;
        } else if (
          typeof responseData.commentary === 'object' &&
          'comment' in responseData.commentary
        ) {
          const nested = responseData.commentary.comment;
          commentary = Array.isArray(nested) ? nested : [nested];
        }
      }

      const filteredCommentary = commentary
        .filter((c) => {
          if (typeof c !== 'object' || c === null) return false;
          // Handle various content field names: post, tweet, or content
          const content = c.post || c.tweet || c.content;
          return (
            content !== undefined &&
            typeof content === 'string' &&
            content.trim().length > 0
          );
        })
        .map((c) => ({
          post: c.post || c.tweet || c.content || '',
          sentiment: c.sentiment ?? 0,
          clueStrength: c.clueStrength ?? 0.5,
          pointsToward: c.pointsToward ?? null,
        }));

      // Apply post-processing (hashtag/emoji stripping, name mapping) and validation
      const processedCommentary = await Promise.all(
        filteredCommentary.map(async (c) => {
          const processedPost = await this.postProcessContent(c.post);
          const validation = this.validatePostContent(processedPost, 'COMMENTARY');
          return {
            post: validation.cleanContent,
            sentiment: c.sentiment,
            clueStrength: c.clueStrength,
            pointsToward: c.pointsToward,
            isValid: validation.isValid,
            violations: validation.violations,
          };
        })
      );

      // Check if any posts failed validation
      const invalidCommentary = processedCommentary.filter((c) => !c.isValid);
      if (invalidCommentary.length > 0) {
        const violationCount = invalidCommentary.reduce(
          (sum, c) => sum + c.violations.length,
          0
        );
        logger.warn(
          `Validation failed for ${invalidCommentary.length} commentary post(s) (attempt ${attempt + 1}/${maxRetries})`,
          {
            violations: invalidCommentary.flatMap((c) => c.violations),
            violationCount,
            attempt: attempt + 1,
          },
          'FeedGenerator'
        );

        // Retry if we haven't exhausted attempts
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Filter to only valid commentary
      const validCommentary = processedCommentary
        .filter((c) => c.isValid)
        .map((c) => ({
          post: c.post,
          sentiment: c.sentiment,
          clueStrength: c.clueStrength,
          pointsToward: c.pointsToward,
        }));

      const minRequired = Math.ceil(commentators.length * 0.5);

      if (validCommentary.length >= minRequired) {
        // Limit to requested count to match with commentators
        return validCommentary.slice(0, commentators.length);
      }

      logger.warn(
        `Invalid commentary batch (attempt ${attempt + 1}/${maxRetries}). Expected ${commentators.length}, got ${validCommentary.length} valid (need ${minRequired}+)`,
        {
          attempt: attempt + 1,
          maxRetries,
          expected: commentators.length,
          got: validCommentary.length,
          minRequired,
        },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(
      `Failed to generate commentary batch after ${maxRetries} attempts`
    );
  }

  /**
   * BATCHED: Generate conspiracy posts for multiple actors in ONE call
   *
   * @description
   * Generates conspiracy theories WITHOUT knowing predetermined outcome.
   * Conspiracy posts often contradict event hints (contrarians).
   */
  private async generateConspiracyPostsBatch(
    conspiracists: Actor[],
    worldEvent: WorldEvent
  ): Promise<
    Array<{
      post: string;
      sentiment: number;
      clueStrength: number;
      pointsToward: boolean | null;
    }>
  > {
    if (!this.llm || conspiracists.length === 0) {
      return [];
    }

    // Conspiracy posts often contradict the event hint (contrarian behavior)
    const conspiracyGuidance =
      worldEvent.pointsToward === 'YES'
        ? "Claim it's a distraction from something worse"
        : worldEvent.pointsToward === 'NO'
          ? "Say they're hiding that it's actually happening"
          : 'Spin your own alternative narrative';

    const conspiracistsList = conspiracists
      .map((actor, i) => {
        const persona = this._npcPersonas.get(actor.id);

        let personaContext = '';
        if (persona) {
          personaContext = `\n   Reliability: ${(persona.reliability * 100).toFixed(0)}% (low - you spread misinformation)`;
          if (persona.willingToLie) {
            personaContext += ` | Motivated by: ${persona.selfInterest}`;
          }
        }

        return `${i + 1}. ${actor.name}
   About: ${actor.description}${formatActorVoiceContext(actor)}${personaContext}

   You don't believe the mainstream narrative.
   Write conspiracy post (max 140 chars).
   Be dramatic, suspicious. Match your writing style.
   NO hashtags or emojis.
   ${conspiracyGuidance}`;
      })
      .join('\n');

    const prompt = renderPrompt(conspiracy, {
      eventDescription:
        worldEvent.description || worldEvent.type || 'Event occurred',
      conspiracistCount: conspiracists.length.toString(),
      conspiracistsList: conspiracistsList || '',
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(conspiracy);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const rawResponse = await this.llm.generateJSON<ConspiracyResponse>(
        prompt,
        undefined, // Don't validate schema, we'll handle both formats
        { ...params, promptType: 'feed_generate_conspiracy_posts_batch' }
      );

      if (!rawResponse) {
        logger.warn(
          `LLM returned null/undefined conspiracy response (attempt ${attempt + 1}/${maxRetries})`,
          undefined,
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return []; // Return empty if failed
      }

      // Handle multiple response formats with proper type narrowing
      let conspiracy: ConspiracyPost[] = [];

      if (rawResponse && typeof rawResponse === 'object') {
        if ('conspiracy' in rawResponse && rawResponse.conspiracy) {
          if (Array.isArray(rawResponse.conspiracy)) {
            // Format 1: Direct array
            conspiracy = rawResponse.conspiracy;
          } else if (typeof rawResponse.conspiracy === 'object') {
            const conspiracyObj = rawResponse.conspiracy as Record<
              string,
              unknown
            >;
            // Format 3: XML nested structure { conspiracy: { theory: [...] } } or { conspiracy: { post: [...] } }
            if ('theory' in conspiracyObj) {
              const nested = conspiracyObj.theory as
                | ConspiracyPost[]
                | ConspiracyPost;
              conspiracy = Array.isArray(nested) ? nested : [nested];
            } else if ('post' in conspiracyObj) {
              const nested = conspiracyObj.post as
                | ConspiracyPost[]
                | ConspiracyPost;
              conspiracy = Array.isArray(nested) ? nested : [nested];
            }
          }
        } else if ('data' in rawResponse && Array.isArray(rawResponse.data)) {
          // Format 2: Wrapped in data array
          conspiracy = rawResponse.data.flatMap((d) => {
            return Array.isArray(d.conspiracy) ? d.conspiracy : [];
          });
        } else if (
          'response' in rawResponse &&
          rawResponse.response &&
          typeof rawResponse.response === 'object'
        ) {
          // Format 4: Wrapped in response { response: { conspiracy: [...] } }
          const responseObj = rawResponse.response as Record<string, unknown>;
          if ('conspiracy' in responseObj && responseObj.conspiracy) {
            if (Array.isArray(responseObj.conspiracy)) {
              conspiracy = responseObj.conspiracy as ConspiracyPost[];
            } else if (typeof responseObj.conspiracy === 'object') {
              const conspiracyObj = responseObj.conspiracy as Record<
                string,
                unknown
              >;
              if ('theory' in conspiracyObj) {
                const nested = conspiracyObj.theory as
                  | ConspiracyPost[]
                  | ConspiracyPost;
                conspiracy = Array.isArray(nested) ? nested : [nested];
              } else if ('post' in conspiracyObj) {
                const nested = conspiracyObj.post as
                  | ConspiracyPost[]
                  | ConspiracyPost;
                conspiracy = Array.isArray(nested) ? nested : [nested];
              }
            }
          }
        } else {
          // Log unexpected response structure for monitoring
          logger.warn(
            'Conspiracy response has unexpected structure',
            {
              responseKeys: Object.keys(rawResponse),
              hasConspiracy: 'conspiracy' in rawResponse,
              hasResponse: 'response' in rawResponse,
            },
            'FeedGenerator'
          );
        }
      } else {
        logger.warn(
          'Conspiracy response is not an object',
          { type: typeof rawResponse },
          'FeedGenerator'
        );
      }

      // Log sample posts for monitoring
      if (attempt === 0 && conspiracy.length > 0) {
        logger.info(
          'Sample conspiracy structure',
          {
            count: conspiracy.length,
            firstKeys: Object.keys(conspiracy[0] || {}),
            hasPost: conspiracy[0] ? 'post' in conspiracy[0] : false,
            hasContent: conspiracy[0]
              ? 'content' in (conspiracy[0] as Record<string, unknown>)
              : false,
          },
          'FeedGenerator'
        );
      }

      const filteredConspiracy = conspiracy
        .filter((c) => {
          if (typeof c !== 'object' || c === null) return false;
          // Handle various content field names: post, tweet, or content
          const content = c.post || c.tweet || c.content;
          return (
            content !== undefined &&
            typeof content === 'string' &&
            content.trim().length > 0
          );
        })
        .map((c) => ({
          post: c.post || c.tweet || c.content || '',
          sentiment: c.sentiment ?? 0,
          clueStrength: c.clueStrength ?? 0.5,
          pointsToward: c.pointsToward ?? null,
        }));

      // Apply post-processing (hashtag/emoji stripping, name mapping) and validation
      const processedConspiracy = await Promise.all(
        filteredConspiracy.map(async (c) => {
          const processedPost = await this.postProcessContent(c.post);
          const validation = this.validatePostContent(processedPost, 'CONSPIRACY');
          return {
            post: validation.cleanContent,
            sentiment: c.sentiment,
            clueStrength: c.clueStrength,
            pointsToward: c.pointsToward,
            isValid: validation.isValid,
            violations: validation.violations,
          };
        })
      );

      // Check if any posts failed validation
      const invalidConspiracy = processedConspiracy.filter((c) => !c.isValid);
      if (invalidConspiracy.length > 0) {
        const violationCount = invalidConspiracy.reduce(
          (sum, c) => sum + c.violations.length,
          0
        );
        logger.warn(
          `Validation failed for ${invalidConspiracy.length} conspiracy post(s) (attempt ${attempt + 1}/${maxRetries})`,
          {
            violations: invalidConspiracy.flatMap((c) => c.violations),
            violationCount,
            attempt: attempt + 1,
          },
          'FeedGenerator'
        );

        // Retry if we haven't exhausted attempts
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Filter to only valid conspiracy posts
      const validConspiracy = processedConspiracy
        .filter((c) => c.isValid)
        .map((c) => ({
          post: c.post,
          sentiment: c.sentiment,
          clueStrength: c.clueStrength,
          pointsToward: c.pointsToward,
        }));

      const minRequired = Math.ceil(conspiracists.length * 0.5);

      if (validConspiracy.length >= minRequired) {
        // Limit to requested count to match with conspiracists
        return validConspiracy.slice(0, conspiracists.length);
      }

      logger.warn(
        `Invalid conspiracy batch (attempt ${attempt + 1}/${maxRetries}). Expected ${conspiracists.length}, got ${validConspiracy.length} valid (need ${minRequired}+)`,
        {
          attempt: attempt + 1,
          maxRetries,
          expected: conspiracists.length,
          got: validConspiracy.length,
          minRequired,
        },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.error(
      `Failed to generate conspiracy posts batch after ${maxRetries} attempts. Returning empty batch.`,
      undefined,
      'FeedGenerator'
    );
    return [];
  }

  /**
  /**
   * Generate company PR statement
   * Companies manage crises, spin news, and announce products
   * 
   * @description
   * Generates company PR WITHOUT knowing predetermined outcome.
   * Companies defend themselves and spin narratives based on their interests.
   */
  private async generateCompanyPost(
    company: Organization,
    event: WorldEvent,
    _affiliatedActor: Actor,
    outcome: boolean
  ): Promise<{
    post: string;
    sentiment: number;
    clueStrength: number;
    pointsToward: boolean | null;
  }> {
    if (!this.llm) {
      throw new Error('LLM client required for feed generation');
    }

    const isCrisis = event.type === 'scandal' || event.type === 'leak';

    // Companies ALWAYS try to frame things positively for themselves
    const frameGuidance =
      event.pointsToward === 'NO'
        ? 'Defensively spin this as minor/temporary - protect company reputation'
        : event.pointsToward === 'YES'
          ? 'Promote this as evidence of company strength and success'
          : 'Frame neutrally but emphasize company stability and commitment';

    // Enhance frameGuidance with outcome knowledge for more strategic framing
    const enhancedFrameGuidance = outcome
      ? `${frameGuidance}. The underlying trend supports positive framing - emphasize long-term value and resilience.`
      : `${frameGuidance}. The underlying trend requires careful management - emphasize proactive response and commitment to stakeholders.`;

    // Ensure world context is available
    if (!this.worldContext) {
      this.worldContext = await generateWorldContext({ maxActors: 50 });
    }

    const prompt = renderPrompt(companyPost, {
      companyName: company.name,
      companyDescription: company.description,
      eventDescription: event.description,
      eventType: event.type,
      postType: isCrisis ? 'crisis management' : 'announcement',
      outcomeFrame: enhancedFrameGuidance,
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(companyPost);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<{
        post: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      }>(
        prompt,
        { required: ['post', 'sentiment', 'clueStrength', 'pointsToward'] },
        { ...params, promptType: 'feed_generate_company_post' }
      );

      if (!response) {
        logger.warn(
          `LLM returned null/undefined company post response (attempt ${attempt + 1}/${maxRetries})`,
          undefined,
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(
          `Failed to generate valid company post after ${maxRetries} attempts for ${company.name}`
        );
      }

      if (
        response.post &&
        typeof response.post === 'string' &&
        response.post.trim().length > 0
      ) {
        return {
          ...response,
          post: await this.postProcessContent(response.post),
        };
      }

      logger.warn(
        `Invalid company post (attempt ${attempt + 1}/${maxRetries}). Retrying...`,
        { attempt: attempt + 1, maxRetries },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.error(
      `Failed to generate valid company post after ${maxRetries} attempts for ${company.name}. Using fallback.`,
      undefined,
      'FeedGenerator'
    );
    return {
      post: `${company.name} has issued a statement regarding the recent ${event.type}.`,
      sentiment: 0,
      clueStrength: 0.1,
      pointsToward: null,
    };
  }

  /**
   * Generate government response
   * Government agencies investigate, deny, or announce policy
   *
   * @description
   * Generates government statements WITHOUT knowing predetermined outcome.
   * Government responses are typically vague, bureaucratic, and ineffective.
   */
  private async generateGovernmentPost(
    govt: Organization,
    event: WorldEvent,
    allActors: Actor[],
    outcome: boolean
  ): Promise<{
    post: string;
    sentiment: number;
    clueStrength: number;
    pointsToward: boolean | null;
  }> {
    if (!this.llm) {
      throw new Error('LLM client required for feed generation');
    }

    // Ensure world context is available
    if (!this.worldContext) {
      this.worldContext = await generateWorldContext({ maxActors: 50 });
    }

    // Identify actors and organizations involved in the event
    const involvedActors = event.actors
      .map((id) => allActors.find((a) => a.id === id))
      .filter((a): a is Actor => a !== undefined);

    // Find companies/organizations involved through actor affiliations
    const involvedCompanies = involvedActors
      .flatMap((actor) => actor.affiliations || [])
      .map((orgId) => this.organizations.find((o) => o.id === orgId))
      .filter((o): o is Organization => o !== undefined && o.type === 'company')
      .slice(0, 3); // Limit to top 3 companies

    // Build context about who the government is responding to
    const involvedParties = [
      ...involvedActors.map((a) => a.name),
      ...involvedCompanies.map((c) => c.name),
    ].filter(Boolean);

    const partiesContext =
      involvedParties.length > 0
        ? `This event involves: ${involvedParties.join(', ')}. Address these parties in your statement.`
        : 'Address the event and any relevant parties mentioned in the event description.';

    // Government framing based on event severity and outcome
    const baseFrame =
      event.type === 'scandal' || event.type === 'revelation'
        ? 'Announce investigation, issue vague statement about "reviewing the matter"'
        : 'Issue official statement addressing the development';

    // Enhance with outcome knowledge for subtle guidance
    const enhancedFrame = outcome
      ? `${baseFrame}. The underlying situation suggests manageable resolution, but maintain bureaucratic caution.`
      : `${baseFrame}. The underlying situation requires careful oversight, but maintain bureaucratic caution.`;

    const outcomeFrame = `${enhancedFrame} ${partiesContext}`;

    const prompt = renderPrompt(governmentPost, {
      govName: govt.name,
      govDescription: govt.description,
      eventDescription:
        event.description || 'A significant event has occurred.',
      eventType: event.type,
      outcomeFrame,
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(governmentPost);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<{
        post: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      }>(
        prompt,
        { required: ['post', 'sentiment', 'clueStrength', 'pointsToward'] },
        { ...params, promptType: 'feed_generate_government_post' }
      );

      if (!response) {
        logger.warn(
          `LLM returned null/undefined government post response (attempt ${attempt + 1}/${maxRetries})`,
          undefined,
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(
          `Failed to generate valid government post after ${maxRetries} attempts for ${govt.name}`
        );
      }

      if (
        response.post &&
        typeof response.post === 'string' &&
        response.post.trim().length > 0
      ) {
        return {
          ...response,
          post: await this.postProcessContent(response.post),
        };
      }

      logger.warn(
        `Invalid government post (attempt ${attempt + 1}/${maxRetries}). Retrying...`,
        { attempt: attempt + 1, maxRetries },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(
      `Failed to generate valid government post after ${maxRetries} attempts for ${govt.name}`
    );
  }

  /**
   * Generate ambient feed posts (not tied to specific events)
   * Random musings, hot takes, general commentary
   * BATCHED: Generates all ambient posts in ONE call
   *
   * @description
   * Generates ambient posts WITHOUT knowing predetermined outcome.
   * Actors post general thoughts based on their mood and context.
   */
  private async generateAmbientFeed(
    day: number,
    allActors: Actor[],
    outcome: boolean
  ): Promise<FeedPost[]> {
    const ambient: FeedPost[] = [];
    const baseTime = `2025-10-${String(day).padStart(2, '0')}T`;

    // DENSE CONTENT: Each actor posts 1-20 times per hour
    // Generate posts for all 24 hours of the day

    // For each hour of the day, select random actors to post
    for (let hour = 0; hour < 24; hour++) {
      // Each hour, 10-30% of actors post (1-20 posts per actor per hour achieved through probability)
      const actorsThisHour = shuffleArray(allActors).slice(
        0,
        Math.floor(allActors.length * (0.1 + Math.random() * 0.2))
      );

      if (actorsThisHour.length === 0) continue;

      // ✅ BATCH: Generate all ambient posts for this hour in ONE call
      const posts = await this.generateAmbientPostsBatch(
        actorsThisHour,
        day,
        outcome
      );

      posts.forEach((post, i) => {
        const actor = actorsThisHour[i];
        if (!actor) return;

        // Spread posts throughout the hour (random minutes)
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);

        ambient.push({
          id: `ambient-${day}-${hour}-${actor.id}-${i}`,
          day,
          timestamp: `${baseTime}${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}Z`,
          type: 'thread',
          content: post.post,
          author: actor.id,
          authorName: actor.name,
          sentiment: post.sentiment,
          clueStrength: post.clueStrength,
          pointsToward: post.pointsToward,
        });
      });
    }

    return ambient;
  }

  /**
   * Generate replies to existing posts
   * 30-50% of posts get replies from other actors
   */
  private async generateReplies(
    day: number,
    existingPosts: FeedPost[],
    allActors: Actor[]
  ): Promise<FeedPost[]> {
    const replies: FeedPost[] = [];

    // Select posts that could get replies (30-50% of posts)
    const postsToReplyTo = shuffleArray(existingPosts).slice(
      0,
      Math.floor(existingPosts.length * (0.3 + Math.random() * 0.2))
    );

    for (const originalPost of postsToReplyTo) {
      // Select 1-3 actors to reply
      const replyCount = 1 + Math.floor(Math.random() * 3);
      const replyingActors = shuffleArray(
        allActors.filter((a) => a.id !== originalPost.author)
      ).slice(0, replyCount);

      // ✅ BATCH: Generate all replies for this post in ONE call
      const batchReplies = await this.generateRepliesBatch(
        replyingActors,
        originalPost
      );

      batchReplies.forEach((replyContent, i) => {
        const actor = replyingActors[i];
        if (!actor) return;

        // Reply timestamp is after original post
        const originalTime = new Date(originalPost.timestamp);

        // Validate timestamp
        if (isNaN(originalTime.getTime())) {
          logger.warn(
            `Invalid timestamp for post ${originalPost.id}, skipping reply generation`,
            { postId: originalPost.id },
            'FeedGenerator'
          );
          return;
        }

        const replyTime = new Date(
          originalTime.getTime() + (5 + Math.random() * 55) * 60 * 1000
        ); // 5-60 minutes later

        replies.push({
          id: `reply-${originalPost.id}-${actor.id}`,
          day,
          timestamp: replyTime.toISOString(),
          type: 'reply',
          content: replyContent.post,
          author: actor.id,
          authorName: actor.name,
          replyTo: originalPost.id,
          relatedEvent: originalPost.relatedEvent,
          sentiment: replyContent.sentiment,
          clueStrength: replyContent.clueStrength,
          pointsToward: replyContent.pointsToward,
        });
      });
    }

    return replies;
  }

  /**
   * Generate reposts/retweets of existing posts
   * 10-20% of posts get reposted by other actors
   */
  private async generateReposts(
    day: number,
    existingPosts: FeedPost[],
    allActors: Actor[]
  ): Promise<FeedPost[]> {
    const reposts: FeedPost[] = [];

    // Select posts that could get reposted (10-20% of posts)
    const postsToRepost = shuffleArray(existingPosts).slice(
      0,
      Math.floor(existingPosts.length * (0.1 + Math.random() * 0.1))
    );

    for (const originalPost of postsToRepost) {
      // Select 1-2 actors to repost
      const repostCount = 1 + Math.floor(Math.random() * 2);
      const repostingActors = shuffleArray(
        allActors.filter((a) => a.id !== originalPost.author)
      ).slice(0, repostCount);

      for (const actor of repostingActors) {
        const isQuoteTweet = Math.random() > 0.5; // 50% chance of quote tweet
        let quoteComment: string | null = null;

        if (isQuoteTweet) {
          // Use generateReplyContent for the quote comment as it fits the "reaction" vibe
          quoteComment = await this.generateReplyContent(actor, originalPost);
        }

        // Repost timestamp is after original post
        const originalTime = new Date(originalPost.timestamp);

        if (isNaN(originalTime.getTime())) continue;

        const repostTime = new Date(
          originalTime.getTime() + (2 + Math.random() * 30) * 60 * 1000
        ); // 2-32 minutes later

        reposts.push({
          id: `repost-${originalPost.id}-${actor.id}`,
          day,
          timestamp: repostTime.toISOString(),
          type: 'post', // It's a new post that is a repost
          content: quoteComment || '', // Content is the quote comment if present
          author: actor.id,
          authorName: actor.name,
          isRepost: true,
          originalPostId: originalPost.id,
          originalAuthorId: originalPost.author,
          originalAuthorName: originalPost.authorName,
          originalContent: originalPost.content,
          quoteComment: quoteComment,
          sentiment: originalPost.sentiment, // Inherit sentiment roughly
          clueStrength: (originalPost.clueStrength ?? 0) * 0.8,
          pointsToward: originalPost.pointsToward,
        });
      }
    }

    return reposts;
  }

  /**
   * Generate reply content for an actor replying to a post
   */
  private async generateReplyContent(
    actor: Actor,
    originalPost: FeedPost
  ): Promise<string> {
    // Ensure world context is available
    if (!this.worldContext) {
      this.worldContext = await generateWorldContext({ maxActors: 50 });
    }

    // Get actor's current emotional state
    const state = this.actorStates.get(actor.id);
    const emotionalContext = state
      ? generateActorContext(
          state.mood,
          state.luck,
          originalPost.author,
          this.relationships,
          actor.id
        )
      : '';

    const relationshipContext = originalPost.author
      ? `Consider your relationship with ${originalPost.authorName} when responding.`
      : '';

    const prompt = renderPrompt(reply, {
      actorName: actor.name,
      actorDescription: actor.description || actor.role || 'actor',
      emotionalContext: emotionalContext ? emotionalContext + '\n' : '',
      originalAuthorName: originalPost.authorName,
      originalContent: originalPost.content,
      relationshipContext,
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(reply);
    const rawResponse = await this.llm!.generateJSON<
      { post: string } | { response: { post: string } }
    >(prompt, undefined, {
      ...params,
      promptType: 'feed_generate_reply_content',
    });

    if (!rawResponse || typeof rawResponse !== 'object') {
      logger.warn(
        'LLM returned null/undefined/invalid reply content',
        { type: typeof rawResponse },
        'FeedGenerator'
      );
      return 'Interesting point.'; // Fallback
    }

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { post: string });

    return await this.postProcessContent(response.post);
  }

  /**
   * BATCHED: Generate ambient posts for multiple actors in ONE call
   *
   * @description
   * Generates ambient posts WITHOUT knowing predetermined outcome.
   * Actors post general thoughts based on their mood, relationships, and trending topics.
   * Outcome parameter provides subtle directional guidance for atmosphere.
   */
  private async generateAmbientPostsBatch(
    actors: Actor[],
    day: number,
    outcome: boolean
  ): Promise<
    Array<{
      post: string;
      sentiment: number;
      clueStrength: number;
      pointsToward: boolean | null;
    }>
  > {
    if (!this.llm || actors.length === 0) {
      return [];
    }

    // Shuffle actors to add variety to prompts
    const shuffledActors = shuffleArray(actors);

    const contexts = shuffledActors.map((actor) => {
      const state = this.actorStates.get(actor.id);
      const emotionalContext = state
        ? generateActorContext(
            state.mood,
            state.luck,
            undefined,
            this.relationships,
            actor.id
          )
        : '';

      return { actor, emotionalContext };
    });

    // Natural progression: early game is setup, mid-game builds tension, late game escalates
    const progressContext =
      day <= 10
        ? 'Early days - things are just getting started.'
        : day <= 20
          ? 'Mid-way through - developments are unfolding.'
          : 'Late stage - tension is building, things are heating up.';

    // General atmosphere based on phase, enhanced with outcome knowledge for subtle guidance
    const baseAtmosphere =
      day <= 10
        ? 'General activity and routine developments.'
        : day <= 20
          ? 'Increasing activity and developments in various areas.'
          : 'Heightened activity as events accelerate.';

    // Add subtle outcome-based atmosphere without being explicit
    const outcomeAtmosphere = outcome
      ? ' The overall momentum feels positive, though individual perspectives vary.'
      : ' The overall momentum feels challenging, though individual perspectives vary.';

    const atmosphereContext = baseAtmosphere + outcomeAtmosphere;

    const actorsList = contexts
      .map((ctx, i) => {
        const persona = this._npcPersonas.get(ctx.actor.id);

        let personaContext = '';
        if (persona) {
          personaContext = `\n   Reliability: ${(persona.reliability * 100).toFixed(0)}%`;
          if (persona.insiderOrgs.length > 0 && Math.random() > 0.7) {
            personaContext += ` | You may hint at insider knowledge from: ${persona.insiderOrgs.slice(0, 2).join(', ')}`;
          }
        }

        return `${i + 1}. You are ${ctx.actor.name}: ${ctx.actor.description}
   Affiliated: ${ctx.actor.domain?.join(', ')}
   ${ctx.emotionalContext}${formatActorVoiceContext(ctx.actor)}${personaContext}
   ${this.actorGroupContexts.get(ctx.actor.id) || ''}

   Write general thoughts. Your private group chats inform your perspective.
   You can reference trending topics if relevant.
   Write as YOURSELF (first person). Max 280 chars. No hashtags/emojis.`;
      })
      .join('\n');

    // Random hour for time-of-day energy variety in posts
    const hour = Math.floor(Math.random() * 24);

    const prompt = renderPrompt(ambientPosts, {
      day: day.toString(),
      progressContext,
      atmosphereContext,
      trendContext: this.trendContext || '',
      timeEnergy: getTimeOfDayEnergy(hour),
      actorCount: actors.length.toString(),
      actorsList,
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(ambientPosts);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<{
        posts: Array<{
          post?: string;
          tweet?: string;
          sentiment: number;
          clueStrength: number;
          pointsToward: boolean | null;
        }>;
      }>(
        prompt,
        undefined, // Don't validate schema to handle various response formats
        { ...params, promptType: 'feed_generate_ambient_posts_batch' }
      );

      if (!response || typeof response !== 'object') {
        logger.warn(
          `LLM returned null/undefined/invalid ambient response (attempt ${attempt + 1}/${maxRetries})`,
          { type: typeof response },
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Handle XML nested structure: { posts: [...] } or { posts: { post: [...] } } or { response: { posts: {...} } }
      type AmbientPostItem = {
        post?: string;
        tweet?: string;
        content?: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      };
      let posts: AmbientPostItem[] = [];

      // Check if wrapped in response object first
      const responseData =
        'response' in response &&
        response.response &&
        typeof response.response === 'object'
          ? (response.response as {
              posts?:
                | AmbientPostItem[]
                | {
                    post?: AmbientPostItem[] | AmbientPostItem;
                    posts?: AmbientPostItem[];
                  };
            })
          : response;

      if ('posts' in responseData && responseData.posts) {
        if (Array.isArray(responseData.posts)) {
          posts = responseData.posts;
        } else if (typeof responseData.posts === 'object') {
          // Check various nested structures
          if ('post' in responseData.posts) {
            const nested = responseData.posts.post;
            posts = Array.isArray(nested) ? nested : nested ? [nested] : [];
          } else if (
            'posts' in responseData.posts &&
            Array.isArray(responseData.posts.posts)
          ) {
            // Double nested: { posts: { posts: [...] } }
            posts = responseData.posts.posts;
          } else if ('content' in responseData.posts) {
            // Single post returned directly: { posts: { content: "...", ... } }
            posts = [responseData.posts as AmbientPostItem];
          }
        }
      }

      // Log extraction details on first attempt for monitoring
      if (attempt === 0) {
        logger.info(
          'Ambient posts extraction',
          {
            postsLength: posts.length,
            samplePost: posts[0]
              ? {
                  hasPost: 'post' in posts[0],
                  hasTweet: 'tweet' in posts[0],
                  hasContent: 'content' in posts[0],
                  postType: typeof (posts[0] as Record<string, unknown>).post,
                  contentType: typeof (posts[0] as Record<string, unknown>)
                    .content,
                }
              : null,
          },
          'FeedGenerator'
        );
      }

      const filteredPosts = posts
        .filter((p) => {
          // Handle various content field names: post, tweet, or content
          const postContent = p.post || p.tweet || p.content;
          // Also handle case where content might be nested object (XML edge case)
          const contentValue =
            typeof postContent === 'object' && postContent !== null
              ? String(postContent)
              : postContent;
          return (
            contentValue &&
            typeof contentValue === 'string' &&
            contentValue.trim().length > 0
          );
        })
        .map((p) => {
          const rawContent = p.post || p.tweet || p.content;
          const content =
            typeof rawContent === 'object' && rawContent !== null
              ? String(rawContent)
              : rawContent;
          return {
            post: content || '',
            sentiment: p.sentiment ?? 0,
            clueStrength: p.clueStrength ?? 0.05,
            pointsToward: p.pointsToward ?? null,
          };
        });

      // Apply post-processing (hashtag/emoji stripping, name mapping) and validation
      const processedPosts = await Promise.all(
        filteredPosts.map(async (p) => {
          const processedPost = await this.postProcessContent(p.post);
          const validation = this.validatePostContent(processedPost, 'AMBIENT');
          return {
            post: validation.cleanContent,
            sentiment: p.sentiment,
            clueStrength: p.clueStrength,
            pointsToward: p.pointsToward,
            isValid: validation.isValid,
            violations: validation.violations,
          };
        })
      );

      // Check if any posts failed validation
      const invalidPosts = processedPosts.filter((p) => !p.isValid);
      if (invalidPosts.length > 0) {
        const violationCount = invalidPosts.reduce(
          (sum, p) => sum + p.violations.length,
          0
        );
        logger.warn(
          `Validation failed for ${invalidPosts.length} ambient post(s) (attempt ${attempt + 1}/${maxRetries})`,
          {
            violations: invalidPosts.flatMap((p) => p.violations),
            violationCount,
            attempt: attempt + 1,
          },
          'FeedGenerator'
        );

        // Retry if we haven't exhausted attempts
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Filter to only valid posts
      const validPosts = processedPosts
        .filter((p) => p.isValid)
        .map((p) => ({
          post: p.post,
          sentiment: p.sentiment,
          clueStrength: p.clueStrength,
          pointsToward: p.pointsToward,
        }));

      const minRequired = Math.ceil(actors.length * 0.5);

      if (validPosts.length >= minRequired) {
        // Limit to requested count to match with actors
        return validPosts.slice(0, actors.length);
      }

      logger.warn(
        `Invalid ambient posts batch (attempt ${attempt + 1}/${maxRetries}). Expected ${actors.length}, got ${validPosts.length} valid (need ${minRequired}+)`,
        {
          attempt: attempt + 1,
          maxRetries,
          expected: actors.length,
          got: validPosts.length,
          minRequired,
        },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.error(
      `Failed to generate ambient posts batch after ${maxRetries} attempts. Returning empty batch.`,
      undefined,
      'FeedGenerator'
    );
    return [];
  }

  /**
   * Generate thread of replies
   * Actors respond to each other's posts
   * BATCHED: Generates all replies in ONE call
   */
  private async generateThread(
    day: number,
    existingPosts: FeedPost[],
    allActors: Actor[]
  ): Promise<FeedPost[]> {
    const thread: FeedPost[] = [];

    if (existingPosts.length === 0) return thread;

    // Pick a random post to reply to
    const originalPost =
      existingPosts[Math.floor(Math.random() * existingPosts.length)];
    if (!originalPost) return thread;

    // 1-3 people reply
    const postingActors = allActors.filter((a) => a.id !== originalPost.author);
    const repliers = shuffleArray(postingActors).slice(
      0,
      1 + Math.floor(Math.random() * 3)
    );

    if (repliers.length === 0) return thread;

    // ✅ BATCH: Generate all replies in ONE call
    const replies = await this.generateRepliesBatch(repliers, originalPost);

    replies.forEach((reply, i) => {
      const replier = repliers[i];
      if (!replier) return; // Skip if replier doesn't exist

      const baseTime = originalPost.timestamp.substring(0, 11);
      const hour = Number.parseInt(originalPost.timestamp.substring(11, 13));

      thread.push({
        id: `${originalPost.id}-reply-${replier.id}`,
        day,
        timestamp: `${baseTime}${String(hour + i).padStart(2, '0')}:${String(30 + i * 10).padStart(2, '0')}:00Z`,
        type: 'thread',
        content: reply.post,
        author: replier.id,
        authorName: replier.name,
        replyTo: originalPost.id,
        sentiment: reply.sentiment,
        clueStrength: reply.clueStrength,
        pointsToward: reply.pointsToward,
      });
    });

    return thread;
  }

  /**
   * BATCHED: Generate replies for multiple actors in ONE call
   */
  private async generateRepliesBatch(
    actors: Actor[],
    originalPost: FeedPost
  ): Promise<
    Array<{
      post: string;
      sentiment: number;
      clueStrength: number;
      pointsToward: boolean | null;
    }>
  > {
    if (!this.llm || actors.length === 0) {
      return [];
    }

    const contexts = actors.map((actor) => {
      const state = this.actorStates.get(actor.id);
      const emotionalContext = state
        ? generateActorContext(
            state.mood,
            state.luck,
            originalPost.author,
            this.relationships,
            actor.id
          )
        : '';

      return { actor, emotionalContext };
    });

    const repliersList = contexts
      .map(
        (ctx, i) => `${i + 1}. ${ctx.actor.name}
   About: ${ctx.actor.description}
   ${ctx.emotionalContext}${formatActorVoiceContext(ctx.actor)}
   
   Write reply (max 140 chars).
   ${ctx.actor.personality?.includes('contrarian') ? 'Disagree or challenge' : 'Consider your relationship and mood when responding'}
   Let emotional state and any relationship with ${originalPost.authorName} influence tone. Match their writing style.
`
      )
      .join('\n');

    const prompt = renderPrompt(replies, {
      originalAuthorName: originalPost.authorName,
      originalContent: originalPost.content,
      replierCount: actors.length.toString(),
      repliersList,
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(replies);
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await this.llm.generateJSON<{
        replies: Array<{
          post?: string;
          tweet?: string;
          sentiment: number;
          clueStrength: number;
          pointsToward: boolean | null;
        }>;
      }>(
        prompt,
        undefined, // Don't validate schema to handle various response formats
        { ...params, promptType: 'feed_generate_replies_batch' }
      );

      if (!response || typeof response !== 'object') {
        logger.warn(
          `LLM returned null/undefined/invalid replies response (attempt ${attempt + 1}/${maxRetries})`,
          { type: typeof response },
          'FeedGenerator'
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Handle XML nested structure: { replies: [...] } or { replies: { reply: [...] } } or { response: { replies: {...} } }
      type ReplyItem = {
        post?: string;
        tweet?: string;
        content?: string;
        sentiment: number;
        clueStrength: number;
        pointsToward: boolean | null;
      };
      let replies: ReplyItem[] = [];

      // Check if wrapped in response object first
      const responseData =
        'response' in response &&
        response.response &&
        typeof response.response === 'object'
          ? (response.response as {
              replies?:
                | ReplyItem[]
                | { reply?: ReplyItem[] | ReplyItem; replies?: ReplyItem[] };
            })
          : response;

      if ('replies' in responseData && responseData.replies) {
        if (Array.isArray(responseData.replies)) {
          replies = responseData.replies;
        } else if (typeof responseData.replies === 'object') {
          // Check various nested structures
          if ('reply' in responseData.replies) {
            const nested = responseData.replies.reply;
            replies = Array.isArray(nested) ? nested : nested ? [nested] : [];
          } else if (
            'replies' in responseData.replies &&
            Array.isArray(responseData.replies.replies)
          ) {
            // Double nested: { replies: { replies: [...] } }
            replies = responseData.replies.replies;
          } else if (
            'content' in responseData.replies ||
            'post' in responseData.replies
          ) {
            // Single reply returned directly: { replies: { content/post: "...", ... } }
            replies = [responseData.replies as ReplyItem];
          }
        }
      } else if ('reply' in responseData) {
        // LLM returned singular 'reply' instead of 'replies'
        const replyData = (
          responseData as {
            reply: ReplyItem[] | ReplyItem | { reply: ReplyItem[] | ReplyItem };
          }
        ).reply;
        if (Array.isArray(replyData)) {
          replies = replyData;
        } else if (replyData && typeof replyData === 'object') {
          if ('reply' in replyData) {
            // Nested: { reply: { reply: [...] } }
            const nested = (replyData as { reply: ReplyItem[] | ReplyItem })
              .reply;
            replies = Array.isArray(nested) ? nested : nested ? [nested] : [];
          } else if ('post' in replyData || 'content' in replyData) {
            // Single reply: { reply: { post: "...", ... } }
            replies = [replyData as ReplyItem];
          }
        }
      }

      // Log extraction details on first attempt for monitoring
      if (attempt === 0) {
        logger.info(
          'Replies extraction',
          {
            repliesLength: replies.length,
            responseKeys: Object.keys(responseData),
            hasReplies: 'replies' in responseData,
            hasReply: 'reply' in responseData,
            sampleReply: replies[0]
              ? {
                  hasPost: 'post' in replies[0],
                  hasTweet: 'tweet' in replies[0],
                  hasContent: 'content' in replies[0],
                  postType: typeof (replies[0] as Record<string, unknown>).post,
                  contentType: typeof (replies[0] as Record<string, unknown>)
                    .content,
                }
              : null,
          },
          'FeedGenerator'
        );
      }

      // Type helper for replies that may have different content field names
      const filteredReplies = replies
        .filter((r): r is ReplyItem => {
          // Handle various content field names: post, tweet, or content
          const replyContent = r.post || r.tweet || r.content;
          // Also handle case where content might be nested object (XML edge case)
          const contentValue =
            typeof replyContent === 'object' && replyContent !== null
              ? String(replyContent)
              : replyContent;
          return Boolean(
            contentValue &&
              typeof contentValue === 'string' &&
              contentValue.trim().length > 0
          );
        })
        .map((r) => {
          const rawContent = r.post || r.tweet || r.content;
          const content =
            typeof rawContent === 'object' && rawContent !== null
              ? String(rawContent)
              : rawContent;
          return {
            post: content || '',
            sentiment: r.sentiment ?? 0,
            clueStrength: r.clueStrength ?? 0.3,
            pointsToward: r.pointsToward ?? null,
          };
        });

      // Apply post-processing (hashtag/emoji stripping, name mapping) and validation
      const processedReplies = await Promise.all(
        filteredReplies.map(async (r) => {
          const processedPost = await this.postProcessContent(r.post);
          const validation = this.validatePostContent(processedPost, 'REPLY');
          return {
            post: validation.cleanContent,
            sentiment: r.sentiment,
            clueStrength: r.clueStrength,
            pointsToward: r.pointsToward,
            isValid: validation.isValid,
            violations: validation.violations,
          };
        })
      );

      // Check if any replies failed validation
      const invalidReplies = processedReplies.filter((r) => !r.isValid);
      if (invalidReplies.length > 0) {
        const violationCount = invalidReplies.reduce(
          (sum, r) => sum + r.violations.length,
          0
        );
        logger.warn(
          `Validation failed for ${invalidReplies.length} reply/replies (attempt ${attempt + 1}/${maxRetries})`,
          {
            violations: invalidReplies.flatMap((r) => r.violations),
            violationCount,
            attempt: attempt + 1,
          },
          'FeedGenerator'
        );

        // Retry if we haven't exhausted attempts
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // Filter to only valid replies
      const validReplies = processedReplies
        .filter((r) => r.isValid)
        .map((r) => ({
          post: r.post,
          sentiment: r.sentiment,
          clueStrength: r.clueStrength,
          pointsToward: r.pointsToward,
        }));

      const minRequired = Math.ceil(actors.length * 0.5);

      if (validReplies.length >= minRequired) {
        // Limit to requested count to match with actors
        return validReplies.slice(0, actors.length);
      }

      logger.warn(
        `Invalid replies batch (attempt ${attempt + 1}/${maxRetries}). Expected ${actors.length}, got ${validReplies.length} valid (need ${minRequired}+)`,
        {
          attempt: attempt + 1,
          maxRetries,
          expected: actors.length,
          got: validReplies.length,
          minRequired,
        },
        'FeedGenerator'
      );
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    logger.error(
      `Failed to generate valid replies batch after ${maxRetries} attempts. Returning empty batch.`,
      undefined,
      'FeedGenerator'
    );
    return [];
  }

  /**
   * Generate feed posts for stock price movements
   * Creates company announcements, ticker posts, and analyst reactions
   * Public for external use by price engines
   */
  public async generateEconomicFeedPosts(
    priceUpdate: PriceUpdate,
    company: Organization,
    day: number,
    allActors: Actor[]
  ): Promise<FeedPost[]> {
    if (!this.llm) {
      return [];
    }

    const posts: FeedPost[] = [];
    const baseTime = `2025-10-${String(day).padStart(2, '0')}T`;
    const direction = priceUpdate.change > 0 ? 'up' : 'down';
    const phaseContext = buildPhaseContext(day);

    // Only generate posts for significant price movements (>2%)
    if (Math.abs(priceUpdate.changePercent) < 2) {
      return [];
    }

    // 1. Company announcement (for major moves >5%)
    if (Math.abs(priceUpdate.changePercent) >= 5) {
      // Ensure world context is available
      if (!this.worldContext) {
        this.worldContext = await generateWorldContext({ maxActors: 50 });
      }

      const prompt = renderPrompt(priceAnnouncement, {
        companyName: company.name,
        priceChange: priceUpdate.change.toFixed(2),
        direction,
        currentPrice: priceUpdate.newPrice.toFixed(2),
        eventDescription: priceUpdate.reason,
        phaseContext,
        ...(this.worldContext || {}),
      });

      const params = getPromptParams(priceAnnouncement);
      const rawResponse = await this.llm.generateJSON<
        | {
            post: string;
            sentiment: number;
          }
        | { response: { post: string; sentiment: number } }
      >(prompt, undefined, {
        ...params,
        promptType: 'feed_generate_price_announcement',
      });

      // Handle XML structure
      const response =
        'response' in rawResponse && rawResponse.response
          ? rawResponse.response
          : (rawResponse as { post: string; sentiment: number });

      const processedPost = await this.postProcessContent(response.post);
      posts.push({
        id: `${company.id}-price-announcement-${day}`,
        day,
        timestamp: `${baseTime}${String(9 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
        type: 'news',
        content: processedPost,
        author: company.id,
        authorName: company.name,
        sentiment: response.sentiment,
        clueStrength: 0,
        pointsToward: null,
      });
    }

    // 2. Stock ticker style post (always for significant moves)
    const tickerPrompt = renderPrompt(stockTicker, {
      ticker: company.id.toUpperCase().slice(0, 4),
      companyName: company.name,
      currentPrice: priceUpdate.newPrice.toFixed(2),
      priceChange: priceUpdate.change.toFixed(2),
      direction,
      volume: Math.floor(Math.random() * 1000000 + 500000).toString(),
      ...(this.worldContext || {}),
    });

    const tickerParams = getPromptParams(stockTicker);
    const rawTickerResponse = await this.llm.generateJSON<
      | {
          post: string;
          sentiment: number;
        }
      | { response: { post: string; sentiment: number } }
    >(tickerPrompt, undefined, {
      ...tickerParams,
      promptType: 'feed_generate_stock_ticker',
    });

    // Handle XML structure
    const tickerResponse =
      'response' in rawTickerResponse && rawTickerResponse.response
        ? rawTickerResponse.response
        : (rawTickerResponse as { post: string; sentiment: number });

    const processedTickerPost = await this.postProcessContent(
      tickerResponse.post
    );
    posts.push({
      id: `${company.id}-ticker-${day}`,
      day,
      timestamp: `${baseTime}${String(9 + Math.floor(Math.random() * 3)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
      type: 'news',
      content: processedTickerPost,
      author: 'market-ticker',
      authorName: 'Market Ticker',
      sentiment: tickerResponse.sentiment,
      clueStrength: 0,
      pointsToward: null,
    });

    // 3. Analyst reactions (1-2 analysts for major moves)
    if (Math.abs(priceUpdate.changePercent) >= 3) {
      const analysts = allActors
        .filter(
          (a) =>
            a.domain?.includes('finance') ||
            a.domain?.includes('business') ||
            a.description?.toLowerCase().includes('analyst')
        )
        .slice(0, Math.abs(priceUpdate.changePercent) >= 5 ? 2 : 1);

      for (const analyst of analysts) {
        const state = this.actorStates.get(analyst.id);

        const prompt = renderPrompt(analystReaction, {
          analystName: analyst.name,
          analystDescription: analyst.description || '',
          companyName: company.name,
          priceChange: Math.abs(priceUpdate.changePercent).toFixed(1),
          direction,
          eventDescription: priceUpdate.reason,
          mood: state
            ? state.mood > 0
              ? 'optimistic'
              : state.mood < 0
                ? 'pessimistic'
                : 'neutral'
            : 'neutral',
          phaseContext,
          ...(this.worldContext || {}),
        });

        const analystParams = getPromptParams(analystReaction);
        const rawResponse = await this.llm.generateJSON<
          | {
              post: string;
              sentiment: number;
            }
          | { response: { post: string; sentiment: number } }
        >(prompt, undefined, {
          ...analystParams,
          promptType: 'feed_generate_analyst_reaction',
        });

        // Handle XML structure
        const response =
          'response' in rawResponse && rawResponse.response
            ? rawResponse.response
            : (rawResponse as { post: string; sentiment: number });

        const processedAnalystPost = await this.postProcessContent(
          response.post
        );
        posts.push({
          id: `${analyst.id}-analyst-${company.id}-${day}`,
          day,
          timestamp: `${baseTime}${String(10 + Math.floor(Math.random() * 3)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
          type: 'post',
          content: processedAnalystPost,
          author: analyst.id,
          authorName: analyst.name,
          sentiment: response.sentiment,
          clueStrength: 0,
          pointsToward: null,
        });
      }
    }

    return posts;
  }

  /**
   * Generate a day transition post marking the start of a new day
   * Creates a narrative summary that acknowledges the previous day and sets tone for today
   * Public for external use by game generators
   */
  public async generateDayTransitionPost(
    day: number,
    previousDayEvents: WorldEvent[],
    questions: Question[],
    allActors: Actor[]
  ): Promise<FeedPost | null> {
    if (!this.llm || day === 1) {
      return null; // No transition post for day 1
    }

    const baseTime = `2025-10-${String(day).padStart(2, '0')}T06:00:00Z`; // Early morning transition
    const phaseContext = buildPhaseContext(day);
    const phaseName = this.getPhaseName(day);

    // Format yesterday's key events
    const eventsContext = previousDayEvents
      .slice(0, 3) // Top 3 events
      .map((e) => `- ${e.description}`)
      .join('\n');

    // Format active questions
    const questionsContext = questions
      .filter((q) => !q.status || q.status === 'active')
      .slice(0, 3) // Top 3 questions
      .map((q) => `- ${q.text}`)
      .join('\n');

    // Format key actors (top tier actors)
    const keyActors = allActors
      .filter((a) => a.tier === 'S_TIER' || a.tier === 'A_TIER')
      .slice(0, 5)
      .map((a) => a.name)
      .join(', ');

    // Ensure world context is available
    if (!this.worldContext) {
      this.worldContext = await generateWorldContext({ maxActors: 50 });
    }

    const prompt = renderPrompt(dayTransition, {
      day: day.toString(),
      phaseName,
      phaseContext,
      previousDayEvents: eventsContext || 'None',
      activeQuestions: questionsContext || 'No active questions',
      keyActors: keyActors || 'Various industry figures',
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(dayTransition);
    const rawResponse = await this.llm.generateJSON<
      | {
          event: string;
          type: string;
          tone: string;
        }
      | { response: { event: string; type: string; tone: string } }
    >(prompt, undefined, {
      ...params,
      promptType: 'feed_generate_day_transition',
    });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { event: string; type: string; tone: string });

    const processedEvent = await this.postProcessContent(response.event);
    return {
      id: `day-transition-${day}`,
      day,
      timestamp: baseTime,
      type: 'news',
      content: processedEvent,
      author: 'game-narrator',
      authorName: 'Game Narrator',
      sentiment: 0,
      clueStrength: 0,
      pointsToward: null,
    };
  }

  /**
   * Generate a feed post announcing a question resolution
   * Creates a public announcement when a prediction market question resolves
   * Public for external use by game generators
   */
  public async generateQuestionResolutionPost(
    question: Question,
    resolutionEventDescription: string,
    day: number,
    winningPercentage = 50
  ): Promise<FeedPost | null> {
    if (!this.llm) {
      return null;
    }

    const baseTime = `2025-10-${String(day).padStart(2, '0')}T20:00:00Z`;
    const outcomeText = question.resolvedOutcome ? 'YES' : 'NO';

    // Ensure world context is available
    if (!this.worldContext) {
      this.worldContext = await generateWorldContext({ maxActors: 50 });
    }

    const prompt = renderPrompt(questionResolvedFeed, {
      questionText: question.text,
      outcome: outcomeText,
      resolutionEvent: resolutionEventDescription,
      winningPercentage: winningPercentage.toFixed(0),
      ...(this.worldContext || {}),
    });

    const params = getPromptParams(questionResolvedFeed);
    const rawResponse = await this.llm.generateJSON<
      | {
          post: string;
          sentiment: number;
        }
      | { response: { post: string; sentiment: number } }
    >(prompt, undefined, {
      ...params,
      promptType: 'feed_generate_question_resolution',
    });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { post: string; sentiment: number });

    const processedPost = await this.postProcessContent(response.post);
    return {
      id: `question-resolved-${question.id}-${day}`,
      day,
      timestamp: baseTime,
      type: 'news',
      content: processedPost,
      author: 'market-oracle',
      authorName: 'Market Oracle',
      sentiment: response.sentiment,
      clueStrength: 0,
      pointsToward: null,
    };
  }

  /**
   * Generate minute-level ambient post for continuous mode
   * Uses actor personality and current context for realistic posts
   */
  public async generateMinuteAmbientPost(
    actor: {
      id: string;
      name: string;
      description?: string;
      role?: string;
      mood?: number;
    },
    timestamp: Date
  ): Promise<{ content: string; sentiment: number; energy: number }> {
    const formattedTime = timestamp.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const emotionalContext = actor.mood
      ? `Current mood: ${actor.mood > 0 ? 'positive' : actor.mood < 0 ? 'negative' : 'neutral'}`
      : '';

    const atmosphereContext = '';

    // Ensure world context is available
    if (!this.worldContext) {
      this.worldContext = await generateWorldContext({ maxActors: 50 });
    }

    const prompt = renderPrompt(minuteAmbient, {
      actorName: actor.name,
      actorDescription:
        actor.description || actor.role || 'industry professional',
      emotionalContext,
      atmosphereContext,
      ...(this.worldContext || {}),
      // Override currentTime with formatted version for this specific prompt
      currentTime: formattedTime,
    });

    const params = getPromptParams(minuteAmbient);
    const rawResponse = await this.llm!.generateJSON<
      | {
          post: string;
          sentiment: number;
          energy: number;
        }
      | { response: { post: string; sentiment: number; energy: number } }
    >(prompt, undefined, {
      ...params,
      promptType: 'feed_generate_minute_ambient',
    });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { post: string; sentiment: number; energy: number });

    const processedPost = await this.postProcessContent(response.post);
    return {
      content: processedPost,
      sentiment: response.sentiment,
      energy: response.energy,
    };
  }

  /**
   * Get phase name for a given day
   */
  private getPhaseName(day: number): string {
    if (day <= 10) return 'WILD';
    if (day <= 20) return 'CONNECTION';
    if (day <= 25) return 'CONVERGENCE';
    if (day <= 29) return 'CLIMAX';
    return 'RESOLUTION';
  }
}
