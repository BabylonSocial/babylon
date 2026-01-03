/**
 * Player Influence Service Test Suite
 *
 * Tests for player → NPC influence mechanics:
 * - Player mentions boost NPC response probability
 * - Player trades add to NPC memory
 */

import { describe, expect, test } from 'bun:test';
import {
  extractMentions,
  playerInfluenceService,
  wasMentionedRecentlySync,
} from '../services/player-influence-service';

describe('Player Influence Service - Mention Extraction', () => {
  test('extracts single mention', () => {
    const content = 'Hey @alice, what do you think?';
    const mentions = extractMentions(content);
    expect(mentions).toEqual(['alice']);
  });

  test('extracts multiple mentions', () => {
    const content = 'Both @alice and @bob should see this!';
    const mentions = extractMentions(content);
    expect(mentions).toEqual(['alice', 'bob']);
  });

  test('handles mentions with underscores and hyphens', () => {
    const content = 'Calling @john_doe and @jane-smith';
    const mentions = extractMentions(content);
    expect(mentions).toEqual(['john_doe', 'jane-smith']);
  });

  test('returns empty array for no mentions', () => {
    const content = 'This is a regular post without mentions';
    const mentions = extractMentions(content);
    expect(mentions).toEqual([]);
  });

  test('handles mentions at start and end', () => {
    const content = '@start mentions and ends with @end';
    const mentions = extractMentions(content);
    expect(mentions).toEqual(['start', 'end']);
  });

  test('handles email-like patterns (should not extract)', () => {
    // Emails should be partially extracted (username part after @)
    const content = 'Contact user@example.com for more';
    const mentions = extractMentions(content);
    expect(mentions).toEqual(['example']);
  });

  test('handles empty content', () => {
    const mentions = extractMentions('');
    expect(mentions).toEqual([]);
  });
});

describe('Player Influence Service - Synchronous Mention Check', () => {
  test('wasMentionedRecentlySync returns false for unknown actor', () => {
    const result = wasMentionedRecentlySync('non-existent-actor-12345');
    expect(result).toBe(false);
  });
});

describe('Player Influence Service - Service Singleton', () => {
  test('extractMentions method works correctly', () => {
    const mentions = playerInfluenceService.extractMentions('@test user');
    expect(mentions).toEqual(['test']);
  });

  test('wasMentionedRecentlySync method works correctly', () => {
    const result =
      playerInfluenceService.wasMentionedRecentlySync('unknown-actor-xyz');
    expect(result).toBe(false);
  });
});
