/**
 * Shared post generation helpers
 *
 * Reduces code duplication between lookahead generation and game tick post generation
 */

import {
  generateSnowflakeId,
  getDbInstance,
  type Actor,
  type Organization,
  type Question,
} from '@babylon/db';
import type { BabylonLLMClient } from '../llm/openai-client';
import { logger } from '@babylon/shared';
import { characterMappingService } from './character-mapping-service';

// Minimal question type for post generation (only fields actually used)
type QuestionForPost = Pick<Question, 'id' | 'text' | 'questionNumber'>;

const MAX_POST_TOKENS = 16384; // No practical limit
const MAX_ARTICLE_TOKENS = 16384; // No practical limit

/**
 * Generate a single NPC post using LLM
 */
export async function generateNPCPost(
  llmClient: BabylonLLMClient,
  actor: Actor,
  question: QuestionForPost,
  worldFactsContext: string,
  timestamp: Date
): Promise<boolean> {
  const prompt = `You are ${actor.name}. Write a brief social media post (max 280 chars) about this prediction market question: "${question.text}". Be opinionated and entertaining.

${worldFactsContext}

Return your response as XML in this exact format:
<response>
  <post>your post content here</post>
</response>`;

  const response = await llmClient.generateJSON<
    { post: string } | { response: { post: string } }
  >(
    prompt,
    {
      properties: {
        post: { type: 'string' },
      },
      required: ['post'],
    },
    {
      temperature: 0.9,
      maxTokens: MAX_POST_TOKENS,
      format: 'xml',
    }
  );

  const postContent =
    'response' in response &&
    response.response &&
    typeof response.response === 'object' &&
    'post' in response.response
      ? (response.response as { post: string }).post
      : (response as { post: string }).post;

  if (!postContent || postContent.trim().length === 0) {
    logger.warn(
      'Empty post generated',
      { actorName: actor.name, questionId: question.id },
      'PostGeneration'
    );
    return false;
  }

  const transformed = await characterMappingService.transformText(
    postContent.trim()
  );
  if (transformed.replacementCount > 0) {
    logger.warn(
      `Fixed ${transformed.replacementCount} real name(s) in NPC post`,
      {
        actor: actor.name,
        questionId: question.id,
      },
      'PostGeneration'
    );
  }

  await getDbInstance().createPostWithAllFields({
    id: await generateSnowflakeId(),
    content: transformed.transformedText,
    authorId: actor.id,
    gameId: 'continuous',
    dayNumber: Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
    timestamp,
  });

  return true;
}

/**
 * Generate a single organization post using LLM
 */
export async function generateOrgPost(
  llmClient: BabylonLLMClient,
  org: Organization,
  question: QuestionForPost,
  worldFactsContext: string,
  timestamp: Date
): Promise<boolean> {
  const prompt = `You are ${org.name || 'Unknown Org'}, a media organization. Write a brief news-style post (max 280 chars) about this prediction market question: "${question.text}". Be informative and engaging.

${worldFactsContext}

Return your response as XML in this exact format:
<response>
  <post>your post content here</post>
</response>`;

  const response = await llmClient.generateJSON<
    { post: string } | { response: { post: string } }
  >(
    prompt,
    {
      properties: {
        post: { type: 'string' },
      },
      required: ['post'],
    },
    {
      temperature: 0.9,
      maxTokens: MAX_POST_TOKENS,
      format: 'xml',
    }
  );

  const postContent =
    'response' in response &&
    response.response &&
    typeof response.response === 'object' &&
    'post' in response.response
      ? (response.response as { post: string }).post
      : (response as { post: string }).post;

  if (!postContent || postContent.trim().length === 0) {
    logger.warn(
      'Empty org post generated',
      { orgName: org.name, questionId: question.id },
      'PostGeneration'
    );
    return false;
  }

  const transformed = await characterMappingService.transformText(
    postContent.trim()
  );
  if (transformed.replacementCount > 0) {
    logger.warn(
      `Fixed ${transformed.replacementCount} real name(s) in org post`,
      {
        org: org.name,
        questionId: question.id,
      },
      'PostGeneration'
    );
  }

  await getDbInstance().createPostWithAllFields({
    id: await generateSnowflakeId(),
    type: 'post',
    content: transformed.transformedText,
    authorId: org.id,
    gameId: 'continuous',
    dayNumber: Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
    timestamp,
  });

  return true;
}

/**
 * Generate a full news article from an organization
 */
export async function generateOrgArticle(
  llmClient: BabylonLLMClient,
  org: Organization,
  question: QuestionForPost,
  worldFactsContext: string,
  timestamp: Date
): Promise<boolean> {
  const prompt = `You are ${org.name}, a news organization. Write a comprehensive news article about this prediction market: "${question.text}".

${worldFactsContext}

Provide:
- "title": a compelling headline (max 100 characters)
- "summary": a succinct 2-3 sentence summary for social feeds (max 400 characters)
- "article": a FULL-LENGTH article body (800-1200 words, at least 4 paragraphs). Include:
  * An engaging lead paragraph that hooks readers
  * Background context and relevant details
  * Analysis of implications and what this means
  * Expert perspectives or insider viewpoints (you can fabricate realistic quotes)
  * A conclusion with forward-looking analysis
  
  The article must read like a professional newsroom piece from a major publication - NOT bullet points, NOT a summary. Separate paragraphs with \\n\\n (two newlines).

Return your response as XML in this exact format:
<response>
  <title>news headline here</title>
  <summary>2-3 sentence summary here</summary>
  <article>full article body here with \\n\\n between paragraphs</article>
</response>`;

  const response = await llmClient.generateJSON<
    | { title: string; summary: string; article: string }
    | { response: { title: string; summary: string; article: string } }
  >(
    prompt,
    {
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        article: { type: 'string' },
      },
      required: ['title', 'summary', 'article'],
    },
    {
      temperature: 0.7,
      maxTokens: MAX_ARTICLE_TOKENS,
      format: 'xml',
      promptType: 'generate_org_article',
    }
  );

  const articleData =
    'response' in response && response.response
      ? (response.response as {
          title: string;
          summary: string;
          article: string;
        })
      : (response as { title: string; summary: string; article: string });

  if (!articleData.title || !articleData.summary || !articleData.article) {
    logger.warn(
      'Empty article generated',
      { orgName: org.name, questionId: question.id },
      'PostGeneration'
    );
    return false;
  }

  const summary = articleData.summary.trim();
  const articleTitle = articleData.title.trim();
  const articleBody = articleData.article.trim();

  // Content should be a full article (800-1200 words = ~4000-6000 chars)
  // Minimum 500 chars to ensure it's not just a summary
  if (articleBody.length < 500) {
    logger.warn(
      'Article body too short - rejecting',
      { orgName: org.name, length: articleBody.length, minRequired: 500 },
      'PostGeneration'
    );
    return false;
  }

  // Transform content to replace real names with parody names
  const transformedSummary =
    await characterMappingService.transformText(summary);
  const transformedBody =
    await characterMappingService.transformText(articleBody);
  if (
    transformedSummary.replacementCount > 0 ||
    transformedBody.replacementCount > 0
  ) {
    logger.warn(
      `Fixed ${transformedSummary.replacementCount + transformedBody.replacementCount} real name(s) in org article`,
      {
        org: org.name,
        title: articleTitle,
      },
      'PostGeneration'
    );
  }

  await getDbInstance().createPostWithAllFields({
    id: await generateSnowflakeId(),
    type: 'article',
    content: transformedSummary.transformedText,
    fullContent: transformedBody.transformedText,
    articleTitle: articleTitle,
    authorId: org.id,
    gameId: 'continuous',
    dayNumber: Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
    timestamp,
  });

  logger.debug(
    'Created org article',
    { org: org.name, timestamp },
    'PostGeneration'
  );
  return true;
}
