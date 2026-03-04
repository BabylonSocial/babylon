/**
 * World Facts Update Cron Job API
 *
 * @route POST /api/cron/world-facts - Update world facts
 * @access Cron (CRON_SECRET required)
 *
 * @description
 * Scheduled cron job that:
 * 1. Fetches RSS feeds from external news sources
 * 2. Generates parody headlines from real news
 * 3. Cleans up old headlines
 * 4. Generates new world facts from game activity (events, markets, questions, actors)
 *
 * Runs twice daily (6 AM and 6 PM UTC) to keep the world context fresh and prevent
 * content repetition across the game. Max execution time: 300s.
 *
 * @example
 * ```typescript
 * await fetch('/api/cron/world-facts', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
 * });
 * ```
 *
 * @see {@link /lib/services/rss-feed-service} RSS feed service
 * @see {@link /lib/services/parody-headline-generator} Parody headline generator
 */

import {
  requireCronAuth,
  successResponse,
  verifyCronAuth,
  withErrorHandling,
} from '@babylon/api';
import type { ParodyHeadline } from '@babylon/db';
import {
  createParodyHeadlineGenerator,
  rssFeedService,
  worldFactsGenerator,
} from '@babylon/engine';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Vercel function configuration
export const maxDuration = 300; // 5 minutes max

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Security: Verify cron authorization (fail-closed in production)
  requireCronAuth(request, { jobName: 'WorldFactsCron' });

  const startTime = Date.now();
  logger.info('🌍 World facts update started', undefined, 'Cron');

  // Step 1: Fetch all RSS feeds
  let feedResult = { fetched: 0, stored: 0, errors: 0 };
  try {
    logger.info('Fetching RSS feeds...', undefined, 'Cron');
    feedResult = await rssFeedService.fetchAllFeeds();
    logger.info(
      `RSS feeds fetched: ${feedResult.fetched} sources, ${feedResult.stored} new headlines, ${feedResult.errors} errors`,
      feedResult,
      'Cron'
    );
  } catch (error) {
    logger.error('Error fetching RSS feeds', { error }, 'Cron');
  }

  // Step 2: Transform untransformed headlines into parodies
  let parodies: ParodyHeadline[] = [];
  try {
    logger.info('Generating parody headlines...', undefined, 'Cron');
    const untransformedHeadlines =
      await rssFeedService.getUntransformedHeadlines(20); // Process 20 at a time

    const generator = createParodyHeadlineGenerator();
    parodies = await generator.processHeadlines(untransformedHeadlines);
    logger.info(
      `Generated ${parodies.length} parody headlines`,
      { count: parodies.length },
      'Cron'
    );
  } catch (error) {
    logger.error('Error generating parody headlines', { error }, 'Cron');
  }

  // Step 3: Clean up old headlines (older than 7 days)
  let cleaned = 0;
  try {
    logger.info('Cleaning up old headlines...', undefined, 'Cron');
    cleaned = await rssFeedService.cleanupOldHeadlines();
    logger.info(
      `Cleaned up ${cleaned} old headlines`,
      { count: cleaned },
      'Cron'
    );
  } catch (error) {
    logger.error('Error cleaning up old headlines', { error }, 'Cron');
  }

  // Step 4: Generate new world facts from game activity
  // This creates fresh context based on events, markets, questions, and actor activity
  logger.info(
    'Generating new world facts from game activity...',
    undefined,
    'Cron'
  );
  let factsResult = {
    generated: 0,
    archived: 0,
    sources: { events: 0, markets: 0, questions: 0, actors: 0 },
  };
  try {
    factsResult = await worldFactsGenerator.generateNewWorldFacts();
    logger.info(
      `Generated ${factsResult.generated} new world facts, archived ${factsResult.archived}`,
      factsResult,
      'Cron'
    );
  } catch (error) {
    logger.error('Error generating world facts', { error }, 'Cron');
  }

  const duration = Date.now() - startTime;
  logger.info(
    '✅ World facts update completed',
    {
      duration: `${duration}ms`,
      feedsFetched: feedResult.fetched,
      newHeadlines: feedResult.stored,
      parodiesGenerated: parodies.length,
      headlinesCleaned: cleaned,
      worldFactsGenerated: factsResult.generated,
      worldFactsArchived: factsResult.archived,
    },
    'Cron'
  );

  return successResponse({
    success: true,
    duration,
    stats: {
      feedsFetched: feedResult.fetched,
      newHeadlines: feedResult.stored,
      parodiesGenerated: parodies.length,
      headlinesCleaned: cleaned,
      worldFactsGenerated: factsResult.generated,
      worldFactsArchived: factsResult.archived,
      worldFactsSources: factsResult.sources,
    },
  });
});

// GET endpoint for Vercel Cron (some cron services use GET)
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Security: Verify cron authorization (allows Vercel Cron user-agent)
  if (
    !verifyCronAuth(request, {
      jobName: 'WorldFactsCron',
      allowVercelCronUserAgent: true,
    })
  ) {
    logger.warn('Unauthorized GET request to cron endpoint', undefined, 'Cron');
    return NextResponse.json(
      {
        error:
          'Use POST for cron execution. This endpoint is triggered by Vercel Cron',
      },
      { status: 401 }
    );
  }

  logger.info('GET request forwarded to POST handler', undefined, 'Cron');

  // Forward to POST handler
  return POST(request);
});
