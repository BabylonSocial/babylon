import { eq } from '@babylon/db';
import { db, users } from '@babylon/db/runtime';
import { getPrivyClient } from '../../auth-middleware';
import { AuthenticationError } from '../../errors';
import { safeDecodeJwtPayload } from './evm-send-transaction';

export type AuthedPrivyUserContext = {
  privyId: string;
  dbUserId: string;
  privyWalletId: string;
  walletAddress: string | null;
  isAdmin: boolean;
};

type PrivyTokenBundle = {
  primary: string;
  fallback?: string;
};

function isInvalidPrivyAuthTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  // Keep this conservative: only retry on token-shaped failures.
  return (
    msg.includes('invalid jwt token provided') ||
    msg.includes('jwt expired') ||
    msg.includes('token expired') ||
    msg.includes('expired')
  );
}

export async function getAuthedUserContextFromPrivyToken(
  privyToken: string
): Promise<AuthedPrivyUserContext> {
  if (!privyToken) {
    throw new AuthenticationError('Missing Privy token');
  }

  const privy = getPrivyClient();
  const claims = await privy.verifyAuthToken(privyToken);

  const [dbUser] = await db
    .select({
      id: users.id,
      privyWalletId: users.privyWalletId,
      walletAddress: users.walletAddress,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.privyId, claims.userId))
    .limit(1);

  if (!dbUser) {
    throw new AuthenticationError('User not found');
  }
  if (!dbUser.privyWalletId) {
    throw new AuthenticationError('Embedded wallet not ready');
  }

  return {
    privyId: claims.userId,
    dbUserId: dbUser.id,
    privyWalletId: dbUser.privyWalletId,
    walletAddress: dbUser.walletAddress,
    isAdmin: dbUser.isAdmin ?? false,
  };
}

/**
 * Like `getAuthedUserContextFromPrivyToken`, but retries once with a fallback token
 * if the primary token is rejected as invalid/expired.
 */
export async function getAuthedUserContextFromPrivyTokenBundle({
  primary,
  fallback,
}: PrivyTokenBundle): Promise<AuthedPrivyUserContext> {
  if (fallback && fallback.trim() === primary.trim()) {
    return getAuthedUserContextFromPrivyToken(primary);
  }

  const primarySub = safeDecodeJwtPayload(primary)?.sub ?? null;
  const fallbackSub = fallback
    ? (safeDecodeJwtPayload(fallback)?.sub ?? null)
    : null;
  const canFallback =
    Boolean(fallback) &&
    Boolean(primarySub) &&
    Boolean(fallbackSub) &&
    primarySub === fallbackSub;

  try {
    return await getAuthedUserContextFromPrivyToken(primary);
  } catch (error) {
    if (canFallback && fallback && isInvalidPrivyAuthTokenError(error)) {
      return getAuthedUserContextFromPrivyToken(fallback);
    }
    throw error;
  }
}
