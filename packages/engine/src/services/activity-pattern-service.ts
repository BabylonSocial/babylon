/**
 * Activity Pattern Service
 *
 * SIMPLIFIED: Hour-based rotation to spread actors across the day.
 * Each actor is assigned to a "shift" based on their ID hash.
 * Active for 8 hours, rotating through 24 hours.
 * This ensures all 140+ actors get fair coverage without timezone complexity.
 */

/**
 * Minimal actor interface for activity patterns.
 * Compatible with both Actor and StaticActor types.
 */
export interface ActivityActor {
  id: string;
  domain?: string[];
  personality?: string;
}

/**
 * Activity pattern for an NPC (simplified)
 */
export interface ActivityPattern {
  /** IANA timezone string */
  timezone: string;
  /** Hours when most active (0-23) */
  peakHours: number[];
  /** Whether the NPC is active late night */
  nightOwl: boolean;
  /** Whether the NPC posts during typical work hours */
  workaholic: boolean;
  /** Whether the NPC is active on weekends */
  weekendActive: boolean;
}

/**
 * Hours each actor is active per day.
 * 8 hours = 1/3 of actors active at any time = ~47 actors from 140.
 */
const ACTIVE_HOURS_PER_DAY = 8;

/**
 * Simple hash function to get a number from actor ID.
 * Used to deterministically assign actors to time slots.
 */
function hashActorId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get the hours an actor is active based on their ID.
 * Spreads actors evenly across the 24-hour day.
 */
function getActorActiveHours(actorId: string): number[] {
  // Hash ID to get starting hour (0-23)
  const startHour = hashActorId(actorId) % 24;

  // Generate 8 consecutive hours (wrapping around midnight)
  const hours: number[] = [];
  for (let i = 0; i < ACTIVE_HOURS_PER_DAY; i++) {
    hours.push((startHour + i) % 24);
  }
  return hours;
}

/**
 * Convert UTC hour to local hour for a timezone.
 * Kept for API compatibility.
 */
export function convertToLocalHour(
  utcHour: number,
  _timezone: string,
  _date: Date = new Date()
): number {
  return utcHour;
}

/**
 * Derive activity pattern from actor data.
 * Uses actor ID to determine their active hours.
 */
export function deriveActivityPattern(actor: ActivityActor): ActivityPattern {
  return {
    timezone: 'UTC',
    peakHours: getActorActiveHours(actor.id),
    nightOwl: true,
    workaholic: true,
    weekendActive: true,
  };
}

/**
 * Check if an NPC is in their active hours right now.
 * Based on simple hour rotation from actor ID hash.
 */
export function isActiveHour(
  actor: ActivityActor,
  utcHour: number,
  _date: Date = new Date()
): boolean {
  const activeHours = getActorActiveHours(actor.id);
  return activeHours.includes(utcHour);
}

/**
 * Check if today is a weekend.
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Get activity multiplier for an NPC at current time.
 * Returns 1.0 if in active hours, 0.0 otherwise.
 */
export function getActivityMultiplier(
  actor: ActivityActor,
  date: Date = new Date()
): number {
  const utcHour = date.getUTCHours();
  return isActiveHour(actor, utcHour, date) ? 1.0 : 0.0;
}

/**
 * Activity Pattern Service class for dependency injection.
 */
export class ActivityPatternService {
  derivePattern(actor: ActivityActor): ActivityPattern {
    return deriveActivityPattern(actor);
  }

  isActiveHour(actor: ActivityActor, utcHour: number, date?: Date): boolean {
    return isActiveHour(actor, utcHour, date);
  }

  getMultiplier(actor: ActivityActor, date?: Date): number {
    return getActivityMultiplier(actor, date);
  }
}

// Singleton instance
export const activityPatternService = new ActivityPatternService();
