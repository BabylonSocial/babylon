/**
 * Message types for chat and notifications.
 * Client-safe enum and union used across web and services.
 */

export const MessageTypeEnum = {
  USER: 'user',
  SYSTEM: 'system',
} as const;

export type MessageType =
  (typeof MessageTypeEnum)[keyof typeof MessageTypeEnum];
