/**
 * Babylon Engine Package
 * Core game simulation, generation, and decision engines
 */

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
// Prediction Pricing
export {
  calculateExpectedPayout,
  PredictionPricing,
  type ShareCalculation,
  type ShareCalculationWithFees,
} from '@babylon/core/markets/prediction';
// Article Generator
export { type Article, ArticleGenerator } from './ArticleGenerator';
// Actors Data Loader
export {
  clearDataCache,
  getActorIds,
  getOrganizationIds,
  type LoadActorsOptions,
  loadActorById,
  loadActorsData,
  loadOrganizationById,
} from './actors-loader';
// State Store Adapters
export { DbStateStore, InMemoryStateStore } from './adapters';
// Configuration
export {
  FEE_CONFIG,
  type FeeTransactionType,
  type FeeType,
} from './config/fees';
export {
  DEFAULT_SIMULATION_CONFIG,
  PREDICTION_TEMPLATES,
  SIMULATION_AGENT_NAMES,
  SIMULATION_CLUE_TEMPLATES,
  SIMULATION_COMPANIES,
  SIMULATION_QUESTIONS,
  SIMULATION_STRATEGIES,
  type SimulationStrategy,
} from './config/simulation';
// Data Exports
export {
  getQuestionExamples,
  questionExamples,
} from './data/question-examples';
export { realityGroundingContent } from './data/reality-grounding';
// Emotion System
export {
  type EmotionalState,
  generateActorContext,
  getRelationshipModifier,
  luckToDescription,
  moodToEmotion,
} from './EmotionSystem';
// Feed Generator
export { FeedGenerator } from './FeedGenerator';
// Bias Engine
export {
  type BiasAdjustment,
  type BiasConfig,
  BiasEngine,
  biasEngine,
} from './feedback/bias-engine';
// Game Clock (injectable time abstraction)
export { GameClock, type GameClockConfig, type GameTime } from './GameClock';
// Game Generator
export {
  createQuestionPrompt,
  createScenarioPrompt,
  GameGenerator,
  OrganizationBehavior,
  type OrganizationType,
} from './GameGenerator';
// Game Loop (tick-based simulation orchestrator)
export { GameLoop } from './GameLoop';
// Game Simulator (standalone simulation engine)
export {
  type GameConfig,
  type GameEvent,
  type GameResult,
  GameSimulator,
  type MarketState as SimulatedMarketState,
  type ReputationChange,
  type SimulatedAgent,
} from './GameSimulator';
// Game Tick (canonical tick executor)
export {
  type ActiveMarket,
  type ActiveQuestion,
  type GameActor,
  type GameOrganization,
  type GameStateStore,
  GameTick,
  type TickConfig,
  type TickResult,
  type TickServices,
} from './GameTick';
// Game World
export {
  type CausalEventContext,
  type CausalEventType,
  type DayEvent,
  GameWorld,
  type GameWorldEvents,
  type GroupMessage,
  type MarketContext,
  type NPC,
  type ScheduledCausalEvent,
  type WorldConfig,
  type WorldState,
} from './GameWorld';
// Game Service
export { type ActiveMarketSummary, gameService } from './game-service';
// Game Tick (realtime/cron execution)
export {
  executeGameTick,
  type GameTickResult as ExecuteGameTickResult,
  resolveQuestionPayouts,
} from './game-tick';
export {
  cleanMarkdownCodeBlocks,
  extractJsonFromText,
  parseContinuationContent,
} from './llm/json-continuation-parser';
// LLM Exports (re-exported for convenience)
export {
  BabylonLLMClient,
  getTokenUsageCallback,
  setTokenUsageCallback,
  type TokenUsageCallback,
} from './llm/openai-client';
export { parseXML, type XMLParseResult } from './llm/xml-parser';
// Market Decision Engine
export { MarketDecisionEngine } from './MarketDecisionEngine';
// News Article Pacing Engine
export {
  type ArticleStage,
  NewsArticlePacingEngine,
} from './NewsArticlePacingEngine';
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
export {
  type ParsedPostMetadata,
  type ParseResult,
  parsePostId,
} from './post-id-parser';
// Concentrated Liquidity
export {
  type AddPositionParams,
  ConcentratedLiquidityPool,
  type ConcentratedPosition,
  type ConcentratedTradeResult,
  calculateOptimalRange,
  createPoolFromMarket,
  estimateFeeAPR,
  type PoolConfig,
  type PoolState,
  type RemovePositionResult,
} from './prediction-concentrated-liquidity';
// Prompts
export * from './prompts';
// Question Manager
export {
  type QuestionCreationParams,
  QuestionManager,
} from './QuestionManager';
// Relationship Evolution Engine
export {
  type Interaction,
  type RelationshipChange,
  RelationshipEvolutionEngine,
} from './RelationshipEvolutionEngine';
// Rate Limiting
export {
  checkDuplicate,
  checkRateLimit,
  checkRateLimitAsync,
  cleanupDuplicates,
  cleanupMemoryRateLimits,
  clearAllDuplicates,
  clearAllRateLimits,
  clearDuplicates,
  DUPLICATE_DETECTION_CONFIGS,
  getDuplicateStats,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  resetRateLimit,
} from './rate-limiting';
// Reputation Module
export {
  calculateAverageROI,
  calculateConfidenceScore,
  // Trade Feedback Calculator
  calculateEntryTimingScore,
  calculateExitTimingScore,
  calculateGameScore,
  // Reputation Calculation Service
  calculateReputationScore,
  calculateRiskScore,
  calculateSharpeRatio,
  calculateTradeMetrics,
  calculateTradeScore,
  calculateWinRate,
  denormalizePnL,
  type GameMetrics,
  generateBatchGameFeedback,
  generateGameCompletionFeedback,
  generateTradeCompletionFeedback,
  getReputationBreakdown,
  getReputationLeaderboard,
  getTradeFeedbackSummary,
  getTrustLevel,
  // PNL Normalization utilities
  normalizePnL,
  type ReputationScoreBreakdown,
  recalculateReputation,
  type TradeMetrics,
  updateFeedbackMetrics,
  updateGameMetrics,
  updateTradingMetrics,
} from './reputation';
// Services (all exported from services/index.ts)
export * from './services';
// Storage Bridge (database-agnostic storage abstraction)
export {
  db,
  exportState,
  getStorageMode,
  initializeDatabaseMode,
  initializeSimulationMode,
  initializeTestMode,
  isDatabaseMode,
  isSimulationMode,
  isTestMode,
  loadSnapshot,
  type StorageMode,
  saveSnapshot,
} from './storage-bridge';
// Trending Topics Engine
export {
  type TrendingTopic,
  TrendingTopicsEngine,
} from './TrendingTopicsEngine';
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
  ActorState,
  ActorsDatabase,
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
// Token Stats Types
export type {
  LLMCallTokenUsage,
  ModelStats,
  PromptTypeStats,
  TickTokenStats,
  TokenStatsSummary,
  TokenUsageCollector,
} from './types/token-stats';
export {
  calculateEstimatedCost,
  TOKEN_COST_PER_MILLION,
} from './types/token-stats';
// Utils - Entropy (secure random, weighted picks, cooldowns)
export {
  biasedRandomCount,
  type EventCooldownState,
  generateSentimentSignal,
  SeededRandom,
  securePickN,
  secureRandom,
  secureRandomInt,
  secureShuffle,
  shouldFireEvent,
  urgencyWeight,
  weightedPick,
} from './utils/entropy';
// Utils - Prompt Logging
export {
  isPromptLoggingEnabled,
  logPrompt,
  type PromptLogEntry,
} from './utils/prompt-logger';
// Utils - Randomization
export {
  pickRandom,
  randomChance,
  randomInt,
  sampleRandom,
  shuffleArray,
} from './utils/randomization';
// World Facts Service
export {
  type WorldFactsContext,
  WorldFactsService,
  worldFactsService,
} from './world-facts-service';
