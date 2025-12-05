/**
 * Liquidity Simulation Module
 *
 * @module testing/simulation
 *
 * @description
 * Provides tools for simulating and analyzing market liquidity in Babylon.
 * Includes scenarios for testing market stress conditions, health monitoring,
 * and concentrated liquidity features.
 *
 * @example
 * ```typescript
 * import {
 *   LiquiditySimulator,
 *   SCENARIOS,
 *   generateReport,
 *   formatReportForConsole
 * } from '@babylon/testing';
 *
 * const simulator = new LiquiditySimulator(SCENARIOS.normal);
 * const result = await simulator.run();
 * const report = generateReport(result);
 * console.log(formatReportForConsole(report));
 * ```
 */

export {
  type LiquidityScenarioConfig,
  LiquiditySimulator,
  runScenarioComparison,
  SCENARIOS,
  type SimulationEvent,
  type SimulationResult,
  type TickMetrics,
} from './liquidity-simulation';

export {
  compareScenarios,
  exportTimeSeriesCSV,
  exportToJSON,
  formatReportForConsole,
  generateReport,
  type ReportSummary,
  type SimulationReport,
  type TimeSeriesAnalysis,
} from './simulation-report';
