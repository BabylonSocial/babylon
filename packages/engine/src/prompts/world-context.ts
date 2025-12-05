/**
 * World Context Generator
 *
 * Generates comprehensive context strings for prompts including:
 * - Actor names (parody only, never real names)
 * - Current markets and prices
 * - Active predictions
 * - Recent trades
 * - Reality grounding (current date, prices, politics, tech, culture)
 *
 * This is the single source of truth for world context in prompts.
 * All generated content should use this context to ensure consistency
 * and prevent outdated or incorrect references.
 */

import {
  actors,
  agentTrades,
  db,
  desc,
  eq,
  markets,
  npcTrades,
  organizations,
  questions,
  users,
} from '@babylon/db';
import { loadActorsData } from '../actors-loader';
import { worldFactsService } from '../world-facts-service';
import { shuffleArray } from '../utils/randomization';
import type { ActorData } from '../types/shared';
import {
  getCurrentDateContext,
  getFullRealityGrounding,
  getMinimalRealityGrounding,
  getRealityGrounding,
} from './reality-grounding';

/**
 * Options for configuring world context generation.
 */
export interface WorldContextOptions {
  /** Whether to include actor names (default: true) */
  includeActors?: boolean;
  /** Whether to include current markets (default: true) */
  includeMarkets?: boolean;
  /** Whether to include active predictions (default: true) */
  includePredictions?: boolean;
  /** Whether to include recent trades (default: true) */
  includeTrades?: boolean;
  /** Whether to include reality grounding (default: true) */
  includeRealityGrounding?: boolean;
  /** Whether to include dynamic world facts (default: true) */
  includeWorldFacts?: boolean;
  /** Maximum number of actors to include (default: 50) */
  maxActors?: number;
  /** Level of reality grounding detail: 'full', 'concise', 'minimal', or 'none' (default: 'concise') */
  realityGroundingLevel?: 'full' | 'concise' | 'minimal' | 'none';
}

/**
 * Complete world context object containing all contextual information
 * for prompt generation.
 */
export interface WorldContext {
  // Actor context
  worldActors: string;

  // Market context
  currentMarkets: string;
  activePredictions: string;
  recentTrades: string;

  // Date/time context
  currentDateTime: string;
  currentDate: string;
  currentTime: string;
  currentYear: string;
  currentMonth: string;
  currentDay: string;

  // Reality grounding
  realityGrounding: string;

  // Dynamic world facts
  worldFacts: string;
}

/**
 * Generates the world actors list for prompt context.
 *
 * ONLY includes parody names - real names are NEVER mentioned.
 * Shuffles actors to add variety to prompts. Optimized to only
 * load actors data (not organizations or relationships).
 *
 * @param maxActors - Maximum number of actors to include (default: all)
 * @returns Formatted string listing actors in "Name (@username)" format
 */
export function generateWorldActors(maxActors?: number): string {
  // OPTIMIZATION: Only load actors, not organizations or relationships
  const actorsData = loadActorsData({
    includeActors: true,
    includeOrganizations: false,
  });
  const actors = actorsData.actors as ActorData[];

  // Shuffle actors to add randomness/entropy to prompts
  const shuffledActors = shuffleArray(actors);
  const actorsToShow = maxActors
    ? shuffledActors.slice(0, maxActors)
    : shuffledActors;

  const actorsList = actorsToShow
    .map((actor) => `${actor.name} (@${actor.username})`)
    .join(', ');

  return `World Actors (USE THESE NAMES ONLY): ${actorsList}`;
}

/**
 * Generates current markets context from database.
 *
 * Includes both prediction markets and perpetual futures markets.
 * Returns top 5 most active markets of each type, shuffled for variety.
 *
 * @returns Formatted string describing active markets and their prices/probabilities
 */
export async function generateCurrentMarkets(): Promise<string> {
  // Get active prediction markets
  const predictionMarkets = await db
    .select()
    .from(markets)
    .where(eq(markets.resolved, false))
    .orderBy(desc(markets.yesShares))
    .limit(5);

  // Get top perpetual markets (companies with recent activity)
  const companies = await db
    .select()
    .from(organizations)
    .where(eq(organizations.type, 'company'))
    .orderBy(desc(organizations.currentPrice))
    .limit(5);

  const parts: string[] = [];

  // Add prediction markets (shuffled for variety)
  if (predictionMarkets.length > 0) {
    const shuffledPredictions = shuffleArray(predictionMarkets);
    const predList = shuffledPredictions.map(
      (market: (typeof predictionMarkets)[number]) => {
        const yesShares = Number.parseFloat(
          market.yesShares?.toString() || '0'
        );
        const noShares = Number.parseFloat(market.noShares?.toString() || '0');
        const totalShares = yesShares + noShares;
        const yesPrice =
          totalShares > 0 ? Math.round((yesShares / totalShares) * 100) : 50;

        return `${market.question} (${yesPrice}% Yes)`;
      }
    );
    parts.push(`Predictions: ${predList.join(' | ')}`);
  }

  // Add perp markets (shuffled for variety)
  if (companies.length > 0) {
    const shuffledCompanies = shuffleArray(companies);
    const perpList = shuffledCompanies.map(
      (company: (typeof companies)[number]) => {
        const price =
          Number(company.currentPrice) || Number(company.initialPrice) || 100;
        return `${company.name} $${price.toFixed(2)}`;
      }
    );
    parts.push(`Stocks: ${perpList.join(' | ')}`);
  }

  if (parts.length === 0) {
    return 'Active Markets: None currently active';
  }

  return `Active Markets: ${parts.join(' / ')}`;
}

/**
 * Generates active predictions context from database.
 *
 * Fetches active questions/predictions that haven't resolved yet.
 * Returns top 10 most recent questions with days until resolution.
 *
 * @returns Formatted string listing active predictions and their resolution dates
 */
export async function generateActivePredictions(): Promise<string> {
  // Get active questions from the Question table
  const activeQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.status, 'active'))
    .orderBy(desc(questions.createdAt))
    .limit(10);

  if (activeQuestions.length === 0) {
    return 'Active Questions: None currently active';
  }

  // Shuffle questions to add variety
  const shuffledQuestions = shuffleArray(activeQuestions);
  const questionsList = shuffledQuestions.map(
    (q: (typeof activeQuestions)[number]) => {
      const resolutionDate = q.resolutionDate
        ? new Date(q.resolutionDate)
        : new Date();
      const daysUntil = Math.ceil(
        (resolutionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return `${q.text} (resolves in ${daysUntil}d)`;
    }
  );

  return `Active Questions: ${questionsList.join(' | ')}`;
}

/**
 * Generates recent trades context from database.
 *
 * Fetches recent trades from both NPCs and agents, combines them,
 * and returns the top 20 most recent trades with actor names and details.
 *
 * @returns Formatted string listing recent trading activity
 */
export async function generateRecentTrades(): Promise<string> {
  // Get recent NPC trades with actor names
  const npcTradeResults = await db
    .select({
      action: npcTrades.action,
      side: npcTrades.side,
      amount: npcTrades.amount,
      price: npcTrades.price,
      marketType: npcTrades.marketType,
      ticker: npcTrades.ticker,
      executedAt: npcTrades.executedAt,
      actorName: actors.name,
    })
    .from(npcTrades)
    .leftJoin(actors, eq(npcTrades.npcActorId, actors.id))
    .orderBy(desc(npcTrades.executedAt))
    .limit(15);

  // Get recent agent trades with user names
  const agentTradeResults = await db
    .select({
      action: agentTrades.action,
      side: agentTrades.side,
      amount: agentTrades.amount,
      price: agentTrades.price,
      marketType: agentTrades.marketType,
      ticker: agentTrades.ticker,
      executedAt: agentTrades.executedAt,
      displayName: users.displayName,
      username: users.username,
    })
    .from(agentTrades)
    .leftJoin(users, eq(agentTrades.agentUserId, users.id))
    .orderBy(desc(agentTrades.executedAt))
    .limit(15);

  // Combine and sort by time
  const allTrades = [
    ...npcTradeResults.map((t: (typeof npcTradeResults)[number]) => ({
      name: t.actorName || 'NPC',
      action: t.action,
      side: t.side,
      amount: t.amount,
      price: t.price,
      marketType: t.marketType,
      ticker: t.ticker,
      time: t.executedAt,
    })),
    ...agentTradeResults.map((t: (typeof agentTradeResults)[number]) => ({
      name: t.displayName || t.username || 'Agent',
      action: t.action,
      side: t.side,
      amount: t.amount,
      price: t.price,
      marketType: t.marketType,
      ticker: t.ticker,
      time: t.executedAt,
    })),
  ]
    .sort((a, b) => (b.time?.getTime() || 0) - (a.time?.getTime() || 0))
    .slice(0, 20); // Top 20 most recent

  if (allTrades.length === 0) {
    return 'Recent Trades: No recent activity';
  }

  const tradesList = allTrades.map((t: (typeof allTrades)[number]) => {
    const actionStr = t.side ? `${t.action} ${t.side}` : t.action;
    const marketStr = t.ticker || t.marketType;
    return `${t.name} ${actionStr} ${marketStr}`;
  });

  return `Recent Trades: ${tradesList.join(' | ')}`;
}

/**
 * Generates complete world context for prompts.
 *
 * This is the main function to use when generating any content.
 * It provides current date, market data, actor information, and
 * reality grounding. Fetches data in parallel for performance.
 *
 * @param options - Configuration for what context to include and detail level
 * @returns Complete world context object with all requested context strings
 *
 * @example
 * ```ts
 * const context = await generateWorldContext({
 *   maxActors: 30,
 *   realityGroundingLevel: 'concise'
 * });
 *
 * const prompt = renderPrompt(ambientPost, {
 *   ...context,
 *   actorName: 'Alice'
 * });
 * ```
 */
export async function generateWorldContext(
  options: WorldContextOptions = {}
): Promise<WorldContext> {
  const {
    includeActors = true,
    includeMarkets = true,
    includePredictions = true,
    includeTrades = true,
    includeRealityGrounding = true,
    includeWorldFacts = true,
    maxActors = 50, // Limit to top 50 actors to avoid token limits
    realityGroundingLevel = 'concise', // Default to concise for most prompts
  } = options;

  const dateContext = getCurrentDateContext();

  // Fetch data in parallel for performance
  const [markets, predictions, trades, worldFactsData] = await Promise.all([
    includeMarkets ? generateCurrentMarkets() : Promise.resolve(''),
    includePredictions ? generateActivePredictions() : Promise.resolve(''),
    includeTrades ? generateRecentTrades() : Promise.resolve(''),
    includeWorldFacts
      ? worldFactsService.generateWorldContext(false)
      : Promise.resolve({ general: '' }),
  ]);

  // Determine reality grounding level
  let realityGrounding = '';
  if (includeRealityGrounding) {
    switch (realityGroundingLevel) {
      case 'full':
        realityGrounding = await getFullRealityGrounding();
        break;
      case 'concise':
        realityGrounding = await getRealityGrounding();
        break;
      case 'minimal':
        realityGrounding = await getMinimalRealityGrounding();
        break;
      case 'none':
        realityGrounding = '';
        break;
    }
  }

  return {
    // Actor context
    worldActors: includeActors ? generateWorldActors(maxActors) : '',

    // Market context
    currentMarkets: markets,
    activePredictions: predictions,
    recentTrades: trades,

    // Date/time context
    currentDateTime: dateContext.dateISO,
    currentDate: dateContext.dateFull,
    currentTime: dateContext.time,
    currentYear: dateContext.year,
    currentMonth: dateContext.month,
    currentDay: dateContext.day,

    // Reality grounding
    realityGrounding,

    // Dynamic world facts
    worldFacts: worldFactsData.general,
  };
}

/**
 * Get a list of parody actor names (for validation purposes only).
 *
 * Returns all actor names that should be used in generated content.
 * Used for validation to ensure only parody names are used.
 *
 * @returns Array of parody actor names
 */
export function getParodyActorNames(): string[] {
  const actorsData = loadActorsData({
    includeActors: true,
    includeOrganizations: false,
  });
  const actors = actorsData.actors as ActorData[];
  return actors.map((actor) => actor.name);
}

/**
 * Get a list of forbidden real names (for validation).
 *
 * These names should NEVER appear in generated output. Used for
 * validation to catch any accidental use of real names instead
 * of parody names.
 *
 * @returns Array of forbidden real names that must not appear in content
 */
export function getForbiddenRealNames(): string[] {
  const actorsData = loadActorsData({
    includeActors: true,
    includeOrganizations: false,
  });
  const actors = actorsData.actors as ActorData[];
  return actors.map((actor) => actor.realName);
}

/**
 * Validate that generated content doesn't use real names.
 *
 * Checks if the text contains any forbidden real names. Returns
 * an array of validation errors if any are found.
 *
 * @param text - The generated content to check
 * @returns Array of validation error messages (empty if valid)
 */
export function validateNoRealNames(text: string): string[] {
  const forbiddenNames = getForbiddenRealNames();
  const violations: string[] = [];

  // Check if text contains any forbidden real names
  forbiddenNames.forEach((realName) => {
    if (text.includes(realName)) {
      violations.push(
        `FORBIDDEN: Found real name "${realName}" - must use parody names only`
      );
    }
  });

  return violations;
}

/**
 * Complete validation of generated content.
 *
 * Checks both parody names (errors) and reality grounding (warnings).
 * Returns a comprehensive validation result with all issues found.
 *
 * @param text - The generated content to validate
 * @returns Validation result object:
 *   - `errors`: Array of critical errors (real names found)
 *   - `warnings`: Array of warnings (outdated references)
 *   - `isValid`: Whether content passed validation (no errors)
 *
 * @example
 * ```ts
 * const validation = validateGeneratedContent(generatedText);
 * if (!validation.isValid) {
 *   console.error('Errors:', validation.errors);
 * }
 * ```
 */
export function validateGeneratedContent(text: string): {
  errors: string[];
  isValid: boolean;
} {
  const errors = validateNoRealNames(text);

  return {
    errors,
    isValid: errors.length === 0,
  };
}

/**
 * Re-export reality grounding utilities
 */
export {
  checkRealityGrounding,
  getCurrentDateContext,
  getFullRealityGrounding,
  getMinimalRealityGrounding,
  getRealityGrounding,
} from './reality-grounding';

/**
 * Example usage:
 *
 * ```typescript
 * import {
 *   ambientPosts,
 *   generateWorldContext,
 *   renderPrompt,
 *   validateGeneratedContent,
 * } from '@babylon/engine';
 *
 * // Generate world context with reality grounding
 * const worldContext = await generateWorldContext({
 *   maxActors: 30,
 *   realityGroundingLevel: 'concise', // 'full' | 'concise' | 'minimal' | 'none'
 * });
 *
 * // Use in prompt
 * const prompt = renderPrompt(ambientPosts, {
 *   day: 5,
 *   actorCount: 3,
 *   actorsList: "...",
 *   progressContext: "...",
 *   atmosphereContext: "...",
 *   previousPostsContext: "",
 *   trendContext: "",
 *   ...worldContext, // Spreads all context including reality grounding
 * });
 *
 * // Validate output
 * const validation = validateGeneratedContent(generatedText);
 * if (!validation.isValid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 */
