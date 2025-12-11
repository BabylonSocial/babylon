/**
 * Hono Transport Adapter for MCP
 *
 * Adapts StreamableHTTPServerTransport for use with Hono framework.
 */

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Context as HonoContext } from 'hono';
import type { AuthenticatedUser } from '../context';
import type { Logger } from '../logger';
import type { ChatMcpServer } from './server';

export type McpTransportDeps = {
  mcpServer: ChatMcpServer;
  logger: Logger;
};

/**
 * Handle MCP requests via Hono
 *
 * Supports both stateless (no session) and stateful modes.
 * For chat-api, we use stateless mode since auth comes from headers.
 */
export async function handleMcpRequest(
  c: HonoContext,
  deps: McpTransportDeps,
  user: AuthenticatedUser | null
): Promise<Response> {
  const { mcpServer, logger } = deps;

  // Set authenticated user for tool calls
  mcpServer.setAuthenticatedUser(user?.userId ?? null);

  logger.debug({
    msg: 'MCP request',
    method: c.req.method,
    hasAuth: !!user,
    userId: user?.userId,
  });

  // Create stateless transport (no session tracking)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
  });

  // Connect server to transport
  await mcpServer.server.connect(transport);

  try {
    // Handle the request
    const response = await transport.handleRequest(c.req.raw);
    return response;
  } finally {
    // Clean up connection
    await mcpServer.server.close();
  }
}

/**
 * Handle MCP GET request (server info / tool discovery)
 */
export async function handleMcpDiscovery(
  c: HonoContext,
  deps: McpTransportDeps
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
