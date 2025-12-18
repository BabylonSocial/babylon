/**
 * NPC Market Decisions Prompt
 *
 * Batch generation of trading decisions for multiple NPCs based on:
 * - Structured Market Data (Price Action, Volume)
 * - Trader Dashboard (PnL, Exposure, Cash)
 * - Private Intel (Group Chat vs Public Feed)
 * - Archetype-based strategy (DEGEN vs RISK_MANAGER)
 */

import { shuffleArray } from '../../utils/randomization';
import { definePrompt } from '../define-prompt';

/**
 * Example trading decisions for the prompt.
 * These are shuffled at render time to add entropy and prevent the model
 * from over-fitting to a fixed order.
 */
interface TradingExample {
  title: string;
  npcId: string;
  npcName: string;
  reasoning: string;
  action: string;
  marketType: string;
  ticker: string;
  marketId: string;
  positionId: string;
  amount: number;
  confidence: number;
}

const TRADING_EXAMPLES: TradingExample[] = [
  {
    title: 'Risk Management (High Exposure)',
    npcId: 'npc-a',
    npcName: 'NPC_A',
    reasoning:
      'Exposure is 65% which exceeds my risk limit. Closing profitable BTC position to rebalance cash.',
    action: 'close_position',
    marketType: 'perp',
    ticker: 'BTC',
    marketId: 'null',
    positionId: 'pos-123',
    amount: 0,
    confidence: 0.9,
  },
  {
    title: 'Insider Trading (Private Intel)',
    npcId: 'npc-b',
    npcName: 'NPC_B',
    reasoning:
      'Private intel in Alpha Group indicates upcoming regulatory crackdown. Shorting COIN despite bullish public sentiment.',
    action: 'open_short',
    marketType: 'perp',
    ticker: 'COIN',
    marketId: 'null',
    positionId: 'null',
    amount: 15000,
    confidence: 0.85,
  },
  {
    title: 'Momentum Trading (Price Action)',
    npcId: 'npc-c',
    npcName: 'NPC_C',
    reasoning:
      'SOL volume up 40% with price breakout. Adding to long position to ride momentum.',
    action: 'open_long',
    marketType: 'perp',
    ticker: 'SOL',
    marketId: 'null',
    positionId: 'null',
    amount: 5000,
    confidence: 0.7,
  },
  {
    title: 'Prediction Market Arbitrage',
    npcId: 'npc-d',
    npcName: 'NPC_D',
    reasoning:
      'Yes price is 35% but true probability based on recent news is >60%. EV+ trade.',
    action: 'buy_yes',
    marketType: 'prediction',
    ticker: 'null',
    marketId: '123456789',
    positionId: 'null',
    amount: 2000,
    confidence: 0.8,
  },
  {
    title: 'Conservative Hold',
    npcId: 'npc-e',
    npcName: 'NPC_E',
    reasoning:
      'Market volatility is too high and I have no edge currently. Preserving capital.',
    action: 'hold',
    marketType: 'null',
    ticker: 'null',
    marketId: 'null',
    positionId: 'null',
    amount: 0,
    confidence: 0.6,
  },
];

/**
 * Formats a single trading example into XML format for the prompt.
 */
function formatExample(example: TradingExample, index: number): string {
  return `Example ${index + 1}: ${example.title}
<decisions>
  <decision>
    <npcId>${example.npcId}</npcId>
    <npcName>${example.npcName}</npcName>
    <reasoning>${example.reasoning}</reasoning>
    <action>${example.action}</action>
    <marketType>${example.marketType}</marketType>
    <ticker>${example.ticker}</ticker>
    <marketId>${example.marketId}</marketId>
    <positionId>${example.positionId}</positionId>
    <amount>${example.amount}</amount>
    <confidence>${example.confidence}</confidence>
  </decision>
</decisions>`;
}

/**
 * Returns shuffled examples text for the NPC market decisions prompt.
 * Call this each time you render the prompt to get a random order.
 *
 * @example
 * ```ts
 * const prompt = renderPrompt(npcMarketDecisions, {
 *   examples: getShuffledExamplesText(),
 *   npcCount: 10,
 *   ...
 * });
 * ```
 */
export function getShuffledExamplesText(): string {
  const shuffled = shuffleArray(TRADING_EXAMPLES);
  return shuffled.map((ex, i) => formatExample(ex, i)).join('\n\n');
}

/**
 * Prompt for generating context-aware trading decisions for NPCs.
 *
 * Simulates trading decisions for multiple NPCs based on their information
 * access (feed posts, group chats), personality, tier, and current market
 * conditions. Considers active questions, events, and narratives when
 * determining positions. Includes full narrative context for informed trading.
 *
 * Returns XML with trading decisions for each NPC including market type,
 * ticker, side, size, and reasoning.
 *
 * @example
 * ```ts
 * const prompt = renderPrompt(npcMarketDecisions, {
 *   examples: getShuffledExamplesText(),
 *   marketTable: '...',
 *   npcsList: '...',
 *   richGameContext: '...'
 * });
 * ```
 */
export const npcMarketDecisions = definePrompt({
  id: 'npc-market-decisions',
  version: '7.0.0',
  category: 'trading',
  description: 'Generate trading decisions with structured financial context',
  temperature: 0.5, // Lower temperature for more analytical reasoning
  maxTokens: 25000,

  template: `{{realityGrounding}}

=== MARKET DATA (Prices, Change, Volume) ===
{{marketTable}}

=== TRADER DASHBOARDS ===
{{npcsList}}

=== COMPLETE NARRATIVE CONTEXT ===
{{richGameContext}}

=== EXAMPLES (Financial Reasoning) ===
{{examples}}

=== RULES ===
1. **Output ONLY XML**: <decisions>... <decision>...</decisions>
2. **Analyze Numbers**: Look at PnL, Exposure %, and Cash.
   - If Exposure > 70%, reduce risk (close/reduce positions).
   - If Cash is high, look for opportunities.
   - If PnL is negative, consider cutting losses.
3. **Information Hierarchy**:
   - **🔒 PRIVATE INTEL**: High value. If an insider says "sell", trust them over public sentiment.
   - **PUBLIC FEED**: High noise. Use for contrarian signals or momentum confirmation.
4. **Archetype Behavior**:
   - **DEGEN_TRADER**: High risk, chases pumps, ignores exposure limits.
   - **RISK_MANAGER**: Conservative, cuts losses early, keeps exposure < 40%.
   - **QUANT_TRADER**: Looks at numbers/arbitrage, ignores vibes.
   - **INSIDER**: Trades on private info before news breaks.
5. **Format**:
   - Use EXACT npcId from dashboard.
   - Use EXACT ticker/marketId from Market Data table.
   - For 'close_position', provide the exact positionId from "Top Pos".

=== GENERATE DECISIONS ===
Generate trading decisions for the traders listed above based on their dashboard data and market context.
`,
});
