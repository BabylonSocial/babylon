/**
 * Babylon Engine Package
 * Core game simulation, generation, and decision engines
 */

// Article Generator
export { ArticleGenerator, type Article } from './ArticleGenerator';

// Emotion System
export {
  generateActorContext,
  getRelationshipModifier,
  luckToDescription,
  moodToEmotion,
  type EmotionalState,
} from './EmotionSystem';

// Feed Generator
export { FeedGenerator } from './FeedGenerator';

// Game Generator
export {
  createQuestionPrompt,
  createScenarioPrompt,
  GameGenerator,
  OrganizationBehavior,
  type OrganizationType,
} from './GameGenerator';
// GameHistory, GeneratedGame types are re-exported from ./types/shared

// Game Loop
export { GameLoop, type TickResult } from './GameLoop';

// Game World
export {
  GameWorld,
  type DayEvent,
  type GameWorldEvents,
  type GroupMessage,
  type MarketContext,
  type NPC,
  type WorldConfig,
  type WorldState,
} from './GameWorld';
// WorldEvent type is re-exported from ./types/shared

// Market Decision Engine
export { MarketDecisionEngine } from './MarketDecisionEngine';

// News Article Pacing Engine
export {
  NewsArticlePacingEngine,
  type ArticleStage,
} from './NewsArticlePacingEngine';

// Perpetuals Engine
export { PerpetualsEngine } from './PerpetualsEngine';

// Question Manager
export {
  QuestionManager,
  type QuestionCreationParams,
} from './QuestionManager';

// Relationship Evolution Engine
export {
  RelationshipEvolutionEngine,
  type Interaction,
  type RelationshipChange,
} from './RelationshipEvolutionEngine';

// Trending Topics Engine
export {
  TrendingTopicsEngine,
  type TrendingTopic,
} from './TrendingTopicsEngine';

// LLM Exports (re-exported for convenience)
export { BabylonLLMClient } from './llm/openai-client';
export {
  cleanMarkdownCodeBlocks,
  extractJsonFromText,
  parseContinuationContent,
} from './llm/json-continuation-parser';
export { parseXML, type XMLParseResult } from './llm/xml-parser';

// Prompts
export * from './prompts';

// Actors Data Loader
export {
  clearDataCache,
  getActorIds,
  getOrganizationIds,
  loadActorById,
  loadActorsData,
  loadOrganizationById,
  type LoadActorsOptions,
} from './actors-loader';

// World Facts Service
export {
  WorldFactsService,
  worldFactsService,
  type WorldFactsContext,
} from './world-facts-service';

// Game Service
export { gameService } from './game-service';

// Serverless Game Tick
export {
  executeGameTick,
  resolveQuestionPayouts,
  type GameTickResult,
} from './serverless-game-tick';

// Reputation Sync Interface (for optional integration with agents package)
export {
  getReputationSyncService,
  setReputationSyncService,
  syncReputationIfAvailable,
  type ReputationSyncOptions,
  type ReputationSyncResult,
  type ReputationSyncServiceInterface as ReputationSyncService,
} from './services/reputation-service';

// Logger
export { Logger, logger, type LogLevel } from '@babylon/shared';

// Rate Limiting
export {
  checkDuplicate,
  checkRateLimit,
  cleanupDuplicates,
  cleanupRateLimits,
  clearAllDuplicates,
  clearAllRateLimits,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from './rate-limiting';

// Configuration
export { FEE_CONFIG, type FeeType, type FeeTransactionType } from './config/fees';

// Prediction Pricing
export {
  calculateExpectedPayout,
  PredictionPricing,
  type ShareCalculation,
  type ShareCalculationWithFees,
} from './prediction-pricing';

// Market Decision Types
export type {
  ExecutedTrade,
  MarketAction,
  MarketType,
  TradeImpact,
  TradingDecision,
  TradingExecutionResult,
} from './types/market-decisions';

// Shared Game Types
export type {
  Actor,
  ActorConnection,
  ActorData,
  ActorRelationship,
  ActorsDatabase,
  ActorState,
  ActorTier,
  DayTimeline,
  FeedEvent,
  FeedPost,
  GameHistory,
  GameResolution,
  GameSetup,
  GameState,
  GeneratedGame,
  GenesisGame,
  GroupChat,
  GroupChatMessage,
  LuckChange,
  MoodChange,
  Organization,
  OrgType,
  PostType,
  PriceUpdate,
  Question,
  QuestionOutcome,
  RelationshipType,
  Scenario,
  SelectedActor,
  StockPrice,
  WorldContext,
  WorldEvent,
} from './types/shared';

export {
  ACTOR_TIERS,
  DAY_RANGES,
  getEscalationLevel,
  ORG_TYPES,
  POST_TYPES,
  RELATIONSHIP_TYPES,
} from './types/shared';

// Common Types
export type {
  ApiResponse,
  ErrorLike,
  FilterParams,
  JsonRpcParams,
  JsonRpcResult,
  JsonValue,
  LLMResponse,
  LogData,
  PaginatedResponse,
  PaginationParams,
  QueryParams,
  SortOrder,
  SortParams,
  StringRecord,
  WebSocketData,
} from './types/common';

// Services
export {
  CharacterMappingService,
  characterMappingService,
  type TextReplacementResult,
} from './services/character-mapping-service';

export {
  FeeService,
  type FeeCalculation,
  type FeeDistributionResult,
  type ReferralEarnings,
} from './services/fee-service';

export {
  MarketContextService,
} from './services/market-context-service';

export {
  aggregateTradeImpacts,
  type AggregatedImpact,
  type TradeImpactInput,
} from './services/market-impact-service';

export {
  PredictionMarketService,
  type BroadcasterFn,
  type PredictionHistoryEventType,
  type PredictionHistorySource,
  type PredictionPriceSnapshot,
  type PredictionResolutionEvent,
  type PredictionTradeEvent,
} from './services/prediction-market-service';

export { EarnedPointsService } from './services/earned-points-service';

export {
  RSSFeedService,
  rssFeedService,
  type ParsedFeed,
  type RSSFeedItem,
} from './services/rss-feed-service';

export {
  NPCGroupDynamicsService as NPCGroupDynamicsCalculations,
  type KickProbabilityResult,
  type KickThresholds,
} from './services/npc-group-dynamics-calculations';

// Snowflake ID Generator
export {
  generateSnowflakeId,
  isValidSnowflakeId,
  parseSnowflakeId,
  SnowflakeGenerator,
} from '@babylon/shared';

// Market Context Types
export type {
  EventContext,
  FeedPostContext,
  GroupChatContext,
  MarketSnapshots,
  NewsArticleContext,
  NPCMarketContext,
  NPCPosition,
  PerpMarketSnapshot,
  PredictionMarketSnapshot,
  RelationshipContext,
} from './types/market-context';

// Utils - Randomization
export {
  pickRandom,
  randomChance,
  randomInt,
  sampleRandom,
  shuffleArray,
} from './utils/randomization';

// Utils - Content Analysis
export {
  analyzeCertainty,
  analyzeSentiment,
  calculateContentQuality,
  calculateFreshness,
  detectPrediction,
  hasInsiderLanguage,
} from '@babylon/shared';

// Utils - Content Safety
export {
  checkAgentOutput,
  checkUserInput,
  sanitizeContent,
  type ContentCheckResult,
} from '@babylon/shared';

// Utils - Prompt Logging
export {
  isPromptLoggingEnabled,
  logPrompt,
  type PromptLogEntry,
} from './utils/prompt-logger';

// Data Exports
export {
  getQuestionExamples,
  questionExamples,
} from './data/question-examples';
export { realityGroundingContent } from './data/reality-grounding';

// Token Counter (now in @babylon/api)
export {
  budgetTokens,
  countTokens,
  countTokensSync,
  getModelTokenLimit,
  getSafeContextLimit,
  MODEL_TOKEN_LIMITS,
  truncateToTokenLimit,
  truncateToTokenLimitSync,
} from '@babylon/api';

// Post ID Parser
export {
  parsePostId,
  type ParsedPostMetadata,
  type ParseResult,
} from './post-id-parser';

// Concentrated Liquidity
export {
  calculateOptimalRange,
  ConcentratedLiquidityPool,
  createPoolFromMarket,
  estimateFeeAPR,
  type AddPositionParams,
  type ConcentratedPosition,
  type ConcentratedTradeResult,
  type PoolConfig,
  type PoolState,
  type RemovePositionResult,
} from './prediction-concentrated-liquidity';

// Perps Service
export {
  ensurePerpsEngineReady,
  getPerpsEngine,
  getReadyPerpsEngine,
  withPerpsEngine,
} from './perps-service';

// Perps Utilities (funding rate calculator, etc.)
export * from './perps';

// Reputation Module
export {
  // PNL Normalization utilities
  normalizePnL,
  denormalizePnL,
  calculateWinRate,
  calculateAverageROI,
  calculateSharpeRatio,
  getTrustLevel,
  calculateConfidenceScore,
  // Reputation Calculation Service
  calculateReputationScore,
  updateGameMetrics,
  updateTradingMetrics,
  updateFeedbackMetrics,
  recalculateReputation,
  getReputationBreakdown,
  getReputationLeaderboard,
  calculateGameScore,
  calculateTradeScore,
  generateGameCompletionFeedback,
  generateTradeCompletionFeedback,
  generateBatchGameFeedback,
  // Trade Feedback Calculator
  calculateEntryTimingScore,
  calculateExitTimingScore,
  calculateRiskScore,
  calculateTradeMetrics,
  getTradeFeedbackSummary,
  type ReputationScoreBreakdown,
  type GameMetrics,
  type TradeMetrics,
} from './reputation';

// Bias Engine
export {
  BiasEngine,
  biasEngine,
  type BiasConfig,
  type BiasAdjustment,
} from './feedback/bias-engine';

// Tag Services
export {
  storeTagsForPost,
  getTagsForPost,
  getPostsByTag,
  getTagStatistics,
  storeTrendingTags,
  getCurrentTrendingTags,
  getRelatedTags,
} from './services/tag-service';

export {
  shouldRecalculateTrending,
  calculateTrendingTags,
  calculateTrendingIfNeeded,
} from './services/trending-calculation-service';

// Parody Headline Generator
export {
  createParodyHeadlineGenerator,
  ParodyHeadlineGenerator,
  type GeneratedParody,
} from './services/parody-headline-generator';

// Wallet Service
export {
  WalletService,
  type BalanceInfo,
  type TransactionHistoryItem,
} from './services/wallet-service';

// Trade Cache Invalidation
export {
  invalidateAfterPerpTrade,
  invalidateAfterPredictionTrade,
  invalidatePerpTradesCache,
  invalidatePredictionTradesCache,
  setCacheInvalidationClient,
  type CacheInvalidationClient,
} from './services/trade-cache-invalidation';

// Trade Execution Service
export { TradeExecutionService } from './services/trade-execution-service';

// NPC Persona Generator
export {
  NPCPersonaGenerator,
  type PersonaAssignment,
} from './services/npc-persona-generator';

// Question Arc Planner
export {
  QuestionArcPlanner,
  type PhaseTargets,
  type QuestionArcPlan,
} from './services/question-arc-planner';

// Event Generation Helpers
export { generateEvents } from './services/event-generation-helpers';

// Post Generation Helpers
export {
  generateNPCPost,
  generateOrgArticle,
  generateOrgPost,
} from './services/post-generation-helpers';

// NPC Investment Manager
export {
  NPCInvestmentManager,
  type PortfolioMetrics,
  type PortfolioPosition,
  type RebalanceAction,
} from './npc/npc-investment-manager';

// NPC Portfolio Strategy
export {
  NPCPortfolioStrategy,
  type StrategyConfig,
} from './npc/npc-portfolio-strategy';

// All Services (exported from services/index.ts)
export * from './services';

