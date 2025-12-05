import { definePrompt } from '../define-prompt';
import {
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating individual reply posts to existing content.
 *
 * Creates a single reply from an actor responding to another actor's post.
 * Maintains character voice and references the original content while
 * adding new perspective or commentary.
 *
 * Returns XML with reply content and metadata.
 */
export const reply = definePrompt({
  id: 'reply',
  version: '2.0.0',
  category: 'feed',
  description: 'Generates individual reply posts to existing content',
  temperature: 0.9,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

You are: {{actorName}}, {{actorDescription}}
{{emotionalContext}}
Original post by {{originalAuthorName}}: "{{originalContent}}"

${WORLD_CONTEXT_HEADER}

Write a reply (max 140 chars) responding to this post.

${STANDARD_FEED_RULES}

{{relationshipContext}}

Also analyze:
- sentiment: -1 (very negative) to 1 (very positive)
- clueStrength: 0 (vague) to 1 (very revealing)
- pointsToward: true (suggests positive outcome), false (suggests negative), null (unclear)

Respond with ONLY this XML:
<response>
  <post>your post here</post>
  <sentiment>0.3</sentiment>
  <clueStrength>0.5</clueStrength>
  <pointsToward>true</pointsToward>
</response>

${FINAL_REMINDERS}

No other text.
`.trim(),
});
