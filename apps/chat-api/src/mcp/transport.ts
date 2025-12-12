/**
 * Hono Transport Adapter for MCP
 *
 * Uses @hono/mcp for native Hono integration.
 * Creates request-scoped MCP server instances to prevent race conditions.
 */

import { StreamableHTTPTransport } from '@hono/mcp';
import type { Context as HonoContext } from 'hono';
import type { AuthenticatedUser } from '../context';
import type { UserId } from '../db/typeid';
import type { Logger } from '../logger';
import type { ChatService } from '../services/chat.service';
import type { DmService } from '../services/dm.service';
import type { MessageService } from '../services/message.service';
import { createChatMcpServer } from './server';

export type McpTransportDeps = {
  chatService: ChatService;
  dmService: DmService;
  messageService: MessageService;
  logger: Logger;
};

/**
 * Handle MCP requests via Hono
 *
 * Creates a fresh MCP server instance per request with userId baked in.
 * This eliminates race conditions from shared mutable state.
 */
export async function handleMcpRequest(
  c: HonoContext,
  deps: McpTransportDeps,
  user: AuthenticatedUser | null
): Promise<Response> {
  const { chatService, dmService, messageService, logger } = deps;

  logger.debug({
    msg: 'MCP request',
    method: c.req.method,
    hasAuth: !!user,
    userId: user?.userId,
  });

  // Create request-scoped server with userId in closure (thread-safe)
  const { server } = createChatMcpServer(
    { chatService, dmService, messageService, logger },
    (user?.userId as UserId) ?? null
  );

  // Create Hono-native transport
  const transport = new StreamableHTTPTransport();

  // Connect server to transport
  await server.connect(transport);

  try {
    // Handle the request using @hono/mcp transport (pass Hono context)
    const response = await transport.handleRequest(c);
    if (!response) {
      return c.json({ error: 'No response from MCP server' }, 500);
    }
    return response;
  } finally {
    // Clean up - safe because server is request-scoped
    await server.close();
  }
}

/**
 * Handle MCP GET request (server info / tool discovery)
 */
export async function handleMcpDiscovery(
  c: HonoContext,
  deps: Pick<McpTransportDeps, 'logger'>
): Promise<Response> {
  const { logger } = deps;

  logger.debug({ msg: 'MCP discovery request' });

  // Return server info and available tools
  return c.json({
    name: 'babylon-chat',
    version: '1.0.0',
    description: 'Babylon Chat API - MCP Server',
    tools: [
      {
        name: 'list_chats',
        description: "List authenticated user's group and direct chats",
      },
      {
        name: 'get_chat',
        description: 'Get chat details by ID',
      },
      {
        name: 'create_chat',
        description: 'Create a new group chat',
      },
      {
        name: 'leave_chat',
        description: 'Leave a chat',
      },
      {
        name: 'create_dm',
        description: 'Create or get a direct message chat with another user',
      },
      {
        name: 'list_dms',
        description: 'List all direct message chats',
      },
      {
        name: 'list_messages',
        description: 'List messages in a chat with pagination',
      },
      {
        name: 'send_message',
        description: 'Send a message to a chat',
      },
    ],
  });
}
