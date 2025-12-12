/**
 * Privy Authentication for Chat API
 *
 * Validates Privy tokens and looks up users in the main database.
 * Supports both cookie-based auth (frontend) and Bearer token auth (API clients).
 */

import { PrivyClient } from '@privy-io/server-auth';
import { env } from './env';
import type { Logger } from './logger';

/**
 * Authenticated user information returned after successful auth
 */
export interface AuthenticatedUser {
  /** User ID (from database) */
  userId: string;
  /** Privy DID */
  privyId: string;
  /** Database user ID (same as userId if user exists) */
  dbUserId?: string;
  /** User's wallet address */
  walletAddress?: string;
  /** Whether this is an agent (vs human user) */
  isAgent: boolean;
}

// Lazy initialization of Privy client
let privyClient: PrivyClient | null = null;

/**
 * Get or create Privy client instance
 */
export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }
  return privyClient;
}

/**
 * Extract token from request headers
 *
 * Priority:
 * 1. privy-token cookie (preferred - auto-refreshed by Privy)
 * 2. Authorization Bearer header (for API clients)
 */
export function extractToken(headers: Headers): string | null {
  // Check for cookie first
  const cookieHeader = headers.get('cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const cookieToken = cookies['privy-token'];
    if (cookieToken) {
      return cookieToken;
    }
  }

  // Fall back to Authorization header
  const authHeader = headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Parse cookie header into key-value pairs
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key) {
      cookies[key] = valueParts.join('=');
    }
  }
  return cookies;
}

/**
 * User lookup function type - injected to avoid circular dependency with DB
 * This function should find or create a user, never returning null
 */
export type UserLookupFn = (
  privyId: string,
  walletAddress?: string
) => Promise<{
  id: string;
  walletAddress: string | null;
  isAgent: boolean;
}>;

/**
 * Verify Privy token and return authenticated user
 *
 * @param token - Privy access token
 * @param lookupUser - Function to lookup/create user by privyId in database
 * @param logger - Optional logger for debugging
 */
export async function verifyPrivyToken(
  token: string,
  lookupUser: UserLookupFn,
  logger?: Logger
): Promise<AuthenticatedUser> {
  const privy = getPrivyClient();

  // Verify the token with Privy
  const claims = await privy.verifyAuthToken(token);

  logger?.debug({
    msg: 'Privy token verified',
    privyId: claims.userId,
  });

  // Get user's wallet address from Privy if available
  let walletAddress: string | undefined;
  try {
    const privyUser = await privy.getUser(claims.userId);
    walletAddress = privyUser.wallet?.address;
  } catch {
    // Wallet lookup failed, continue without it
    logger?.debug({
      msg: 'Could not fetch Privy user wallet',
      privyId: claims.userId,
    });
  }

  // Look up or create user in database
  const dbUser = await lookupUser(claims.userId, walletAddress);

  logger?.debug({
    msg: 'User resolved',
    privyId: claims.userId,
    userId: dbUser.id,
  });

  return {
    userId: dbUser.id,
    privyId: claims.userId,
    dbUserId: dbUser.id,
    walletAddress: dbUser.walletAddress ?? undefined,
    isAgent: dbUser.isAgent,
  };
}

/**
 * Authentication error class
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Check if an error is an authentication error
 */
export function isAuthenticationError(
  error: unknown
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}
