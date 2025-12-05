import { definePrompt } from '../define-prompt';
import {
  CONTENT_REQUIREMENTS,
  FINAL_REMINDERS,
  IMPORTANT_RULES,
  WORLD_CONTEXT_HEADER,
} from '../shared-sections';

/**
 * Prompt for generating stock ticker style posts for price movements.
 *
 * Creates brief, ticker-style posts reporting stock price movements
 * and market updates. Uses concise financial reporting format with
 * specific price and percentage change data.
 *
 * Returns XML with ticker post and price data.
 */
export const stockTicker = definePrompt({
  id: 'stock-ticker',
  version: '2.0.0',
  category: 'feed',
  description: 'Generates stock ticker style posts for price movements',
  temperature: 0.6,
  maxTokens: 200,
  template: `{{realityGrounding}}

The current date is {{currentDate}}. Always act as though it is the current date.

Generate a stock ticker style post for this price movement:

TICKER: {{ticker}}
COMPANY: {{companyName}}
PRICE: \${{currentPrice}}
CHANGE: {{priceChange}}% ({{direction}})
VOLUME: {{volume}}

${WORLD_CONTEXT_HEADER}

Create a brief, professional stock ticker post.

Requirements:
- Concise financial reporting style
- Include key numbers
- Max 150 characters
- Professional but can be subtly satirical

${IMPORTANT_RULES}

${CONTENT_REQUIREMENTS}

Example: "{{ticker}} \${{currentPrice}} {{direction}} {{priceChange}}% on news of [brief event mention]"

Respond with ONLY this XML:
<response>
  <post>Your ticker post here</post>
</response>

${FINAL_REMINDERS}

No other text.
`.trim(),
});
