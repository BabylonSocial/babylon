import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const nftClaims = pgTable(
  'NftClaim',
  {
    id: text('id').primaryKey(),
    tokenId: integer('tokenId').notNull(),
    claimerUserId: text('claimerUserId'),
    claimerAddress: text('claimerAddress').notNull(),
    claimedAt: timestamp('claimedAt', { mode: 'date' }).notNull(),
    txHash: text('txHash').notNull(),
    snapshotRank: integer('snapshotRank'),
    snapshotPoints: integer('snapshotPoints'),
  },
  (table) => [
    unique('NftClaim_tokenId_key').on(table.tokenId),
    index('NftClaim_claimerUserId_idx').on(table.claimerUserId),
    index('NftClaim_claimerAddress_idx').on(table.claimerAddress),
  ]
);
