import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const oracleTransactions = pgTable(
  'OracleTransaction',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId'),
    txType: text('txType').notNull(),
    txHash: text('txHash').notNull().unique(),
    status: text('status').notNull(),
    blockNumber: integer('blockNumber'),
    gasUsed: bigint('gasUsed', { mode: 'bigint' }),
    gasPrice: bigint('gasPrice', { mode: 'bigint' }),
    error: text('error'),
    retryCount: integer('retryCount').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmedAt', { mode: 'date' }),
  },
  (table) => [
    index('OracleTransaction_questionId_idx').on(table.questionId),
    index('OracleTransaction_status_createdAt_idx').on(
      table.status,
      table.createdAt
    ),
    index('OracleTransaction_txHash_idx').on(table.txHash),
    index('OracleTransaction_txType_idx').on(table.txType),
  ]
);

export type OracleTransaction = typeof oracleTransactions.$inferSelect;
export type NewOracleTransaction = typeof oracleTransactions.$inferInsert;
