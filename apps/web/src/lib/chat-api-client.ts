/**
 * Chat API Client for Frontend
 *
 * Creates an oRPC client that authenticates with Privy tokens.
 * Used by frontend hooks to communicate with the Chat API service.
 */

import type { AppRouter, AppRouterClient } from '@babylon/chat-api';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

// Re-export types for convenience
export type {
  AppRouter,
  AppRouterClient,
  ChatDetails,
  ChatId,
  ChatListItem,
  ChatParticipant,
  DmChatResult,
  Message,
  MessageId,
  MessageListResult,
  SendMessageResult,
  UnreadCountResult,
  UserId,
} from '@babylon/chat-api';

/**
 * Chat API base URL
 * Uses environment variable or defaults to localhost for development
 */
const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:3001';

/**
 * Token getter function type
 */
export type GetAccessTokenFn = () => Promise<string | null>;

/**
 * Create a Chat API client with Privy authentication
 *
 * @param getAccessToken - Function to get Privy access token (from usePrivy hook)
 * @returns Typed oRPC client for Chat API
 *
 * @example
 * ```tsx
 * import { usePrivy } from '@privy-io/react-auth';
 * import { createChatClient } from '@/lib/chat-api-client';
 *
 * function ChatComponent() {
 *   const { getAccessToken } = usePrivy();
 *   const chatClient = useMemo(
 *     () => createChatClient(getAccessToken),
 *     [getAccessToken]
 *   );
 *
 *   const loadChats = async () => {
 *     const { groupChats, directChats } = await chatClient.chat.list({ all: false });
 *     // ...
 *   };
 * }
 * ```
 */
export function createChatClient(
  getAccessToken: GetAccessTokenFn
): AppRouterClient {
  const link = new RPCLink({
    url: `${CHAT_API_URL}/rpc`,
    headers: async () => {
      const token = await getAccessToken();
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
        };
      }
      return {};
    },
  });

  return createORPCClient<AppRouter>(link);
}

/**
 * Create a Chat API client without authentication (for public endpoints)
 *
 * @returns Typed oRPC client for Chat API public endpoints
 *
 * @example
 * ```tsx
 * import { createPublicChatClient } from '@/lib/chat-api-client';
 *
 * const publicClient = createPublicChatClient();
 * const { chats } = await publicClient.chat.list({ all: true });
 * ```
 */
export function createPublicChatClient(): AppRouterClient {
  const link = new RPCLink({
    url: `${CHAT_API_URL}/rpc`,
  });

  return createORPCClient<AppRouter>(link);
}

/**
 * React hook helper - creates a memoized chat client
 *
 * Usage in components:
 * ```tsx
 * const chatClient = useChatClient();
 * ```
 *
 * Note: This requires the component to be wrapped in PrivyProvider
 * and uses the usePrivy hook internally.
 */
export { createChatClient as useChatClientFactory };
