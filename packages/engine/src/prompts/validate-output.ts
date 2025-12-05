/**
 * Output Validation Utilities
 *
 * Validates generated feed content to ensure it follows all rules:
 * - No real names (only parody names)
 * - No hashtags
 * - No emojis
 * - Character limits respected
 */

import { getForbiddenRealNames } from './world-context';

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * Forbidden real-name patterns that should NEVER appear in generated content.
 * These patterns catch common variations and misspellings.
 */
const FORBIDDEN_PATTERNS = [
  // OpenAI variations
  /\bopenai\b/i,
  /\bopen\s*ai\b/i,
  /\bopen-ai\b/i,
  /\bopen_ai\b/i,

  // People
  /\belon\s*musk\b/i,
  /\bsam\s*altman\b/i,
  /\bmark\s*zuckerberg\b/i,
  /\bjeff\s*bezos\b/i,
  /\bbill\s*gates\b/i,
  /\bsteve\s*jobs\b/i,
  /\btim\s*cook\b/i,
  /\bsatya\s*nadella\b/i,
  /\bsundar\s*pichai\b/i,
  /\bjensen\s*huang\b/i,
  /\bvitalik\s*buterin\b/i,

  // Companies (exact matches with word boundaries)
  /\bmeta\s*platforms\b/i,
  /\bfacebook\s*inc\b/i,
  /\bmicrosoft\s*corp/i,
  /\bgoogle\s*llc/i,
  /\bamazon\s*com/i,
  /\bapple\s*inc/i,
  /\btesla\s*inc/i,
  /\banthropic\s*ai/i,
  /\bnvidia\s*corp/i,
];

/**
 * Validates that text doesn't contain real names
 */
export function validateNoRealNames(text: string): string[] {
  const violations: string[] = [];

  // Pattern-based detection (catches variations and common misspellings)
  FORBIDDEN_PATTERNS.forEach((pattern) => {
    const match = pattern.exec(text);
    if (match) {
      violations.push(
        `FORBIDDEN: Contains real-name pattern "${match[0]}" (matched by ${pattern})`
      );
    }
  });

  // Original exact-match detection from database
  const forbiddenNames = getForbiddenRealNames();
  forbiddenNames.forEach((realName: string) => {
    // Case insensitive check to catch variations
    const regex = new RegExp(`\\b${escapeRegex(realName)}\\b`, 'i');
    if (regex.test(text)) {
      violations.push(`FORBIDDEN: Contains real name "${realName}"`);
    }
  });

  return violations;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates hashtag usage - allows rare/limited hashtags
 * @param text - The text to validate
 * @param maxAllowed - Maximum hashtags allowed (default 0 for strict mode, 2 for lenient)
 */
export function validateHashtags(
  text: string,
  maxAllowed: number = 0
): string[] {
  const violations: string[] = [];
  const hashtagRegex = /#\w+/g;
  const hashtags = text.match(hashtagRegex);

  if (hashtags && hashtags.length > maxAllowed) {
    if (maxAllowed === 0) {
      violations.push(`FORBIDDEN: Contains hashtags: ${hashtags.join(', ')}`);
    } else {
      violations.push(
        `EXCESSIVE: Contains ${hashtags.length} hashtags (max: ${maxAllowed}): ${hashtags.join(', ')}`
      );
    }
  }

  return violations;
}

/**
 * Legacy function for strict no-hashtag validation
 * @deprecated Use validateHashtags with maxAllowed=0
 */
export function validateNoHashtags(text: string): string[] {
  return validateHashtags(text, 0);
}

/**
 * Validates that text doesn't contain emojis
 */
export function validateNoEmojis(text: string): string[] {
  const violations: string[] = [];
  // Regex to match most common emoji ranges
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
  const emojis = text.match(emojiRegex);

  if (emojis && emojis.length > 0) {
    violations.push(`FORBIDDEN: Contains emojis: ${emojis.join(' ')}`);
  }

  return violations;
}

/**
 * Validates character count
 */
export function validateCharacterLimit(
  text: string,
  maxLength: number,
  postType: string
): string[] {
  const violations: string[] = [];

  if (text.length > maxLength) {
    violations.push(
      `EXCEEDED: ${postType} is ${text.length} chars (max: ${maxLength})`
    );
  }

  return violations;
}

/**
 * Comprehensive validation of feed post content
 */
export function validateFeedPost(
  text: string,
  options: {
    maxLength: number;
    postType: string;
  }
): ValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Critical validations (must pass)
  violations.push(...validateNoRealNames(text));
  violations.push(...validateNoHashtags(text));
  violations.push(...validateNoEmojis(text));
  violations.push(
    ...validateCharacterLimit(text, options.maxLength, options.postType)
  );

  // Warnings (should pass but not critical)
  if (text.length < 20) {
    warnings.push(`Post is very short (${text.length} chars)`);
  }

  // Parody names are CORRECT - no need to check for them
  // The real name detection above handles incorrect real names

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Character limits by post type
 */
export const CHARACTER_LIMITS = {
  AMBIENT: 280,
  JOURNALIST: 280,
  COMPANY: 140,
  GOVERNMENT: 140,
  REPLY: 140,
  REACTION: 140,
  COMMENTARY: 140,
  MEDIA: 140,
  CONSPIRACY: 140,
  EXPERT: 140,
  MINUTE_AMBIENT: 200,
  STOCK_TICKER: 150,
  ANALYST: 250,
} as const;

/**
 * Validate a batch of posts
 */
export function validatePostBatch(
  posts: Array<{ post: string; type: keyof typeof CHARACTER_LIMITS }>
): {
  allValid: boolean;
  results: Array<ValidationResult & { post: string }>;
} {
  const results = posts.map(({ post, type }) => ({
    post,
    ...validateFeedPost(post, {
      maxLength: CHARACTER_LIMITS[type],
      postType: type,
    }),
  }));

  return {
    allValid: results.every((r) => r.isValid),
    results,
  };
}

/**
 * Validate article content (title, summary, body)
 * Articles have different rules than posts:
 * - Longer content allowed
 * - No hashtags in title/summary
 * - Real name detection still applies
 */
export function validateArticle(article: {
  title: string;
  summary: string;
  content: string;
}): ValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Validate title
  const titleRealNames = validateNoRealNames(article.title);
  if (titleRealNames.length > 0) {
    violations.push(`TITLE: ${titleRealNames.join(', ')}`);
  }
  const titleHashtags = validateHashtags(article.title, 0);
  if (titleHashtags.length > 0) {
    violations.push(`TITLE: ${titleHashtags.join(', ')}`);
  }

  // Validate summary
  const summaryRealNames = validateNoRealNames(article.summary);
  if (summaryRealNames.length > 0) {
    violations.push(`SUMMARY: ${summaryRealNames.join(', ')}`);
  }
  const summaryHashtags = validateHashtags(article.summary, 0);
  if (summaryHashtags.length > 0) {
    violations.push(`SUMMARY: ${summaryHashtags.join(', ')}`);
  }

  // Validate content
  const contentRealNames = validateNoRealNames(article.content);
  if (contentRealNames.length > 0) {
    violations.push(`CONTENT: ${contentRealNames.join(', ')}`);
  }

  // Warnings for short content
  if (article.title.length < 10) {
    warnings.push(`Title is very short (${article.title.length} chars)`);
  }
  if (article.summary.length < 50) {
    warnings.push(`Summary is very short (${article.summary.length} chars)`);
  }
  if (article.content.length < 200) {
    warnings.push(`Content is very short (${article.content.length} chars)`);
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Example usage:
 *
 * const result = validateFeedPost(generatedPost, {
 *   maxLength: CHARACTER_LIMITS.AMBIENT,
 *   postType: 'AMBIENT'
 * });
 *
 * if (!result.isValid) {
 *   console.error('Validation failed:', result.violations);
 *   // Regenerate or reject the post
 * }
 *
 * if (result.warnings.length > 0) {
 *   console.warn('Warnings:', result.warnings);
 * }
 */
