/**
 * Chat Domain Schema
 *
 * Defines all tables for the chat service using TypeID patterns.
 * Tables are designed for both group chats and direct messages.
 */

import { relations } from 'drizzle-orm';
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
import { baseEntityFields, typeId } from '../db-utils';
import {
  type ChatAdminId,
  type ChatId,
  type ChatInviteId,
  type ChatParticipantId,
  type DmAcceptanceId,
  type GroupMembershipId,
  type MessageId,
  type ModerationLogId,
  typeIdGenerator,
  type UserId,
} from '../typeid';

// ============================================================================
// Chats Table
// ============================================================================

export const chatsTable = pgTable(
  'chats',
  {
    id: typeId('chat', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('chat'))
      .$type<ChatId>(),

    name: text('name'),
    description: text('description'),
    isGroup: boolean('is_group').notNull().default(false),

    // Creator reference
    createdBy: typeId('user', 'created_by').$type<UserId>(),

    // NPC/game integration (kept as text - these are external IDs)
    npcAdminId: text('npc_admin_id'),
    gameId: text('game_id'),
    dayNumber: integer('day_number'),
    relatedQuestion: integer('related_question'),

    // User group link
    groupId: text('group_id'),

    ...baseEntityFields,
  },
  (table) => [
    index('chats_game_id_day_idx').on(table.gameId, table.dayNumber),
    index('chats_group_id_idx').on(table.groupId),
    index('chats_is_group_idx').on(table.isGroup),
    index('chats_created_by_idx').on(table.createdBy),
    index('chats_npc_admin_id_idx').on(table.npcAdminId),
  ]
);

// ============================================================================
// Messages Table
// ============================================================================

export const messagesTable = pgTable(
  'messages',
  {
    id: typeId('message', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('message'))
      .$type<MessageId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    senderId: typeId('user', 'sender_id').notNull().$type<UserId>(),

    content: text('content').notNull(),

    ...baseEntityFields,
  },
  (table) => [
    index('messages_chat_created_idx').on(table.chatId, table.createdAt),
    index('messages_sender_idx').on(table.senderId),
  ]
);

// ============================================================================
// Chat Participants Table (for DMs)
// ============================================================================

export const chatParticipantsTable = pgTable(
  'chat_participants',
  {
    id: typeId('chatParticipant', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('chatParticipant'))
      .$type<ChatParticipantId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    userId: typeId('user', 'user_id').notNull().$type<UserId>(),

    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    invitedBy: typeId('user', 'invited_by').$type<UserId>(),
    isActive: boolean('is_active').notNull().default(true),
    lastMessageAt: timestamp('last_message_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
    messageCount: integer('message_count').notNull().default(0),
    qualityScore: doublePrecision('quality_score').notNull().default(1.0),

    // Kick info
    kickedAt: timestamp('kicked_at', { withTimezone: true, mode: 'date' }),
    kickReason: text('kick_reason'),
    addedBy: typeId('user', 'added_by').$type<UserId>(),
  },
  (table) => [
    unique('chat_participants_chat_user_key').on(table.chatId, table.userId),
    index('chat_participants_chat_idx').on(table.chatId),
    index('chat_participants_user_idx').on(table.userId),
    index('chat_participants_chat_active_idx').on(table.chatId, table.isActive),
    index('chat_participants_user_active_idx').on(table.userId, table.isActive),
  ]
);

// ============================================================================
// Chat Admins Table
// ============================================================================

export const chatAdminsTable = pgTable(
  'chat_admins',
  {
    id: typeId('chatAdmin', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('chatAdmin'))
      .$type<ChatAdminId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    userId: typeId('user', 'user_id').notNull().$type<UserId>(),
    grantedAt: baseEntityFields.createdAt,
    grantedBy: typeId('user', 'granted_by').notNull().$type<UserId>(),
  },
  (table) => [
    unique('chat_admins_chat_user_key').on(table.chatId, table.userId),
    index('chat_admins_chat_idx').on(table.chatId),
    index('chat_admins_user_idx').on(table.userId),
  ]
);

// ============================================================================
// Chat Invites Table
// ============================================================================

export const chatInvitesTable = pgTable(
  'chat_invites',
  {
    id: typeId('chatInvite', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('chatInvite'))
      .$type<ChatInviteId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    invitedUserId: typeId('user', 'invited_user_id').notNull().$type<UserId>(),
    invitedBy: typeId('user', 'invited_by').notNull().$type<UserId>(),
    status: text('status').notNull().default('pending'), // pending, accepted, rejected
    message: text('message'),
    invitedAt: baseEntityFields.createdAt,
    respondedAt: baseEntityFields.updatedAt,
  },
  (table) => [
    unique('chat_invites_chat_user_key').on(table.chatId, table.invitedUserId),
    index('chat_invites_chat_idx').on(table.chatId),
    index('chat_invites_user_status_idx').on(table.invitedUserId, table.status),
    index('chat_invites_status_idx').on(table.status),
  ]
);

// ============================================================================
// Group Chat Memberships Table (for NPC-managed groups)
// ============================================================================

export const groupChatMembershipsTable = pgTable(
  'group_chat_memberships',
  {
    id: typeId('groupMembership', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('groupMembership'))
      .$type<GroupMembershipId>(),

    userId: typeId('user', 'user_id').notNull().$type<UserId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    // NPC admin ID kept as text - external reference
    npcAdminId: text('npc_admin_id').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    lastMessageAt: timestamp('last_message_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
    messageCount: integer('message_count').notNull().default(0),
    qualityScore: doublePrecision('quality_score').notNull().default(1.0),
    isActive: boolean('is_active').notNull().default(true),
    sweepReason: text('sweep_reason'),
    removedAt: timestamp('removed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    unique('group_memberships_user_chat_key').on(table.userId, table.chatId),
    index('group_memberships_chat_active_idx').on(table.chatId, table.isActive),
    index('group_memberships_user_active_idx').on(table.userId, table.isActive),
    index('group_memberships_last_message_idx').on(table.lastMessageAt),
  ]
);

// ============================================================================
// DM Acceptances Table
// ============================================================================

export const dmAcceptancesTable = pgTable(
  'dm_acceptances',
  {
    id: typeId('dmAcceptance', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('dmAcceptance'))
      .$type<DmAcceptanceId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .unique()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    userId: typeId('user', 'user_id').notNull().$type<UserId>(),
    otherUserId: typeId('user', 'other_user_id').notNull().$type<UserId>(),
    status: text('status').notNull().default('pending'), // pending, accepted, rejected

    ...baseEntityFields,
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('dm_acceptances_status_created_idx').on(
      table.status,
      table.createdAt
    ),
    index('dm_acceptances_user_status_idx').on(table.userId, table.status),
  ]
);

// ============================================================================
// Chat Moderation Log Table
// ============================================================================

export const chatModerationLogTable = pgTable(
  'chat_moderation_log',
  {
    id: typeId('moderationLog', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('moderationLog'))
      .$type<ModerationLogId>(),

    chatId: typeId('chat', 'chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' })
      .$type<ChatId>(),

    targetUserId: typeId('user', 'target_user_id').notNull().$type<UserId>(),
    actorId: typeId('user', 'actor_id').notNull().$type<UserId>(),

    action: text('action')
      .notNull()
      .$type<'kick' | 'ban' | 'unban' | 'mute' | 'unmute'>(),
    reason: text('reason'),
    duration: integer('duration'), // seconds, null = permanent
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),

    ...baseEntityFields,
  },
  (table) => [
    index('moderation_log_chat_idx').on(table.chatId),
    index('moderation_log_target_idx').on(table.targetUserId),
    index('moderation_log_actor_idx').on(table.actorId),
    index('moderation_log_action_idx').on(table.action),
    index('moderation_log_created_idx').on(table.createdAt),
  ]
);

// ============================================================================
// Relations
// ============================================================================

export const chatsRelations = relations(chatsTable, ({ many }) => ({
  messages: many(messagesTable),
  participants: many(chatParticipantsTable),
  admins: many(chatAdminsTable),
  invites: many(chatInvitesTable),
  memberships: many(groupChatMembershipsTable),
  moderationLogs: many(chatModerationLogTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  chat: one(chatsTable, {
    fields: [messagesTable.chatId],
    references: [chatsTable.id],
  }),
}));

export const chatParticipantsRelations = relations(
  chatParticipantsTable,
  ({ one }) => ({
    chat: one(chatsTable, {
      fields: [chatParticipantsTable.chatId],
      references: [chatsTable.id],
    }),
  })
);

export const chatAdminsRelations = relations(chatAdminsTable, ({ one }) => ({
  chat: one(chatsTable, {
    fields: [chatAdminsTable.chatId],
    references: [chatsTable.id],
  }),
}));

export const chatInvitesRelations = relations(chatInvitesTable, ({ one }) => ({
  chat: one(chatsTable, {
    fields: [chatInvitesTable.chatId],
    references: [chatsTable.id],
  }),
}));

export const groupChatMembershipsRelations = relations(
  groupChatMembershipsTable,
  ({ one }) => ({
    chat: one(chatsTable, {
      fields: [groupChatMembershipsTable.chatId],
      references: [chatsTable.id],
    }),
  })
);

export const chatModerationLogRelations = relations(
  chatModerationLogTable,
  ({ one }) => ({
    chat: one(chatsTable, {
      fields: [chatModerationLogTable.chatId],
      references: [chatsTable.id],
    }),
  })
);

// ============================================================================
// Type Exports
// ============================================================================

export type Chat = typeof chatsTable.$inferSelect;
export type NewChat = typeof chatsTable.$inferInsert;

export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

export type ChatParticipant = typeof chatParticipantsTable.$inferSelect;
export type NewChatParticipant = typeof chatParticipantsTable.$inferInsert;

export type ChatAdmin = typeof chatAdminsTable.$inferSelect;
export type NewChatAdmin = typeof chatAdminsTable.$inferInsert;

export type ChatInvite = typeof chatInvitesTable.$inferSelect;
export type NewChatInvite = typeof chatInvitesTable.$inferInsert;

export type GroupChatMembership = typeof groupChatMembershipsTable.$inferSelect;
export type NewGroupChatMembership =
  typeof groupChatMembershipsTable.$inferInsert;

export type DmAcceptance = typeof dmAcceptancesTable.$inferSelect;
export type NewDmAcceptance = typeof dmAcceptancesTable.$inferInsert;

export type ChatModerationLog = typeof chatModerationLogTable.$inferSelect;
export type NewChatModerationLog = typeof chatModerationLogTable.$inferInsert;
