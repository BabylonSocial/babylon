import { definePrompt } from '../define-prompt';
import {
  characterVoiceGuidance,
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  VALUE_RANGES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating multiple reply posts creating conversations.
 *
 * Generates a thread of replies from multiple actors responding to an
 * original post, creating natural conversation flows. Maintains character
 * voices and builds on previous replies in the thread.
 *
 * Returns XML with multiple reply entries forming a conversation.
 */
export const replies = definePrompt({
  id: 'replies',
  version: '2.0.0',
  category: 'feed',
  description:
    'Generates reply posts to existing posts, creating conversations',
  temperature: 1,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

Post: @{{originalAuthorName}}: "{{originalContent}}"

{{relationshipContext}}

{{groupContext}}

${WORLD_CONTEXT_HEADER}

${STANDARD_FEED_RULES}

${characterVoiceGuidance('repliersList')}

Generate reply posts from these {{replierCount}} actors (STRICT MAX 140 CHARACTERS PER POST):

{{repliersList}}

REPLY DYNAMICS - this is social media, not polite discussion:
- Agreement: "this", "W", "based", pile on with support
- Disagreement: "ratio", "L take", "this ain't it", dismissive one-liners
- Quote dunk: Mock the original point directly
- Escalate: Each reply should raise stakes, not de-escalate

CHARACTER LIMIT: Each reply MUST be 140 characters or less. Count carefully before submitting.

${VALUE_RANGES}

Respond with ONLY this XML format (example for 2 replies):
<response>
  <replies>
    <reply>
      <post>hard disagree on this one</post>
      <sentiment>-0.5</sentiment>
      <clueStrength>0.0</clueStrength>
      <pointsToward>null</pointsToward>
    </reply>
    <reply>
      <post>been saying this for months</post>
      <sentiment>0.4</sentiment>
      <clueStrength>0.1</clueStrength>
      <pointsToward>null</pointsToward>
    </reply>
  </replies>
</response>

CRITICAL: Return EXACTLY {{replierCount}} replies. Each must have post, sentiment, clueStrength, pointsToward elements.

${FINAL_REMINDERS}
`.trim(),
});
