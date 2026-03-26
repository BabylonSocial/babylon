import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const chats = pgTable(
  'Chat',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    description: text('description'),
    isGroup: boolean('isGroup').notNull().default(false),
    createdBy: text('createdBy'),
    gameId: text('gameId'),
    dayNumber: integer('dayNumber'),
    relatedQuestion: integer('relatedQuestion'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    groupId: text('groupId'),
    requiredNftContractAddress: text('requiredNftContractAddress'),
    requiredNftTokenId: integer('requiredNftTokenId'),
    requiredNftChainId: integer('requiredNftChainId'),
    nftGated: boolean('nftGated').notNull().default(false),
    lastNftRevalidatedAt: timestamp('lastNftRevalidatedAt', { mode: 'date' }),
  },
  (table) => [
    index('Chat_gameId_dayNumber_idx').on(table.gameId, table.dayNumber),
    index('Chat_groupId_idx').on(table.groupId),
    index('Chat_isGroup_idx').on(table.isGroup),
    index('Chat_createdBy_idx').on(table.createdBy),
    index('Chat_relatedQuestion_idx').on(table.relatedQuestion),
    index('Chat_nftGated_idx').on(table.nftGated),
    index('Chat_requiredNftContractAddress_idx').on(
      table.requiredNftContractAddress
    ),
  ]
);

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
