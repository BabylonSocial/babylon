'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatMessages } from '@/hooks/useChatMessages';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import {
  createChatClient,
  createPublicChatClient,
} from '@/lib/chat-api-client';
import { useAuthStore } from '@/stores/authStore';
import type { Chat, ChatDetails, ChatFilter } from '../types';

export function useChatPage() {
  const { ready, authenticated } = useAuth();
  const { user } = useAuthStore();
  const { getAccessToken } = usePrivy();

  // Create chat clients
  const chatClient = useMemo(
    () => createChatClient(getAccessToken),
    [getAccessToken]
  );
  const publicChatClient = useMemo(() => createPublicChatClient(), []);

  // UI state
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Data state
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);

  // Loading/sending state
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  // Message input state
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendWarning, setSendWarning] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Leave chat state
  const [isLeaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [isLeavingChat, setIsLeavingChat] = useState(false);
  const [leaveChatError, setLeaveChatError] = useState<string | null>(null);

  // Group modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupManagementModalOpen, setIsGroupManagementModalOpen] =
    useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // New DM state
  const [pendingDM, setPendingDM] = useState<{
    chatId: string;
    targetUserId: string;
  } | null>(null);

  // Scroll state
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollAdjustRef = useRef<{
    previousHeight: number;
    previousTop: number;
  } | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Debug mode
  const isDebugMode =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  // SSE for real-time messages
  const {
    messages: realtimeMessages,
    isConnected: sseConnected,
    isLoadingMore,
    hasMore,
    loadMore,
    addMessage,
  } = useChatMessages(selectedChatId);

  // Load chats using Chat API
  const loadChats = useCallback(async () => {
    setLoading(true);

    if (!isDebugMode) {
      if (!ready || !authenticated) {
        setLoading(false);
        return;
      }
    }

    try {
      // Load personal chats and game chats in parallel
      const [personalData, gameData] = await Promise.all([
        chatClient.chat.list({ all: false }),
        isDebugMode ? publicChatClient.chat.list({ all: true }) : null,
      ]);

      const gameChats: Chat[] =
        gameData?.chats?.map((c) => ({
          id: c.id,
          name: c.name || 'Game Chat',
          isGroup: c.isGroup,
          lastMessage: c.lastMessage
            ? {
                id: c.lastMessage.id,
                content: c.lastMessage.content,
                senderId: c.lastMessage.senderId,
                createdAt:
                  typeof c.lastMessage.createdAt === 'string'
                    ? c.lastMessage.createdAt
                    : new Date(c.lastMessage.createdAt).toISOString(),
              }
            : null,
          updatedAt:
            typeof c.updatedAt === 'string'
              ? c.updatedAt
              : new Date(c.updatedAt).toISOString(),
        })) || [];

      // Format personal chats
      const groupChats: Chat[] = (personalData.groupChats || []).map((c) => ({
        id: c.id,
        name: c.name || 'Group Chat',
        isGroup: true,
        lastMessage: c.lastMessage
          ? {
              id: c.lastMessage.id,
              content: c.lastMessage.content,
              senderId: c.lastMessage.senderId,
              createdAt:
                typeof c.lastMessage.createdAt === 'string'
                  ? c.lastMessage.createdAt
                  : new Date(c.lastMessage.createdAt).toISOString(),
            }
          : null,
        updatedAt:
          typeof c.updatedAt === 'string'
            ? c.updatedAt
            : new Date(c.updatedAt).toISOString(),
      }));

      const directChats: Chat[] = (personalData.directChats || []).map((c) => ({
        id: c.id,
        name: c.name || 'Direct Message',
        isGroup: false,
        lastMessage: c.lastMessage
          ? {
              id: c.lastMessage.id,
              content: c.lastMessage.content,
              senderId: c.lastMessage.senderId,
              createdAt:
                typeof c.lastMessage.createdAt === 'string'
                  ? c.lastMessage.createdAt
                  : new Date(c.lastMessage.createdAt).toISOString(),
            }
          : null,
        updatedAt:
          typeof c.updatedAt === 'string'
            ? c.updatedAt
            : new Date(c.updatedAt).toISOString(),
        otherUser: c.otherUser
          ? {
              id: c.otherUser.id,
              displayName: c.otherUser.displayName,
              username: c.otherUser.username,
              profileImageUrl: c.otherUser.profileImageUrl,
            }
          : undefined,
      }));

      const combined = [...groupChats, ...directChats, ...gameChats].sort(
        (a, b) => {
          const aTime = a.lastMessage?.createdAt || a.updatedAt;
          const bTime = b.lastMessage?.createdAt || b.updatedAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }
      );

      setAllChats(combined);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }

    setLoading(false);
  }, [chatClient, publicChatClient, isDebugMode, ready, authenticated]);

  // Load chat details using Chat API
  const loadChatDetails = useCallback(
    async (chatId: string) => {
      setLoadingChat(true);

      try {
        const data = await chatClient.chat.get({ chatId });

        setChatDetails({
          chat: {
            id: data.id,
            name: data.name,
            isGroup: data.isGroup,
            createdAt:
              typeof data.createdAt === 'string'
                ? data.createdAt
                : new Date(data.createdAt).toISOString(),
            updatedAt:
              typeof data.updatedAt === 'string'
                ? data.updatedAt
                : new Date(data.updatedAt).toISOString(),
          },
          messages: [], // Messages loaded by useChatMessages hook
          participants: data.participantIds.map((id) => ({
            id,
            displayName: null,
            username: null,
            profileImageUrl: null,
          })),
        });
      } catch (error) {
        console.error('Failed to load chat details:', error);
      }

      setLoadingChat(false);
    },
    [chatClient]
  );

  // Send message using Chat API
  const sendMessage = useCallback(async () => {
    if (!selectedChatId || !messageInput.trim() || sending) return;

    setSending(true);
    setSendError(null);
    setSendWarning(null);
    setSendSuccess(false);

    try {
      const data = await chatClient.message.send({
        chatId: selectedChatId,
        content: messageInput.trim(),
      });

      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 2000);

      if (data.message) {
        addMessage({
          id: data.message.id,
          content: data.message.content,
          chatId: data.message.chatId,
          senderId: data.message.senderId,
          createdAt:
            typeof data.message.createdAt === 'string'
              ? data.message.createdAt
              : new Date(data.message.createdAt).toISOString(),
        });
      }

      setMessageInput('');
      void loadChats();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';
      setSendError(message);
    }

    setSending(false);
  }, [
    selectedChatId,
    messageInput,
    sending,
    chatClient,
    addMessage,
    loadChats,
  ]);

  // Leave chat using Chat API
  const handleLeaveChat = useCallback(async () => {
    if (!selectedChatId) return;
    setIsLeavingChat(true);
    setLeaveChatError(null);

    try {
      await chatClient.chat.leave({ chatId: selectedChatId });
      setLeaveConfirmOpen(false);
      setSelectedChatId(null);
      await loadChats();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to leave chat';
      setLeaveChatError(message);
    }

    setIsLeavingChat(false);
  }, [selectedChatId, chatClient, loadChats]);

  // Group handlers
  const handleGroupCreated = useCallback(
    async (groupId: string, chatId: string) => {
      await loadChats();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSelectedGroupId(groupId);
      setSelectedChatId(chatId);
      await loadChatDetails(chatId);
    },
    [loadChats, loadChatDetails]
  );

  const handleGroupUpdated = useCallback(async () => {
    await loadChats();
    if (selectedChatId) {
      await loadChatDetails(selectedChatId);
    }
  }, [loadChats, selectedChatId, loadChatDetails]);

  const handleManageGroup = useCallback(async () => {
    if (!chatDetails?.chat.id) return;

    try {
      const data = await chatClient.chat.getGroupId({
        chatId: chatDetails.chat.id,
      });
      setSelectedGroupId(data.groupId);
      setIsGroupManagementModalOpen(true);
    } catch (error) {
      console.error('Error fetching group ID:', error);
    }
  }, [chatDetails?.chat.id, chatClient]);

  // Load new DM chat (still uses main API for user profile)
  const loadNewDMChat = useCallback(
    async (chatId: string, targetUserId: string) => {
      setLoadingChat(true);

      const token = await getAccessToken();
      if (!token) {
        setLoadingChat(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${targetUserId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setLoadingChat(false);
          return;
        }

        const userData = await response.json();
        const targetUser = userData.user;

        setChatDetails({
          chat: {
            id: chatId,
            name: null,
            isGroup: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          messages: [],
          participants: [
            {
              id: user!.id,
              displayName: user!.displayName || user!.username || 'You',
              username: user!.username,
              profileImageUrl: user!.profileImageUrl,
            },
            {
              id: targetUser.id,
              displayName:
                targetUser.displayName || targetUser.username || 'User',
              username: targetUser.username,
              profileImageUrl: targetUser.profileImageUrl,
            },
          ],
        });

        const newChat: Chat = {
          id: chatId,
          name: targetUser.displayName || targetUser.username || 'User',
          isGroup: false,
          lastMessage: null,
          updatedAt: new Date().toISOString(),
          otherUser: {
            id: targetUser.id,
            displayName: targetUser.displayName,
            username: targetUser.username,
            profileImageUrl: targetUser.profileImageUrl,
          },
        };

        setAllChats((prev) => {
          if (prev.some((c) => c.id === chatId)) {
            return prev;
          }
          return [newChat, ...prev];
        });
      } catch (error) {
        console.error('Failed to load new DM chat:', error);
      }

      setLoadingChat(false);
    },
    [getAccessToken, user]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = chatContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Pull-to-refresh
  const { pullDistance, containerRef: setPullToRefreshRef } = usePullToRefresh({
    onRefresh: async () => {
      if (!selectedChatId) return;
      await loadChatDetails(selectedChatId).catch((error: Error) => {
        console.error('Error refreshing chat details:', error);
      });
    },
  });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      chatContainerRef.current = node;
      setPullToRefreshRef(node);
    },
    [setPullToRefreshRef]
  );

  // Filter chats
  const filteredByType =
    activeFilter === 'all'
      ? allChats
      : activeFilter === 'dms'
        ? allChats.filter((c) => !c.isGroup)
        : allChats.filter((c) => c.isGroup);

  const filteredChats = searchQuery
    ? filteredByType.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByType;

  // Load chats on mount
  useEffect(() => {
    if ((ready && authenticated) || isDebugMode) {
      loadChats();
    }
  }, [ready, authenticated, isDebugMode, loadChats]);

  // Load selected chat details
  useEffect(() => {
    lastMessageIdRef.current = null;
    setIsAtBottom(true);
    if (selectedChatId) {
      loadChatDetails(selectedChatId);
    }
  }, [selectedChatId, loadChatDetails]);

  // Update chatDetails with realtime messages
  useEffect(() => {
    if (chatDetails && realtimeMessages.length > 0) {
      setChatDetails((prev) => {
        if (!prev) return prev;
        return { ...prev, messages: realtimeMessages };
      });
    }
  }, [realtimeMessages, chatDetails]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const msgs = chatDetails?.messages || [];
    const lastId = msgs.length > 0 ? msgs[msgs.length - 1]?.id : null;
    if (!lastId) return;

    const isNewMessage = lastId !== lastMessageIdRef.current;
    const shouldForce = lastMessageIdRef.current === null;
    lastMessageIdRef.current = lastId;

    if (shouldForce) {
      scrollToBottom('auto');
      setIsAtBottom(true);
      return;
    }

    if (isNewMessage && isAtBottom) {
      scrollToBottom('smooth');
      setIsAtBottom(true);
    }
  }, [chatDetails?.messages, isAtBottom, scrollToBottom]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    const sentinel = topSentinelRef.current;

    if (!container || !sentinel || !selectedChatId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (
          entry.isIntersecting &&
          container.scrollTop < 200 &&
          hasMore &&
          !isLoadingMore
        ) {
          pendingScrollAdjustRef.current = {
            previousHeight: container.scrollHeight,
            previousTop: container.scrollTop,
          };
          loadMore();
        }
      },
      { root: container, rootMargin: '0px 0px 0px 0px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [selectedChatId, hasMore, isLoadingMore, loadMore]);

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (isLoadingMore || !pendingScrollAdjustRef.current) return;
    const container = chatContainerRef.current;
    if (!container) return;

    const { previousHeight, previousTop } = pendingScrollAdjustRef.current;
    const newHeight = container.scrollHeight;
    const delta = newHeight - previousHeight;
    container.scrollTop = previousTop + delta;
    pendingScrollAdjustRef.current = null;
  }, [isLoadingMore]);

  // Track scroll position
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 50;
      const atBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - threshold;
      setIsAtBottom(atBottom);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for chat ID in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const chatParam = params.get('chat');
      const newDMParam = params.get('newDM');

      if (chatParam && chatParam !== selectedChatId) {
        setSelectedChatId(chatParam);

        // If this is a new DM, store it as pending until user is available
        if (newDMParam && chatParam.startsWith('dm-')) {
          setPendingDM({ chatId: chatParam, targetUserId: newDMParam });
        }

        // Clean up URL
        window.history.replaceState({}, '', '/chats');
      }
    }
  }, [selectedChatId]);

  // Load pending DM once user is available
  useEffect(() => {
    if (pendingDM && user) {
      loadNewDMChat(pendingDM.chatId, pendingDM.targetUserId);
      setPendingDM(null);
    }
  }, [pendingDM, user, loadNewDMChat]);

  return {
    // Auth
    ready,
    authenticated,
    user,

    // UI state
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    selectedChatId,
    setSelectedChatId,

    // Data
    filteredChats,
    chatDetails,

    // Loading state
    loading,
    loadingChat,
    sending,
    isLoadingMore,
    hasMore,

    // Message state
    messageInput,
    setMessageInput,
    sendError,
    sendWarning,
    sendSuccess,

    // Leave chat
    isLeaveConfirmOpen,
    setLeaveConfirmOpen,
    isLeavingChat,
    leaveChatError,
    setLeaveChatError,
    handleLeaveChat,

    // Group modals
    isCreateGroupModalOpen,
    setIsCreateGroupModalOpen,
    isGroupManagementModalOpen,
    setIsGroupManagementModalOpen,
    selectedGroupId,
    setSelectedGroupId,
    handleGroupCreated,
    handleGroupUpdated,
    handleManageGroup,

    // SSE
    sseConnected,

    // Refs
    messagesEndRef,
    topSentinelRef,
    setRefs,
    pullDistance,

    // Actions
    sendMessage,
    loadChats,
  };
}
