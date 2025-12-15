import { logger } from '@babylon/shared';
import {
  BabylonLLMClient,
  FeedGenerator,
  GameLoop,
  GameWorld,
  initializeSimulationMode,
  MarketContextService,
  MarketDecisionEngine,
  RelationshipEvolutionEngine,
  StaticDataRegistry,
  saveSnapshot,
} from '../src';
import { TrajectoryMarketEngine } from '../src/services/trajectory-market-engine';

logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

async function main() {
  console.log('🚀 Starting RL Data Generation Pipeline...');
  console.log('===========================================');

  // 1. Initialize JSON DB Mode (Bypass Postgres)
  await initializeSimulationMode('./training-data-output');
  console.log('✅ Storage Bridge: JSON Mode Initialized');

  // 2. Setup the LLM Client
  const llmClient = BabylonLLMClient.forGameTick();
  console.log(`✅ LLM Client: Connected via ${llmClient.getProvider()}`);

  // 3. Initialize Core Services
  const actors = StaticDataRegistry.getAllActors();
  console.log(`✅ Static Registry: Loaded ${actors.length} actors`);

  const feed = new FeedGenerator(llmClient);
  const contextService = new MarketContextService();
  const relationships = new RelationshipEvolutionEngine(llmClient);

  // 4. Initialize the Market Engines
  const rawMarketEngine = new MarketDecisionEngine(llmClient, contextService, {
    model: 'claude-haiku-4-5-20251001', // Explicitly use the fast/smart model
    maxOutputTokens: 4000,
  });

  // The 'Trajectory' engine wraps it to record the (Observation -> Thought -> Action) loop
  const trajectoryEngine = new TrajectoryMarketEngine(rawMarketEngine, {
    enableRecording: true,
    samplingRate: 1.0, // Record 100% of decisions for the dataset
  });
  console.log('✅ Trajectory Recorder: ATTACHED');

  // 5. Setup Game World & Loop
  const world = new GameWorld({ outcome: true, numNPCs: 10 }, llmClient);

  const loop = new GameLoop(
    world,
    feed,
    trajectoryEngine as any,
    relationships
  );

  // 6. Run Simulation (1 Day / 24 Hours)
  console.log('\n🧠 STARTING SIMULATION LOOP...');
  const gameId = `training-batch-${Date.now()}`;

  // Initialize world state (create initial events/posts)
  await world.generate();

  // Run 24 ticks (Hours 0-23)
  for (let hour = 0; hour < 24; hour++) {
    console.log(`\n--- Tick ${hour}:00 ---`);

    // We pass 'false' for marketOnly to ensure social feed + trading both happen
    const result = await loop.tick(gameId, 1, hour, false);

    console.log(`   > Trades: ${result.tradeCount}`);
    console.log(`   > Posts:  ${result.posts.length}`);
    console.log(`   > Events: ${result.events.length}`);
  }

  // 7. Save the raw state
  await saveSnapshot();
  console.log('\n===========================================');
  console.log('✅ GENERATION COMPLETE');
  console.log('Data saved to: ./training-data-output/state.json');
  console.log("Review this JSON to ensure 'reasoning' fields are populated.");
}

main().catch(console.error);
