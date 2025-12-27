# Market-Engine Architecture

> **BAB-5: Connecting Markets to Game Generation Engine**
>
> This document describes how prediction markets integrate with the game generation engine in Babylon.

## Overview

The Market-Engine integration ensures that:

1. **Questions create markets** - When a prediction question is generated, a corresponding market is created immediately
2. **Events inform markets** - World events with `pointsToward` signals affect market context for NPC trading
3. **Resolution is atomic** - Market and question resolution happen together in a transaction
4. **Metrics drive generation** - Market volatility, activity, and trends inform question generation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GAME GENERATION ENGINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│  │ QuestionManager  │────▶│  Market Creation │────▶│  On-Chain Sync   │   │
│  │                  │     │ ensureMarketExists│     │ ensureMarketOnChain│  │
│  └────────┬─────────┘     └──────────────────┘     └──────────────────┘   │
│           │                                                                 │
│           │ uses                                                            │
│           ▼                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│  │MarketMetricsService│   │EventMarketLinker│     │ SignalExtraction │   │
│  │   (BAB-5 New)    │◀───│   (BAB-5 New)    │◀───│    Service       │   │
│  └──────────────────┘     └────────┬─────────┘     └──────────────────┘   │
│           │                        │                                        │
│           │ metrics                │ signals                                │
│           ▼                        ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     MarketDecisionEngine                            │   │
│  │  • Receives market metrics context                                  │   │
│  │  • Receives event-market signals                                    │   │
│  │  • Generates NPC trading decisions                                  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              GAME TICK FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. executeGameTick()                                                       │
│     ├── Generate content (posts, articles, events)                         │
│     ├── Generate questions via QuestionManager                             │
│     │   └── ensureMarketExists() creates market immediately                │
│     ├── Process NPC trading via MarketDecisionEngine                       │
│     │   ├── getCachedEventMarketSignals() (BAB-5)                         │
│     │   └── Uses market metrics for context                                │
│     └── Resolve questions via resolveQuestionPayouts()                     │
│         └── CorePredictionMarketService.resolve() in transaction           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. QuestionManager (`packages/engine/src/QuestionManager.ts`)

**Responsibilities:**
- Generate prediction market questions based on game context
- Ensure markets exist for new questions
- Resolve questions and trigger market resolution

**Key Methods:**
- `generateQuestionsForContinuousGame()` - Creates questions with metrics-based context
- `ensureMarketExists()` - Calls CorePredictionMarketService to create market

**BAB-5 Enhancement:**
- Now includes `MarketMetricsService.gatherMetrics()` in context gathering
- Prompt includes volatile markets, trending stocks, active markets

### 2. MarketMetricsService (`packages/engine/src/services/market-metrics-service.ts`)

**Purpose:** Provide quantitative metrics for question generation

**Metrics Gathered:**
- `volatilePredictions` - Markets with high price movement
- `activePredictions` - Markets with many positions
- `trendingPerps` - Company stocks with significant price changes
- `extremeProbabilities` - Markets near 0% or 100%

**Output:** Formatted `promptContext` string for LLM prompts

### 3. EventMarketLinkerService (`packages/engine/src/services/event-market-linker.ts`)

**Purpose:** Connect world events to prediction markets

**Key Concepts:**
- `EventMarketImpact` - Single event's expected impact on a market
- `MarketEventSummary` - Aggregated impacts for a market

**Data Flow:**
```
WorldEvent (with relatedQuestion, pointsToward)
    ↓
EventMarketLinkerService.getMarketEventSummaries()
    ↓
formatForTradingContext()
    ↓
NPC Trading Prompt (eventMarketSignals field)
```

### 4. MarketDecisionEngine (`packages/engine/src/MarketDecisionEngine.ts`)

**Purpose:** Generate trading decisions for NPCs

**BAB-5 Enhancement:**
- New cache: `eventMarketSignalsCache`
- New method: `getCachedEventMarketSignals()`
- Prompt now includes `{{eventMarketSignals}}` placeholder

### 5. CorePredictionMarketService (`packages/core/markets/prediction/PredictionMarketService.ts`)

**Purpose:** Core market operations (buy, sell, resolve)

**Key Methods:**
- `ensureMarketExists()` - Idempotent market creation from question
- `resolve()` - Settle positions, credit wallets, emit events

## Data Flow: Question → Market → Resolution

### 1. Question Creation

```typescript
// In QuestionManager.generateQuestionsForContinuousGame()

// 1. Generate question via LLM
const question = await this.generateQuestion(context);

// 2. Insert into DB
await db.insert(questions).values(questionData);

// 3. Create market immediately (BAB-5)
const market = await marketService.ensureMarketExists({
  marketId: question.id,
  initialLiquidity: 20000,
  description: questionData.resolutionCriteria,
});

// 4. Sync to on-chain (optional)
if (!market.onChainMarketId) {
  await ensureMarketOnChain(market.id);
}
```

### 2. Event Impact on Markets

```typescript
// World events are created with relatedQuestion
await db.insert(worldEvents).values({
  id: eventId,
  eventType: 'announcement',
  description: 'Positive development...',
  relatedQuestion: questionNumber,
  pointsToward: 'YES',  // or 'NO'
  sentimentSignal: 0.7,
  signalClarity: 0.8,
});

// EventMarketLinkerService aggregates these
const summaries = await EventMarketLinkerService.getMarketEventSummaries(24);
// => [{
//   marketId: '...',
//   questionText: '...',
//   aggregatedImpact: 0.12,  // +12% towards YES
//   netDirection: 'YES',
//   tradingRelevant: true,
// }]
```

### 3. Resolution Flow

```typescript
// In game-tick.ts resolveQuestionPayouts()

await db.transaction(async (tx) => {
  const coreService = new CorePredictionMarketService({
    db: new CorePredictionDbAdapter(tx),
    wallet: { /* credit/debit handlers */ },
  });

  // 1. Resolve market (settles positions, credits winners)
  await coreService.resolve({
    marketId,
    winningSide: question.outcome ? 'yes' : 'no',
    resolutionDescription: question.resolutionDescription,
  });

  // 2. Update question status
  await tx.update(questions).set({
    status: 'resolved',
    resolvedOutcome: question.outcome,
  }).where(eq(questions.id, question.id));
});
```

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `questions` | Prediction question definitions |
| `markets` | Market state (shares, liquidity, resolved) |
| `positions` | User positions in markets |
| `worldEvents` | Game events with `relatedQuestion`, `pointsToward` |
| `predictionPriceHistories` | Price snapshots for volatility calculation |

### ID Relationship

**Critical:** `market.id === question.id`

This 1:1 relationship ensures:
- Resolution can atomically update both
- Lookups are efficient
- No orphan markets or questions

## Testing

Integration tests are in:
- `packages/testing/integration/market-engine-integration.test.ts`

Tests cover:
1. Market creation via `ensureMarketExists()`
2. ID relationship preservation
3. Event-market coherence
4. Atomic resolution flow
5. Double resolution prevention

## Future Considerations

### TEE Integration (On-Chain)
- Markets can be synced on-chain via `ensureMarketOnChain()`
- Resolution can trigger on-chain settlement
- `onChainMarketId` and `onChainResolutionTxHash` track status

### Metrics-Based Generation
- Current: Market metrics inform question generation context
- Future: Could weight question topics based on underactive market areas

### Event Causality
- Current: Events have `pointsToward` signal
- Future: Could model event chains and predict cascading effects

