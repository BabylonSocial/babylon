/**
 * NPC Memory Service Test Suite
 *
 * Tests for NPC memory management:
 * - Memory formatting for prompts
 * - Time ago formatting
 */

import { describe, expect, test } from 'bun:test';
import type { NpcMemory } from '@babylon/db';
import { npcMemoryService } from '../services/npc-memory-service';

describe('NPC Memory Service - Format Memories For Prompt', () => {
  test('returns empty string for empty memories', () => {
    const formatted = npcMemoryService.formatMemoriesForPrompt([]);
    expect(formatted).toBe('');
  });

  test('formats single memory correctly', () => {
    const memory: NpcMemory = {
      id: 'mem-1',
      type: 'posted',
      timestamp: new Date().toISOString(),
      summary: 'Posted about crypto news',
      sentiment: 0.5,
    };

    const formatted = npcMemoryService.formatMemoriesForPrompt([memory]);
    expect(formatted).toContain('## Recent Memories');
    expect(formatted).toContain('Posted about crypto news');
    expect(formatted).toContain('just now');
  });

  test('formats multiple memories correctly', () => {
    const memories: NpcMemory[] = [
      {
        id: 'mem-1',
        type: 'posted',
        timestamp: new Date().toISOString(),
        summary: 'Posted about crypto news',
        sentiment: 0.5,
      },
      {
        id: 'mem-2',
        type: 'replied_to',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        summary: 'Replied to a comment about trading',
        sentiment: 0.3,
      },
    ];

    const formatted = npcMemoryService.formatMemoriesForPrompt(memories);
    expect(formatted).toContain('## Recent Memories');
    expect(formatted).toContain('Posted about crypto news');
    expect(formatted).toContain('Replied to a comment about trading');
  });

  test('formats time ago for minutes', () => {
    const memory: NpcMemory = {
      id: 'mem-1',
      type: 'posted',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
      summary: 'Test memory',
      sentiment: 0,
    };

    const formatted = npcMemoryService.formatMemoriesForPrompt([memory]);
    expect(formatted).toContain('15m ago');
  });

  test('formats time ago for hours', () => {
    const memory: NpcMemory = {
      id: 'mem-1',
      type: 'posted',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      summary: 'Test memory',
      sentiment: 0,
    };

    const formatted = npcMemoryService.formatMemoriesForPrompt([memory]);
    expect(formatted).toContain('3h ago');
  });

  test('formats time ago for days', () => {
    const memory: NpcMemory = {
      id: 'mem-1',
      type: 'posted',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      summary: 'Test memory',
      sentiment: 0,
    };

    const formatted = npcMemoryService.formatMemoriesForPrompt([memory]);
    expect(formatted).toContain('2d ago');
  });
});
