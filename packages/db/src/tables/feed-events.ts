import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const feedEvents = pgTable(
  'FeedEvent',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    surface: text('surface').notNull(),
    actionType: text('actionType').notNull(),
    itemId: text('itemId').notNull(),
    itemType: text('itemType').notNull(),
    clusterId: text('clusterId'),
    marketId: text('marketId'),
    topicKey: text('topicKey'),
    authorId: text('authorId'),
    feedPosition: integer('feedPosition'),
    dwellMs: integer('dwellMs'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('FeedEvent_actionType_createdAt_idx').on(
      table.actionType,
      table.createdAt
    ),
    index('FeedEvent_clusterId_createdAt_idx').on(
      table.clusterId,
      table.createdAt
    ),
    index('FeedEvent_itemId_createdAt_idx').on(table.itemId, table.createdAt),
    index('FeedEvent_surface_createdAt_idx').on(table.surface, table.createdAt),
    index('FeedEvent_topicKey_createdAt_idx').on(
      table.topicKey,
      table.createdAt
    ),
    index('FeedEvent_userId_surface_createdAt_idx').on(
      table.userId,
      table.surface,
      table.createdAt
    ),
  ]
);

export type FeedEvent = typeof feedEvents.$inferSelect;
export type NewFeedEvent = typeof feedEvents.$inferInsert;
