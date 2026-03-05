import { z } from 'zod';

export const ChatParticipant = z
  .object({
    id: z.string(),
    displayName: z.string(),
    username: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  })
  .meta({ id: 'ChatParticipant' });

export const ChatChannelMessage = z
  .object({
    id: z.string(),
    chatId: z.string(),
    senderId: z.string(),
    content: z.string(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    sender: z
      .object({
        id: z.string(),
        displayName: z.string(),
        username: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
      })
      .optional(),
  })
  .meta({ id: 'ChatMessage' });

export const Chat = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    isGroup: z.boolean(),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    lastMessage: ChatChannelMessage.nullable().optional(),
    unreadCount: z.number().optional(),
  })
  .meta({ id: 'Chat' });

export const DMChat = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    isGroup: z.literal(false),
    createdAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    updatedAt: z.string().meta({ description: 'ISO 8601 timestamp' }),
    lastMessage: ChatChannelMessage.nullable().optional(),
    unreadCount: z.number().optional(),
    otherUser: z
      .object({
        id: z.string(),
        displayName: z.string(),
        username: z.string().nullable(),
        profileImageUrl: z.string().nullable(),
      })
      .optional(),
  })
  .meta({ id: 'DMChat' });

export const MessageQuality = z
  .object({
    score: z.number().optional(),
    flags: z.array(z.string()).optional(),
  })
  .passthrough()
  .meta({ id: 'MessageQuality' });

export const ChatPagination = z
  .object({
    cursor: z.string().nullable(),
    hasMore: z.boolean(),
    total: z.number().optional(),
  })
  .meta({ id: 'ChatPagination' });
