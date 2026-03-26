import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const oracleCommitments = pgTable(
  'OracleCommitment',
  {
    id: text('id').primaryKey(),
    questionId: text('questionId').notNull().unique(),
    sessionId: text('sessionId').notNull(),
    saltEncrypted: text('saltEncrypted').notNull(),
    commitment: text('commitment').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('OracleCommitment_createdAt_idx').on(table.createdAt),
    index('OracleCommitment_questionId_idx').on(table.questionId),
    index('OracleCommitment_sessionId_idx').on(table.sessionId),
  ]
);

export type OracleCommitment = typeof oracleCommitments.$inferSelect;
export type NewOracleCommitment = typeof oracleCommitments.$inferInsert;
