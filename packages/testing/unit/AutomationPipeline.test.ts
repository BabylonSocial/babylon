/**
 * Unit Tests for AutomationPipeline
 *
 * Tests core functionality without external dependencies
 */

import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';

// Tests use mocked db module
const describeTests = describe;

// Import types used in type assertions for repository mocks
import type { TrainedModel, TrainingBatch } from '@babylon/db';
import type {
  AutomationConfig,
  AutomationPipeline as AutomationPipelineType,
} from '@babylon/training';

// Type for pipeline with private properties/methods exposed for testing
// Uses a structural type to access private members in tests
interface PipelineTestAccess {
  config: AutomationConfig;
  getNextModelVersion: () => Promise<string>;
  getTrajectoryIds: (limit?: number) => Promise<string[]>;
  runTrainingPipeline: () => Promise<void>;
  processTrainingBatch: () => Promise<void>;
  evaluateModel: () => Promise<void>;
  runHealthChecks: () => Promise<void>;
}

// Helper to access private members for testing purposes
// This is a test-only utility that bypasses TypeScript's access modifiers
const asTestAccess = (pipeline: AutomationPipelineType): PipelineTestAccess =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pipeline as never as PipelineTestAccess;

// Type for mock function with mockClear
interface MockFunction {
  mockClear?: () => void;
}

// Store mock results queue - each call to db.select() will shift one result
let mockSelectResultsQueue: unknown[][] = [];
let mockGroupByResults: unknown[] = [];
let mockFindManyResults: unknown[] = [];

// Create a chainable query builder mock
const createQueryChain = (isGroupBy = false) => {
  const chain = {
    from: () => chain,
    where: () => chain,
    groupBy: () => createQueryChain(true), // Switch to groupBy mode
    orderBy: () => chain,
    limit: () => chain,
    offset: () => chain,
  };

  // Make it thenable (Promise-like) - returns the appropriate result based on query type
  const getResult = () => {
    if (isGroupBy) {
      return mockGroupByResults;
    }
    return mockSelectResultsQueue.shift() ?? [];
  };

  return Object.assign(chain, {
    then: (
      resolve: (value: unknown[]) => void,
      reject?: (error: Error) => void
    ) => Promise.resolve(getResult()).then(resolve, reject),
    catch: (reject: (error: Error) => void) =>
      Promise.resolve(getResult()).catch(reject),
    [Symbol.toStringTag]: 'Promise',
  });
};

// Define mocks for db (Drizzle query builder style)
const mockDb = {
  select: mock(() => createQueryChain()),
  insert: mock(() => ({
    values: () => ({
      returning: () => Promise.resolve([{ id: 'mock-id' }]),
      onConflictDoNothing: () => Promise.resolve(),
    }),
  })),
  update: mock(() => ({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([]),
      }),
    }),
  })),
  delete: mock(() => ({
    where: () => ({
      returning: () => Promise.resolve([]),
    }),
  })),
  // Repository-style methods for compatibility
  // Use permissive return types to allow mockResolvedValue with different values
  trajectory: {
    count: mock(),
    groupBy: mock(),
    findMany: mock(() => Promise.resolve(mockFindManyResults)),
    findFirst: mock(),
    updateMany: mock(),
  },
  trainingBatch: {
    create: mock(() => Promise.resolve({ id: 'batch-1' })),
    findUnique: mock(() => Promise.resolve(null as TrainingBatch | null)),
    findFirst: mock(() => Promise.resolve(null as TrainingBatch | null)),
    count: mock(() => Promise.resolve(0)),
    update: mock(() => Promise.resolve({})),
  },
  trainedModel: {
    findFirst: mock(() => Promise.resolve(null as TrainedModel | null)),
    create: mock(() => Promise.resolve({ id: 'model-1' })),
    count: mock(() => Promise.resolve(0)),
    update: mock(() => Promise.resolve({})),
  },
  user: {
    count: mock(() => Promise.resolve(1)),
  },
  $queryRaw: mock(() => Promise.resolve([{ result: 1 }])),
};

const mockLogger = {
  debug: mock(),
  info: mock(),
  warn: mock(),
  error: mock(),
};

// Mock modules - using @babylon/db since AutomationPipeline imports from there
// Include all exports that may be imported by AutomationPipeline and its dependencies
mock.module('@babylon/db', () => ({
  db: mockDb,
  // Tables (as empty objects since we're mocking db methods)
  // Core tables
  users: {},
  actors: {},
  posts: {},
  comments: {},
  reactions: {},
  shares: {},
  messages: {},
  chats: {},
  chatParticipants: {},
  notifications: {},
  // Agent-related tables
  agentLogs: {},
  agentMessages: {},
  agentPerformanceMetrics: {},
  agentGoals: {},
  agentGoalActions: {},
  agentPointsTransactions: {},
  agentTrades: {},
  agentRegistries: {},
  agentCapabilities: {},
  externalAgentConnections: {},
  npcInteractions: {},
  npcTrades: {},
  // Training tables
  trajectories: {},
  trainingBatches: {},
  trainedModels: {},
  benchmarkResults: {},
  llmCallLogs: {},
  marketOutcomes: {},
  rewardJudgments: {},
  // Other tables
  worldFacts: {},
  worldEvents: {},
  referrals: {},
  pointsTransactions: {},
  balanceTransactions: {},
  markets: {},
  positions: {},
  perpPositions: {},
  pools: {},
  poolPositions: {},
  poolDeposits: {},
  organizations: {},
  stockPrices: {},
  questions: {},
  predictionPriceHistories: {},
  favorites: {},
  follows: {},
  followStatuses: {},
  tags: {},
  postTags: {},
  trendingTags: {},
  actorFollows: {},
  actorRelationships: {},
  userActorFollows: {},
  userInteractions: {},
  tradingFees: {},
  feedbacks: {},
  reports: {},
  moderationEscrows: {},
  // Operators (as no-op functions)
  eq: () => ({}),
  and: () => ({}),
  or: () => ({}),
  sql: () => ({}),
  desc: () => ({}),
  asc: () => ({}),
  gte: () => ({}),
  lte: () => ({}),
  gt: () => ({}),
  lt: () => ({}),
  ne: () => ({}),
  isNull: () => ({}),
  isNotNull: () => ({}),
  not: () => ({}),
  count: () => ({}),
  inArray: () => ({}),
  notInArray: () => ({}),
  like: () => ({}),
  ilike: () => ({}),
  between: () => ({}),
  exists: () => ({}),
  notExists: () => ({}),
  sum: () => ({}),
  avg: () => ({}),
  min: () => ({}),
  max: () => ({}),
  // Types (for satisfying type imports)
  Trajectory: {},
  TrainingBatch: {},
  TrainedModel: {},
}));

mock.module('@babylon/shared', () => ({
  logger: mockLogger,
}));

// Mock the training package logger
// AutomationPipeline imports from '../utils/logger' relative to its location
// We need to mock it using the package export path
mock.module('@babylon/training/utils/logger', () => ({
  logger: mockLogger,
}));

// Mock fs module for health checks
const mockMkdir = mock(() => Promise.resolve(undefined));
mock.module('node:fs/promises', () => ({
  default: {
    mkdir: mockMkdir,
  },
  mkdir: mockMkdir,
}));

describeTests('AutomationPipeline - Unit Tests', () => {
  let AutomationPipeline: new (
    config?: Partial<AutomationConfig>
  ) => AutomationPipelineType; // Constructor
  let pipeline: AutomationPipelineType;
  let mockConfig: Partial<AutomationConfig>;

  beforeAll(async () => {
    // Set dummy DATABASE_URL to prevent database from complaining
    // This must be done before importing the module
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock';

    // Dynamic import to ensure env var is set and mocks are applied
    const module = await import('@babylon/training/training');
    AutomationPipeline = module.AutomationPipeline;
  });

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockDb).forEach((model) => {
      if (typeof model === 'object') {
        Object.values(model).forEach((fn) => {
          const mockFn = fn as MockFunction;
          mockFn.mockClear?.();
        });
      } else {
        const mockFn = model as MockFunction;
        mockFn.mockClear?.();
      }
    });
    Object.values(mockLogger).forEach((fn) => fn.mockClear());

    // Reset query result queues
    mockSelectResultsQueue = [];
    mockGroupByResults = [];
    mockFindManyResults = [];

    mockConfig = {
      minTrajectoriesForTraining: 50,
      minGroupSize: 3,
      dataQualityThreshold: 0.9,
      autoTriggerTraining: true,
      trainingInterval: 12,
      baseModel: 'unsloth/Qwen3-4B-128K',
      modelNamePrefix: 'test-model',
      atroposApiUrl: 'http://localhost:8000',
      vllmPort: 9001,
      modelStoragePath: '/tmp/test-models',
      dataStoragePath: '/tmp/test-data',
    };

    pipeline = new AutomationPipeline(mockConfig);
  });

  describe('Configuration', () => {
    test('should use default configuration when not provided', () => {
      const defaultPipeline = new AutomationPipeline();
      const status = defaultPipeline['config'];

      // Check that it uses environment variables if set, or defaults to 1
      // Logic matches implementation: must be finite and > 0
      const envMinTraj = Number.parseInt(
        process.env.TRAINING_MIN_TRAJECTORIES || '',
        10
      );
      const expectedMinTrajectories =
        Number.isFinite(envMinTraj) && envMinTraj > 0 ? envMinTraj : 1;

      const envMinGroup = Number.parseInt(
        process.env.TRAINING_MIN_GROUP_SIZE || '',
        10
      );
      const expectedMinGroupSize =
        Number.isFinite(envMinGroup) && envMinGroup > 0 ? envMinGroup : 1;

      expect(status.minTrajectoriesForTraining).toBe(expectedMinTrajectories);
      expect(status.minGroupSize).toBe(expectedMinGroupSize);
      expect(status.dataQualityThreshold).toBe(0.95);
      expect(status.baseModel).toBe('unsloth/Qwen3-4B-128K');
    });

    test('should merge custom config with defaults', () => {
      // Access private config property for testing
      const pipelineWithPrivate = asTestAccess(pipeline);
      const config = pipelineWithPrivate.config;

      expect(config.minTrajectoriesForTraining).toBe(50);
      expect(config.minGroupSize).toBe(3);
      expect(config.dataQualityThreshold).toBe(0.9);
      expect(config.baseModel).toBe('unsloth/Qwen3-4B-128K');
    });

    test('should use OpenPipe model by default', () => {
      const defaultPipeline = new AutomationPipeline();
      // Access private config property for testing
      const config = asTestAccess(defaultPipeline).config;
      expect(config.baseModel).toBe('unsloth/Qwen3-4B-128K');
    });

    test('should allow custom model override', () => {
      const customPipeline = new AutomationPipeline({
        baseModel: 'custom-model',
      });
      // Access private config property for testing
      const config = asTestAccess(customPipeline).config;
      expect(config.baseModel).toBe('custom-model');
    });
  });

  describe('Training Readiness Check', () => {
    test('should be not ready when insufficient trajectories', async () => {
      // Setup query results in order of calls:
      // 1. scoredAndReady count
      // 2. unscored count
      // 3. scenarios groupBy
      // 4. calculateDataQuality findMany
      mockSelectResultsQueue = [
        [{ count: 30 }], // scoredAndReady
        [{ count: 0 }], // unscored
      ];
      mockGroupByResults = [];
      mockFindManyResults = [];

      const result = await pipeline.checkTrainingReadiness();

      expect(result.ready).toBe(false);
      expect(result.reason).toContain('more trajectories');
      expect(result.stats.totalTrajectories).toBe(30);
    });

    test('should be not ready when insufficient scenario groups', async () => {
      // Setup query results
      mockSelectResultsQueue = [
        [{ count: 100 }], // scoredAndReady
        [{ count: 0 }], // unscored
      ];
      mockGroupByResults = [
        { scenarioId: 'scenario-1', count: 5 },
        { scenarioId: 'scenario-2', count: 4 },
      ];
      // Data quality check - needs valid data
      mockFindManyResults = Array.from({ length: 50 }, (_, i) => ({
        trajectoryId: `traj-${i}`,
        stepsJson: JSON.stringify([
          {
            llmCalls: [
              {
                systemPrompt: 'a'.repeat(100),
                userPrompt: 'b'.repeat(150),
                response: 'Test',
              },
            ],
            providerAccesses: [{ provider: 'test' }],
            action: { result: 'success' },
          },
        ]),
      }));

      const result = await pipeline.checkTrainingReadiness();

      expect(result.ready).toBe(false);
      expect(result.reason).toContain('scenario groups');
      expect(result.stats.scenarioGroups).toBe(2);
    });

    test('should be ready when all conditions met', async () => {
      // Good quality trajectory data for calculateDataQuality
      const goodTrajectories = Array.from({ length: 50 }, (_, i) => ({
        trajectoryId: `traj-${i}`,
        stepsJson: JSON.stringify([
          {
            llmCalls: [
              {
                systemPrompt: 'a'.repeat(100),
                userPrompt: 'b'.repeat(150),
                response: 'Test',
              },
            ],
            providerAccesses: [{ provider: 'test' }],
            action: { result: 'success' },
          },
        ]),
      }));

      mockSelectResultsQueue = [
        [{ count: 100 }], // scoredAndReady
        [{ count: 0 }], // unscored
        goodTrajectories, // calculateDataQuality sample
      ];
      mockGroupByResults = Array.from({ length: 15 }, (_, i) => ({
        scenarioId: `scenario-${i}`,
        count: 5,
      }));

      const result = await pipeline.checkTrainingReadiness();

      expect(result.ready).toBe(true);
      expect(result.reason).toBe('Ready to train!');
      expect(result.stats.scenarioGroups).toBeGreaterThanOrEqual(10);
    });

    test('should check data quality', async () => {
      // Mock poor quality data for calculateDataQuality sample
      const poorQualityData = Array.from({ length: 50 }, () => ({
        trajectoryId: 'traj-poor-quality',
        stepsJson: JSON.stringify([
          {
            llmCalls: [], // No LLM calls = poor quality
            action: {},
          },
        ]),
      }));

      mockSelectResultsQueue = [
        [{ count: 100 }], // scoredAndReady
        [{ count: 0 }], // unscored
        poorQualityData, // calculateDataQuality sample
      ];
      mockGroupByResults = Array.from({ length: 15 }, (_, i) => ({
        scenarioId: `scenario-${i}`,
        count: 5,
      }));

      const result = await pipeline.checkTrainingReadiness();

      expect(result.ready).toBe(false);
      expect(result.reason).toContain('quality');
      expect(result.stats.dataQuality).toBeLessThan(1.0);
    });
  });

  describe('Model Versioning', () => {
    test('should start at v1.0.0 when no models exist', async () => {
      mockSelectResultsQueue = [[]]; // No models exist

      // Access private method for testing
      const pipelineWithPrivate = asTestAccess(pipeline);
      const version = await pipelineWithPrivate.getNextModelVersion();

      expect(version).toBe('v1.0.0');
    });

    test('should increment patch version', async () => {
      mockSelectResultsQueue = [[{ version: 'v1.0.5' }]];

      // Access private method for testing
      const pipelineWithPrivate = asTestAccess(pipeline);
      const version = await pipelineWithPrivate.getNextModelVersion();

      expect(version).toBe('v1.0.6');
    });

    test('should handle double-digit versions', async () => {
      mockSelectResultsQueue = [[{ version: 'v2.3.99' }]];

      // Access private method for testing
      const pipelineWithPrivate = asTestAccess(pipeline);
      const version = await pipelineWithPrivate.getNextModelVersion();

      expect(version).toBe('v2.3.100');
    });
  });

  describe('Trajectory ID Retrieval', () => {
    test('should retrieve trajectory IDs for training', async () => {
      mockSelectResultsQueue = [
        [
          { trajectoryId: 'traj-1' },
          { trajectoryId: 'traj-2' },
          { trajectoryId: 'traj-3' },
        ],
      ];

      // Access private method for testing
      const pipelineWithPrivate = asTestAccess(pipeline);
      const ids = await pipelineWithPrivate.getTrajectoryIds(3);

      expect(ids).toEqual(['traj-1', 'traj-2', 'traj-3']);
    });

    test('should retrieve all trajectories when no limit', async () => {
      mockSelectResultsQueue = [
        [{ trajectoryId: 'traj-1' }, { trajectoryId: 'traj-2' }],
      ];

      // Access private method for testing
      const ids = await asTestAccess(pipeline).getTrajectoryIds();

      expect(ids).toHaveLength(2);
    });
  });

  describe('Training Monitoring', () => {
    test('should return not_found for non-existent batch', async () => {
      mockSelectResultsQueue = [[]]; // No batch found

      const status = await pipeline.monitorTraining('non-existent');

      expect(status.status).toBe('not_found');
    });

    test('should return training status', async () => {
      mockSelectResultsQueue = [
        [
          {
            batchId: 'batch-1',
            status: 'training',
            error: null,
          },
        ],
      ];

      const status = await pipeline.monitorTraining('batch-1');

      expect(status.status).toBe('training');
      expect(status.progress).toBe(0.5);
      expect(status.eta).toBeDefined();
    });

    test('should return completed status', async () => {
      mockSelectResultsQueue = [
        [
          {
            batchId: 'batch-1',
            status: 'completed',
            error: null,
          },
        ],
      ];

      const status = await pipeline.monitorTraining('batch-1');

      expect(status.status).toBe('completed');
      expect(status.progress).toBe(1.0);
      expect(status.eta).toBeUndefined();
    });
  });

  describe('Status Reporting', () => {
    test('should return comprehensive status', async () => {
      mockSelectResultsQueue = [
        [{ count: 50 }], // last24h
        [{ count: 200 }], // last7d
        [{ completedAt: new Date('2024-01-01T12:00:00Z') }], // lastCompleted batch
        [{ version: 'v1.2.3' }], // latestModel
        [{ count: 5 }], // deployedCount
        [{ count: 2 }], // trainingCount
        [{ count: 1 }], // dbHealthy check
      ];

      const status = await pipeline.getStatus();

      expect(status.dataCollection.last24h).toBe(50);
      expect(status.dataCollection.last7d).toBe(200);
      expect(status.dataCollection.ratePerHour).toBeCloseTo(50 / 24, 1);
      expect(status.models.latest).toBe('v1.2.3');
      expect(status.models.deployed).toBe(5);
      expect(status.models.training).toBe(2);
      expect(status.health.database).toBe(true);
    });

    test('should handle no training history', async () => {
      mockSelectResultsQueue = [
        [{ count: 0 }], // last24h
        [{ count: 0 }], // last7d
        [], // lastCompleted batch (none)
        [], // latestModel (none)
        [{ count: 0 }], // deployedCount
        [{ count: 0 }], // trainingCount
        [{ count: 1 }], // dbHealthy check
      ];

      const status = await pipeline.getStatus();

      expect(status.training.lastCompleted).toBeNull();
      expect(status.models.latest).toBeNull();
      expect(status.dataCollection.last24h).toBe(0);
    });
  });

  describe('Health Checks', () => {
    test('should check database connectivity', async () => {
      mockSelectResultsQueue = [
        [{ count: 1 }], // users count (db connectivity check)
        [{ count: 10 }], // trajectories last hour
      ];

      // Access private method for testing via bracket notation to bypass TypeScript's private check
      const pipelineWithPrivate = asTestAccess(pipeline);
      const runHealthChecks = pipelineWithPrivate['runHealthChecks'];
      if (runHealthChecks) {
        await runHealthChecks();
      }

      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      // Make db.select throw an error on first call (database connectivity check)
      mockDb.select.mockImplementationOnce(() => {
        throw new Error('DB Error');
      });

      // Access private method for testing - call it directly on the pipeline instance
      // Using type assertion to access private method
      const runHealthChecks = (pipeline as never as { runHealthChecks: () => Promise<void> }).runHealthChecks;
      await runHealthChecks.call(pipeline);

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should warn on low data collection rate', async () => {
      // Clear previous calls
      mockLogger.warn.mockClear();
      
      mockSelectResultsQueue = [
        [{ count: 1 }], // users count (db connectivity check)
        [{ count: 0 }], // trajectories last hour (low rate)
      ];

      // Access private method for testing - call it directly on the pipeline instance
      // Using type assertion to access private method
      const runHealthChecks = (pipeline as never as { runHealthChecks: () => Promise<void> }).runHealthChecks;
      await runHealthChecks.call(pipeline);

      // The warning should be logged when trajectoriesLastHour < 1
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnCalls = mockLogger.warn.mock.calls;
      const hasLowDataRateWarning = warnCalls.some(
        (call) => call[0] === 'Low data collection rate'
      );
      expect(hasLowDataRateWarning).toBe(true);
    });
  });
});
