import type { RedisClient } from 'bun';
import type { Database } from './db/db';
import type { UserId } from './db/typeid';
import { env } from './env';
import type { Logger } from './logger';
import {
  type AuthenticatedUser as BaseAuthenticatedUser,
  extractToken,
  verifyPrivyToken,
} from './privy-auth';
import type { ChatService } from './services/chat.service';
import type { DmService } from './services/dm.service';
import type { GroupService } from './services/group.service';
import type { MessageService } from './services/message.service';
import type { ModerationService } from './services/moderation.service';
import type { UserService } from './services/user.service';

/**
 * Authenticated user in chat-api context
 * Extends base auth with chat-specific UserId type
 */
export type AuthenticatedUser = Omit<BaseAuthenticatedUser, 'userId'> & {
  userId: UserId;
};

/**
 * Dependencies passed to createApp
 */
export type ContextDeps = {
  db: Database;
  logger: Logger;
  redis: RedisClient;
  chatService: ChatService;
  dmService: DmService;
  messageService: MessageService;
  moderationService: ModerationService;
  groupService: GroupService;
  userService: UserService;
};

/**
 * Options for creating context per-request
 */
export type CreateContextOptions = ContextDeps & {
  headers: Headers;
  requestId: string;
};

/**
 * Full context available in oRPC handlers
 */
export type Context = {
  // Request-scoped
  requestId: string;
  headers: Headers;
  user: AuthenticatedUser | null;

  // Dependencies
  db: Database;
  logger: Logger;
  redis: RedisClient;

  // Services
  chatService: ChatService;
  dmService: DmService;
  messageService: MessageService;
  moderationService: ModerationService;
  groupService: GroupService;
};

/**
 * Verify authentication from request headers
 *
 * Supports:
 * 1. Privy token (cookie or Bearer header) - for users
 * 2. Inter-service auth (x-user-id + x-service-secret) - for internal services (backwards compat)
 */
async function verifyAuth(
  headers: Headers,
  userService: UserService,
  logger?: Logger
): Promise<AuthenticatedUser | null> {
  // Try inter-service auth first (backwards compatibility)
  const userId = headers.get('x-user-id');
  const privyId = headers.get('x-privy-id');
  const serviceSecret = headers.get('x-service-secret');

  if (serviceSecret && userId) {
    if (serviceSecret === env.CHAT_API_SECRET) {
      logger?.debug({
        msg: 'Inter-service auth successful',
        userId,
      });
      return {
        userId: userId as UserId,
        privyId: privyId ?? userId,
        isAgent: false,
      };
    }
  }

  // Try Privy token auth
  const token = extractToken(headers);
  if (!token) {
    return null;
  }

  try {
    const user = await verifyPrivyToken(
      token,
      (privyId, walletAddress) =>
        userService.lookupByPrivyId(privyId, walletAddress),
      logger
    );
    return {
      ...user,
      userId: user.userId as UserId,
    };
  } catch (error) {
    logger?.warn({
      msg: 'Privy auth failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Create context for each request
 */
export async function createContext(
  options: CreateContextOptions
): Promise<Context> {
  const {
    headers,
    requestId,
    db,
    logger,
    redis,
    chatService,
    dmService,
    messageService,
    moderationService,
    groupService,
    userService,
  } = options;

  const user = await verifyAuth(headers, userService, logger);

  return {
    requestId,
    headers,
    user,
    db,
    logger,
    redis,
    chatService,
    dmService,
    messageService,
    moderationService,
    groupService,
  };
}
