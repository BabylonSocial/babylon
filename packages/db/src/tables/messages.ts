import type { MessageMetadata } from '@babylon/shared';
import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { messageTypeEnum } from './messaging-enums';

export const messages = pgTable(
  'Message',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    senderId: text('senderId').notNull(),
    content: text('content').notNull(),
    type: messageTypeEnum('type').notNull().default('user'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    targetIds: text('targetIds').array(),
    metadata: jsonb('metadata').$type<MessageMetadata>(),
    replyToMessageId: text('replyToMessageId'),
  },
  (table) => [
    index('Message_chatId_createdAt_idx').on(table.chatId, table.createdAt),
    index('Message_senderId_createdAt_idx').on(table.senderId, table.createdAt),
    index('Message_senderId_idx').on(table.senderId),
    index('Message_type_idx').on(table.type),
    index('Message_targetIds_idx').using('gin', table.targetIds),
    index('Message_replyToMessageId_idx').on(table.replyToMessageId),
  ]
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
