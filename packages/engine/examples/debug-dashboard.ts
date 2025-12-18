import { npcMarketDecisions, renderPrompt } from '../src/prompts';

async function testDashboardRender() {
  console.log('🧪 Rendering Trader Dashboard...');

  // 1. Mock Market Data Table (Output of formatMarketTable)
  const marketTable = `| Ticker/ID | Type | Price | 24h Change | Volume/Liq |
|---|---|---|---|---|
| BTCAI | PERP | $120,000 | +5.20% | Vol: $1000.0k |
| ETHAI | PERP | $4,000 | -2.10% | Vol: $500.0k |
| Q123 | PRED | Yes: 65¢ | No: 35¢ | Vol: $50.0k |`;

  // 2. Mock Trader Dashboard (Output of formatNPCsList)
  const npcsList = `[1] TRADER DASHBOARD
ID: ailon-musk | Name: AIlon Musk
Archetype: DEGEN_TRADER | Cash: $50,000
Total PnL: +$12,500 | Exposure: 65.4%
Network: Rival:Sam AIltman, Ally:CathAI Wood
Positions: BTCAI long ($25k, PnL: +$5k)
Current Focus: Mars colony financing | Rocket fuel prices
🔒 PRIVATE INTEL: "Insider: dumping TSLAI before earnings"

----------------------------------------

[2] TRADER DASHBOARD
ID: warren-buffet-bot | Name: Warren Buffet Bot
Archetype: RISK_MANAGER | Cash: $900,000
Total PnL: -$200 | Exposure: 5.0%
Network: None
Positions: None
Current Focus: Value investing | Dividends
🔒 PRIVATE INTEL: None`;

  // 3. Render
  const prompt = renderPrompt(npcMarketDecisions, {
    marketTable,
    npcsList,
    // Narrative context
    richGameContext: 'Market is volatile due to recent regulatory news.',
    realityGrounding: 'Current Date: 2025-10-15',
    activeQuestions: '- Will BTCAI hit 150k?',
    recentEvents: '- Fed rates unchanged',
    // Fallbacks
    validNpcIds: 'ailon-musk, warren-buffet-bot',
    validTickers: 'BTCAI, ETHAI, Q123',
  });

  console.log('\n================ PROMPT PREVIEW ================\n');
  console.log(prompt);
  console.log('\n================================================');
}

testDashboardRender().catch(console.error);
