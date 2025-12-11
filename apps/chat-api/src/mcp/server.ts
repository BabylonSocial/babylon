/**
 * MCP Server for Chat API
 *
 * Exposes chat functionality as MCP tools for external AI agents.
 * Uses the official @modelcontextprotocol/sdk.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChatId, UserId } from '../db/typeid';
import type { Logger } from '../logger';
import type { ChatService } from '../services/chat.service';
import type { DmService } from '../services/dm.service';
import type { MessageService } from '../services/message.service';

export type McpServerDeps = {
  chatService: ChatService;
  dmService: DmService;
  messageService: MessageService;
  logger: Logger;
};

/**
 * Create MCP server with chat tools
 *
 * Note: Tools receive userId from authenticated context (closure),
 * not from tool arguments - prevents impersonation.
 */
export function createChatMcpServer(deps: McpServerDeps) {
  const { chatService, dmService, messageService, logger } = deps;

  const server = new McpServer({
    name: 'babylon-chat',
    version: '1.0.0',
  });

  // Current authenticated user (set per-request)
  let currentUserId: string | null = null;

  /**
   * Set authenticated user for subsequent tool calls
   */
  function setAuthenticatedUser(userId: string | null) {
    currentUserId = userId;
  }

  /**
   * Get authenticated user, throws if not authenticated
   */
  function requireAuth(): string {
    if (!currentUserId) {
      throw new Error('Authentication required');
    }
    return currentUserId;
  }

  // ============================================================================
  // Chat Tools
  // ============================================================================

  server.tool(
    'list_chats',
    "List authenticated user's group and direct chats",
    {},
    async () => {
      const userId = requireAuth();
      logger.debug({ msg: 'MCP: list_chats', userId });

      const result = await chatService.listChats(userId as UserId);

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      const { groupChats, directChats } = result.value;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ groupChats, directChats }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_chat',
    'Get chat details by ID',
    {
      chatId: ChatId.describe('Chat ID (cht_xxx format)'),
    },
    async ({ chatId }) => {
      const userId = requireAuth();
      logger.debug({ msg: 'MCP: get_chat', userId, chatId });

      const result = await chatService.getChatById(userId as UserId, chatId);

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    }
  );

  server.tool(
    'create_chat',
    'Create a new group chat',
    {
      name: z
        .string()
        .min(1)
        .max(100)
        .describe('Chat name (required for groups)'),
      participantIds: z
        .array(UserId)
        .optional()
        .describe('User IDs to add as participants'),
    },
    async ({ name, participantIds }) => {
      const userId = requireAuth();
      logger.debug({ msg: 'MCP: create_chat', userId, name });

      const result = await chatService.createChat(userId as UserId, {
        name,
        isGroup: true,
        participantIds: participantIds as UserId[] | undefined,
      });

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    }
  );

  server.tool(
    'leave_chat',
    'Leave a chat',
    {
      chatId: ChatId.describe('Chat ID to leave'),
    },
    async ({ chatId }) => {
      const userId = requireAuth();
      logger.debug({ msg: 'MCP: leave_chat', userId, chatId });

      const result = await chatService.leaveChat(userId as UserId, chatId);

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: 'Successfully left chat' }],
      };
    }
  );

  // ============================================================================
  // DM Tools
  // ============================================================================

  server.tool(
    'create_dm',
    'Create or get a direct message chat with another user',
    {
      targetUserId: UserId.describe('User ID to DM (usr_xxx format)'),
    },
    async ({ targetUserId }) => {
      const userId = requireAuth();
      logger.debug({ msg: 'MCP: create_dm', userId, targetUserId });

      const result = await dmService.createOrGetDm(
        userId as UserId,
        targetUserId
      );

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    }
  );

  server.tool('list_dms', 'List all direct message chats', {}, async () => {
    const userId = requireAuth();
    logger.debug({ msg: 'MCP: list_dms', userId });

    const result = await dmService.listDms(userId as UserId);

    if (result.isErr()) {
      return {
        content: [{ type: 'text', text: `Error: ${result.error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result.value, null, 2) }],
    };
  });

  // ============================================================================
  // Message Tools
  // ============================================================================

  server.tool(
    'list_messages',
    'List messages in a chat with pagination',
    {
      chatId: ChatId.describe('Chat ID'),
      cursor: z.string().optional().describe('Pagination cursor'),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe('Max messages to return'),
    },
    async ({ chatId, cursor, limit }) => {
      const userId = requireAuth();
      logger.debug({ msg: 'MCP: list_messages', userId, chatId, limit });

      const result = await messageService.listMessages(
        userId as UserId,
        chatId,
        {
          cursor,
          limit,
        }
      );

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    }
  );

  server.tool(
    'send_message',
    'Send a message to a chat',
    {
      chatId: ChatId.describe('Chat ID to send message to'),
      content: z.string().min(1).max(5000).describe('Message content'),
    },
    async ({ chatId, content }) => {
      const userId = requireAuth();
      logger.debug({
        msg: 'MCP: send_message',
        userId,
        chatId,
        contentLength: content.length,
      });

      const result = await messageService.sendMessage(
        userId as UserId,
        chatId,
        content
      );

      if (result.isErr()) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    }
  );

  return {
    server,
    setAuthenticatedUser,
  };
}

export type ChatMcpServer = ReturnType<typeof createChatMcpServer>;
