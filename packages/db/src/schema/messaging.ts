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

// Chat
export const chats = pgTable(
  'Chat',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    description: text('description'),
    isGroup: boolean('isGroup').notNull().default(false),
    createdBy: text('createdBy'),
    npcAdminId: text('npcAdminId'),
    gameId: text('gameId'),
    dayNumber: integer('dayNumber'),
    relatedQuestion: integer('relatedQuestion'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    groupId: text('groupId'),
  },
  (table) => [
    index('Chat_gameId_dayNumber_idx').on(table.gameId, table.dayNumber),
    index('Chat_groupId_idx').on(table.groupId),
    index('Chat_isGroup_idx').on(table.isGroup),
    index('Chat_createdBy_idx').on(table.createdBy),
    index('Chat_npcAdminId_idx').on(table.npcAdminId),
    index('Chat_relatedQuestion_idx').on(table.relatedQuestion),
  ]
);

// ChatParticipant
export const chatParticipants = pgTable(
  'ChatParticipant',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    userId: text('userId').notNull(),
    joinedAt: timestamp('joinedAt', { mode: 'date' }).notNull().defaultNow(),
    invitedBy: text('invitedBy'),
    isActive: boolean('isActive').notNull().default(true),
    lastMessageAt: timestamp('lastMessageAt', { mode: 'date' }),
    messageCount: integer('messageCount').notNull().default(0),
    qualityScore: doublePrecision('qualityScore').notNull().default(1.0),
    kickedAt: timestamp('kickedAt', { mode: 'date' }),
    kickReason: text('kickReason'),
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
    index('ChatParticipant_lastMessageAt_idx').on(table.lastMessageAt),
    index('ChatParticipant_userId_isActive_idx').on(
      table.userId,
      table.isActive
    ),
  ]
);

// ChatAdmin
export const chatAdmins = pgTable(
  'ChatAdmin',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    userId: text('userId').notNull(),
    grantedAt: timestamp('grantedAt', { mode: 'date' }).notNull().defaultNow(),
    grantedBy: text('grantedBy').notNull(),
  },
  (table) => [
    unique('ChatAdmin_chatId_userId_key').on(table.chatId, table.userId),
    index('ChatAdmin_chatId_idx').on(table.chatId),
    index('ChatAdmin_userId_idx').on(table.userId),
  ]
);

// ChatInvite
export const chatInvites = pgTable(
  'ChatInvite',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    invitedUserId: text('invitedUserId').notNull(),
    invitedBy: text('invitedBy').notNull(),
    status: text('status').notNull().default('pending'),
    message: text('message'),
    invitedAt: timestamp('invitedAt', { mode: 'date' }).notNull().defaultNow(),
    respondedAt: timestamp('respondedAt', { mode: 'date' }),
  },
  (table) => [
    unique('ChatInvite_chatId_invitedUserId_key').on(
      table.chatId,
      table.invitedUserId
    ),
    index('ChatInvite_chatId_idx').on(table.chatId),
    index('ChatInvite_invitedUserId_status_idx').on(
      table.invitedUserId,
      table.status
    ),
    index('ChatInvite_status_idx').on(table.status),
  ]
);

// Message
export const messages = pgTable(
  'Message',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull(),
    senderId: text('senderId').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('Message_chatId_createdAt_idx').on(table.chatId, table.createdAt),
    index('Message_senderId_idx').on(table.senderId),
  ]
);

// DMAcceptance
export const dmAcceptances = pgTable(
  'DMAcceptance',
  {
    id: text('id').primaryKey(),
    chatId: text('chatId').notNull().unique(),
    userId: text('userId').notNull(),
    otherUserId: text('otherUserId').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    acceptedAt: timestamp('acceptedAt', { mode: 'date' }),
    rejectedAt: timestamp('rejectedAt', { mode: 'date' }),
  },
  (table) => [
    index('DMAcceptance_status_createdAt_idx').on(
      table.status,
      table.createdAt
    ),
    index('DMAcceptance_userId_status_idx').on(table.userId, table.status),
  ]
);

// GroupChatMembership
export const groupChatMemberships = pgTable(
  'GroupChatMembership',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    chatId: text('chatId').notNull(),
    npcAdminId: text('npcAdminId').notNull(),
    joinedAt: timestamp('joinedAt', { mode: 'date' }).notNull().defaultNow(),
    lastMessageAt: timestamp('lastMessageAt', { mode: 'date' }),
    messageCount: integer('messageCount').notNull().default(0),
    qualityScore: doublePrecision('qualityScore').notNull().default(1.0),
    isActive: boolean('isActive').notNull().default(true),
    sweepReason: text('sweepReason'),
    removedAt: timestamp('removedAt', { mode: 'date' }),
  },
  (table) => [
    unique('GroupChatMembership_userId_chatId_key').on(
      table.userId,
      table.chatId
    ),
    index('GroupChatMembership_chatId_isActive_idx').on(
      table.chatId,
      table.isActive
    ),
    index('GroupChatMembership_lastMessageAt_idx').on(table.lastMessageAt),
    index('GroupChatMembership_userId_isActive_idx').on(
      table.userId,
      table.isActive
    ),
  ]
);

// Notification
export const notifications = pgTable(
  'Notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    type: text('type').notNull(),
    actorId: text('actorId'),
    postId: text('postId'),
    commentId: text('commentId'),
    chatId: text('chatId'),
    message: text('message').notNull(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    title: text('title').notNull(),
    groupId: text('groupId'),
    inviteId: text('inviteId'),
  },
  (table) => [
    index('Notification_chatId_idx').on(table.chatId),
    index('Notification_groupId_idx').on(table.groupId),
    index('Notification_inviteId_idx').on(table.inviteId),
    index('Notification_read_idx').on(table.read),
    index('Notification_userId_createdAt_idx').on(
      table.userId,
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

// UserGroup
export const userGroups = pgTable(
  'UserGroup',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdById: text('createdById').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('UserGroup_createdAt_idx').on(table.createdAt),
    index('UserGroup_createdById_idx').on(table.createdById),
  ]
);

// UserGroupAdmin
export const userGroupAdmins = pgTable(
  'UserGroupAdmin',
  {
    id: text('id').primaryKey(),
    groupId: text('groupId').notNull(),
    userId: text('userId').notNull(),
    grantedAt: timestamp('grantedAt', { mode: 'date' }).notNull().defaultNow(),
    grantedBy: text('grantedBy').notNull(),
  },
  (table) => [
    unique('UserGroupAdmin_groupId_userId_key').on(table.groupId, table.userId),
    index('UserGroupAdmin_groupId_idx').on(table.groupId),
    index('UserGroupAdmin_userId_idx').on(table.userId),
  ]
);

// UserGroupInvite
export const userGroupInvites = pgTable(
  'UserGroupInvite',
  {
    id: text('id').primaryKey(),
    groupId: text('groupId').notNull(),
    invitedUserId: text('invitedUserId').notNull(),
    invitedBy: text('invitedBy').notNull(),
    status: text('status').notNull().default('pending'),
    invitedAt: timestamp('invitedAt', { mode: 'date' }).notNull().defaultNow(),
    respondedAt: timestamp('respondedAt', { mode: 'date' }),
    message: text('message'),
  },
  (table) => [
    unique('UserGroupInvite_groupId_invitedUserId_key').on(
      table.groupId,
      table.invitedUserId
    ),
    index('UserGroupInvite_groupId_idx').on(table.groupId),
    index('UserGroupInvite_invitedUserId_status_idx').on(
      table.invitedUserId,
      table.status
    ),
    index('UserGroupInvite_status_idx').on(table.status),
  ]
);

// UserGroupMember
export const userGroupMembers = pgTable(
  'UserGroupMember',
  {
    id: text('id').primaryKey(),
    groupId: text('groupId').notNull(),
    userId: text('userId').notNull(),
    joinedAt: timestamp('joinedAt', { mode: 'date' }).notNull().defaultNow(),
    addedBy: text('addedBy').notNull(),
  },
  (table) => [
    unique('UserGroupMember_groupId_userId_key').on(
      table.groupId,
      table.userId
    ),
    index('UserGroupMember_groupId_idx').on(table.groupId),
    index('UserGroupMember_userId_idx').on(table.userId),
  ]
);

// Relations
export const chatsRelations = relations(chats, ({ many }) => ({
  ChatParticipant: many(chatParticipants),
  ChatAdmin: many(chatAdmins),
  Message: many(messages),
}));

export const chatParticipantsRelations = relations(
  chatParticipants,
  ({ one }) => ({
    chat: one(chats, {
      fields: [chatParticipants.chatId],
      references: [chats.id],
    }),
  })
);

export const chatAdminsRelations = relations(chatAdmins, ({ one }) => ({
  chat: one(chats, {
    fields: [chatAdmins.chatId],
    references: [chats.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const userGroupsRelations = relations(userGroups, ({ many }) => ({
  UserGroupAdmin: many(userGroupAdmins),
  UserGroupMember: many(userGroupMembers),
}));

export const userGroupAdminsRelations = relations(
  userGroupAdmins,
  ({ one }) => ({
    group: one(userGroups, {
      fields: [userGroupAdmins.groupId],
      references: [userGroups.id],
    }),
  })
);

export const userGroupMembersRelations = relations(
  userGroupMembers,
  ({ one }) => ({
    group: one(userGroups, {
      fields: [userGroupMembers.groupId],
      references: [userGroups.id],
    }),
  })
);

// Type exports
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type NewChatParticipant = typeof chatParticipants.$inferInsert;
export type ChatAdmin = typeof chatAdmins.$inferSelect;
export type NewChatAdmin = typeof chatAdmins.$inferInsert;
export type ChatInvite = typeof chatInvites.$inferSelect;
export type NewChatInvite = typeof chatInvites.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type DMAcceptance = typeof dmAcceptances.$inferSelect;
export type NewDMAcceptance = typeof dmAcceptances.$inferInsert;
export type GroupChatMembership = typeof groupChatMemberships.$inferSelect;
export type NewGroupChatMembership = typeof groupChatMemberships.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserGroup = typeof userGroups.$inferSelect;
export type NewUserGroup = typeof userGroups.$inferInsert;
export type UserGroupAdmin = typeof userGroupAdmins.$inferSelect;
export type NewUserGroupAdmin = typeof userGroupAdmins.$inferInsert;
export type UserGroupInvite = typeof userGroupInvites.$inferSelect;
export type NewUserGroupInvite = typeof userGroupInvites.$inferInsert;
export type UserGroupMember = typeof userGroupMembers.$inferSelect;
export type NewUserGroupMember = typeof userGroupMembers.$inferInsert;




