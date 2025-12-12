import { z } from 'zod';
import {
  ModerationActionSchema,
  SelectChatInviteSchema,
  SelectChatSchema,
  SelectGroupMembershipSchema,
  SelectMessageSchema,
} from '../db/schema/chat.zod';
import { ChatId, MessageId, ModerationLogId, UserId } from '../db/typeid';

export const OtherUserSchema = z.object({
  id: UserId,
  displayName: z.string().nullable(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export const LastMessageSchema = z.object({
  id: MessageId,
  content: z.string(),
  senderId: UserId,
  createdAt: z.coerce.date(),
});

export const EmptyInputSchema = z.object({});

export const ChatListItemSchema = z.object({
  id: ChatId,
  name: z.string().nullable(),
  isGroup: z.boolean(),
  lastMessage: LastMessageSchema.nullable(),
  messageCount: z.number(),
  qualityScore: z.number().optional(),
  lastMessageAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date(),
  otherUser: OtherUserSchema.optional(),
});

export const ListChatsOutputSchema = z.object({
  groupChats: z.array(ChatListItemSchema).optional(),
  directChats: z.array(ChatListItemSchema).optional(),
  chats: z.array(ChatListItemSchema).optional(),
  total: z.number().optional(),
});

export const GetChatOutputSchema = SelectChatSchema.pick({
  id: true,
  name: true,
  isGroup: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  participantIds: z.array(UserId),
});

export const CreateChatOutputSchema = GetChatOutputSchema;

export const LeaveChatOutputSchema = z.object({
  success: z.boolean(),
});

export const GetGroupIdOutputSchema = z.object({
  groupId: z.string().nullable(),
});

export const GetUnreadCountOutputSchema = z.object({
  pendingDms: z.number(),
  hasNewMessages: z.boolean(),
});

export const ChatParticipantOutputSchema = z.object({
  id: UserId,
  displayName: z.string().nullable(),
  username: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  joinedAt: z.coerce.date(),
  isActive: z.boolean(),
});

export const GetParticipantsOutputSchema = z.object({
  participants: z.array(ChatParticipantOutputSchema),
});

export const DmChatSchema = z.object({
  id: ChatId,
  name: z.string().nullable(),
  isGroup: z.literal(false),
  otherUserId: UserId,
});

export const CreateOrGetDmOutputSchema = z.object({
  chat: DmChatSchema,
  isNewChat: z.boolean(),
});

export const ListDmsOutputSchema = z.object({
  chats: z.array(DmChatSchema),
});

export const MessageSchema = SelectMessageSchema.pick({
  id: true,
  chatId: true,
  senderId: true,
  content: true,
  createdAt: true,
});

export const PaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
});

export const ListMessagesOutputSchema = z.object({
  messages: z.array(MessageSchema),
  pagination: PaginationSchema,
});

export const SendMessageOutputSchema = z.object({
  message: MessageSchema,
  chat: z.object({
    id: ChatId,
    name: z.string().nullable(),
    isGroup: z.boolean(),
  }),
});

export const AddMembersOutputSchema = z.object({
  success: z.boolean(),
  added: z.array(UserId),
});

export const RemoveMemberOutputSchema = z.object({
  success: z.boolean(),
  removed: z.boolean(),
});

export const InviteSchema = SelectChatInviteSchema.pick({
  id: true,
  chatId: true,
  invitedUserId: true,
  invitedBy: true,
  status: true,
  message: true,
});

export const InviteUserOutputSchema = z.object({
  success: z.boolean(),
  invite: InviteSchema,
});

export const RespondToInviteOutputSchema = z.object({
  success: z.boolean(),
  chatId: ChatId,
  accepted: z.boolean(),
});

export const ListInvitesOutputSchema = z.object({
  invites: z.array(InviteSchema),
});

export const GroupMemberSchema = SelectGroupMembershipSchema.pick({
  userId: true,
  joinedAt: true,
  messageCount: true,
  qualityScore: true,
  isActive: true,
});

export const ListMembersOutputSchema = z.object({
  members: z.array(GroupMemberSchema),
});

export const ModerationResultOutputSchema = z.object({
  success: z.boolean(),
  logId: ModerationLogId,
});

export const CheckBanOutputSchema = z.object({
  isBanned: z.boolean(),
});

export const ModerationLogEntrySchema = z.object({
  id: ModerationLogId,
  chatId: ChatId,
  targetUserId: UserId,
  actorId: UserId,
  action: ModerationActionSchema,
  reason: z.string().nullable(),
  duration: z.number().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

export const GetModerationLogOutputSchema = z.object({
  logs: z.array(ModerationLogEntrySchema),
});

export const HealthCheckOutputSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('chat-api'),
  timestamp: z.string(),
});
