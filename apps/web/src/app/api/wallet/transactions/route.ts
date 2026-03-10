/**
 * Wallet Transaction History API
 *
 * @route GET /api/wallet/transactions?address=0x...&page=1&limit=20
 * @access Authenticated
 *
 * @description
 * Returns transaction history for a given wallet address.
 * Data sources:
 *   - walletTransferLog table (token/ETH/NFT transfers initiated through Babylon)
 *   - NFT mint events from nftClaims table
 *   - NFT ownership transfers from nftOwnership table
 *
 * Each source is capped at MAX_RECORDS_PER_SOURCE before the in-memory
 * merge-sort to prevent unbounded memory allocation for heavy users.
 */

import {
  authenticateUser,
  checkRateLimitAsync,
  RATE_LIMIT_CONFIGS,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import {
  db,
  desc,
  eq,
  nftClaims,
  nftCollection,
  nftOwnership,
  or,
  walletTransferLog,
} from '@babylon/db';
import {
  CHAIN_ID,
  getTokenListForChain,
  getTxExplorerUrl,
  logger,
} from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

// Maximum records fetched per source before in-memory merge. Prevents
// unbounded queries for users with large transaction histories.
const MAX_RECORDS_PER_SOURCE = 500;

import { walletOptionsResponse } from '../_cors';

export const OPTIONS = withErrorHandling(async () => {
  return walletOptionsResponse();
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await authenticateUser(request);

  const rateLimit = await checkRateLimitAsync(
    user.id,
    RATE_LIMIT_CONFIGS.WALLET_READ
  );
  if (!rateLimit.allowed) {
    const retryAfterSeconds = rateLimit.retryAfter || 60;
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const address = request.nextUrl.searchParams.get('address');
  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: 'Invalid or missing address parameter' },
      { status: 400 }
    );
  }

  const page = Math.max(
    1,
    Number(request.nextUrl.searchParams.get('page')) || 1
  );
  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20)
  );
  const offset = (page - 1) * limit;

  const walletAddress = address.toLowerCase();

  // Build a lookup map from the token list for ERC-20 metadata enrichment
  const tokenMap = new Map(
    getTokenListForChain(CHAIN_ID).map((t) => [t.address.toLowerCase(), t])
  );

  // Collect transactions from available sources
  const transactions: TransactionRecord[] = [];
  const seenTxHashes = new Set<string>();

  // Source 0: Internal transfer log (token/ETH/NFT transfers made through Babylon)
  const transferRecords = await db
    .select()
    .from(walletTransferLog)
    .where(
      or(
        eq(walletTransferLog.fromAddress, walletAddress),
        eq(walletTransferLog.toAddress, walletAddress)
      )
    )
    .orderBy(desc(walletTransferLog.createdAt))
    .limit(MAX_RECORDS_PER_SOURCE);

  for (const record of transferRecords) {
    const isSend = record.fromAddress === walletAddress;
    const tx: TransactionRecord = {
      txHash: record.txHash ?? record.id,
      type: isSend ? 'send' : 'receive',
      from: record.fromAddress,
      to: record.toAddress,
      value: record.amount,
      timestamp: record.createdAt.toISOString(),
      status: record.status as 'confirmed' | 'pending' | 'failed',
      explorerUrl: record.txHash ? getTxExplorerUrl(record.txHash) : '',
    };

    if (record.type === 'erc20' && record.tokenAddress) {
      const tokenMeta = tokenMap.get(record.tokenAddress.toLowerCase());
      tx.token = {
        symbol: tokenMeta?.symbol ?? '',
        address: record.tokenAddress,
        decimals: tokenMeta?.decimals ?? 18,
      };
    }
    if (record.type === 'erc721' && record.tokenId) {
      tx.nft = {
        collection: '',
        tokenId: record.tokenId,
        name: `NFT #${record.tokenId}`,
        imageUrl: '',
      };
    }

    transactions.push(tx);
    if (record.txHash) seenTxHashes.add(record.txHash);
  }

  // Source 1: NFT mints (from nftClaims where this address was the claimer)
  const mintRecords = await db
    .select({
      tokenId: nftClaims.tokenId,
      claimerAddress: nftClaims.claimerAddress,
      claimedAt: nftClaims.claimedAt,
      txHash: nftClaims.txHash,
      nftName: nftCollection.name,
      nftImageUrl: nftCollection.imageUrl,
    })
    .from(nftClaims)
    .leftJoin(nftCollection, eq(nftClaims.tokenId, nftCollection.tokenId))
    .where(eq(nftClaims.claimerAddress, walletAddress))
    .orderBy(desc(nftClaims.claimedAt))
    .limit(MAX_RECORDS_PER_SOURCE);

  for (const mint of mintRecords) {
    if (seenTxHashes.has(mint.txHash)) continue;
    seenTxHashes.add(mint.txHash);
    transactions.push({
      txHash: mint.txHash,
      type: 'mint',
      from: '0x0000000000000000000000000000000000000000',
      to: mint.claimerAddress,
      value: '0',
      nft: {
        collection: 'ProtoMonkeys',
        tokenId: String(mint.tokenId),
        name: mint.nftName ?? `ProtoMonkey #${mint.tokenId}`,
        imageUrl: mint.nftImageUrl ?? '',
      },
      timestamp: mint.claimedAt.toISOString(),
      status: 'confirmed',
      explorerUrl: getTxExplorerUrl(mint.txHash),
    });
  }

  // Source 2: NFT ownership records (transfers received) with tx hashes
  const ownershipRecords = await db
    .select({
      tokenId: nftOwnership.tokenId,
      ownerAddress: nftOwnership.ownerAddress,
      acquiredAt: nftOwnership.acquiredAt,
      txHash: nftOwnership.txHash,
      nftName: nftCollection.name,
      nftImageUrl: nftCollection.imageUrl,
    })
    .from(nftOwnership)
    .leftJoin(nftCollection, eq(nftOwnership.tokenId, nftCollection.tokenId))
    .where(eq(nftOwnership.ownerAddress, walletAddress))
    .orderBy(desc(nftOwnership.acquiredAt))
    .limit(MAX_RECORDS_PER_SOURCE);

  for (const record of ownershipRecords) {
    if (record.txHash && !seenTxHashes.has(record.txHash)) {
      seenTxHashes.add(record.txHash);
      transactions.push({
        txHash: record.txHash,
        type: 'receive',
        from: '0x0000000000000000000000000000000000000000',
        to: record.ownerAddress,
        value: '0',
        nft: {
          collection: 'ProtoMonkeys',
          tokenId: String(record.tokenId),
          name: record.nftName ?? `ProtoMonkey #${record.tokenId}`,
          imageUrl: record.nftImageUrl ?? '',
        },
        timestamp: record.acquiredAt.toISOString(),
        status: 'confirmed',
        explorerUrl: record.txHash ? getTxExplorerUrl(record.txHash) : '',
      });
    }
  }

  // Sort all merged transactions by timestamp descending, then paginate
  transactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const total = transactions.length;
  const paginated = transactions.slice(offset, offset + limit);

  logger.debug(
    'Wallet transactions fetched',
    { address: walletAddress, total, page, limit },
    'GET /api/wallet/transactions'
  );

  return successResponse({
    transactions: paginated,
    pagination: { page, limit, total },
  });
});

interface TransactionRecord {
  txHash: string;
  type: 'send' | 'receive' | 'mint' | 'approve' | 'contract_interaction';
  from: string;
  to: string;
  value: string;
  token?: { symbol: string; address: string; decimals: number };
  nft?: {
    collection: string;
    tokenId: string;
    name: string;
    imageUrl: string;
  };
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  explorerUrl: string;
}
