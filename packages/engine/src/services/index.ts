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
export * from './activity-pattern-service';
export * from './alpha-group-invite-service';
export * from './capital-allocation-service';
export * from './event-market-pipeline';
export * from './following-mechanics';
export * from './game-onboarding-service';
// Group Chat Service
export {
  GroupChatService,
  type InviteChance,
  type SweepDecision,
} from './group-chat-service';
export * from './InteractionTracker';
export * from './initial-investment-service';
export * from './lookahead-generation-service';
export * from './message-quality-checker';
export * from './narrative-event-processor';
export * from './npc-group-dynamics-service';
export * from './npc-interaction-tracker';
export * from './npc-memory-service';
export * from './npc-persona-generator';
export * from './player-influence-service';
export * from './posting-probability-service';
export * from './reply-rate-limiter';
export * from './tier-config';
export * from './tiered-group-service';

// =============================================================================
// Market Services
// =============================================================================

export {
  type EventArcValidationResult,
  EventArcValidator,
} from './event-arc-validator';
export * from './event-market-linker'; // BAB-5: Event-market connection
export * from './market-metrics-service'; // BAB-5: Metrics-based question generation
export * from './market-mover-agent';
export * from './onchain-market-service';
export * from './price-update-service';
export * from './signal-extraction-service';
export * from './trajectory-market-engine';

// =============================================================================
// Content Generation
// =============================================================================

export * from './article-image-service';
export * from './event-generation-helpers';
export * from './narrative-state-service';
export * from './npc-anti-repetition-service';
export * from './npc-character-config';
export * from './parody-headline-generator';
export * from './post-generation-helpers';
export * from './question-arc-planner';

// Tag Service
export {
  type GeneratedTag,
  generateTagsForPosts,
  generateTagsFromPost,
  getCurrentTrendingTags,
  getPostsByTag,
  getRelatedTags,
  getTagStatistics,
  getTagsForPost,
  storeTagsForPost,
  storeTrendingTags,
} from './tag-service';

export * from './trending-calculation-service';
export * from './trending-grouping-service';

// =============================================================================
// Core Services
// =============================================================================

export * from './character-mapping-service';
export * from './earned-points-service';
export * from './fee-service';
export {
  bootstrapGameIfNeeded,
  type GameBootstrapResult,
  GameBootstrapService,
} from './game-bootstrap-service';
export * from './market-context-service';
export * from './market-impact-service';
export * from './npc-wallet-adapter';
export * from './rss-feed-service';
export * from './static-data-registry';
export * from './trade-cache-invalidation';
export * from './trade-execution-service';
export * from './wallet-service';

// =============================================================================
// Oracle & Portfolio Services
// =============================================================================

export { getOracleService, OracleService } from './oracle/oracle-service';
export * from './oracle/types';
export { CommitmentStore } from './oracle-commitment-store';
export {
  calculatePortfolioPnL,
  type PortfolioPnLSnapshot,
} from './portfolio-pnl';

// =============================================================================
// Reputation Service (includes sync interface)
// =============================================================================

export {
  getReputationSyncService,
  ReputationService,
  type ReputationSyncOptions,
  type ReputationSyncResult,
  type ReputationSyncServiceInterface,
  setReputationSyncService,
  syncReputationIfAvailable,
} from './reputation-service';

// =============================================================================
// Token Statistics Service
// =============================================================================

export { TokenStatsService } from './token-stats-service';
