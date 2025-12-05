'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  LogOut,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Send,
  Settings,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LoginButton } from '@/components/auth/LoginButton';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { GroupManagementModal } from '@/components/groups/GroupManagementModal';
import { Avatar } from '@/components/shared/Avatar';
import { PageContainer } from '@/components/shared/PageContainer';
import { Separator } from '@/components/shared/Separator';
import { ChatListSkeleton, Skeleton } from '@/components/shared/Skeleton';
import { TaggedText } from '@/components/shared/TaggedText';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useA2A } from '@/hooks/useA2A';
import { useAuth } from '@/hooks/useAuth';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatParam } from '@/hooks/useChatParam';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useSSE } from '@/hooks/useSSE';
import { cn } from '@babylon/shared';
import { useAuthStore } from '@/stores/authStore';

type ChatFilter = 'all' | 'dms' | 'groups';

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
  } | null;
  messageCount?: number;
  qualityScore?: number;
  participants?: number;
  updatedAt: string;
  otherUser?: {
    id: string;
    displayName: string | null;
    username: string | null;
    profileImageUrl: string | null;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ChatDetails {
  chat: {
    id: string;
    name: string | null;
    isGroup: boolean;
    createdAt: string;
    updatedAt: string;
    otherUser?: {
      id: string;
      displayName: string | null;
      username: string | null;
      profileImageUrl: string | null;
    } | null;
  };
  messages: Message[];
  participants: Array<{
    id: string;
    displayName: string;
    username?: string;
    profileImageUrl?: string;
  }>;
}

// Helper to get the best profile URL identifier (prefer username over id)
const getProfilePath = (user: { id: string; username?: string | null }) => {
  // Use username if available (cleaner URLs), otherwise fall back to id
  const identifier = user.username || user.id;
  return `/profile/${identifier}`;
};

export default function ChatsPage() {
  const { ready, authenticated } = useAuth();
  const { user } = useAuthStore();
  const { getAccessToken } = usePrivy();
  useA2A();
  useChatParam();

  // Get global SSE connection status for status indicator
  // Subscribe to 'feed' channel to ensure connection is established (any valid channel works)
  const { isConnected: globalSSEConnected } = useSSE({
    channels: ['feed'], // Subscribe to feed channel to establish SSE connection
  });

  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [_loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendWarning, setSendWarning] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isLeaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [isLeavingChat, setIsLeavingChat] = useState(false);
  const [leaveChatError, setLeaveChatError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // Group modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupManagementModalOpen, setIsGroupManagementModalOpen] =
    useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollAdjustRef = useRef<{
    previousHeight: number;
    previousTop: number;
  } | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Use SSE for real-time messages with pagination
  const {
    messages: realtimeMessages,
    isConnected: sseConnected, // Connection status for the selected chat channel
    isLoadingMore,
    hasMore,
    loadMore,
    addMessage,
  } = useChatMessages(selectedChatId);

  // Pull-to-refresh state
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

  // Intersection observer to detect when user scrolls near the top
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
          console.log(
            '[ChatsPage] Sentinel intersected, loading more messages…'
          );
          pendingScrollAdjustRef.current = {
            previousHeight: container.scrollHeight,
            previousTop: container.scrollTop,
          };
          loadMore();
        }
      },
      {
        root: container,
        rootMargin: '0px 0px 0px 0px',
        threshold: 0.1,
      }
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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = chatContainerRef.current;
    if (container) {
      // Use rAF to ensure layout is measured after render
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Debug mode: enabled in localhost
  const isDebugMode =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  // Function declarations (before useEffects that use them)
  const loadChats = useCallback(async () => {
    console.log('[ChatsPage] loadChats called, isDebugMode:', isDebugMode);
    setLoading(true);

    try {
      // Skip token check in debug mode
      if (!isDebugMode) {
        // Ensure Privy is ready before getting token
        if (!ready || !authenticated) {
          console.log(
            '[ChatsPage] Privy not ready or not authenticated, skipping loadChats'
          );
          setLoading(false);
          return;
        }
      }

      const token = await getAccessToken();
      console.log('[ChatsPage] Got access token:', token ? 'yes' : 'no');
      if (!token && !isDebugMode) {
        console.warn(
          '[ChatsPage] No access token available, skipping loadChats'
        );
        setLoading(false);
        return;
      }

      // Fetch both personal chats (with DMs) AND game chats
      console.log('[ChatsPage] Fetching personal chats and game chats');
      const [personalResponse, gameResponse] = await Promise.all([
        fetch('/api/chats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        isDebugMode ? fetch('/api/chats?all=true') : Promise.resolve(null),
      ]);

      if (!personalResponse.ok) {
        throw new Error('Failed to fetch personal chats');
      }

      console.log(
        '[ChatsPage] Personal response status:',
        personalResponse.status
      );
      const personalData = await personalResponse.json();
      console.log('[ChatsPage] Personal response data:', personalData);

      let gameChats: Chat[] = [];
      if (gameResponse) {
        if (!gameResponse.ok) {
          console.warn(
            '[ChatsPage] Failed to fetch game chats, continuing with personal chats only'
          );
        } else {
          console.log('[ChatsPage] Game response status:', gameResponse.status);
          const gameData = await gameResponse.json();
          console.log('[ChatsPage] Game response data:', gameData);
          gameChats = gameData.chats || [];
        }
      }

      // Combine personal chats (groups + DMs) and game chats
      const combined = [
        ...(personalData.groupChats || []),
        ...(personalData.directChats || []),
        ...gameChats,
      ].sort((a, b) => {
        // Sort by last message time (most recent first)
        const aTime = a.lastMessage?.createdAt || a.updatedAt;
        const bTime = b.lastMessage?.createdAt || b.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      console.log('[ChatsPage] Combined chats (personal + game):', combined);
      setAllChats(combined);
    } catch (err) {
      console.error('[ChatsPage] Failed to load chats:', err);
      // Keep existing chats on error
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, isDebugMode, ready, authenticated]);

  // Define loadChatDetails BEFORE it's used in handleGroupUpdated
  const loadChatDetails = useCallback(
    async (chatId: string) => {
      setLoadingChat(true);

      if (isDebugMode) {
        const response = await fetch(`/api/chats/${chatId}?debug=true`);
        const data = await response.json();
        setChatDetails({
          ...data,
          chat: data.chat || null,
          messages: data.messages || [],
          participants: data.participants || [],
        });
        setLoadingChat(false);
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        console.error('Failed to get access token for loadChatDetails');
        setLoadingChat(false);
        return;
      }

      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // If chat doesn't exist yet (404), it's a new DM that hasn't been persisted
        if (response.status === 404) {
          // Chat will be created when first message is sent
          setLoadingChat(false);
          return;
        }

        if (!response.ok) {
          console.error('Failed to load chat details');
          setLoadingChat(false);
          return;
        }

        const data = await response.json();
        setChatDetails({
          ...data,
          chat: data.chat || null,
          messages: data.messages || [],
          participants: data.participants || [],
        });
      } catch (err) {
        console.error('Failed to load chat details:', err);
      } finally {
        setLoadingChat(false);
      }
    },
    [getAccessToken, isDebugMode]
  );

  const handleGroupCreated = useCallback(
    async (groupId: string, chatId: string) => {
      console.log('[ChatsPage] Group created:', groupId, chatId);

      // Reload chats to show the new group
      await loadChats();

      // Wait a moment for state to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Select the new chat
      setSelectedChatId(chatId);

      // Load the chat details immediately
      await loadChatDetails(chatId);

      console.log('[ChatsPage] Group created and loaded successfully');
    },
    [loadChats, loadChatDetails]
  );

  const handleGroupUpdated = useCallback(async () => {
    console.log('[ChatsPage] Group updated, reloading chats');
    await loadChats();
    // Reload chat details if currently viewing
    if (selectedChatId) {
      await loadChatDetails(selectedChatId);
    }
  }, [loadChats, selectedChatId, loadChatDetails]);

  const loadNewDMChat = useCallback(
    async (chatId: string, targetUserId: string) => {
      setLoadingChat(true);

      const token = await getAccessToken();
      if (!token) {
        console.error('Failed to get access token');
        setLoadingChat(false);
        return;
      }

      // Fetch target user info
      const response = await fetch(`/api/users/${targetUserId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {
        console.error('Failed to load user info');
        setLoadingChat(false);
        throw new Error('Failed to load user info');
      });

      if (!response.ok) {
        console.error('Failed to load user info');
        setLoadingChat(false);
        return;
      }

      const userData = await response.json();
      const targetUser = userData.user;

      // Create a virtual chat details object for new DM
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

      // Add to chat list immediately so it shows up
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
        // Check if chat already exists
        if (prev.some((c) => c.id === chatId)) {
          return prev;
        }
        return [newChat, ...prev];
      });

      setLoadingChat(false);
    },
    [getAccessToken, user]
  );

  // Track pending DM to load once user is available
  const [pendingDM, setPendingDM] = useState<{ chatId: string; targetUserId: string } | null>(null);

  // Check for chat ID in URL query params
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

  // Load user's chats from database
  useEffect(() => {
    if ((ready && authenticated) || isDebugMode) {
      loadChats();
    }
  }, [ready, authenticated, isDebugMode, loadChats]);

  // Load selected chat details from database
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
        return {
          ...prev,
          messages: realtimeMessages,
        };
      });
    }
  }, [realtimeMessages, chatDetails]);

  // Scroll to bottom when the newest message changes (initial load, new message, or chat switch)
  useEffect(() => {
    const msgs = chatDetails?.messages || [];
    const lastId = msgs.length > 0 ? msgs[msgs.length - 1]?.id : null;
    if (!lastId) return;

    const isNewMessage = lastId !== lastMessageIdRef.current;
    const shouldForce = lastMessageIdRef.current === null; // first load after chat switch
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

  const handleLeaveChat = async () => {
    if (!selectedChatId) return;
    setIsLeavingChat(true);
    setLeaveChatError(null);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setLeaveChatError('Authentication failed. Please try again.');
      setIsLeavingChat(false);
      return;
    }

    const response = await fetch(
      `/api/chats/${selectedChatId}/participants/me`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    ).catch((error: Error) => {
      setLeaveChatError(error.message);
      setIsLeavingChat(false);
      throw error;
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Failed to leave chat';
      setLeaveChatError(errorMessage);
      setIsLeavingChat(false);
      throw new Error(errorMessage);
    }

    setLeaveConfirmOpen(false);
    setSelectedChatId(null);
    await loadChats(); // Refresh the chat list
    setIsLeavingChat(false);
  };

  // Invite users handler (currently disabled)
  /*
  const handleInviteUsers = async (userIds: string[]) => {
    if (!selectedChatId) return

    const accessToken = await getAccessToken()
    if (!accessToken) {
      throw new Error('Authentication failed')
    }

    const response = await fetch(`/api/chats/${selectedChatId}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userIds }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to invite users')
    }

    // Reload chat details to show new participants
    await loadChatDetails(selectedChatId)
    await loadChats()
  }
  */

  const sendMessage = async () => {
    if (!selectedChatId || !messageInput.trim() || sending) return;

    setSending(true);
    setSendError(null);
    setSendWarning(null);
    setSendSuccess(false);

    const token = await getAccessToken();
    if (!token) {
      console.error('Failed to get access token for sendMessage');
      setSendError('Authentication required. Please log in again.');
      setSending(false);
      return;
    }

    const response = await fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: messageInput.trim() }),
    }).catch((error: Error) => {
      setSendError('Failed to send message. Please try again.');
      console.error('Send message error:', error);
      setSending(false);
      throw error;
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        (data && (data.error || data.message)) ||
        'Failed to send message. Please try again.';
      setSendError(message);
      setSending(false);
      return;
    }

    const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
    if (warnings.length > 0) {
      setSendWarning(warnings.join('. '));
      setTimeout(() => setSendWarning(null), 5000);
    }

    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 2000);

    // Add the message optimistically to show it immediately
    // This ensures the sender sees their message right away without waiting for SSE
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
    void loadChats(); // Refresh chat list to update last message

    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    // Initialize
    handleScroll();
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Filter chats based on active filter
  const filteredByType =
    activeFilter === 'all'
      ? allChats
      : activeFilter === 'dms'
        ? allChats.filter((c) => !c.isGroup)
        : allChats.filter((c) => c.isGroup);

  // Apply search filter
  const filteredChats = searchQuery
    ? filteredByType.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByType;

  // No games loaded state
  if (!ready && !authenticated) {
    return (
      <PageContainer noPadding className="flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto max-w-md p-8 text-center">
            <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-bold text-foreground text-xl">
              No Chats Yet
            </h2>
            <p className="mb-4 text-muted-foreground">
              Game is auto-generating in the background...
            </p>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p>This happens automatically on first run.</p>
              <p>Check the terminal logs for progress.</p>
              <p className="rounded bg-muted p-2 font-mono text-xs">
                First generation takes 3-5 minutes
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .chat-card {
            box-shadow: inset 5px 5px 5px rgba(0, 0, 0, 0.1), inset -5px -5px 5px rgba(255, 255, 255, 0.05);
          }

          .chat-button {
            box-shadow: inset 3px 3px 3px rgba(0, 0, 0, 0.1), inset -3px -3px 3px rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
          }

          .chat-button:hover:not(:disabled) {
            box-shadow: none;
          }

          .message-input {
            box-shadow: inset 3px 3px 5px rgba(0, 0, 0, 0.15), inset -3px -3px 5px rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
          }

          .message-input:focus {
            box-shadow: inset 3px 3px 5px rgba(28, 156, 240, 0.2), inset -3px -3px 5px rgba(28, 156, 240, 0.1);
          }

          .message-bubble {
            box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.15), -3px -3px 8px rgba(255, 255, 255, 0.05);
          }

          .chat-tab {
            box-shadow: inset 3px 3px 5px rgba(0, 0, 0, 0.1), inset -3px -3px 5px rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
          }

          .chat-tab-active {
            box-shadow: inset 3px 3px 5px rgba(28, 156, 240, 0.3), inset -3px -3px 5px rgba(28, 156, 240, 0.1);
          }
        `,
        }}
      />
      <PageContainer noPadding className="flex flex-col">
        {/* Desktop: Two Column Layout */}
        <div className="hidden flex-1 flex-col overflow-hidden xl:flex">
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Left Column: Chat List with Filters */}
              <div className="flex w-96 flex-col bg-background">
                {/* Header with Filters */}
                <div className="px-4 py-3">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-foreground text-xl">
                        Messages
                      </h2>
                      {globalSSEConnected ? (
                        <span
                          className="flex items-center gap-1 font-medium text-green-500 text-xs"
                          data-testid="sse-status"
                        >
                          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          Live
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 font-medium text-xs text-yellow-500"
                          data-testid="sse-status"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Connecting
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCreateGroupModalOpen(true)}
                      title="Create Group"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="mb-4 flex items-center border-border border-b">
                    <button
                      onClick={() => setActiveFilter('all')}
                      aria-label="Show all conversations"
                      className={cn(
                        'relative flex-1 py-3.5 font-semibold transition-all hover:bg-muted/20',
                        activeFilter === 'all'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFilter('dms')}
                      aria-label="Show direct messages"
                      className={cn(
                        'relative flex-1 py-3.5 font-semibold transition-all hover:bg-muted/20',
                        activeFilter === 'dms'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      DMs
                    </button>
                    <button
                      onClick={() => setActiveFilter('groups')}
                      aria-label="Show group chats"
                      className={cn(
                        'relative flex-1 py-3.5 font-semibold transition-all hover:bg-muted/20',
                        activeFilter === 'groups'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      Groups
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-2">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        'w-full rounded-lg py-2 pr-9 pl-9 text-sm',
                        'message-input bg-sidebar-accent/50',
                        'text-foreground placeholder:text-muted-foreground',
                        'outline-none'
                      )}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="-translate-y-1/2 absolute top-1/2 right-2 flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-muted-foreground/20"
                      >
                        <X className="h-4 w-4 text-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chat List */}
                <div className="mt-2 flex-1 overflow-y-auto">
                  {_loading ? (
                    <ChatListSkeleton count={10} />
                  ) : filteredChats.length === 0 ? (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p className="text-sm">
                        {searchQuery
                          ? 'No conversations found'
                          : activeFilter === 'all'
                            ? 'No conversations yet'
                            : activeFilter === 'dms'
                              ? 'No direct messages yet'
                              : 'No group chats yet'}
                      </p>
                      {!searchQuery && activeFilter === 'dms' && (
                        <p className="mt-2 text-muted-foreground text-xs">
                          Visit a user&apos;s profile to start a DM
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredChats.map((chat, idx) => (
                      <React.Fragment key={chat.id}>
                        <div
                          onClick={() => setSelectedChatId(chat.id)}
                          className={cn(
                            'cursor-pointer px-4 py-3 transition-all duration-300',
                            selectedChatId === chat.id
                              ? 'border-l-4 bg-sidebar-accent/50'
                              : 'hover:bg-sidebar-accent/30'
                          )}
                          style={{
                            borderLeftColor:
                              selectedChatId === chat.id
                                ? '#b82323'
                                : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {chat.isGroup ? (
                              <div className="chat-button flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/50">
                                <Users
                                  className="h-5 w-5"
                                  style={{ color: '#b82323' }}
                                />
                              </div>
                            ) : (
                              <Avatar
                                id={chat.otherUser?.id || ''}
                                name={
                                  chat.otherUser?.displayName ||
                                  chat.otherUser?.username ||
                                  'User'
                                }
                                type="user"
                                size="md"
                                imageUrl={
                                  chat.otherUser?.profileImageUrl || undefined
                                }
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold text-foreground text-sm">
                                {chat.name}
                              </div>
                              <div className="truncate text-muted-foreground text-xs">
                                {chat.lastMessage?.content || 'No messages yet'}
                              </div>
                            </div>
                          </div>
                        </div>
                        {idx < filteredChats.length - 1 && <Separator />}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>

              {/* Vertical Separator */}
              <Separator orientation="vertical" className="shrink-0" />

              {/* Right Column: Chat View */}
              <div className="flex h-screen min-h-screen flex-1 flex-col bg-background">
                {selectedChatId && chatDetails ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between bg-background px-4 py-4">
                      <div className="flex items-center gap-3">
                        {chatDetails.chat.isGroup ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent/50">
                            <Users
                              className="h-5 w-5"
                              style={{ color: '#b82323' }}
                            />
                          </div>
                        ) : chatDetails.chat.otherUser ? (
                          <Link
                            href={getProfilePath(chatDetails.chat.otherUser)}
                            className="transition-opacity hover:opacity-80"
                          >
                            <Avatar
                              id={chatDetails.chat.otherUser.id}
                              name={chatDetails.chat.otherUser.displayName || 'User'}
                              type="user"
                              size="md"
                              imageUrl={chatDetails.chat.otherUser.profileImageUrl || undefined}
                            />
                          </Link>
                        ) : (
                          <Avatar
                            id=""
                            name="User"
                            type="user"
                            size="md"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            {chatDetails.chat.isGroup ? (
                              <h3 className="font-bold text-foreground text-lg">
                                {chatDetails.chat.name || 'Chat'}
                              </h3>
                            ) : chatDetails.chat.otherUser ? (
                              <Link
                                href={getProfilePath(chatDetails.chat.otherUser)}
                                className="font-bold text-foreground text-lg transition-colors hover:text-primary"
                              >
                                {chatDetails.chat.otherUser.displayName || 'Chat'}
                              </Link>
                            ) : (
                              <h3 className="font-bold text-foreground text-lg">
                                Chat
                              </h3>
                            )}
                            {/* Show chat-specific SSE connection status */}
                            {sseConnected ? (
                              <span
                                className="flex items-center gap-1 font-medium text-green-500 text-xs"
                                data-testid="chat-sse-status"
                              >
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                Live
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 font-medium text-xs text-yellow-500"
                                data-testid="chat-sse-status"
                              >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Connecting
                              </span>
                            )}
                          </div>
                          {chatDetails.chat.isGroup && (
                            <p className="text-muted-foreground text-xs">
                              {chatDetails.participants.length} participants
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {chatDetails.chat.isGroup && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                // Fetch the group ID from the chat
                                const token = await getAccessToken();
                                const response = await fetch(
                                  `/api/chats/${chatDetails.chat.id}/group`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                ).catch((error: Error) => {
                                  console.error(
                                    'Error fetching group ID:',
                                    error
                                  );
                                  throw error;
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  setSelectedGroupId(data.groupId);
                                  setIsGroupManagementModalOpen(true);
                                } else {
                                  console.error('Failed to get group ID');
                                }
                              }}
                              title="Manage Group"
                            >
                              <Settings className="h-5 w-5" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLeaveConfirmOpen(true)}
                                  className="text-red-500"
                                >
                                  <LogOut className="mr-2 h-4 w-4" />
                                  <span>Leave Chat</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Header Separator */}
                    <div className="px-4">
                      <Separator />
                    </div>

                    {/* Messages */}
                    <div
                      ref={setRefs}
                      className="relative flex-1 space-y-4 overflow-y-auto px-4 py-3"
                    >
                      {/* Gradient overlay to hint more messages */}
                      {hasMore && (
                        <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b from-background via-background/90 to-transparent" />
                      )}

                      {/* Pull-to-refresh indicator */}
                      {pullDistance > 0 && (
                        <div
                          className="absolute top-0 right-0 left-0 flex items-center justify-center py-2 transition-opacity"
                          style={{ opacity: Math.min(pullDistance / 80, 1) }}
                        >
                          <Loader2
                            className={cn(
                              'h-6 w-6 text-primary',
                              pullDistance > 80 ? 'animate-spin' : ''
                            )}
                          />
                        </div>
                      )}

                      {/* Sentinel for infinite scroll */}
                      <div ref={topSentinelRef} className="h-1 w-full" />

                      {/* Loading more messages indicator */}
                      {isLoadingMore && (
                        <div className="sticky top-2 z-20 flex justify-center">
                          <div className="flex items-center gap-2 rounded-full bg-background/85 px-3 py-1 font-medium text-muted-foreground text-xs shadow-sm backdrop-blur">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Loading previous messages…</span>
                          </div>
                        </div>
                      )}

                      {loadingChat ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="w-full max-w-md space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                          </div>
                        </div>
                      ) : (
                        (chatDetails?.messages || []).map((msg, i) => {
                          const msgDate = new Date(msg.createdAt);
                          const sender = chatDetails?.participants?.find(
                            (p) => p.id === msg.senderId
                          );
                          const senderName = sender?.displayName || 'Unknown';
                          const isCurrentUser =
                            user?.id && msg.senderId === user.id;

                          return (
                            <div
                              key={i}
                              className={cn(
                                'flex gap-3',
                                isCurrentUser ? 'justify-end' : 'items-start'
                              )}
                            >
                              {!isCurrentUser && sender && (
                                <Link
                                  href={getProfilePath(sender)}
                                  className="shrink-0 transition-opacity hover:opacity-80"
                                >
                                  <Avatar
                                    id={sender.id}
                                    name={senderName}
                                    type="user"
                                    size="md"
                                    imageUrl={sender.profileImageUrl}
                                  />
                                </Link>
                              )}
                              {!isCurrentUser && !sender && (
                                <Avatar
                                  id={msg.senderId}
                                  name={senderName}
                                  type="user"
                                  size="md"
                                />
                              )}
                              <div
                                className={cn(
                                  'flex max-w-[70%] flex-col',
                                  isCurrentUser ? 'items-end' : 'items-start'
                                )}
                              >
                                <div className="mb-1 flex flex-wrap items-center gap-3">
                                  {!isCurrentUser && sender && (
                                    <Link
                                      href={getProfilePath(sender)}
                                      className="font-bold text-foreground text-sm transition-colors hover:text-primary"
                                    >
                                      {senderName}
                                    </Link>
                                  )}
                                  {!isCurrentUser && !sender && (
                                    <span className="font-bold text-foreground text-sm">
                                      {senderName}
                                    </span>
                                  )}
                                  {!isCurrentUser && (
                                    <span className="text-muted-foreground">
                                      ·
                                    </span>
                                  )}
                                  <span className="text-muted-foreground text-xs">
                                    {msgDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}{' '}
                                    at{' '}
                                    {msgDate.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    'message-bubble whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm',
                                    isCurrentUser
                                      ? 'rounded-tr-sm'
                                      : 'rounded-tl-sm'
                                  )}
                                  style={{
                                    backgroundColor: isCurrentUser
                                      ? '#0066FF20'
                                      : 'rgba(var(--sidebar-accent), 0.5)',
                                  }}
                                >
                                  <TaggedText
                                    text={msg.content}
                                    onTagClick={(tag) => setSearchQuery(tag)}
                                    className="text-foreground"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {(chatDetails?.messages || []).length === 0 &&
                        !loadingChat && (
                          <div className="flex h-full items-center justify-center">
                            <div className="max-w-md p-8 text-center text-muted-foreground">
                              <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                              <p className="mb-2 text-foreground">
                                No messages yet
                              </p>
                              {authenticated && (
                                <p className="text-muted-foreground text-xs">
                                  Be the first to send a message!
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Feedback Messages */}
                    {authenticated &&
                      (sendError || sendSuccess || sendWarning) && (
                        <div className="px-4">
                          {sendError && (
                            <div
                              className="mb-2 flex items-center gap-2 rounded-lg border-2 bg-sidebar-accent/30 p-2"
                              style={{ borderColor: '#f59e0b' }}
                            >
                              <AlertCircle
                                className="h-4 w-4 shrink-0"
                                style={{ color: '#f59e0b' }}
                              />
                              <span
                                className="text-xs"
                                style={{ color: '#f59e0b' }}
                              >
                                {sendError}
                              </span>
                            </div>
                          )}
                          {sendWarning && (
                            <div
                              className="mb-2 flex items-center gap-2 rounded-lg border-2 bg-sidebar-accent/30 p-2"
                              style={{ borderColor: '#3b82f6' }}
                            >
                              <AlertCircle
                                className="h-4 w-4 shrink-0"
                                style={{ color: '#3b82f6' }}
                              />
                              <span
                                className="text-xs"
                                style={{ color: '#3b82f6' }}
                              >
                                Sent · {sendWarning}
                              </span>
                            </div>
                          )}
                          {sendSuccess && (
                            <div
                              className="mb-2 flex items-center gap-2 rounded-lg border-2 bg-sidebar-accent/30 p-2"
                              style={{ borderColor: '#10b981' }}
                            >
                              <Check
                                className="h-4 w-4 shrink-0"
                                style={{ color: '#10b981' }}
                              />
                              <span
                                className="text-xs"
                                style={{ color: '#10b981' }}
                              >
                                Message sent!
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Input Separator */}
                    <div className="px-4">
                      <Separator />
                    </div>

                    {/* Message Input */}
                    {authenticated ? (
                      <div className="bg-background px-4 py-3">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            disabled={sending}
                            className={cn(
                              'flex-1 rounded-lg px-4 py-3 text-sm',
                              'message-input bg-sidebar-accent/50',
                              'text-foreground placeholder:text-muted-foreground',
                              'outline-none',
                              'disabled:cursor-not-allowed disabled:opacity-50'
                            )}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!messageInput.trim() || sending}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-4 py-3 font-semibold',
                              'chat-button bg-sidebar-accent/50',
                              'transition-all duration-300',
                              'disabled:cursor-not-allowed disabled:opacity-50'
                            )}
                            style={{ color: '#0066FF' }}
                          >
                            {sending ? (
                              <Skeleton className="h-5 w-5 rounded" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-background px-4 py-3">
                        <div className="text-center">
                          <p className="mb-3 text-muted-foreground text-sm">
                            Log in to send messages
                          </p>
                          <LoginButton />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="max-w-md p-8 text-center text-muted-foreground">
                      <MessageCircle className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <h3 className="mb-2 font-bold text-foreground text-xl">
                        Select a chat
                      </h3>
                      <p className="text-sm">
                        Choose a conversation from the list to view messages
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Responsive Layout */}
        <div className="flex flex-1 flex-col overflow-hidden xl:hidden">
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Chat List (full screen on mobile, side panel on tablet when chat selected) */}
              <div
                className={cn(
                  'w-full flex-col bg-background',
                  selectedChatId ? 'hidden lg:flex lg:w-96' : 'flex'
                )}
              >
                {/* Mobile Header with Tabs */}
                <div className="px-4 py-3">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-foreground text-xl">
                        Messages
                      </h2>
                      {globalSSEConnected ? (
                        <span
                          className="flex items-center gap-1 font-medium text-green-500 text-xs"
                          data-testid="sse-status"
                        >
                          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          Live
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 font-medium text-xs text-yellow-500"
                          data-testid="sse-status"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Connecting
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCreateGroupModalOpen(true)}
                      title="Create Group"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="mb-4 flex items-center border-border border-b">
                    <button
                      onClick={() => setActiveFilter('all')}
                      aria-label="Show all conversations"
                      className={cn(
                        'relative flex-1 py-3.5 font-semibold transition-all hover:bg-muted/20',
                        activeFilter === 'all'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFilter('dms')}
                      aria-label="Show direct messages"
                      className={cn(
                        'relative flex-1 py-3.5 font-semibold transition-all hover:bg-muted/20',
                        activeFilter === 'dms'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      DMs
                    </button>
                    <button
                      onClick={() => setActiveFilter('groups')}
                      aria-label="Show group chats"
                      className={cn(
                        'relative flex-1 py-3.5 font-semibold transition-all hover:bg-muted/20',
                        activeFilter === 'groups'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      Groups
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-2">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        'w-full rounded-lg py-2 pr-9 pl-9 text-sm',
                        'message-input bg-sidebar-accent/50',
                        'text-foreground placeholder:text-muted-foreground',
                        'outline-none'
                      )}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chat List */}
                <div className="mt-2 flex-1 overflow-y-auto">
                  {_loading ? (
                    <ChatListSkeleton count={10} />
                  ) : filteredChats.length === 0 ? (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p className="text-sm">
                        {searchQuery
                          ? 'No conversations found'
                          : activeFilter === 'all'
                            ? 'No conversations yet'
                            : activeFilter === 'dms'
                              ? 'No direct messages yet'
                              : 'No group chats yet'}
                      </p>
                      {!searchQuery && activeFilter === 'dms' && (
                        <p className="mt-2 text-muted-foreground text-xs">
                          Visit a user&apos;s profile to start a DM
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredChats.map((chat, idx) => (
                      <React.Fragment key={chat.id}>
                        <div
                          onClick={() => setSelectedChatId(chat.id)}
                          className={cn(
                            'cursor-pointer px-4 py-3 transition-all duration-300',
                            selectedChatId === chat.id
                              ? 'border-l-4 bg-sidebar-accent/50'
                              : 'hover:bg-sidebar-accent/30'
                          )}
                          style={{
                            borderLeftColor:
                              selectedChatId === chat.id
                                ? '#b82323'
                                : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {chat.isGroup ? (
                              <div className="chat-button flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/50">
                                <Users
                                  className="h-5 w-5"
                                  style={{ color: '#b82323' }}
                                />
                              </div>
                            ) : (
                              <Avatar
                                id={chat.otherUser?.id || ''}
                                name={
                                  chat.otherUser?.displayName ||
                                  chat.otherUser?.username ||
                                  'User'
                                }
                                type="user"
                                size="md"
                                imageUrl={
                                  chat.otherUser?.profileImageUrl || undefined
                                }
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold text-foreground text-sm">
                                {chat.name}
                              </div>
                              <div className="truncate text-muted-foreground text-xs">
                                {chat.lastMessage?.content || 'No messages yet'}
                              </div>
                            </div>
                          </div>
                        </div>
                        {idx < filteredChats.length - 1 && <Separator />}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>

              {/* Vertical Separator for Tablet */}
              {selectedChatId && (
                <Separator
                  orientation="vertical"
                  className="hidden shrink-0 lg:block"
                />
              )}

              {/* Chat View (full screen on mobile, shared on tablet) */}
              {selectedChatId && chatDetails && (
                <div
                  className={cn(
                    'h-screen min-h-screen flex-1 flex-col bg-background',
                    !selectedChatId ? 'hidden lg:flex' : 'flex'
                  )}
                >
                  {/* Mobile/Tablet Header with Back Button */}
                  <div className="bg-background px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedChatId(null)}
                        className="flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-foreground text-sm transition-colors hover:bg-sidebar-accent/50 lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                      {chatDetails.chat.isGroup ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent/50">
                          <Users
                            className="h-5 w-5"
                            style={{ color: '#b82323' }}
                          />
                        </div>
                      ) : chatDetails.chat.otherUser ? (
                        <Link
                          href={getProfilePath(chatDetails.chat.otherUser)}
                          className="transition-opacity hover:opacity-80"
                        >
                          <Avatar
                            id={chatDetails.chat.otherUser.id}
                            name={chatDetails.chat.otherUser.displayName || 'User'}
                            type="user"
                            size="md"
                            imageUrl={chatDetails.chat.otherUser.profileImageUrl || undefined}
                          />
                        </Link>
                      ) : (
                        <Avatar
                          id=""
                          name="User"
                          type="user"
                          size="md"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {chatDetails.chat.isGroup ? (
                            <h3 className="font-bold text-foreground text-lg">
                              {chatDetails.chat.name || 'Chat'}
                            </h3>
                          ) : chatDetails.chat.otherUser ? (
                            <Link
                              href={getProfilePath(chatDetails.chat.otherUser)}
                              className="font-bold text-foreground text-lg transition-colors hover:text-primary"
                            >
                              {chatDetails.chat.otherUser.displayName || 'Chat'}
                            </Link>
                          ) : (
                            <h3 className="font-bold text-foreground text-lg">
                              Chat
                            </h3>
                          )}
                          {/* Show chat-specific SSE connection status */}
                          {sseConnected ? (
                            <span
                              className="flex items-center gap-1 font-medium text-green-500 text-xs"
                              data-testid="chat-sse-status"
                            >
                              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                              Live
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1 font-medium text-xs text-yellow-500"
                              data-testid="chat-sse-status"
                            >
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Connecting
                            </span>
                          )}
                        </div>
                        {chatDetails.chat.isGroup && (
                          <p className="text-muted-foreground text-xs">
                            {chatDetails.participants.length} participants
                          </p>
                        )}
                      </div>

                      {chatDetails.chat.isGroup && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              // Fetch the group ID from the chat
                              const token = await getAccessToken();
                              const response = await fetch(
                                `/api/chats/${chatDetails.chat.id}/group`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              ).catch((error: Error) => {
                                console.error(
                                  'Error fetching group ID:',
                                  error
                                );
                                throw error;
                              });

                              if (response.ok) {
                                const data = await response.json();
                                setSelectedGroupId(data.groupId);
                                setIsGroupManagementModalOpen(true);
                              } else {
                                console.error('Failed to get group ID');
                              }
                            }}
                            title="Manage Group"
                          >
                            <Settings className="h-5 w-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setLeaveConfirmOpen(true)}
                                className="text-red-500"
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Leave Chat</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Header Separator */}
                  <div className="px-4">
                    <Separator />
                  </div>

                  {/* Messages */}
                  <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
                    {loadingChat ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="w-full max-w-md space-y-3">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </div>
                    ) : (
                      (chatDetails?.messages || []).map((msg, i) => {
                        const msgDate = new Date(msg.createdAt);
                        const sender = chatDetails?.participants?.find(
                          (p) => p.id === msg.senderId
                        );
                        const senderName = sender?.displayName || 'Unknown';
                        const isCurrentUser =
                          user?.id && msg.senderId === user.id;

                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex gap-3',
                              isCurrentUser ? 'justify-end' : 'items-start'
                            )}
                          >
                            {!isCurrentUser && sender && (
                              <Link
                                href={getProfilePath(sender)}
                                className="shrink-0 transition-opacity hover:opacity-80"
                              >
                                <Avatar
                                  id={sender.id}
                                  name={senderName}
                                  type="user"
                                  size="md"
                                  imageUrl={sender.profileImageUrl}
                                />
                              </Link>
                            )}
                            {!isCurrentUser && !sender && (
                              <Avatar
                                id={msg.senderId}
                                name={senderName}
                                type="user"
                                size="md"
                              />
                            )}
                            <div
                              className={cn(
                                'flex max-w-[70%] flex-col',
                                isCurrentUser ? 'items-end' : 'items-start'
                              )}
                            >
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                {!isCurrentUser && sender && (
                                  <Link
                                    href={getProfilePath(sender)}
                                    className="font-bold text-foreground text-sm transition-colors hover:text-primary"
                                  >
                                    {senderName}
                                  </Link>
                                )}
                                {!isCurrentUser && !sender && (
                                  <span className="font-bold text-foreground text-sm">
                                    {senderName}
                                  </span>
                                )}
                                {!isCurrentUser && (
                                  <span className="text-muted-foreground">
                                    ·
                                  </span>
                                )}
                                <span className="text-muted-foreground text-xs">
                                  {msgDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}{' '}
                                  at{' '}
                                  {msgDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  'message-bubble whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm',
                                  isCurrentUser
                                    ? 'rounded-tr-sm'
                                    : 'rounded-tl-sm'
                                )}
                                style={{
                                  backgroundColor: isCurrentUser
                                    ? '#0066FF20'
                                    : 'rgba(var(--sidebar-accent), 0.5)',
                                }}
                              >
                                <TaggedText
                                  text={msg.content}
                                  onTagClick={(tag) => setSearchQuery(tag)}
                                  className="text-foreground"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {(chatDetails?.messages || []).length === 0 &&
                      !loadingChat && (
                        <div className="flex h-full items-center justify-center">
                          <div className="max-w-md p-8 text-center text-muted-foreground">
                            <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <p className="mb-2 text-foreground">
                              No messages yet
                            </p>
                            {authenticated && (
                              <p className="text-muted-foreground text-xs">
                                Be the first to send a message!
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Feedback Messages */}
                  {authenticated &&
                    (sendError || sendSuccess || sendWarning) && (
                      <div className="px-4">
                        {sendError && (
                          <div
                            className="mb-2 flex items-center gap-2 rounded-lg border-2 bg-sidebar-accent/30 p-2"
                            style={{ borderColor: '#f59e0b' }}
                          >
                            <AlertCircle
                              className="h-4 w-4 shrink-0"
                              style={{ color: '#f59e0b' }}
                            />
                            <span
                              className="text-xs"
                              style={{ color: '#f59e0b' }}
                            >
                              {sendError}
                            </span>
                          </div>
                        )}
                        {sendWarning && (
                          <div
                            className="mb-2 flex items-center gap-2 rounded-lg border-2 bg-sidebar-accent/30 p-2"
                            style={{ borderColor: '#3b82f6' }}
                          >
                            <AlertCircle
                              className="h-4 w-4 shrink-0"
                              style={{ color: '#3b82f6' }}
                            />
                            <span
                              className="text-xs"
                              style={{ color: '#3b82f6' }}
                            >
                              Sent · {sendWarning}
                            </span>
                          </div>
                        )}
                        {sendSuccess && (
                          <div
                            className="mb-2 flex items-center gap-2 rounded-lg border-2 bg-sidebar-accent/30 p-2"
                            style={{ borderColor: '#10b981' }}
                          >
                            <Check
                              className="h-4 w-4 shrink-0"
                              style={{ color: '#10b981' }}
                            />
                            <span
                              className="text-xs"
                              style={{ color: '#10b981' }}
                            >
                              Message sent!
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Input Separator */}
                  <div className="px-4">
                    <Separator />
                  </div>

                  {/* Message Input */}
                  {authenticated ? (
                    <div className="bg-background px-4 py-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          disabled={sending}
                          className={cn(
                            'flex-1 rounded-lg px-4 py-3 text-sm',
                            'message-input bg-sidebar-accent/50',
                            'text-foreground placeholder:text-muted-foreground',
                            'outline-none',
                            'disabled:cursor-not-allowed disabled:opacity-50'
                          )}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!messageInput.trim() || sending}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-3 font-semibold',
                            'chat-button bg-sidebar-accent/50',
                            'transition-all duration-300',
                            'disabled:cursor-not-allowed disabled:opacity-50'
                          )}
                          style={{ color: '#0066FF' }}
                        >
                          {sending ? (
                            <Skeleton className="h-5 w-5 rounded" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-background px-4 py-3">
                      <div className="text-center">
                        <p className="mb-3 text-muted-foreground text-sm">
                          Log in to send messages
                        </p>
                        <LoginButton />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Leave Chat Confirmation Dialog */}
      <AlertDialog open={isLeaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to leave this chat?
              </p>
              {leaveChatError && (
                <p className="mt-2 text-red-500 text-sm">{leaveChatError}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setLeaveConfirmOpen(false);
                setLeaveChatError(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveChat}
              className={buttonVariants()}
              disabled={isLeavingChat}
            >
              {isLeavingChat && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      <GroupManagementModal
        isOpen={isGroupManagementModalOpen}
        onClose={() => {
          setIsGroupManagementModalOpen(false);
          setSelectedGroupId(null);
        }}
        groupId={selectedGroupId}
        onGroupUpdated={handleGroupUpdated}
      />
    </>
  );
}
