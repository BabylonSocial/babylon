/**
 * Activity Pattern Service
 *
 * Derives activity patterns (sleep schedules, peak hours) from NPC
 * domain and personality to make posting behavior feel organic.
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
 * Activity pattern for an NPC
 */
export interface ActivityPattern {
  /** IANA timezone string */
  timezone: string;
  /** Hours when most active (0-23 in local time) */
  peakHours: number[];
  /** Whether the NPC is active late night */
  nightOwl: boolean;
  /** Whether the NPC posts during typical work hours */
  workaholic: boolean;
  /** Whether the NPC is active on weekends */
  weekendActive: boolean;
}

/**
 * Default activity pattern for unknown domains
 */
const DEFAULT_PATTERN: ActivityPattern = {
  timezone: 'UTC',
  peakHours: [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21],
  nightOwl: false,
  workaholic: false,
  weekendActive: true,
};

/**
 * Domain-based activity patterns
 * Reflects real-world posting behavior of different industries
 */
const DOMAIN_PATTERNS: Record<string, Partial<ActivityPattern>> = {
  // Tech industry: West coast, work late, very online
  tech: {
    timezone: 'America/Los_Angeles',
    peakHours: [10, 11, 12, 14, 15, 16, 21, 22, 23],
    nightOwl: true,
    workaholic: true,
    weekendActive: true,
  },

  // Finance: East coast, early risers, markets hours
  finance: {
    timezone: 'America/New_York',
    peakHours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    nightOwl: false,
    workaholic: true,
    weekendActive: false,
  },

  // Media/Entertainment: Varied, evening heavy
  media: {
    timezone: 'America/New_York',
    peakHours: [9, 10, 11, 12, 17, 18, 19, 20, 21, 22],
    nightOwl: true,
    workaholic: false,
    weekendActive: true,
  },

  // Crypto: 24/7, UTC, very night owl
  crypto: {
    timezone: 'UTC',
    peakHours: [0, 1, 2, 8, 9, 10, 11, 12, 14, 15, 16, 20, 21, 22, 23],
    nightOwl: true,
    workaholic: true,
    weekendActive: true,
  },

  // Politics: East coast, news cycle driven
  politics: {
    timezone: 'America/New_York',
    peakHours: [7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21],
    nightOwl: false,
    workaholic: true,
    weekendActive: false,
  },

  // AI/Research: Academic hours with late night research
  ai: {
    timezone: 'America/Los_Angeles',
    peakHours: [9, 10, 11, 14, 15, 16, 21, 22, 23, 0],
    nightOwl: true,
    workaholic: true,
    weekendActive: true,
  },

  // Gaming/Entertainment: Evening and night heavy
  gaming: {
    timezone: 'America/Los_Angeles',
    peakHours: [12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 0, 1],
    nightOwl: true,
    workaholic: false,
    weekendActive: true,
  },

  // Sports: Event driven, evening
  sports: {
    timezone: 'America/New_York',
    peakHours: [11, 12, 13, 18, 19, 20, 21, 22, 23],
    nightOwl: true,
    workaholic: false,
    weekendActive: true,
  },

  // Business/Startup: All hours, hustle culture
  business: {
    timezone: 'America/New_York',
    peakHours: [7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 20, 21],
    nightOwl: false,
    workaholic: true,
    weekendActive: true,
  },

  // Science: Academic schedule
  science: {
    timezone: 'America/New_York',
    peakHours: [9, 10, 11, 12, 14, 15, 16, 17],
    nightOwl: false,
    workaholic: true,
    weekendActive: false,
  },
};

/**
 * Get timezone offset in hours for a timezone name.
 * Uses Intl.DateTimeFormat to correctly handle DST.
 *
 * @param timezone IANA timezone string (e.g., 'America/New_York')
 * @param date Date to get offset for (defaults to now)
 * @returns Offset in hours from UTC (negative for west, positive for east)
 */
function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  try {
    // Get UTC and local time strings for comparison
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(
      date.toLocaleString('en-US', { timeZone: timezone })
    );
    // Calculate offset in hours
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    return offsetMs / (1000 * 60 * 60);
  } catch {
    // Invalid timezone, return 0 (UTC)
    return 0;
  }
}

/**
 * Convert UTC hour to local hour for a timezone.
 * Accounts for DST using the provided date.
 *
 * @param utcHour Hour in UTC (0-23)
 * @param timezone IANA timezone string
 * @param date Date to use for DST calculation (defaults to now)
 */
export function convertToLocalHour(
  utcHour: number,
  timezone: string,
  date: Date = new Date()
): number {
  const offset = getTimezoneOffset(timezone, date);
  let localHour = (utcHour + offset) % 24;
  if (localHour < 0) {
    localHour += 24;
  }
  return localHour;
}

/**
 * Derive activity pattern from actor data.
 * Uses domain as primary signal, with personality modifiers.
 */
export function deriveActivityPattern(actor: ActivityActor): ActivityPattern {
  // Get primary domain (first in list)
  const primaryDomain = actor.domain?.[0]?.toLowerCase() ?? 'crypto';

  // Get base pattern from domain
  const domainPattern = DOMAIN_PATTERNS[primaryDomain];
  const basePattern = { ...DEFAULT_PATTERN, ...domainPattern };

  // Apply personality modifiers
  const personality = actor.personality?.toLowerCase() ?? '';

  // Night owl personalities
  if (
    personality.includes('degen') ||
    personality.includes('chaotic') ||
    personality.includes('manic')
  ) {
    basePattern.nightOwl = true;
    // Add late night hours
    if (!basePattern.peakHours.includes(23)) basePattern.peakHours.push(23);
    if (!basePattern.peakHours.includes(0)) basePattern.peakHours.push(0);
    if (!basePattern.peakHours.includes(1)) basePattern.peakHours.push(1);
  }

  // Workaholic personalities
  if (
    personality.includes('ambitious') ||
    personality.includes('driven') ||
    personality.includes('workaholic')
  ) {
    basePattern.workaholic = true;
    basePattern.weekendActive = true;
  }

  // Professional/corporate personalities - more regular hours
  if (
    personality.includes('professional') ||
    personality.includes('corporate') ||
    personality.includes('formal')
  ) {
    basePattern.nightOwl = false;
    basePattern.peakHours = basePattern.peakHours.filter(
      (h) => h >= 8 && h <= 18
    );
  }

  return basePattern;
}

/**
 * Check if an NPC is in their active hours right now.
 *
 * @param actor Actor to check
 * @param utcHour Hour in UTC (0-23)
 * @param date Date to use for DST calculation (defaults to now)
 */
export function isActiveHour(
  actor: ActivityActor,
  utcHour: number,
  date: Date = new Date()
): boolean {
  const pattern = deriveActivityPattern(actor);
  const localHour = convertToLocalHour(utcHour, pattern.timezone, date);
  return pattern.peakHours.includes(localHour);
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
 * Returns 0-1 indicating how likely they are to be active.
 * Correctly handles DST for the given date.
 */
export function getActivityMultiplier(
  actor: ActivityActor,
  date: Date = new Date()
): number {
  const pattern = deriveActivityPattern(actor);
  const utcHour = date.getUTCHours();
  const localHour = convertToLocalHour(utcHour, pattern.timezone, date);

  // Base: Are they in peak hours?
  const inPeakHours = pattern.peakHours.includes(localHour);

  // Weekend modifier
  const weekend = isWeekend(date);
  if (weekend && !pattern.weekendActive) {
    return inPeakHours ? 0.3 : 0.1;
  }

  // Night hours (local 0-6)
  const isNightTime = localHour >= 0 && localHour < 6;
  if (isNightTime && !pattern.nightOwl) {
    return 0.05; // Very unlikely to post
  }

  // Return multiplier
  if (inPeakHours) {
    return 1.0;
  }

  // Adjacent to peak hours
  const adjacentToPeak = pattern.peakHours.some(
    (h) => Math.abs(h - localHour) === 1 || Math.abs(h - localHour) === 23
  );
  if (adjacentToPeak) {
    return 0.5;
  }

  // Off-peak
  return 0.2;
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
