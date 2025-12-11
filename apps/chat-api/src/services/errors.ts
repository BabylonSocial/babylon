/**
 * Service Error Types
 *
 * Discriminated union error types for each service.
 * Each error has a `type` field for matching and a `message` field for details.
 */

// Chat Service Errors
export type ChatServiceError =
  | { type: 'CHAT_NOT_FOUND'; message: string }
  | { type: 'CREATE_CHAT_ERROR'; message: string; cause?: unknown }
  | { type: 'LIST_CHATS_ERROR'; message: string; cause?: unknown }
  | { type: 'LEAVE_CHAT_ERROR'; message: string; cause?: unknown }
  | { type: 'GET_GROUP_ID_ERROR'; message: string; cause?: unknown }
  | { type: 'GET_UNREAD_COUNT_ERROR'; message: string; cause?: unknown }
  | { type: 'GET_PARTICIPANTS_ERROR'; message: string; cause?: unknown }
  | { type: 'NOT_GROUP_CHAT'; message: string }
  | { type: 'ACCESS_DENIED'; message: string };

// DM Service Errors
export type DmServiceError =
  | { type: 'DM_NOT_FOUND'; message: string }
  | { type: 'CREATE_DM_ERROR'; message: string; cause?: unknown }
  | { type: 'SELF_DM_ERROR'; message: string }
  | { type: 'LIST_DMS_ERROR'; message: string; cause?: unknown };

// Message Service Errors
export type MessageServiceError =
  | { type: 'CHAT_NOT_FOUND'; message: string }
  | { type: 'ACCESS_DENIED'; message: string }
  | { type: 'SEND_FAILED'; message: string; cause?: unknown }
  | { type: 'LIST_MESSAGES_ERROR'; message: string; cause?: unknown };

// Moderation Service Errors
export type ModerationServiceError =
  | { type: 'CHAT_NOT_FOUND'; message: string }
  | { type: 'TARGET_NOT_FOUND'; message: string }
  | { type: 'ACCESS_DENIED'; message: string }
  | { type: 'CANNOT_MODERATE_SELF'; message: string }
  | { type: 'ALREADY_BANNED'; message: string }
  | { type: 'NOT_BANNED'; message: string }
  | { type: 'MODERATION_ERROR'; message: string; cause?: unknown };

// Group Service Errors
export type GroupServiceError =
  | { type: 'CHAT_NOT_FOUND'; message: string }
  | { type: 'NOT_GROUP_CHAT'; message: string }
  | { type: 'ACCESS_DENIED'; message: string }
  | { type: 'USER_ALREADY_MEMBER'; message: string }
  | { type: 'USER_NOT_MEMBER'; message: string }
  | { type: 'INVITE_NOT_FOUND'; message: string }
  | { type: 'INVITE_ALREADY_EXISTS'; message: string }
  | { type: 'INVITE_ALREADY_RESPONDED'; message: string }
  | { type: 'GROUP_ERROR'; message: string; cause?: unknown };

// Block Service Errors
export type BlockServiceError =
  | { type: 'CANNOT_BLOCK_SELF'; message: string }
  | { type: 'ALREADY_BLOCKED'; message: string }
  | { type: 'NOT_BLOCKED'; message: string }
  | { type: 'BLOCK_ERROR'; message: string; cause?: unknown };
