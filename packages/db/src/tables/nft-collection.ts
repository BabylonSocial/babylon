import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const nftCollection = pgTable(
  'NftCollection',
  {
    id: text('id').primaryKey(),
    tokenId: integer('tokenId').unique().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('imageUrl').notNull(),
    thumbnailUrl: text('thumbnailUrl'),
    imageCid: text('imageCid'),
    storyTitle: text('storyTitle'),
    storyContent: text('storyContent'),
    metadataUri: text('metadataUri'),
    attributes:
      json('attributes').$type<
        Array<{ trait_type: string; value: string | number }>
      >(),
    contractAddress: text('contractAddress').notNull(),
    chainId: integer('chainId').notNull().default(1),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('NftCollection_tokenId_idx').on(table.tokenId),
    index('NftCollection_contractAddress_idx').on(table.contractAddress),
  ]
);
