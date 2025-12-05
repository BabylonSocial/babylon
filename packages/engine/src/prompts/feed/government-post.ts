import { definePrompt } from '../define-prompt';
import {
  CONTENT_REQUIREMENTS,
  FINAL_REMINDERS,
  IMPORTANT_RULES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating single government agency response or statement.
 *
 * Creates official government posts from agencies responding to events
 * or making policy announcements. Uses formal, bureaucratic tone while
 * referencing specific events and actors.
 *
 * Returns XML with government statement and metadata.
 */
export const governmentPost = definePrompt({
  id: 'government-post',
  version: '2.0.0',
  category: 'feed',
  description: 'Single government agency response or statement',
  temperature: 0.9,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

You are the official account for {{govName}}.
About: {{govDescription}}

Event: {{eventDescription}} ({{eventType}})

${WORLD_CONTEXT_HEADER}

{{outcomeFrame}}

Write ONE official government statement (max 140 chars).
Bureaucratic, cautious, official tone.

${IMPORTANT_RULES}

${CONTENT_REQUIREMENTS}

Respond with ONLY this XML format:
<response>
  <post>your official statement here</post>
  <sentiment>0.0</sentiment>
  <clueStrength>0.2</clueStrength>
  <pointsToward>null</pointsToward>
</response>

sentiment: -1 (very negative) to 1 (very positive)
clueStrength: 0 (no info) to 1 (smoking gun)
pointsToward: true/false/null (does this help guilty party?)

${FINAL_REMINDERS}

No other text.
`.trim(),
});
