import { ORPCError, os } from '@orpc/server';
import type { Context } from './context';

/**
 * Base oRPC instance with context type
 */
export const o = os.$context<Context>();

/**
 * Public procedure - no auth required
 */
export const publicProcedure = o;

/**
 * Auth middleware - requires authenticated user
 */
const requireAuth = o.middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Authentication required',
    });
  }

  return next({
    context: {
      user: context.user,
    },
  });
});

/**
 * Protected procedure - requires authenticated user
 */
export const protectedProcedure = publicProcedure.use(requireAuth);
