import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const shareActions = pgTable(
  'ShareAction',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    platform: text('platform').notNull(),
    contentType: text('contentType').notNull(),
    contentId: text('contentId'),
    url: text('url'),
    pointsAwarded: boolean('pointsAwarded').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    verificationDetails: text('verificationDetails'),
    verified: boolean('verified').notNull().default(false),
    verifiedAt: timestamp('verifiedAt', { mode: 'date' }),
  },
  (table) => [
    index('ShareAction_contentType_idx').on(table.contentType),
    index('ShareAction_platform_idx').on(table.platform),
    index('ShareAction_userId_createdAt_idx').on(table.userId, table.createdAt),
    index('ShareAction_verified_idx').on(table.verified),
  ]
);

export type ShareAction = typeof shareActions.$inferSelect;
export type NewShareAction = typeof shareActions.$inferInsert;
