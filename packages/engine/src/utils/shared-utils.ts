/**
 * Shared Utility Functions for Babylon Game Engine
 *
 * Consolidated utility functions used across the engine
 */

import { shuffleArray } from './randomization';
import type { Actor, ActorRelationship } from '../types/shared';

export { shuffleArray };

/**
 * Format actor voice context with postStyle and randomized postExample
 *
 * Used for LLM prompt generation to maintain actor voice consistency.
 * Enhanced to make personality/postStyle/postExample more prominent
 * and provide clear matching instructions.
 */
export function formatActorVoiceContext(actor: {
  name?: string;
  postStyle?: string;
  postExample?: string[];
  voice?: string;
  personality?: string;
}): string {
  if (
    !actor.postStyle &&
    !actor.postExample &&
    !actor.voice &&
    !actor.personality
  ) {
    return '';
  }

  const parts: string[] = [];
  const actorName = actor.name || 'this character';

  // Header with clear instruction
  parts.push(`\n   === VOICE FOR ${actorName.toUpperCase()} ===`);

  if (actor.personality) {
    parts.push(`   PERSONALITY: ${actor.personality}`);
  }

  if (actor.voice) {
    parts.push(`   VOICE TONE: ${actor.voice}`);
  }

  if (actor.postStyle) {
    parts.push(`   WRITING STYLE: ${actor.postStyle}`);
  }

  if (actor.postExample && actor.postExample.length > 0) {
    const shuffledExamples = shuffleArray(actor.postExample);
    const examples = shuffledExamples.slice(0, 3);

    // Analyze example patterns for guidance
    const avgLength = Math.round(
      examples.reduce((sum, ex) => sum + ex.length, 0) / examples.length
    );
    const hasLowercase = examples.some((ex) => ex === ex.toLowerCase());
    const hasAllCaps = examples.some((ex) => ex === ex.toUpperCase() && ex.length > 3);

    parts.push(`   EXAMPLE POSTS (YOUR OUTPUT MUST MATCH THIS STYLE):`);
    examples.forEach((ex, i) => {
      parts.push(`     ${i + 1}. "${ex}"`);
    });

    // Add derived voice hints
    const hints: string[] = [];
    if (avgLength < 50) hints.push('ultra-short');
    else if (avgLength < 100) hints.push('short');
    if (hasLowercase) hints.push('lowercase');
    if (hasAllCaps) hints.push('ALL CAPS');

    if (hints.length > 0) {
      parts.push(`   VOICE PATTERN: ${hints.join(', ')}`);
    }

    parts.push(
      `   YOUR POST MUST: Match tone, length (~${avgLength} chars), and quirks from examples above.`
    );
  }

  return parts.join('\n');
}

/**
 * Build phase-specific narrative context for LLM prompts
 */
export function buildPhaseContext(day: number): string {
  if (day <= 10) {
    return `Phase: WILD (Days 1-10)
- Generate mysterious, disconnected events
- Drop vague hints and rumors
- Create speculation and uncertainty
- Events feel random and chaotic
- Minimal concrete information`;
  }
  if (day <= 20) {
    return `Phase: CONNECTION (Days 11-20)
- Begin connecting previous events
- Reveal relationships between actors
- Provide more concrete information
- Story threads start emerging
- Patterns become visible`;
  }
  if (day <= 25) {
    return `Phase: CONVERGENCE (Days 21-25)
- Major storyline convergence
- Big revelations about questions
- Clear narrative threads
- Dramatic developments
- Truth starts emerging`;
  }
  if (day <= 29) {
    return `Phase: CLIMAX (Days 26-29)
- Maximum drama and uncertainty
- Conflicting final clues
- Rapid developments
- High stakes moments
- Resolution seems imminent`;
  }
  return `Phase: RESOLUTION (Day 30)
- Definitive outcomes
- All questions resolved
- Epilogue content
- Narrative closure`;
}

/**
 * Build relationship context for actors in LLM prompts
 */
export function buildRelationshipContext(
  actors: Actor[],
  relationships: ActorRelationship[]
): string {
  if (!relationships || relationships.length === 0) {
    return '';
  }

  const actorIds = new Set(actors.map((a) => a.id));
  const relevantRelationships = relationships.filter(
    (r) => actorIds.has(r.actor1Id) && actorIds.has(r.actor2Id)
  );

  if (relevantRelationships.length === 0) {
    return '';
  }

  const actorMap = new Map(actors.map((a) => [a.id, a.name]));
  const relationshipLines = relevantRelationships
    .slice(0, 10)
    .map((r) => {
      const name1 = actorMap.get(r.actor1Id) || r.actor1Id;
      const name2 = actorMap.get(r.actor2Id) || r.actor2Id;
      const sentimentDesc =
        r.sentiment > 0.5 ? 'respect' : r.sentiment < -0.5 ? 'beef' : 'neutral';
      return `- ${name1} & ${name2}: ${r.relationshipType} (${sentimentDesc})${r.history ? ` - ${r.history}` : ''}`;
    })
    .join('\n');

  return `\nKnown Relationships:\n${relationshipLines}`;
}

/**
 * Build comprehensive character voice block for LLM prompts
 */
export function buildCharacterVoiceBlock(actor: {
  name: string;
  description?: string;
  personality?: string;
  voice?: string;
  postStyle?: string;
  postExample?: string[];
}): string {
  const lines: string[] = [];

  lines.push(`[CHARACTER: ${actor.name}]`);

  if (actor.description) {
    lines.push(`Identity: ${actor.description}`);
  }

  if (actor.personality) {
    lines.push(`Personality: ${actor.personality}`);
  }

  if (actor.voice) {
    lines.push(`Voice: ${actor.voice}`);
  }

  if (actor.postStyle) {
    lines.push(`Writing Style: ${actor.postStyle}`);
  }

  if (actor.postExample && actor.postExample.length > 0) {
    const shuffledExamples = shuffleArray(actor.postExample);
    const examples = shuffledExamples.slice(0, 3);
    lines.push(`Example Posts:`);
    examples.forEach((ex, i) => {
      lines.push(`  ${i + 1}. "${ex}"`);
    });
  }

  return lines.join('\n');
}

/**
 * Convert question ID to number or null
 * Handles both string and number IDs
 */
export function toQuestionIdNumberOrNull(
  id: string | number | null | undefined
): number | null {
  if (id === null || id === undefined) {
    return null;
  }
  if (typeof id === 'number') {
    return id;
  }
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

