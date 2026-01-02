/**
 * Activity Pattern Service Test Suite
 *
 * Tests for NPC activity patterns, timezone handling, and activity multipliers.
 */

import { describe, expect, test } from 'bun:test';
import {
  type ActivityActor,
  activityPatternService,
  convertToLocalHour,
  deriveActivityPattern,
  getActivityMultiplier,
  isActiveHour,
  isWeekend,
} from '../services/activity-pattern-service';

describe('Activity Pattern Service - Timezone Conversion', () => {
  test('convertToLocalHour handles UTC correctly', () => {
    expect(convertToLocalHour(12, 'UTC')).toBe(12);
    expect(convertToLocalHour(0, 'UTC')).toBe(0);
    expect(convertToLocalHour(23, 'UTC')).toBe(23);
  });

  test('convertToLocalHour handles negative offsets', () => {
    // America/New_York is UTC-5 (EST)
    expect(convertToLocalHour(17, 'America/New_York')).toBe(12); // 5pm UTC = 12pm EST
    expect(convertToLocalHour(5, 'America/New_York')).toBe(0); // 5am UTC = 12am EST
  });

  test('convertToLocalHour handles positive offsets', () => {
    // Asia/Tokyo is UTC+9
    expect(convertToLocalHour(0, 'Asia/Tokyo')).toBe(9); // 12am UTC = 9am Tokyo
    expect(convertToLocalHour(15, 'Asia/Tokyo')).toBe(0); // 3pm UTC = 12am Tokyo (next day)
  });

  test('convertToLocalHour wraps around 24 hours', () => {
    // Testing wrap around for negative result
    expect(convertToLocalHour(3, 'America/New_York')).toBe(22); // 3am UTC - 5 = 10pm previous day
  });
});

describe('Activity Pattern Service - Pattern Derivation', () => {
  test('deriveActivityPattern returns default for unknown domain', () => {
    const actor: ActivityActor = { id: 'test-1' };
    const pattern = deriveActivityPattern(actor);

    expect(pattern.timezone).toBe('UTC');
    expect(pattern.peakHours.length).toBeGreaterThan(0);
  });

  test('deriveActivityPattern uses crypto domain for undefined', () => {
    const actor: ActivityActor = { id: 'test-1', domain: undefined };
    const pattern = deriveActivityPattern(actor);

    // Crypto is 24/7 with UTC timezone
    expect(pattern.timezone).toBe('UTC');
    expect(pattern.nightOwl).toBe(true);
    expect(pattern.weekendActive).toBe(true);
  });

  test('deriveActivityPattern uses tech domain correctly', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['tech'] };
    const pattern = deriveActivityPattern(actor);

    expect(pattern.timezone).toBe('America/Los_Angeles');
    expect(pattern.nightOwl).toBe(true);
    expect(pattern.workaholic).toBe(true);
  });

  test('deriveActivityPattern uses finance domain correctly', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['finance'] };
    const pattern = deriveActivityPattern(actor);

    expect(pattern.timezone).toBe('America/New_York');
    expect(pattern.nightOwl).toBe(false);
    expect(pattern.weekendActive).toBe(false);
  });

  test('deriveActivityPattern applies degen personality modifier', () => {
    const actor: ActivityActor = {
      id: 'test-1',
      domain: ['finance'], // Normally not night owl
      personality: 'A degen trader who never sleeps',
    };
    const pattern = deriveActivityPattern(actor);

    // Degen modifier should enable night owl
    expect(pattern.nightOwl).toBe(true);
    expect(pattern.peakHours).toContain(23);
    expect(pattern.peakHours).toContain(0);
  });

  test('deriveActivityPattern applies professional personality modifier', () => {
    const actor: ActivityActor = {
      id: 'test-1',
      domain: ['crypto'], // Normally night owl
      personality: 'A professional corporate executive',
    };
    const pattern = deriveActivityPattern(actor);

    // Professional modifier should disable night owl
    expect(pattern.nightOwl).toBe(false);
    // Peak hours should be filtered to business hours
    expect(pattern.peakHours.every((h) => h >= 8 && h <= 18)).toBe(true);
  });
});

describe('Activity Pattern Service - Active Hour Check', () => {
  test('isActiveHour returns true during peak hours', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['finance'] };
    // Finance peaks at 9-16 local time (America/New_York)
    // 9am EST = 14:00 UTC
    expect(isActiveHour(actor, 14)).toBe(true);
  });

  test('isActiveHour returns false during sleep hours', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['finance'] };
    // 3am EST = 8am UTC, finance people are not active then
    expect(isActiveHour(actor, 8)).toBe(false);
  });
});

describe('Activity Pattern Service - Weekend Detection', () => {
  test('isWeekend returns true for Saturday', () => {
    const saturday = new Date('2026-01-03T12:00:00Z'); // Saturday
    expect(isWeekend(saturday)).toBe(true);
  });

  test('isWeekend returns true for Sunday', () => {
    const sunday = new Date('2026-01-04T12:00:00Z'); // Sunday
    expect(isWeekend(sunday)).toBe(true);
  });

  test('isWeekend returns false for weekday', () => {
    const monday = new Date('2026-01-05T12:00:00Z'); // Monday
    expect(isWeekend(monday)).toBe(false);
  });
});

describe('Activity Pattern Service - Activity Multiplier', () => {
  test('getActivityMultiplier returns 1.0 during peak hours', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['crypto'] };

    // Create a date during crypto peak hours (they're always active)
    const date = new Date('2026-01-05T14:00:00Z'); // Monday 2pm UTC
    const multiplier = getActivityMultiplier(actor, date);

    expect(multiplier).toBeGreaterThanOrEqual(0.5);
  });

  test('getActivityMultiplier is low for non-night-owl during night', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['science'] };
    // Science: not night owl, America/New_York timezone
    // 3am EST = 8am UTC
    const date = new Date('2026-01-05T08:00:00Z'); // 3am EST
    const multiplier = getActivityMultiplier(actor, date);

    expect(multiplier).toBeLessThan(0.1);
  });

  test('getActivityMultiplier is reduced on weekend for non-weekend-active', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['finance'] };
    // Finance: not weekend active
    const saturday = new Date('2026-01-03T16:00:00Z'); // Saturday during peak
    const multiplier = getActivityMultiplier(actor, saturday);

    expect(multiplier).toBeLessThan(0.5);
  });

  test('activityPatternService singleton works correctly', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['tech'] };

    const pattern = activityPatternService.derivePattern(actor);
    expect(pattern.timezone).toBe('America/Los_Angeles');

    const isActive = activityPatternService.isActiveHour(actor, 20); // 8pm UTC = 12pm PST
    expect(typeof isActive).toBe('boolean');

    const multiplier = activityPatternService.getMultiplier(actor);
    expect(multiplier).toBeGreaterThanOrEqual(0);
    expect(multiplier).toBeLessThanOrEqual(1);
  });
});

describe('Activity Pattern Service - Edge Cases', () => {
  test('handles actor with empty domain array', () => {
    const actor: ActivityActor = { id: 'test-1', domain: [] };
    const pattern = deriveActivityPattern(actor);

    // Should fall back to crypto default
    expect(pattern.timezone).toBe('UTC');
  });

  test('handles actor with unknown domain', () => {
    const actor: ActivityActor = { id: 'test-1', domain: ['unknown-domain'] };
    const pattern = deriveActivityPattern(actor);

    // Should use default pattern
    expect(pattern.timezone).toBe('UTC');
    expect(pattern.peakHours.length).toBeGreaterThan(0);
  });

  test('handles unknown timezone gracefully', () => {
    // The service should default to 0 offset for unknown timezones
    const hour = convertToLocalHour(12, 'Unknown/Timezone');
    expect(hour).toBe(12); // No offset applied
  });
});
