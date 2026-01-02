/**
 * User Balance API
 *
 * @route GET /api/users/[userId]/balance - Get user balance
 * @access Public
 *
 * @description
 * Retrieves user's balance information including virtual balance,
 * total deposited, total withdrawn, and lifetime P&L. Uses caching for performance.
 * Balance is publicly viewable for all users (players).
 *
 * @openapi
 * /api/users/{userId}/balance:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user balance
 *     description: Returns user's balance information (publicly viewable)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: string
 *                   description: Current virtual balance
 *                 totalDeposited:
 *                   type: string
 *                   description: Total amount deposited
 *                 totalWithdrawn:
 *                   type: string
 *                   description: Total amount withdrawn
 *                 lifetimePnL:
 *                   type: string
 *                   description: Lifetime profit/loss
 *       404:
 *         description: Balance not found
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/users/user_123/balance');
 * const { balance, lifetimePnL } = await response.json();
 * ```
 *
 * @see {@link /lib/cached-database-service} Cached database service
 */

import {
  BusinessLogicError,
  cachedDb,
  findUserByIdentifier,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { db, users } from '@babylon/db';
import {
  convertBalanceToStrings,
  logger,
  UserIdParamSchema,
} from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * GET Handler for User Balance
 *
 * @description Retrieves user's balance information with caching for performance.
 * Balance is publicly viewable for all users (players).
 *
 * @param {NextRequest} request - Next.js request object
 * @param {Object} context - Route context containing dynamic parameters
 * @param {Promise<{userId: string}>} context.params - Dynamic route parameters
 *
 * @returns {Promise<NextResponse>} User balance data
 *
 * @throws {BusinessLogicError} When balance data not found
 * @throws {ValidationError} When userId parameter is invalid
 *
 * @example
 * ```typescript
 * // Request
 * GET /api/users/user_123/balance
 *
 * // Response
 * {
 *   "balance": "10000.50",
 *   "totalDeposited": "15000.00",
 *   "totalWithdrawn": "5000.00",
 *   "lifetimePnL": "500.50"
 * }
 * ```
 */
export const GET = withErrorHandling(
  async (
    _request: NextRequest,
    context: { params: Promise<{ userId: string }> }
  ) => {
    const { userId } = UserIdParamSchema.parse(await context.params);

    // Ensure user exists in database
    let dbUser = await findUserByIdentifier(userId, {
      id: true,
    });

    if (!dbUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          privyId: userId,
          isActor: false,
          updatedAt: new Date(),
        })
        .returning();
      if (!newUser) {
        throw new Error('Failed to create user');
      }
      dbUser = newUser;
    }

    const canonicalUserId = dbUser!.id;

    // Get balance info with caching (balance is publicly viewable)
    const balanceData = await cachedDb.getUserBalance(canonicalUserId);

    if (!balanceData) {
      throw new BusinessLogicError(
        'User balance not found',
        'BALANCE_NOT_FOUND'
      );
    }

    // Safely convert balance fields to strings
    // When data comes from cache, Decimal objects may be serialized as strings or numbers
    const balanceInfo = convertBalanceToStrings({
      virtualBalance: balanceData.virtualBalance,
      totalDeposited: balanceData.totalDeposited,
      totalWithdrawn: balanceData.totalWithdrawn,
      lifetimePnL: balanceData.lifetimePnL,
    });

    logger.info(
      'Balance fetched successfully (cached)',
      { userId: canonicalUserId, balance: balanceInfo.virtualBalance },
      'GET /api/users/[userId]/balance'
    );

    return successResponse({
      balance: balanceInfo.virtualBalance,
      totalDeposited: balanceInfo.totalDeposited,
      totalWithdrawn: balanceInfo.totalWithdrawn,
      lifetimePnL: balanceInfo.lifetimePnL,
    });
  }
);
