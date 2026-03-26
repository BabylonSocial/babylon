import { relations } from 'drizzle-orm';
import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './user';

export const walletTransferLog = pgTable(
  'WalletTransferLog',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    fromAddress: text('fromAddress').notNull(),
    toAddress: text('toAddress').notNull(),
    tokenAddress: text('tokenAddress'),
    tokenId: text('tokenId'),
    amount: text('amount').notNull(),
    txHash: text('txHash'),
    chainId: integer('chainId').notNull(),
    status: text('status').notNull(),
    type: text('type').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmedAt', { mode: 'date' }),
    usdValueAtTime: decimal('usdValueAtTime', { precision: 18, scale: 2 }),
    ipAddress: text('ipAddress'),
  },
  (table) => [
    index('WalletTransferLog_userId_idx').on(table.userId),
    index('WalletTransferLog_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('WalletTransferLog_fromAddress_idx').on(table.fromAddress),
    index('WalletTransferLog_toAddress_idx').on(table.toAddress),
    index('WalletTransferLog_txHash_idx').on(table.txHash),
    index('WalletTransferLog_status_idx').on(table.status),
  ]
);

export const walletTransferLogRelations = relations(
  walletTransferLog,
  ({ one }) => ({
    user: one(users, {
      fields: [walletTransferLog.userId],
      references: [users.id],
    }),
  })
);
