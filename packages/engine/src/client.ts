/**
 * Babylon Engine - Client-Safe Exports
 *
 * This module exports utilities that are safe to use in client-side code.
 * It does NOT include any server-only dependencies like Redis, Postgres,
 * or Node.js built-in modules (tls, fs, child_process, etc.)
 *
 * Use this import for React client components:
 * import { PredictionPricing } from '@babylon/engine/client';
 */

// Fee Configuration (pure constants, no dependencies)
export { FEE_CONFIG, type FeeType, type FeeTransactionType } from './config/fees';

// Prediction Pricing (pure math, no server dependencies)
export {
  calculateExpectedPayout,
  PredictionPricing,
  type ShareCalculation,
  type ShareCalculationWithFees,
} from './prediction-pricing';

// Concentrated Liquidity (pure math)
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

// Market Decision Types (types only, no runtime code)
export type {
  ExecutedTrade,
  MarketAction,
  MarketType,
  TradeImpact,
  TradingDecision,
  TradingExecutionResult,
} from './types/market-decisions';

// Shared Game Types (re-exported from types, no server deps)
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

// Common Types (types only)
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

// Utils - Randomization (pure functions)
export {
  pickRandom,
  randomChance,
  randomInt,
  sampleRandom,
  shuffleArray,
} from './utils/randomization';

// Reputation calculations that are pure functions (no DB)
// Import directly from the pnl-normalizer file to avoid pulling in server-side deps from the barrel export
export {
  normalizePnL,
  denormalizePnL,
  calculateWinRate,
  calculateAverageROI,
  calculateSharpeRatio,
  getTrustLevel,
  calculateConfidenceScore,
} from './reputation/pnl-normalizer';

// Portfolio PnL type (interface only, no runtime deps - defined here to avoid importing from server-only file)
export interface PortfolioPnLSnapshot {
  lifetimePnL: number;
  netContributions: number;
  totalDeposited: number;
  totalWithdrawn: number;
  availableBalance: number;
  unrealizedPerpPnL: number;
  unrealizedPredictionPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  accountEquity: number;
}

