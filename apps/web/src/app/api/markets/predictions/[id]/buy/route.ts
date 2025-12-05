/**
 * Prediction Market Buy API
 *
 * @route POST /api/markets/predictions/[id]/buy - Buy shares in prediction market
 * @access Authenticated
 *
 * @description
 * Buys YES or NO shares in a prediction market using Automated Market Maker (AMM)
 * pricing. Includes fee calculation, wallet balance checks, position tracking,
 * and price history recording. Supports both virtual and on-chain trading.
 *
 * @openapi
 * /api/markets/predictions/{id}/buy:
 *   post:
 *     tags:
 *       - Markets
 *     summary: Buy prediction market shares
 *     description: Buys YES or NO shares in a prediction market using AMM pricing
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Market/question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - side
 *               - amount
 *             properties:
 *               side:
 *                 type: string
 *                 enum: [yes, no]
 *                 description: Side to buy (YES or NO)
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Amount to spend (in virtual currency)
 *     responses:
 *       200:
 *         description: Shares purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 shares:
 *                   type: number
 *                 cost:
 *                   type: number
 *                 fees:
 *                   type: number
 *                 newBalance:
 *                   type: number
 *                 position:
 *                   type: object
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Market not found
 *
 * @example
 * ```typescript
 * const response = await fetch(`/api/markets/predictions/${marketId}/buy`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     side: 'yes',
 *     amount: 100
 *   })
 * });
 * const { shares, cost, newBalance } = await response.json();
 * ```
 *
 * @see {@link /lib/prediction-pricing} Prediction pricing service
 * @see {@link /lib/services/wallet-service} Wallet service
 */

import type { NextRequest } from 'next/server';
import { authenticate } from '@babylon/api';
import { invalidateAfterPredictionTrade } from '@babylon/engine';
import { FEE_CONFIG } from '@babylon/engine';
import { asUser } from '@babylon/db';
import {
  BusinessLogicError,
  NotFoundError,
} from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import { trackServerEvent } from '@/lib/posthog/server';
import { PredictionPricing } from '@babylon/engine';
import { FeeService } from '@babylon/engine';
import {
  PredictionMarketService,
} from '@babylon/engine';
import { WalletService } from '@babylon/engine';
import { generateSnowflakeId } from '@babylon/shared';
import { PredictionMarketIdSchema } from '@babylon/shared';
import { PredictionMarketTradeSchema } from '@babylon/shared';
import { ensureMarketOnChain } from '@babylon/engine';
/**
 * POST /api/markets/predictions/[id]/buy
 *
 * Buys YES or NO shares in a prediction market using Automated Market Maker (AMM) pricing.
 * Calculates share quantity, fees, updates wallet balance, creates/updates position, and records price history.
 * Supports both virtual and on-chain trading with automatic market creation if needed.
 *
 * @param request - Next.js request containing buy parameters (side, amount)
 * @param context - Route context with market ID parameter
 * @returns Purchase result with shares purchased, total cost, fees, and updated balance
 * @throws {400} Invalid input, insufficient funds, or market not found
 * @throws {401} Unauthorized
 * @throws {404} Market not found
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: marketId } = PredictionMarketIdSchema.parse(
      await context.params
    );

    // Authentication - errors propagate to withErrorHandling
    const user = await authenticate(request);

    logger.info(
      'Buy request START',
      {
        marketId,
        userId: user.userId,
        marketIdType: typeof marketId,
        isNumber: !isNaN(Number(marketId)),
      },
      'POST /api/markets/predictions/[id]/buy'
    );

    // Parse and validate request body with schema
    const body = await request.json();
    const { side, amount } = PredictionMarketTradeSchema.parse(body);

    logger.info(
      'Buy request params',
      {
        marketId,
        side,
        amount,
        userId: user.userId,
      },
      'POST /api/markets/predictions/[id]/buy'
    );

    // Check balance first (before RLS transaction)
    const hasFunds = await WalletService.hasSufficientBalance(
      user.userId,
      amount
    );
    if (!hasFunds) {
      const balance = await WalletService.getBalance(user.userId);
      throw new BusinessLogicError(
        `Insufficient funds. Required: ${amount}, Available: ${Number(balance.balance)}`,
        'INSUFFICIENT_FUNDS',
        {
          required: amount,
          available: Number(balance.balance),
          currency: 'USD',
        }
      );
    }

    // Execute trade with RLS
    const {
      position,
      calculation,
      market: updatedMarket,
    } = await asUser(user, async (db) => {
      // Get or create market from question
      logger.info(
        'Step 4: Looking up market/question',
        { marketId },
        'POST /api/markets/predictions/[id]/buy'
      );

      // First try to find Market by ID
      let market = await db.market.findUnique({
        where: { id: marketId },
      });
      logger.info(
        'Step 4a: Market lookup result',
        { found: !!market },
        'POST /api/markets/predictions/[id]/buy'
      );

      // If market doesn't exist, try to find Question and create Market
      if (!market) {
        logger.info(
          'Step 4b: Market not found, looking for question',
          { marketId },
          'POST /api/markets/predictions/[id]/buy'
        );

        const questionModel = db as typeof db & {
          question: {
            findUnique: (args: { where: { id: string } }) => Promise<{
              id: string;
              questionNumber: number;
              text: string;
              status: string;
              resolutionDate: Date;
            } | null>;
            findMany: (args: {
              where: { questionNumber: number };
              orderBy: { createdDate: 'desc' };
              take: number;
            }) => Promise<
              Array<{
                id: string;
                questionNumber: number;
                text: string;
                status: string;
                resolutionDate: Date;
              }>
            >;
          };
        };

        let question = await questionModel.question.findUnique({
          where: { id: marketId },
        });
        logger.info(
          'Step 4c: Question by ID lookup',
          { found: !!question },
          'POST /api/markets/predictions/[id]/buy'
        );

        if (!question && !isNaN(Number(marketId))) {
          logger.info(
            'Step 4d: Trying question by number',
            { questionNumber: Number.parseInt(marketId, 10) },
            'POST /api/markets/predictions/[id]/buy'
          );
          const questions = await questionModel.question.findMany({
            where: { questionNumber: Number.parseInt(marketId, 10) },
            orderBy: { createdDate: 'desc' },
            take: 1,
          });
          question = questions[0] || null;
          logger.info(
            'Step 4e: Question by number result',
            { found: !!question, questionId: question?.id },
            'POST /api/markets/predictions/[id]/buy'
          );
        }

        if (!question) {
          logger.error(
            'Neither market nor question found',
            { marketId },
            'POST /api/markets/predictions/[id]/buy'
          );
          throw new NotFoundError('Market or Question', marketId);
        }

        if (question.status !== 'active') {
          throw new BusinessLogicError(
            `Question is ${question.status}, cannot trade`,
            'QUESTION_INACTIVE',
            { status: question.status, marketId }
          );
        }

        if (new Date(question.resolutionDate) < new Date()) {
          throw new BusinessLogicError(
            'Question has expired',
            'QUESTION_EXPIRED',
            {
            marketId,
            resolutionDate:
              question.resolutionDate instanceof Date
                ? question.resolutionDate.toISOString()
                : question.resolutionDate,
          }
          );
        }

        logger.info(
          'Step 4f: Creating market from question',
          {
            questionId: question.id,
            questionNumber: question.questionNumber,
          },
          'POST /api/markets/predictions/[id]/buy'
        );

        const endDate = new Date(question.resolutionDate);
        // Use 10,000 liquidity for acceptable price impact (<5% for $100 trades)
        const initialLiquidity = 10000;

        const now = new Date();
        market = await db.market.upsert({
          where: { id: question.id },
          create: {
            id: question.id,
            question: question.text,
            description: null,
            gameId: 'continuous',
            dayNumber: null,
            yesShares: String(initialLiquidity / 2),
            noShares: String(initialLiquidity / 2),
            liquidity: String(initialLiquidity),
            resolved: false,
            resolution: null,
            endDate: endDate,
            createdAt: now,
            updatedAt: now,
          },
          update: {},
        });

        logger.info(
          'Auto-created market from question',
          {
            marketId: market.id,
            questionId: question.id,
            questionNumber: question.questionNumber,
          },
          'POST /api/markets/predictions/[id]/buy'
        );

        // Create market on-chain if it doesn't have onChainMarketId (non-blocking)
        if (!market.onChainMarketId) {
          await ensureMarketOnChain(market.id).catch((error) => {
            logger.warn(
              'Failed to create market on-chain (non-blocking)',
              { error, marketId: market?.id ?? marketId },
              'POST /api/markets/predictions/[id]/buy'
            );
          });
        }
      }

      logger.info(
        'Step 5: Market ready',
        { marketId: market.id },
        'POST /api/markets/predictions/[id]/buy'
      );

      // Check if market is still active
      if (market.resolved) {
        throw new BusinessLogicError(
          'Market has already resolved',
          'MARKET_RESOLVED',
          { marketId }
        );
      }

      if (new Date() > market.endDate) {
        throw new BusinessLogicError('Market has expired', 'MARKET_EXPIRED', {
          marketId,
          endDate:
            market.endDate instanceof Date
              ? market.endDate.toISOString()
              : market.endDate,
        });
      }

      // Calculate shares using AMM with fees
      const calc = PredictionPricing.calculateBuyWithFees(
        Number(market.yesShares),
        Number(market.noShares),
        side,
        amount
      );

      // Debit total cost (includes fee) from balance
      await WalletService.debit(
        user.userId,
        amount,
        'pred_buy',
        `Bought ${side.toUpperCase()} shares in: ${market.question}`,
        marketId
      );

      // Update market shares (use net amount, not total with fee)
      const currentLiquidity = Number(market.liquidity ?? 0);
      const newLiquidity = currentLiquidity + calc.netAmount;
      const updated = await db.market.update({
        where: { id: marketId },
        data: {
          yesShares: String(calc.newYesShares),
          noShares: String(calc.newNoShares),
          liquidity: String(newLiquidity),
        },
      });

      // Create or update position
      const desiredYesSide = side === 'yes';

      const existingPosition = await db.position.findFirst({
        where: {
          userId: user.userId,
          marketId,
          side: desiredYesSide,
        },
      });

      let pos;
      if (existingPosition) {
        const newTotalShares =
          Number(existingPosition.shares) + calc.sharesBought;
        const newAvgPrice =
          (Number(existingPosition.avgPrice) * Number(existingPosition.shares) +
            calc.avgPrice * calc.sharesBought) /
          newTotalShares;

        pos = await db.position.update({
          where: { id: existingPosition.id },
          data: {
            shares: String(newTotalShares),
            avgPrice: String(newAvgPrice),
          },
        });
      } else {
        const now = new Date();
        pos = await db.position.create({
          data: {
            id: await generateSnowflakeId(),
            userId: user.userId,
            marketId,
            side: desiredYesSide,
            shares: String(calc.sharesBought),
            avgPrice: String(calc.avgPrice),
            updatedAt: now,
          },
        });
      }

      return { position: pos, market: updated, calculation: calc };
    });

    // Process trading fee and distribute to referrer if applicable
    const feeResult = await FeeService.processTradingFee(
      user.userId,
      FEE_CONFIG.FEE_TYPES.PRED_BUY,
      amount,
      position.id,
      marketId
    );

    logger.info(
      'Trade completed with fee',
      {
        userId: user.userId,
        marketId,
        amount,
        fee: feeResult.feeCharged,
        referrerPaid: feeResult.referrerPaid,
      },
      'POST /api/markets/predictions/[id]/buy'
    );

    // Log agent activity (if agent)
    if (user.isAgent) {
      logger.info(
        `Agent ${user.userId} placed trade: ${side.toUpperCase()} $${amount} on market ${marketId}`,
        undefined,
        'POST /api/markets/predictions/[id]/buy'
      );
    }

    const newBalance = await WalletService.getBalance(user.userId);

    // Track prediction buy event
    trackServerEvent(user.userId, 'prediction_bought', {
      marketId,
      side,
      amount,
      sharesBought: calculation.sharesBought,
      avgPrice: calculation.avgPrice,
      priceImpact: calculation.priceImpact,
      feeCharged: feeResult.feeCharged,
      newYesPrice: calculation.newYesPrice,
      newNoPrice: calculation.newNoPrice,
    }).catch((error) => {
      logger.warn('Failed to track prediction_bought event', { error });
    });

    await PredictionMarketService.recordSnapshot({
      marketId,
      yesPrice: calculation.newYesPrice,
      noPrice: calculation.newNoPrice,
      yesShares: calculation.newYesShares,
      noShares: calculation.newNoShares,
      liquidity: Number(updatedMarket.liquidity ?? 0),
      eventType: 'trade',
      source: 'user_trade',
    }).catch((error) => {
      logger.warn(
        'Failed to record price history for prediction buy',
        { error, marketId },
        'POST /api/markets/predictions/[id]/buy'
      );
    });

    await invalidateAfterPredictionTrade(marketId).catch((error) => {
      logger.warn(
        'Failed to invalidate prediction trades cache after buy',
        { error, marketId },
        'POST /api/markets/predictions/[id]/buy'
      );
    });

    PredictionMarketService.emitTradeUpdate({
      marketId,
      yesPrice: calculation.newYesPrice,
      noPrice: calculation.newNoPrice,
      yesShares: Number(updatedMarket.yesShares),
      noShares: Number(updatedMarket.noShares),
      liquidity: Number(updatedMarket.liquidity ?? 0),
      trade: {
        actorType: 'user',
        actorId: user.userId,
        action: 'buy',
        side,
        shares: calculation.sharesBought,
        amount,
        price: calculation.avgPrice,
        source: 'user_trade',
        timestamp: new Date().toISOString(),
      },
    });

    return successResponse(
      {
        position: {
          id: position.id,
          marketId: position.marketId,
          side: side,
          shares: Number(position.shares),
          avgPrice: Number(position.avgPrice),
          totalCost: amount,
        },
        market: {
          yesPrice: calculation.newYesPrice,
          noPrice: calculation.newNoPrice,
          priceImpact: calculation.priceImpact,
        },
        fee: {
          amount: feeResult.feeCharged,
          referrerPaid: feeResult.referrerPaid,
        },
        newBalance: newBalance.balance,
      },
      201
    );
  }
);
