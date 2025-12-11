import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { UserId } from '../db/typeid';
import type { AppRouterClient } from '../routers';

export type ChatApiClientOptions = {
  /** Base URL of the chat-api service */
  baseUrl: string;
  /** Service secret for inter-service auth */
  serviceSecret: string;
};

/**
 * Create a typed chat-api client for inter-service communication
 */
export function createChatApiClient(
  options: ChatApiClientOptions
): AppRouterClient {
  const { baseUrl, serviceSecret } = options;

  const link = new RPCLink({
    url: `${baseUrl}/rpc`,
    headers: () => ({
      'x-service-secret': serviceSecret,
    }),
  });

  return createORPCClient(link) as AppRouterClient;
}

/**
 * Create headers for authenticated chat-api requests
 * Use these headers when calling the chat-api on behalf of a user
 */
export function createUserHeaders(options: {
  serviceSecret: string;
  userId: UserId;
  privyId?: string;
}): Record<string, string> {
  return {
    'x-service-secret': options.serviceSecret,
    'x-user-id': options.userId,
    ...(options.privyId && { 'x-privy-id': options.privyId }),
  };
}

/**
 * Create a user-scoped chat-api client
 * This client makes requests on behalf of a specific user
 */
export function createUserChatApiClient(options: {
  baseUrl: string;
  serviceSecret: string;
  userId: UserId;
  privyId?: string;
}): AppRouterClient {
  const { baseUrl, serviceSecret, userId, privyId } = options;

  const link = new RPCLink({
    url: `${baseUrl}/rpc`,
    headers: () => createUserHeaders({ serviceSecret, userId, privyId }),
  });

  return createORPCClient(link) as AppRouterClient;
}

// Re-export TypeID types for consumers
export type {
  ChatId,
  ChatParticipantId,
  MessageId,
  UserId,
} from '../db/typeid';
// Re-export types from router
export type { AppRouter, AppRouterClient } from '../routers';
// Re-export service types (from source files, not re-exports)
export type { ChatDetails, ChatListItem } from '../services/chat.service';
export type { DmChatResult } from '../services/dm.service';
export type {
  Message,
  MessageListResult,
  SendMessageResult,
} from '../services/message.service';
