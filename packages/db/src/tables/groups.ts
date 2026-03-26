import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { groupTypeEnum } from './messaging-enums';

export const groups = pgTable(
  'Group',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    type: groupTypeEnum('type').notNull(),
    ownerId: text('ownerId').notNull(),
    createdById: text('createdById').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    tier: integer('tier'),
    maxMembers: integer('maxMembers'),
    parentGroupId: text('parentGroupId'),
    activeChatId: text('activeChatId'),
  },
  (table) => [
    index('Group_type_idx').on(table.type),
    index('Group_ownerId_idx').on(table.ownerId),
    index('Group_createdById_createdAt_idx').on(
      table.createdById,
      table.createdAt
    ),
    index('Group_createdById_idx').on(table.createdById),
    index('Group_createdAt_idx').on(table.createdAt),
    index('Group_tier_idx').on(table.tier),
    index('Group_ownerId_tier_idx').on(table.ownerId, table.tier),
    index('Group_parentGroupId_idx').on(table.parentGroupId),
    uniqueIndex('Group_team_ownerId_unique')
      .on(table.ownerId)
      .where(sql`${table.type} = 'team'`),
  ]
);

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
