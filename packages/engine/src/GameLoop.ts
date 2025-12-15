import { PerpDbAdapter, PerpMarketService } from '@babylon/core/markets/perps';
import type { WalletPort } from '@babylon/core/markets/shared';
import { logger } from '@babylon/shared';
import { FEE_CONFIG } from './config/fees';
import type { FeedGenerator } from './FeedGenerator';
import type { GameWorld, WorldEvent } from './GameWorld';
import type { MarketDecisionEngine } from './MarketDecisionEngine';
// NewsArticlePacingEngine removed - was reserved but never integrated
import type { RelationshipEvolutionEngine } from './RelationshipEvolutionEngine';
import { StaticDataRegistry } from './services/static-data-registry';
import { TradeExecutionService } from './services/trade-execution-service';
import { WalletService } from './services/wallet-service';
import { isSimulationMode } from './storage-bridge';
import type { TrendingTopicsEngine } from './TrendingTopicsEngine';
import type { Actor, ActorTier, FeedPost } from './types/shared';

/**
 * Result of a single simulation tick execution.
 * Used by GameLoop for offline/training game generation.
 *
 * Note: This is distinct from GameTick's TickResult (for injectable architecture)
 * and game-tick.ts's GameTickResult (for production cron).
 */
export interface SimulationTickResult {
  /** World events generated during this tick */
  events: WorldEvent[];
  /** Feed posts generated during this tick */
  posts: FeedPost[];
  /** Number of trades executed during this tick */
  tradeCount: number;
  /** Whether market state was updated (funding rates processed) */
  marketUpdated: boolean;
}

/**
 * Game Loop - Core game tick execution engine
 *
 * Orchestrates the execution of a single game tick, coordinating:
 * - Market maintenance (funding rates, price updates)
 * - NPC trading decisions and execution
 * - World event generation
 * - Feed post generation (with trending topic context)
 * - Relationship evolution
 *
 * Used by both live game ticks (cron jobs) and game simulation (full game generation).
 */
export class GameLoop {
  private trendingTopics?: TrendingTopicsEngine;
  private recentPosts: FeedPost[] = [];
  private tickCount = 0;

  constructor(
    private world: GameWorld,
    private feed: FeedGenerator,
    private marketDecisions: MarketDecisionEngine,
    private relationships: RelationshipEvolutionEngine
  ) {}

  /**
   * Set the trending topics engine for trend-aware feed generation
   */
  setTrendingTopics(engine: TrendingTopicsEngine): void {
    this.trendingTopics = engine;
    this.feed.setTrendingTopics(engine);
  }

  /**
   * Run a single tick of the game universe.
   * Used by BOTH the live cron job (1 tick) and the generator (30 days * 24 ticks).
   *
   * @param gameId - ID of the game instance
   * @param day - Current day number (1-30)
   * @param hour - Current hour (0-23)
   * @param marketOnly - If true, only runs market logic (for fast-forwarding)
   */
  async tick(
    gameId: string,
    day: number,
    hour: number,
    marketOnly = false
  ): Promise<SimulationTickResult> {
    logger.info(
      `Processing Tick: Day ${day}, Hour ${hour}`,
      { gameId, marketOnly },
      'GameLoop'
    );

    // 1. Market Maintenance (Financial Layer)
    // Funding is now handled outside GameLoop via core services/jobs
    const marketUpdated = false;

    // 2. Market Decisions (Financial Layer)
    // Generate trading activity based on current state
    // This drives price action which then feeds into narrative
    const decisions = await this.marketDecisions.generateBatchDecisions();
    let tradeCount = 0;

    if (decisions.length > 0) {
      try {
        const executionService = new TradeExecutionService();
        const executionResult =
          await executionService.executeDecisionBatch(decisions);
        tradeCount = executionResult.successfulTrades;

        logger.info(
          `NPC Trading: ${executionResult.successfulTrades} trades executed`,
          {
            successful: executionResult.successfulTrades,
            failed: executionResult.failedTrades,
            holds: executionResult.holdDecisions,
          },
          'GameLoop'
        );
      } catch (e) {
        logger.warn(
          `Trade execution batch failed: ${
            e instanceof Error ? e.message : String(e)
          }`,
          undefined,
          'GameLoop'
        );
      }
    }

    // 3. World Events (Narrative Layer)
    // Pass market state to world so narrative reacts to crashes/pumps
    // This implements the "Soros Loop" (Market -> Narrative)
    const walletAdapter: WalletPort = {
      debit: (params) =>
        WalletService.debit(
          params.userId,
          params.amount,
          params.reason,
          params.description ?? '',
          params.relatedId
        ),
      credit: (params) =>
        WalletService.credit(
          params.userId,
          params.amount,
          params.reason,
          params.description ?? '',
          params.relatedId
        ),
      recordPnL: async (params) => {
        await WalletService.recordPnL(
          params.userId,
          params.pnl,
          params.reason,
          params.relatedId
        );
      },
      getBalance: (userId) => WalletService.getBalance(userId),
    };

    const perpService = new PerpMarketService({
      db: new PerpDbAdapter(),
      wallet: walletAdapter,
      fees: {
        tradingFeeRate: FEE_CONFIG.TRADING_FEE_RATE,
        platformShare: FEE_CONFIG.PLATFORM_SHARE,
        referrerShare: FEE_CONFIG.REFERRER_SHARE,
        minFeeAmount: FEE_CONFIG.MIN_FEE_AMOUNT,
      },
    });

    let marketState;
    // Simulation Mode Bypass
    if (isSimulationMode()) {
      marketState = [
        {
          ticker: 'BTCAI',
          organizationId: 'btc',
          name: 'BitcAIn',
          currentPrice: 120000,
          change24h: 6240,
          changePercent24h: 5.2,
          high24h: 121000,
          low24h: 118000,
          volume24h: 1000000,
          openInterest: 500000,
          fundingRate: {
            rate: 0.001,
            nextFundingTime: new Date().toISOString(),
            predictedRate: 0.001,
          },
          maxLeverage: 20,
          minOrderSize: 10,
          markPrice: 120000,
          indexPrice: 120000,
        },
        {
          ticker: 'ETHAI',
          organizationId: 'eth',
          name: 'EtherAIum',
          currentPrice: 4000,
          change24h: 84,
          changePercent24h: 2.1,
          high24h: 4100,
          low24h: 3900,
          volume24h: 500000,
          openInterest: 200000,
          fundingRate: {
            rate: 0.001,
            nextFundingTime: new Date().toISOString(),
            predictedRate: 0.001,
          },
          maxLeverage: 20,
          minOrderSize: 10,
          markPrice: 4000,
          indexPrice: 4000,
        },
      ];
    } else {
      marketState = await perpService.getMarketsSnapshot();
    }

    // Calculate significant moves for narrative context
    const significantMoves = marketState
      .filter((m) => Math.abs(m.changePercent24h) > 5)
      .map((m) => ({ ticker: m.ticker, change: m.changePercent24h }));

    let worldEvents: WorldEvent[] = [];
    try {
      worldEvents = await this.world.generateTickEvents(day, hour, {
        markets: marketState,
        significantMoves,
      });
    } catch (e) {
      logger.warn(
        `Failed to generate world events: ${
          e instanceof Error ? e.message : String(e)
        }`,
        { day, hour },
        'GameLoop'
      );
    }

    // 4. Feed Reaction (Social Layer)
    // Skip if marketOnly is true (for fast simulations)
    let posts: FeedPost[] = [];
    this.tickCount++;

    if (!marketOnly) {
      // Update trending topics before feed generation (engine handles interval internally)
      if (this.trendingTopics && this.recentPosts.length > 0) {
        await this.trendingTopics.updateTrends(
          this.recentPosts,
          this.tickCount
        );
        this.feed.updateTrendContext();
      }

      // Fetch actors from static registry for feed generation
      // Use a subset of top actors for efficiency in simulation
      const staticActors = StaticDataRegistry.getAllActors().slice(0, 15);

      if (staticActors.length > 0) {
        // Convert static actors to Actor type expected by FeedGenerator
        const actorList: Actor[] = staticActors.map((actor) => ({
          id: actor.id,
          name: actor.name,
          description: actor.description || undefined,
          domain: Array.isArray(actor.domain)
            ? actor.domain
            : actor.domain
              ? [actor.domain]
              : undefined,
          personality: actor.personality || undefined,
          tier: actor.tier as ActorTier | undefined,
          affiliations: actor.affiliations || [],
          postStyle: actor.postStyle || undefined,
          postExample: Array.isArray(actor.postExample)
            ? actor.postExample
            : actor.postExample
              ? [actor.postExample]
              : undefined,
          role: actor.role || undefined,
          initialLuck: actor.initialLuck as
            | 'low'
            | 'medium'
            | 'high'
            | undefined,
          initialMood: actor.initialMood || undefined,
        }));

        posts = await this.feed.generateDayFeed(day, worldEvents, actorList);

        // Accumulate posts for trending analysis (keep last 200)
        this.recentPosts = [...this.recentPosts, ...posts].slice(-200);
      } else {
        logger.warn('No actors found for feed generation', {}, 'GameLoop');
      }
    }

    // 5. Relationship Evolution (Social Layer)
    // Only run once per day to save tokens, or on major interactions
    if (!marketOnly && hour === 23) {
      try {
        await this.relationships.analyzeAndUpdateRelationships();
      } catch (e) {
        logger.warn(
          `Failed to analyze relationships: ${
            e instanceof Error ? e.message : String(e)
          }`,
          undefined,
          'GameLoop'
        );
      }
    }

    // 6. Record Snapshot - now handled via PerpMarketService in the game tick cron
    // Daily snapshots are stored in PerpMarketSnapshot table via PerpDbAdapter

    return { events: worldEvents, posts, tradeCount, marketUpdated };
  }

  /**
   * Generate a complete game history by executing all ticks
   *
   * Fast-forwards through the entire game duration, executing all ticks
   * sequentially to generate a complete game history.
   *
   * @param gameId - ID of the game instance
   * @param durationDays - Number of days to simulate (default: 30)
   * @returns Array of tick results for the entire game duration
   */
  async simulateFullGame(
    gameId: string,
    durationDays = 30
  ): Promise<SimulationTickResult[]> {
    logger.info(`Starting Simulation for ${gameId}...`, undefined, 'GameLoop');

    const history: SimulationTickResult[] = [];

    // Run the loop 30 * 24 times
    for (let day = 1; day <= durationDays; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const tickResult = await this.tick(gameId, day, hour, false);
        history.push(tickResult);
      }
    }

    return history;
  }
}
