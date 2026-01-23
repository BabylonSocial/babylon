import { logger } from '@babylon/shared';
import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type MessageType, MessageTypeEnum } from '@/components/chats/types';
import { CHAT_PAGE_SIZE } from '@/lib/constants';
import { useSSEChannel } from './useSSE';

/**
 * Represents a chat message in the system.
 */
export interface ChatMessage {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  type?: MessageType;
  createdAt: string;
  isGameChat?: boolean;
  /** Stable key for React rendering - prevents flash when optimistic messages are replaced */
  stableKey?: string;
}

/** Raw message from API (createdAt may be string or Date) */
interface RawApiMessage {
  id: string;
  content: string;
  senderId: string;
  type?: MessageType;
  createdAt: string | Date;
}

/** Format raw API message to ChatMessage */
function formatMessage(msg: RawApiMessage, chatId: string): ChatMessage {
  return {
    id: msg.id,
    content: msg.content,
    chatId,
    senderId: msg.senderId,
    type: msg.type,
    createdAt:
      typeof msg.createdAt === 'string'
        ? msg.createdAt
        : msg.createdAt.toISOString(),
  };
}

/** Sort messages by createdAt timestamp */
function sortByTime(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Time window (ms) for matching optimistic messages to confirmed messages.
 * If a confirmed message arrives within this window of an optimistic message
 * with matching content and sender, they are considered the same message.
 */
const OPTIMISTIC_MATCH_WINDOW_MS = 30000;

/** Check if a message is a pending optimistic message matching the new message */
function isMatchingOptimistic(
  pending: ChatMessage,
  incoming: ChatMessage
): boolean {
  return (
    pending.id.startsWith('pending-') &&
    pending.senderId === incoming.senderId &&
    pending.content === incoming.content &&
    Math.abs(
      new Date(pending.createdAt).getTime() -
        new Date(incoming.createdAt).getTime()
    ) < OPTIMISTIC_MATCH_WINDOW_MS
  );
}

/**
 * Adds a confirmed message to the list, replacing any matching optimistic message.
 * Preserves the stableKey from the optimistic message to prevent React remount.
 */
function replaceOptimisticMessage(
  messages: ChatMessage[],
  confirmed: ChatMessage
): ChatMessage[] {
  // Skip exact duplicates
  if (messages.some((msg) => msg.id === confirmed.id)) {
    return messages;
  }

  // Replace optimistic message if found
  const pending = messages.find((msg) => isMatchingOptimistic(msg, confirmed));
  if (pending) {
    return sortByTime(
      messages.map((msg) =>
        msg.id === pending.id
          ? { ...confirmed, stableKey: pending.stableKey || pending.id }
          : msg
      )
    );
  }

  return sortByTime([...messages, confirmed]);
}

/** Polling interval - less aggressive since SSE is primary */
const POLLING_INTERVAL_MS = 15000;

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
 * Replaces the previous WebSocket-based implementation with SSE for better
 * Vercel compatibility. Messages are automatically sorted by timestamp.
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

  // Load existing messages from API (initial load)
  const loadMessages = useCallback(
    async (chatId: string) => {
      if (hasLoadedRef.current.has(chatId)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Get auth token for authenticated request
      const token = await getAccessToken();
      if (!token) {
        logger.error(
          'Failed to load messages - no auth token',
          { chatId },
          'useChatMessages'
        );
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/chats/${chatId}?limit=${CHAT_PAGE_SIZE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          const formatted = (data.messages as RawApiMessage[]).map((msg) =>
            formatMessage(msg, chatId)
          );
          setMessages(formatted);
          setHasMore(data.pagination?.hasMore ?? false);
          setNextCursor(data.pagination?.nextCursor ?? null);
          hasLoadedRef.current.add(chatId);
          logger.debug(
            `Loaded ${formatted.length} messages`,
            { chatId, count: formatted.length },
            'useChatMessages'
          );
        }
      } else {
        logger.error(
          'Failed to load messages',
          { chatId, status: response.status },
          'useChatMessages'
        );
      }
      setIsLoading(false);
    },
    [getAccessToken]
  );

  // Load more older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!chatId || !nextCursor || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Get auth token for authenticated request
    const token = await getAccessToken();
    if (!token) {
      logger.error(
        'Failed to load more messages - no auth token',
        { chatId },
        'useChatMessages'
      );
      setIsLoadingMore(false);
      return;
    }

    const response = await fetch(
      `/api/chats/${chatId}?cursor=${nextCursor}&limit=${CHAT_PAGE_SIZE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.messages?.length > 0) {
        const formatted = (data.messages as RawApiMessage[]).map((msg) =>
          formatMessage(msg, chatId)
        );
        setMessages((prev) => [...formatted, ...prev]);
        setHasMore(data.pagination?.hasMore ?? false);
        setNextCursor(data.pagination?.nextCursor ?? null);
      }
    } else {
      logger.error(
        'Failed to load more messages',
        { chatId, status: response.status },
        'useChatMessages'
      );
    }
    setIsLoadingMore(false);
  }, [chatId, nextCursor, isLoadingMore, hasMore, getAccessToken]);

  // Handle SSE updates for this chat
  const handleChatUpdate = useCallback(
    (data: Record<string, unknown>) => {
      if (data.type !== 'new_message' || !data.message) return;

      const m = data.message as Record<string, unknown>;
      // Type guard for required fields
      if (
        typeof m.id !== 'string' ||
        typeof m.content !== 'string' ||
        typeof m.chatId !== 'string' ||
        typeof m.senderId !== 'string' ||
        typeof m.createdAt !== 'string' ||
        m.chatId !== chatId
      ) {
        return;
      }

      const newMessage: ChatMessage = {
        id: m.id,
        content: m.content,
        chatId: m.chatId,
        senderId: m.senderId,
        type:
          m.type === MessageTypeEnum.USER || m.type === MessageTypeEnum.SYSTEM
            ? (m.type as MessageType)
            : undefined,
        createdAt: m.createdAt,
        isGameChat:
          typeof m.isGameChat === 'boolean' ? m.isGameChat : undefined,
      };

      setIsLoading(false);
      setMessages((prev) => replaceOptimisticMessage(prev, newMessage));
    },
    [chatId]
  );

  // Subscribe to chat channel
  const channel: `chat:${string}` | null = chatId ? `chat:${chatId}` : null;
  const { isConnected } = useSSEChannel(channel, handleChatUpdate);

  // Load messages when switching chats
  useEffect(() => {
    const previousChatId = previousChatIdRef.current;

    if (previousChatId !== chatId) {
      // Clear the "already loaded" flag so switching back to this chat will reload
      if (previousChatId) {
        hasLoadedRef.current.delete(previousChatId);
      }
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

  // Polling fallback for SSE edge cases
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!chatId) return;

    // Start polling after brief delay for initial load
    const startTimeout = setTimeout(() => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          // Get auth token for authenticated request
          const token = await getAccessToken();
          if (!token) return;

          const response = await fetch(
            `/api/chats/${chatId}?limit=${CHAT_PAGE_SIZE}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) return;

          const data = await response.json();
          if (!data.messages) return;

          const formatted = (data.messages as RawApiMessage[]).map((msg) =>
            formatMessage(msg, chatId)
          );

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const updated = [...prev];
            let changed = false;

            for (const msg of formatted) {
              if (existingIds.has(msg.id)) continue;

              const pending = updated.find((m) => isMatchingOptimistic(m, msg));
              if (pending) {
                const idx = updated.indexOf(pending);
                updated[idx] = {
                  ...msg,
                  stableKey: pending.stableKey || pending.id,
                };
                changed = true;
              } else {
                updated.push(msg);
                changed = true;
              }
            }

            return changed ? sortByTime(updated) : prev;
          });

          hasLoadedRef.current.add(chatId);
        } catch (error) {
          logger.warn(
            'Polling failed',
            { chatId, error: String(error) },
            'useChatMessages'
          );
        }
      }, POLLING_INTERVAL_MS);
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [chatId, getAccessToken]);

  // SSE connected means we're ready
  useEffect(() => {
    if (isConnected && chatId) setIsLoading(false);
  }, [isConnected, chatId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => replaceOptimisticMessage(prev, message));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
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
    removeMessage,
    clearMessages,
    reloadMessages,
    isConnected,
  };
}
