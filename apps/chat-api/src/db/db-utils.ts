/**
 * Drizzle ORM Utilities for Chat-API
 *
 * Custom column types and field helpers that integrate TypeID with Drizzle.
 * TypeIDs are stored as UUIDs in the database for performance, but exposed
 * as prefixed strings in application code for type safety.
 */

import { customType, timestamp } from 'drizzle-orm/pg-core';
import {
  type IdTypePrefixNames,
  type TypeId,
  typeIdFromUuid,
  typeIdToUuid,
} from './typeid';

/**
 * Custom Drizzle column type for TypeID fields
 *
 * Stores the ID as a UUID in PostgreSQL for efficient indexing and storage,
 * but converts to/from TypeID strings in application code.
 *
 * @example
 * ```typescript
 * const chatsTable = pgTable("chats", {
 *   id: typeId("chat", "id")
 *     .primaryKey()
 *     .$defaultFn(() => typeIdGenerator("chat"))
 *     .$type<ChatId>(),
 * });
 * ```
 */
export const typeId = <const T extends IdTypePrefixNames>(
  prefix: T,
  columnName: string
) =>
  customType<{
    data: TypeId<T>;
    driverData: string; // Stored as UUID string in DB
  }>({
    dataType() {
      return 'uuid';
    },
    fromDriver(input: string): TypeId<T> {
      // Convert UUID from DB back to TypeID string
      return typeIdFromUuid(prefix, input);
    },
    toDriver(input: TypeId<T>): string {
      // Convert TypeID string to UUID for storage
      return typeIdToUuid(input).uuid;
    },
  })(columnName);

/**
 * Create a timestamp column with timezone and date mode
 */
export const createTimestampField = (name?: string) => {
  if (!name) {
    return timestamp({ withTimezone: true, mode: 'date' });
  }
  return timestamp(name, { withTimezone: true, mode: 'date' });
};

/**
 * Base entity fields for all tables
 * - createdAt: Auto-set on insert
 * - updatedAt: Auto-set on insert and update
 */
export const baseEntityFields = {
  createdAt: createTimestampField('created_at').defaultNow().notNull(),
  updatedAt: createTimestampField('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/**
 * Extended timestamp fields with soft delete support
 */
export const softDeleteFields = {
  deletedAt: createTimestampField('deleted_at'),
};
