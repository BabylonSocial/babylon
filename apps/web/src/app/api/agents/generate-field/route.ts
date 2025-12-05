/**
 * AI Field Generation API
 *
 * @route POST /api/agents/generate-field - Generate field content
 * @access Public
 *
 * @description
 * AI-powered content generation for agent configuration fields using Groq
 * or Claude. Generates contextually appropriate content for agent profiles,
 * personalities, system prompts, trading strategies, etc.
 *
 * @openapi
 * /api/agents/generate-field:
 *   post:
 *     tags:
 *       - Agents
 *     summary: Generate field content
 *     description: Generates AI content for agent configuration fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldName
 *             properties:
 *               fieldName:
 *                 type: string
 *                 enum: [name, description, system, bio, personality, tradingStrategy]
 *                 description: Field to generate
 *               currentValue:
 *                 type: string
 *                 description: Current/partial value for enhancement
 *               context:
 *                 type: object
 *                 description: Context for generation
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   system:
 *                     type: string
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 value:
 *                   type: string
 *       400:
 *         description: Missing field name
 *       503:
 *         description: No LLM API key configured
 *
 * @example
 * ```typescript
 * const { value } = await fetch('/api/agents/generate-field', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ fieldName: 'name' })
 * }).then(r => r.json());
 *
 * // Generate system prompt with context
 * const system = await fetch('/api/agents/generate-field', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     fieldName: 'system',
 *     context: {
 *       name: 'TraderBot',
 *       description: 'A conservative trading agent'
 *     }
 *   })
 * }).then(r => r.json());
 *
 * // Enhance partial input
 * const enhanced = await fetch('/api/agents/generate-field', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     fieldName: 'description',
 *     currentValue: 'An agent that focuses on',
 *     context: { name: 'MarketMaker' }
 *   })
 * }).then(r => r.json());
 * ```
 *
 * @see {@link /src/app/agents/create/page.tsx} Agent creation UI
 * @see {@link https://console.groq.com/docs/models} Groq API
 * @see {@link https://www.anthropic.com/api} Anthropic API
 */

import { createGroq } from '@ai-sdk/groq';
import Anthropic from '@anthropic-ai/sdk';
import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isPromptLoggingEnabled, logPrompt } from '@babylon/engine';
import { logger } from '@babylon/shared';
import {
  checkRateLimitAndDuplicates,
  RATE_LIMIT_CONFIGS,
} from '@babylon/api';
import { authenticateUser } from '@babylon/api';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req);

    // Apply rate limiting - 10 field generations per minute
    const rateLimitError = checkRateLimitAndDuplicates(
      user.userId,
      null, // No duplicate detection for field generation
      RATE_LIMIT_CONFIGS.GENERATE_AGENT_FIELD
    );

    if (rateLimitError) {
      logger.warn(
        'Agent field generation rate limit exceeded',
        { userId: user.userId },
        'GenerateField'
      );
      return rateLimitError;
    }

    const { fieldName, currentValue, context } = await req.json();

    const prompt = buildPromptForField(fieldName, currentValue, context);
    const systemPrompt =
      'You are a helpful assistant that generates agent configurations. Be concise, professional, and authentic.';

    let generatedValue: string;

    // Use Groq qwen/qwen3-32b if available, otherwise fall back to Claude
    if (process.env.GROQ_API_KEY) {
      const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      const result = await generateText({
        model: groq.languageModel('qwen/qwen3-32b'),
        prompt,
        system: systemPrompt,
        temperature: 0.8,
        maxOutputTokens: 300,
      });

      generatedValue = result.text.trim();
      logger.info(
        'Generated agent field with Groq',
        { fieldName, provider: 'groq' },
        'GenerateField'
      );

      if (isPromptLoggingEnabled()) {
        await logPrompt({
          promptType: `generate_field_${fieldName}`,
          input: `System: ${systemPrompt}\n\nUser: ${prompt}`,
          output: generatedValue,
          metadata: {
            provider: 'groq',
            model: 'qwen/qwen3-32b',
            temperature: 0.8,
            maxTokens: 300,
          },
        });
      }
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const firstContent = message.content[0]!;
      generatedValue = (firstContent as { text: string }).text.trim();
      logger.info(
        'Generated agent field with Claude',
        { fieldName, provider: 'claude' },
        'GenerateField'
      );

      if (isPromptLoggingEnabled()) {
        await logPrompt({
          promptType: `generate_field_${fieldName}`,
          input: `System: ${systemPrompt}\n\nUser: ${prompt}`,
          output: generatedValue,
          metadata: {
            provider: 'claude',
            model: 'claude-sonnet-4-5',
            temperature: 0.8,
            maxTokens: 300,
          },
        });
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'No LLM API key configured. Set GROQ_API_KEY or ANTHROPIC_API_KEY.',
        },
        { status: 503 }
      );
    }

    // Strip any <think>...</think> tags and their content (from reasoning models like Qwen)
    // Also remove leading/trailing quotes
    const cleanedValue = generatedValue
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    return NextResponse.json({
      success: true,
      value: cleanedValue,
    });
  } catch (error) {
    logger.error('Error generating agent field', { error }, 'generate-field');
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate field',
      },
      { status: 500 }
    );
  }
}

/**
 * Trading strategy archetypes for variety in generation
 */
const TRADING_ARCHETYPES = [
  'momentum trader who rides trends',
  'contrarian who bets against the crowd',
  'value investor seeking underpriced assets',
  'technical analyst using chart patterns',
  'fundamental analyst studying market data',
  'swing trader capturing short-term moves',
  'scalper making quick in-and-out trades',
  'macro trader following economic trends',
  'sentiment analyst reading market mood',
  'quantitative trader using statistical models',
];

/**
 * Personality traits for variety in generation
 */
const PERSONALITY_TRAITS = [
  'confident and decisive',
  'analytical and methodical',
  'bold and aggressive',
  'cautious and risk-averse',
  'witty and engaging',
  'calm and collected',
  'enthusiastic and optimistic',
  'skeptical and questioning',
  'strategic and patient',
  'adaptive and flexible',
];

function buildPromptForField(
  fieldName: string,
  currentValue: string | undefined,
  context: Record<string, string | undefined>
): string {
  const hasCurrentValue = currentValue && currentValue.length > 0;

  // Pick random elements for variety
  const randomArchetype =
    TRADING_ARCHETYPES[Math.floor(Math.random() * TRADING_ARCHETYPES.length)];
  const randomTrait =
    PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)];

  // Build rich context from all available fields
  const agentName = context.name || 'the agent';
  const hasDescription = context.description && context.description.length > 10;
  const hasSystem = context.system && context.system.length > 10;
  const hasPersonality = context.personality && context.personality.length > 10;
  const hasTradingStrategy =
    context.tradingStrategy && context.tradingStrategy.length > 10;

  switch (fieldName) {
    case 'name':
      return `Generate a unique, memorable name for an AI trading agent. Be creative - it could be a compound word, a mythological reference, a tech-inspired name, or something completely original. Examples of styles: "NexusTrader", "OracleX", "VoltageAI", "CipherMind". Just return the name, nothing else.`;

    case 'description':
      if (hasCurrentValue) {
        return `Enhance this agent description while keeping its essence:\n"${currentValue}"\n\nMake it more compelling and specific. Just return the enhanced description (1-2 sentences), no quotes.`;
      }
      return `Write a compelling one-sentence description for an AI trading agent${context.name ? ` called "${context.name}"` : ''}. Focus on what makes this agent unique - its specialty, approach, or edge. Be specific and avoid generic phrases. Just return the description, no quotes.`;

    case 'system':
      // System prompt: Core directive that defines who the agent IS
      return `Write a system prompt (important directions) for an AI trading agent called "${agentName}".

${hasDescription ? `Agent description: ${context.description}\n` : ''}
${hasPersonality ? `Personality context: ${context.personality}\n` : ''}
${hasTradingStrategy ? `Trading approach: ${context.tradingStrategy}\n` : ''}

The system prompt should:
1. Define the agent's core identity and role (start with "You are...")
2. Specify its primary objectives and decision-making principles
3. Set behavioral guidelines for how it analyzes and responds
${!hasTradingStrategy ? `4. Hint at a ${randomArchetype} approach` : ''}

Keep it to 3-4 sentences. Be specific to THIS agent's unique identity. Just return the system prompt, no quotes or meta-commentary.`;

    case 'bio':
      return `Generate 3 distinctive bio points for "${agentName}".

${hasDescription ? `Description: ${context.description}\n` : ''}
${hasSystem ? `System prompt: ${context.system}\n` : ''}

Each point should be 4-6 words highlighting a unique trait, specialty, or achievement. Make them memorable and specific to this agent's character.

Format exactly as: "Point 1|Point 2|Point 3"
Just return the three points separated by |, nothing else.`;

    case 'personality':
      // Personality: How the agent communicates and interacts
      return `Write a personality description for "${agentName}" that defines its communication style.

${hasDescription ? `Agent description: ${context.description}\n` : ''}
${hasSystem ? `System prompt: ${context.system}\n` : ''}
${hasTradingStrategy ? `Trading style: ${context.tradingStrategy}\n` : ''}

Describe in 2-3 sentences:
- How the agent speaks (tone, vocabulary, formality level)
- Its emotional temperament when trading
- Any distinctive quirks or catchphrases it might use
${!hasSystem && !hasDescription ? `Consider a ${randomTrait} personality type.` : ''}

Be creative and give this agent a distinct voice. Just return the personality description, no quotes.`;

    case 'tradingStrategy':
      // Trading strategy: Specific approach to markets
      return `Write a trading strategy for "${agentName}".

${hasDescription ? `Agent description: ${context.description}\n` : ''}
${hasSystem ? `System prompt: ${context.system}\n` : ''}
${hasPersonality ? `Personality: ${context.personality}\n` : ''}

Describe in 2-3 sentences:
- Primary trading methodology (e.g., technical, fundamental, sentiment-based)
- Risk management approach (position sizing, stop losses, max drawdown)
- Key indicators or signals the agent watches
- Time horizon (scalping, day trading, swing, long-term)
${!hasSystem && !hasDescription ? `Consider a ${randomArchetype} approach.` : ''}

Be specific about actual trading techniques. Just return the strategy description, no quotes.`;

    default:
      return `Generate creative content for the "${fieldName}" field of an AI trading agent${context.name ? ` named "${context.name}"` : ''}. Be specific and original.`;
  }
}
