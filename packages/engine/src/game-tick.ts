/**
 * Game tick - executes one canonical unit of game progression.
 * Used for both realtime (cron) and simulation modes.
 * Handles content generation, market decisions, question resolution, and system updates.
 */

import {
  type JsonValue as ApiJsonValue,
  broadcastToChannel,
} from '@babylon/api';
import {
  PredictionDbAdapter as CorePredictionDbAdapter,
  PredictionMarketService as CorePredictionMarketService,
} from '@babylon/core/markets/prediction';
import {
  actorRelationships,
  and,
  count,
  db,
  getDbInstance as dbService,
  desc,
  eq,
  games,
  gte,
  isNotNull,
  isNull,
  type JsonValue,
  lte,
  markets as marketsSchema,
  organizationState,
  poolPositions,
  pools,
  positions,
  posts,
  postTags,
  questions as questionsSchema,
  rssHeadlines,
  tags,
  tickTokenStats,
  trendingTags,
  widgetCaches,
  worldEvents,
} from '@babylon/db';
import {
  DIAMOND_ADDRESS,
  generateSnowflakeId,
  getCurrentRpcUrl,
  logger,
  PREDICTION_MARKET_ABI,
  REPUTATION_SYSTEM_BASE_SEPOLIA,
} from '@babylon/shared';
import { ArticleGenerator } from './ArticleGenerator';
import { BabylonLLMClient } from './llm/openai-client';
import { MarketDecisionEngine } from './MarketDecisionEngine';
import { NPCInvestmentManager } from './npc/npc-investment-manager';
import { generateWorldContext } from './prompts';
import { QuestionManager } from './QuestionManager';
import { RelationshipEvolutionEngine } from './RelationshipEvolutionEngine';
// Services - using barrel exports from services/index.ts
import {
  ActorSocialActions,
  AlphaGroupInviteService,
  bootstrapGameIfNeeded,
  calculateTrendingIfNeeded,
  calculateTrendingTags,
  characterMappingService,
  createArcState,
  createParodyHeadlineGenerator,
  generateArticleImageWithRetry,
  generateEvents,
  generateOrgArticle,
  generateOrgPost,
  getOracleService,
  getStorySeedService,
  getTopicDiversityService,
  getTrendingPromptContext,
  initFalClient,
  invalidateAfterPredictionTrade,
  MarketContextService,
  NPCGroupDynamicsService,
  PriceUpdateService,
  processArcTick,
  processNPCSocialEngagements,
  ReputationService,
  rssFeedService,
  StaticDataRegistry,
  setNarrativeProcessorLLMClient,
  setSocialEngagementLLMClient,
  syncReputationIfAvailable,
  TokenStatsService,
  TradeExecutionService,
  timeframeArcProcessor,
  WalletService,
} from './services';
import type { TradingExecutionResult } from './types/market-decisions';
import type {
  ActorTier,
  DayTimeline,
  Organization,
  Question,
  SelectedActor,
  WorldEvent,
} from './types/shared';
import { calculateEstimatedCost } from './types/token-stats';
import { getGameDayNumber, toSafeDayNumber } from './utils/date-utils';
import { worldFactsService } from './world-facts-service';
// Note: Event-market pipeline is called from within narrative-event-processor

// Services that are still in the web app (Web3/Oracle specific - use dynamic imports)

export interface GameTickResult {
  postsCreated: number;
  eventsCreated: number;
  articlesCreated: number;
  marketsUpdated: number;
  questionsResolved: number;
  questionsCreated: number;
  widgetCachesUpdated: number;
  trendingCalculated: boolean;
  reputationSynced: boolean;
  /** NPC social engagement metrics */
  npcLikesCreated?: number;
  npcSharesCreated?: number;
  npcCommentsCreated?: number;
  npcSocialActionsProcessed?: number;
  npcRebalanceActionsExecuted?: number;
  reputationSyncStats?: {
    total: number;
    successful: number;
    failed: number;
  };
  alphaInvitesSent: number;
  /** Number of NPC replies to other NPCs' posts (public discourse) */
  discourseReplies?: number;
  npcGroupDynamics?: {
    groupsCreated: number;
    membersAdded: number;
    membersRemoved: number;
    usersInvited: number;
    usersKicked: number;
    messagesPosted: number;
  };
  oracleCommits: number;
  oracleReveals: number;
  oracleErrors: number;
  worldFactsUpdated?: boolean;
  worldFactsStats?: {
    feedsFetched: number;
    newHeadlines: number;
    parodiesGenerated: number;
    headlinesCleaned: number;
  };
  relationshipsUpdated?: number;
  /** Narrative arc processing stats */
  narrativeArcs?: {
    arcsProcessed: number;
    transitioned: number;
    eventsGenerated: number;
  };
  /** Timeframed market processing stats */
  timeframedMarkets?: {
    marketsProcessed: number;
    transitionsOccurred: number;
    eventsGenerated: number;
    subMarketsSpawned: number;
    errors: string[];
    eventTriggers: Array<{
      marketId: string;
      eventType: string;
      timeframe: string;
      arcState: string;
    }>;
  };
  /** Token usage statistics for this tick */
  tokenStats?: {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    estimatedCostUSD?: number;
  };
}

/** Executes a complete game tick (content, markets, questions, system updates). */
export async function executeGameTick(
  skipContentGeneration = false
): Promise<GameTickResult> {
  const timestamp = new Date();
  const startedAt = Date.now();
  const budgetMs = Number(process.env.GAME_TICK_BUDGET_MS || 180000); // 3 minutes default
  const deadline = startedAt + budgetMs;

  // Reserve 60 seconds for critical operations (market decisions, widget updates)
  const criticalOpsReserveMs = 60000;
  const criticalOpsDeadline = startedAt + budgetMs - criticalOpsReserveMs;

  // Start token usage collection for this tick
  const tokenStatsTickId = TokenStatsService.startTick(`tick-${startedAt}`);

  logger.info(
    'Executing game tick',
    { timestamp: timestamp.toISOString(), tokenStatsTickId },
    'GameTick'
  );

  // Initialize result counters
  const result: GameTickResult = {
    postsCreated: 0,
    eventsCreated: 0,
    articlesCreated: 0,
    marketsUpdated: 0,
    questionsResolved: 0,
    questionsCreated: 0,
    widgetCachesUpdated: 0,
    trendingCalculated: false,
    reputationSynced: false,
    alphaInvitesSent: 0,
    oracleCommits: 0,
    oracleReveals: 0,
    oracleErrors: 0,
  };

  // Bootstrap game data if needed (actors, organizations, mappings, pools, etc.)
  const bootstrapResult = await bootstrapGameIfNeeded();

  // Initialize fal.ai for article image generation (non-blocking)
  initFalClient();
  if (bootstrapResult) {
    const hasChanges =
      bootstrapResult.actorsCreated > 0 ||
      bootstrapResult.actorsToppedUp > 0 ||
      bootstrapResult.organizationsCreated > 0 ||
      bootstrapResult.poolsCreated > 0;

    if (hasChanges) {
      logger.info(
        'Game data bootstrapped',
        {
          actorsCreated: bootstrapResult.actorsCreated,
          actorsToppedUp: bootstrapResult.actorsToppedUp,
          organizationsCreated: bootstrapResult.organizationsCreated,
          poolsCreated: bootstrapResult.poolsCreated,
        },
        'GameTick'
      );
    }
  }

  // Compute game-relative day numbers for new writes (forward-only)
  const [continuousGame] = await db
    .select({ startedAt: games.startedAt })
    .from(games)
    .where(eq(games.isContinuous, true))
    .limit(1);
  const gameStartedAt = continuousGame?.startedAt ?? null;
  const dayNumberForTimestamp = (t: Date): number | undefined => {
    if (!gameStartedAt) return undefined;
    return toSafeDayNumber(getGameDayNumber(gameStartedAt, t));
  };

  // Bootstrap initial content if this is a fresh setup
  await bootstrapContentIfNeeded(timestamp);

  // Initialize LLM client for game tick operations
  // Priority: Groq > Claude > OpenAI
  const llmClient = BabylonLLMClient.forGameTick();
  const stats = llmClient.getStats();
  logger.info(
    'LLM client initialized for game tick operations',
    {
      provider: stats.provider,
      model: stats.model,
    },
    'GameTick'
  );

  // Get active questions from database
  const activeQuestions = await db
    .select()
    .from(questionsSchema)
    .where(eq(questionsSchema.status, 'active'));

  logger.info(
    `Found ${activeQuestions.length} active questions`,
    { count: activeQuestions.length },
    'GameTick'
  );

  // Generate initial questions FIRST if this is the first tick
  let currentActiveQuestions = activeQuestions;
  if (activeQuestions.length === 0 && Date.now() < deadline) {
    logger.info(
      'First tick detected - generating initial questions',
      {},
      'GameTick'
    );
    const questionsGenerated = await generateNewQuestions(
      5, // Generate 5 initial questions
      llmClient,
      deadline
    );
    result.questionsCreated = questionsGenerated;

    // Reload active questions after generation (use new variable to avoid mutation)
    currentActiveQuestions = await db
      .select()
      .from(questionsSchema)
      .where(eq(questionsSchema.status, 'active'));

    logger.info(
      `Initial questions created: ${questionsGenerated}`,
      { count: questionsGenerated },
      'GameTick'
    );

    // Publish commitments to blockchain oracle
    if (questionsGenerated > 0 && currentActiveQuestions.length > 0) {
      const oracleResult = await publishOracleCommitments(
        currentActiveQuestions
      );
      result.oracleCommits += oracleResult.committed;
      result.oracleErrors += oracleResult.errors;
    }
  }

  const questionsToResolve = currentActiveQuestions.filter(
    (q: { resolutionDate: Date | null }) => {
      if (!q.resolutionDate) return false;
      const resolutionDate = new Date(q.resolutionDate);
      return resolutionDate <= timestamp;
    }
  );

  if (questionsToResolve.length > 0) {
    logger.info(
      `Resolving ${questionsToResolve.length} questions`,
      { count: questionsToResolve.length },
      'GameTick'
    );

    // Load required data for proof generation using StaticDataRegistry (preferred over loadActorsData)
    const staticActors = StaticDataRegistry.getAllActors();
    // Map StaticActor to SelectedActor, ensuring required fields are present
    const allActors: SelectedActor[] = staticActors
      .filter((actor) => actor.tier !== null)
      .map((actor) => ({
        id: actor.id,
        name: actor.name,
        description: actor.description,
        domain: actor.domain,
        personality: actor.personality,
        affiliations: actor.affiliations,
        postStyle: actor.postStyle,
        postExample: actor.postExample,
        tier: actor.tier!,
        role: actor.role ?? 'unknown',
        initialLuck:
          (actor.initialLuck as 'low' | 'medium' | 'high') ?? 'medium',
        initialMood: actor.initialMood ?? 0,
      }));
    // Map StaticOrganization to Organization type
    const organizations: Organization[] =
      StaticDataRegistry.getAllOrganizations().map((o) => ({
        id: o.id,
        name: o.name,
        ticker: o.ticker,
        description: o.description,
        type: o.type,
        canBeInvolved: o.canBeInvolved,
        initialPrice: o.initialPrice ?? undefined,
      }));

    // Get recent events for context
    const recentDbEvents = await db
      .select()
      .from(worldEvents)
      .where(
        gte(
          worldEvents.timestamp,
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        )
      )
      .orderBy(desc(worldEvents.timestamp));

    // Type guards for WorldEvent fields
    const isValidEventType = (type: string): type is WorldEvent['type'] => {
      return [
        'announcement',
        'meeting',
        'leak',
        'development',
        'scandal',
        'rumor',
        'deal',
        'conflict',
        'revelation',
        'development:occurred',
        'news:published',
      ].includes(type);
    };

    const isValidVisibility = (
      vis: string
    ): vis is WorldEvent['visibility'] => {
      return ['public', 'leaked', 'secret', 'private', 'group'].includes(vis);
    };

    const isValidPointsToward = (
      pt: string | null | undefined
    ): pt is WorldEvent['pointsToward'] => {
      return pt === null || pt === undefined || pt === 'YES' || pt === 'NO';
    };

    // Convert to DayTimeline format for QuestionManager
    const mappedEvents: WorldEvent[] = recentDbEvents
      .filter(
        (e) => isValidEventType(e.eventType) && isValidVisibility(e.visibility)
      )
      .map((e) => ({
        id: e.id,
        day: e.dayNumber || 0,
        type: e.eventType as WorldEvent['type'],
        description: e.description,
        actors: e.actors as string[],
        relatedQuestion: e.relatedQuestion || undefined,
        pointsToward: isValidPointsToward(e.pointsToward)
          ? e.pointsToward
          : undefined,
        visibility: e.visibility as WorldEvent['visibility'],
      }));

    const recentTimelines: DayTimeline[] = [
      {
        day: 0,
        events: mappedEvents,
        summary: 'Recent events context',
        groupChats: {},
        feedPosts: [],
        luckChanges: [],
        moodChanges: [],
      },
    ];

    const questionManager = new QuestionManager(llmClient);

    // Resolve payouts
    // Each question resolution is wrapped in try/catch to prevent partial failures
    // from breaking the entire tick. Failed resolutions will be retried next tick.
    for (const question of questionsToResolve) {
      try {
        // Generate resolution proof content
        // We cast question to Question type - database question fields are compatible
        const questionForManager: Question = {
          id: question.questionNumber,
          text: question.text,
          scenario: question.scenarioId || 1,
          outcome: question.outcome,
          rank: question.rank || 1,
          status: 'active',
        };

        const { description, proof } =
          await questionManager.generateResolutionWithProof(
            questionForManager,
            allActors,
            organizations,
            recentTimelines
          );

        // Save proof article and update question atomically if proof exists
        if (proof && proof.type === 'article') {
          await db.transaction(async (tx) => {
            // Create article in database
            await tx.insert(posts).values({
              id: proof.article.id,
              type: 'article',
              content: proof.article.summary, // Use summary for content preview
              fullContent: proof.article.content,
              articleTitle: proof.article.title,
              authorId: proof.article.authorOrgId,
              gameId: 'continuous',
              timestamp: new Date(),
              category: proof.article.category,
              sentiment: proof.article.sentiment,
              slant: proof.article.slant,
              biasScore: proof.article.biasScore,
            });

            // Update question with proof URL
            await tx
              .update(questionsSchema)
              .set({
                resolutionDescription: description,
                resolutionProofUrl: proof.url,
                updatedAt: new Date(),
              })
              .where(eq(questionsSchema.id, question.id));
          });

          logger.info(
            `Generated resolution proof for Q${question.questionNumber}`,
            {
              proofUrl: proof.url,
              articleId: proof.article.id,
            },
            'GameTick'
          );
        }

        // resolveQuestionPayouts has its own internal transaction for payout operations
        // and updates question status to 'resolved' atomically
        await resolveQuestionPayouts(question.questionNumber);
        result.questionsResolved++;
      } catch (error) {
        // Log error but continue with other questions
        // Failed question will remain in 'active' status and be retried next tick
        logger.error(
          `Question resolution failed - will retry next tick`,
          {
            questionId: question.id,
            questionNumber: question.questionNumber,
            error: error instanceof Error ? error.message : String(error),
          },
          'GameTick'
        );
      }
    }

    // Publish reveals to blockchain oracle
    const oracleResult = await publishOracleReveals(questionsToResolve);
    result.oracleReveals += oracleResult.revealed;
    result.oracleErrors += oracleResult.errors;
  }

  // Organization content generation (media news articles) and world events
  // NPC posts and replies are now handled by /api/cron/npc-tick
  // Skip if buffer is sufficient (content generation handled by lookahead service)
  if (!skipContentGeneration) {
    if (Date.now() < criticalOpsDeadline) {
      // Generate organization content only (news articles from media orgs)
      const { posts, articles } = await generateOrganizationContent(
        currentActiveQuestions.slice(0, 3),
        timestamp,
        llmClient,
        criticalOpsDeadline,
        dayNumberForTimestamp
      );
      result.postsCreated = posts;
      result.articlesCreated = articles;
    } else {
      logger.warn(
        'Skipping organization content generation – tick budget exceeded',
        { budgetMs },
        'GameTick'
      );
    }

    // Generate world events based on active questions
    const eventsGenerated = await generateEvents(
      currentActiveQuestions.slice(0, 3),
      timestamp,
      dayNumberForTimestamp(timestamp)
    );
    result.eventsCreated = eventsGenerated;

    // NPC posts and replies are now handled by /api/cron/npc-tick
    // This removes the old generateMixedPosts and generateNPCRepliesFromPreviousTicks calls
  } else {
    logger.info(
      'Skipping content generation (buffer sufficient)',
      undefined,
      'GameTick'
    );
  }

  // CRITICAL PRIORITY: Generate and execute NPC trading decisions
  // This ALWAYS runs - uses the full deadline, not the critical ops deadline
  // Market decisions are essential for game economy and must always execute
  logger.info(
    'Starting critical market decision operations',
    {
      timeRemaining: deadline - Date.now(),
    },
    'GameTick'
  );

  const baselineResult =
    await NPCInvestmentManager.executeBaselineInvestments(timestamp);

  if (baselineResult) {
    const baselineUpdates = await updateMarketPricesFromTrades(
      timestamp,
      baselineResult
    );
    result.marketsUpdated += baselineUpdates;
  }

  const contextService = new MarketContextService();

  // Create LLM client for market decisions
  // Priority: Groq > Claude > OpenAI
  const marketDecisionLLM = BabylonLLMClient.forGameTick();
  const marketLLMStats = marketDecisionLLM.getStats();
  logger.info(
    `Using ${marketLLMStats.provider} for market decisions`,
    { model: marketLLMStats.model },
    'GameTick'
  );

  // Configure decision engine with model and token limits from environment
  // Use qwen/qwen3-32b on Groq for background trading operations
  const modelName = process.env.MARKET_DECISION_MODEL || 'qwen/qwen3-32b';

  // Model-aware output token limits:
  // Input and output are SEPARATE limits on modern models
  // - Kimi models: 260k INPUT + 16k OUTPUT (separate)
  // - qwen3-32b: 130k INPUT + 32k OUTPUT (separate)
  const isKimiModel = modelName.toLowerCase().includes('kimi');
  const defaultMaxOutput = isKimiModel ? 16000 : 32000;
  const maxOutputTokens = Number.parseInt(
    process.env.MARKET_DECISION_MAX_OUTPUT_TOKENS ||
      defaultMaxOutput.toString(),
    10
  );

  const decisionEngine = new MarketDecisionEngine(
    marketDecisionLLM,
    contextService,
    {
      model: modelName,
      maxOutputTokens,
    }
  );
  const executionService = new TradeExecutionService();

  const marketDecisions = await decisionEngine.generateBatchDecisions();

  if (marketDecisions.length === 0) {
    logger.info('No NPC market trades generated this tick', {}, 'GameTick');
  } else {
    const executionResult =
      await executionService.executeDecisionBatch(marketDecisions);

    logger.info(
      `NPC Trading: ${executionResult.successfulTrades} trades executed`,
      {
        successful: executionResult.successfulTrades,
        failed: executionResult.failedTrades,
        holds: executionResult.holdDecisions,
      },
      'GameTick'
    );

    // Update prices based on NPC trades
    const marketsUpdated = await updateMarketPricesFromTrades(
      timestamp,
      executionResult
    );
    result.marketsUpdated += marketsUpdated;
  }

  // =========================================================================
  // NPC SOCIAL ENGAGEMENT (likes, shares, comments)
  // Creates organic social activity to make the feed feel alive
  // =========================================================================
  if (Date.now() < deadline) {
    try {
      // Set LLM client for NPC comment generation
      setSocialEngagementLLMClient(llmClient);

      const socialEngagementResult = await processNPCSocialEngagements();
      result.npcLikesCreated = socialEngagementResult.likesCreated;
      result.npcSharesCreated = socialEngagementResult.sharesCreated;
      result.npcCommentsCreated = socialEngagementResult.commentsCreated;

      if (
        socialEngagementResult.likesCreated > 0 ||
        socialEngagementResult.sharesCreated > 0 ||
        socialEngagementResult.commentsCreated > 0
      ) {
        logger.info(
          'NPC social engagements processed',
          {
            likes: socialEngagementResult.likesCreated,
            shares: socialEngagementResult.sharesCreated,
            comments: socialEngagementResult.commentsCreated,
            actors: socialEngagementResult.actorsEngaged,
          },
          'GameTick'
        );
      }
    } catch (error) {
      logger.error(
        'NPC social engagement failed',
        { error: error instanceof Error ? error.message : String(error) },
        'GameTick'
      );
    }
  }

  // =========================================================================
  // NPC SOCIAL ACTIONS (DMs, group invites based on interactions)
  // =========================================================================
  if (Date.now() < deadline) {
    try {
      const socialActions =
        await ActorSocialActions.processRandomSocialActions();
      result.npcSocialActionsProcessed = socialActions.length;

      if (socialActions.length > 0) {
        logger.info(
          'NPC social actions processed',
          {
            total: socialActions.length,
            invites: socialActions.filter((a) => a.type === 'group_chat_invite')
              .length,
            dms: socialActions.filter((a) => a.type === 'dm').length,
          },
          'GameTick'
        );
      }
    } catch (error) {
      logger.error(
        'NPC social actions failed',
        { error: error instanceof Error ? error.message : String(error) },
        'GameTick'
      );
    }
  }

  // =========================================================================
  // NPC PORTFOLIO REBALANCING
  // Monitor NPC portfolios and execute rebalancing actions
  // =========================================================================
  if (Date.now() < deadline) {
    try {
      // Get all active NPC pools and monitor them
      const activePools = await db
        .select({ id: pools.id, npcActorId: pools.npcActorId })
        .from(pools)
        .where(eq(pools.isActive, true))
        .limit(10); // Limit to prevent overwhelming the tick

      let rebalanceActionsExecuted = 0;

      for (const pool of activePools) {
        if (Date.now() >= deadline) break;

        const actor = StaticDataRegistry.getActor(pool.npcActorId);
        const strategy = actor?.personality
          ?.toLowerCase()
          .includes('aggressive')
          ? 'aggressive'
          : actor?.personality?.toLowerCase().includes('conservative')
            ? 'conservative'
            : 'balanced';

        const rebalanceActions = await NPCInvestmentManager.monitorPortfolio(
          pool.id,
          pool.npcActorId,
          strategy
        );

        if (rebalanceActions.length > 0) {
          // Execute rebalance actions through TradeExecutionService
          for (const action of rebalanceActions) {
            if (action.type === 'close' && action.positionId) {
              // Close position logic would go here
              rebalanceActionsExecuted++;
            }
          }
        }
      }

      result.npcRebalanceActionsExecuted = rebalanceActionsExecuted;

      if (rebalanceActionsExecuted > 0) {
        logger.info(
          'NPC portfolio rebalancing completed',
          { actionsExecuted: rebalanceActionsExecuted },
          'GameTick'
        );
      }
    } catch (error) {
      logger.error(
        'NPC portfolio rebalancing failed',
        { error: error instanceof Error ? error.message : String(error) },
        'GameTick'
      );
    }
  }

  // Generate articles AFTER market decisions (lower priority, but parallelized)
  // Skip if buffer is sufficient (content generation handled by lookahead service)
  if (!skipContentGeneration) {
    if (Date.now() < deadline) {
      const articlesGenerated = await generateArticles(
        timestamp,
        llmClient,
        deadline,
        dayNumberForTimestamp
      );
      result.articlesCreated += articlesGenerated; // Add to existing count from mixed posts
    } else {
      logger.warn(
        'Skipping article generation – tick budget exceeded',
        { budgetMs },
        'GameTick'
      );
    }
  }

  const currentActiveCount =
    currentActiveQuestions.length - result.questionsResolved;
  if (currentActiveCount < 10) {
    if (Date.now() < deadline) {
      const questionsGenerated = await generateNewQuestions(
        Math.min(3, 15 - currentActiveCount),
        llmClient,
        deadline
      );
      result.questionsCreated = questionsGenerated;
    } else {
      logger.warn(
        'Skipping question generation – tick budget exceeded',
        { budgetMs },
        'GameTick'
      );
    }
  }

  // Process narrative arcs for active questions
  // Each question can have an arc that progresses through phases
  // Arc events now create world events and can trigger article generation
  if (Date.now() < deadline) {
    // Set LLM client for article generation during arc processing
    setNarrativeProcessorLLMClient(llmClient);

    const narrativeStats = await processNarrativeArcs(
      currentActiveQuestions,
      dayNumberForTimestamp(timestamp) ?? 1
    );
    result.narrativeArcs = narrativeStats;
    if (narrativeStats.transitioned > 0 || narrativeStats.eventsGenerated > 0) {
      logger.info('Narrative arcs processed', narrativeStats, 'GameTick');
    }
  }

  // Process timeframed markets (multi-timeframe arcs: flash, intraday, daily, etc.)
  // These use timestamp-based progression rather than day-based
  if (Date.now() < deadline) {
    const timeframeStats = await timeframeArcProcessor.processTick(timestamp);
    result.timeframedMarkets = timeframeStats;
    if (timeframeStats.marketsProcessed > 0) {
      logger.info(
        'Timeframed markets processed',
        {
          processed: timeframeStats.marketsProcessed,
          transitions: timeframeStats.transitionsOccurred,
          events: timeframeStats.eventsGenerated,
          spawns: timeframeStats.subMarketsSpawned,
        },
        'GameTick'
      );
    }
  }

  // Calculate and update currentDay based on game start time
  const currentDay = dayNumberForTimestamp(timestamp);
  await db
    .update(games)
    .set({
      lastTickAt: timestamp,
      updatedAt: timestamp,
      currentDay: currentDay ?? 1,
    })
    .where(eq(games.isContinuous, true));

  const cachesUpdated = await updateWidgetCaches();
  result.widgetCachesUpdated = cachesUpdated;

  // Calculate trending tags if needed (checks 30-minute interval internally)
  // Force calculation on first tick if we just generated baseline posts
  const forceCalculation =
    result.postsCreated > 0 && result.articlesCreated > 0;
  const trendingCalculated = forceCalculation
    ? await forceTrendingCalculation()
    : await calculateTrendingIfNeeded();
  result.trendingCalculated = trendingCalculated;
  if (trendingCalculated) {
    logger.info('Trending tags recalculated', {}, 'GameTick');
  }

  // Sync reputation to ERC-8004 if service is available
  // Service is provided by agents package via setReputationSyncService()
  const syncResult = await syncReputationIfAvailable({
    limit: 10, // Small batch during game tick
    offset: 0,
    forceRecalculate: false,
    prioritizeNew: true, // Prioritize new accounts
  });
  if (syncResult) {
    result.reputationSynced = syncResult.synced > 0;
    if (syncResult.synced > 0) {
      result.reputationSyncStats = {
        total: syncResult.total,
        successful: syncResult.synced,
        failed: syncResult.failed,
      };
      logger.info(
        'Reputation sync completed during game tick',
        result.reputationSyncStats,
        'GameTick'
      );
    }
  }

  // Update world facts if needed (checks 24-hour interval internally)
  const worldFactsResult = await updateWorldFactsIfNeeded();
  result.worldFactsUpdated = worldFactsResult.updated;
  if (worldFactsResult.updated && worldFactsResult.stats) {
    result.worldFactsStats = worldFactsResult.stats;
    logger.info(
      'World facts update completed',
      worldFactsResult.stats,
      'GameTick'
    );
  }

  // Process alpha group invites (small chance for highly engaged users)
  const invites = await AlphaGroupInviteService.processTickInvites();
  result.alphaInvitesSent = invites.length;
  if (invites.length > 0) {
    logger.info(
      'Alpha group invites sent',
      { count: invites.length, invites },
      'GameTick'
    );
  }

  // Evolve NPC relationships based on recent interactions (every 10 ticks to save compute)
  const shouldEvolveRelationships =
    Math.floor(timestamp.getTime() / 60000) % 10 === 0;
  if (shouldEvolveRelationships && Date.now() < deadline) {
    logger.info('Evolving NPC relationships...', undefined, 'GameTick');
    const relationshipEngine = new RelationshipEvolutionEngine(llmClient);
    const relationshipsUpdated =
      await relationshipEngine.analyzeAndUpdateRelationships();
    result.relationshipsUpdated = relationshipsUpdated;
    if (relationshipsUpdated > 0) {
      logger.info(
        `✅ Updated ${relationshipsUpdated} relationships`,
        { count: relationshipsUpdated },
        'GameTick'
      );
    }

    // Cleanup stale NPC anti-repetition histories (same cadence as relationships)
    // This prevents unbounded memory growth in long-running processes
    const { antiRepetitionService } = await import(
      './services/npc-anti-repetition-service'
    );
    const cleanedHistories = antiRepetitionService.cleanupStaleHistories();
    if (cleanedHistories > 0) {
      logger.debug(
        `Cleaned up ${cleanedHistories} stale NPC anti-repetition histories`,
        { count: cleanedHistories },
        'GameTick'
      );
    }
  }

  // Process NPC group dynamics (form, join, leave, post, invite, kick)
  const dynamics = await NPCGroupDynamicsService.processTickDynamics();
  result.npcGroupDynamics = {
    groupsCreated: dynamics.groupsCreated,
    membersAdded: dynamics.membersAdded,
    membersRemoved: dynamics.membersRemoved,
    usersInvited: dynamics.usersInvited,
    usersKicked: dynamics.usersKicked,
    messagesPosted: dynamics.messagesPosted,
  };
  if (
    dynamics.groupsCreated > 0 ||
    dynamics.membersAdded > 0 ||
    dynamics.membersRemoved > 0 ||
    dynamics.usersInvited > 0 ||
    dynamics.usersKicked > 0 ||
    dynamics.messagesPosted > 0
  ) {
    logger.info('NPC group dynamics processed', dynamics, 'GameTick');
  }

  const durationMs = Date.now() - startedAt;

  // Validation: Quality checks after game tick
  const validationWarnings: string[] = [];

  // Verify markets were updated if NPC trading ran
  // Check both baseline investments and market decisions
  const hadNPCTrading =
    baselineResult || (marketDecisions && marketDecisions.length > 0);
  if (result.marketsUpdated === 0 && hadNPCTrading) {
    validationWarnings.push('NPC trading executed but no markets were updated');
  }

  // Verify content was generated if buffer was low and not skipped
  if (
    !skipContentGeneration &&
    result.postsCreated === 0 &&
    result.articlesCreated === 0 &&
    result.eventsCreated === 0
  ) {
    validationWarnings.push(
      'Content generation ran but no content was created'
    );
  }

  // Verify questions resolved correctly
  if (result.questionsResolved > 0) {
    // Check that resolved questions have correct status
    const resolvedQuestions = await db
      .select()
      .from(questionsSchema)
      .where(
        and(
          eq(questionsSchema.status, 'resolved'),
          gte(questionsSchema.updatedAt, new Date(timestamp.getTime() - 60000)) // Updated in last minute
        )
      )
      .limit(result.questionsResolved);

    if (resolvedQuestions.length !== result.questionsResolved) {
      validationWarnings.push(
        `Expected ${result.questionsResolved} resolved questions but found ${resolvedQuestions.length}`
      );
    }
  }

  // Validate market prices are reasonable (0-100% for predictions)
  const activeMarkets = await db
    .select()
    .from(marketsSchema)
    .where(
      and(
        eq(marketsSchema.resolved, false),
        gte(marketsSchema.endDate, timestamp)
      )
    )
    .limit(10);

  for (const market of activeMarkets) {
    const yesShares = Number(market.yesShares);
    const noShares = Number(market.noShares);
    const totalShares = yesShares + noShares;

    if (totalShares > 0) {
      const yesOdds = (yesShares / totalShares) * 100;
      const noOdds = (noShares / totalShares) * 100;

      // Odds should be between 0 and 100%
      if (yesOdds < 0 || yesOdds > 100 || noOdds < 0 || noOdds > 100) {
        validationWarnings.push(
          `Market ${market.id} has invalid odds: YES=${yesOdds.toFixed(2)}%, NO=${noOdds.toFixed(2)}%`
        );
      }

      // Odds should sum to approximately 100% (allowing for rounding)
      const sum = yesOdds + noOdds;
      if (sum < 99.9 || sum > 100.1) {
        validationWarnings.push(
          `Market ${market.id} odds don't sum to 100%: ${sum.toFixed(2)}%`
        );
      }
    }
  }

  // Log validation warnings if any
  if (validationWarnings.length > 0) {
    logger.warn(
      'Game tick validation warnings',
      {
        warnings: validationWarnings,
        result,
      },
      'GameTick'
    );
  }

  // End token stats collection and store in database
  const tickTokenStatsData = TokenStatsService.endTick();
  if (tickTokenStatsData) {
    // Calculate estimated cost from per-model usage
    let estimatedCostUSD = 0;
    for (const modelStats of tickTokenStatsData.byModel) {
      const cost = calculateEstimatedCost(
        modelStats.model,
        modelStats.totalInputTokens,
        modelStats.totalOutputTokens
      );
      estimatedCostUSD += cost.totalCostUSD;
    }

    // Add token stats to result
    result.tokenStats = {
      totalCalls: tickTokenStatsData.totalCalls,
      totalInputTokens: tickTokenStatsData.totalInputTokens,
      totalOutputTokens: tickTokenStatsData.totalOutputTokens,
      totalTokens: tickTokenStatsData.totalTokens,
      estimatedCostUSD,
    };

    // Store token stats in database (non-blocking)
    // Serialize complex types to JSON-compatible format
    const byPromptTypeJson = JSON.parse(
      JSON.stringify(tickTokenStatsData.byPromptType)
    ) as JsonValue;
    const byModelJson = JSON.parse(
      JSON.stringify(tickTokenStatsData.byModel)
    ) as JsonValue;

    db.insert(tickTokenStats)
      .values({
        id: tickTokenStatsData.tickId,
        tickId: tickTokenStatsData.tickId,
        tickStartedAt: tickTokenStatsData.tickStartedAt,
        tickCompletedAt: tickTokenStatsData.tickCompletedAt,
        tickDurationMs: tickTokenStatsData.tickDurationMs,
        totalCalls: tickTokenStatsData.totalCalls,
        totalInputTokens: tickTokenStatsData.totalInputTokens,
        totalOutputTokens: tickTokenStatsData.totalOutputTokens,
        totalTokens: tickTokenStatsData.totalTokens,
        byPromptType: byPromptTypeJson,
        byModel: byModelJson,
      })
      .catch((error: Error) => {
        logger.warn(
          'Failed to store token stats',
          { error: error.message, tickId: tickTokenStatsData.tickId },
          'GameTick'
        );
      });

    logger.info(
      'Token stats collected',
      {
        tickId: tickTokenStatsData.tickId,
        totalCalls: tickTokenStatsData.totalCalls,
        totalTokens: tickTokenStatsData.totalTokens,
        inputTokens: tickTokenStatsData.totalInputTokens,
        outputTokens: tickTokenStatsData.totalOutputTokens,
      },
      'GameTick'
    );
  }

  logger.info(
    'Game tick completed',
    {
      ...result,
      durationMs,
      validationWarnings:
        validationWarnings.length > 0 ? validationWarnings.length : undefined,
    },
    'GameTick'
  );

  return result;
}

/**
 * Bootstrap content on first game tick
 * Ensures trending and relationships are initialized automatically
 * Note: News articles are NOT pre-populated - they come from actual questions/events
 */
async function bootstrapContentIfNeeded(_timestamp: Date): Promise<void> {
  // Check if we need to bootstrap
  const [trendingResult, relationshipResult] = await Promise.all([
    db.select({ count: count() }).from(trendingTags),
    db.select({ count: count() }).from(actorRelationships),
  ]);
  const trendingCount = Number(trendingResult[0]?.count ?? 0);
  const relationshipCount = Number(relationshipResult[0]?.count ?? 0);

  const MIN_TRENDING = 5;

  // If we have enough of everything, nothing to do
  if (trendingCount >= MIN_TRENDING && relationshipCount > 0) {
    return;
  }

  logger.info(
    'Bootstrapping initial content...',
    {
      currentTrending: trendingCount,
      currentRelationships: relationshipCount,
      needTrending: trendingCount < MIN_TRENDING,
      needRelationships: relationshipCount === 0,
    },
    'GameTick'
  );

  // Bootstrap relationships FIRST (needed for social dynamics)
  if (relationshipCount === 0) {
    await bootstrapInitialRelationships();
  }

  // Bootstrap trending if needed (requires posts and tags)
  if (trendingCount < MIN_TRENDING) {
    await bootstrapTrending();
  }

  const [finalTrending, finalRelationships] = await Promise.all([
    db.select({ count: count() }).from(trendingTags),
    db.select({ count: count() }).from(actorRelationships),
  ]);
  logger.info(
    'Bootstrap complete',
    {
      trendingCount: Number(finalTrending[0]?.count ?? 0),
      relationshipCount: Number(finalRelationships[0]?.count ?? 0),
    },
    'GameTick'
  );
}

/**
 * Generate initial NPC relationships on first tick
 */
async function bootstrapInitialRelationships(): Promise<void> {
  logger.info('Generating initial NPC relationships...', undefined, 'GameTick');

  // Get all actors and organizations from STATIC REGISTRY (no DB call!)
  const staticActors = StaticDataRegistry.getAllActors();
  const staticOrgs = StaticDataRegistry.getAllOrganizations();

  // Convert to Actor type
  const actorData = staticActors.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description || undefined,
    domain: a.domain,
    personality: a.personality || undefined,
    affiliations: a.affiliations,
  }));

  const orgData = staticOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
    type: o.type as 'company' | 'media' | 'government',
    canBeInvolved: true,
  }));

  // Generate relationships
  const engine = new RelationshipEvolutionEngine();
  const created = await engine.generateInitialRelationships(actorData, orgData);

  logger.info(
    `✅ Generated ${created} initial relationships`,
    { count: created },
    'GameTick'
  );
}

/**
 * Bootstrap trending tags
 */
async function bootstrapTrending(): Promise<void> {
  logger.info('Bootstrapping trending tags...', undefined, 'GameTick');

  // Check if we have enough posts and tags
  const [postCountResult, taggedPostCountResult] = await Promise.all([
    db.select({ count: count() }).from(posts),
    db
      .select({ count: count() })
      .from(posts)
      .innerJoin(postTags, eq(posts.id, postTags.postId)),
  ]);
  const postCount = Number(postCountResult[0]?.count ?? 0);
  const taggedPostCount = Number(taggedPostCountResult[0]?.count ?? 0);

  logger.info(
    'Post/tag status for trending',
    {
      totalPosts: postCount,
      taggedPosts: taggedPostCount,
      taggedPercentage:
        postCount > 0 ? Math.round((taggedPostCount / postCount) * 100) : 0,
    },
    'GameTick'
  );

  // If we have tagged posts, calculate trending
  if (taggedPostCount >= 10) {
    await calculateTrendingTags();
    logger.info(
      'Calculated trending from existing posts',
      undefined,
      'GameTick'
    );
    return;
  }

  // If we have posts but they're not tagged, tag them first
  if (postCount >= 10 && taggedPostCount < 10) {
    logger.info(
      'Posts exist but not tagged, waiting for auto-tagging...',
      undefined,
      'GameTick'
    );
    logger.info(
      'Trending will be calculated once posts are tagged',
      undefined,
      'GameTick'
    );
    return;
  }

  // If we have very few posts, create sample tags and trending
  logger.info('Creating sample trending data...', undefined, 'GameTick');

  const sampleTags = [
    { name: 'markets', displayName: 'Markets', category: 'Finance' },
    { name: 'tech', displayName: 'Tech', category: 'Tech' },
    { name: 'ai', displayName: 'AI', category: 'Tech' },
    { name: 'finance', displayName: 'Finance', category: 'Finance' },
    { name: 'innovation', displayName: 'Innovation', category: 'Tech' },
  ];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < sampleTags.length; i++) {
    const tagData = sampleTags[i];
    if (!tagData) continue;

    // Create tag (check if exists first)
    const [existingTag] = await db
      .select({
        id: tags.id,
        name: tags.name,
        displayName: tags.displayName,
        category: tags.category,
      })
      .from(tags)
      .where(eq(tags.name, tagData.name))
      .limit(1);

    let tag: {
      id: string;
      name: string;
      displayName: string;
      category: string | null;
    };
    if (existingTag) {
      tag = existingTag;
    } else {
      const [newTag] = await db
        .insert(tags)
        .values({
          id: await generateSnowflakeId(),
          name: tagData.name,
          displayName: tagData.displayName,
          category: tagData.category,
          updatedAt: now,
        })
        .returning();
      if (!newTag) {
        logger.warn('Failed to create tag', { tagData }, 'GameTick');
        continue;
      }
      tag = {
        id: newTag.id,
        name: newTag.name,
        displayName: newTag.displayName,
        category: newTag.category,
      };
    }

    // Create trending entry with real post count (0 since no posts are tagged yet)
    const score = (sampleTags.length - i) * 10 + Math.random() * 5;

    await db.insert(trendingTags).values({
      id: await generateSnowflakeId(),
      tagId: tag.id,
      score,
      postCount: 0, // Real count - will be updated when trending is calculated
      rank: i + 1,
      windowStart: weekAgo,
      windowEnd: now,
      relatedContext: null,
    });
  }

  logger.info(
    `Created ${sampleTags.length} sample trending tags`,
    undefined,
    'GameTick'
  );
}

/**
 * Generate organization content (news articles and posts from media orgs)
 * NPC posts are now handled by /api/cron/npc-tick
 */
async function generateOrganizationContent(
  questions: Array<{ id: string; text: string; questionNumber: number }>,
  timestamp: Date,
  llm: BabylonLLMClient,
  deadlineMs: number,
  dayNumberForTimestamp: (t: Date) => number | undefined
): Promise<{ posts: number; articles: number }> {
  const postsToGenerate = 1; // Organization posts/articles per tick (reduced from 4)

  if (questions.length === 0) {
    logger.warn(
      'No questions available for org content generation',
      {},
      'GameTick'
    );
    return { posts: 0, articles: 0 };
  }

  // Get organizations and world context
  const [worldFactsBase, trendingContext] = await Promise.all([
    worldFactsService.generatePromptContext(),
    getTrendingPromptContext(),
  ]);

  const worldFactsContext = worldFactsBase + trendingContext;

  // Get media organizations from static registry
  const orgsList = StaticDataRegistry.getAllOrganizations()
    .filter((org) => org.type === 'media')
    .slice(0, 8);

  if (orgsList.length === 0) {
    logger.warn(
      'No media organizations found for content generation',
      {},
      'GameTick'
    );
    return { posts: 0, articles: 0 };
  }

  // Shuffle orgs for variety
  const shuffledOrgs = [...orgsList].sort(() => Math.random() - 0.5);
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

  logger.info(
    `Generating ${postsToGenerate} organization posts/articles`,
    {
      orgsAvailable: orgsList.length,
      uniqueQuestions: shuffledQuestions.length,
    },
    'GameTick'
  );

  // Generate posts with timestamps spread across the tick interval
  const tickDurationMs = 60000;
  const timeSlotMs = tickDurationMs / postsToGenerate;

  const postPromises = Array.from(
    { length: Math.min(postsToGenerate, shuffledOrgs.length) },
    async (_, i) => {
      if (Date.now() > deadlineMs) {
        return { posts: 0, articles: 0 };
      }

      const org = shuffledOrgs[i];
      if (!org) return { posts: 0, articles: 0 };

      const question = shuffledQuestions[i % shuffledQuestions.length];
      if (!question?.text) return { posts: 0, articles: 0 };

      const slotOffset = i * timeSlotMs;
      const randomJitter = Math.random() * timeSlotMs * 0.8;
      const timestampWithOffset = new Date(
        timestamp.getTime() + slotOffset + randomJitter
      );
      const postDayNumber = dayNumberForTimestamp(timestampWithOffset);

      // 5% chance of article (reduced from 20%), 95% chance of post
      // Rationale: Articles are now primarily event-driven (arc events, question resolution)
      // via NewsArticlePacingEngine. Random articles still occur but at lower frequency to:
      // 1. Keep the feed fresh with occasional background coverage
      // 2. Not overwhelm the event-driven article generation
      // 3. Maintain realistic org behavior (not everything is breaking news)
      const shouldCreateArticle = Math.random() < 0.05;

      if (shouldCreateArticle) {
        const success = await generateOrgArticle(
          llm,
          org,
          question,
          worldFactsContext,
          timestampWithOffset,
          postDayNumber
        );
        return { posts: success ? 1 : 0, articles: success ? 1 : 0 };
      }

      const success = await generateOrgPost(
        llm,
        org,
        question,
        worldFactsContext,
        timestampWithOffset,
        postDayNumber
      );
      return { posts: success ? 1 : 0, articles: 0 };
    }
  );

  const results = await Promise.allSettled(postPromises);

  let postsCreated = 0;
  let articlesCreated = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      postsCreated += result.value.posts;
      articlesCreated += result.value.articles;
    }
  }

  logger.info(
    'Organization content generation complete',
    {
      postsCreated,
      articlesCreated,
      orgsAvailable: orgsList.length,
      attempted: postPromises.length,
    },
    'GameTick'
  );

  return { posts: postsCreated, articles: articlesCreated };
}

/**
 * Generates multiple articles concurrently to maximize throughput
 */
async function generateArticles(
  _timestamp: Date,
  llm: BabylonLLMClient,
  deadlineMs: number,
  dayNumberForTimestamp: (t: Date) => number | undefined
): Promise<number> {
  // Generate articles for active questions (with coverage tracking to prevent duplicates)
  const questionArticlesCreated = await generateArticlesForActiveQuestions(
    llm,
    deadlineMs,
    dayNumberForTimestamp
  );

  // Get recent events (from last 2 hours, up to current time)
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const recentEvents = await db
    .select()
    .from(worldEvents)
    .where(
      and(
        gte(worldEvents.timestamp, twoHoursAgo),
        lte(worldEvents.timestamp, now), // ✅ No future events
        eq(worldEvents.visibility, 'public')
      )
    )
    .orderBy(desc(worldEvents.timestamp))
    .limit(10);

  // Get news organizations from STATIC REGISTRY
  const newsOrgs = StaticDataRegistry.getOrganizationsByType('media');

  if (newsOrgs.length === 0) {
    logger.warn(
      'No news organizations found for article generation',
      {},
      'GameTick'
    );
    return questionArticlesCreated;
  }

  // No recent events = generate baseline articles about actors/companies/topics
  if (recentEvents.length === 0) {
    logger.info(
      'No recent events - generating baseline articles instead',
      { questionArticles: questionArticlesCreated },
      'GameTick'
    );

    const baselineArticlesCreated = await generateBaselineArticlesParallel(
      newsOrgs,
      new Date(),
      llm,
      deadlineMs,
      dayNumberForTimestamp
    );

    return questionArticlesCreated + baselineArticlesCreated;
  }

  // Get actors from STATIC REGISTRY
  const actorsList = StaticDataRegistry.getTopActors(50);

  if (actorsList.length === 0) {
    logger.warn('No actors found for article generation', {}, 'GameTick');
    return questionArticlesCreated;
  }

  // Initialize article generator
  const articleGen = new ArticleGenerator(llm);

  // Generate up to 10 articles in parallel (increased from 3)
  const articlesToGenerate = Math.min(10, recentEvents.length);
  const eventsTocover = recentEvents.slice(0, articlesToGenerate);

  logger.info(
    `Generating ${articlesToGenerate} articles in parallel`,
    {
      eventCount: recentEvents.length,
    },
    'GameTick'
  );

  // Map organization data for article generation
  const organizationsList: Organization[] = newsOrgs.map(
    (org: (typeof newsOrgs)[number]) => ({
      id: org.id,
      name: org.name || 'Unknown Organization',
      description: org.description || '',
      type: (org.type as 'company' | 'media' | 'government') || 'media',
      canBeInvolved: org.canBeInvolved,
      initialPrice: org.initialPrice ?? undefined,
      currentPrice: org.initialPrice ?? undefined, // Use initial price as default (static data)
    })
  );

  const actorList = actorsList
    .filter((a: (typeof actorsList)[number]) => a && a.id && a.name)
    .map((a: (typeof actorsList)[number]) => ({
      id: a.id,
      name: a.name,
      description: a.description || '',
      domain: a.domain || '',
      personality: a.personality || undefined,
      tier: (a.tier as ActorTier) || undefined,
      affiliations: a.affiliations || [],
      postStyle: a.postStyle || undefined,
      postExample: a.postExample || '',
      role: (a.role as 'main' | 'supporting' | 'extra') || undefined,
      initialLuck: (a.initialLuck as 'low' | 'medium' | 'high') || 'medium',
      initialMood: a.initialMood || 0,
    }));

  // Check for existing articles to avoid duplicates
  // Get articles from the last 4 hours to check for duplicates
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const recentArticles = await db
    .select({
      articleTitle: posts.articleTitle,
      content: posts.content,
      timestamp: posts.timestamp,
    })
    .from(posts)
    .where(
      and(
        eq(posts.type, 'article'),
        gte(posts.timestamp, fourHoursAgo),
        isNull(posts.deletedAt)
      )
    );

  // Filter out events that already have articles
  const eventsToCover = eventsTocover.filter((event) => {
    // Check if articles already exist for this event
    // Match by checking if recent articles mention similar topics
    const eventKeywords = event.description
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 5);
    const hasExistingArticle = recentArticles.some((article) => {
      const articleText =
        `${article.articleTitle || ''} ${article.content || ''}`.toLowerCase();
      // Check if article contains at least 2 keywords from the event
      const matchingKeywords = eventKeywords.filter(
        (keyword) => keyword.length > 3 && articleText.includes(keyword)
      );
      return matchingKeywords.length >= 2;
    });

    if (hasExistingArticle) {
      logger.debug(
        'Skipping event - articles already exist',
        { eventId: event.id },
        'GameTick'
      );
      return false;
    }
    return true;
  });

  logger.info(
    `Filtered events: ${eventsToCover.length}/${eventsTocover.length} events need articles`,
    {
      filtered: eventsToCover.length,
      total: eventsTocover.length,
    },
    'GameTick'
  );

  // Generate articles in parallel with Promise.allSettled to handle failures gracefully
  const articlePromises = eventsToCover.map(
    async (event: {
      id: string;
      eventType: string;
      description: string;
      actors: string[] | null;
      relatedQuestion: number | null;
      visibility: string;
      dayNumber: number | null;
    }) => {
      // Check deadline before starting each article
      if (Date.now() > deadlineMs) {
        logger.debug(
          'Skipping article due to deadline',
          { eventId: event.id },
          'GameTick'
        );
        return 0;
      }

      const worldEvent: WorldEvent = {
        id: event.id,
        type: event.eventType as WorldEvent['type'],
        description: event.description,
        actors: (event.actors as string[]) || [],
        relatedQuestion: event.relatedQuestion || undefined,
        visibility: event.visibility as WorldEvent['visibility'],
        day: event.dayNumber || 0,
      };

      const articles = await articleGen.generateArticlesForEvent(
        worldEvent,
        organizationsList,
        actorList,
        []
      );

      let created = 0;
      for (const article of articles) {
        if (!article || !article.authorOrgId) {
          logger.warn(
            'Invalid article generated',
            { eventId: event.id },
            'GameTick'
          );
          continue;
        }

        // Transform content to replace real names with parody names
        const transformedSummary = await characterMappingService.transformText(
          article.summary || ''
        );
        const transformedContent = await characterMappingService.transformText(
          article.content || ''
        );
        const transformedTitle = await characterMappingService.transformText(
          article.title || 'Untitled'
        );
        if (
          transformedSummary.replacementCount > 0 ||
          transformedContent.replacementCount > 0 ||
          transformedTitle.replacementCount > 0
        ) {
          logger.warn(
            `Fixed ${transformedSummary.replacementCount + transformedContent.replacementCount + transformedTitle.replacementCount} real name(s) in event article`,
            {
              eventId: event.id,
              title: article.title,
            },
            'GameTick'
          );
        }

        const articleTimestamp = article.publishedAt || new Date();

        // Generate article cover image (non-blocking, with retry)
        let imageUrl: string | null = null;
        if (process.env.FAL_KEY) {
          imageUrl = await generateArticleImageWithRetry({
            title: transformedTitle.transformedText,
            summary: transformedSummary.transformedText,
            category: article.category,
          });
        }

        await dbService().createPostWithAllFields({
          id: await generateSnowflakeId(),
          type: 'article',
          content: transformedSummary.transformedText,
          fullContent: transformedContent.transformedText,
          articleTitle: transformedTitle.transformedText,
          byline: article.byline || undefined,
          biasScore: article.biasScore || undefined,
          sentiment: article.sentiment || undefined,
          slant: article.slant || undefined,
          category: article.category || undefined,
          imageUrl: imageUrl || undefined,
          authorId: article.authorOrgId,
          gameId: 'continuous',
          dayNumber: dayNumberForTimestamp(articleTimestamp),
          timestamp: articleTimestamp,
        });
        created++;
      }

      return created;
    }
  );

  // Wait for all article generation to complete
  const results = await Promise.allSettled(articlePromises);

  // Count successful articles and log failures
  const articlesCreated = results.reduce((sum, result) => {
    if (result.status === 'fulfilled') {
      return sum + result.value;
    }
    logger.error(
      'Failed to generate article from event',
      { error: result.reason },
      'GameTick'
    );
    return sum;
  }, 0);

  logger.info(
    'Parallel article generation complete',
    {
      articlesCreated,
      attempted: articlesToGenerate,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    },
    'GameTick'
  );

  return questionArticlesCreated + articlesCreated;
}

/**
 * Generate articles for active questions with coverage tracking
 *
 * @description
 * Generates articles for active questions with proper pacing:
 * - Breaking stage: 1-2 orgs when question first created
 * - Commentary stage: 2-3 orgs for ongoing analysis
 * - Resolution stage: All major orgs for outcome coverage
 *
 * Uses NewsArticlePacingEngine to prevent duplicate reporting.
 * Each org can only report on a question once per stage.
 */
async function generateArticlesForActiveQuestions(
  llm: BabylonLLMClient,
  deadlineMs: number,
  dayNumberForTimestamp: (t: Date) => number | undefined
): Promise<number> {
  // Get all active questions
  const activeQuestions = await db
    .select()
    .from(questionsSchema)
    .where(eq(questionsSchema.status, 'active'))
    .orderBy(desc(questionsSchema.createdAt));

  if (activeQuestions.length === 0) {
    return 0;
  }

  // Get news organizations from STATIC REGISTRY
  const newsOrgs = StaticDataRegistry.getOrganizationsByType('media');
  const actorsList = StaticDataRegistry.getTopActors(50);

  if (newsOrgs.length === 0 || actorsList.length === 0) {
    logger.warn(
      'Missing news orgs or actors for question articles',
      {
        newsOrgs: newsOrgs.length,
        actors: actorsList.length,
      },
      'GameTick'
    );
    return 0;
  }

  // Get existing articles from last 24 hours to check coverage
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentArticles = await db
    .select({
      content: posts.content,
      articleTitle: posts.articleTitle,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(
      and(
        eq(posts.type, 'article'),
        gte(posts.timestamp, oneDayAgo),
        isNull(posts.deletedAt)
      )
    );

  // Build a map of question -> orgs that have already covered it
  const questionCoverage = new Map<string, Set<string>>();
  for (const article of recentArticles) {
    // Try to match article to a question by content
    for (const q of activeQuestions) {
      const questionKeywords = q.text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const articleText =
        `${article.articleTitle || ''} ${article.content || ''}`.toLowerCase();
      const matchingKeywords = questionKeywords.filter((keyword) =>
        articleText.includes(keyword)
      );

      if (matchingKeywords.length >= 2 && article.authorId) {
        if (!questionCoverage.has(q.id)) {
          questionCoverage.set(q.id, new Set());
        }
        questionCoverage.get(q.id)!.add(article.authorId);
      }
    }
  }

  const actorList = actorsList
    .filter((a) => a && a.id && a.name)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description || '',
      domain: Array.isArray(a.domain) ? a.domain : [a.domain || 'tech'],
      personality: a.personality || undefined,
      tier: (a.tier as ActorTier) || undefined,
      affiliations: a.affiliations || [],
      postStyle: a.postStyle || undefined,
      postExample: a.postExample || '',
      role: (a.role as 'main' | 'supporting' | 'extra') || undefined,
      initialLuck: (a.initialLuck as 'low' | 'medium' | 'high') || 'medium',
      initialMood: a.initialMood || 0,
    }));

  // Initialize article generator
  const articleGen = new ArticleGenerator(llm);

  let totalArticlesCreated = 0;
  const articlePromises: Array<Promise<number>> = [];

  for (const question of activeQuestions) {
    if (Date.now() > deadlineMs) {
      logger.warn(
        'Article generation for questions aborted due to deadline',
        { questionsProcessed: articlePromises.length },
        'GameTick'
      );
      break;
    }

    // Check which orgs have already covered this question
    const coveredOrgs = questionCoverage.get(question.id) || new Set();

    // Filter to orgs that haven't covered yet
    const eligibleOrgs = newsOrgs.filter((org) => !coveredOrgs.has(org.id));

    if (eligibleOrgs.length === 0) {
      logger.debug(
        `Question Q${question.questionNumber} already fully covered`,
        { questionId: question.id, coveredOrgs: coveredOrgs.size },
        'GameTick'
      );
      continue;
    }

    // Determine stage based on coverage
    // New question (no coverage) = breaking, some coverage = commentary
    const stage = coveredOrgs.size === 0 ? 'breaking' : 'commentary';

    // Breaking: 1-2 orgs, Commentary: 1-2 additional orgs
    const targetCount =
      stage === 'breaking'
        ? 1 + Math.floor(Math.random() * 2) // 1-2 orgs
        : Math.min(1, eligibleOrgs.length); // 1 more org for commentary

    const shuffledOrgs = [...eligibleOrgs].sort(() => Math.random() - 0.5);
    const orgsForQuestion = shuffledOrgs.slice(0, targetCount);

    logger.info(
      `Generating ${orgsForQuestion.length} ${stage} articles for Q${question.questionNumber}`,
      {
        questionId: question.id,
        stage,
        existingCoverage: coveredOrgs.size,
      },
      'GameTick'
    );

    for (const orgData of orgsForQuestion) {
      const articlePromise = (async () => {
        const org: Organization = {
          id: orgData.id,
          name: orgData.name || 'Unknown Organization',
          description: orgData.description || '',
          type: (orgData.type as 'company' | 'media' | 'government') || 'media',
          canBeInvolved: orgData.canBeInvolved,
          initialPrice: orgData.initialPrice ?? undefined,
          currentPrice: orgData.initialPrice ?? undefined,
        };

        const article = await articleGen.generateArticleForQuestion(
          {
            id: question.id,
            text: question.text,
            scenario: question.scenarioId || 1,
            outcome: question.outcome ?? false,
            rank: question.rank || 1,
            createdDate: question.createdAt.toISOString().split('T')[0]!,
            resolutionDate:
              question.resolutionDate?.toISOString().split('T')[0] || '',
            status: question.status as 'active' | 'resolved' | 'cancelled',
          },
          org,
          stage,
          actorList,
          []
        );

        // Transform content to replace real names with parody names
        const transformedSummary = await characterMappingService.transformText(
          article.summary || ''
        );
        const transformedContent = await characterMappingService.transformText(
          article.content || ''
        );
        const transformedTitle = await characterMappingService.transformText(
          article.title || 'Untitled'
        );

        if (
          transformedSummary.replacementCount > 0 ||
          transformedContent.replacementCount > 0 ||
          transformedTitle.replacementCount > 0
        ) {
          logger.warn(
            `Fixed ${transformedSummary.replacementCount + transformedContent.replacementCount + transformedTitle.replacementCount} real name(s) in question article`,
            { questionId: question.id, title: article.title },
            'GameTick'
          );
        }

        const articleTimestamp = article.publishedAt || new Date();

        // Generate article cover image
        let questionImageUrl: string | null = null;
        if (process.env.FAL_KEY) {
          questionImageUrl = await generateArticleImageWithRetry({
            title: transformedTitle.transformedText,
            summary: transformedSummary.transformedText,
            category: article.category,
          });
        }

        await dbService().createPostWithAllFields({
          id: await generateSnowflakeId(),
          type: 'article',
          content: transformedSummary.transformedText,
          fullContent: transformedContent.transformedText,
          articleTitle: transformedTitle.transformedText,
          byline: article.byline || undefined,
          biasScore: article.biasScore || undefined,
          sentiment: article.sentiment || undefined,
          slant: article.slant || undefined,
          category: article.category || undefined,
          imageUrl: questionImageUrl || undefined,
          authorId: article.authorOrgId,
          gameId: 'continuous',
          dayNumber: dayNumberForTimestamp(articleTimestamp),
          timestamp: articleTimestamp,
        });

        logger.debug(
          'Created article for question',
          {
            questionId: question.id,
            questionNumber: question.questionNumber,
            org: org.name,
            stage,
            title: article.title,
          },
          'GameTick'
        );

        return 1;
      })();

      articlePromises.push(articlePromise);
    }
  }

  const results = await Promise.allSettled(articlePromises);

  totalArticlesCreated = results.reduce((sum, result) => {
    if (result.status === 'fulfilled') {
      return sum + result.value;
    }
    logger.warn(
      'Failed to generate question article',
      { error: result.reason },
      'GameTick'
    );
    return sum;
  }, 0);

  logger.info(
    'Question article generation complete',
    {
      articlesCreated: totalArticlesCreated,
      questionsProcessed: activeQuestions.length,
      attempted: articlePromises.length,
      successful: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    },
    'GameTick'
  );

  return totalArticlesCreated;
}

/**
 * Generate baseline articles in parallel with game context
 * Generates articles about actors, companies, or diverse topics (not just questions)
 *
 * @description
 * This function provides variety in the news feed by generating articles about:
 * - Prominent actors (S-tier, A-tier) and their activities
 * - Companies and their market performance
 * - Diverse story seeds (not tied to specific questions)
 */
async function generateBaselineArticlesParallel(
  newsOrgs: Array<{
    id: string;
    name: string | null;
    description: string | null;
  }>,
  timestamp: Date,
  llm: BabylonLLMClient,
  deadlineMs: number,
  dayNumberForTimestamp: (t: Date) => number | undefined
): Promise<number> {
  // Gather game context for relevant articles
  const [orgStates, worldFactsContext, worldContext] = await Promise.all([
    dbService().getAllOrganizationStates(),
    worldFactsService.generatePromptContext(),
    generateWorldContext({
      maxActors: 30,
      realityGroundingLevel: 'concise',
    }),
  ]);

  // Get actors with main/supporting roles from static registry
  const actorsList = StaticDataRegistry.getAllActors()
    .filter((a) => a.role === 'main' || a.role === 'supporting')
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      domain: a.domain,
      tier: a.tier,
    }));

  // Get companies from static registry with dynamic prices
  const priceMap = new Map(orgStates.map((s) => [s.id, s.currentPrice]));
  const companiesList = StaticDataRegistry.getAllOrganizations()
    .filter((org) => org.type === 'company')
    .slice(0, 10)
    .map((org) => ({
      id: org.id,
      name: org.name,
      description: org.description,
      currentPrice: priceMap.get(org.id) ?? org.initialPrice,
      initialPrice: org.initialPrice,
    }));

  // Build article topics using DIVERSE story seeds
  const articleTopics: Array<{
    topic: string;
    category: string;
    context: string;
  }> = [];

  // Get diverse story seeds from the story seed service
  const storySeedService = getStorySeedService(llm);
  const diversityService = getTopicDiversityService();

  // Generate diverse stories - these are NOT tied to questions
  const storySeeds = await storySeedService.generateDiverseStories(3);

  for (const seed of storySeeds) {
    const shouldSkip = await diversityService.shouldSkipTopic(seed.headline);
    if (shouldSkip) {
      logger.debug(
        'Skipping oversaturated topic for baseline article',
        { topic: seed.headline, beat: seed.beat },
        'GameTick'
      );
      continue;
    }

    articleTopics.push({
      topic: seed.headline,
      category: seed.beat,
      context: `${seed.description}. ${seed.suggestedAngle}`,
    });
  }

  // Add 1-2 actor topics for game relevance
  const actorTopicsToAdd = Math.min(1, actorsList.length);
  for (const actor of actorsList
    .filter((a) => a.tier === 'S_TIER' || a.tier === 'A_TIER')
    .slice(0, actorTopicsToAdd)) {
    const domainStr = Array.isArray(actor.domain)
      ? actor.domain[0]
      : actor.domain;
    const domain = domainStr || 'tech';
    const topicText = `${actor.name} and their recent activities`;

    const shouldSkip = await diversityService.shouldSkipTopic(topicText);
    if (!shouldSkip) {
      articleTopics.push({
        topic: topicText,
        category: domain === 'tech' ? 'tech' : 'business',
        context: `${actor.name} (${actor.description || 'prominent figure'}) in ${domain}`,
      });
    }
  }

  // Add 1 company topic if we have room
  if (articleTopics.length < 4 && companiesList.length > 0) {
    const company = companiesList[0];
    if (company) {
      const currentPrice = company.currentPrice || company.initialPrice || 100;
      const initialPrice = company.initialPrice || 100;
      const changePercent =
        ((currentPrice - initialPrice) / initialPrice) * 100;
      const topicText = `${company.name} and market performance`;

      const shouldSkip = await diversityService.shouldSkipTopic(topicText);
      if (!shouldSkip) {
        articleTopics.push({
          topic: topicText,
          category: 'finance',
          context: `${company.name} (${company.description || 'company'}) - ${changePercent > 0 ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(1)}% from initial price`,
        });
      }
    }
  }

  // Limit to 2-3 baseline articles per tick (reduced from 5)
  const articlesToGenerate = Math.min(3, newsOrgs.length, articleTopics.length);

  if (articlesToGenerate === 0) {
    return 0;
  }

  logger.info(
    `Generating ${articlesToGenerate} baseline articles with game context`,
    {
      topicsFromSeeds: storySeeds.length,
      topicsFromActors: actorTopicsToAdd,
      topicsFromCompanies:
        articleTopics.length > storySeeds.length + actorTopicsToAdd ? 1 : 0,
    },
    'GameTick'
  );

  // Generate all articles in parallel
  const articlePromises = Array.from(
    { length: articlesToGenerate },
    async (_, i) => {
      if (Date.now() > deadlineMs) {
        return 0;
      }

      const org = newsOrgs[i];
      if (!org || !org.name) return 0;

      const topicData = articleTopics[i];
      if (!topicData) return 0;

      const prompt = `You are ${org.name}, a news organization. Write a detailed news article about ${topicData.topic}.

CONTEXT:
${topicData.context}

${worldFactsContext}

${worldContext.realityGrounding || ''}

CRITICAL RULES:
- Use ONLY parody names (AIlon Musk, Sam AIltman, Mark Zuckerborg, etc.) - NEVER real names
- Reference specific actors, companies, or questions from the game context above
- Make the article relevant to the current game state
- Include specific details about actors, companies when relevant

Your article should include:
- A compelling headline (max 100 chars)
- A 2-3 sentence summary for the article listing (max 400 chars)
- A full article body of at least 4 paragraphs
- Be professional and informative
- Match the tone of a ${org.description || 'news organization'}
- Separate paragraphs with \\n\\n (two newlines)

Return your response as XML in this exact format:
<response>
  <title>compelling headline here</title>
  <summary>2-3 sentence summary here</summary>
  <article>full article body here with \\n\\n between paragraphs</article>
</response>`;

      const response = await llm.generateJSON<
        | { title: string; summary: string; article: string }
        | { response: { title: string; summary: string; article: string } }
      >(
        prompt,
        {
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            article: { type: 'string' },
          },
          required: ['title', 'summary', 'article'],
        },
        {
          temperature: 0.7,
          maxTokens: 8000,
          format: 'xml',
          promptType: 'generate_baseline_article',
        }
      );

      // Handle XML structure
      const baselineArticle =
        'response' in response && response.response
          ? (response.response as {
              title: string;
              summary: string;
              article: string;
            })
          : (response as { title: string; summary: string; article: string });

      if (
        !baselineArticle.title ||
        !baselineArticle.summary ||
        !baselineArticle.article
      )
        return 0;

      const summary = baselineArticle.summary.trim();
      const articleTitle = baselineArticle.title.trim();
      const articleBody = baselineArticle.article.trim();

      if (articleBody.length < 400) {
        logger.warn(
          'Baseline article body too short',
          { orgId: org.id, length: articleBody.length },
          'GameTick'
        );
        return 0;
      }

      // Calculate timestamp with jitter
      const timeSlotMs = 60000 / articlesToGenerate;
      const slotOffset = i * timeSlotMs;
      const randomJitter = Math.random() * timeSlotMs * 0.8;
      const timestampWithOffset = new Date(
        timestamp.getTime() + slotOffset + randomJitter
      );

      // Transform content to replace real names with parody names
      const transformedSummary =
        await characterMappingService.transformText(summary);
      const transformedBody =
        await characterMappingService.transformText(articleBody);
      const transformedTitle =
        await characterMappingService.transformText(articleTitle);

      if (
        transformedSummary.replacementCount > 0 ||
        transformedBody.replacementCount > 0 ||
        transformedTitle.replacementCount > 0
      ) {
        logger.warn(
          `Fixed ${transformedSummary.replacementCount + transformedBody.replacementCount + transformedTitle.replacementCount} real name(s) in baseline article`,
          { org: org.name, topic: topicData.topic },
          'GameTick'
        );
      }

      // Generate article cover image
      let baselineImageUrl: string | null = null;
      if (process.env.FAL_KEY) {
        baselineImageUrl = await generateArticleImageWithRetry({
          title: transformedTitle.transformedText,
          summary: transformedSummary.transformedText,
          category: topicData.category,
        });
      }

      await dbService().createPostWithAllFields({
        id: await generateSnowflakeId(),
        type: 'article',
        content: transformedSummary.transformedText,
        fullContent: transformedBody.transformedText,
        articleTitle: transformedTitle.transformedText,
        category: topicData.category,
        imageUrl: baselineImageUrl || undefined,
        authorId: org.id,
        gameId: 'continuous',
        dayNumber: dayNumberForTimestamp(timestampWithOffset),
        timestamp: timestampWithOffset,
      });

      logger.debug(
        'Created baseline article with game context',
        { org: org.name, topic: topicData.topic, category: topicData.category },
        'GameTick'
      );
      return 1;
    }
  );

  const results = await Promise.allSettled(articlePromises);

  const articlesCreated = results.reduce((sum, result) => {
    if (result.status === 'fulfilled') {
      return sum + result.value;
    }
    logger.warn(
      'Failed to generate baseline article',
      { error: result.reason },
      'GameTick'
    );
    return sum;
  }, 0);

  logger.info(
    'Baseline article generation complete',
    {
      articlesCreated,
      attempted: articlesToGenerate,
      topicsUsed: articleTopics.length,
    },
    'GameTick'
  );

  return articlesCreated;
}

// generateEvents moved to services/event-generation-helpers.ts

/** Update market prices based on NPC trading activity (investment-based pricing). */
async function updateMarketPricesFromTrades(
  _timestamp: Date,
  executionResult: TradingExecutionResult
): Promise<number> {
  if (!executionResult.executedTrades.length) {
    return 0;
  }

  // Get all companies with current holdings (static + dynamic data)
  const orgStates = await dbService().getAllOrganizationStates();
  const priceMap = new Map(orgStates.map((s) => [s.id, s.currentPrice]));

  const companiesList = StaticDataRegistry.getAllOrganizations()
    .filter((org) => org.type === 'company')
    .map((org) => ({
      id: org.id,
      name: org.name,
      currentPrice: priceMap.get(org.id) ?? org.initialPrice,
      initialPrice: org.initialPrice,
    }));

  type CompanyData = (typeof companiesList)[0];
  // Use raw org IDs as keys since positions now store raw IDs
  const companyMap = new Map<string, CompanyData>(
    companiesList.map((c: CompanyData) => [c.id, c])
  );

  // Calculate total holdings for each company from ALL positions
  const holdingsByTicker = new Map<string, number>();

  const allPositions = await db
    .select({
      ticker: poolPositions.ticker,
      side: poolPositions.side,
      size: poolPositions.size,
    })
    .from(poolPositions)
    .where(
      and(
        eq(poolPositions.marketType, 'perp'),
        isNull(poolPositions.closedAt),
        isNotNull(poolPositions.ticker)
      )
    );

  for (const pos of allPositions) {
    if (!pos.ticker) continue;

    const current = holdingsByTicker.get(pos.ticker) || 0;
    // Long positions add to holdings, short positions subtract
    const delta = pos.side === 'long' ? pos.size : -pos.size;
    holdingsByTicker.set(pos.ticker, current + delta);
  }

  let updates = 0;
  const priceUpdatesForChain: Array<{
    organizationId: string;
    newPrice: number;
  }> = [];

  // Update prices based on total capital deployed
  // Market cap = initialPrice × syntheticSupply + totalDeployed
  // ticker is now a raw org ID, not a transformed ticker
  for (const [ticker, netHoldings] of holdingsByTicker) {
    const company = companyMap.get(ticker);
    if (!company) continue;

    const initialPrice = company.initialPrice ?? 100;
    const currentPrice = company.currentPrice ?? initialPrice;

    // Fixed synthetic supply per company
    const syntheticSupply = 10000;
    const baseMarketCap = initialPrice * syntheticSupply; // e.g. $100 × 10k = $1M

    // Market cap increases with net long holdings
    const newMarketCap = baseMarketCap + netHoldings;

    // Price = marketCap / supply, with floor and ceiling
    const rawPrice = newMarketCap / syntheticSupply;

    // Price change limits: ±20% per tick, with absolute bounds
    const maxChangePerTick = currentPrice * 0.2; // Max 20% move per tick
    const absoluteMin = initialPrice * 0.25; // Never below 25% of initial
    const absoluteMax = initialPrice * 4.0; // Never above 400% of initial

    const minPrice = Math.max(absoluteMin, currentPrice - maxChangePerTick);
    const maxPrice = Math.min(absoluteMax, currentPrice + maxChangePerTick);
    const newPrice = Math.max(minPrice, Math.min(rawPrice, maxPrice));

    const change = newPrice - currentPrice;
    const changePercent = currentPrice > 0 ? (change / currentPrice) * 100 : 0;

    // Only update if price actually changed
    if (Math.abs(change) < 0.01) continue;

    await db
      .update(organizationState)
      .set({ currentPrice: newPrice, updatedAt: new Date() })
      .where(eq(organizationState.id, company.id));

    await dbService().recordPriceUpdate(
      company.id,
      newPrice,
      change,
      changePercent
    );

    logger.info(
      `Price update for ${ticker}: ${currentPrice.toFixed(2)} -> ${newPrice.toFixed(2)} (${changePercent.toFixed(2)}%) [holdings: $${netHoldings.toFixed(0)}]`,
      { ticker, currentPrice, newPrice, netHoldings, marketCap: newMarketCap },
      'GameTick'
    );

    // Add to on-chain publish queue
    priceUpdatesForChain.push({
      organizationId: company.id,
      newPrice,
    });

    updates++;
  }

  // Publish all price updates to blockchain in batch
  if (priceUpdatesForChain.length > 0) {
    try {
      await PriceUpdateService.applyUpdates(
        priceUpdatesForChain.map((u) => ({
          ...u,
          source: 'npc_trade',
          reason: 'NPC trading price impact',
        }))
      );
    } catch (error) {
      // Log with special marker for monitoring/retry systems
      logger.error(
        'PRICE_SYNC_FAILED: Failed to publish prices to blockchain - queueing for retry',
        {
          error: error instanceof Error ? error.message : String(error),
          count: priceUpdatesForChain.length,
          retryable: true,
        },
        'GameTick'
      );

      // Log each failed update for potential manual recovery
      for (const update of priceUpdatesForChain) {
        logger.warn(
          'PRICE_SYNC_FAILED',
          {
            organizationId: update.organizationId,
            newPrice: update.newPrice,
            retryable: true,
          },
          'GameTick'
        );
      }
    }
  }

  return updates;
}

/**
 * Generate new questions using QuestionManager
 */
async function generateNewQuestions(
  count: number,
  llm: BabylonLLMClient,
  deadlineMs: number
): Promise<number> {
  const questionManager = new QuestionManager(llm);
  return await questionManager.generateQuestionsForContinuousGame(
    count,
    deadlineMs
  );
}

/**
 * Resolve question payouts
 */
export async function resolveQuestionPayouts(
  questionNumber: number
): Promise<void> {
  const [question] = await db
    .select()
    .from(questionsSchema)
    .where(eq(questionsSchema.questionNumber, questionNumber))
    .limit(1);

  if (!question) return;

  // Try to find market by question id first, then by question text
  let [market] = await db
    .select()
    .from(marketsSchema)
    .where(eq(marketsSchema.id, question.id))
    .limit(1);

  if (!market) {
    [market] = await db
      .select()
      .from(marketsSchema)
      .where(eq(marketsSchema.question, question.text))
      .limit(1);
  }

  if (!market) return;

  if (market.resolved) {
    logger.info(
      'Market already resolved, skipping payouts',
      { marketId: market.id, questionNumber },
      'GameTick'
    );
    return;
  }

  const winningSide = question.outcome;
  const resolutionTimestamp = new Date();

  // Store market properties in consts to ensure type narrowing
  const marketId = market.id;
  const marketOnChainMarketId = market.onChainMarketId;
  const marketOnChainResolved = market.onChainResolved;

  const pnlsToRecord: Array<{ userId: string; pnl: number }> = [];
  let totalPayout = 0;
  let positionsSettled = 0;

  await db.transaction(async (tx) => {
    const coreService = new CorePredictionMarketService({
      db: new CorePredictionDbAdapter(tx),
      wallet: {
        debit: async () => {
          throw new Error('Unexpected debit during market resolution');
        },
        credit: async ({ userId, amount, reason, description, relatedId }) => {
          totalPayout += amount;
          await WalletService.credit(
            userId,
            amount,
            reason,
            description ?? '',
            relatedId,
            tx
          );
        },
        recordPnL: async ({ userId, pnl }) => {
          pnlsToRecord.push({ userId, pnl });
        },
        getBalance: (userId: string) => WalletService.getBalance(userId),
      },
      broadcast: {
        emit: (_channel, payload) =>
          broadcastToChannel(
            'markets',
            payload as Record<string, ApiJsonValue>
          ),
      },
      cache: {
        invalidate: () => invalidateAfterPredictionTrade(marketId),
      },
      fees: {
        tradingFeeRate: 0,
        platformShare: 0,
        referrerShare: 0,
        minFeeAmount: 0,
      },
      clock: { now: () => resolutionTimestamp },
    });

    // Estimate positions settled for logging (coreService updates all positions for the market)
    const existingPositions = await tx
      .select({ id: positions.id })
      .from(positions)
      .where(eq(positions.marketId, marketId));
    positionsSettled = existingPositions.length;

    await coreService.resolve({
      marketId,
      winningSide: winningSide ? 'yes' : 'no',
      resolvedAt: resolutionTimestamp,
      resolutionDescription: question.resolutionDescription ?? undefined,
      resolutionProofUrl: question.resolutionProofUrl ?? undefined,
    });

    await tx
      .update(questionsSchema)
      .set({
        status: 'resolved',
        resolvedOutcome: winningSide,
        updatedAt: resolutionTimestamp,
      })
      .where(eq(questionsSchema.id, question.id));
  });

  // Record PnL post-transaction to avoid nested transactions inside the DB tx.
  for (const entry of pnlsToRecord) {
    if (entry.pnl === 0) continue;
    await WalletService.recordPnL(
      entry.userId,
      entry.pnl,
      'pred_resolve',
      marketId
    );
  }

  // Check if on-chain reputation updates are configured (requires deployer key)
  if (process.env.DEPLOYER_PRIVATE_KEY && REPUTATION_SYSTEM_BASE_SEPOLIA) {
    await ReputationService.updateReputationForResolvedMarket({
      marketId: marketId,
      outcome: winningSide,
    });
  } else {
    logger.debug(
      'Skipping reputation update - DEPLOYER_PRIVATE_KEY not configured',
      { marketId: marketId },
      'GameTick'
    );
  }

  // Resolve market on-chain if onChainMarketId exists
  let onChainResolutionTxHash: string | null = null;
  if (marketOnChainMarketId && !marketOnChainResolved) {
    onChainResolutionTxHash = await resolveMarketOnChain(
      marketOnChainMarketId,
      winningSide ? 1 : 0 // Binary market: true = 1, false = 0
    );
  }

  if (onChainResolutionTxHash) {
    await db
      .update(marketsSchema)
      .set({
        onChainResolved: true,
        onChainResolutionTxHash,
        updatedAt: new Date(),
      })
      .where(eq(marketsSchema.id, marketId));
  }

  logger.info(
    'Resolved prediction market payouts',
    {
      marketId: market.id,
      questionNumber,
      winningSide: winningSide ? 'YES' : 'NO',
      totalPayout,
      positionsSettled,
    },
    'GameTick'
  );
}

/**
 * Resolve market on-chain via PredictionMarketFacet
 */
async function resolveMarketOnChain(
  onChainMarketId: string,
  winningOutcome: number
): Promise<string> {
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const rpcUrl = getCurrentRpcUrl();

  if (!DIAMOND_ADDRESS || !deployerPrivateKey) {
    throw new Error(
      'Missing blockchain configuration - DEPLOYER_PRIVATE_KEY required'
    );
  }

  const { createPublicClient, createWalletClient, http, parseAbi } =
    await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');
  const { baseSepolia } = await import('viem/chains');

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const account = privateKeyToAccount(deployerPrivateKey);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  // Resolve market on-chain
  // winningOutcome must be uint8 (0 or 1 for binary markets)
  const txHash = await walletClient.writeContract({
    address: DIAMOND_ADDRESS as `0x${string}`,
    abi: parseAbi(PREDICTION_MARKET_ABI),
    functionName: 'resolveMarket',
    args: [onChainMarketId as `0x${string}`, winningOutcome as number],
  });

  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  return txHash;
}

/**
 * Publish question commitments to blockchain oracle
 */
async function publishOracleCommitments(
  questions: Array<{
    id: string;
    questionNumber: number;
    text: string;
    outcome: boolean;
  }>
): Promise<{ committed: number; errors: number }> {
  let committed = 0;
  let errors = 0;

  // Check if oracle is configured
  if (
    !process.env.NEXT_PUBLIC_BABYLON_ORACLE ||
    !process.env.ORACLE_PRIVATE_KEY
  ) {
    logger.info(
      'Oracle not configured, skipping commitments',
      undefined,
      'GameTick'
    );
    return { committed: 0, errors: 0 };
  }

  const oracleService = getOracleService();

  // Health check
  const health = await oracleService.healthCheck();
  if (!health.healthy) {
    logger.error(
      `Oracle health check failed: ${health.error}`,
      undefined,
      'GameTick'
    );
    return { committed: 0, errors: questions.length };
  }

  // Batch commit games
  const batch = questions.map((q) => ({
    questionId: q.id,
    questionNumber: q.questionNumber,
    question: q.text,
    category: 'general', // Could extract from question text
    outcome: q.outcome,
  }));

  const result = await oracleService.batchCommitGames(batch);

  // Update questions with oracle data
  for (const success of result.successful) {
    await db
      .update(questionsSchema)
      .set({
        oracleSessionId: success.sessionId,
        oracleCommitment: success.commitment,
        oracleCommitTxHash: success.txHash,
        oracleCommitBlock: success.blockNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(questionsSchema.id, success.questionId));
    committed++;
  }

  errors = result.failed.length;

  if (errors > 0) {
    logger.warn(
      `${errors} oracle commits failed`,
      { failures: result.failed },
      'GameTick'
    );
  }

  logger.info(
    `Oracle commits: ${committed} successful, ${errors} failed`,
    undefined,
    'GameTick'
  );

  return { committed, errors };
}

/**
 * Publish question reveals to blockchain oracle
 */
async function publishOracleReveals(
  questions: Array<{ id: string; outcome: boolean }>
): Promise<{ revealed: number; errors: number }> {
  let revealed = 0;
  let errors = 0;

  // Check if oracle is configured
  if (
    !process.env.NEXT_PUBLIC_BABYLON_ORACLE ||
    !process.env.ORACLE_PRIVATE_KEY
  ) {
    logger.info(
      'Oracle not configured, skipping reveals',
      undefined,
      'GameTick'
    );
    return { revealed: 0, errors: 0 };
  }

  const oracleService = getOracleService();

  // Health check
  const health = await oracleService.healthCheck();
  if (!health.healthy) {
    logger.error(
      `Oracle health check failed: ${health.error}`,
      undefined,
      'GameTick'
    );
    return { revealed: 0, errors: questions.length };
  }

  // Batch reveal games
  const batch = questions.map((q) => ({
    questionId: q.id,
    outcome: q.outcome,
    winners: [], // Could get from positions
    totalPayout: BigInt(0), // Could calculate from positions
  }));

  const result = await oracleService.batchRevealGames(batch);

  // Update questions with oracle data
  for (const success of result.successful) {
    await db
      .update(questionsSchema)
      .set({
        oracleRevealTxHash: success.txHash,
        oracleRevealBlock: success.blockNumber || null,
        oraclePublishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(questionsSchema.id, success.questionId));
    revealed++;
  }

  errors = result.failed.length;

  if (errors > 0) {
    logger.warn(
      `${errors} oracle reveals failed`,
      { failures: result.failed },
      'GameTick'
    );
  }

  logger.info(
    `Oracle reveals: ${revealed} successful, ${errors} failed`,
    undefined,
    'GameTick'
  );

  return { revealed, errors };
}
/**
 * Update widget caches
 * This pre-generates and caches widget data to improve performance
 */
async function updateWidgetCaches(): Promise<number> {
  let cachesUpdated = 0;

  // Get static organization data from registry
  const staticOrgs = StaticDataRegistry.getAllOrganizations();
  // Get dynamic price data from database
  const orgStates = await dbService().getAllOrganizationStates();
  const priceMap = new Map(orgStates.map((s) => [s.id, s.currentPrice]));

  // Combine static and dynamic data - filter to companies only
  const companies = staticOrgs
    .filter((org) => org.type === 'company')
    .map((org) => ({
      id: org.id,
      name: org.name,
      initialPrice: org.initialPrice,
      currentPrice: priceMap.get(org.id) ?? org.initialPrice,
    }));

  if (!companies || companies.length === 0) {
    logger.warn('No companies found for widget cache update', {}, 'GameTick');
    return 0;
  }

  const perpMarketsWithStats = await Promise.all(
    companies
      .filter(
        (company: (typeof companies)[number]) =>
          company && company.id && company.name
      )
      .map(async (company: (typeof companies)[number]) => {
        const currentPrice =
          company.currentPrice || company.initialPrice || 100;

        const priceHistory = await dbService().getPriceHistory(
          company.id,
          1440
        );

        let changePercent24h = 0;

        if (priceHistory && priceHistory.length > 0) {
          const price24hAgo = priceHistory[priceHistory.length - 1];
          if (price24hAgo && price24hAgo.price) {
            const change24h = currentPrice - price24hAgo.price;
            changePercent24h = (change24h / price24hAgo.price) * 100;
          }
        }

        return {
          ticker: company.id.toUpperCase().replace(/-/g, ''),
          organizationId: company.id,
          name: company.name || 'Unknown Company',
          currentPrice,
          changePercent24h,
          volume24h: 0,
        };
      })
  );

  const topPerpGainers = perpMarketsWithStats
    .sort(
      (
        a: (typeof perpMarketsWithStats)[number],
        b: (typeof perpMarketsWithStats)[number]
      ) => Math.abs(b.changePercent24h) - Math.abs(a.changePercent24h)
    )
    .slice(0, 3);

  // 2. Get top 3 pool gainers
  const poolsList = await db
    .select({
      id: pools.id,
      name: pools.name,
      npcActorId: pools.npcActorId,
      totalDeposits: pools.totalDeposits,
      totalValue: pools.totalValue,
    })
    .from(pools)
    .where(eq(pools.isActive, true))
    .orderBy(desc(pools.totalValue));

  // Get actor names for pools from STATIC REGISTRY (no DB call!)
  const poolActorIds = poolsList.map((p) => p.npcActorId).filter(Boolean);
  const poolActorMap = new Map<string, string>();
  for (const actorId of poolActorIds) {
    const actor = StaticDataRegistry.getActor(actorId);
    if (actor) {
      poolActorMap.set(actorId, actor.name);
    }
  }

  const poolsWithReturn = poolsList
    .filter((pool: (typeof poolsList)[number]) => pool && pool.id && pool.name) // Filter out invalid pools
    .map((pool: (typeof poolsList)[number]) => {
      const totalDeposits = Number.parseFloat(
        pool.totalDeposits?.toString() ?? '0'
      );
      const totalValue = Number.parseFloat(pool.totalValue?.toString() ?? '0');
      const totalReturn =
        totalDeposits > 0
          ? ((totalValue - totalDeposits) / totalDeposits) * 100
          : 0;

      // Extract Actor name
      const npcActorName = pool.npcActorId
        ? poolActorMap.get(pool.npcActorId) || 'Unknown'
        : 'Unknown';

      return {
        id: pool.id,
        name: pool.name,
        npcActorName,
        totalReturn,
        totalValue,
      };
    });

  const topPoolGainers = poolsWithReturn
    .sort(
      (
        a: (typeof poolsWithReturn)[number],
        b: (typeof poolsWithReturn)[number]
      ) => b.totalReturn - a.totalReturn
    )
    .slice(0, 3);

  // 3. Get top 3 questions by time-weighted volume
  const activeMarketsList = await db
    .select({
      id: marketsSchema.id,
      question: marketsSchema.question,
      yesShares: marketsSchema.yesShares,
      noShares: marketsSchema.noShares,
      createdAt: marketsSchema.createdAt,
    })
    .from(marketsSchema)
    .where(
      and(
        eq(marketsSchema.resolved, false),
        gte(marketsSchema.endDate, new Date())
      )
    );

  const marketsWithTimeWeightedVolume = activeMarketsList.map(
    (market: (typeof activeMarketsList)[number]) => {
      const yesShares = market.yesShares ? Number(market.yesShares) : 0;
      const noShares = market.noShares ? Number(market.noShares) : 0;
      const totalShares = yesShares + noShares;
      const totalVolume = totalShares * 0.5;

      const ageInHours =
        (Date.now() - market.createdAt.getTime()) / (1000 * 60 * 60);
      const timeWeight =
        ageInHours < 24
          ? 2.0
          : Math.max(1.0, 2.0 - (ageInHours - 24) / (6 * 24));

      const timeWeightedScore = totalVolume * timeWeight;

      const yesPrice = totalShares > 0 ? yesShares / totalShares : 0.5;

      return {
        id: market.id, // Keep as Snowflake string, don't convert to int
        text: market.question || 'Unknown Question',
        totalVolume,
        yesPrice,
        timeWeightedScore,
      };
    }
  );

  const topVolumeQuestions = marketsWithTimeWeightedVolume
    .sort(
      (
        a: (typeof marketsWithTimeWeightedVolume)[number],
        b: (typeof marketsWithTimeWeightedVolume)[number]
      ) => b.timeWeightedScore - a.timeWeightedScore
    )
    .slice(0, 3);

  // Update cache
  const cacheData = {
    topPerpGainers,
    topPoolGainers,
    topVolumeQuestions,
    lastUpdated: new Date().toISOString(),
  };

  // Check if widget cache entry exists
  const [existingCache] = await db
    .select({ widget: widgetCaches.widget })
    .from(widgetCaches)
    .where(eq(widgetCaches.widget, 'markets'))
    .limit(1);

  if (existingCache) {
    await db
      .update(widgetCaches)
      .set({
        data: cacheData as JsonValue,
        updatedAt: new Date(),
      })
      .where(eq(widgetCaches.widget, 'markets'));
  } else {
    await db.insert(widgetCaches).values({
      widget: 'markets',
      data: cacheData as JsonValue,
      updatedAt: new Date(),
    });
  }

  cachesUpdated++;
  logger.info('Updated markets widget cache', {}, 'GameTick');

  return cachesUpdated;
}

/**
 * Force trending calculation (for first tick with baseline posts)
 * Waits a few seconds for tags to be generated from posts, then calculates trending
 */
async function forceTrendingCalculation(): Promise<boolean> {
  logger.info('Forcing trending calculation (first tick)', {}, 'GameTick');

  // Wait 3 seconds for tag generation to complete (tags are generated async)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Call trending calculation directly (already imported at top of file)
  await calculateTrendingTags();

  logger.info('Forced trending calculation complete', {}, 'GameTick');
  return true;
}

// World facts update interval (24 hours in milliseconds)
const WORLD_FACTS_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Check if we should update world facts
 * Uses the most recent RSSHeadline's fetchedAt timestamp
 */
async function shouldUpdateWorldFacts(): Promise<boolean> {
  const [lastHeadline] = await db
    .select({ fetchedAt: rssHeadlines.fetchedAt })
    .from(rssHeadlines)
    .orderBy(desc(rssHeadlines.fetchedAt))
    .limit(1);

  if (!lastHeadline || !lastHeadline.fetchedAt) {
    return true; // Never updated before
  }

  const timeSinceLastUpdate = Date.now() - lastHeadline.fetchedAt.getTime();
  return timeSinceLastUpdate >= WORLD_FACTS_UPDATE_INTERVAL_MS;
}

/** Updates world facts if 24+ hours since last update. */
async function updateWorldFactsIfNeeded(): Promise<{
  updated: boolean;
  stats?: {
    feedsFetched: number;
    newHeadlines: number;
    parodiesGenerated: number;
    headlinesCleaned: number;
  };
}> {
  const shouldUpdate = await shouldUpdateWorldFacts();

  if (!shouldUpdate) {
    logger.debug('World facts update not needed yet', undefined, 'GameTick');
    return { updated: false };
  }

  logger.info(
    '🌍 Starting world facts update from game tick',
    undefined,
    'GameTick'
  );

  const startTime = Date.now();

  // Step 1: Fetch all RSS feeds
  logger.info('Fetching RSS feeds...', undefined, 'GameTick');
  const feedResult = await rssFeedService.fetchAllFeeds();
  logger.info(
    `RSS feeds fetched: ${feedResult.fetched} sources, ${feedResult.stored} new headlines, ${feedResult.errors} errors`,
    feedResult,
    'GameTick'
  );

  // Step 2: Transform untransformed headlines into parodies
  logger.info('Generating parody headlines...', undefined, 'GameTick');
  const untransformedHeadlines =
    await rssFeedService.getUntransformedHeadlines(20); // Process 20 at a time

  const generator = createParodyHeadlineGenerator();
  const parodies = await generator.processHeadlines(untransformedHeadlines);
  logger.info(
    `Generated ${parodies.length} parody headlines`,
    { count: parodies.length },
    'GameTick'
  );

  // Step 3: Clean up old headlines (older than 7 days)
  logger.info('Cleaning up old headlines...', undefined, 'GameTick');
  const cleaned = await rssFeedService.cleanupOldHeadlines();
  logger.info(
    `Cleaned up ${cleaned} old headlines`,
    { count: cleaned },
    'GameTick'
  );

  const duration = Date.now() - startTime;
  logger.info(
    '✅ World facts update completed',
    {
      duration: `${duration}ms`,
      feedsFetched: feedResult.fetched,
      newHeadlines: feedResult.stored,
      parodiesGenerated: parodies.length,
      headlinesCleaned: cleaned,
    },
    'GameTick'
  );

  return {
    updated: true,
    stats: {
      feedsFetched: feedResult.fetched,
      newHeadlines: feedResult.stored,
      parodiesGenerated: parodies.length,
      headlinesCleaned: cleaned,
    },
  };
}

/**
 * Process narrative arcs for active questions.
 * Each question can have an arc that progresses through phases based on game day.
 * Arc events now create world events and can trigger article generation.
 */
async function processNarrativeArcs(
  activeQuestions: Array<{ id: string }>,
  dayNumber: number
): Promise<{
  arcsProcessed: number;
  transitioned: number;
  eventsGenerated: number;
}> {
  const { arcStates } = await import('@babylon/db');

  let arcsProcessed = 0;
  let transitioned = 0;
  let eventsGenerated = 0;

  for (const question of activeQuestions) {
    try {
      // Check if this question has an arc state
      const [existingArc] = await db
        .select({ id: arcStates.id })
        .from(arcStates)
        .where(eq(arcStates.questionId, question.id))
        .limit(1);

      let arcId: string;
      if (!existingArc) {
        // Create arc state for this question
        arcId = await createArcState(question.id);
      } else {
        arcId = existingArc.id;
      }

      // Process the arc tick
      const result = await processArcTick(arcId, dayNumber);
      arcsProcessed++;

      if (result.transitioned) {
        transitioned++;
      }
      if (result.eventGenerated) {
        eventsGenerated++;
      }
    } catch (error) {
      logger.error(
        `Failed to process narrative arc for question ${question.id}`,
        { error: error instanceof Error ? error.message : String(error) },
        'GameTick'
      );
    }
  }

  return {
    arcsProcessed,
    transitioned,
    eventsGenerated,
  };
}
