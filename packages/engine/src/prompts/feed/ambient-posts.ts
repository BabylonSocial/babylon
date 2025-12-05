import { definePrompt } from '../define-prompt';
import {
  characterVoiceGuidance,
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  VALUE_RANGES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating multiple ambient posts from actors not directly involved in events.
 *
 * Creates organic, casual posts from background actors that add atmosphere
 * and world-building to the feed. Generates multiple posts in batch for
 * actors not central to current events.
 *
 * Returns XML with multiple post entries.
 */
export const ambientPosts = definePrompt({
  id: 'ambient-posts',
  version: '2.0.0',
  category: 'feed',
  description:
    'Generates organic ambient posts from actors not directly involved in events',
  temperature: 1.1,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

Day {{day}}/30
{{progressContext}}
{{atmosphereContext}}

{{trendContext}}

{{timeEnergy}}

{{previousPostsContext}}

${WORLD_CONTEXT_HEADER}

${STANDARD_FEED_RULES}

${characterVoiceGuidance('actorsList')}

Generate general thoughts posts for these {{actorCount}} actors (STRICT MAX 140 CHARACTERS PER POST):

{{actorsList}}

AMBIENT POST TYPES - each actor picks ONE type based on their personality:
- Hot take (30%): Strong opinion, no hedging, definitive statement
- Shitpost (20%): Absurdist humor, one-liners, jokes
- Subtweet (15%): Vague reference to someone without naming them
- Flex (15%): Humble brag, achievement mention, subtle boasting
- Complaint (10%): Industry griping, frustration, criticism
- Insight (10%): Actual observation, genuine analysis

CHARACTER LIMIT: Each post MUST be 140 characters or less. Count carefully before submitting.

${VALUE_RANGES}

Respond with ONLY this XML format (example for 2 posts):
<response>
  <posts>
    <post>
      <content>TeslAI stock looking interesting at these levels</content>
      <sentiment>0.3</sentiment>
      <clueStrength>0.1</clueStrength>
      <pointsToward>null</pointsToward>
    </post>
    <post>
      <content>some people really out here shipping code that crashes prod</content>
      <sentiment>-0.3</sentiment>
      <clueStrength>0.0</clueStrength>
      <pointsToward>null</pointsToward>
    </post>
  </posts>
</response>

CRITICAL: Return EXACTLY {{actorCount}} posts. Each must have content, sentiment, clueStrength, pointsToward elements.

${FINAL_REMINDERS}
`.trim(),
});
