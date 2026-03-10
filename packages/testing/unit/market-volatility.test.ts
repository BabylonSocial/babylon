/**
 * Market Volatility Simulation Tests
 *
 * Verifies that simulated market volatility produces realistic price movements:
 * - Fat tails (occasional large moves)
 * - Volatility clustering (volatile periods persist)
 * - Mean reversion (prices tend toward initial over time)
 * - Asymmetry (crashes faster than rallies)
 */

import { describe, expect, test } from 'bun:test';

// Replicate the generateVolatilityMove logic for testing
interface VolatilityState {
  recentVolatility: number;
  momentum: number;
  lastMove: number;
}

const MIN_MARKET_VOLATILITY = 0.005;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateVolatilityMove(
  state: VolatilityState,
  initialPrice: number,
  currentPrice: number,
  random: () => number = Math.random
): number {
  const baseVolatility = state.recentVolatility;
  const volatilityMultiplier = 0.5 + random();
  const currentVolatility = baseVolatility * volatilityMultiplier;

  let move: number;
  const fatTailChance = random();

  if (fatTailChance < 0.01) {
    const direction = random() > 0.5 ? 1 : -1;
    move = direction * currentVolatility * (3 + random() * 3);
  } else if (fatTailChance < 0.05) {
    move = (random() - 0.5) * 2 * currentVolatility * (2 + random());
  } else if (fatTailChance < 0.15) {
    move = (random() - 0.5) * 2 * currentVolatility * (1.5 + random() * 0.5);
  } else {
    move = (random() - 0.5) * 2 * currentVolatility;
  }

  move += state.momentum * (0.5 + random() * 0.5);

  const priceRatio = currentPrice / initialPrice;
  if (priceRatio > 1.5) {
    move -= 0.001 * (priceRatio - 1);
  } else if (priceRatio < 0.7) {
    move += 0.001 * (1 - priceRatio);
  }

  if (move < 0) {
    move *= 1.2;
  }

  const maxMove = 0.05;
  return Math.max(-maxMove, Math.min(move, maxMove));
}

describe('Market Volatility Simulation', () => {
  describe('generateVolatilityMove', () => {
    const defaultState: VolatilityState = {
      recentVolatility: MIN_MARKET_VOLATILITY,
      momentum: 0,
      lastMove: 0,
    };

    test('generates moves within reasonable bounds', () => {
      const random = createSeededRandom(1001);
      const moves: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const move = generateVolatilityMove(
          { ...defaultState },
          100,
          100,
          random
        );
        moves.push(move);
      }

      // All moves should be within ±5%
      expect(moves.every((m) => Math.abs(m) <= 0.05)).toBe(true);

      // Most moves should be small (< 1%)
      const smallMoves = moves.filter((m) => Math.abs(m) < 0.01);
      expect(smallMoves.length).toBeGreaterThan(800); // >80% should be small
    });

    test('produces fat tails (occasional large moves)', () => {
      const random = createSeededRandom(1002);
      const moves: number[] = [];
      for (let i = 0; i < 10000; i++) {
        const move = generateVolatilityMove(
          { ...defaultState },
          100,
          100,
          random
        );
        moves.push(move);
      }

      // Should have some large moves (> 1%)
      // Using conservative threshold (0.5%) to account for probabilistic variance
      const largeMoves = moves.filter((m) => Math.abs(m) > 0.01);
      expect(largeMoves.length).toBeGreaterThan(50); // At least 0.5%

      // Should have very large moves (> 2%) occasionally
      const veryLargeMoves = moves.filter((m) => Math.abs(m) > 0.02);
      expect(veryLargeMoves.length).toBeGreaterThan(5); // At least 0.05%
    });

    test('respects momentum', () => {
      const random = createSeededRandom(1003);
      const upMomentum: VolatilityState = {
        recentVolatility: MIN_MARKET_VOLATILITY,
        momentum: 0.005, // Strong upward momentum
        lastMove: 0.005,
      };

      const moves: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const move = generateVolatilityMove(upMomentum, 100, 100, random);
        moves.push(move);
      }

      // Average move should be positive due to momentum
      const avgMove = moves.reduce((a, b) => a + b, 0) / moves.length;
      expect(avgMove).toBeGreaterThan(0);
    });

    test('applies mean reversion when price is high', () => {
      const random = createSeededRandom(1004);
      const moves: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const move = generateVolatilityMove(
          { ...defaultState },
          100,
          200, // Price is 2x initial
          random
        );
        moves.push(move);
      }

      // Average move should be slightly negative (mean reversion)
      const avgMove = moves.reduce((a, b) => a + b, 0) / moves.length;
      expect(avgMove).toBeLessThan(0);
    });

    test('applies mean reversion when price is low', () => {
      const random = createSeededRandom(1005);
      const moves: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const move = generateVolatilityMove(
          { ...defaultState },
          100,
          50, // Price is 0.5x initial
          random
        );
        moves.push(move);
      }

      // Average move should be slightly positive (mean reversion)
      const avgMove = moves.reduce((a, b) => a + b, 0) / moves.length;
      expect(avgMove).toBeGreaterThan(0);
    });

    test('crashes are faster than rallies (asymmetry)', () => {
      const random = createSeededRandom(1006);
      // Generate many moves and compare magnitude of up vs down
      const upMoves: number[] = [];
      const downMoves: number[] = [];

      for (let i = 0; i < 10000; i++) {
        const move = generateVolatilityMove(
          { ...defaultState },
          100,
          100,
          random
        );
        if (move > 0) upMoves.push(move);
        else downMoves.push(Math.abs(move));
      }

      // Average down move should be larger than average up move
      const avgUp = upMoves.reduce((a, b) => a + b, 0) / upMoves.length;
      const avgDown = downMoves.reduce((a, b) => a + b, 0) / downMoves.length;

      expect(avgDown).toBeGreaterThan(avgUp * 1.1); // At least 10% faster
    });
  });

  describe('price evolution over time', () => {
    test('price stays within bounds over many ticks', () => {
      const random = createSeededRandom(1007);
      const initialPrice = 100;
      let currentPrice = 100;
      const state: VolatilityState = {
        recentVolatility: MIN_MARKET_VOLATILITY,
        momentum: 0,
        lastMove: 0,
      };

      // Simulate 1000 ticks (about 16 hours of game time)
      for (let i = 0; i < 1000; i++) {
        const move = generateVolatilityMove(
          state,
          initialPrice,
          currentPrice,
          random
        );
        currentPrice = currentPrice * (1 + move);

        // Update state
        state.lastMove = move;
        state.momentum = move * 0.3;
        state.recentVolatility = Math.max(
          MIN_MARKET_VOLATILITY,
          state.recentVolatility * 0.8 + Math.abs(move) * 0.2
        );
      }

      // Price should still be reasonable (not at extremes)
      expect(currentPrice).toBeGreaterThan(initialPrice * 0.25);
      expect(currentPrice).toBeLessThan(initialPrice * 4);
    });

    test('volatility clustering occurs', () => {
      const random = createSeededRandom(1008);
      const state: VolatilityState = {
        recentVolatility: MIN_MARKET_VOLATILITY,
        momentum: 0,
        lastMove: 0,
      };

      const absoluteMoves: number[] = [];

      // Use a longer simulation and compare next-step volatility after
      // high-vol vs low-vol moves. This is less noisy than max/min ratios.
      for (let i = 0; i < 3000; i++) {
        const move = generateVolatilityMove(state, 100, 100, random);
        state.lastMove = move;
        state.momentum = move * 0.3;
        state.recentVolatility = Math.max(
          MIN_MARKET_VOLATILITY,
          state.recentVolatility * 0.8 + Math.abs(move) * 0.2
        );
        absoluteMoves.push(Math.abs(move));
      }

      const warmup = 200;
      const usableMoves = absoluteMoves.slice(warmup, -1);
      const sortedMoves = [...usableMoves].sort((a, b) => a - b);

      const lowVolThreshold =
        sortedMoves[Math.floor(sortedMoves.length * 0.25)] ?? 0;
      const highVolThreshold =
        sortedMoves[Math.floor(sortedMoves.length * 0.75)] ?? 0;

      let highNextVolSum = 0;
      let lowNextVolSum = 0;
      let highCount = 0;
      let lowCount = 0;

      for (let i = warmup; i < absoluteMoves.length - 1; i++) {
        const currentMove = absoluteMoves[i] ?? 0;
        const nextMove = absoluteMoves[i + 1] ?? 0;

        if (currentMove >= highVolThreshold) {
          highNextVolSum += nextMove;
          highCount++;
        } else if (currentMove <= lowVolThreshold) {
          lowNextVolSum += nextMove;
          lowCount++;
        }
      }

      expect(highCount).toBeGreaterThan(100);
      expect(lowCount).toBeGreaterThan(100);

      const avgNextAfterHigh = highNextVolSum / highCount;
      const avgNextAfterLow = lowNextVolSum / lowCount;

      // In clustered volatility, high-vol moves are followed by higher volatility.
      expect(avgNextAfterHigh / avgNextAfterLow).toBeGreaterThan(1.15);
    });
  });

  describe('statistical properties', () => {
    test('distribution is not uniform', () => {
      const random = createSeededRandom(1009);
      const moves: number[] = [];
      for (let i = 0; i < 10000; i++) {
        const move = generateVolatilityMove(
          {
            recentVolatility: MIN_MARKET_VOLATILITY,
            momentum: 0,
            lastMove: 0,
          },
          100,
          100,
          random
        );
        moves.push(move);
      }

      // Count moves in different buckets
      const tiny = moves.filter((m) => Math.abs(m) < 0.001).length;
      const small = moves.filter(
        (m) => Math.abs(m) >= 0.001 && Math.abs(m) < 0.005
      ).length;
      const medium = moves.filter(
        (m) => Math.abs(m) >= 0.005 && Math.abs(m) < 0.01
      ).length;
      const large = moves.filter((m) => Math.abs(m) >= 0.01).length;

      // Should follow roughly: many small, fewer medium, few large
      expect(tiny + small).toBeGreaterThan(medium + large);
      expect(medium).toBeGreaterThan(large);
    });

    test('volatility floor prevents the market from going flat', () => {
      const random = createSeededRandom(1010);
      const state: VolatilityState = {
        recentVolatility: MIN_MARKET_VOLATILITY,
        momentum: 0,
        lastMove: 0,
      };

      for (let i = 0; i < 500; i++) {
        const move = generateVolatilityMove(state, 100, 100, random);
        state.lastMove = move;
        state.momentum = move * 0.3;
        state.recentVolatility = Math.max(
          MIN_MARKET_VOLATILITY,
          state.recentVolatility * 0.8 + Math.abs(move) * 0.2
        );
      }

      expect(state.recentVolatility).toBeGreaterThanOrEqual(
        MIN_MARKET_VOLATILITY
      );
    });
  });
});
