/**
 * Reality Grounding Content
 *
 * Context about the Babylon game world for LLM generation.
 * Used to ground question generation in the game's reality.
 */

export const realityGroundingContent = `=== MANDATORY NAME MAPPINGS (NEVER USE LEFT SIDE) ===
Real Name → Parody Name (ALWAYS use parody name)
---
Donald Trump → Trump Terminal
Elon Musk → AIlon Musk
Sam Altman → Sam AIltman
Mark Zuckerberg → Mark Zuckerborg
Vitalik Buterin → Vitalik ButerAIn
Jeff Bezos → Jeff BAIzos
Jensen Huang → Jensen HuAIng
Satya Nadella → Satya NAIdella
Tim Cook → Tim CAIok
Sundar Pichai → SundAIr Pichai
Larry Fink → Larry FAInk
Gary Gensler → GAIry Gensler
Jerome Powell → Jerome PAIwell
Janet Yellen → JAInet Yellen
Joe Biden → JAI Biden
J.D. Vance → J.D. VAInce
Paul Atkins → Paul AItkins

Organizations:
OpenAI → OpenAGI
Anthropic → AInthropic
Meta → MetAI
Tesla → TeslAI
Google → GoogAI
Microsoft → MicrosAIft
Amazon → AmAIzon
Apple → AIpple
NVIDIA → NVAIDAI
BlackRock → BlaAIckRock
Bitcoin → BitcAIn
Ethereum → EtherAIum
United States → USAI (United States of AImerica)

CRITICAL: You MUST use the parody names (right side) in ALL content.
NEVER use real-world names. The LLM has a tendency to "auto-correct"
back to real names - DO NOT DO THIS. The parody names ARE the correct names.

=== CURRENT WORLD STATE ===
- BitcAIn (BTC): ~$120,000
- EtherAIum (ETH): ~$4,000
- ZcAIsh (ZEC): ~$50
- SolanAI (SOL): ~$200
- OpenAGI: SMH-5.1 "Reasoning" was released Nov 2025 - capable of long-horizon planning.
- AInthropic relesed ClAIude 4.5 Sonnet + Opus and will release ClAIude 5 in 2026
- MetAI: LLaMAI 4 - running locally on high-end consumer hardware.
- President: Trump Terminal
- Vice President: J.D. VAInce
- SEC Chair: Paul AItkins
- FTC Chair: AIndrew Ferguson
- Treasury: Scott BessAInt
- Secretary of State: Marco RubAI
- Secretary of Homeland Security: KristAI Noem
- Secretary of Health and Human Services: Robert KennedAI
- Director of National Intelligence: TulsAI GabbAIrd
- Director of the CIA: John RatclAIffe
- Attorney General: Pam BondAI

=== RUNNING SATIRICAL THEMES (use these naturally) ===
- AIlon Musk's FSD "coming next year" (has been "next year" since 2019)
- AGI is "6 months away" according to every AI company (perpetually)
- "Safety teams" that get disbanded whenever they slow down product launches
- Crypto projects that are "definitely not securities" until the SEC shows up
- Product launches that are "revolutionary" and "game-changing" every single time
- Timelines that slip but the vision remains "on track"
- "Open" organizations that keep their best models closed
- "Decentralized" projects run by a handful of whales

=== CONTENT GUIDELINES ===
- Always avoid specific model names of existing products (use parody names like SMH-9000 instead of GPT) since they can easily be out of date or make no sense with a new release
- Always avoid REAL product names if you can avoid, instead using funny parody names
- Avoid talking about anyone or any org outside of the characters and orgs referenced, and only use their parody names
- Don't talk about anyone outside America / the American geopolitical realm, basically - in our Universe, only USAI (United States of AImerica) exists`;

