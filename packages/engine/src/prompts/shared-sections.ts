/**
 * Shared Prompt Sections
 *
 * Common text blocks used across multiple prompt templates.
 * Centralizes repeated content for consistency and maintainability.
 */

/**
 * Standard rules for all feed posts.
 * Enforces parody name usage and formatting guidelines.
 */
export const IMPORTANT_RULES = `IMPORTANT RULES:
- NO HASHTAGS OR EMOJIS IN POSTS
- NEVER use real-world person or organization names
- ALWAYS use ONLY the parody names from World Actors list (e.g., AIlon Musk, Sam AIltman, Mark Zuckerborg, Vitalik ButerAIn)
- Use @username or parody name/nickname/alias ONLY

=== NAME USAGE EXAMPLES (WRONG vs RIGHT) ===
WRONG: "Elon Musk announced a new Tesla feature..."
RIGHT: "AIlon Musk announced a new TeslAI feature..."

WRONG: "Sam Altman's OpenAI released GPT-5..."
RIGHT: "Sam AIltman's OpenAGI released SMH-9000..."

WRONG: "Trump said Bitcoin will reach $200k..."
RIGHT: "Trump Terminal said BitcAIn will reach $200k..."

WRONG: "Mark Zuckerberg's Meta is working on AI..."
RIGHT: "Mark Zuckerborg's MetAI is working on AI..."

DO NOT "auto-correct" parody names back to real names. The parody names ARE correct.`;

/**
 * Standard content requirements for posts.
 * Ensures posts reference specific world entities.
 */
export const CONTENT_REQUIREMENTS = `CONTENT REQUIREMENTS:
- MUST reference specific actors, companies, or events from WORLD CONTEXT
- MUST mention specific actors by name (e.g., "AIlon Musk", "@ailonmusk") or companies (e.g., "TeslAI", "OpenAGI")
- MUST reference specific markets/predictions by their exact names when relevant
- MUST reference specific trades or market movements when relevant
- Use @username format when mentioning users (e.g., "@ailonmusk said...")
- Avoid generic statements - be SPECIFIC about who/what/when
- Reference current markets, predictions, or recent trades naturally`;

/**
 * Standard world context block header.
 */
export const WORLD_CONTEXT_HEADER = `WORLD CONTEXT:
{{worldActors}}
{{currentMarkets}}
{{activePredictions}}
{{recentTrades}}`;

/**
 * Standard value ranges documentation for post metadata.
 */
export const VALUE_RANGES = `VALUE RANGES:
- sentiment: -1 (very negative) to 1 (very positive)
- clueStrength: 0 (no info) to 1 (smoking gun)
- pointsToward: true (suggests positive outcome) | false (suggests negative) | null (unclear)`;

/**
 * Combined rules section for standard feed posts.
 */
export const STANDARD_FEED_RULES = `${IMPORTANT_RULES}

${CONTENT_REQUIREMENTS}`;

/**
 * Helper to generate character voice guidance section.
 * Use this in prompts where actors need distinct voices.
 *
 * @param actorVariableName - The template variable containing actor info (e.g., 'actorsList')
 */
export function characterVoiceGuidance(
  actorVariableName = 'actorsList'
): string {
  return `
=== CHARACTER VOICE RULES ===
For each actor in {{${actorVariableName}}}, you MUST use their unique voice:

1. PERSONALITY: Read their personality field - this defines WHO they are
2. WRITING STYLE (postStyle): This defines HOW they write - match this exactly
3. EXAMPLE POSTS (postExample): These are TEMPLATES - your output MUST sound like these

CRITICAL MATCHING RULES:
- If their examples are SHORT (1-2 sentences) → write SHORT
- If their examples use SLANG or CASUAL language → use SLANG
- If their examples are FORMAL and technical → be FORMAL
- If their examples have specific CATCHPHRASES → use those catchphrases
- If their examples use specific PUNCTUATION patterns → match them

NEVER write generic social media speak for all characters.
Each character should be IMMEDIATELY RECOGNIZABLE by their voice alone.

Example: If character's postExample is "just shipped it. lmao. $100M ARR incoming 🚀"
Then YOUR post should match: casual, lowercase, short sentences, confident, uses lmao

Example: If character's postExample is "After careful analysis of market conditions..."
Then YOUR post should match: formal, complete sentences, analytical tone

AVOID generic phrases: "The future is...", "Exciting times", "This is huge", "Let that sink in", "Just my two cents"

POST VARIETY - generate a mix of:
- Hot takes (30%): Strong opinion, controversial, no hedging
- Shitposts (20%): Jokes, absurdist, one-liners
- Subtweets (15%): Vague reference without naming
- Flexes (15%): Humble brags, achievements
- Complaints (10%): Industry griping
- Insights (10%): Actual observations`;
}

/**
 * Get time-of-day posting energy context.
 * @param hour - Hour in 24h format (0-23)
 */
export function getTimeOfDayEnergy(hour: number): string {
  if (hour >= 2 && hour < 6) {
    return 'ENERGY: 3am unhinged - philosophical, conspiratorial, unfiltered';
  }
  if (hour >= 6 && hour < 10) {
    return 'ENERGY: Morning professional - announcements, fresh start optimism';
  }
  if (hour >= 10 && hour < 15) {
    return 'ENERGY: Peak hours - hot takes, controversy, ratio attempts';
  }
  if (hour >= 15 && hour < 20) {
    return 'ENERGY: Afternoon - commentary on day\'s events, dunks on bad takes';
  }
  return 'ENERGY: Night - introspective, shitposting, less corporate';
}

/**
 * Parody name rules for game/world prompts.
 * Simpler version focusing on name consistency.
 */
export const PARODY_NAME_RULES = `IMPORTANT RULES:
- NEVER use real-world person or organization names
- Use ONLY the exact parody names provided in the context (e.g., AIlon Musk, Sam AIltman, Mark Zuckerborg)
- NEVER "correct" or change parody names - use them exactly as shown

Examples of WRONG → RIGHT:
- "Elon Musk" → "AIlon Musk"
- "Trump" → "Trump Terminal"
- "OpenAI" → "OpenAGI"
- "Bitcoin" → "BitcAIn"`;

/**
 * Private vs public content guidance for group chats.
 */
export const PRIVATE_CONTENT_GUIDANCE = `PRIVATE vs PUBLIC:
- PUBLIC feed: What you want market to think
- PRIVATE chat: What you actually know/plan
- Be STRATEGIC: Help friends, hurt enemies`;

/**
 * Final reminders section for feed prompts (sandwich structure - reinforcement at end).
 * Repeats critical rules at the end of prompts to use recency effect.
 */
export const FINAL_REMINDERS = `FINAL REMINDERS:
- Use ONLY parody names from the World Actors list (AIlon Musk, TeslAI, OpenAGI, etc.)
- NEVER use real-world names (Elon Musk, Tesla, OpenAI, etc.)
- NO hashtags (#) - write naturally without hashtags
- NO emojis - plain text only
- Match each character's unique voice from their examples exactly`;

/**
 * Helper to build a complete prompt section combining common elements.
 */
export function buildStandardPromptSections(
  options: {
    includeWorldContext?: boolean;
    includeValueRanges?: boolean;
    includeVoiceGuidance?: boolean;
    actorVariableName?: string;
  } = {}
): string {
  const {
    includeWorldContext = true,
    includeValueRanges = true,
    includeVoiceGuidance = false,
    actorVariableName = 'actorsList',
  } = options;

  const sections: string[] = [];

  if (includeWorldContext) {
    sections.push(WORLD_CONTEXT_HEADER);
  }

  sections.push(STANDARD_FEED_RULES);

  if (includeVoiceGuidance) {
    sections.push(characterVoiceGuidance(actorVariableName));
  }

  if (includeValueRanges) {
    sections.push(VALUE_RANGES);
  }

  return sections.join('\n\n');
}
