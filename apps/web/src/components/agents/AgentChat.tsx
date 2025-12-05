'use client';

import { Send, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/shared/Avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@babylon/shared';
import { cn } from '@babylon/shared';

/**
 * Chat message structure for agent chat.
 */
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  pointsCost: number;
  createdAt: string;
}

/**
 * Agent chat component for chatting with agents.
 *
 * Provides a chat interface for interacting with agents. Supports both
 * free and pro model tiers. Displays message history, points cost per
 * message, and handles message sending with loading states.
 *
 * Features:
 * - Message history display
 * - Message sending
 * - Points cost display
 * - Model tier selection (free/pro)
 * - Auto-scroll to bottom
 * - Loading states
 * - Error handling
 *
 * @param props - AgentChat component props
 * @returns Agent chat element
 *
 * @example
 * ```tsx
 * <AgentChat
 *   agent={agentData}
 *   onBalanceUpdate={(newBalance) => setAgent(prev => ({ ...prev, pointsBalance: newBalance }))}
 * />
 * ```
 */
interface AgentChatProps {
  agent: {
    id: string;
    name: string;
    profileImageUrl?: string;
    pointsBalance: number;
    modelTier: 'free' | 'pro';
  };
  onBalanceUpdate?: (newBalance: number) => void;
}

export function AgentChat({ agent, onBalanceUpdate }: AgentChatProps) {
  const { user, getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [usePro, setUsePro] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/agents/${agent.id}/chat?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = (await res.json()) as {
          success: boolean;
          messages: Message[];
        };
        if (data.success && data.messages) {
          setMessages(data.messages.reverse());
        }
      } else {
        logger.error('Failed to fetch messages', undefined, 'AgentChat');
      }
    } catch (error) {
      logger.error('Error fetching messages', { error }, 'AgentChat');
    } finally {
      setLoading(false);
    }
  }, [agent.id, getAccessToken]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input;
    setInput('');
    setSending(true);

    // Optimistically add user message
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      pointsCost: 0,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          usePro,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { error: string };
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        );
        toast.error(error.error || 'Failed to send message');
        setSending(false);
        return;
      }

      const data = (await res.json()) as {
        success: boolean;
        messageId: string;
        response: string;
        modelUsed: string;
        pointsCost: number;
        balanceAfter: number;
      };

      if (!data.response || !data.messageId) {
        throw new Error('Invalid response from agent');
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.response,
        modelUsed: data.modelUsed,
        pointsCost: data.pointsCost,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update agent balance without full page refresh
      onBalanceUpdate?.(data.balanceAfter);
      toast.success(`Message sent (-${data.pointsCost} points)`);
    } catch (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message';
      toast.error(errorMessage);
      logger.error('Chat error', { error }, 'AgentChat');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-lg border border-border bg-card/50 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b p-4">
        <div>
          <h3 className="font-semibold">Chat with {agent.name}</h3>
          <p className="text-muted-foreground text-sm">
            {agent.pointsBalance} points available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUsePro(!usePro)}
            disabled={agent.modelTier === 'free'}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50',
              usePro
                ? 'bg-[#0066FF] text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            )}
          >
            <Sparkles className="h-4 w-4" />
            {usePro ? 'Pro Mode' : 'Free Mode'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation with your agent!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar
                  id={agent.id}
                  name={agent.name}
                  type="user"
                  size="sm"
                  src={agent.profileImageUrl}
                  imageUrl={agent.profileImageUrl}
                />
              )}

              <div
                className={cn(
                  'max-w-[70%] rounded-lg p-3',
                  message.role === 'user'
                    ? 'bg-[#0066FF] text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                  {message.modelUsed && (
                    <>
                      <span>•</span>
                      <span>{message.modelUsed}</span>
                    </>
                  )}
                  {message.pointsCost > 0 && (
                    <>
                      <span>•</span>
                      <span>{message.pointsCost}pts</span>
                    </>
                  )}
                </div>
              </div>

              {message.role === 'user' && user && (
                <Avatar
                  id={user.id}
                  name={user.displayName || user.email || 'You'}
                  type="user"
                  size="sm"
                  src={user.profileImageUrl}
                  imageUrl={user.profileImageUrl}
                />
              )}
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start gap-3">
            <Avatar
              id={agent.id}
              name={agent.name}
              type="user"
              size="sm"
              src={agent.profileImageUrl}
              imageUrl={agent.profileImageUrl}
            />
            <div className="rounded-lg bg-muted p-3">
              <div className="flex gap-1">
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-border border-t p-4">
        {agent.pointsBalance < 1 ? (
          <div className="py-2 text-center text-red-600 text-sm">
            Insufficient points. Please deposit points to continue chatting.
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || agent.pointsBalance < 1}
              className="flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 font-medium text-primary-foreground transition-all hover:bg-[#2952d9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
