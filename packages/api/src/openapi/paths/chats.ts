import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import {
  Chat,
  ChatChannelMessage as ChatMessage,
  ChatPagination as Pagination,
  ChatParticipant,
  DMChat,
  MessageQuality,
} from '../../schemas/chats';

export const chatPaths: ZodOpenApiPathsObject = {
  '/api/chats': {
    get: {
      operationId: 'listChats',
      tags: ['Chats'],
      summary: 'List all chats',
      description:
        "Returns the authenticated user's group chats and direct message chats.",
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Chat lists',
          content: {
            'application/json': {
              schema: z
                .object({
                  groupChats: z.array(Chat),
                  directChats: z.array(DMChat),
                  total: z.number(),
                })
                .meta({ id: 'ListChatsResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
    post: {
      operationId: 'createChat',
      tags: ['Chats'],
      summary: 'Create a chat',
      description: 'Creates a new group or direct message chat.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              name: z
                .string()
                .optional()
                .meta({ description: 'Chat name (for group chats)' }),
              isGroup: z
                .boolean()
                .optional()
                .meta({ description: 'Whether this is a group chat' }),
              participantIds: z
                .array(z.string())
                .optional()
                .meta({ description: 'User IDs to add as participants' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Created chat',
          content: {
            'application/json': {
              schema: z.object({
                chat: Chat,
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/chats/{id}': {
    get: {
      operationId: 'getChatById',
      tags: ['Chats'],
      summary: 'Get chat with messages',
      description:
        'Returns a chat along with its messages and participants. Supports cursor-based pagination for messages.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Chat ID' }),
        }),
        query: z.object({
          cursor: z
            .string()
            .optional()
            .meta({ description: 'Cursor for message pagination' }),
          limit: z
            .string()
            .optional()
            .meta({ description: 'Number of messages to return' }),
        }),
      },
      responses: {
        '200': {
          description: 'Chat details with messages',
          content: {
            'application/json': {
              schema: z
                .object({
                  chat: Chat,
                  messages: z.array(ChatMessage),
                  participants: z.array(ChatParticipant),
                  pagination: Pagination,
                })
                .meta({ id: 'GetChatResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Chat not found' },
      },
    },
  },

  '/api/chats/{id}/message': {
    post: {
      operationId: 'sendChatMessage',
      tags: ['Chats'],
      summary: 'Send a message',
      description: 'Sends a message to the specified chat.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Chat ID' }),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              content: z.string().meta({ description: 'Message content' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Sent message',
          content: {
            'application/json': {
              schema: z
                .object({
                  message: ChatMessage,
                  quality: MessageQuality.optional(),
                  warnings: z.array(z.string()).optional(),
                  chatType: z
                    .string()
                    .meta({ description: 'Type of chat (group or dm)' }),
                })
                .meta({ id: 'SendMessageResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Chat not found' },
      },
    },
  },

  '/api/chats/{id}/participants': {
    get: {
      operationId: 'getChatParticipants',
      tags: ['Chats'],
      summary: 'Get chat participants',
      description: 'Returns the list of participants in a chat.',
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({
          id: z.string().meta({ description: 'Chat ID' }),
        }),
      },
      responses: {
        '200': {
          description: 'Participant list',
          content: {
            'application/json': {
              schema: z.object({
                participants: z.array(ChatParticipant),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Chat not found' },
      },
    },
  },

  '/api/chats/dm': {
    post: {
      operationId: 'createOrGetDM',
      tags: ['Chats'],
      summary: 'Create or get a DM chat',
      description:
        'Creates a new direct message chat with the specified user, or returns the existing one.',
      security: [{ PrivyAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: z.object({
              userId: z
                .string()
                .meta({ description: 'User ID of the other participant' }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'DM chat',
          content: {
            'application/json': {
              schema: z.object({
                chat: z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                  isGroup: z.literal(false),
                  otherUser: z.object({
                    id: z.string(),
                    displayName: z.string(),
                    username: z.string().nullable(),
                    profileImageUrl: z.string().nullable(),
                  }),
                }),
              }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },

  '/api/chats/unread-count': {
    get: {
      operationId: 'getUnreadCount',
      tags: ['Chats'],
      summary: 'Get unread message count',
      description:
        'Returns the number of pending DMs and whether there are new messages.',
      security: [{ PrivyAuth: [] }],
      responses: {
        '200': {
          description: 'Unread counts',
          content: {
            'application/json': {
              schema: z
                .object({
                  pendingDMs: z.number(),
                  hasNewMessages: z.boolean(),
                })
                .meta({ id: 'UnreadCountResponse' }),
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
