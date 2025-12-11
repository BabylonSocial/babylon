/**
 * Authentication module for Chat API
 *
 * Exports all auth-related functionality.
 */

export {
  type AuthenticatedUser,
  AuthenticationError,
  extractToken,
  getPrivyClient,
  isAuthenticationError,
  type UserLookupFn,
  verifyPrivyToken,
} from './privy-auth';
