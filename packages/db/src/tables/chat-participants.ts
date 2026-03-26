import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const chatParticipants = pgTable(
  'ChatParticipant',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    userId: text('userId').notNull(),
    joinedAt: timestamp('joinedAt', { mode: 'date' }).notNull().defaultNow(),
    invitedBy: text('invitedBy'),
    isActive: boolean('isActive').notNull().default(true),
    addedBy: text('addedBy'),
  },
  (table) => [
    unique('ChatParticipant_chatId_userId_key').on(table.chatId, table.userId),
    index('ChatParticipant_chatId_idx').on(table.chatId),
    index('ChatParticipant_userId_idx').on(table.userId),
    index('ChatParticipant_chatId_isActive_idx').on(
      table.chatId,
      table.isActive
    ),
    index('ChatParticipant_userId_isActive_idx').on(
      table.userId,
      table.isActive
    ),
  ]
);

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type NewChatParticipant = typeof chatParticipants.$inferInsert;
