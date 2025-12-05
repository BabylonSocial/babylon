/**
 * Reality Grounding - Current World State
 *
 * Provides current date, prices, politics, culture, and tech landscape
 * to ground LLM outputs in current reality and prevent outdated predictions.
 *
 * Facts are loaded directly from TypeScript modules for serverless compatibility.
 */

import { realityGroundingContent } from '../data/reality-grounding';
import { worldEventExamplesContent } from '../data/world-event-examples';
import { worldFactsContent } from '../data/world-facts';

/**
 * Get current date and time context for prompts.
 *
 * Returns various formatted date/time strings updated dynamically
 * at generation time. Used to ensure all generated content references
 * the current date correctly.
 *
 * @returns Object containing:
 *   - `dateISO`: ISO 8601 formatted date string
 *   - `dateFull`: Full human-readable date (e.g., "Monday, November 16, 2025")
 *   - `time`: Formatted time (e.g., "3:45 PM")
 *   - `year`: Current year as string
 *   - `month`: Current month name (e.g., "November")
 *   - `day`: Current day of month as string
 */
export function getCurrentDateContext(): {
  dateISO: string;
  dateFull: string;
  time: string;
  year: string;
  month: string;
  day: string;
} {
  const now = new Date();
  return {
    dateISO: now.toISOString(),
    dateFull: now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    year: now.getFullYear().toString(),
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    day: now.getDate().toString(),
  };
}

/**
 * Get world event examples for style and tone context.
 *
 * Returns the world event examples content to provide the LLM with
 * examples of the desired satirical/news style.
 */
export function getWorldEventExamples(): string {
  return `=== WORLD EVENT EXAMPLES (FOR STYLE AND TONE) ===\n\n${worldEventExamplesContent}`;
}

/**
 * Get world facts content.
 *
 * Returns general facts about the game world.
 */
export function getWorldFacts(): string {
  return worldFactsContent;
}

/**
 * Get full reality grounding string.
 *
 * Returns all reality grounding facts formatted with the current date
 * dynamically inserted.
 *
 * @returns Full reality grounding string with current date and all facts
 */
export function getFullRealityGrounding(): string {
  const dateCtx = getCurrentDateContext();

  return `
=== CURRENT DATE: ${dateCtx.dateFull} ===

${realityGroundingContent}
`.trim();
}

/**
 * Simple validation function for reality grounding
 * Checks for common outdated references
 */
export function checkRealityGrounding(text: string): string[] {
  const warnings: string[] = [];

  // Check for outdated years (hardcoded check - could be improved)
  if (text.includes('2023') || text.includes('2024')) {
    warnings.push(
      'Content references outdated year - should reference current year'
    );
  }

  // Check for outdated prices
  if (
    text.includes('Bitcoin') &&
    (text.includes('$30K') || text.includes('$50K'))
  ) {
    warnings.push('Content references outdated Bitcoin prices');
  }

  // Check for wrong president
  if (text.includes('Biden') && text.includes('president')) {
    warnings.push('Content references wrong president');
  }

  return warnings;
}

/**
 * Get a concise reality grounding string for prompts.
 *
 * Returns the full content as it's designed to be injected whole.
 *
 * @returns Concise reality grounding string with current date and key facts
 */
export function getRealityGrounding(): string {
  const dateCtx = getCurrentDateContext();

  return `
=== REALITY GROUNDING (${dateCtx.dateFull}) ===

${realityGroundingContent}

CRITICAL: Ground all predictions in this reality. Use current dates, prices, and leadership.
`.trim();
}

/**
 * Get a minimal reality check string for quick context.
 *
 * Returns a very brief summary of key current facts.
 * Useful when token limits are tight or only basic grounding is needed.
 *
 * @returns Minimal reality grounding string
 */
export function getMinimalRealityGrounding(): string {
  const dateCtx = getCurrentDateContext();
  const lines = realityGroundingContent
    .split('\n')
    .filter((l) => l.trim().length > 0 && !l.startsWith('#'))
    .slice(0, 5);
  const keyFacts = lines.join(' | ');

  return `DATE: ${dateCtx.dateFull} | ${keyFacts}`;
}
