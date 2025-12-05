/**
 * LLM Client for Babylon Game Generation
 * Supports multiple providers with intelligent fallback
 * Priority: Groq > Claude > OpenAI
 *
 * IMPORTANT: Always requires an API key - never falls back to mock mode
 */

import OpenAI from 'openai';
import 'dotenv/config';
import { logger } from '@babylon/shared';
import type { JsonValue } from '../types/common';
import {
  cleanMarkdownCodeBlocks,
  extractJsonFromText,
  parseContinuationContent,
} from './json-continuation-parser';
import { parseXML } from './xml-parser';
import { isPromptLoggingEnabled, logPrompt } from '../utils/prompt-logger';

type LLMProvider = 'groq' | 'claude' | 'openai';

/**
 * Simple JSON schema for validation
 */
interface JSONSchema {
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
}

interface JsonSchemaProperty {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
}

export class BabylonLLMClient {
  private client: OpenAI;
  private provider: LLMProvider;
  private groqKey: string | undefined;
  private claudeKey: string | undefined;
  private openaiKey: string | undefined;

  /**
   * Create a BabylonLLMClient configured to use Groq provider (Priority #1)
   * This is a convenience factory method for forcing Groq without passing undefined parameters
   */
  static forGroq(): BabylonLLMClient {
    return new BabylonLLMClient('', 'groq');
  }

  /**
   * Create a BabylonLLMClient configured to use Anthropic/Claude provider (Priority #2)
   * This is a convenience factory method for forcing Claude without passing undefined parameters
   */
  static forClaude(): BabylonLLMClient {
    return new BabylonLLMClient('', 'claude');
  }

  /**
   * Create a BabylonLLMClient configured to use OpenAI provider (Priority #3 - fallback)
   * This is a convenience factory method for forcing OpenAI without passing undefined parameters
   */
  static forOpenAI(apiKey?: string): BabylonLLMClient {
    return new BabylonLLMClient(apiKey || '', 'openai');
  }

  /**
   * Create a BabylonLLMClient for game tick operations
   * Priority: Groq > Claude > OpenAI
   */
  static forGameTick(): BabylonLLMClient {
    // Check providers in order
    if (process.env.GROQ_API_KEY) {
      return new BabylonLLMClient('', 'groq');
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return new BabylonLLMClient('', 'claude');
    }
    if (process.env.OPENAI_API_KEY) {
      return new BabylonLLMClient('', 'openai');
    }
    // Fallback: throw error if no providers available
    throw new Error(
      '❌ No API key found for game tick operations!\n' +
        '   Set one of these environment variables:\n' +
        '   - GROQ_API_KEY (recommended for game tick)\n' +
        '   - ANTHROPIC_API_KEY\n' +
        '   - OPENAI_API_KEY\n' +
        '   Example: export GROQ_API_KEY=your_key_here'
    );
  }

  constructor(apiKey?: string, forceProvider?: LLMProvider) {
    // Priority: Groq > Claude > OpenAI (unless forceProvider is set)
    this.groqKey = process.env.GROQ_API_KEY;
    this.claudeKey = process.env.ANTHROPIC_API_KEY;
    this.openaiKey = apiKey || process.env.OPENAI_API_KEY;

    // Timeout and retry configuration - shorter in test environments to fail fast
    const isTestEnv =
      process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test';
    // Test: 30 seconds, Production: 180 seconds (3 minutes)
    const timeoutMs = isTestEnv ? 30000 : 180000;
    // Test: 0 SDK retries (we handle retries ourselves, fail fast on rate limits)
    // Production: 2 retries
    const sdkMaxRetries = isTestEnv ? 0 : 2;

    // Force specific provider if requested
    if (forceProvider === 'groq' && this.groqKey) {
      logger.info('Using Groq (forced)', undefined, 'BabylonLLMClient');
      this.client = new OpenAI({
        apiKey: this.groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
        timeout: timeoutMs,
        maxRetries: sdkMaxRetries,
      });
      this.provider = 'groq';
    } else if (forceProvider === 'claude' && this.claudeKey) {
      logger.info('Using Claude (forced)', undefined, 'BabylonLLMClient');
      this.client = new OpenAI({
        apiKey: this.claudeKey,
        baseURL: 'https://api.anthropic.com/v1',
        timeout: timeoutMs,
        maxRetries: sdkMaxRetries,
      });
      this.provider = 'claude';
    } else if (forceProvider === 'openai' && this.openaiKey) {
      logger.info('Using OpenAI (forced)', undefined, 'BabylonLLMClient');
      this.client = new OpenAI({
        apiKey: this.openaiKey,
        timeout: timeoutMs,
        maxRetries: sdkMaxRetries,
      });
      this.provider = 'openai';
    } else if (this.groqKey) {
      logger.info('Using Groq (fast inference)', undefined, 'BabylonLLMClient');
      this.client = new OpenAI({
        apiKey: this.groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
        timeout: timeoutMs,
        maxRetries: sdkMaxRetries,
      });
      this.provider = 'groq';
    } else if (this.claudeKey) {
      logger.info(
        'Using Claude via OpenAI-compatible API',
        undefined,
        'BabylonLLMClient'
      );
      this.client = new OpenAI({
        apiKey: this.claudeKey,
        baseURL: 'https://api.anthropic.com/v1',
        timeout: timeoutMs,
        maxRetries: sdkMaxRetries,
      });
      this.provider = 'claude';
    } else if (this.openaiKey) {
      logger.info('Using OpenAI (fallback)', undefined, 'BabylonLLMClient');
      this.client = new OpenAI({
        apiKey: this.openaiKey,
        timeout: timeoutMs,
        maxRetries: sdkMaxRetries,
      });
      this.provider = 'openai';
    } else {
      throw new Error(
        '❌ No API key found!\n' +
          '   Set one of these environment variables (in priority order):\n' +
          '   - GROQ_API_KEY (fast inference)\n' +
          '   - ANTHROPIC_API_KEY (Claude)\n' +
          '   - OPENAI_API_KEY (fallback)\n' +
          '   Example: export GROQ_API_KEY=your_key_here'
      );
    }
  }

  /**
   * Generate completion with structured response (XML or JSON)
   * ALWAYS retries on failure - never gives up without exhausting all retries
   * Defaults to XML for more robust parsing
   */
  async generateJSON<T>(
    prompt: string,
    schema?: JSONSchema,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      format?: 'xml' | 'json';
      /** Prompt type identifier for logging and monitoring */
      promptType?: string;
      /** Prompt template for logging and monitoring */
      promptTemplate?: string;
    } = {}
  ): Promise<T> {
    const defaultModel = this.getDefaultModel();

    const {
      model = defaultModel,
      temperature = 0.7,
      maxTokens = 16000,
      format = 'xml',
      promptType = 'unknown',
      promptTemplate,
    } = options;

    // OpenAI can enforce JSON mode, but we default to XML for robustness
    const useJsonFormat =
      this.provider === 'openai' && format === 'json'
        ? { type: 'json_object' as const }
        : undefined;

    // Babylon world context - pre-condition LLM to expect parody names
    const babylonContext = `You are generating content for Babylon, a satirical prediction market game.
WORLD RULES:
- Use ONLY parody names (e.g., "AIlon Musk" not "Elon Musk", "TeslAI" not "Tesla", "OpenAGI" not "OpenAI")
- NEVER use real-world person or organization names
- NO hashtags (#) in any content
- NO emojis in any content
- Each character has a UNIQUE voice - match their writing style exactly

`;

    const systemContent =
      format === 'xml'
        ? babylonContext +
          'You are an XML-only assistant. CRITICAL INSTRUCTIONS:\n' +
          '1. Respond ONLY with valid XML - NO explanations, NO reasoning, NO markdown\n' +
          '2. Start your response IMMEDIATELY with < (the opening tag)\n' +
          '3. End your response with > (the closing tag)\n' +
          '4. Do NOT write "Okay, let\'s see" or any thinking process\n' +
          '5. Do NOT write "Here is the XML" or any preamble\n' +
          '6. Just output the pure XML structure directly\n' +
          'WRONG: "Okay, let\'s see. I need to..."\n' +
          'CORRECT: "<decisions><decision>..."'
        : babylonContext +
          'You are a JSON-only assistant. You must respond ONLY with valid JSON. No explanations, no markdown, no other text.';

    const messages = [
      {
        role: 'system' as const,
        content: systemContent,
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    let retryCount = 0;
    const maxRetries = 3;
    const initialDelayMs = 2000;

    while (true) {
      try {
        // For qwen3 models, disable reasoning to prevent token consumption on thinking
        // See: https://console.groq.com/docs/reasoning
        const isQwen3Model = model.includes('qwen3');

        const response = await this.client.chat.completions.create({
          model,
          messages,
          ...(useJsonFormat ? { response_format: useJsonFormat } : {}),
          temperature,
          max_tokens: maxTokens,
          // Disable reasoning for qwen3 models to prevent thinking tokens from consuming output budget
          ...(isQwen3Model ? { reasoning_effort: 'none' as const } : {}),
        });

        let content = response.choices[0]!.message.content!;
        let finishReason = response.choices[0]!.finish_reason;

        // Log prompt and response for monitoring
        const fullInput = `System: ${systemContent}\n\nUser: ${prompt}`;
        await this.logPromptDebug(fullInput, content, {
          promptType,
          promptTemplate,
          provider: this.provider,
          model,
          temperature,
          maxTokens,
          format,
        });

        // Handle truncation by continuing generation (for models with 32k+ context)
        if (finishReason === 'length') {
          logger.warn(
            'Response truncated, attempting continuation',
            {
              model,
              tokensUsed: maxTokens,
            },
            'BabylonLLMClient'
          );

          // Try to continue generation up to 2 more times
          let continuationAttempts = 0;
          const maxContinuations = 2;

          while (
            finishReason === 'length' &&
            continuationAttempts < maxContinuations
          ) {
            continuationAttempts++;

            // Create continuation prompt
            const continuationMessages = [
              ...messages,
              {
                role: 'assistant' as const,
                content: content,
              },
              {
                role: 'user' as const,
                content:
                  'Continue from where you left off. Complete the remaining JSON array entries.',
              },
            ];

            logger.info(
              `Continuation attempt ${continuationAttempts}/${maxContinuations}`,
              {
                contentLength: content.length,
              },
              'BabylonLLMClient'
            );

            const continuationResponse =
              await this.client.chat.completions.create({
                model,
                messages: continuationMessages,
                ...(useJsonFormat ? { response_format: useJsonFormat } : {}),
                temperature,
                max_tokens: maxTokens,
                ...(isQwen3Model ? { reasoning_effort: 'none' as const } : {}),
              });

            const continuationContent =
              continuationResponse.choices[0]!.message.content!;
            finishReason = continuationResponse.choices[0]!.finish_reason;

            // Append continuation to content
            content += continuationContent;

            if (finishReason !== 'length') {
              logger.info(
                'Continuation successful',
                {
                  attempts: continuationAttempts,
                  finalLength: content.length,
                },
                'BabylonLLMClient'
              );
              break;
            }
          }

          // If still truncated after max continuations, throw error
          if (finishReason === 'length') {
            throw new Error(
              `Response truncated at ${maxTokens} tokens after ${continuationAttempts} continuation attempts.`
            );
          }
        }

        // Parse based on requested format
        if (format === 'xml') {
          // Use XML parser (more robust, handles malformed content better)
          const xmlResult = parseXML(content);

          if (!xmlResult.success) {
            throw new Error(`Failed to parse XML: ${xmlResult.error}`);
          }

          logger.debug(
            'Successfully parsed XML response',
            {
              hasData: xmlResult.data !== null,
              isArray: Array.isArray(xmlResult.data),
            },
            'BabylonLLMClient'
          );

          // Log parsed output for monitoring
          await this.logParsedOutput(xmlResult.data, promptType);

          return xmlResult.data as T;
        }
        // Use JSON parser
        // If we had a continuation, use the advanced parser
        if (content.includes('Continue from where you left off')) {
          const parsed = parseContinuationContent(content);
          if (parsed !== null) {
            logger.info(
              'Successfully parsed continuation content',
              {
                isArray: Array.isArray(parsed),
                items: Array.isArray(parsed) ? parsed.length : 'N/A',
              },
              'BabylonLLMClient'
            );
            return parsed as T;
          }
          logger.error(
            'Failed to parse continuation content, attempting fallback',
            {
              contentPreview: content.substring(0, 200),
            },
            'BabylonLLMClient'
          );
        }

        // Standard JSON parsing for non-continuation responses
        let jsonContent = cleanMarkdownCodeBlocks(content);
        jsonContent = extractJsonFromText(jsonContent);

        const parsed: Record<string, JsonValue> = JSON.parse(jsonContent);

        if (schema && !this.validateSchema(parsed, schema)) {
          throw new Error(
            `Response does not match schema. Missing required fields: ${schema.required?.join(', ')}`
          );
        }

        // Log parsed output for monitoring
        await this.logParsedOutput(parsed, promptType);

        return parsed as T;
      } catch (error: unknown) {
        const err = error as {
          status?: number;
          message?: string;
          headers?: Headers;
        };
        const isTestEnv =
          process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test';

        // Handle 429 rate limit errors
        const isRateLimitError =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('rate_limit');

        if (isRateLimitError) {
          // In test environments, fail fast - don't retry rate limits
          if (isTestEnv) {
            logger.warn(
              'Rate limit hit (429) in test environment - failing fast',
              {
                error: err.message,
              },
              'BabylonLLMClient'
            );
            throw error;
          }

          // In production, retry with backoff
          if (retryCount < maxRetries) {
            retryCount++;

            // Try to get retry-after from headers, default to exponential backoff
            let delay = initialDelayMs * 2 ** (retryCount - 1);

            // Check for retry-after header
            const retryAfter = err.headers?.get?.('retry-after');
            if (retryAfter) {
              const retryAfterSeconds = Number.parseInt(retryAfter, 10);
              if (!isNaN(retryAfterSeconds)) {
                delay = (retryAfterSeconds + 1) * 1000; // Add 1 second buffer
              }
            }

            // Cap at 30 seconds for rate limits
            delay = Math.min(delay, 30000);

            logger.warn(
              `Rate limit hit (429), retrying in ${delay}ms...`,
              {
                attempt: retryCount,
                maxRetries,
                retryAfterHeader: retryAfter || 'not provided',
                delay,
              },
              'BabylonLLMClient'
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // Handle 502/503/504 service errors with exponential backoff
        if (
          retryCount < maxRetries &&
          (err?.status === 502 ||
            err?.status === 503 ||
            err?.status === 504 ||
            err?.message?.includes('502') ||
            err?.message?.includes('503') ||
            err?.message?.includes('service_unavailable'))
        ) {
          retryCount++;
          // Faster retries in test environments
          const baseDelay = isTestEnv ? 500 : initialDelayMs;
          const delay = baseDelay * 2 ** (retryCount - 1);

          logger.warn(
            `LLM Service Error (${err.status || 'unknown'}), retrying in ${delay}ms...`,
            {
              attempt: retryCount,
              maxRetries,
              error: err.message,
            },
            'BabylonLLMClient'
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Re-throw if not a retryable error or retries exhausted
        throw error;
      }
    }
  }

  /**
   * Log parsed output for monitoring and analysis
   */
  private async logParsedOutput(
    data: JsonValue,
    promptType: string
  ): Promise<void> {
    try {
      if (!isPromptLoggingEnabled()) {
        return;
      }

      // Parsed output is logged via the main flow
      // This provides additional structured data for monitoring
      logger.debug(
        'Parsed LLM output',
        {
          promptType,
          dataType: Array.isArray(data) ? 'array' : typeof data,
        },
        'BabylonLLMClient'
      );
    } catch {
      // Ignore logging errors
    }
  }

  /**
   * Log prompt and response for monitoring and analysis
   */
  private async logPromptDebug(
    input: string,
    output: string,
    metadata: {
      promptType?: string;
      promptTemplate?: string;
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      format?: string;
    }
  ): Promise<void> {
    try {
      if (!isPromptLoggingEnabled()) {
        return;
      }

      await logPrompt({
        promptType: metadata.promptType || 'unknown',
        promptTemplate: metadata.promptTemplate,
        input,
        output,
        metadata: {
          provider: metadata.provider,
          model: metadata.model,
          temperature: metadata.temperature,
          maxTokens: metadata.maxTokens,
          format: metadata.format,
        },
      });
    } catch (error) {
      // Logging failure should not break generation
      logger.debug('Failed to log prompt debug', { error }, 'BabylonLLMClient');
    }
  }

  /**
   * Simple schema validation
   */
  private validateSchema(
    data: Record<string, JsonValue>,
    schema: JSONSchema
  ): boolean {
    // Basic validation - check required fields exist
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          logger.error(
            `Missing required field: ${field}`,
            undefined,
            'BabylonLLMClient'
          );
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get the default model for the current provider
   */
  private getDefaultModel(): string {
    switch (this.provider) {
      case 'groq':
        // Use qwen3-32b as workhorse model for most operations
        return 'qwen/qwen3-32b';
      case 'claude':
        return 'claude-sonnet-4-5';
      case 'openai':
        return 'gpt-5-nano';
      default:
        return 'gpt-5-nano';
    }
  }

  /**
   * Get current provider information
   */
  getProvider(): LLMProvider {
    return this.provider;
  }

  getStats() {
    return {
      provider: this.provider,
      model: this.getDefaultModel(),
      totalTokens: 0,
      totalCost: 0,
    };
  }
}
