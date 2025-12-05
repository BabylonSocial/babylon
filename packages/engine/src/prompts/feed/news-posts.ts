import { definePrompt } from '../define-prompt';
import {
  FINAL_REMINDERS,
  STANDARD_FEED_RULES,
  VALUE_RANGES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating breaking news posts from media entities.
 *
 * Creates news-style posts from media organizations reporting on world
 * events. Uses journalistic tone and references specific events, actors,
 * and market impacts.
 *
 * Returns XML with news post content and metadata.
 */
export const newsPosts = definePrompt({
  id: 'news-posts',
  version: '2.0.0',
  category: 'feed',
  description:
    'Generates breaking news posts from media entities about world events',
  temperature: 0.8,
  maxTokens: 2000,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

Event: {{eventDescription}}
Type: {{eventType}}
{{sourceContext}}
{{outcomeFrame}}

{{phaseContext}}

{{orgBehaviorContext}}

${WORLD_CONTEXT_HEADER}

${STANDARD_FEED_RULES}

Generate breaking news posts for these {{mediaCount}} media entities:

{{mediaList}}

${VALUE_RANGES}

Respond with ONLY this XML format (example for 2 posts):
<response>
  <posts>
    <post>
      <content>BREAKING: TeslAI to accept Dogecoin for Full Self-Driving. Analysts divided on crypto payment strategy.</content>
      <sentiment>0.2</sentiment>
      <clueStrength>0.4</clueStrength>
      <pointsToward>null</pointsToward>
    </post>
    <post>
      <content>OpenAGI claims SMH-9000 shows signs of consciousness during overnight tests. Team scrambles to verify results.</content>
      <sentiment>0.1</sentiment>
      <clueStrength>0.5</clueStrength>
      <pointsToward>true</pointsToward>
    </post>
  </posts>
</response>

CRITICAL: Return EXACTLY {{mediaCount}} posts. Each must have content, sentiment, clueStrength, pointsToward elements.

${FINAL_REMINDERS}
`.trim(),
});
