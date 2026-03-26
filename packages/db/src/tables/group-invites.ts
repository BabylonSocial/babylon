import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const groupInvites = pgTable(
  'GroupInvite',
  {
    id: text('id').primaryKey(),
    groupId: text('groupId').notNull(),
    invitedUserId: text('invitedUserId').notNull(),
    invitedBy: text('invitedBy').notNull(),
    status: text('status').notNull().default('pending'),
    message: text('message'),
    invitedAt: timestamp('invitedAt', { mode: 'date' }).notNull().defaultNow(),
    respondedAt: timestamp('respondedAt', { mode: 'date' }),
    declineCount: integer('declineCount').notNull().default(0),
    lastDeclinedAt: timestamp('lastDeclinedAt', { mode: 'date' }),
    nextEligibleAt: timestamp('nextEligibleAt', { mode: 'date' }),
  },
  (table) => [
    unique('GroupInvite_groupId_invitedUserId_key').on(
      table.groupId,
      table.invitedUserId
    ),
    index('GroupInvite_groupId_idx').on(table.groupId),
    index('GroupInvite_invitedUserId_status_idx').on(
      table.invitedUserId,
      table.status
    ),
    index('GroupInvite_status_idx').on(table.status),
    index('GroupInvite_invitedUserId_status_declineCount_idx').on(
      table.invitedUserId,
      table.status,
      table.declineCount
    ),
    index('GroupInvite_nextEligibleAt_idx').on(table.nextEligibleAt),
  ]
);

export type GroupInvite = typeof groupInvites.$inferSelect;
export type NewGroupInvite = typeof groupInvites.$inferInsert;
