/**
 * Wallet Token Balances API
 *
 * @route GET /api/wallet/tokens?address=0x...
 * @access Authenticated
 *
 * @description
 * Returns native (ETH) and ERC-20 token balances for a given wallet address.
 * Uses viem multicall for batched on-chain reads. Falls back to sequential
 * readContract calls if multicall fails.
 */

import {
  authenticateUser,
  checkRateLimitAsync,
  RATE_LIMIT_CONFIGS,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import {
  CHAIN,
  CHAIN_ID,
  ERC20_ABI,
  getTokenListForChain,
  logger,
  RPC_URL,
} from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  type Address,
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  parseAbi,
} from 'viem';

import { walletOptionsResponse } from '../_cors';

export const OPTIONS = withErrorHandling(async () => {
  return walletOptionsResponse();
});

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL || undefined),
});

const erc20Abi = parseAbi(ERC20_ABI);

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

  const walletAddress = address as Address;
  const tokenConfigs = getTokenListForChain(CHAIN_ID);

  // Fetch native balance
  const nativeBalance = await publicClient.getBalance({
    address: walletAddress,
  });

  // Fetch ERC-20 balances via multicall (batched single RPC call)
  let tokenBalances: { address: Address; balance: bigint; error: boolean }[];

  if (tokenConfigs.length > 0) {
    tokenBalances = await fetchTokenBalancesMulticall(
      walletAddress,
      tokenConfigs.map((t) => t.address)
    );
  } else {
    tokenBalances = [];
  }

  // Build response
  const native = {
    symbol: CHAIN.nativeCurrency.symbol,
    balance: nativeBalance.toString(),
    decimals: CHAIN.nativeCurrency.decimals,
    usdValue: null as string | null,
  };

  const tokens = tokenConfigs.map((config, i) => {
    const result = tokenBalances[i];
    return {
      address: config.address,
      symbol: config.symbol,
      name: config.name,
      decimals: config.decimals,
      balance: result && !result.error ? result.balance.toString() : '0',
      logoUrl: config.logoUrl,
      usdValue: null as string | null,
    };
  });

  logger.debug(
    'Wallet tokens fetched',
    {
      address: walletAddress,
      chainId: CHAIN_ID,
      tokenCount: tokens.length,
      nativeBalance: formatUnits(nativeBalance, CHAIN.nativeCurrency.decimals),
    },
    'GET /api/wallet/tokens'
  );

  return successResponse({ native, tokens });
});

async function fetchTokenBalancesMulticall(
  owner: Address,
  tokenAddresses: Address[]
): Promise<{ address: Address; balance: bigint; error: boolean }[]> {
  const contracts = tokenAddresses.map((address) => ({
    address,
    abi: erc20Abi,
    functionName: 'balanceOf' as const,
    args: [owner] as const,
  }));

  const results = await publicClient
    .multicall({ contracts })
    .catch((multicallError) => {
      logger.warn(
        'Multicall failed, falling back to sequential reads',
        { error: String(multicallError) },
        'fetchTokenBalancesMulticall'
      );
      return null;
    });

  if (results) {
    return results.map((r, i) => ({
      address: tokenAddresses[i]!,
      balance: r.status === 'success' ? (r.result as bigint) : 0n,
      error: r.status === 'failure',
    }));
  }

  // Fallback: sequential readContract calls
  const fallbackResults = await Promise.allSettled(
    tokenAddresses.map((address) =>
      publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [owner],
      })
    )
  );

  return fallbackResults.map((r, i) => ({
    address: tokenAddresses[i]!,
    balance: r.status === 'fulfilled' ? (r.value as bigint) : 0n,
    error: r.status === 'rejected',
  }));
}
