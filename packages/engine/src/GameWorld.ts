/**
 * Generates complete narrative worlds with NPCs, events, and predetermined outcomes.
 * This is the "reality" of the game - agents observe and predict, but don't influence.
 */

import type { PerpMarketRecord } from '@babylon/core/markets/perps';
import { generateSnowflakeId, type WorldEvent } from '@babylon/shared';
import { EventEmitter } from 'events';
import { type FeedEvent, FeedGenerator } from './FeedGenerator';
import type { BabylonLLMClient } from './llm/openai-client';
import {
  daySummary,
  expertAnalysis,
  newsReport,
  npcConversation,
  renderPrompt,
  rumor,
} from './prompts';
import { characterMappingService } from './services/character-mapping-service';
import { TrendingTopicsEngine } from './TrendingTopicsEngine';
import type { JsonValue } from './types/common';
import type { FeedPost } from './types/shared';
import {
  type EventCooldownState,
  generateSentimentSignal,
  securePickN,
  secureRandom,
  secureShuffle,
  shouldFireEvent,
} from './utils/entropy';

export interface MarketContext {
  markets: PerpMarketRecord[];
  significantMoves: { ticker: string; change: number }[];
}

/**
 * GameWorld Event Types
 */
export interface GameWorldEvents {
  'world:started': { data: { question: string; npcs: number } };
  'day:begins': { data: { day: number } };
  'npc:action': { npc: string; description: string };
  'npc:conversation': { description: string };
  'news:published': { npc: string; description: string };
  'rumor:spread': { description: string };
  'clue:revealed': { npc: string; description: string };
  'development:occurred': { description: string };
  'feed:post': FeedEvent;
  'outcome:revealed': { data: { outcome: boolean } };
  event: { type: string; data: JsonValue };
}

export interface WorldConfig {
  outcome: boolean;
  numNPCs?: number;
  duration?: number;
  verbosity?: 'minimal' | 'normal' | 'detailed';
}

// WorldEvent is now imported from @babylon/shared (see imports above)
// Re-export for backwards compatibility with files that import from './GameWorld'
export type { WorldEvent };

interface EmitterEvent {
  type: EmitterEventType;
  day: number;
  timestamp: number;
  description: string;
  npc?: string;
  data: EmitterEventData;
}

type EmitterEventType =
  | 'world:started'
  | 'day:begins'
  | 'npc:action'
  | 'npc:conversation'
  | 'news:published'
  | 'rumor:spread'
  | 'clue:revealed'
  | 'development:occurred'
  | 'outcome:revealed'
  | 'world:ended';

interface EmitterEventData {
  question?: string | null;
  outcome?: boolean | null;
  npcs?: number | null;
  day?: number | null;
  totalEvents?: number | null;
  npcId?: string | null;
  description?: string | null;
  [key: string]: JsonValue | undefined;
}

export interface NPC {
  id: string;
  name: string;
  role:
    | 'insider'
    | 'expert'
    | 'journalist'
    | 'whistleblower'
    | 'politician'
    | 'deceiver';
  knowsTruth: boolean; // Does this NPC know the real outcome?
  reliability: number; // 0-1, how often they tell truth
  personality: string;
}

export interface WorldState {
  id: string;
  question: string;
  outcome: boolean;
  currentDay: number;
  npcs: NPC[];
  events: WorldEvent[];
  timeline: DayEvent[];
  truthRevealed: boolean;
}

export interface GroupMessage {
  from: string;
  message: string;
  timestamp: string;
  clueStrength: number;
}

export interface DayEvent {
  day: number;
  summary: string;
  events: WorldEvent[];
  feedPosts?: FeedEvent[]; // Feed posts generated for this day
  groupChats?: Record<string, GroupMessage[]>; // Group chat messages for this day
  publicSentiment: number; // -1 to 1 (negative = NO, positive = YES)
}

/**
 * Game World Generator
 *
 * @class GameWorld
 * @extends EventEmitter
 *
 * @description
 * Creates autonomous game worlds with NPCs, events, and narratives that agents
 * observe and bet on. Generates complete 30-day story arcs with predetermined
 * outcomes that unfold naturally through events and social interactions.
 *
 * **Architecture:**
 * - Extends EventEmitter for real-time event streaming
 * - Uses FeedGenerator for social media simulation
 * - Optional LLM for rich content (falls back to templates)
 * - Deterministic outcome with organic information reveals
 *
 * **Events Emitted:**
 * - `world:started` - World generation begins
 * - `day:begins` - New day starts
 * - `npc:action` - NPC takes action
 * - `npc:conversation` - NPCs converse
 * - `news:published` - News article published
 * - `rumor:spread` - Rumor circulates
 * - `clue:revealed` - Information revealed
 * - `development:occurred` - Development happens
 * - `outcome:revealed` - Final outcome revealed
 * - `world:ended` - Generation complete
 * - `feed:post` - Social media post created
 *
 * **NPC Roles:**
 * - insider: Knows truth, high reliability
 * - expert: Analytical, moderate reliability
 * - journalist: Reports news, moderate reliability
 * - whistleblower: Reveals secrets, high reliability
 * - politician: Public statements, low reliability
 * - deceiver: Spreads misinformation, very low reliability
 *
 * @usage
 * Used for testing and simulation. GameEngine uses different architecture.
 *
 * @example
 * ```typescript
 * const world = new GameWorld({ outcome: true, numNPCs: 10 }, llm);
 *
 * world.on('feed:post', (post) => {
 *   console.log(`@${post.authorName}: ${post.content}`);
 * });
 *
 * world.on('day:begins', (event) => {
 *   console.log(`--- Day ${event.data.day} ---`);
 * });
 *
 * const result = await world.generate();
 * console.log(`Generated ${result.events.length} events over ${result.timeline.length} days`);
 * ```
 */

/**
 * Typed EventEmitter interface for GameWorld
 */
interface TypedGameWorldEmitter {
  on<K extends keyof GameWorldEvents>(
    event: K,
    listener: (data: GameWorldEvents[K]) => void
  ): this;
  emit<K extends keyof GameWorldEvents>(
    event: K,
    data: GameWorldEvents[K]
  ): boolean;
  off<K extends keyof GameWorldEvents>(
    event: K,
    listener: (data: GameWorldEvents[K]) => void
  ): this;
}

export class GameWorld extends EventEmitter implements TypedGameWorldEmitter {
  private config: Required<WorldConfig>;
  private events: WorldEvent[] = [];
  private currentDay = 0;
  private npcs: NPC[] = [];
  private feedGenerator: FeedGenerator;
  private trendingTopics?: TrendingTopicsEngine;
  private recentPosts: FeedPost[] = [];
  private tickCount = 0;
  private llm?: BabylonLLMClient;

  // Event cooldown state for probability-based generation
  private eventCooldowns: {
    rumor: EventCooldownState;
    leak: EventCooldownState;
    development: EventCooldownState;
    meeting: EventCooldownState;
    scandal: EventCooldownState;
    revelation: EventCooldownState;
  } = {
    rumor: {
      lastOccurrence: 0,
      minCooldown: 2,
      baseProbability: 0.25,
      decayRate: 0.15,
      maxProbability: 0.8,
    },
    leak: {
      lastOccurrence: 0,
      minCooldown: 3,
      baseProbability: 0.15,
      decayRate: 0.1,
      maxProbability: 0.6,
    },
    development: {
      lastOccurrence: 0,
      minCooldown: 4,
      baseProbability: 0.2,
      decayRate: 0.12,
      maxProbability: 0.7,
    },
    meeting: {
      lastOccurrence: 0,
      minCooldown: 3,
      baseProbability: 0.18,
      decayRate: 0.1,
      maxProbability: 0.65,
    },
    scandal: {
      lastOccurrence: 0,
      minCooldown: 5,
      baseProbability: 0.1,
      decayRate: 0.08,
      maxProbability: 0.5,
    },
    revelation: {
      lastOccurrence: 0,
      minCooldown: 6,
      baseProbability: 0.08,
      decayRate: 0.06,
      maxProbability: 0.4,
    },
  };

  /**
   * Create a new GameWorld generator
   *
   * @param config - World configuration options
   * @param llm - Optional LLM client for rich content generation
   *
   * @description
   * Initializes world generator with configuration. If LLM is provided, generates
   * rich, contextual content. Otherwise falls back to template-based generation.
   *
   * @example
   * ```typescript
   * // With LLM (rich content)
   * const world = new GameWorld({ outcome: true }, llmClient);
   *
   * // Without LLM (template-based)
   * const world = new GameWorld({ outcome: false });
   * ```
   */
  constructor(config: WorldConfig, llm?: BabylonLLMClient) {
    super();

    this.config = {
      outcome: config.outcome,
      numNPCs: config.numNPCs || 8,
      duration: config.duration || 30,
      verbosity: config.verbosity || 'normal',
    };

    this.llm = llm;
    this.feedGenerator = new FeedGenerator(llm);

    // Initialize trending topics engine if LLM is available
    if (llm) {
      this.trendingTopics = new TrendingTopicsEngine(llm);
      this.feedGenerator.setTrendingTopics(this.trendingTopics);
    }
  }

  /**
   * Generate complete game world simulation
   *
   * @returns Complete world state with 30-day timeline, events, and NPCs
   * @throws Never throws - handles errors internally and uses fallbacks
   *
   * @description
   * Generates a complete 30-day narrative world from start to finish. This is the
   * "actual reality" that agents observe through the social feed and bet on.
   *
   * **Generation Process:**
   * 1. **Setup**
   *    - Generate prediction question
   *    - Create NPCs with roles and reliability
   *    - Emit 'world:started' event
   *
   * 2. **Daily Generation** (30 days)
   *    - Generate phase-appropriate events (early/mid/late)
   *    - Generate feed posts from events (via FeedGenerator)
   *    - Generate group chat messages
   *    - Generate day summary
   *    - Calculate public sentiment
   *    - Emit events for monitoring
   *
   * 3. **Resolution**
   *    - Emit 'outcome:revealed' event
   *    - Finalize world state
   *
   * **Event Generation:**
   * - Uses LLM for rich, contextual content
   * - Falls back to templates if LLM unavailable
   * - Events become more specific toward outcome as days progress
   *
   * **Feed Generation:**
   * - NPCs react to events via FeedGenerator
   * - Posts include news, reactions, analysis, conspiracy theories
   * - Sentiment calculated from all posts
   *
   * **What Agents See:**
   * - Feed posts (filtered view of events)
   * - Public events only (not secret meetings)
   * - NPC statements (may be misleading)
   * - News coverage (may be biased)
   *
   * **What Agents DON'T See:**
   * - Predetermined outcome
   * - NPC reliability scores
   * - Truth values of statements
   * - Secret events
   *
   * @usage
   * Used for testing, simulation, and offline world generation.
   *
   * @example
   * ```typescript
   * const world = new GameWorld({ outcome: true, numNPCs: 10 }, llm);
   *
   * const state = await world.generate();
   *
   * console.log(`Question: ${state.question}`);
   * console.log(`Truth: ${state.outcome ? 'YES' : 'NO'}`);
   * console.log(`NPCs: ${state.npcs.length}`);
   * console.log(`Events: ${state.events.length}`);
   * console.log(`Days: ${state.timeline.length}`);
   *
   * // Analyze sentiment progression
   * state.timeline.forEach(day => {
   *   console.log(`Day ${day.day}: ${day.summary}`);
   *   console.log(`  Sentiment: ${day.publicSentiment.toFixed(2)}`);
   *   console.log(`  Events: ${day.events.length}`);
   *   console.log(`  Posts: ${day.feedPosts?.length || 0}`);
   * });
   * ```
   */
  async generate(): Promise<WorldState> {
    const worldId = await generateSnowflakeId();

    // 1. Create the scenario
    const question = this.generateQuestion();
    this.npcs = this.createNPCs();

    this.emitEvent('world:started', {
      question,
      outcome: this.config.outcome,
      npcs: this.npcs.length,
    });

    const timeline: DayEvent[] = [];

    // 2. Generate all 30 days of events
    for (let day = 1; day <= this.config.duration; day++) {
      this.currentDay = day;

      this.emitEvent('day:begins', { day }, `Day ${day} begins`);

      // Generate real-world events (now async with LLM)
      const worldEvents: WorldEvent[] = [];

      if (day <= 10) {
        worldEvents.push(...(await this.generateEarlyWorldEvents(day)));
      } else if (day <= 20) {
        worldEvents.push(...(await this.generateMidWorldEvents(day)));
      } else {
        worldEvents.push(...(await this.generateLateWorldEvents(day)));
      }

      // Generate feed posts from world events (no outcome parameter - prevents leakage)
      const feedPosts = await this.feedGenerator.generateDayFeed(
        day,
        worldEvents,
        this.npcs
      );

      // Accumulate posts for trending analysis and update trends
      this.tickCount++;
      if (feedPosts.length > 0) {
        this.recentPosts = [...this.recentPosts, ...feedPosts].slice(-200);

        // Update trending topics (engine handles interval internally)
        if (this.trendingTopics) {
          await this.trendingTopics.updateTrends(
            this.recentPosts,
            this.tickCount
          );
          this.feedGenerator.updateTrendContext();
        }
      }

      // Emit each feed post as it would appear
      feedPosts.forEach((post) => {
        this.emit('feed:post', post);
      });

      // Generate group chat messages
      const groupChatMessages = this.generateGroupMessages(day, worldEvents);

      // Generate day summary (uses LLM if available, falls back to template)
      const daySummary = await this.generateDaySummary(day, worldEvents);

      timeline.push({
        day,
        summary: daySummary,
        events: worldEvents,
        feedPosts,
        groupChats: groupChatMessages,
        publicSentiment: this.calculateFeedSentiment(feedPosts),
      });
    }

    // 3. Reveal outcome
    this.emitEvent(
      'outcome:revealed',
      { outcome: this.config.outcome },
      `The truth is revealed: The outcome is ${
        this.config.outcome ? 'SUCCESS' : 'FAILURE'
      }`
    );

    this.emitEvent('world:ended', {
      outcome: this.config.outcome,
      totalEvents: this.events.length,
    });

    return {
      id: worldId,
      question,
      outcome: this.config.outcome,
      currentDay: this.config.duration,
      npcs: this.npcs,
      events: this.events,
      timeline,
      truthRevealed: true,
    };
  }

  /**
   * Generate early world events (Days 1-10)
   * Real things happening that people will react to
   * Uses LLM to generate rich, contextual event descriptions
   */
  private async generateEarlyWorldEvents(day: number): Promise<WorldEvent[]> {
    const events: WorldEvent[] = [];
    const allWorldEvents = this.events.filter((e) => e.day < day); // Get previous events for context

    // Create actual world events that will trigger feed reactions
    if (day % 3 === 0) {
      // Generate rumor using LLM for richer content
      const rumorText = await this.generateRumor(day, allWorldEvents);

      const event = this.createEvent(
        `world-${day}-1`,
        day,
        'announcement',
        rumorText,
        this.npcs
          .filter((n) => n.role === 'insider')
          .map((n) => n.id)
          .slice(0, 1),
        'leaked'
      );
      this.emitWorldEvent(event);
      events.push(event);
    }

    if (day === 5) {
      const insider = this.npcs.find((n) => n.role === 'insider');
      const journalist = this.npcs.find((n) => n.role === 'journalist');

      // Generate news report using LLM
      const newsReport = journalist
        ? await this.generateNewsReport(day, journalist, allWorldEvents)
        : this.config.outcome
          ? 'Internal memo shows project ahead of schedule'
          : 'Leaked documents reveal budget overruns';

      const event = this.createEvent(
        `world-${day}-2`,
        day,
        'leak',
        newsReport,
        insider ? [insider.id] : [],
        'leaked'
      );
      this.emitWorldEvent(event);
      events.push(event);
    }

    return events;
  }

  /**
   * Generate mid-game world events (Days 11-20)
   * Signals become more balanced with slight bias toward truth.
   * Uses probability-based triggers with phase-appropriate signal strength.
   */
  private async generateMidWorldEvents(day: number): Promise<WorldEvent[]> {
    const events: WorldEvent[] = [];
    const allWorldEvents = this.events.filter((e) => e.day < day);

    // Development event - key turning points
    if (shouldFireEvent(this.eventCooldowns.development, day)) {
      const experts = this.npcs.filter((n) => n.role === 'expert');
      const expert = experts.length > 0 ? secureShuffle(experts)[0] : undefined;

      const expertAnalysisText = expert
        ? await this.generateExpertAnalysis(expert, allWorldEvents)
        : this.config.outcome
          ? 'Major breakthrough achieved in critical testing phase'
          : 'Critical system failure discovered during final tests';

      // Mid-phase: moderate signal strength, moderate noise
      const sentimentSignal = generateSentimentSignal(
        this.config.outcome,
        0.5, // medium signal
        0.25 // moderate noise
      );

      // Pick random mix of experts and insiders
      const relevantNpcs = this.npcs.filter(
        (n) => n.role === 'expert' || n.role === 'insider'
      );
      const selectedNpcs = securePickN(relevantNpcs, 2);

      const event = this.createEvent(
        `world-${day}-${secureRandom().toString(36).slice(2, 8)}`,
        day,
        'development',
        expertAnalysisText,
        selectedNpcs.map((n) => n.id),
        'public',
        this.sentimentToDirection(sentimentSignal)
      );
      this.emitWorldEvent(event);
      events.push(event);
    }

    // Meeting event - leaked conversations
    if (shouldFireEvent(this.eventCooldowns.meeting, day)) {
      // Pick random subset of NPCs for the conversation
      const shuffledNpcs = secureShuffle(this.npcs);
      const participants = shuffledNpcs.slice(
        0,
        2 + Math.floor(secureRandom() * 2)
      ); // 2-3 participants

      const conversationText = await this.generateNPCConversation(
        day,
        participants,
        allWorldEvents
      );

      // Meetings can reveal mixed signals
      const sentimentSignal = generateSentimentSignal(
        this.config.outcome,
        0.45,
        0.3
      );

      const event = this.createEvent(
        `world-${day}-${secureRandom().toString(36).slice(2, 8)}`,
        day,
        'meeting',
        conversationText,
        participants.map((n) => n.id),
        'leaked',
        this.sentimentToDirection(sentimentSignal)
      );
      this.emitWorldEvent(event);
      events.push(event);
    }

    return events;
  }

  /**
   * Generate late game world events (Days 21-30)
   * Signals become clearer and more strongly point toward the truth.
   * Higher probability of significant events as resolution approaches.
   */
  private async generateLateWorldEvents(day: number): Promise<WorldEvent[]> {
    const events: WorldEvent[] = [];
    const allWorldEvents = this.events.filter((e) => e.day < day);

    // Calculate urgency multiplier - probability increases as we approach day 30
    const daysRemaining = 30 - day;
    const urgencyMultiplier = 1 + (10 - daysRemaining) * 0.1; // 1.0 to 2.0

    // Scandal/revelation events - more likely in late game
    const adjustedScandalState = {
      ...this.eventCooldowns.scandal,
      baseProbability:
        this.eventCooldowns.scandal.baseProbability * urgencyMultiplier,
    };

    if (shouldFireEvent(adjustedScandalState, day)) {
      this.eventCooldowns.scandal.lastOccurrence = day;

      const whistleblowers = this.npcs.filter(
        (n) => n.role === 'whistleblower'
      );
      const journalists = this.npcs.filter((n) => n.role === 'journalist');
      const whistleblower =
        whistleblowers.length > 0
          ? secureShuffle(whistleblowers)[0]
          : undefined;
      const journalist =
        journalists.length > 0 ? secureShuffle(journalists)[0] : undefined;

      const whistleblowerReport = journalist
        ? await this.generateNewsReport(day, journalist, allWorldEvents)
        : this.config.outcome
          ? 'Whistleblower leaks documents confirming project success'
          : 'Whistleblower reveals documents showing project failure';

      // Late phase: strong signal, low noise
      const sentimentSignal = generateSentimentSignal(
        this.config.outcome,
        0.75, // strong signal
        0.15 // low noise
      );

      const event = this.createEvent(
        `world-${day}-${secureRandom().toString(36).slice(2, 8)}`,
        day,
        'scandal',
        whistleblowerReport,
        whistleblower ? [whistleblower.id] : [],
        'public',
        this.sentimentToDirection(sentimentSignal)
      );
      this.emitWorldEvent(event);
      events.push(event);
    }

    // Development/revelation events - climactic moments
    const adjustedDevState = {
      ...this.eventCooldowns.development,
      baseProbability:
        this.eventCooldowns.development.baseProbability * urgencyMultiplier,
    };

    if (shouldFireEvent(adjustedDevState, day)) {
      this.eventCooldowns.development.lastOccurrence = day;

      const experts = this.npcs.filter((n) => n.role === 'expert');
      const expert = experts.length > 0 ? secureShuffle(experts)[0] : undefined;

      const finalAnalysis = expert
        ? await this.generateExpertAnalysis(expert, allWorldEvents)
        : this.config.outcome
          ? 'Final test successful - all systems operational'
          : 'Final test failed - project officially cancelled';

      // Very late (last 3 days): very strong signal
      const signalStrength = daysRemaining <= 3 ? 0.9 : 0.7;
      const noiseLevel = daysRemaining <= 3 ? 0.05 : 0.15;
      const sentimentSignal = generateSentimentSignal(
        this.config.outcome,
        signalStrength,
        noiseLevel
      );

      const relevantNpcs = this.npcs.filter(
        (n) => n.role === 'insider' || n.role === 'expert'
      );
      const selectedNpcs = securePickN(relevantNpcs, 2);

      const event = this.createEvent(
        `world-${day}-${secureRandom().toString(36).slice(2, 8)}`,
        day,
        'development',
        finalAnalysis,
        selectedNpcs.map((n) => n.id),
        'public',
        this.sentimentToDirection(sentimentSignal)
      );
      this.emitWorldEvent(event);
      events.push(event);
    }

    return events;
  }

  /**
   * Convert a sentiment signal (-1 to 1) to a direction
   * Uses fuzzy threshold to avoid perfect correlation
   */
  private sentimentToDirection(sentiment: number): 'YES' | 'NO' | null {
    // Add slight randomness to threshold
    const threshold = 0.2 + secureRandom() * 0.15;

    if (Math.abs(sentiment) < threshold) {
      return null; // Ambiguous
    }
    return sentiment > 0 ? 'YES' : 'NO';
  }

  /**
   * Create NPCs for the world
   */
  private createNPCs(): NPC[] {
    const npcTemplates = [
      {
        role: 'insider' as const,
        name: 'Insider Ian',
        knowsTruth: true,
        reliability: 0.9,
      },
      {
        role: 'expert' as const,
        name: 'Expert Emma',
        knowsTruth: false,
        reliability: 0.7,
      },
      {
        role: 'journalist' as const,
        name: 'Channel 7 News',
        knowsTruth: false,
        reliability: 0.6,
      },
      {
        role: 'whistleblower' as const,
        name: 'Whistleblower Wendy',
        knowsTruth: true,
        reliability: 0.95,
      },
      {
        role: 'politician' as const,
        name: 'Senator Smith',
        knowsTruth: false,
        reliability: 0.3,
      },
      {
        role: 'deceiver' as const,
        name: 'Conspiracy Carl',
        knowsTruth: false,
        reliability: 0.1,
      },
      {
        role: 'journalist' as const,
        name: 'TechJournal',
        knowsTruth: false,
        reliability: 0.6,
      },
      {
        role: 'insider' as const,
        name: 'Engineer Eve',
        knowsTruth: true,
        reliability: 0.85,
      },
    ];

    return npcTemplates.slice(0, this.config.numNPCs).map((template, i) => ({
      id: `npc-${i}`,
      name: template.name,
      role: template.role,
      knowsTruth: template.knowsTruth,
      reliability: template.reliability,
      personality: this.generatePersonality(),
    }));
  }

  private generateQuestion(): string {
    const questions = [
      "Will Project Omega's satellite launch succeed?",
      'Will the scandal force President Stump to resign?',
      'Will TechCorp announce the AI breakthrough?',
      'Will the climate summit reach an agreement?',
      'Will the merger between MegaCorp and TechGiant close?',
    ];
    const index = Math.floor(Math.random() * questions.length);
    return questions[index] ?? questions[0]!;
  }

  private generatePersonality(): string {
    const personalities = [
      'cautious',
      'bold',
      'analytical',
      'emotional',
      'contrarian',
    ];
    const index = Math.floor(Math.random() * personalities.length);
    return personalities[index] ?? personalities[0]!;
  }

  private async generateNewsReport(
    day: number,
    journalist: NPC,
    events: WorldEvent[]
  ): Promise<string> {
    if (!this.llm) {
      // Fallback to template-based generation
      return this.config.outcome
        ? `Day ${day} analysis: Sources suggest positive developments`
        : `Day ${day} investigation: Multiple concerns raised by experts`;
    }

    const reputationContext =
      journalist.reliability > 0.7 ? 'reliable' : 'questionable';
    const truthContext = journalist.knowsTruth
      ? 'hints at'
      : 'speculates about';

    const recentEventsStr =
      events.length > 0
        ? events.map((e) => e.description).join('; ')
        : 'Quiet period in the markets.';

    const prompt = renderPrompt(newsReport, {
      day: day.toString(),
      question: this.generateQuestion(),
      outcome: this.config.outcome ? 'YES' : 'NO',
      journalistName: journalist.name,
      journalistRole: journalist.role,
      journalistReliability: journalist.reliability.toString(),
      recentEvents: recentEventsStr, // Use patched variable
      reputationContext,
      truthContext,
    });

    const rawResponse = await this.llm.generateJSON<
      | { headline: string; report: string }
      | { response: { headline: string; report: string } }
    >(prompt, undefined, { promptType: 'world_generate_news_report' });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { headline: string; report: string });

    // Apply character mapping to replace any real names with fictional equivalents
    const processedHeadline = await characterMappingService.transformText(
      response.headline
    );
    const processedReport = await characterMappingService.transformText(
      response.report
    );

    return `${processedHeadline.transformedText}\n\n${processedReport.transformedText}`;
  }

  private async generateRumor(
    day: number,
    events: WorldEvent[]
  ): Promise<string> {
    if (!this.llm) {
      // Fallback to template-based generation
      const rumors = this.config.outcome
        ? [
            'Unconfirmed: Test results exceeding expectations',
            'Rumor: Key milestone reached ahead of schedule',
          ]
        : [
            'Unconfirmed: Internal memos show concerns',
            'Rumor: Key stakeholders expressing doubts',
          ];
      const index = Math.floor(Math.random() * rumors.length);
      return rumors[index] ?? rumors[0]!;
    }

    const outcomeHint = this.config.outcome
      ? 'Leans positive'
      : 'Raises concerns';

    // Handle empty events list
    const recentEventsStr =
      events.length > 0
        ? events
            .slice(-3)
            .map((e) => e.description)
            .join('; ')
        : 'No major public events yet, but tension is building.';

    const prompt = renderPrompt(rumor, {
      day: day.toString(),
      question: this.generateQuestion(),
      outcome: this.config.outcome ? 'YES' : 'NO',
      recentEvents: recentEventsStr, // Use patched variable
      outcomeHint,
    });

    const rawResponse = await this.llm.generateJSON<
      { rumor: string } | { response: { rumor: string } }
    >(prompt, undefined, { promptType: 'world_generate_rumor' });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { rumor: string });

    // Apply character mapping to replace any real names with fictional equivalents
    const processed = await characterMappingService.transformText(
      response.rumor
    );
    return processed.transformedText;
  }

  private async generateNPCConversation(
    day: number,
    npcs: NPC[],
    events: WorldEvent[]
  ): Promise<string> {
    if (!this.llm) {
      return `NPCs debate the situation on Day ${day}. Mixed opinions emerge.`;
    }

    const participants = npcs.slice(0, 3);
    const participantsStr = participants
      .map((n) => `${n.name} (${n.role}, knows truth: ${n.knowsTruth})`)
      .join(', ');

    const prompt = renderPrompt(npcConversation, {
      day: day.toString(),
      question: this.generateQuestion(),
      outcome: this.config.outcome ? 'YES' : 'NO',
      participants: participantsStr,
      recentEvents:
        events.length > 0
          ? events
              .slice(-2)
              .map((e) => e.description)
              .join('; ')
          : 'The current state of the market.',
    });

    const rawResponse = await this.llm.generateJSON<
      { conversation: string } | { response: { conversation: string } }
    >(prompt, undefined, { promptType: 'world_generate_npc_conversation' });

    // Handle XML structure
    const response =
      rawResponse && 'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { conversation: string });

    // SAFEGUARD: Ensure we have a string before processing
    const textToProcess =
      typeof response?.conversation === 'string'
        ? response.conversation
        : 'NPCs discuss the situation.';

    // Apply character mapping to replace any real names with fictional equivalents
    const processed =
      await characterMappingService.transformText(textToProcess);
    return processed.transformedText;
  }

  private async generateExpertAnalysis(
    expert: NPC,
    events: WorldEvent[]
  ): Promise<string> {
    if (!this.llm) {
      return `${expert.name} publishes analysis: ${
        this.config.outcome ? 'Indicators positive' : 'Warning signs evident'
      }`;
    }

    const confidenceContext = expert.knowsTruth
      ? 'Confidently points toward truth'
      : 'Makes educated guesses';
    const reliabilityContext =
      expert.reliability > 0.7 ? 'accurate' : 'sometimes wrong';

    const prompt = renderPrompt(expertAnalysis, {
      expertName: expert.name,
      question: this.generateQuestion(),
      outcome: this.config.outcome ? 'YES' : 'NO',
      expertRole: expert.role,
      knowsTruth: expert.knowsTruth.toString(),
      reliability: expert.reliability.toString(),
      recentEvents:
        events.length > 0
          ? events
              .slice(-5)
              .map((e) => e.description)
              .join('; ')
          : 'Underlying market indicators.',
      confidenceContext,
      reliabilityContext,
    });

    const rawResponse = await this.llm.generateJSON<
      { analysis: string } | { response: { analysis: string } }
    >(prompt, undefined, { promptType: 'world_generate_expert_analysis' });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { analysis: string });

    // Apply character mapping to replace any real names with fictional equivalents
    const processed = await characterMappingService.transformText(
      response.analysis
    );
    return `${expert.name}: ${processed.transformedText}`;
  }

  private async generateDaySummary(
    day: number,
    events: WorldEvent[]
  ): Promise<string> {
    if (!this.llm || events.length === 0) {
      if (events.length === 0)
        return `Day ${day}: Quiet day, no major developments`;
      const types = events.map((e) => e.type);
      if (types.includes('development:occurred'))
        return `Day ${day}: MAJOR DEVELOPMENT`;
      if (types.includes('news:published')) return `Day ${day}: News coverage`;
      return `Day ${day}: ${events.length} events`;
    }

    const prompt = renderPrompt(daySummary, {
      day: day.toString(),
      question: this.generateQuestion(),
      eventsToday: events.map((e) => `${e.type}: ${e.description}`).join('; '),
      outcome: this.config.outcome ? 'YES' : 'NO',
    });

    const rawResponse = await this.llm.generateJSON<
      { summary: string } | { response: { summary: string } }
    >(prompt, undefined, { promptType: 'world_generate_day_summary' });

    // Handle XML structure
    const response =
      'response' in rawResponse && rawResponse.response
        ? rawResponse.response
        : (rawResponse as { summary: string });

    // Apply character mapping to replace any real names with fictional equivalents
    const processed = await characterMappingService.transformText(
      response.summary
    );
    return processed.transformedText;
  }

  private calculateFeedSentiment(feedPosts: FeedEvent[]): number {
    if (feedPosts.length === 0) return 0;

    const totalSentiment = feedPosts.reduce(
      (sum, post) => sum + (post.sentiment ?? 0),
      0
    );
    return totalSentiment / feedPosts.length;
  }

  /**
   * Generate group chat messages for the day
   */
  private generateGroupMessages(
    day: number,
    worldEvents: WorldEvent[]
  ): Record<string, GroupMessage[]> {
    const messages: Record<string, GroupMessage[]> = {};

    // Simple group messages (fallback for non-LLM mode)
    // NOTE: GameGenerator provides LLM-powered group messages for full game generation
    // Use probability instead of deterministic day check
    const shouldGenerateGroupMessages =
      worldEvents.length > 0 && secureRandom() < 0.35;
    if (shouldGenerateGroupMessages) {
      const firstEvent = worldEvents[0];
      if (firstEvent) {
        messages['group-0'] = [
          {
            from: this.npcs[0]?.name || 'Insider',
            message: `Heard something about ${firstEvent.description}...`,
            timestamp: `2025-10-${String(day).padStart(2, '0')}T12:00:00Z`,
            clueStrength: 0.5,
          },
        ];
      }
    }

    return messages;
  }

  /**
   * Create a properly structured WorldEvent
   * Used by event generation methods to create game story events
   *
   * @param id - Unique event identifier
   * @param day - Day number
   * @param type - Event type
   * @param description - Event description
   * @param actors - Actor IDs involved
   * @param visibility - Event visibility level
   * @param pointsToward - Direction signal (derived from sentiment if not provided)
   * @param sentimentData - Optional sentiment signal data
   */
  private createEvent(
    id: string,
    day: number,
    type: WorldEvent['type'],
    description: string,
    actors: string[],
    visibility: WorldEvent['visibility'],
    pointsToward?: WorldEvent['pointsToward'],
    sentimentData?: {
      sentimentSignal: number;
      signalClarity: number;
      sourceReliability: number;
    }
  ): WorldEvent {
    // Generate default sentiment data if not provided but pointsToward is
    let sentiment = sentimentData;
    if (!sentiment && pointsToward) {
      // Convert pointsToward to sentiment signal
      sentiment = {
        sentimentSignal: generateSentimentSignal(
          pointsToward === 'YES',
          0.6,
          0.2
        ),
        signalClarity: 0.5 + secureRandom() * 0.3,
        sourceReliability: 0.5 + secureRandom() * 0.3,
      };
    }

    return {
      id,
      day,
      type,
      description,
      actors,
      visibility,
      pointsToward,
      // Include sentiment data if available
      ...(sentiment && {
        sentimentSignal: sentiment.sentimentSignal,
        signalClarity: sentiment.signalClarity,
        sourceReliability: sentiment.sourceReliability,
      }),
    };
  }

  /**
   * Emit an internal system event (not a story event)
   * Used for EventEmitter tracking of world state changes
   */
  private emitEvent(
    type: EmitterEventType,
    data: EmitterEventData,
    description?: string
  ) {
    const event: EmitterEvent = {
      type,
      day: this.currentDay,
      timestamp: Date.now(),
      description: description || type,
      data,
    };

    this.emit(type, event);
    this.emit('event', event);
  }

  /**
   * Generate events for a specific tick, incorporating market feedback
   * This replaces/augments the static daily generation
   */
  public async generateTickEvents(
    day: number,
    hour: number,
    marketContext?: MarketContext
  ): Promise<WorldEvent[]> {
    const events: WorldEvent[] = [];

    // 1. Check for Market-Driven Events (Emergence)
    if (marketContext && marketContext.significantMoves.length > 0) {
      for (const move of marketContext.significantMoves) {
        // If market crashes > 20%
        if (move.change < -20) {
          events.push({
            id: await generateSnowflakeId(),
            day,
            type: 'scandal',
            visibility: 'public',
            description: `Market crash for ${move.ticker} triggers emergency board meeting. Rumors of insolvency circulate.`,
            actors: [], // Fill with relevant actors
            pointsToward: 'NO',
          });
        }
        // If market pumps > 20%
        else if (move.change > 20) {
          events.push({
            id: await generateSnowflakeId(),
            day,
            type: 'development',
            visibility: 'public',
            description: `${move.ticker} stock surges to record highs amidst acquisition rumors.`,
            actors: [],
            pointsToward: 'YES',
          });
        }
      }
    }

    // 2. Standard Narrative Events (from existing logic)
    // Simple probabilistic event generation for non-market hours
    // Events mostly happen during day hours (8am - 8pm)
    const isDaytime = hour >= 8 && hour <= 20;
    const eventChance = isDaytime ? 0.1 : 0.02; // 10% chance per hour during day, 2% at night

    if (Math.random() < eventChance) {
      // Generate a random event appropriate for the game phase
      let newEvent: WorldEvent[] = [];
      if (day <= 10) {
        newEvent = await this.generateEarlyWorldEvents(day);
      } else if (day <= 20) {
        newEvent = await this.generateMidWorldEvents(day);
      } else {
        newEvent = await this.generateLateWorldEvents(day);
      }

      // Add if we got one
      if (newEvent.length > 0) {
        events.push(...newEvent);
      }
    }

    return events;
  }

  /**
   * Add a WorldEvent to the events log and emit it
   * Used by event generation methods to track and broadcast story events
   */
  private emitWorldEvent(event: WorldEvent) {
    this.events.push(event);
    this.emit(event.type, event);
    this.emit('event', event);
  }
}
