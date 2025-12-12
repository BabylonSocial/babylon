/**
 * MCP Server for Chat API
 *
 * Exposes chat functionality as MCP tools for external AI agents.
 * Uses the official @modelcontextprotocol/sdk.
 *
 * Production: Each request creates a new server instance with userId baked in.
 * Testing: Use createChatMcpServer() which allows changing userId via setAuthenticatedUser.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChatId, UserId, type UserId as UserIdType } from '../db/typeid';
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
 * Create MCP server with chat tools.
 *
 * @param deps - Service dependencies
 * @param initialUserId - Initial authenticated user ID (null for unauthenticated)
 *
 * Returns server instance with setAuthenticatedUser for testing.
 * In production, create a new server per request instead of reusing.
 */
export function createChatMcpServer(
  deps: McpServerDeps,
  initialUserId?: UserIdType | null
) {
  const { chatService, dmService, messageService, logger } = deps;

  // Mutable ref for userId - allows testing to change user between calls
  // Production creates fresh server per request, so mutation doesn't matter
  const userIdRef = { current: initialUserId ?? null };

  const server = new McpServer({
    name: 'babylon-chat',
    version: '1.0.0',
  });

  /**
   * Set authenticated user (for testing).
   * Production should create new server instance instead.
   */
  function setAuthenticatedUser(userId: UserIdType | null) {
    userIdRef.current = userId;
  }

  /**
   * Get authenticated user, throws if not authenticated.
   * Uses userIdRef to support test-time user switching.
   */
  function requireAuth(): UserIdType {
    if (!userIdRef.current) {
      throw new Error('Authentication required');
    }
    return userIdRef.current;
  }

  // ============================================================================
  // Chat Tools
  // ============================================================================

  server.tool(
    'list_chats',
    "List authenticated user's group and direct chats",
    {},
    async () => {
      const authedUserId = requireAuth();
      logger.debug({ msg: 'MCP: list_chats', userId: authedUserId });

      const result = await chatService.listChats(authedUserId);

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
      const authedUserId = requireAuth();
      logger.debug({ msg: 'MCP: get_chat', userId: authedUserId, chatId });

      const result = await chatService.getChatById(authedUserId, chatId);

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
      const authedUserId = requireAuth();
      logger.debug({ msg: 'MCP: create_chat', userId: authedUserId, name });

      const result = await chatService.createChat(authedUserId, {
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
      const authedUserId = requireAuth();
      logger.debug({ msg: 'MCP: leave_chat', userId: authedUserId, chatId });

      const result = await chatService.leaveChat(authedUserId, chatId);

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
      const authedUserId = requireAuth();
      logger.debug({
        msg: 'MCP: create_dm',
        userId: authedUserId,
        targetUserId,
      });

      const result = await dmService.createOrGetDm(authedUserId, targetUserId);

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
    const authedUserId = requireAuth();
    logger.debug({ msg: 'MCP: list_dms', userId: authedUserId });

    const result = await dmService.listDms(authedUserId);

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
      const authedUserId = requireAuth();
      logger.debug({
        msg: 'MCP: list_messages',
        userId: authedUserId,
        chatId,
        limit,
      });

      const result = await messageService.listMessages(authedUserId, chatId, {
        cursor,
        limit,
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
    'send_message',
    'Send a message to a chat',
    {
      chatId: ChatId.describe('Chat ID to send message to'),
      content: z.string().min(1).max(5000).describe('Message content'),
    },
    async ({ chatId, content }) => {
      const authedUserId = requireAuth();
      logger.debug({
        msg: 'MCP: send_message',
        userId: authedUserId,
        chatId,
        contentLength: content.length,
      });

      const result = await messageService.sendMessage(
        authedUserId,
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

  return { server, setAuthenticatedUser };
}

export type ChatMcpServer = ReturnType<typeof createChatMcpServer>;
