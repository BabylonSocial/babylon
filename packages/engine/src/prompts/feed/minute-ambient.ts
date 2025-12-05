import { definePrompt } from '../define-prompt';
import {
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating real-time ambient posts for continuous minute-level generation.
 *
 * Creates short, casual ambient posts optimized for frequent generation
 * (every minute). Provides continuous atmosphere and world-building
 * without major event context.
 *
 * Returns XML with brief ambient post.
 */
export const minuteAmbient = definePrompt({
  id: 'minute-ambient',
  version: '2.0.0',
  category: 'feed',
  description:
    'Generates real-time ambient posts for continuous minute-level generation',
  temperature: 1,
  maxTokens: 300,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

You are: {{actorName}}, {{actorDescription}}
{{emotionalContext}}
Current time: {{currentTime}}
{{atmosphereContext}}

${WORLD_CONTEXT_HEADER}

Generate a brief thought or observation for this moment.

Requirements:
- Short, spontaneous content
- Can be about current activities, thoughts, or observations
- Not tied to major events (ambient content)
- Max 200 characters
- Stay in character
- Natural social media tone

${STANDARD_FEED_RULES}

Also analyze:
- sentiment: -1 (very negative) to 1 (very positive)
- energy: 0 (calm) to 1 (excited)

Respond with ONLY this XML:
<response>
  <post>your brief post here</post>
  <sentiment>0.3</sentiment>
  <energy>0.5</energy>
</response>

${FINAL_REMINDERS}

No other text.
`.trim(),
});
