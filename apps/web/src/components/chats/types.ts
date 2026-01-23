import type { MessageType } from '@babylon/shared';

export { MessageTypeEnum } from '@babylon/shared';
export type { MessageType };

export type ChatFilter = 'all' | 'dms' | 'groups';

export interface Chat {
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
    /** Whether this user is an AI agent */
    isAgent?: boolean;
    /** The user ID that manages this agent (for detecting own agents) */
    managedBy?: string | null;
  };
  nftRequirement?: {
    contractAddress: string;
    tokenId: number | null;
    chainId: number;
    chainName: string;
  };
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  type?: MessageType;
  createdAt: string;
  /** Stable key for React rendering - prevents flash when optimistic messages are replaced */
  stableKey?: string;
}

export interface ChatParticipant {
  id: string;
  displayName: string;
  username?: string;
  profileImageUrl?: string;
}

export interface ChatDetails {
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
      /** Whether this user is an AI agent */
      isAgent?: boolean;
      /** The user ID that manages this agent (for detecting own agents) */
      managedBy?: string | null;
    } | null;
    nftRequirement?: {
      contractAddress: string;
      tokenId: number | null;
      chainId: number;
      chainName: string;
    };
  };
  messages: Message[];
  participants: ChatParticipant[];
}

// Helper to get the best profile URL identifier (prefer username over id)
export const getProfilePath = (user: {
  id: string;
  username?: string | null;
}) => {
  const identifier = user.username || user.id;
  return `/profile/${identifier}`;
};
