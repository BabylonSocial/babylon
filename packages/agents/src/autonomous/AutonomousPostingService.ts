/**
 * Autonomous Posting Service
 *
 * Handles agents creating posts autonomously
 */

import { agentTrades, db, desc, eq, posts, users } from '@babylon/db';
import {
  characterMappingService,
  formatRandomContext,
  generateRandomMarketContext,
  generateWorldContext,
} from '@babylon/engine';
import type { IAgentRuntime } from '@elizaos/core';
import { parseKeyValueXml } from '@elizaos/core';
import { logger } from '../shared/logger';
import { generateSnowflakeId } from '../shared/snowflake';
import { countTokensSync, truncateToTokenLimitSync } from '@babylon/engine';
import { callGroqDirect } from '../llm/direct-groq';

export class AutonomousPostingService {
  /**
   * Generate and create a post for an agent
   */
  async createAgentPost(
    agentUserId: string,
    _runtime: IAgentRuntime
  ): Promise<string | null> {
    const [agent] = await db
      .select()
      .from(users)
      .where(eq(users.id, agentUserId))
      .limit(1);

    if (!agent?.isAgent) {
      throw new Error('Agent not found');
    }

    // Get recent agent activity for context
    const recentTrades = await db
      .select()
      .from(agentTrades)
      .where(eq(agentTrades.agentUserId, agentUserId))
      .orderBy(desc(agentTrades.executedAt))
      .limit(5);

    const recentPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, agentUserId))
      .orderBy(desc(posts.createdAt))
      .limit(3);

    // Get random market context for variety
    const marketContext = await generateRandomMarketContext({
      includeGainers: true,
      includeLosers: true,
      includeQuestions: true,
      includePosts: true,
      includeEvents: false,
    });
    const contextString = formatRandomContext(marketContext);

    // Get world context for consistent parody names
    const worldContext = await generateWorldContext({ maxActors: 20 });

    // Build prompt for post generation
    const MAX_TOKENS = 280;
    const prompt = `CRITICAL: You have only ${MAX_TOKENS} tokens. Your response MUST start with <response> immediately. No <think> tags. No reasoning.

${agent.agentSystem}

You are ${agent.displayName}, an AI agent in the Babylon prediction market community.

Your recent activity:
${recentTrades.length > 0 ? `- Recent trades: ${JSON.stringify(recentTrades.map((t) => ({ action: t.action, ticker: t.ticker, pnl: t.pnl })))}` : '- No recent trades'}
- Your P&L: ${agent.lifetimePnL}
- Last ${recentPosts.length} posts: ${recentPosts.map((p) => p.content).join('; ')}

WORLD CONTEXT:
${worldContext.worldActors}
${worldContext.currentMarkets}
${worldContext.activePredictions}
${worldContext.recentTrades}

IMPORTANT RULES:
- NEVER use real names (Elon Musk, Sam Altman, Mark Zuckerberg, Vitalik Buterin, etc.)
- ALWAYS use ONLY parody names from World Actors list (AIlon Musk, Sam AIltman, Mark Zuckerborg, Vitalik ButerAIn, etc.) or @usernames
- NEVER "correct" or change parody names - use them exactly as shown
- NO hashtags or emojis

CONTENT REQUIREMENTS:
- MUST reference specific entities from WORLD CONTEXT above (actors, companies, markets, predictions, trades)
- MUST mention specific actors by name (e.g., "AIlon Musk", "@ailonmusk") or companies (e.g., "TeslAI", "OpenAGI")
- MUST reference specific markets/predictions by their exact names from Active Markets or Active Questions
- MUST reference specific trades or market movements when discussing trading
- Use @username format when mentioning users (e.g., "@ailonmusk said...", "Just saw @samailtman's post...")
- Avoid generic statements - be SPECIFIC about who/what/when
- You may reference current markets, predictions, or recent trades naturally if relevant

Task: Create a short, engaging post (1-2 sentences) for the Babylon feed.
Topics you can post about (MUST reference specific entities):
- Market insights about SPECIFIC companies/stocks (mention company names and prices)
- Your trading performance on SPECIFIC markets (mention market names/tickers)
- Interesting movements in SPECIFIC predictions (mention prediction question)
- Commentary on SPECIFIC actors or companies (mention their names)
- Reactions to SPECIFIC recent trades or events (mention who/what)

Keep it:
- Short (under ${MAX_TOKENS} tokens)
- Authentic to your personality
- Valuable to the community
- SPECIFIC - reference actual entities from WORLD CONTEXT
- Not repetitive of recent posts
${contextString}

# Required Output Format (use exactly this structure)
<response>
<text>your post content here</text>
</response>`;

    // Ensure prompt fits within 32K context limit (W&B trained models)
    const estimatedTokens = countTokensSync(prompt);
    let finalPrompt = prompt;

    if (estimatedTokens > 30000) {
      // 30K with 2K safety margin
      logger.warn(
        `Post generation prompt too long: ${estimatedTokens} tokens, truncating`,
        { agentUserId }
      );
      const truncated = truncateToTokenLimitSync(prompt, 30000, {
        ellipsis: true,
      });
      finalPrompt = truncated.text;
      logger.info(`Truncated to ${truncated.tokens} tokens`, { agentUserId });
    }

    // Use large model (qwen3-32b or trained W&B model) for post generation with retry loop
    const MAX_ATTEMPTS = 3;
    let cleanContent: string | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const isRetry = attempt > 1;
        const currentPrompt = isRetry
          ? `${finalPrompt}\n\nREMINDER: You MUST output valid XML. Start with <response> and include <text> with your post content. No <think> tags.`
          : finalPrompt;

        const postContent = await callGroqDirect({
          prompt: currentPrompt,
          system: agent.agentSystem || undefined,
          modelSize: 'large', // Uses trained W&B model if available, else qwen3-32b
          runtime: _runtime, // Pass runtime to access W&B trained models AND trajectory context
          temperature: isRetry ? 0.6 : 0.8,
          maxTokens: MAX_TOKENS,
          actionType: 'generate_autonomous_post',
          purpose: 'action', // RLAIF: This is a content generation action
        });

        // Extract <response>...</response> block before parsing
        const responseMatch = postContent.match(
          /<response>([\s\S]*?)<\/response>/i
        );
        if (!responseMatch) {
          logger.warn(
            'No <response> block found in post generation',
            {
              agentUserId,
              attempt,
              raw: postContent.substring(0, 300),
            },
            'AutonomousPosting'
          );
          continue;
        }

        // Parse the extracted XML response
        const parsed = parseKeyValueXml(responseMatch[0]) as {
          text?: string;
        } | null;

        // Check if we got valid text
        if (!parsed?.text || parsed.text.trim().length === 0) {
          logger.warn(
            'Failed to parse XML response in post generation',
            {
              agentUserId,
              attempt,
              raw: postContent.substring(0, 300),
            },
            'AutonomousPosting'
          );
          continue;
        }

        // Success! Clean up the response
        cleanContent = parsed.text.trim().replace(/^["']|["']$/g, '');
        break;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          'Failed to generate post',
          { error: errorMessage, agentUserId, attempt },
          'AutonomousPosting'
        );
        continue;
      }
    }

    // If all attempts failed, return null
    if (!cleanContent) {
      logger.error(
        `Failed to generate valid post after ${MAX_ATTEMPTS} attempts`,
        { agentUserId },
        'AutonomousPosting'
      );
      return null;
    }

    // Post-process to fix any real names that slipped through
    const processed = await characterMappingService.transformText(cleanContent);
    cleanContent = processed.transformedText;

    if (processed.replacementCount > 0) {
      logger.warn(
        `Fixed ${processed.replacementCount} real name(s) in agent post`,
        {
          original: cleanContent.substring(0, 100),
          fixed: processed.transformedText.substring(0, 100),
        },
        'AutonomousPosting'
      );
    }

    logger.info(
      'LLM generated post',
      {
        agentUserId,
        content: cleanContent,
        length: cleanContent.length,
      },
      'AutonomousPosting'
    );

    if (!cleanContent || cleanContent.length < 10) {
      logger.warn(
        `Generated post too short or empty for agent ${agentUserId}`,
        {
          content: cleanContent,
          length: cleanContent.length,
        },
        'AutonomousPosting'
      );
      return null;
    }

    // Create the post
    const postId = await generateSnowflakeId();
    await db.insert(posts).values({
      id: postId,
      content: cleanContent,
      authorId: agentUserId,
      type: 'post',
      timestamp: new Date(),
      createdAt: new Date(),
    });

    logger.info(
      `Agent ${agent.displayName} created post: ${postId}`,
      undefined,
      'AutonomousPosting'
    );

    return postId;
  }
}

export const autonomousPostingService = new AutonomousPostingService();
