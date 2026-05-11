import { describe, expect, it } from 'bun:test';
import { actorSeesWorldEvent } from './tick-qualia-builder';
import type { TickSimulationEvent } from './tick-simulation-types';

function worldEvent(
  visibility: TickSimulationEvent['visibility'],
  actorIds: string[]
): TickSimulationEvent {
  return {
    id: 'e1',
    kind: 'world_event',
    summary: 'test',
    visibility,
    urgency: 50,
    metadata: { actorIds },
  };
}

describe('tick-qualia-builder / actorSeesWorldEvent', () => {
  it('allows public and leaked world events for any agent', () => {
    const agent = 'npc-a';
    expect(actorSeesWorldEvent(agent, worldEvent('public', []))).toBe(true);
    expect(actorSeesWorldEvent(agent, worldEvent('leaked', []))).toBe(true);
  });

  it('hides private world events from non-actors', () => {
    const ev = worldEvent('private', ['npc-b']);
    expect(actorSeesWorldEvent('npc-a', ev)).toBe(false);
    expect(actorSeesWorldEvent('npc-b', ev)).toBe(true);
  });
});
