import { typeIdGenerator } from './db/typeid';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return typeIdGenerator('request');
}

/**
 * Generate a unique ID using TypeID
 * Returns a user-prefixed TypeID for general use
 */
export function generateId(): string {
  return typeIdGenerator('user');
}

/**
 * Parse cursor for pagination
 */
export function parseCursor(cursor: string | undefined): Date | undefined {
  if (!cursor) return undefined;
  const timestamp = new Date(cursor);
  return Number.isNaN(timestamp.getTime()) ? undefined : timestamp;
}

/**
 * Create cursor from date
 */
export function createCursor(date: Date): string {
  return date.toISOString();
}
