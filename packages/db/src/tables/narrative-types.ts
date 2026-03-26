/** Narrative domain types (no tables). */

export type MarketTimeframe =
  | 'flash' // 15-30 minutes
  | 'intraday' // 1-6 hours
  | 'daily' // 12-48 hours
  | 'weekly' // 3-7 days
  | 'monthly' // 2-4 weeks
  | 'quarterly' // 1-3 months
  | 'longterm'; // 3+ months

/**
 * Market category for thematic grouping
 */
export type MarketCategory =
  | 'tech'
  | 'crypto'
  | 'politics'
  | 'sports'
  | 'business'
  | 'entertainment'
  | 'science'
  | 'general';

/**
 * Arc state types for long-term narrative state machine (30 days)
 */
export type LongTermArcState =
  | 'setup' // Days 1-3: Introduce question
  | 'tension' // Days 4-10: Early signals, misdirection
  | 'escalation' // Days 11-18: Conflicting signals
  | 'crisis' // Days 19-24: Peak uncertainty
  | 'revelation' // Days 25-27: Truth emerges
  | 'resolution'; // Days 28-30: Definitive answer

/**
 * Arc state types for weekly markets (3-7 days)
 */
export type WeeklyArcState =
  | 'setup'
  | 'tension'
  | 'escalation'
  | 'crisis'
  | 'resolution';

/**
 * Arc state types for daily markets (12-48 hours)
 */
export type DailyArcState =
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'resolution';

/**
 * Arc state types for intraday markets (1-6 hours)
 */
export type IntradayArcState = 'setup' | 'active' | 'climax' | 'resolution';

/**
 * Arc state types for flash markets (15-30 minutes)
 */
export type FlashArcState = 'live' | 'resolving';

/**
 * Generic arc state type (union of all)
 */
export type ArcStateType =
  | LongTermArcState
  | WeeklyArcState
  | DailyArcState
  | IntradayArcState
  | FlashArcState;

/**
 * Pending state transition
 */
export interface PendingTransition {
  targetState: ArcStateType;
  triggerDay: number;
  triggerEventType?: string;
  probability?: number;
}

/**
 * Market impact from a structured event
 */
export interface MarketImpact {
  stockTicker: string;
  direction: 'up' | 'down';
  magnitude: 'minor' | 'moderate' | 'major';
  duration: 'instant' | 'hours' | 'days';
}

/**
 * Structured event types for narrative
 */
export type StructuredEventType =
  | 'rumor'
  | 'leak'
  | 'denial'
  | 'confirmation'
  | 'reversal'
  | 'proof';

/**
 * Structured event data stored in events table
 */
export interface StructuredEventData {
  arcId: string;
  type: StructuredEventType;
  severity: 1 | 2 | 3 | 4 | 5;
  affectedActors: string[];
  affectedStocks: string[];
  affectedQuestions: string[];
  signalDirection: 'YES' | 'NO' | 'NEUTRAL';
  signalStrength: number;
  marketImpacts: MarketImpact[];
}

/**
 * Scheduled event for deterministic narrative firing.
 * Events are pre-planned during arc creation and fired at specific times.
 */
export interface ScheduledEvent {
  /** Base day for the event (0-indexed from question creation) */
  baseDay: number;
  /** Hours of jitter from base day (can be negative or positive) */
  jitterHours: number;
  /** Event type determines narrative impact */
  eventType: 'leak' | 'rumor' | 'scandal' | 'confirmation' | 'red_herring';
  /** Brief description for LLM prompt context */
  description: string;
  /** Signal direction this event should suggest */
  signalDirection: 'YES' | 'NO' | 'NEUTRAL';
  /** Whether this event has been fired */
  fired: boolean;
  /** Timestamp when fired (ISO string) */
  firedAt?: string;
}

export interface SubMarketTriggerData {
  eventType: string;
  questionTemplate: string;
  spawnedAt: string;
  parentEventId?: string;
}
