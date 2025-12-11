import { logger } from '@babylon/shared';
import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createChatClient } from '@/lib/chat-api-client';
import {
  type ChatMessageEvent,
  useChatSubscription,
} from './useChatSubscription';

/**
 * Represents a chat message in the system.
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message content/text */
  content: string;
  /** ID of the chat this message belongs to */
  chatId: string;
  /** ID of the user who sent the message */
  senderId: string;
  /** ISO timestamp when the message was created */
  createdAt: string;
  /** Whether this is a game chat message */
  isGameChat?: boolean;
}

/**
 * Hook for managing chat messages with real-time SSE updates.
 *
 * Provides comprehensive chat message management including:
 * - Initial message loading with pagination
 * - Real-time message updates via SSE
 * - Message history pagination (load more)
 * - Automatic deduplication
 * - Polling fallback for multi-instance serverless environments
 *
 * Uses the Chat API service via oRPC client for type-safe API calls.
 *
 * @param chatId - The ID of the chat to load messages for, or null to clear messages.
 *
 * @returns An object containing:
 * - `messages`: Array of chat messages sorted by timestamp
 * - `isLoading`: Whether initial messages are being loaded
 * - `isLoadingMore`: Whether more messages are being loaded (pagination)
 * - `hasMore`: Whether there are more messages to load
 * - `loadMore`: Function to load older messages
 * - `addMessage`: Function to manually add a message to the list
 * - `clearMessages`: Function to clear all messages
 * - `reloadMessages`: Function to reload messages from the API
 * - `isConnected`: Whether SSE connection is active
 *
 * @example
 * ```tsx
 * const { messages, isLoading, loadMore, hasMore } = useChatMessages(chatId);
 *
 * return (
 *   <div>
 *     {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
 *     {hasMore && <button onClick={loadMore}>Load More</button>}
 *   </div>
 * );
 * ```
 */
export function useChatMessages(chatId: string | null) {
  const { getAccessToken } = usePrivy();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const previousChatIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef<Set<string>>(new Set());

  // Create chat client with Privy auth
  const chatClient = useMemo(
    () => createChatClient(getAccessToken),
    [getAccessToken]
  );

  // Load existing messages from API (initial load)
  const loadMessages = useCallback(
    async (targetChatId: string) => {
      // Skip if already loaded
      if (hasLoadedRef.current.has(targetChatId)) {
        logger.debug(
          `Skipping reload for ${targetChatId} - already loaded`,
          { chatId: targetChatId },
          'useChatMessages'
        );
        setIsLoading(false);
        return;
      }

      logger.debug(
        `Loading initial messages for chat ${targetChatId}`,
        { chatId: targetChatId },
        'useChatMessages'
      );
      setIsLoading(true);

      try {
        const data = await chatClient.message.list({
          chatId: targetChatId,
          limit: 50,
        });

        const formattedMessages: ChatMessage[] = data.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          chatId: targetChatId,
          senderId: msg.senderId,
          createdAt:
            typeof msg.createdAt === 'string'
              ? msg.createdAt
              : new Date(msg.createdAt).toISOString(),
        }));

        setMessages(formattedMessages);
        setHasMore(data.pagination?.hasMore || false);
        setNextCursor(data.pagination?.nextCursor || null);
        hasLoadedRef.current.add(targetChatId);

        logger.debug(
          `Loaded ${formattedMessages.length} messages for chat ${targetChatId}`,
          {
            chatId: targetChatId,
            count: formattedMessages.length,
            hasMore: data.pagination?.hasMore,
          },
          'useChatMessages'
        );
      } catch (error) {
        logger.error(
          'Failed to load messages',
          { chatId: targetChatId, error },
          'useChatMessages'
        );
      }

      setIsLoading(false);
    },
    [chatClient]
  );

  // Load more older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!chatId || !nextCursor || isLoadingMore || !hasMore) {
      logger.debug(
        'Skip loadMore',
        { chatId, nextCursor, isLoadingMore, hasMore },
        'useChatMessages'
      );
      return;
    }

    logger.debug(
      `Loading more messages with cursor: ${nextCursor}`,
      { chatId, cursor: nextCursor },
      'useChatMessages'
    );
    setIsLoadingMore(true);

    try {
      const data = await chatClient.message.list({
        chatId,
        cursor: nextCursor,
        limit: 50,
      });

      if (data.messages && data.messages.length > 0) {
        const formattedMessages: ChatMessage[] = data.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          chatId: chatId,
          senderId: msg.senderId,
          createdAt:
            typeof msg.createdAt === 'string'
              ? msg.createdAt
              : new Date(msg.createdAt).toISOString(),
        }));

        // Prepend older messages to the beginning
        setMessages((prev) => [...formattedMessages, ...prev]);
        setHasMore(data.pagination?.hasMore || false);
        setNextCursor(data.pagination?.nextCursor || null);

        logger.debug(
          `Loaded ${formattedMessages.length} more messages`,
          {
            chatId,
            count: formattedMessages.length,
            hasMore: data.pagination?.hasMore,
          },
          'useChatMessages'
        );
      }
    } catch (error) {
      logger.error(
        'Failed to load more messages',
        { chatId, error },
        'useChatMessages'
      );
    }

    setIsLoadingMore(false);
  }, [chatId, nextCursor, isLoadingMore, hasMore, chatClient]);

  // Handle SSE message events from oRPC subscription
  const handleSSEMessage = useCallback(
    (event: ChatMessageEvent) => {
      if (event.type === 'message' && event.data) {
        const {
          id,
          content,
          chatId: msgChatId,
          senderId,
          createdAt,
        } = event.data;

        // Type guard for required fields
        if (id && content && msgChatId && senderId && createdAt) {
          const newMessage: ChatMessage = {
            id,
            content,
            chatId: msgChatId,
            senderId,
            createdAt,
          };

          // Only add message if it's for the current chat
          if (newMessage.chatId === chatId) {
            setIsLoading(false);
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );
            });

            logger.debug(
              'Added message from SSE',
              { messageId: id, chatId: msgChatId },
              'useChatMessages'
            );
          }
        }
      }
    },
    [chatId]
  );

  // Subscribe to chat messages via oRPC SSE
  const { isConnected } = useChatSubscription(chatId, {
    onMessage: handleSSEMessage,
  });

  // Load messages when switching chats
  useEffect(() => {
    const previousChatId = previousChatIdRef.current;

    if (previousChatId !== chatId) {
      if (chatId) {
        setMessages([]);
        setHasMore(false);
        setNextCursor(null);
        loadMessages(chatId);
      } else {
        setIsLoading(false);
        setMessages([]);
        setHasMore(false);
        setNextCursor(null);
      }
      previousChatIdRef.current = chatId;
    }
  }, [chatId, loadMessages]);

  // Polling fallback: Refresh chat every 15 seconds
  // Ensures new messages appear even if SSE fails in multi-instance serverless
  useEffect(() => {
    if (!chatId || !hasLoadedRef.current.has(chatId)) return;

    const interval = setInterval(async () => {
      logger.debug(
        `Polling for new messages in chat ${chatId}`,
        { chatId },
        'useChatMessages'
      );

      try {
        const data = await chatClient.message.list({
          chatId,
          limit: 50,
        });

        if (data.messages) {
          const formattedMessages: ChatMessage[] = data.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            chatId: chatId,
            senderId: msg.senderId,
            createdAt:
              typeof msg.createdAt === 'string'
                ? msg.createdAt
                : new Date(msg.createdAt).toISOString(),
          }));

          // Merge with existing messages, avoiding duplicates
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = formattedMessages.filter(
              (m) => !existingIds.has(m.id)
            );
            if (newMessages.length > 0) {
              logger.debug(
                `Polling found ${newMessages.length} new messages`,
                { chatId, count: newMessages.length },
                'useChatMessages'
              );
              return [...prev, ...newMessages].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );
            }
            return prev;
          });
        }
      } catch (error) {
        logger.error('Polling failed', { chatId, error }, 'useChatMessages');
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [chatId, chatClient]);

  // Mark as loaded when connected
  useEffect(() => {
    if (isConnected && chatId) {
      // Initial loading done - we're ready to receive messages
      setIsLoading(false);
    }
  }, [isConnected, chatId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === message.id)) {
        return prev;
      }
      return [...prev, message].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    hasLoadedRef.current.clear();
  }, []);

  const reloadMessages = useCallback(() => {
    if (chatId) {
      hasLoadedRef.current.delete(chatId);
      loadMessages(chatId);
    }
  }, [chatId, loadMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    addMessage,
    clearMessages,
    reloadMessages,
    isConnected,
  };
}
