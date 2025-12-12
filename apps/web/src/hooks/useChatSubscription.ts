import { logger } from '@babylon/shared';
import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createChatClient } from '@/lib/chat-api-client';

export type ChatMessageEvent = {
  type: 'message' | 'typing' | 'read' | 'ping';
  data: {
    id?: string;
    chatId: string;
    senderId?: string;
    content?: string;
    createdAt?: string;
  };
};

export type UseChatSubscriptionOptions = {
  enabled?: boolean;
  onMessage?: (event: ChatMessageEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
};

export type UseChatSubscriptionReturn = {
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
};

export function useChatSubscription(
  chatId: string | null,
  options: UseChatSubscriptionOptions = {}
): UseChatSubscriptionReturn {
  const {
    enabled = true,
    onMessage,
    onConnectionChange,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const { getAccessToken, authenticated } = usePrivy();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onMessageRef = useRef(onMessage);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onMessage, onConnectionChange]);

  const chatClient = useMemo(
    () => createChatClient(getAccessToken),
    [getAccessToken]
  );

  const updateConnectionState = useCallback(
    (connected: boolean, errorMessage: string | null = null) => {
      setIsConnected(connected);
      setError(errorMessage);
      onConnectionChangeRef.current?.(connected);
    },
    []
  );

  const subscribe = useCallback(async () => {
    if (!chatId || !authenticated || !enabled) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    logger.debug(
      'Starting oRPC SSE subscription',
      { chatId },
      'useChatSubscription'
    );

    try {
      const subscription = await chatClient.message.subscribe({ chatId });
      updateConnectionState(true);
      reconnectAttemptsRef.current = 0;

      for await (const event of subscription) {
        if (abortController.signal.aborted) {
          break;
        }

        logger.debug(
          'Received SSE event',
          { type: event.type, chatId: event.data.chatId },
          'useChatSubscription'
        );

        if (event.type === 'ping') continue;
        onMessageRef.current?.(event as ChatMessageEvent);
      }

      logger.debug('SSE subscription ended', { chatId }, 'useChatSubscription');
    } catch (err) {
      if (abortController.signal.aborted) {
        logger.debug(
          'SSE subscription aborted',
          { chatId },
          'useChatSubscription'
        );
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : 'SSE connection failed';
      logger.error(
        'SSE subscription error',
        { chatId, error: errorMessage },
        'useChatSubscription'
      );

      updateConnectionState(false, errorMessage);

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay =
          reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        const finalDelay = Math.min(delay + jitter, 30000);

        reconnectAttemptsRef.current += 1;

        logger.debug(
          `Scheduling SSE reconnect in ${Math.round(finalDelay)}ms`,
          { attempt: reconnectAttemptsRef.current, chatId },
          'useChatSubscription'
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          void subscribe();
        }, finalDelay);
      } else {
        updateConnectionState(
          false,
          'Max reconnection attempts reached. Please refresh the page.'
        );
      }
    }
  }, [
    chatId,
    authenticated,
    enabled,
    chatClient,
    updateConnectionState,
    maxReconnectAttempts,
    reconnectDelay,
  ]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    void subscribe();
  }, [subscribe]);

  useEffect(() => {
    if (chatId && authenticated && enabled) {
      void subscribe();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setIsConnected(false);
      setError(null);
    };
  }, [chatId, authenticated, enabled, subscribe]);

  return {
    isConnected,
    error,
    reconnect,
  };
}
