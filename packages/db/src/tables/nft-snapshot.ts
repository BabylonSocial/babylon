import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const nftSnapshot = pgTable(
  'NftSnapshot',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    walletAddress: text('walletAddress'),
    rank: integer('rank').notNull(),
    points: integer('points').notNull(),
    snapshotTakenAt: timestamp('snapshotTakenAt', { mode: 'date' }).notNull(),
    hasMinted: boolean('hasMinted').notNull().default(false),
    mintedTokenId: integer('mintedTokenId'),
    mintedAt: timestamp('mintedAt', { mode: 'date' }),
    mintTxHash: text('mintTxHash'),
  },
  (table) => [
    unique('NftSnapshot_userId_key').on(table.userId),
    index('NftSnapshot_walletAddress_idx').on(table.walletAddress),
    index('NftSnapshot_hasMinted_idx').on(table.hasMinted),
    index('NftSnapshot_rank_idx').on(table.rank),
  ]
);
