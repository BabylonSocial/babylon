/**
 * Parody Headline Generator
 *
 * @description Transforms real news headlines into satirical parody versions
 * set in the futuristic AI world with parody characters. Uses LLM to generate
 * over-the-top satirical content and applies character mappings.
 */

import type { ParodyHeadline, RSSHeadline } from '@babylon/db';
import { db, desc, gte, inArray, parodyHeadlines } from '@babylon/db';
import { BabylonLLMClient } from '../llm/openai-client';
import { logger } from '@babylon/shared';
import { generateSnowflakeId } from '@babylon/shared';
import { characterMappingService } from './character-mapping-service';

/**
 * Generated parody content
 *
 * @description Contains generated parody headline and content with applied
 * character and organization mappings.
 */
export interface GeneratedParody {
  parodyTitle: string;
  parodyContent?: string;
  characterMappings: Record<string, string>;
  organizationMappings: Record<string, string>;
}

/**
 * Parody Headline Generator Class
 *
 * @description Uses LLM to create satirical, over-the-top versions of real
 * headlines. Applies character mappings before and after generation to ensure
 * consistent parody character usage.
 */
export class ParodyHeadlineGenerator {
  private llm: BabylonLLMClient;

  constructor(llm: BabylonLLMClient) {
    this.llm = llm;
  }

  /**
   * Generate a parody headline from a real headline
   *
   * @description Generates a satirical parody version of a real headline using
   * LLM. Applies character mappings before generation and post-processes to ensure
   * all real names are replaced with parody equivalents.
   *
   * @param {string} originalTitle - Original headline title
   * @param {string} [originalContent] - Optional original content
   * @param {string} [sourceName] - Optional source name
   * @returns {Promise<GeneratedParody>} Generated parody with mappings
   *
   * @example
   * ```typescript
   * const parody = await generator.generateParody(
   *   'OpenAGI announces SMH-9000',
   *   'Full article content...',
   *   'TechCrAInch'
   * );
   * ```
   */
  async generateParody(
    originalTitle: string,
    originalContent?: string,
    sourceName?: string
  ): Promise<GeneratedParody> {
    // First, replace any real names with parody names in the original
    const titleReplacement =
      await characterMappingService.transformText(originalTitle);
    const contentReplacement = originalContent
      ? await characterMappingService.transformText(originalContent)
      : null;

    // Build prompt for LLM
    const prompt = this.buildParodyPrompt(
      titleReplacement.transformedText,
      contentReplacement?.transformedText,
      sourceName
    );

    // Generate parody using LLM
    const response = await this.llm.generateJSON<
      | {
          parodyTitle: string;
          parodyContent?: string;
        }
      | {
          response: {
            parodyTitle: string;
            parodyContent?: string;
          };
        }
    >(
      prompt,
      {
        properties: {
          parodyTitle: { type: 'string' },
          parodyContent: { type: 'string' },
        },
        required: ['parodyTitle'],
      },
      {
        temperature: 0.9,
        maxTokens: 500,
        format: 'xml',
        promptType: 'parody_headline_generation',
      }
    );

    // Handle XML structure
    const parodyData =
      'response' in response && response.response
        ? response.response
        : (response as { parodyTitle: string; parodyContent?: string });

    // Apply character mapping to replace any real names with fictional equivalents
    const processedTitle = await characterMappingService.transformText(
      parodyData.parodyTitle
    );
    const processedContent = parodyData.parodyContent
      ? await characterMappingService.transformText(parodyData.parodyContent)
      : null;

    // Combine mappings from title, content, and post-processing
    const allCharacterMappings = {
      ...titleReplacement.characterMappings,
      ...(contentReplacement?.characterMappings || {}),
      ...processedTitle.characterMappings,
      ...(processedContent?.characterMappings || {}),
    };

    const allOrganizationMappings = {
      ...titleReplacement.organizationMappings,
      ...(contentReplacement?.organizationMappings || {}),
      ...processedTitle.organizationMappings,
      ...(processedContent?.organizationMappings || {}),
    };

    return {
      parodyTitle: processedTitle.transformedText,
      parodyContent: processedContent?.transformedText,
      characterMappings: allCharacterMappings,
      organizationMappings: allOrganizationMappings,
    };
  }

  /**
   * Build LLM prompt for parody generation
   */
  private buildParodyPrompt(
    title: string,
    content?: string,
    sourceName?: string
  ): string {
    return `You are a satirical news writer for a futuristic world where everyone is actually an AI.
Your job is to transform real news headlines into over-the-top, comical, satirical versions.

WORLD CONTEXT:
- This is a futuristic world where all humans are actually AI agents
- Everything is exaggerated and absurdist
- Technology has gone completely wild
- Politics is even more ridiculous than reality
- Financial markets are chaos
- Everyone is obsessed with AI, crypto, and memes

ORIGINAL HEADLINE:
"${title}"
${sourceName ? `Source: ${sourceName}` : ''}

${content ? `ORIGINAL CONTENT:\n${content.substring(0, 500)}...\n` : ''}

TASK:
Create a SATIRICAL, OVER-THE-TOP, COMICAL version of this headline.

REQUIREMENTS:
✅ Make it absurdist and exaggerated
✅ Add futuristic AI/tech twists
✅ Keep any parody character names that are already in the headline (like "AIlon Musk", "Sam AIltman", etc.)
✅ Make it funny and entertaining
✅ Keep it somewhat believable within the satirical world
✅ Make it 1-2 sentences maximum
${content ? '✅ Also create a brief satirical summary (2-3 sentences) based on the content' : ''}

STYLE:
- Over-the-top and dramatic
- Satirical and comical
- Futuristic AI world setting
- Think: The Onion meets Black Mirror

AVOID:
❌ Being boring or too similar to original
❌ Removing parody names that are already there
❌ Being too subtle - go BIG with the satire!
❌ Real-world seriousness - this is comedy!

OUTPUT FORMAT:
Respond with ONLY this XML:
<response>
  <parodyTitle>Your satirical headline here</parodyTitle>
  ${content ? '<parodyContent>Your satirical 2-3 sentence summary here</parodyContent>' : ''}
</response>

Generate the parody now.`;
  }

  /**
   * Process multiple headlines into parodies
   */
  async processHeadlines(
    headlines: Array<RSSHeadline & { source?: { name: string } | null }>
  ): Promise<ParodyHeadline[]> {
    const parodies: ParodyHeadline[] = [];

    for (const headline of headlines) {
      try {
        const parody = await this.generateParody(
          headline.title,
          headline.summary || undefined,
          headline.source?.name
        );

        const [parodyHeadline] = await db
          .insert(parodyHeadlines)
          .values({
            id: await generateSnowflakeId(),
            originalHeadlineId: headline.id,
            originalTitle: headline.title,
            originalSource: headline.source?.name || 'Unknown',
            parodyTitle: parody.parodyTitle,
            parodyContent: parody.parodyContent || null,
            characterMappings: parody.characterMappings,
            organizationMappings: parody.organizationMappings,
            generatedAt: new Date(),
          })
          .returning();

        if (parodyHeadline) {
          parodies.push(parodyHeadline);
        }

        logger.info(
          'Generated parody headline',
          {
            original: headline.title,
            parody: parody.parodyTitle,
          },
          'ParodyHeadlineGenerator'
        );
      } catch (error) {
        logger.error(
          `Failed to generate parody for headline: ${headline.title}`,
          { error },
          'ParodyHeadlineGenerator'
        );
      }
    }

    return parodies;
  }

  /**
   * Get recent parody headlines for use in game context
   * Returns parodies from the last 7 days
   */
  async getRecentParodies(daysBack = 7): Promise<ParodyHeadline[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - daysBack);

    return db
      .select()
      .from(parodyHeadlines)
      .where(gte(parodyHeadlines.generatedAt, sevenDaysAgo))
      .orderBy(desc(parodyHeadlines.generatedAt));
  }

  /**
   * Mark parody headlines as used in game context
   */
  async markAsUsed(parodyIds: string[]): Promise<void> {
    await db
      .update(parodyHeadlines)
      .set({
        isUsed: true,
        usedAt: new Date(),
      })
      .where(inArray(parodyHeadlines.id, parodyIds));
  }

  /**
   * Generate summary of parody headlines from the last 7 days
   * Returns a formatted string suitable for injection into game context
   */
  async generateDailySummary(): Promise<string> {
    const recentParodies = await this.getRecentParodies(7); // Last 7 days

    if (recentParodies.length === 0) {
      return 'No recent news updates available.';
    }

    // Group by day
    const byDay = new Map<string, ParodyHeadline[]>();
    for (const parody of recentParodies) {
      const day = new Date(parody.generatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!byDay.has(day)) {
        byDay.set(day, []);
      }
      byDay.get(day)!.push(parody);
    }

    // Format by day
    const dayEntries = Array.from(byDay.entries());
    const formattedDays = dayEntries
      .map(([day, parodies]) => {
        const headlines = parodies
          .slice(0, 3) // Max 3 per day
          .map((p) => `  • ${p.parodyTitle}`)
          .join('\n');
        return `${day}:\n${headlines}`;
      })
      .join('\n\n');

    return `📰 NEWS FROM THE LAST 7 DAYS:\n\n${formattedDays}\n\n(These are satirical parodies of real-world news headlines, transformed for our futuristic AI world where everyone is an AI agent)`;
  }
}

/**
 * Create instance with game tick LLM client
 * Priority: Groq > Claude > OpenAI
 */
export function createParodyHeadlineGenerator(): ParodyHeadlineGenerator {
  const llm = BabylonLLMClient.forGameTick();
  return new ParodyHeadlineGenerator(llm);
}

