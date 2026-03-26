import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const groupMembers = pgTable(
  'GroupMember',
  {
    id: text('id').primaryKey(),
    groupId: text('groupId').notNull(),
    userId: text('userId').notNull(),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joinedAt', { mode: 'date' }).notNull().defaultNow(),
    addedBy: text('addedBy'),
    isActive: boolean('isActive').notNull().default(true),
    lastMessageAt: timestamp('lastMessageAt', { mode: 'date' }),
    messageCount: integer('messageCount').notNull().default(0),
    qualityScore: doublePrecision('qualityScore').notNull().default(1.0),
    kickedAt: timestamp('kickedAt', { mode: 'date' }),
    kickReason: text('kickReason'),
    tier: integer('tier'),
    promotedAt: timestamp('promotedAt', { mode: 'date' }),
    demotedAt: timestamp('demotedAt', { mode: 'date' }),
    previousTier: integer('previousTier'),
    isGrandfathered: boolean('isGrandfathered').notNull().default(false),
    grandfatheredAt: timestamp('grandfatheredAt', { mode: 'date' }),
  },
  (table) => [
    unique('GroupMember_groupId_userId_key').on(table.groupId, table.userId),
    index('GroupMember_groupId_idx').on(table.groupId),
    index('GroupMember_userId_joinedAt_idx').on(table.userId, table.joinedAt),
    index('GroupMember_userId_idx').on(table.userId),
    index('GroupMember_groupId_isActive_idx').on(table.groupId, table.isActive),
    index('GroupMember_userId_isActive_idx').on(table.userId, table.isActive),
    index('GroupMember_lastMessageAt_idx').on(table.lastMessageAt),
    index('GroupMember_role_idx').on(table.role),
    index('GroupMember_tier_idx').on(table.tier),
    index('GroupMember_userId_isActive_tier_idx').on(
      table.userId,
      table.isActive,
      table.tier
    ),
    index('GroupMember_isActive_tier_idx').on(table.isActive, table.tier),
    index('GroupMember_isGrandfathered_idx').on(table.isGrandfathered),
  ]
);

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
