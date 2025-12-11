/**
 * Users Schema for Chat-API
 *
 * Minimal users table for storing Privy-authenticated users.
 * Users are created automatically on first authentication.
 */

import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { baseEntityFields, typeId } from '../db-utils';
import { typeIdGenerator, type UserId } from '../typeid';

// ============================================================================
// Chat Users Table
// ============================================================================

export const chatUsersTable = pgTable(
  'chat_users',
  {
    id: typeId('user', 'id')
      .primaryKey()
      .$defaultFn(() => typeIdGenerator('user'))
      .$type<UserId>(),

    /** Privy DID - unique identifier from Privy auth */
    privyId: text('privy_id').notNull().unique(),

    /** User's wallet address (from Privy) */
    walletAddress: text('wallet_address'),

    ...baseEntityFields,
  },
  (table) => [
    index('chat_users_privy_id_idx').on(table.privyId),
    index('chat_users_wallet_idx').on(table.walletAddress),
  ]
);

// ============================================================================
// Type Exports
// ============================================================================

export type ChatUser = typeof chatUsersTable.$inferSelect;
export type NewChatUser = typeof chatUsersTable.$inferInsert;
