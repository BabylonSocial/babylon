import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  ChatAdminId,
  ChatId,
  ChatInviteId,
  ChatParticipantId,
  DmAcceptanceId,
  GroupMembershipId,
  MessageId,
  ModerationLogId,
  UserId,
} from '../typeid';
import {
  chatAdminsTable,
  chatInvitesTable,
  chatModerationLogTable,
  chatParticipantsTable,
  chatsTable,
  dmAcceptancesTable,
  groupChatMembershipsTable,
  messagesTable,
} from './chat.db';

export const SelectChatSchema = createSelectSchema(chatsTable, {
  id: ChatId,
  createdBy: UserId.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const InsertChatSchema = createInsertSchema(chatsTable, {
  id: ChatId.optional(),
  createdBy: UserId.optional(),
}).omit({ createdAt: true, updatedAt: true });

export type SelectChat = z.infer<typeof SelectChatSchema>;
export type InsertChat = z.infer<typeof InsertChatSchema>;

export const SelectMessageSchema = createSelectSchema(messagesTable, {
  id: MessageId,
  chatId: ChatId,
  senderId: UserId,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const InsertMessageSchema = createInsertSchema(messagesTable, {
  id: MessageId.optional(),
  chatId: ChatId,
  senderId: UserId,
}).omit({ createdAt: true, updatedAt: true });

export type SelectMessage = z.infer<typeof SelectMessageSchema>;
export type InsertMessage = z.infer<typeof InsertMessageSchema>;

export const SelectChatParticipantSchema = createSelectSchema(
  chatParticipantsTable,
  {
    id: ChatParticipantId,
    chatId: ChatId,
    userId: UserId,
    invitedBy: UserId.nullable(),
    addedBy: UserId.nullable(),
    joinedAt: z.coerce.date(),
    lastMessageAt: z.coerce.date().nullable(),
    kickedAt: z.coerce.date().nullable(),
  }
);

export const InsertChatParticipantSchema = createInsertSchema(
  chatParticipantsTable,
  {
    id: ChatParticipantId.optional(),
    chatId: ChatId,
    userId: UserId,
    invitedBy: UserId.optional(),
    addedBy: UserId.optional(),
  }
);

export type SelectChatParticipant = z.infer<typeof SelectChatParticipantSchema>;
export type InsertChatParticipant = z.infer<typeof InsertChatParticipantSchema>;

export const SelectChatAdminSchema = createSelectSchema(chatAdminsTable, {
  id: ChatAdminId,
  chatId: ChatId,
  userId: UserId,
  grantedBy: UserId,
  grantedAt: z.coerce.date(),
});

export const InsertChatAdminSchema = createInsertSchema(chatAdminsTable, {
  id: ChatAdminId.optional(),
  chatId: ChatId,
  userId: UserId,
  grantedBy: UserId,
});

export type SelectChatAdmin = z.infer<typeof SelectChatAdminSchema>;
export type InsertChatAdmin = z.infer<typeof InsertChatAdminSchema>;

export const SelectChatInviteSchema = createSelectSchema(chatInvitesTable, {
  id: ChatInviteId,
  chatId: ChatId,
  invitedUserId: UserId,
  invitedBy: UserId,
  status: z.enum(['pending', 'accepted', 'rejected']),
  invitedAt: z.coerce.date(),
  respondedAt: z.coerce.date(),
});

export const InsertChatInviteSchema = createInsertSchema(chatInvitesTable, {
  id: ChatInviteId.optional(),
  chatId: ChatId,
  invitedUserId: UserId,
  invitedBy: UserId,
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
});

export type SelectChatInvite = z.infer<typeof SelectChatInviteSchema>;
export type InsertChatInvite = z.infer<typeof InsertChatInviteSchema>;

export const SelectGroupMembershipSchema = createSelectSchema(
  groupChatMembershipsTable,
  {
    id: GroupMembershipId,
    userId: UserId,
    chatId: ChatId,
    joinedAt: z.coerce.date(),
    lastMessageAt: z.coerce.date().nullable(),
    removedAt: z.coerce.date().nullable(),
  }
);

export const InsertGroupMembershipSchema = createInsertSchema(
  groupChatMembershipsTable,
  {
    id: GroupMembershipId.optional(),
    userId: UserId,
    chatId: ChatId,
  }
);

export type SelectGroupMembership = z.infer<typeof SelectGroupMembershipSchema>;
export type InsertGroupMembership = z.infer<typeof InsertGroupMembershipSchema>;

export const SelectDmAcceptanceSchema = createSelectSchema(dmAcceptancesTable, {
  id: DmAcceptanceId,
  chatId: ChatId,
  userId: UserId,
  otherUserId: UserId,
  status: z.enum(['pending', 'accepted', 'rejected']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  acceptedAt: z.coerce.date(),
  rejectedAt: z.coerce.date(),
});

export const InsertDmAcceptanceSchema = createInsertSchema(dmAcceptancesTable, {
  id: DmAcceptanceId.optional(),
  chatId: ChatId,
  userId: UserId,
  otherUserId: UserId,
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  rejectedAt: true,
});

export type SelectDmAcceptance = z.infer<typeof SelectDmAcceptanceSchema>;
export type InsertDmAcceptance = z.infer<typeof InsertDmAcceptanceSchema>;

export const ModerationActionSchema = z.enum([
  'kick',
  'ban',
  'unban',
  'mute',
  'unmute',
]);

export const SelectModerationLogSchema = createSelectSchema(
  chatModerationLogTable,
  {
    id: ModerationLogId,
    chatId: ChatId,
    targetUserId: UserId,
    actorId: UserId,
    action: ModerationActionSchema,
    expiresAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  }
);

export const InsertModerationLogSchema = createInsertSchema(
  chatModerationLogTable,
  {
    id: ModerationLogId.optional(),
    chatId: ChatId,
    targetUserId: UserId,
    actorId: UserId,
    action: ModerationActionSchema,
  }
).omit({ createdAt: true, updatedAt: true });

export type SelectModerationLog = z.infer<typeof SelectModerationLogSchema>;
export type InsertModerationLog = z.infer<typeof InsertModerationLogSchema>;
