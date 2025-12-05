import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { logger } from '@babylon/shared';

/**
 * Static SSE channel names for standard event types.
 */
export type StaticChannel =
  | 'feed'
  | 'markets'
  | 'breaking-news'
  | 'upcoming-events';

/**
 * Dynamic SSE channel names that include user-specific identifiers.
 */
export type DynamicChannel =
  | `chat:${string}`
  | `notifications:${string}`;

/**
 * SSE channel names for different event types.
 *
 * Standard channels include:
 * - 'feed': General feed updates
 * - 'markets': Market price and trade updates
 * - 'breaking-news': Breaking news events
 * - 'upcoming-events': Upcoming event notifications
 *
 * Dynamic channels include:
 * - 'chat:{chatId}': Chat-specific messages
 * - 'notifications:{userId}': User-specific notifications
 */
export type Channel = StaticChannel | DynamicChannel;

/**
 * Represents a message received via SSE.
 */
export interface SSEMessage {
  /** The channel this message was received on */
  channel: Channel;
  /** Message type identifier */
  type: string;
  /** Message payload data */
  data: Record<string, unknown>;
  /** Timestamp when the message was received */
  timestamp: number;
}

/**
 * Options for configuring the SSE hook.
 */
interface SSEHookOptions {
  /** Initial channels to subscribe to */
  channels?: Channel[];
  /** Whether to automatically reconnect on connection loss (default: true) */
  autoReconnect?: boolean;
  /** Delay between reconnection attempts in ms (default: 3000) */
  reconnectDelay?: number;
  /** Maximum number of reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
}

/**
 * Return type for the useSSE hook.
 */
interface SSEHookReturn {
  /** Whether currently connected to SSE endpoint */
  isConnected: boolean;
  /** Any connection error message */
  error: string | null;
  /** Function to subscribe to a channel */
  subscribe: (
    channel: Channel,
    callback: (message: SSEMessage) => void
  ) => void;
  /** Function to unsubscribe from a channel */
  unsubscribe: (channel: Channel) => void;
  /** Function to manually trigger reconnection */
  reconnect: () => void;
}

type SSECallback = (message: SSEMessage) => void;
type ConnectionListener = (connected: boolean, error: string | null) => void;

const channelSubscribers = new Map<Channel, Set<SSECallback>>();
const requestedChannels = new Set<Channel>();
let connectedChannels = new Set<Channel>();
let globalEventSource: EventSource | null = null;
let connecting = false;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingTokenRetry: ReturnType<typeof setTimeout> | null = null;
const connectionListeners = new Set<ConnectionListener>();
let getAccessTokenRef: (() => Promise<string | null>) | null = null;
let authenticatedRef = false;
let autoReconnectRef = true;
let reconnectDelayRef = 3000;
let maxReconnectAttemptsRef = 5;
const lastEventIds = new Map<Channel, string>();
let cachedRealtimeToken: {
  token: string;
  expiresAt: number;
  channelsKey: string;
} | null = null;

const channelsKeyFromList = (channels: Channel[]) =>
  channels.slice().sort().join(',');

const includesChatChannel = (channels: Channel[]) =>
  channels.some((ch) => typeof ch === 'string' && ch.startsWith('chat:'));

const shouldUseCachedToken = (channels: Channel[]) => {
  if (!cachedRealtimeToken) return false;
  const now = Date.now();
  if (cachedRealtimeToken.expiresAt - now < 30_000) return false; // refresh if <30s
  if (includesChatChannel(channels)) return false; // chat channels need fresh auth (membership can change)
  return cachedRealtimeToken.channelsKey === channelsKeyFromList(channels);
};

const fetchRealtimeToken = async (
  channels: Channel[]
): Promise<string | null> => {
  if (!getAccessTokenRef) return null;
  const accessToken = await getAccessTokenRef().catch((error) => {
    logger.warn(
      'Realtime token: failed to get access token',
      { error },
      'useSSE'
    );
    return null;
  });
  if (!accessToken) return null;

  try {
    const res = await fetch('/api/realtime/token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels,
        includeNotifications: true,
      }),
    });

    if (!res.ok) {
      logger.debug(
        'Realtime token request failed',
        { status: res.status },
        'useSSE'
      );
      return null;
    }
    const json = (await res.json()) as {
      token?: string;
      expiresAt?: number;
    };
    if (!json?.token) return null;
    const expiresAt =
      typeof json.expiresAt === 'number'
        ? json.expiresAt
        : Date.now() + 14 * 60 * 1000; // default ~14min
    cachedRealtimeToken = {
      token: json.token,
      expiresAt,
      channelsKey: channelsKeyFromList(channels),
    };
    return json.token;
  } catch (error) {
    logger.warn('Realtime token fetch error', { error }, 'useSSE');
    return null;
  }
};

const getAuthToken = async (channels: Channel[]): Promise<string | null> => {
  if (shouldUseCachedToken(channels)) {
    return cachedRealtimeToken?.token ?? null;
  }
  const realtime = await fetchRealtimeToken(channels);
  return realtime;
};

const hasBrowserEnv = () =>
  typeof window !== 'undefined' && typeof EventSource !== 'undefined';

const notifyConnectionStatus = (connected: boolean, error: string | null) => {
  connectionListeners.forEach((listener) => {
    listener(connected, error);
  });
};

const closeEventSource = () => {
  if (pendingTokenRetry) {
    clearTimeout(pendingTokenRetry);
    pendingTokenRetry = null;
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (globalEventSource) {
    // Remove all event listeners to prevent callbacks after close
    globalEventSource.onopen = null;
    globalEventSource.onerror = null;
    globalEventSource.close();
    globalEventSource = null;
  }

  connectedChannels.clear();
  // Note: Don't reset `connecting` here - it's managed by ensureConnection()
  // to prevent race conditions during async operations.
};

const scheduleTokenRetry = () => {
  if (pendingTokenRetry || !authenticatedRef) {
    return;
  }

  const delay = Math.min(reconnectDelayRef, 1000);
  pendingTokenRetry = setTimeout(() => {
    pendingTokenRetry = null;
    void ensureConnection();
  }, delay);
};

const channelsInSync = () => {
  if (!globalEventSource || globalEventSource.readyState !== EventSource.OPEN) {
    return false;
  }

  if (connectedChannels.size !== requestedChannels.size) {
    return false;
  }

  for (const channel of requestedChannels) {
    if (!connectedChannels.has(channel)) {
      return false;
    }
  }

  return true;
};

async function ensureConnection(forceReconnect = false) {
  if (!hasBrowserEnv()) return;
  if (!authenticatedRef) return;
  if (requestedChannels.size === 0) {
    closeEventSource();
    connecting = false;
    notifyConnectionStatus(false, null);
    return;
  }

  if (!forceReconnect && channelsInSync()) {
    notifyConnectionStatus(true, null);
    return;
  }

  // Prevent duplicate connection attempts
  if (connecting) {
    logger.debug(
      'SSE connection already in progress, skipping',
      undefined,
      'useSSE'
    );
    return;
  }

  // Don't attempt reconnection if we've already hit the max attempts
  // (unless this is a manual reconnect call which resets the counter)
  if (!forceReconnect && reconnectAttempts >= maxReconnectAttemptsRef) {
    logger.debug(
      'SSE connection skipped - max reconnection attempts already reached',
      undefined,
      'useSSE'
    );
    return;
  }

  // Don't start a new connection if a reconnect is already scheduled
  // This prevents racing between subscribe() calls and the backoff timer
  if (!forceReconnect && reconnectTimeout) {
    logger.debug(
      'SSE connection skipped - reconnect already scheduled',
      undefined,
      'useSSE'
    );
    return;
  }

  // If there's already a connection and we're not forcing reconnect, check if it's valid
  if (
    !forceReconnect &&
    globalEventSource &&
    globalEventSource.readyState === EventSource.OPEN
  ) {
    logger.debug('SSE already connected, skipping', undefined, 'useSSE');
    return;
  }

  connecting = true;
  closeEventSource();

  const channelsList = Array.from(requestedChannels);

  const token = await getAuthToken(channelsList);

  if (!token) {
    connecting = false;
    notifyConnectionStatus(false, 'Missing realtime token for SSE');
    scheduleTokenRetry();
    return;
  }

  const cursorPayload: Record<string, string> = {};
  for (const ch of channelsList) {
    const lastId = lastEventIds.get(ch);
    if (lastId) {
      cursorPayload[ch] = lastId;
    }
  }

  const cursorParam =
    Object.keys(cursorPayload).length > 0
      ? `&cursor=${encodeURIComponent(JSON.stringify(cursorPayload))}`
      : '';

  const url = `${window.location.origin}/api/sse/events?channels=${encodeURIComponent(
    channelsList.join(',')
  )}&token=${encodeURIComponent(token)}${cursorParam}`;

  logger.debug(
    'Connecting to SSE endpoint...',
    { channels: channelsList.join(',') },
    'useSSE'
  );

  const eventSource = new EventSource(url);
  let errorHandled = false;

  eventSource.onopen = () => {
    // Reset error flag on successful open
    errorHandled = false;
    connecting = false;
    globalEventSource = eventSource;
    connectedChannels = new Set(requestedChannels);
    reconnectAttempts = 0;
    notifyConnectionStatus(true, null);
    logger.info('SSE connected', { channels: channelsList }, 'useSSE');
  };

  // Handle the 'connected' event from server
  eventSource.addEventListener('connected', (event) => {
    try {
      const data = JSON.parse(event.data);
      if (Array.isArray(data.channels)) {
        connectedChannels = new Set(data.channels);
        const missing = Array.from(requestedChannels).filter(
          (ch) => !connectedChannels.has(ch)
        );
        if (missing.length > 0) {
          logger.warn(
            'SSE connected without some requested channels',
            {
              requested: Array.from(requestedChannels),
              granted: data.channels,
            },
            'useSSE'
          );
        }
      }
      logger.debug(
        'SSE connected event received',
        { clientId: data.clientId, channels: data.channels },
        'useSSE'
      );
      // Connection is confirmed, update state
      connecting = false;
      reconnectAttempts = 0;
      notifyConnectionStatus(true, null);
    } catch (error) {
      logger.error(
        'Failed to parse connected event',
        { error, data: event.data },
        'useSSE'
      );
    }
  });

  eventSource.addEventListener('message', (event) => {
    try {
      const message: SSEMessage = JSON.parse(event.data);
      if (event.lastEventId) {
        lastEventIds.set(message.channel, event.lastEventId);
      }
      const subs = channelSubscribers.get(message.channel);
      if (subs && subs.size > 0) {
        subs.forEach((callback) => {
          callback(message);
        });
      }
    } catch (error) {
      logger.error(
        'Failed to parse SSE message',
        { error, data: event.data },
        'useSSE'
      );
    }
  });

  eventSource.onerror = () => {
    // Prevent duplicate error handling
    if (errorHandled) {
      return;
    }
    errorHandled = true;

    // Always close the EventSource to prevent browser auto-reconnect.
    // We manage our own reconnection with exponential backoff.
    connecting = false;
    if (globalEventSource === eventSource) {
      globalEventSource = null;
    }
    connectedChannels.clear();

    // Close to stop browser auto-reconnect behavior
    eventSource.onopen = null;
    eventSource.onerror = null;
    eventSource.close();

    notifyConnectionStatus(false, 'SSE connection error');
    logger.warn(
      'SSE connection lost, scheduling reconnect',
      { reconnectAttempts, maxAttempts: maxReconnectAttemptsRef },
      'useSSE'
    );

    if (!autoReconnectRef) {
      return;
    }

    if (reconnectAttempts >= maxReconnectAttemptsRef) {
      notifyConnectionStatus(
        false,
        'Unable to connect to real-time updates. Please refresh the page.'
      );
      logger.error(
        'SSE: Max reconnection attempts reached',
        undefined,
        'useSSE'
      );
      return;
    }

    // Cancel any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    const baseDelay = reconnectDelayRef * 2 ** reconnectAttempts;
    const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
    const delay = Math.min(baseDelay + jitter, 30000);

    reconnectAttempts += 1;
    logger.debug(
      `SSE reconnect scheduled in ${Math.round(delay)}ms`,
      { attempt: reconnectAttempts, delay: Math.round(delay) },
      'useSSE'
    );
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      void ensureConnection();
    }, delay);
  };

  globalEventSource = eventSource;
}

/**
 * Main hook for Server-Sent Events (SSE) connection management.
 *
 * Replaces WebSocket for real-time updates, providing better compatibility
 * with Vercel's serverless architecture. Manages a single global SSE
 * connection shared across all hook instances, with automatic channel
 * subscription and reconnection handling.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Shared connection across components (efficient)
 * - Channel-based subscription model
 * - Authentication token management
 * - Connection state tracking
 *
 * @param options - Configuration options for connection behavior
 *
 * @returns SSE connection state and subscription management functions.
 *
 * @example
 * ```tsx
 * const { isConnected, subscribe, unsubscribe } = useSSE();
 *
 * useEffect(() => {
 *   const handleMessage = (msg) => {
 *     console.log('Received:', msg);
 *   };
 *
 *   subscribe('markets', handleMessage);
 *   return () => unsubscribe('markets');
 * }, []);
 * ```
 */
export function useSSE(options: SSEHookOptions = {}): SSEHookReturn {
  const {
    channels: initialChannels = [],
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const { getAccessToken, authenticated } = usePrivy();
  // Always initialize to false to avoid SSR/hydration mismatches.
  // The connection listener will update this once the connection is established.
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionsRef = useRef<
    Map<Channel, Set<(message: SSEMessage) => void>>
  >(new Map());

  useEffect(() => {
    getAccessTokenRef = getAccessToken;
    autoReconnectRef = autoReconnect;
    reconnectDelayRef = reconnectDelay;
    maxReconnectAttemptsRef = maxReconnectAttempts;
  }, [getAccessToken, autoReconnect, reconnectDelay, maxReconnectAttempts]);

  useEffect(() => {
    authenticatedRef = authenticated;
    if (!authenticated) {
      closeEventSource();
      connecting = false;
      notifyConnectionStatus(false, null);
      return;
    }

    if (requestedChannels.size > 0) {
      void ensureConnection();
    }
  }, [authenticated]);

  useEffect(() => {
    const listener: ConnectionListener = (connectedState, connectionError) => {
      setIsConnected(connectedState);
      setError(connectionError);
    };

    connectionListeners.add(listener);

    return () => {
      connectionListeners.delete(listener);
    };
  }, []);

  const subscribe = useCallback(
    (channel: Channel, callback: (message: SSEMessage) => void) => {
      if (!channel) return;

      if (!subscriptionsRef.current.has(channel)) {
        subscriptionsRef.current.set(channel, new Set());
      }
      const refSubs = subscriptionsRef.current.get(channel);
      if (refSubs) {
        refSubs.add(callback);
      }

      if (!channelSubscribers.has(channel)) {
        channelSubscribers.set(channel, new Set());
      }
      const globalSubs = channelSubscribers.get(channel);
      if (globalSubs) {
        globalSubs.add(callback);
      }

      const previousSize = requestedChannels.size;
      requestedChannels.add(channel);

      logger.debug(`Subscribed to channel: ${channel}`, { channel }, 'useSSE');

      if (!globalEventSource || previousSize !== requestedChannels.size) {
        void ensureConnection();
      } else if (!connectedChannels.has(channel)) {
        void ensureConnection(true);
      }
    },
    []
  );

  const unsubscribe = useCallback((channel: Channel) => {
    const hookSubscribers = subscriptionsRef.current.get(channel);
    if (!hookSubscribers) return;

    const globalSubscribers = channelSubscribers.get(channel);
    if (globalSubscribers) {
      hookSubscribers.forEach((callback) => {
        globalSubscribers.delete(callback);
      });

      if (globalSubscribers.size === 0) {
        channelSubscribers.delete(channel);
        requestedChannels.delete(channel);
        // Clean up lastEventIds to prevent memory leaks for long-running sessions
        lastEventIds.delete(channel);
      }
    }

    hookSubscribers.clear();
    subscriptionsRef.current.delete(channel);

    logger.debug(
      `Unsubscribed from channel: ${channel}`,
      { channel },
      'useSSE'
    );

    if (requestedChannels.size === 0) {
      closeEventSource();
      connecting = false;
      notifyConnectionStatus(false, null);
    } else if (!channelsInSync()) {
      void ensureConnection(true);
    }
  }, []);

  // Memoize initial channels using a string key to prevent unnecessary re-subscriptions.
  // This ensures the effect only runs when the actual channel values change,
  // not just when the array reference changes.
  const initialChannelsKey = initialChannels.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally using string key for stable reference instead of array
  const memoizedInitialChannels = useMemo(() => initialChannels, [
    initialChannelsKey,
  ]);

  // Track subscriptions made by the initial channels effect so we can clean them up
  const initialChannelCallbacksRef = useRef<Map<Channel, SSECallback>>(
    new Map()
  );

  useEffect(() => {
    // Subscribe to initial channels provided in options with no-op callbacks.
    // These are just to ensure the channel is requested; actual message handling
    // is done by explicit subscribe() calls with real callbacks.
    if (memoizedInitialChannels.length > 0) {
      for (const channel of memoizedInitialChannels) {
        // Only subscribe if we haven't already from this effect
        if (!initialChannelCallbacksRef.current.has(channel)) {
          const noopCallback: SSECallback = () => {};
          initialChannelCallbacksRef.current.set(channel, noopCallback);
          subscribe(channel, noopCallback);
        }
      }

      return () => {
        // Clean up only the callbacks we created
        for (const channel of memoizedInitialChannels) {
          const callback = initialChannelCallbacksRef.current.get(channel);
          if (callback) {
            // Remove our specific callback from the global subscribers
            const globalSubs = channelSubscribers.get(channel);
            if (globalSubs) {
              globalSubs.delete(callback);
              if (globalSubs.size === 0) {
                channelSubscribers.delete(channel);
                requestedChannels.delete(channel);
              }
            }
            initialChannelCallbacksRef.current.delete(channel);
          }
        }
        // Trigger reconnect if channels changed
        if (requestedChannels.size === 0) {
          closeEventSource();
          connecting = false;
          notifyConnectionStatus(false, null);
        } else if (!channelsInSync()) {
          void ensureConnection(true);
        }
      };
    }
    return undefined;
  }, [memoizedInitialChannels, subscribe]);

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((_, channel) => {
        unsubscribe(channel);
      });
      subscriptionsRef.current.clear();
    };
  }, [unsubscribe]);

  const reconnect = useCallback(() => {
    reconnectAttempts = 0;
    closeEventSource();
    void ensureConnection(true);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    reconnect,
  };
}

/**
 * Simplified hook for subscribing to a single SSE channel.
 *
 * Wrapper around useSSE that provides a simpler API for single-channel
 * subscriptions. Automatically handles subscription lifecycle and ensures
 * the callback always receives the latest version.
 *
 * @param channel - The channel name to subscribe to, or null to unsubscribe
 * @param onMessage - Callback function called when messages are received.
 * Receives the message data as a record of key-value pairs.
 *
 * @returns An object with `isConnected` boolean indicating connection status.
 *
 * @example
 * ```tsx
 * const { isConnected } = useSSEChannel('markets', (data) => {
 *   console.log('Market update:', data);
 * });
 * ```
 */
export function useSSEChannel(
  channel: Channel | null,
  onMessage: (data: Record<string, unknown>) => void
) {
  // Don't pass channels to useSSE - we'll subscribe explicitly below.
  // This avoids double-subscription (once from initialChannels, once from subscribe()).
  const { isConnected, subscribe, unsubscribe } = useSSE();

  const onMessageRef = useRef(onMessage);
  const callbackRef = useRef<SSECallback | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!channel) return;

    const callback: SSECallback = (message) => {
      if (message.channel === channel) {
        onMessageRef.current(message.data);
      }
    };

    callbackRef.current = callback;
    subscribe(channel, callback);

    return () => {
      if (callbackRef.current) {
        unsubscribe(channel);
        callbackRef.current = null;
      }
    };
  }, [channel, subscribe, unsubscribe]);

  return { isConnected };
}
