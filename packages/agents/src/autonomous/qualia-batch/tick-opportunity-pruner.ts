import type {
  AgentQualiaRow,
  PrunedOpportunity,
  TickSimulationEvent,
} from './tick-simulation-types';

function eventById(
  events: TickSimulationEvent[]
): Map<string, TickSimulationEvent> {
  return new Map(events.map((e) => [e.id, e]));
}

/**
 * Deterministic agent × event scoring and global cap on opportunities sent to the planner.
 */
export function pruneAgentEventOpportunities(params: {
  qualia: AgentQualiaRow[];
  events: TickSimulationEvent[];
  maxOpportunities: number;
}): PrunedOpportunity[] {
  const { qualia, events, maxOpportunities } = params;
  const byId = eventById(events);
  const pairs: PrunedOpportunity[] = [];

  for (const row of qualia) {
    for (const eventId of row.perceivedEventIds) {
      const ev = byId.get(eventId);
      if (!ev) {
        continue;
      }

      let score = ev.urgency;
      if (ev.kind === 'market_move') {
        score += 5;
      }
      if (ev.kind === 'post') {
        const author = ev.metadata.actorIds?.[0];
        if (author === row.agentId) {
          score += 12;
        } else {
          score += 3;
        }
      }
      if (ev.kind === 'world_event') {
        const actors = ev.metadata.actorIds ?? [];
        if (actors.includes(row.agentId)) {
          score += 18;
        }
      }

      // Stable tie-break using string hash
      const tie =
        (row.agentId.codePointAt(0) ?? 0) + (eventId.codePointAt(0) ?? 0);
      score += (tie % 7) * 0.01;

      pairs.push({ agentId: row.agentId, eventId, score });
    }
  }

  pairs.sort((a, b) => b.score - a.score);
  return pairs.slice(0, maxOpportunities);
}
