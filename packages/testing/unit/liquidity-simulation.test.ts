/**
 * Liquidity Simulation Tests
 *
 * Tests the core simulation framework, funding rate calculator, and P&L mechanics.
 */

import { describe, expect, it } from 'bun:test';
import {
  calculateDynamicFundingRate,
  calculatePositionFunding,
  FUNDING_DEFAULTS,
  getFundingRateTier,
} from '@babylon/engine';
import {
  type LiquidityScenarioConfig,
  LiquiditySimulator,
  SCENARIOS,
} from '@babylon/testing';

describe('Funding Rate Calculator', () => {
  it('should return base rate when market is balanced', () => {
    const result = calculateDynamicFundingRate({
      longOpenInterest: 10000,
      shortOpenInterest: 10000,
    });

    expect(result.annualRate).toBeCloseTo(FUNDING_DEFAULTS.BASE_RATE, 2);
    expect(result.imbalance).toBeCloseTo(0, 2);
    expect(result.paymentDirection).toBe('balanced');
    expect(result.isSeverelyImbalanced).toBe(false);
  });

  it('should increase funding rate when longs dominate', () => {
    const result = calculateDynamicFundingRate({
      longOpenInterest: 80000,
      shortOpenInterest: 20000,
    });

    expect(result.annualRate).toBeGreaterThan(FUNDING_DEFAULTS.BASE_RATE);
    expect(result.imbalance).toBeCloseTo(0.6, 2);
    expect(result.paymentDirection).toBe('longs_pay');
    expect(result.isSeverelyImbalanced).toBe(true);
  });

  it('should have negative funding rate when shorts dominate', () => {
    const result = calculateDynamicFundingRate({
      longOpenInterest: 20000,
      shortOpenInterest: 80000,
    });

    expect(result.annualRate).toBeLessThan(0);
    expect(result.imbalance).toBeCloseTo(-0.6, 2);
    expect(result.paymentDirection).toBe('shorts_pay');
  });

  it('should cap funding rate at maximum', () => {
    const result = calculateDynamicFundingRate({
      longOpenInterest: 99000,
      shortOpenInterest: 1000,
    });

    expect(Math.abs(result.annualRate)).toBeLessThanOrEqual(
      FUNDING_DEFAULTS.MAX_RATE
    );
  });

  it('should calculate position funding correctly', () => {
    const periodRate = 0.01 / FUNDING_DEFAULTS.PERIODS_PER_YEAR; // ~0.0009% per 8h

    // Long pays when rate is positive
    const longPayment = calculatePositionFunding(1000, periodRate, 'long');
    expect(longPayment).toBeGreaterThan(0);

    // Short receives when rate is positive
    const shortPayment = calculatePositionFunding(1000, periodRate, 'short');
    expect(shortPayment).toBeLessThan(0);

    // Payments should be equal in magnitude
    expect(Math.abs(longPayment)).toBeCloseTo(Math.abs(shortPayment), 4);
  });

  it('should return correct funding rate tier', () => {
    expect(getFundingRateTier(0.01).tier).toBe('low');
    expect(getFundingRateTier(0.05).tier).toBe('moderate');
    expect(getFundingRateTier(0.15).tier).toBe('high');
    expect(getFundingRateTier(0.4).tier).toBe('extreme');
  });
});

describe('Liquidity Simulation', () => {
  it('should run normal scenario without errors', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.normal,
      durationTicks: 10, // Short simulation for testing
      seed: 12345, // Reproducible
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    expect(result.durationTicks).toBe(10);
    expect(result.finalHealthScore).toBeGreaterThan(0);
    expect(result.tickMetrics.length).toBe(10);
  });

  it('should produce zero-sum P&L between NPC and User', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.normal,
      durationTicks: 50,
      seed: 54321,
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    const npcPnL = result.finalPredictionState.npcNetPnL;
    const userPnL = result.finalPredictionState.userNetPnL;

    // P&L should be approximately zero-sum (allowing for floating point)
    expect(npcPnL + userPnL).toBeCloseTo(0, 0);
  });

  it('should trigger liquidations during price crash', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.spotCrash,
      durationTicks: 50,
      seed: 99999,
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    // Should have some liquidations from the 20% drop
    expect(result.finalPerpState.liquidationCount).toBeGreaterThan(0);
  });

  it('should detect low liquidity health issues', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.lowLiquidity,
      durationTicks: 20,
      seed: 11111,
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    // Low liquidity should result in health score below 100
    expect(result.lowestHealthScore).toBeLessThan(100);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it('should escalate funding rate for extreme imbalance', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.perpImbalance,
      durationTicks: 50,
      seed: 22222,
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    // Extreme long bias should result in elevated funding rates
    expect(result.finalPerpState.avgFundingRateAPR).toBeGreaterThan(5);
  });

  it('should track events that occurred', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.spotCrash,
      durationTicks: 50,
      seed: 33333,
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    const eventsTriggered = result.eventsTriggered;
    expect(eventsTriggered.length).toBe(1);
    expect(eventsTriggered[0]?.type).toBe('npc_spot_shock');
  });

  it('should handle mass exit event', async () => {
    const config: LiquidityScenarioConfig = {
      ...SCENARIOS.massExit,
      durationTicks: 60, // Must run past tick 50 when event fires
      seed: 44444,
    };
    const simulator = new LiquiditySimulator(config);

    const result = await simulator.run();

    const eventsTriggered = result.eventsTriggered;
    expect(eventsTriggered.length).toBe(1);
    expect(eventsTriggered[0]?.type).toBe('mass_exit');
    // Should still maintain reasonable health after mass exit
    expect(result.finalHealthScore).toBeGreaterThanOrEqual(50);
  });
});
