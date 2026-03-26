import { relations } from 'drizzle-orm';
import { chatParticipants } from './chat-participants';
import { chats } from './chats';
import { groupInvites } from './group-invites';
import { groupMembers } from './group-members';
import { groups } from './groups';
import { messageReactions } from './message-reactions';
import { messages } from './messages';

export const chatsRelations = relations(chats, ({ one, many }) => ({
  ChatParticipant: many(chatParticipants),
  Message: many(messages),
  MessageReaction: many(messageReactions),
  group: one(groups, {
    fields: [chats.groupId],
    references: [groups.id],
  }),
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

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  MessageReaction: many(messageReactions),
}));

export const messageReactionsRelations = relations(
  messageReactions,
  ({ one }) => ({
    chat: one(chats, {
      fields: [messageReactions.chatId],
      references: [chats.id],
    }),
    message: one(messages, {
      fields: [messageReactions.messageId],
      references: [messages.id],
    }),
  })
);

export const groupsRelations = relations(groups, ({ many }) => ({
  chats: many(chats),
  members: many(groupMembers),
  invites: many(groupInvites),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
}));

export const groupInvitesRelations = relations(groupInvites, ({ one }) => ({
  group: one(groups, {
    fields: [groupInvites.groupId],
    references: [groups.id],
  }),
}));
