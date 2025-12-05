import { definePrompt } from '../define-prompt';
import {
  characterVoiceGuidance,
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  VALUE_RANGES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating expert commentary and analysis on world events.
 *
 * Creates analytical posts from experts providing commentary on events,
 * market movements, or policy changes. Uses informed, analytical tone
 * with specific references to events and their implications.
 *
 * Returns XML with expert commentary and metadata.
 */
export const commentary = definePrompt({
  id: 'commentary',
  version: '2.0.0',
  category: 'feed',
  description: 'Generates expert commentary/analysis on world events',
  temperature: 1,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

News: {{eventDescription}}

{{previousPostsContext}}

{{groupContext}}

${WORLD_CONTEXT_HEADER}

${STANDARD_FEED_RULES}

${characterVoiceGuidance('commentatorsList')}

Generate expert analysis posts from these {{commentatorCount}} commentators (STRICT MAX 140 CHARACTERS PER POST):

{{commentatorsList}}

CHARACTER LIMIT: Each commentary MUST be 140 characters or less. Count carefully before submitting.

${VALUE_RANGES}

Respond with ONLY this XML format (example for 2 commentators):
<response>
  <commentary>
    <comment>
      <post>Interesting move by @ailonmusk and TeslAI. The "Will TeslAI accept Dogecoin?" market is surging - betting big on meme coin integration.</post>
      <sentiment>0.1</sentiment>
      <clueStrength>0.3</clueStrength>
      <pointsToward>null</pointsToward>
    </comment>
    <comment>
      <post>OpenAGI's SMH-9000 consciousness claims from @samailtman again. Same pattern: hype cycles followed by reality checks. Still no AGI breakthrough.</post>
      <sentiment>-0.2</sentiment>
      <clueStrength>0.5</clueStrength>
      <pointsToward>false</pointsToward>
    </comment>
  </commentary>
</response>

CRITICAL: Return EXACTLY {{commentatorCount}} commentary posts. Each must have post, sentiment, clueStrength, pointsToward elements.

${FINAL_REMINDERS}
`.trim(),
});
