import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const nftOwnership = pgTable(
  'NftOwnership',
  {
    id: text('id').primaryKey(),
    tokenId: integer('tokenId').notNull(),
    ownerAddress: text('ownerAddress').notNull(),
    userId: text('userId'),
    acquiredAt: timestamp('acquiredAt', { mode: 'date' }).notNull(),
    txHash: text('txHash'),
    blockNumber: bigint('blockNumber', { mode: 'bigint' }),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    unique('NftOwnership_tokenId_key').on(table.tokenId),
    index('NftOwnership_ownerAddress_idx').on(table.ownerAddress),
    index('NftOwnership_userId_idx').on(table.userId),
    index('NftOwnership_updatedAt_idx').on(table.updatedAt),
  ]
);
