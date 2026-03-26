import type { NotificationData } from '@babylon/shared';
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const notifications = pgTable(
  'Notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    dedupeKey: text('dedupeKey'),
    type: text('type').notNull(),
    actorId: text('actorId'),
    postId: text('postId'),
    commentId: text('commentId'),
    chatId: text('chatId'),
    message: text('message').notNull(),
    data: jsonb('data').$type<NotificationData>(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    title: text('title').notNull(),
    groupId: text('groupId'),
    inviteId: text('inviteId'),
  },
  (table) => [
    index('Notification_chatId_idx').on(table.chatId),
    uniqueIndex('Notification_dedupeKey_unique')
      .on(table.dedupeKey)
      .where(sql`${table.dedupeKey} IS NOT NULL`),
    index('Notification_groupId_idx').on(table.groupId),
    index('Notification_inviteId_idx').on(table.inviteId),
    index('Notification_read_idx').on(table.read),
    index('Notification_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('Notification_userId_type_actorId_createdAt_idx').on(
      table.userId,
      table.type,
      table.actorId,
      table.createdAt
    ),
    index('Notification_userId_read_createdAt_idx').on(
      table.userId,
      table.read,
      table.createdAt
    ),
    index('Notification_userId_type_read_idx').on(
      table.userId,
      table.type,
      table.read
    ),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
