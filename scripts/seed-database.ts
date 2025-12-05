#!/usr/bin/env bun

/**
 * Database Seed Script
 *
 * Seeds the database with:
 * - All actors from TypeScript data files (packages/engine/src/data/actors)
 * - All organizations from TypeScript data files (packages/engine/src/data/organizations)
 * - Initial game state
 * - World facts and RSS feeds
 * - Character and organization mappings
 *
 * Usage:
 *   bun run scripts/seed-database.ts          # Seed everything
 *   bun run scripts/seed-database.ts actors   # Seed only actors
 *   bun run scripts/seed-database.ts orgs     # Seed only organizations
 *   bun run scripts/seed-database.ts game     # Initialize game state only
 *   bun run scripts/seed-database.ts feeds    # Seed RSS feeds only
 *   bun run scripts/seed-database.ts mappings # Seed character/org mappings only
 */

import { existsSync } from 'fs';
import { join } from 'path';
import {
  db,
  generateSnowflakeId,
  eq,
  schema,
  sql,
  getRawDrizzle,
  closeDatabase,
} from '@babylon/db';
import { loadActorsData } from '@babylon/engine';
import { logger } from '@babylon/engine';
import type { ActorData, Organization as OrgData } from '@babylon/shared';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map actor domain to category for character mappings
 */
function mapDomainToCategory(domains: string[] | undefined): string {
  if (!domains || domains.length === 0) {
    return 'general';
  }

  // Priority order: crypto > politics > tech > others
  if (domains.includes('crypto')) {
    return 'crypto';
  }
  if (domains.includes('politics') || domains.includes('government')) {
    return 'politics';
  }
  if (domains.includes('tech') || domains.includes('ai') || domains.includes('technology')) {
    return 'tech';
  }

  // Return first domain as fallback
  return domains[0] || 'general';
}

/**
 * Map actor tier to priority number
 */
function mapTierToPriority(tier: string | undefined): number {
  switch (tier) {
    case 'S_TIER':
      return 100;
    case 'A_TIER':
      return 90;
    case 'B_TIER':
      return 80;
    case 'C_TIER':
      return 70;
    default:
      return 50;
  }
}

/**
 * Generate aliases from actor data
 */
function generateAliases(actor: ActorData): string[] {
  const aliases: string[] = [];

  // Add parody last name as alias
  if (actor.lastName) {
    aliases.push(actor.lastName);
  }

  // Add original last name if different from parody last name
  if (actor.originalLastName && actor.originalLastName !== actor.lastName) {
    aliases.push(actor.originalLastName);
  }

  return aliases;
}

/**
 * Map organization type to category
 */
function mapOrgTypeToCategory(orgType: string | undefined): string {
  switch (orgType) {
    case 'company':
      return 'tech';
    case 'media':
      return 'media';
    case 'government':
      return 'government';
    default:
      return 'general';
  }
}

/**
 * Determine organization priority based on name/importance
 */
function getOrganizationPriority(orgName: string, orgType: string | undefined): number {
  // Major tech companies get higher priority
  const majorTechOrgs = ['OpenAGI', 'Meta', 'Google', 'Microsoft', 'Apple', 'Amazon', 'Tesla', 'Twitter', 'Anthropic', 'NVIDIA'];
  if (majorTechOrgs.some(name => orgName.toLowerCase().includes(name.toLowerCase()))) {
    return 100;
  }

  // Major crypto orgs
  const majorCryptoOrgs = ['Binance', 'Coinbase', 'Ethereum'];
  if (majorCryptoOrgs.some(name => orgName.toLowerCase().includes(name.toLowerCase()))) {
    return 90;
  }

  // Major media
  const majorMedia = ['New York Times', 'Washington Post', 'Wall Street Journal', 'CNN', 'Fox News', 'Bloomberg'];
  if (majorMedia.some(name => orgName.toLowerCase().includes(name.toLowerCase()))) {
    return 85;
  }

  // Government orgs
  if (orgType === 'government') {
    return 80;
  }

  // Default priority
  return 70;
}

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedActors(): Promise<number> {
  logger.info('Seeding actors...', undefined, 'SeedDatabase');

  const actorsData = loadActorsData();
  let seeded = 0;
  let updated = 0;

  for (const actor of actorsData.actors) {
    // Check if actor image exists
    const imagePath = join(process.cwd(), 'public', 'images', 'actors', `${actor.id}.jpg`);
    const profileImageUrl = existsSync(imagePath) ? `/images/actors/${actor.id}.jpg` : null;

    // Randomize trading balance based on tier
    let minBalance = 100000;
    let maxBalance = 200000;

    if (actor.tier === 'S_TIER') {
      minBalance = 500000;
      maxBalance = 1000000;
    } else if (actor.tier === 'A_TIER') {
      minBalance = 250000;
      maxBalance = 500000;
    } else if (actor.tier === 'B_TIER') {
      minBalance = 100000;
      maxBalance = 250000;
    }

    const tradingBalance = Math.floor(Math.random() * (maxBalance - minBalance) + minBalance);

    // Check if actor exists
    const existing = await db.actor.findUnique({ where: { id: actor.id } });

    if (existing) {
      await db.actor.update({
        where: { id: actor.id },
        data: {
          name: actor.name,
          description: actor.description || null,
          domain: actor.domain || [],
          personality: actor.personality || null,
          tier: actor.tier || null,
          affiliations: actor.affiliations || [],
          postStyle: actor.postStyle || null,
          postExample: actor.postExample || [],
          profileImageUrl: profileImageUrl || existing.profileImageUrl,
          updatedAt: new Date(),
        },
      });
      updated++;
    } else {
      await db.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          description: actor.description || null,
          domain: actor.domain || [],
          personality: actor.personality || null,
          tier: actor.tier || null,
          affiliations: actor.affiliations || [],
          postStyle: actor.postStyle || null,
          postExample: actor.postExample || [],
          tradingBalance: tradingBalance.toString(),
          reputationPoints: 10000,
          profileImageUrl,
          updatedAt: new Date(),
        },
      });
      seeded++;
    }
  }

  logger.info(`Actors: ${seeded} created, ${updated} updated`, undefined, 'SeedDatabase');
  return seeded;
}

async function seedOrganizations(): Promise<number> {
  logger.info('Seeding organizations...', undefined, 'SeedDatabase');

  const actorsData = loadActorsData();
  let seeded = 0;
  let updated = 0;

  for (const org of actorsData.organizations) {
    // Skip if missing required fields
    if (!org.id || !org.name || !org.type) {
      logger.warn(`Skipping org "${org.id || 'unknown'}" - missing required fields`, undefined, 'SeedDatabase');
      continue;
    }

    // Check if organization image exists
    const orgImagePath = join(process.cwd(), 'public', 'images', 'organizations', `${org.id}.jpg`);
    const imageUrl = existsSync(orgImagePath) ? `/images/organizations/${org.id}.jpg` : null;

    // Check if org exists
    const existing = await db.organization.findUnique({ where: { id: org.id } });

    if (existing) {
      await db.organization.update({
        where: { id: org.id },
        data: {
          name: org.name,
          ticker: org.ticker || null,
          description: org.description || '',
          type: org.type,
          canBeInvolved: org.canBeInvolved !== false,
          initialPrice: org.initialPrice || null,
          currentPrice: org.initialPrice || existing.currentPrice || null,
          imageUrl: imageUrl || existing.imageUrl,
          updatedAt: new Date(),
        },
      });
      updated++;
    } else {
      await db.organization.create({
        data: {
          id: org.id,
          name: org.name,
          ticker: org.ticker || null,
          description: org.description || '',
          type: org.type,
          canBeInvolved: org.canBeInvolved !== false,
          initialPrice: org.initialPrice || null,
          currentPrice: org.initialPrice || null,
          imageUrl,
          updatedAt: new Date(),
        },
      });
      seeded++;
    }
  }

  logger.info(`Organizations: ${seeded} created, ${updated} updated`, undefined, 'SeedDatabase');
  return seeded;
}

async function seedGameState(): Promise<void> {
  logger.info('Initializing game state...', undefined, 'SeedDatabase');

  const drizzle = getRawDrizzle();
  const existingGame = await drizzle.select().from(schema.games).where(eq(schema.games.isContinuous, true)).limit(1);

  if (existingGame.length === 0) {
    const now = new Date();
    const gameId = await generateSnowflakeId();

    await drizzle.insert(schema.games).values({
      id: gameId,
      isContinuous: true,
      isRunning: true,
      currentDate: now,
      currentDay: 1,
      speed: 60000,
      startedAt: now,
      updatedAt: now,
    });

    logger.info('Game state initialized (RUNNING)', undefined, 'SeedDatabase');
  } else {
    const game = existingGame[0];
    if (!game) {
      logger.warn('Game state check returned empty array', undefined, 'SeedDatabase');
      return;
    }
    
    if (!game.isRunning) {
      await drizzle.update(schema.games)
        .set({
          isRunning: true,
          startedAt: game.startedAt || new Date(),
          pausedAt: null,
        })
        .where(eq(schema.games.id, game.id));
      logger.info('Game state updated to RUNNING', undefined, 'SeedDatabase');
    } else {
      logger.info('Game state already exists and is RUNNING', undefined, 'SeedDatabase');
    }
  }
}

async function seedRSSFeeds(): Promise<number> {
  logger.info('Seeding RSS feeds...', undefined, 'SeedDatabase');

  const rssFeeds = [
    {
      name: 'New York Times - Technology',
      feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
      category: 'tech',
    },
    {
      name: 'New York Times - Business',
      feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
      category: 'business',
    },
    {
      name: 'LA Times - Technology',
      feedUrl: 'https://www.latimes.com/business/technology/rss2.0.xml',
      category: 'tech',
    },
    {
      name: 'TechCrunch',
      feedUrl: 'https://techcrunch.com/feed/',
      category: 'tech',
    },
    {
      name: 'Ars Technica',
      feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
      category: 'tech',
    },
    {
      name: 'The Verge',
      feedUrl: 'https://www.theverge.com/rss/index.xml',
      category: 'tech',
    },
    {
      name: 'Wired',
      feedUrl: 'https://www.wired.com/feed/rss',
      category: 'tech',
    },
    {
      name: 'CoinDesk',
      feedUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
      category: 'crypto',
    },
    {
      name: 'Cointelegraph',
      feedUrl: 'https://cointelegraph.com/rss',
      category: 'crypto',
    },
    {
      name: 'BBC - Technology',
      feedUrl: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
      category: 'tech',
    },
  ];

  const drizzle = getRawDrizzle();
  let seeded = 0;

  for (const feed of rssFeeds) {
    // Check if feed already exists by URL
    const existing = await drizzle.select()
      .from(schema.rssFeedSources)
      .where(eq(schema.rssFeedSources.feedUrl, feed.feedUrl))
      .limit(1);

    if (existing.length > 0) {
      const existingFeed = existing[0];
      if (existingFeed) {
        await drizzle.update(schema.rssFeedSources)
          .set({ name: feed.name, category: feed.category, updatedAt: new Date() })
          .where(eq(schema.rssFeedSources.id, existingFeed.id));
      }
    } else {
      await drizzle.insert(schema.rssFeedSources).values({
        id: await generateSnowflakeId(),
        name: feed.name,
        feedUrl: feed.feedUrl,
        category: feed.category,
        updatedAt: new Date(),
      });
      seeded++;
    }
  }

  logger.info(`RSS feeds: ${seeded} created, ${rssFeeds.length - seeded} updated`, undefined, 'SeedDatabase');
  return seeded;
}

async function seedCharacterMappings(): Promise<number> {
  logger.info('Seeding character mappings...', undefined, 'SeedDatabase');

  const actorsData = loadActorsData();
  const drizzle = getRawDrizzle();
  let created = 0;
  let updated = 0;

  for (const actor of actorsData.actors) {
    // Skip if actor doesn't have realName (required for mapping)
    if (!actor.realName) {
      continue;
    }

    const category = mapDomainToCategory(actor.domain);
    const priority = mapTierToPriority(actor.tier);
    const aliases = generateAliases(actor);

    // Check if mapping exists by realName (unique constraint)
    const existing = await drizzle.select()
      .from(schema.characterMappings)
      .where(eq(schema.characterMappings.realName, actor.realName))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      await drizzle.update(schema.characterMappings)
        .set({
          parodyName: actor.name,
          category,
          aliases,
          priority,
          updatedAt: new Date(),
        })
        .where(eq(schema.characterMappings.id, existing[0].id));
      updated++;
    } else {
      await drizzle.insert(schema.characterMappings).values({
        id: await generateSnowflakeId(),
        realName: actor.realName,
        parodyName: actor.name,
        category,
        aliases,
        priority,
        updatedAt: new Date(),
      });
      created++;
    }
  }

  logger.info(`Character mappings: ${created} created, ${updated} updated`, undefined, 'SeedDatabase');
  return created;
}

async function seedOrganizationMappings(): Promise<number> {
  logger.info('Seeding organization mappings...', undefined, 'SeedDatabase');

  const actorsData = loadActorsData();
  const drizzle = getRawDrizzle();
  let created = 0;
  let updated = 0;

  for (const org of actorsData.organizations) {
    // Organizations may have originalName for mapping real names to parody names
    // This is stored in the data files but not in the base Organization type
    const originalName = (org as OrgData & { originalName?: string }).originalName;
    const originalHandle = (org as OrgData & { originalHandle?: string }).originalHandle;
    
    // Skip if organization doesn't have originalName (required for mapping)
    if (!originalName) {
      continue;
    }

    const category = mapOrgTypeToCategory(org.type);
    const priority = getOrganizationPriority(originalName, org.type);
    const aliases: string[] = [];

    // Add originalHandle as alias if it exists and is different from name
    if (originalHandle && originalHandle !== org.name.toLowerCase()) {
      aliases.push(originalHandle);
    }

    // Check if mapping exists by realName (unique constraint)
    const existing = await drizzle.select()
      .from(schema.organizationMappings)
      .where(eq(schema.organizationMappings.realName, originalName))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      await drizzle.update(schema.organizationMappings)
        .set({
          parodyName: org.name,
          category,
          aliases,
          priority,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizationMappings.id, existing[0].id));
      updated++;
    } else {
      await drizzle.insert(schema.organizationMappings).values({
        id: await generateSnowflakeId(),
        realName: originalName,
        parodyName: org.name,
        category,
        aliases,
        priority,
        updatedAt: new Date(),
      });
      created++;
    }
  }

  logger.info(`Organization mappings: ${created} created, ${updated} updated`, undefined, 'SeedDatabase');
  return created;
}

async function seedDemoUsers(): Promise<number> {
  logger.info('Seeding demo users...', undefined, 'SeedDatabase');

  const defaultUsers = [
    {
      id: 'demo-user-babylon-support',
      privyId: 'did:privy:babylon-support-demo',
      username: 'babylon-support',
      displayName: 'Babylon Support',
      bio: 'Official Babylon support account. Send us a message if you need help!',
      profileImageUrl: '/assets/user-profiles/profile-1.jpg',
    },
    {
      id: 'demo-user-welcome-bot',
      privyId: 'did:privy:babylon-welcome-bot',
      username: 'welcome-bot',
      displayName: 'Welcome Bot',
      bio: 'New to Babylon? Message me to learn how to play!',
      profileImageUrl: '/assets/user-profiles/profile-2.jpg',
    },
  ];

  let created = 0;

  for (const userData of defaultUsers) {
    const existing = await db.user.findUnique({ where: { id: userData.id } });

    if (existing) {
      await db.user.update({
        where: { id: userData.id },
        data: {
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          profileImageUrl: userData.profileImageUrl,
          profileComplete: true,
          hasUsername: true,
          hasBio: true,
          hasProfileImage: true,
          reputationPoints: 5000,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.user.create({
        data: {
          id: userData.id,
          privyId: userData.privyId,
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          profileImageUrl: userData.profileImageUrl,
          isAgent: false,
          profileComplete: true,
          hasUsername: true,
          hasBio: true,
          hasProfileImage: true,
          reputationPoints: 5000,
          virtualBalance: '1000',
          updatedAt: new Date(),
        },
      });
      created++;
    }
  }

  logger.info(`Demo users: ${created} created, ${defaultUsers.length - created} updated`, undefined, 'SeedDatabase');
  return created;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const command = process.argv[2] || 'all';

  logger.info('════════════════════════════════════════════════════════════', undefined, 'SeedDatabase');
  logger.info('Babylon Database Seeder', { command }, 'SeedDatabase');
  logger.info('════════════════════════════════════════════════════════════', undefined, 'SeedDatabase');

  try {
    switch (command) {
      case 'actors':
        await seedActors();
        break;

      case 'orgs':
        await seedOrganizations();
        break;

      case 'game':
        await seedGameState();
        break;

      case 'feeds':
        await seedRSSFeeds();
        break;

      case 'mappings':
        await seedCharacterMappings();
        await seedOrganizationMappings();
        break;

      case 'users':
        await seedDemoUsers();
        break;

      case 'all':
      default: {
        // Seed in order of dependencies
        await seedActors();
        await seedOrganizations();
        await seedGameState();
        await seedRSSFeeds();
        await seedCharacterMappings();
        await seedOrganizationMappings();
        await seedDemoUsers();

        // Print summary
        const drizzle = getRawDrizzle();
        const stats = {
          actors: (await drizzle.select({ count: sql<number>`count(*)` }).from(schema.actors))[0]?.count ?? 0,
          organizations: (await drizzle.select({ count: sql<number>`count(*)` }).from(schema.organizations))[0]?.count ?? 0,
          rssFeedSources: (await drizzle.select({ count: sql<number>`count(*)` }).from(schema.rssFeedSources))[0]?.count ?? 0,
          characterMappings: (await drizzle.select({ count: sql<number>`count(*)` }).from(schema.characterMappings))[0]?.count ?? 0,
          organizationMappings: (await drizzle.select({ count: sql<number>`count(*)` }).from(schema.organizationMappings))[0]?.count ?? 0,
          users: (await drizzle.select({ count: sql<number>`count(*)` }).from(schema.users))[0]?.count ?? 0,
        };

        logger.info('════════════════════════════════════════════════════════════', undefined, 'SeedDatabase');
        logger.info('Database Summary', stats, 'SeedDatabase');
        logger.info('════════════════════════════════════════════════════════════', undefined, 'SeedDatabase');
        break;
      }
    }

    logger.info('Seed complete!', undefined, 'SeedDatabase');
  } catch (error) {
    logger.error('Seed failed', { error }, 'SeedDatabase');
    throw error;
  } finally {
    await closeDatabase();
  }
}

if (import.meta.main) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export {
  seedActors,
  seedOrganizations,
  seedGameState,
  seedRSSFeeds,
  seedCharacterMappings,
  seedOrganizationMappings,
  seedDemoUsers,
};
