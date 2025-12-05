import { definePrompt } from '../define-prompt';
import {
  characterVoiceGuidance,
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  VALUE_RANGES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating conspiracy theorist takes on world events.
 *
 * Creates satirical conspiracy theory posts from characters who see
 * hidden connections and secret plots in events. Uses conspiratorial
 * tone with wild connections and speculation.
 *
 * Returns XML with conspiracy theory posts and metadata.
 */
export const conspiracy = definePrompt({
  id: 'conspiracy',
  version: '2.0.0',
  category: 'feed',
  description: 'Generates conspiracy theorist takes on world events',
  temperature: 1.1,
  maxTokens: 5000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

Mainstream story: {{eventDescription}}

{{previousPostsContext}}

{{groupContext}}

${WORLD_CONTEXT_HEADER}

${STANDARD_FEED_RULES}

${characterVoiceGuidance('conspiracistsList')}

Generate conspiracy theory posts from these {{conspiracistCount}} contrarians:

{{conspiracistsList}}

${VALUE_RANGES}

Respond with ONLY this XML format (example for 2 conspiracists):
<response>
  <conspiracy>
    <theory>
      <post>Wake up! TeslAI Dogecoin news is a DISTRACTION from what they're really building: mind control cars.</post>
      <sentiment>-0.8</sentiment>
      <clueStrength>0.1</clueStrength>
      <pointsToward>false</pointsToward>
    </theory>
    <theory>
      <post>SMH-9000 'consciousness'? Perfect timing. They want you distracted while they roll out digital IDs.</post>
      <sentiment>-0.9</sentiment>
      <clueStrength>0.05</clueStrength>
      <pointsToward>false</pointsToward>
    </theory>
  </conspiracy>
</response>

CRITICAL: Return EXACTLY {{conspiracistCount}} conspiracy posts. Each must have post, sentiment, clueStrength, pointsToward elements.

${FINAL_REMINDERS}
`.trim(),
});
