import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const messageReactions = pgTable(
  'MessageReaction',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    messageId: text('messageId').notNull(),
    userId: text('userId').notNull(),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('MessageReaction_messageId_userId_emoji_key').on(
      table.messageId,
      table.userId,
      table.emoji
    ),
    index('MessageReaction_messageId_idx').on(table.messageId),
    index('MessageReaction_chatId_idx').on(table.chatId),
    index('MessageReaction_userId_idx').on(table.userId),
    index('MessageReaction_chatId_messageId_idx').on(
      table.chatId,
      table.messageId
    ),
  ]
);

export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;
