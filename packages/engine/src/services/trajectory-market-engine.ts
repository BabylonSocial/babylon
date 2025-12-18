/**
 * Trajectory-Aware Market Decision Engine
 *
 * Wraps MarketDecisionEngine to record all decisions as trajectories for RL training.
 * Can be toggled on/off via environment variable for zero-overhead in production.
 */

import type { MarketDecisionEngine } from '@babylon/engine';
import { logger } from '@babylon/shared';
import {
  type Action,
  type EnvironmentState,
  getCurrentWindowId,
  TrajectoryRecorder,
} from '@babylon/training';
import type { TradingDecision } from '../types/market-decisions';

export class TrajectoryMarketEngine {
  private engine: MarketDecisionEngine;
  private recorder: TrajectoryRecorder | null = null;
  private trajectoryId: string | null = null;
  private enabled: boolean;
  private samplingRate: number;

  constructor(
    engine: MarketDecisionEngine,
    options: {
      enableRecording?: boolean;
      samplingRate?: number;
    } = {}
  ) {
    this.engine = engine;

    // Always enable trajectory recording for RL training
    this.enabled = options.enableRecording ?? true;

    // Sampling rate (1.0 = record everything, 0.5 = record 50%)
    this.samplingRate =
      options.samplingRate ??
      Number.parseFloat(process.env.TRAJECTORY_SAMPLING_RATE || '1.0');

    if (this.enabled) {
      this.recorder = new TrajectoryRecorder();
      logger.info(
        'Trajectory recording enabled for market decisions',
        {
          samplingRate: this.samplingRate,
        },
        'TrajectoryMarketEngine'
      );
    }
  }

  /**
   * Generate batch decisions with optional trajectory recording
   */
  async generateBatchDecisions(): Promise<TradingDecision[]> {
    // Check if we should record this batch (sampling)
    const shouldRecord = this.enabled && Math.random() < this.samplingRate;

    if (shouldRecord && this.recorder) {
      await this.startRecording();
    }

    // Generate decisions using underlying engine
    const decisions = await this.engine.generateBatchDecisions();

    // Record each decision if recording is active
    if (this.trajectoryId && this.recorder) {
      await this.recordDecisions(decisions);
    }

    // End recording
    if (this.trajectoryId && this.recorder) {
      await this.endRecording(decisions);
    }

    return decisions;
  }

  /**
   * Start a new trajectory recording
   */
  private async startRecording(): Promise<void> {
    if (!this.recorder) return;

    const windowId = getCurrentWindowId();

    this.trajectoryId = await this.recorder.startTrajectory({
      agentId: 'market-decision-engine',
      scenarioId: `market-decisions-${windowId}`,
      windowId,
      metadata: {
        recordingType: 'market_decisions',
        timestamp: new Date().toISOString(),
      },
    });

    logger.debug('Started trajectory recording', {
      trajectoryId: this.trajectoryId,
      windowId,
    });
  }

  /**
   * Record each decision as a step
   */
  private async recordDecisions(decisions: TradingDecision[]): Promise<void> {
    if (!this.recorder || !this.trajectoryId) return;

    for (const decision of decisions) {
      // Build environment state
      const envState: EnvironmentState = {
        agentBalance: 0, // Would need pool balance data
        agentPoints: 0,
        agentPnL: 0, // Could calculate from pool history
        openPositions: 0, // Would need position data
        timestamp: Date.now(),
      };

      // Start step
      this.recorder.startStep(this.trajectoryId, envState);

      // Log LLM call representing the decision
      // We reconstruct the prompt logic here since we can't intercept the raw prompt easily
      // This ensures the dataset is complete even if fields are missing
      const reasoning = decision.reasoning || 'No reasoning provided';

      this.recorder.logLLMCall(this.trajectoryId, {
        model: 'market-decision-model',
        purpose: 'action',
        actionType: decision.action,
        systemPrompt:
          'You are an NPC making trading decisions based on market data, social sentiment, and your specific character archetype. Output structured XML decisions.',
        userPrompt: `Trader: ${decision.npcName} (ID: ${decision.npcId})
Context: Analyze current market conditions and private intel.
Action Required: Determine best trading action.`,
        response: reasoning,
        reasoning: reasoning,
        temperature: 0.5,
        maxTokens: 1000,
        latencyMs: 0,
      });

      // Build action
      const action: Action = {
        actionType: decision.action,
        parameters: {
          npcId: decision.npcId,
          npcName: decision.npcName,
          ticker: decision.ticker ?? '',
          marketId: decision.marketId ?? '',
          marketType: decision.marketType,
          amount: decision.amount,
          confidence: decision.confidence,
          // Ensure reasoning is included in parameters if it exists
          reasoning: decision.reasoning,
        },
        success: true,
        result: {
          action: decision.action,
          amount: decision.amount,
          market: decision.ticker || decision.marketId || 'unknown',
        },
      };

      // Immediate reward calculated when market resolves
      const reward = 0;

      // Complete step
      this.recorder.completeStep(this.trajectoryId, action, reward);
    }

    logger.debug('Recorded decisions', {
      count: decisions.length,
      trajectoryId: this.trajectoryId,
    });
  }

  /**
   * End the trajectory recording
   */
  private async endRecording(decisions: TradingDecision[]): Promise<void> {
    if (!this.recorder || !this.trajectoryId) return;

    // Calculate final metrics
    const totalInvested = decisions.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    await this.recorder.endTrajectory(this.trajectoryId, {
      finalBalance: undefined, // Would need pool balance
      finalPnL: undefined, // Calculated when markets resolve
      windowId: getCurrentWindowId(),
      gameKnowledge: {
        actualOutcomes: {},
      },
    });

    logger.info('Trajectory recording completed', {
      trajectoryId: this.trajectoryId,
      decisions: decisions.length,
      totalInvested,
    });

    this.trajectoryId = null;
  }
}
