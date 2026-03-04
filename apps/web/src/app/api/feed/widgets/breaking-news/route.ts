/**
 * Breaking News Widget API
 *
 * @route GET /api/feed/widgets/breaking-news - Get breaking news items
 * @access Public (optional authentication for RLS)
 *
 * @description
 * Returns breaking news items including world events, organization price updates,
 * and news-worthy posts from actors. Aggregates multiple data sources with
 * trending indicators and time-based filtering.
 *
 * @example
 * ```typescript
 * const { news } = await fetch('/api/feed/widgets/breaking-news?limit=10')
 *   .then(r => r.json());
 * ```
 */

import { optionalAuth, successResponse, withErrorHandling } from '@babylon/api';
import {
  and,
  asPublic,
  asUser,
  desc,
  eq,
  inArray,
  isNull,
  lte,
  notInArray,
  organizationState,
  posts,
  stockPrices,
  worldEvents,
} from '@babylon/db';
import { StaticDataRegistry } from '@babylon/engine';
import {
  BreakingNewsQuerySchema,
  FEED_WIDGET_CONFIG,
  logger,
} from '@babylon/shared';
import type { NextRequest } from 'next/server';

interface BreakingNewsItem {
  id: string;
  title: string;
  description: string;
  icon: 'chart' | 'calendar' | 'dollar' | 'trending';
  timestamp: string;
  trending?: boolean;
  source?: string;
  fullDescription?: string;
  imageUrl?: string; // Actor profile image or organization logo
  relatedQuestion?: number;
  relatedActorId?: string;
  relatedOrganizationId?: string;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    limit: searchParams.get('limit') || '5',
    category: searchParams.get('category'),
  };
  BreakingNewsQuerySchema.parse(queryParams);

  // Optional auth - breaking news is public but RLS still applies
  const authUser = await optionalAuth(request).catch(() => null);

  // Get all breaking news data with RLS
  const newsItems: BreakingNewsItem[] =
    authUser && authUser.userId
      ? await asUser(authUser, async (db) => {
          const items: BreakingNewsItem[] = [];
          const currentTime = new Date(); // Single timestamp for all queries in this scope

          // 1. Get recent significant world events - dynamically determine event types from database
          // First, get all unique event types that exist in the database
          // Get unique event types - query all and deduplicate
          const allEventTypesRaw = await db
            .select({ eventType: worldEvents.eventType })
            .from(worldEvents)
            .limit(1000); // Get more to ensure we have enough unique types

          const uniqueEventTypesSet = new Set(
            allEventTypesRaw.map((e) => e.eventType).filter(Boolean)
          );
          const availableEventTypes = Array.from(uniqueEventTypesSet)
            .map((e) => e.toLowerCase())
            .slice(0, 50);

          // Get recent events, filtering for news-worthy types dynamically
          // Only show events up to current time (prevent future access)
          const recentEvents = await db
            .select()
            .from(worldEvents)
            .where(
              and(
                eq(worldEvents.visibility, 'public'), // Only show public events
                lte(worldEvents.timestamp, currentTime) // ✅ No future events
              )
            )
            .orderBy(desc(worldEvents.timestamp))
            .limit(FEED_WIDGET_CONFIG.MAX_WORLD_EVENTS_QUERY);

          // Filter for significant events - use actual event types from database
          const significantEvents = recentEvents
            .filter((event) => {
              const eventType = event.eventType.toLowerCase();
              // Include events that are likely news-worthy based on type
              const newsWorthyTypes = [
                'announcement',
                'development',
                'scandal',
                'deal',
                'meeting',
                'news:published',
                'leak',
                'revelation',
                'conflict',
                'development:occurred',
              ];
              return newsWorthyTypes.some(
                (type) =>
                  eventType.includes(type) ||
                  availableEventTypes.includes(eventType)
              );
            })
            .slice(0, 5); // Get more to ensure we have content

          for (const event of significantEvents) {
            const description = event.description || 'Event occurred';

            let icon: 'chart' | 'calendar' | 'dollar' | 'trending' = 'trending';
            if (event.eventType.toLowerCase().includes('meeting')) {
              icon = 'calendar';
            } else if (
              event.eventType.toLowerCase().includes('deal') ||
              event.eventType.toLowerCase().includes('earnings')
            ) {
              icon = 'dollar';
            } else if (
              event.eventType.toLowerCase().includes('development') ||
              event.eventType.toLowerCase().includes('announcement')
            ) {
              icon = 'trending';
            }

            const eventDate = new Date(event.timestamp);
            const trendingThreshold =
              FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
            const isTrending =
              eventDate.getTime() > Date.now() - trendingThreshold;

            let imageUrl: string | undefined;
            const firstActorId =
              event.actors && event.actors.length > 0
                ? event.actors[0]
                : undefined;
            if (firstActorId) {
              const actor = StaticDataRegistry.getActor(firstActorId);
              imageUrl = actor?.profileImageUrl || undefined;
            }

            items.push({
              id: event.id,
              title:
                description.length > 50
                  ? description.substring(0, 47) + '...'
                  : description,
              description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
              icon,
              timestamp: eventDate.toISOString(),
              trending: isTrending,
              source: event.relatedQuestion
                ? `World Event (Related to Question #${event.relatedQuestion})`
                : 'World Event',
              fullDescription:
                description +
                (event.relatedQuestion
                  ? `\n\nRelated to Prediction Market Question #${event.relatedQuestion}`
                  : ''),
              imageUrl,
              relatedQuestion: event.relatedQuestion || undefined,
              relatedActorId:
                event.actors && event.actors.length > 0
                  ? event.actors[0]
                  : undefined,
            });
          }

          // 2. Get organization price updates (any significant changes, not just ATHs)
          const priceUpdatesRaw = await db
            .select()
            .from(stockPrices)
            .orderBy(desc(stockPrices.timestamp))
            .limit(FEED_WIDGET_CONFIG.MAX_PRICE_UPDATES_QUERY);

          const orgStates = await db.select().from(organizationState);
          const orgStateMap = new Map(orgStates.map((s) => [s.id, s]));

          const priceUpdates = priceUpdatesRaw.map((stockPrice) => {
            const staticOrg = StaticDataRegistry.getOrganization(
              stockPrice.organizationId
            );
            const orgState = orgStateMap.get(stockPrice.organizationId);
            return {
              ...stockPrice,
              organization: staticOrg
                ? {
                    id: staticOrg.id,
                    name: staticOrg.name,
                    currentPrice: orgState?.currentPrice ?? null,
                    type: staticOrg.type,
                  }
                : null,
            };
          });

          // Find any price changes using configurable thresholds
          const significantPriceUpdates = priceUpdates
            .filter((update) => {
              if (!update.organization) return false;
              const changePercent = update.changePercent || 0;
              // Use configurable thresholds
              return (
                Math.abs(changePercent) >=
                  FEED_WIDGET_CONFIG.SIGNIFICANT_PRICE_CHANGE_PERCENT ||
                (changePercent > 0 &&
                  update.changePercent &&
                  update.changePercent >=
                    FEED_WIDGET_CONFIG.MIN_PRICE_CHANGE_PERCENT)
              );
            })
            .slice(0, 3);

          for (const update of significantPriceUpdates) {
            if (!update.organization) continue;

            const org = update.organization;
            const price = org.currentPrice || update.price || 0;
            const changePercent = update.changePercent || 0;
            const isATH =
              changePercent >= FEED_WIDGET_CONFIG.ATH_THRESHOLD_PERCENT &&
              update.changePercent &&
              update.changePercent > 0;

            const priceTrendingThreshold =
              FEED_WIDGET_CONFIG.PRICE_TRENDING_HOURS * 60 * 60 * 1000;
            const isTrending =
              new Date(update.timestamp).getTime() >
              Date.now() - priceTrendingThreshold;
            const fullDesc = `Stock price update for ${org.name || org.id}. Current price: $${price.toFixed(2)}. ${changePercent > 0 ? 'Up' : 'Down'} ${Math.abs(changePercent).toFixed(2)}% from previous price.${isATH ? ' This represents a new all-time high for the organization.' : ''}`;

            items.push({
              id: `price-${update.id}`,
              title: isATH
                ? `${org.name || org.id} reaches new ATH`
                : `${org.name || org.id} ${changePercent > 0 ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(1)}%`,
              description: `Trading at $${price.toFixed(2)} • ${getTimeAgo(update.timestamp)}${isTrending ? ' • Trending' : ''}`,
              icon: 'chart',
              timestamp: update.timestamp.toISOString(),
              trending: isTrending,
              source: 'Stock Price Update',
              fullDescription: fullDesc,
              relatedOrganizationId: org.id,
            });
          }

          // 3. Get recent posts from actors (broader criteria for news-worthy content)
          const allActors = StaticDataRegistry.getAllActors();
          const actorIds = new Set(allActors.map((a) => a.id));

          const recentPosts = await db
            .select()
            .from(posts)
            .where(
              and(isNull(posts.deletedAt), lte(posts.timestamp, currentTime))
            )
            .orderBy(desc(posts.timestamp))
            .limit(FEED_WIDGET_CONFIG.MAX_POSTS_QUERY);

          const actorPostIds = recentPosts
            .filter((post) => actorIds.has(post.authorId))
            .map((post) => post.authorId);

          const actorsMap = new Map(
            Array.from(new Set(actorPostIds))
              .map((id) => StaticDataRegistry.getActor(id))
              .filter((a): a is NonNullable<typeof a> => a !== null)
              .map((a) => [
                a.id,
                { id: a.id, name: a.name, profileImageUrl: a.profileImageUrl },
              ])
          );

          // Broader filter for news-worthy posts from actors
          const newsPosts = recentPosts
            .filter((post) => {
              if (!actorIds.has(post.authorId)) return false;
              const actor = actorsMap.get(post.authorId);
              if (!actor) return false;
              const content = post.content.toLowerCase();
              // More keywords that indicate news
              const isNewsy =
                content.includes('announces') ||
                content.includes('launches') ||
                content.includes('reveals') ||
                content.includes('earnings') ||
                content.includes('partnership') ||
                content.includes('acquisition') ||
                content.includes('meeting') ||
                content.includes('summit') ||
                content.includes('deal') ||
                content.includes('launch') ||
                content.includes('release') ||
                content.includes('breaking') ||
                content.includes('ath') ||
                content.includes('all-time high') ||
                content.includes('trading at') ||
                content.includes('scheduled') ||
                content.includes('reports') ||
                content.includes('revealed');

              return isNewsy;
            })
            .slice(0, 5); // Get more posts

          for (const post of newsPosts) {
            const actor = actorsMap.get(post.authorId);
            if (!actor) continue;
            const actorName = actor.name;

            const content = post.content;
            const title =
              content.length > 50 ? content.substring(0, 47) + '...' : content;
            const eventDate = new Date(post.timestamp);
            const postTrendingThreshold =
              FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
            const isTrending =
              eventDate.getTime() > Date.now() - postTrendingThreshold;

            items.push({
              id: post.id,
              title,
              description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
              icon: 'trending',
              timestamp: eventDate.toISOString(),
              trending: isTrending,
              source: `Post by ${actorName}`,
              fullDescription: content,
              imageUrl: actor.profileImageUrl || undefined,
              relatedActorId: actor.id,
            });
          }

          // 4. Fallback: If we don't have enough items, get ANY recent posts from actors
          // Only show posts up to current time (prevent future access)
          if (items.length < FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS) {
            const excludeIds = items.map((item) => item.id);
            const whereConditions = [
              lte(posts.timestamp, currentTime), // ✅ No future posts
              inArray(posts.authorId, Array.from(actorIds)), // Only actor posts
              isNull(posts.deletedAt), // Filter out deleted posts
            ];

            if (excludeIds.length > 0) {
              whereConditions.push(notInArray(posts.id, excludeIds));
            }

            const fallbackPosts = await db
              .select()
              .from(posts)
              .where(and(...whereConditions))
              .orderBy(desc(posts.timestamp))
              .limit(20);

            for (const post of fallbackPosts) {
              if (items.length >= FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS)
                break;
              const actor = actorsMap.get(post.authorId);
              if (!actor) continue;

              const actorName = actor.name;
              const content = post.content;
              const title =
                content.length > 50
                  ? content.substring(0, 47) + '...'
                  : content;
              const eventDate = new Date(post.timestamp);
              const fallbackTrendingThreshold =
                FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
              const isTrending =
                eventDate.getTime() > Date.now() - fallbackTrendingThreshold;

              items.push({
                id: post.id,
                title,
                description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
                icon: 'trending',
                timestamp: eventDate.toISOString(),
                trending: isTrending,
                source: `Post by ${actorName}`,
                fullDescription: content,
                imageUrl: actor.profileImageUrl || undefined,
                relatedActorId: actor.id,
              });
            }
          }

          // 5. Final fallback: Get ANY recent world events if still not enough
          // Only show events up to current time (prevent future access)
          if (items.length < FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS) {
            const allRecentEvents = await db
              .select()
              .from(worldEvents)
              .where(lte(worldEvents.timestamp, currentTime)) // ✅ No future events
              .orderBy(desc(worldEvents.timestamp))
              .limit(10);

            for (const event of allRecentEvents) {
              if (items.length >= FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS)
                break;

              // Skip if already included
              if (items.some((item) => item.id === event.id)) continue;

              const description = event.description || 'Game event occurred';

              const eventDate = new Date(event.timestamp);
              const finalFallbackTrendingThreshold =
                FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
              const isTrending =
                eventDate.getTime() >
                Date.now() - finalFallbackTrendingThreshold;

              items.push({
                id: event.id,
                title:
                  description.length > 50
                    ? description.substring(0, 47) + '...'
                    : description,
                description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
                icon: 'trending',
                timestamp: eventDate.toISOString(),
                trending: isTrending,
                source: 'World Event',
                fullDescription: description,
              });
            }
          }

          // Sort by timestamp (most recent first) and take top N
          const sortedNews = items
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .slice(0, FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS);

          return sortedNews;
        })
      : await asPublic(async (db) => {
          // Same logic for public access
          const items: BreakingNewsItem[] = [];
          const currentTime = new Date(); // Single timestamp for all queries in this scope

          // 1. Get recent significant world events - dynamically determine event types from database
          // First, get all unique event types that exist in the database
          // Get unique event types - query all and deduplicate
          const allEventTypesRaw = await db
            .select({ eventType: worldEvents.eventType })
            .from(worldEvents)
            .limit(1000); // Get more to ensure we have enough unique types

          const uniqueEventTypesSet = new Set(
            allEventTypesRaw.map((e) => e.eventType).filter(Boolean)
          );
          const availableEventTypes = Array.from(uniqueEventTypesSet)
            .map((e) => e.toLowerCase())
            .slice(0, 50);

          // Get recent events, filtering for news-worthy types dynamically
          // Only show events up to current time (prevent future access)
          const recentEvents = await db
            .select()
            .from(worldEvents)
            .where(
              and(
                eq(worldEvents.visibility, 'public'), // Only show public events
                lte(worldEvents.timestamp, currentTime) // ✅ No future events
              )
            )
            .orderBy(desc(worldEvents.timestamp))
            .limit(FEED_WIDGET_CONFIG.MAX_WORLD_EVENTS_QUERY);

          // Filter for significant events - use actual event types from database
          const significantEvents = recentEvents
            .filter((event) => {
              const eventType = event.eventType.toLowerCase();
              // Include events that are likely news-worthy based on type
              const newsWorthyTypes = [
                'announcement',
                'development',
                'scandal',
                'deal',
                'meeting',
                'news:published',
                'leak',
                'revelation',
                'conflict',
                'development:occurred',
              ];
              return newsWorthyTypes.some(
                (type) =>
                  eventType.includes(type) ||
                  availableEventTypes.includes(eventType)
              );
            })
            .slice(0, 5); // Get more to ensure we have content

          for (const event of significantEvents) {
            const description = event.description || 'Event occurred';

            let icon: 'chart' | 'calendar' | 'dollar' | 'trending' = 'trending';
            if (event.eventType.toLowerCase().includes('meeting')) {
              icon = 'calendar';
            } else if (
              event.eventType.toLowerCase().includes('deal') ||
              event.eventType.toLowerCase().includes('earnings')
            ) {
              icon = 'dollar';
            } else if (
              event.eventType.toLowerCase().includes('development') ||
              event.eventType.toLowerCase().includes('announcement')
            ) {
              icon = 'trending';
            }

            const eventDate = new Date(event.timestamp);
            const trendingThreshold =
              FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
            const isTrending =
              eventDate.getTime() > Date.now() - trendingThreshold;

            let imageUrl: string | undefined;
            const firstActorId =
              event.actors && event.actors.length > 0
                ? event.actors[0]
                : undefined;
            if (firstActorId) {
              const actor = StaticDataRegistry.getActor(firstActorId);
              imageUrl = actor?.profileImageUrl || undefined;
            }

            items.push({
              id: event.id,
              title:
                description.length > 50
                  ? description.substring(0, 47) + '...'
                  : description,
              description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
              icon,
              timestamp: eventDate.toISOString(),
              trending: isTrending,
              source: event.relatedQuestion
                ? `World Event (Related to Question #${event.relatedQuestion})`
                : 'World Event',
              fullDescription:
                description +
                (event.relatedQuestion
                  ? `\n\nRelated to Prediction Market Question #${event.relatedQuestion}`
                  : ''),
              imageUrl,
              relatedQuestion: event.relatedQuestion || undefined,
              relatedActorId:
                event.actors && event.actors.length > 0
                  ? event.actors[0]
                  : undefined,
            });
          }

          // 2. Get organization price updates (any significant changes, not just ATHs)
          const priceUpdatesRaw = await db
            .select()
            .from(stockPrices)
            .orderBy(desc(stockPrices.timestamp))
            .limit(FEED_WIDGET_CONFIG.MAX_PRICE_UPDATES_QUERY);

          const orgStates = await db.select().from(organizationState);
          const orgStateMap = new Map(orgStates.map((s) => [s.id, s]));

          const priceUpdates = priceUpdatesRaw.map((stockPrice) => {
            const staticOrg = StaticDataRegistry.getOrganization(
              stockPrice.organizationId
            );
            const orgState = orgStateMap.get(stockPrice.organizationId);
            return {
              ...stockPrice,
              organization: staticOrg
                ? {
                    id: staticOrg.id,
                    name: staticOrg.name,
                    currentPrice: orgState?.currentPrice ?? null,
                    type: staticOrg.type,
                  }
                : null,
            };
          });

          // Find any price changes using configurable thresholds
          const significantPriceUpdates = priceUpdates
            .filter((update) => {
              if (!update.organization) return false;
              const changePercent = update.changePercent || 0;
              // Use configurable thresholds
              return (
                Math.abs(changePercent) >=
                  FEED_WIDGET_CONFIG.SIGNIFICANT_PRICE_CHANGE_PERCENT ||
                (changePercent > 0 &&
                  update.changePercent &&
                  update.changePercent >=
                    FEED_WIDGET_CONFIG.MIN_PRICE_CHANGE_PERCENT)
              );
            })
            .slice(0, 3);

          for (const update of significantPriceUpdates) {
            if (!update.organization) continue;

            const org = update.organization;
            const price = org.currentPrice || update.price || 0;
            const changePercent = update.changePercent || 0;
            const isATH =
              changePercent >= FEED_WIDGET_CONFIG.ATH_THRESHOLD_PERCENT &&
              update.changePercent &&
              update.changePercent > 0;

            const priceTrendingThreshold =
              FEED_WIDGET_CONFIG.PRICE_TRENDING_HOURS * 60 * 60 * 1000;
            const isTrending =
              new Date(update.timestamp).getTime() >
              Date.now() - priceTrendingThreshold;
            const fullDesc = `Stock price update for ${org.name || org.id}. Current price: $${price.toFixed(2)}. ${changePercent > 0 ? 'Up' : 'Down'} ${Math.abs(changePercent).toFixed(2)}% from previous price.${isATH ? ' This represents a new all-time high for the organization.' : ''}`;

            items.push({
              id: `price-${update.id}`,
              title: isATH
                ? `${org.name || org.id} reaches new ATH`
                : `${org.name || org.id} ${changePercent > 0 ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(1)}%`,
              description: `Trading at $${price.toFixed(2)} • ${getTimeAgo(update.timestamp)}${isTrending ? ' • Trending' : ''}`,
              icon: 'chart',
              timestamp: update.timestamp.toISOString(),
              trending: isTrending,
              source: 'Stock Price Update',
              fullDescription: fullDesc,
              relatedOrganizationId: org.id,
            });
          }

          // 3. Get recent posts from actors (broader criteria for news-worthy content)
          const allActors = StaticDataRegistry.getAllActors();
          const actorIds = new Set(allActors.map((a) => a.id));

          const recentPosts = await db
            .select()
            .from(posts)
            .where(
              and(isNull(posts.deletedAt), lte(posts.timestamp, currentTime))
            )
            .orderBy(desc(posts.timestamp))
            .limit(FEED_WIDGET_CONFIG.MAX_POSTS_QUERY);

          const actorPostIds = recentPosts
            .filter((post) => actorIds.has(post.authorId))
            .map((post) => post.authorId);

          const actorsMap = new Map(
            Array.from(new Set(actorPostIds))
              .map((id) => StaticDataRegistry.getActor(id))
              .filter((a): a is NonNullable<typeof a> => a !== null)
              .map((a) => [
                a.id,
                { id: a.id, name: a.name, profileImageUrl: a.profileImageUrl },
              ])
          );

          // Broader filter for news-worthy posts from actors
          const newsPosts = recentPosts
            .filter((post) => {
              if (!actorIds.has(post.authorId)) return false;
              const actor = actorsMap.get(post.authorId);
              if (!actor) return false;
              const content = post.content.toLowerCase();
              // More keywords that indicate news
              const isNewsy =
                content.includes('announces') ||
                content.includes('launches') ||
                content.includes('reveals') ||
                content.includes('earnings') ||
                content.includes('partnership') ||
                content.includes('acquisition') ||
                content.includes('meeting') ||
                content.includes('summit') ||
                content.includes('deal') ||
                content.includes('launch') ||
                content.includes('release') ||
                content.includes('breaking') ||
                content.includes('ath') ||
                content.includes('all-time high') ||
                content.includes('trading at') ||
                content.includes('scheduled') ||
                content.includes('reports') ||
                content.includes('revealed');

              return isNewsy;
            })
            .slice(0, 5); // Get more posts

          for (const post of newsPosts) {
            const actor = actorsMap.get(post.authorId);
            if (!actor) continue;
            const actorName = actor.name;

            const content = post.content;
            const title =
              content.length > 50 ? content.substring(0, 47) + '...' : content;
            const eventDate = new Date(post.timestamp);
            const postTrendingThreshold =
              FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
            const isTrending =
              eventDate.getTime() > Date.now() - postTrendingThreshold;

            items.push({
              id: post.id,
              title,
              description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
              icon: 'trending',
              timestamp: eventDate.toISOString(),
              trending: isTrending,
              source: `Post by ${actorName}`,
              fullDescription: content,
              imageUrl: actor.profileImageUrl || undefined,
              relatedActorId: actor.id,
            });
          }

          // 4. Fallback: If we don't have enough items, get ANY recent posts from actors
          // Only show posts up to current time (prevent future access)
          if (items.length < FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS) {
            const excludeIds = items.map((item) => item.id);
            const whereConditions = [
              lte(posts.timestamp, currentTime), // ✅ No future posts
              inArray(posts.authorId, Array.from(actorIds)), // Only actor posts
              isNull(posts.deletedAt), // Filter out deleted posts
            ];

            if (excludeIds.length > 0) {
              whereConditions.push(notInArray(posts.id, excludeIds));
            }

            const fallbackPosts = await db
              .select()
              .from(posts)
              .where(and(...whereConditions))
              .orderBy(desc(posts.timestamp))
              .limit(20);

            for (const post of fallbackPosts) {
              if (items.length >= FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS)
                break;
              const actor = actorsMap.get(post.authorId);
              if (!actor) continue;

              const actorName = actor.name;
              const content = post.content;
              const title =
                content.length > 50
                  ? content.substring(0, 47) + '...'
                  : content;
              const eventDate = new Date(post.timestamp);
              const fallbackTrendingThreshold =
                FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
              const isTrending =
                eventDate.getTime() > Date.now() - fallbackTrendingThreshold;

              items.push({
                id: post.id,
                title,
                description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
                icon: 'trending',
                timestamp: eventDate.toISOString(),
                trending: isTrending,
                source: `Post by ${actorName}`,
                fullDescription: content,
                imageUrl: actor.profileImageUrl || undefined,
                relatedActorId: actor.id,
              });
            }
          }

          // 5. Final fallback: Get ANY recent world events if still not enough
          // Only show events up to current time (prevent future access)
          if (items.length < FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS) {
            const allRecentEvents = await db
              .select()
              .from(worldEvents)
              .where(lte(worldEvents.timestamp, currentTime)) // ✅ No future events
              .orderBy(desc(worldEvents.timestamp))
              .limit(10);

            for (const event of allRecentEvents) {
              if (items.length >= FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS)
                break;

              // Skip if already included
              if (items.some((item) => item.id === event.id)) continue;

              const description = event.description || 'Game event occurred';

              const eventDate = new Date(event.timestamp);
              const finalFallbackTrendingThreshold =
                FEED_WIDGET_CONFIG.TRENDING_HOURS * 60 * 60 * 1000;
              const isTrending =
                eventDate.getTime() >
                Date.now() - finalFallbackTrendingThreshold;

              items.push({
                id: event.id,
                title:
                  description.length > 50
                    ? description.substring(0, 47) + '...'
                    : description,
                description: `${getTimeAgo(eventDate)}${isTrending ? ' • Trending' : ''}`,
                icon: 'trending',
                timestamp: eventDate.toISOString(),
                trending: isTrending,
                source: 'World Event',
                fullDescription: description,
              });
            }
          }

          // Sort by timestamp (most recent first) and take top N
          const sortedNews = items
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .slice(0, FEED_WIDGET_CONFIG.MAX_BREAKING_NEWS_ITEMS);

          return sortedNews;
        });

  logger.info(
    'Breaking news fetched successfully',
    { count: newsItems.length },
    'GET /api/feed/widgets/breaking-news'
  );

  // Return sorted news (should always have content if game is running)
  return successResponse({
    success: true,
    news: newsItems,
  });
});

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}
