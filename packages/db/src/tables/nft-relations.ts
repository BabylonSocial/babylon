import { relations } from 'drizzle-orm';
import { nftClaims } from './nft-claims';
import { nftCollection } from './nft-collection';
import { nftOwnership } from './nft-ownership';
import { nftSnapshot } from './nft-snapshot';
import { users } from './user';

export const nftCollectionRelations = relations(nftCollection, ({ one }) => ({
  ownership: one(nftOwnership, {
    fields: [nftCollection.tokenId],
    references: [nftOwnership.tokenId],
  }),
  claim: one(nftClaims, {
    fields: [nftCollection.tokenId],
    references: [nftClaims.tokenId],
  }),
}));

export const nftOwnershipRelations = relations(nftOwnership, ({ one }) => ({
  nft: one(nftCollection, {
    fields: [nftOwnership.tokenId],
    references: [nftCollection.tokenId],
  }),
  user: one(users, {
    fields: [nftOwnership.userId],
    references: [users.id],
  }),
}));

export const nftClaimsRelations = relations(nftClaims, ({ one }) => ({
  nft: one(nftCollection, {
    fields: [nftClaims.tokenId],
    references: [nftCollection.tokenId],
  }),
  claimer: one(users, {
    fields: [nftClaims.claimerUserId],
    references: [users.id],
  }),
}));

export const nftSnapshotRelations = relations(nftSnapshot, ({ one }) => ({
  user: one(users, {
    fields: [nftSnapshot.userId],
    references: [users.id],
  }),
}));
