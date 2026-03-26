import { and, count, desc, eq, inArray, isNull, lt, lte } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { DrizzleClient } from '../client';
import { logger } from '../logger';
import { users } from './user';

export const posts = pgTable(
  'Post',
  {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    authorId: text('authorId').notNull(),
    gameId: text('gameId'),
    dayNumber: integer('dayNumber'),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    articleTitle: text('articleTitle'),
    biasScore: doublePrecision('biasScore'),
    byline: text('byline'),
    category: text('category'),
    fullContent: text('fullContent'),
    sentiment: text('sentiment'),
    slant: text('slant'),
    imageUrl: text('imageUrl'),
    type: text('type').notNull().default('post'),
    deletedAt: timestamp('deletedAt', { mode: 'date' }),
    commentOnPostId: text('commentOnPostId'),
    parentCommentId: text('parentCommentId'),
    originalPostId: text('originalPostId'),
    relatedQuestion: integer('relatedQuestion'),
  },
  (table) => [
    index('Post_createdAt_idx').on(table.createdAt),
    index('Post_authorId_timestamp_idx').on(table.authorId, table.timestamp),
    index('Post_authorId_type_timestamp_idx').on(
      table.authorId,
      table.type,
      table.timestamp
    ),
    index('Post_commentOnPostId_idx').on(table.commentOnPostId),
    index('Post_deletedAt_idx').on(table.deletedAt),
    index('Post_gameId_dayNumber_idx').on(table.gameId, table.dayNumber),
    index('Post_parentCommentId_idx').on(table.parentCommentId),
    index('Post_originalPostId_idx').on(table.originalPostId),
    index('Post_timestamp_idx').on(table.timestamp),
    index('Post_type_deletedAt_timestamp_idx').on(
      table.type,
      table.deletedAt,
      table.timestamp
    ),
    index('Post_type_timestamp_idx').on(table.type, table.timestamp),
    index('Post_relatedQuestion_idx').on(table.relatedQuestion),
  ]
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

/** Minimal post shape used by feed-oriented DB helpers */
export interface FeedPost {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  type?: string;
}

export async function createFeedPost(
  db: DrizzleClient,
  post: FeedPost & { gameId?: string; dayNumber?: number }
) {
  const created = await db
    .insert(posts)
    .values({
      id: post.id,
      content: post.content,
      authorId: post.author,
      gameId: post.gameId,
      dayNumber: post.dayNumber,
      timestamp: new Date(post.timestamp),
    })
    .returning();

  return created[0]!;
}

export async function createPostWithAllFields(
  db: DrizzleClient,
  data: {
    id: string;
    type?: string;
    content: string;
    fullContent?: string;
    articleTitle?: string;
    byline?: string;
    biasScore?: number;
    sentiment?: string;
    slant?: string;
    category?: string;
    imageUrl?: string;
    authorId: string;
    gameId?: string;
    dayNumber?: number;
    timestamp: Date;
    commentOnPostId?: string;
    parentCommentId?: string;
    originalPostId?: string;
    relatedQuestion?: number;
  }
) {
  const safeDayNumber =
    typeof data.dayNumber === 'number' &&
    Number.isFinite(data.dayNumber) &&
    data.dayNumber >= 0 &&
    data.dayNumber <= 2147483647
      ? data.dayNumber
      : undefined;

  if (data.dayNumber !== undefined && safeDayNumber === undefined) {
    logger.warn('[Post] Invalid dayNumber value', {
      dayNumber: data.dayNumber,
      postId: data.id,
    });
  }

  const safeRelatedQuestion =
    typeof data.relatedQuestion === 'number' &&
    Number.isFinite(data.relatedQuestion) &&
    data.relatedQuestion >= 0 &&
    data.relatedQuestion <= 2147483647
      ? Math.floor(data.relatedQuestion)
      : undefined;

  if (data.relatedQuestion !== undefined && safeRelatedQuestion === undefined) {
    logger.warn('[Post] Invalid relatedQuestion value', {
      relatedQuestion: data.relatedQuestion,
      postId: data.id,
    });
  }

  const created = await db
    .insert(posts)
    .values({
      id: data.id,
      type: data.type || 'post',
      content: data.content,
      fullContent: data.fullContent,
      articleTitle: data.articleTitle,
      byline: data.byline,
      biasScore: data.biasScore,
      sentiment: data.sentiment,
      slant: data.slant,
      category: data.category,
      imageUrl: data.imageUrl,
      authorId: data.authorId,
      gameId: data.gameId,
      dayNumber: safeDayNumber,
      timestamp: data.timestamp,
      commentOnPostId: data.commentOnPostId,
      parentCommentId: data.parentCommentId,
      originalPostId: data.originalPostId,
      relatedQuestion: safeRelatedQuestion,
    })
    .returning();

  return created[0]!;
}

export async function createManyFeedPosts(
  db: DrizzleClient,
  postsData: Array<FeedPost & { gameId?: string; dayNumber?: number }>
) {
  if (postsData.length === 0) return { count: 0 };

  const values = postsData.map((post) => {
    const safeDayNumber =
      typeof post.dayNumber === 'number' &&
      Number.isFinite(post.dayNumber) &&
      post.dayNumber >= 0 &&
      post.dayNumber <= 2147483647
        ? post.dayNumber
        : undefined;

    if (post.dayNumber !== undefined && safeDayNumber === undefined) {
      logger.warn('[Post] Invalid dayNumber value', {
        dayNumber: post.dayNumber,
        postId: post.id,
      });
    }

    return {
      id: post.id,
      content: post.content,
      authorId: post.author,
      gameId: post.gameId,
      dayNumber: safeDayNumber,
      timestamp: new Date(post.timestamp),
    };
  });

  await db.insert(posts).values(values).onConflictDoNothing();

  return { count: postsData.length };
}

export async function getRecentPosts(
  db: DrizzleClient,
  limit = 100,
  cursorOrOffset?: string | number
) {
  const isCursor = typeof cursorOrOffset === 'string';
  const cursor = isCursor ? cursorOrOffset : undefined;
  const offset =
    !isCursor && typeof cursorOrOffset === 'number' ? cursorOrOffset : 0;

  logger.debug('getRecentPosts called', {
    limit,
    cursor,
    offset,
  });

  const now = new Date();

  const conditions = [isNull(posts.deletedAt)];

  if (cursor) {
    conditions.push(lt(posts.timestamp, new Date(cursor)));
    conditions.push(lte(posts.timestamp, now));
  } else {
    conditions.push(lte(posts.timestamp, now));
  }

  const allPosts = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .limit(limit * 2)
    .offset(cursor ? 0 : offset)
    .orderBy(desc(posts.timestamp));

  const authorIds = [...new Set(allPosts.map((p) => p.authorId))];

  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, authorIds), eq(users.isTest, true)));

  const testActorIds = authorIds.filter((id) => id.startsWith('test-'));

  const testAuthorIds = new Set([
    ...testUsers.map((u) => u.id),
    ...testActorIds,
  ]);

  const filteredPosts = allPosts
    .filter((post) => !testAuthorIds.has(post.authorId))
    .slice(0, limit);

  logger.info('getRecentPosts completed', {
    limit,
    cursor,
    offset,
    postCount: filteredPosts.length,
    filteredTestPosts: allPosts.length - filteredPosts.length,
    firstPostId: filteredPosts[0]?.id,
    lastPostId: filteredPosts[filteredPosts.length - 1]?.id,
  });

  return filteredPosts;
}

export async function getPostsByActor(
  db: DrizzleClient,
  authorId: string,
  limit = 100,
  cursorOrOffset?: string | number
) {
  const isCursor = typeof cursorOrOffset === 'string';
  const cursor = isCursor ? cursorOrOffset : undefined;
  const offset =
    !isCursor && typeof cursorOrOffset === 'number' ? cursorOrOffset : 0;

  logger.debug('getPostsByActor called', {
    authorId,
    limit,
    cursor,
    offset,
  });

  const user = await db
    .select({ isTest: users.isTest })
    .from(users)
    .where(eq(users.id, authorId))
    .limit(1);

  const isTestUser = user[0]?.isTest || authorId.startsWith('test-') || false;

  if (isTestUser) {
    logger.info('getPostsByActor - test user filtered', {
      authorId,
      isTestUser: true,
    });
    return [];
  }

  const now = new Date();

  const conditions = [eq(posts.authorId, authorId), isNull(posts.deletedAt)];

  if (cursor) {
    conditions.push(lt(posts.timestamp, new Date(cursor)));
    conditions.push(lte(posts.timestamp, now));
  } else {
    conditions.push(lte(posts.timestamp, now));
  }

  const result = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .limit(limit)
    .offset(cursor ? 0 : offset)
    .orderBy(desc(posts.timestamp));

  logger.info('getPostsByActor completed', {
    authorId,
    limit,
    cursor,
    offset,
    postCount: result.length,
  });

  return result;
}

export async function countAllPosts(db: DrizzleClient) {
  const result = await db.select({ count: count() }).from(posts);
  return Number(result[0]?.count ?? 0);
}
