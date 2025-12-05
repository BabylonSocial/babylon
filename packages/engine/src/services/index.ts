/**
 * Engine Services
 *
 * @module engine/services
 *
 * @description
 * Game engine services for NPCs, markets, content generation, and game mechanics.
 */

// =============================================================================
// NPC Services
// =============================================================================

export * from './ActorSocialActions';
export * from './alpha-group-invite-service';
export * from './capital-allocation-service';
export * from './following-mechanics';
export * from './initial-investment-service';
export * from './InteractionTracker';
export * from './lookahead-generation-service';
export * from './message-quality-checker';
export * from './npc-group-dynamics-service';
export * from './npc-interaction-tracker';
export * from './npc-persona-generator';
export * from './RelationshipManager';
export * from './reply-rate-limiter';

// Group Chat Service
export {
  GroupChatService,
  type InviteChance,
  type SweepDecision,
} from './group-chat-service';

// =============================================================================
// Market Services
// =============================================================================

export {
  EventArcValidator,
  type EventArcValidationResult,
} from './event-arc-validator';
export * from './liquidity-health-service';
export * from './onchain-market-service';
export * from './perp-trade-service';
export * from './price-update-service';
export * from './signal-extraction-service';
export * from './trajectory-market-engine';

// Prediction Market Service
export {
  PredictionMarketService,
  type PredictionTradeEvent,
  type PredictionResolutionEvent,
  type BroadcasterFn,
  type PredictionPriceSnapshot,
  type PredictionHistoryEventType,
  type PredictionHistorySource,
} from './prediction-market-service';

// =============================================================================
// Content Generation
// =============================================================================

export * from './event-generation-helpers';
export * from './post-generation-helpers';
export * from './question-arc-planner';
export * from './parody-headline-generator';

// Tag Service
export {
  generateTagsFromPost,
  generateTagsForPosts,
  storeTagsForPost,
  getTagsForPost,
  getPostsByTag,
  getTagStatistics,
  storeTrendingTags,
  getCurrentTrendingTags,
  getRelatedTags,
  type GeneratedTag,
} from './tag-service';

// Trending Services (kept separate due to different concerns)
export * from './trending-calculation-service';
export * from './trending-grouping-service';

// =============================================================================
// Core Services
// =============================================================================

export * from './character-mapping-service';
export * from './earned-points-service';
export * from './fee-service';
export * from './market-context-service';
export * from './market-impact-service';
export * from './rss-feed-service';
export * from './trade-cache-invalidation';
export * from './trade-execution-service';
export * from './wallet-service';

// =============================================================================
// Oracle & Portfolio Services
// =============================================================================

export { CommitmentStore } from './oracle-commitment-store';
export {
  calculatePortfolioPnL,
  type PortfolioPnLSnapshot,
} from './portfolio-pnl';
export { getOracleService, OracleService } from './oracle/oracle-service';
export * from './oracle/types';

// =============================================================================
// Reputation Service (includes sync interface)
// =============================================================================

export {
  ReputationService,
  setReputationSyncService,
  getReputationSyncService,
  syncReputationIfAvailable,
  type ReputationSyncResult,
  type ReputationSyncOptions,
  type ReputationSyncServiceInterface,
} from './reputation-service';
