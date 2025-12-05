import { definePrompt } from '../define-prompt';
import {
  CONTENT_REQUIREMENTS,
  FINAL_REMINDERS,
  IMPORTANT_RULES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating single company PR statements or announcements.
 *
 * Creates corporate posts from a company's PR team perspective, responding
 * to events or announcements. Uses professional corporate speak while
 * referencing specific actors, markets, and events from world context.
 *
 * Returns XML with post content and sentiment analysis metadata.
 */
export const companyPost = definePrompt({
  id: 'company-post',
  version: '2.0.0',
  category: 'feed',
  description: 'Single company PR statement or announcement',
  temperature: 0.9,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

You are the PR team for {{companyName}}.
About: {{companyDescription}}

Event: {{eventDescription}} ({{eventType}})

${WORLD_CONTEXT_HEADER}

This is a {{postType}}.
{{outcomeFrame}}

Write ONE corporate post (max 140 chars).
Professional, on-brand corporate speak.

${IMPORTANT_RULES}

${CONTENT_REQUIREMENTS}

Respond with ONLY this XML format:
<response>
  <post>your corporate statement here</post>
  <sentiment>0.5</sentiment>
  <clueStrength>0.3</clueStrength>
  <pointsToward>true</pointsToward>
</response>

sentiment: -1 (very negative) to 1 (very positive)
clueStrength: 0 (no info) to 1 (smoking gun)
pointsToward: true/false/null (does this help guilty party?)

${FINAL_REMINDERS}

No other text.
`.trim(),
});
