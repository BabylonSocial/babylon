/**
 * Prediction Market Sell API
 *
 * @route POST /api/markets/predictions/[id]/sell - Sell shares from prediction market
 * @access Authenticated
 *
 * @description
 * Sells shares from a prediction market position using Automated Market Maker (AMM)
 * pricing. Calculates proceeds, fees, P&L, and updates position. Supports partial
 * and full position closure. Includes price history recording.
 *
 * @openapi
 * /api/markets/predictions/{id}/sell:
 *   post:
 *     tags:
 *       - Markets
 *     summary: Sell prediction market shares
 *     description: Sells shares from a prediction market position using AMM pricing
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
 *               - shares
 *               - positionId
 *             properties:
 *               shares:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Number of shares to sell
 *               positionId:
 *                 type: string
 *                 description: Position ID to sell from
 *     responses:
 *       200:
 *         description: Shares sold successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 grossProceeds:
 *                   type: number
 *                 netProceeds:
 *                   type: number
 *                 pnl:
 *                   type: number
 *                 remainingShares:
 *                   type: number
 *                 positionClosed:
 *                   type: boolean
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: Invalid input or insufficient shares
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Market or position not found
 *
 * @example
 * ```typescript
 * const response = await fetch(`/api/markets/predictions/${marketId}/sell`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     shares: 10,
 *     positionId: 'position_123'
 *   })
 * });
 * const { netProceeds, pnl } = await response.json();
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
import { BusinessLogicError, NotFoundError } from '@babylon/api';
import { successResponse, withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import { trackServerEvent } from '@/lib/posthog/server';
import { PredictionPricing } from '@babylon/engine';
import { FeeService } from '@babylon/engine';
import {
  PredictionMarketService,
} from '@babylon/engine';
import { WalletService } from '@babylon/engine';
import { PredictionMarketIdSchema } from '@babylon/shared';
import { PredictionMarketSellSchema } from '@babylon/shared';
/**
 * POST /api/markets/predictions/[id]/sell
 *
 * Sells shares from a prediction market position using Automated Market Maker (AMM) pricing.
 * Calculates gross proceeds, fees, net proceeds, and P&L. Updates position (partial or full closure)
 * and records price history. Supports both virtual and on-chain trading.
 *
 * @param request - Next.js request containing sell parameters (shares, positionId)
 * @param context - Route context with market ID parameter
 * @returns Sale result with proceeds, P&L, remaining shares, and updated balance
 * @throws {400} Invalid input, insufficient shares, or position not found
 * @throws {401} Unauthorized
 * @throws {404} Market or position not found
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await authenticate(request);
    const { id: marketId } = PredictionMarketIdSchema.parse(
      await context.params
    );

    if (!marketId) {
      throw new BusinessLogicError(
        'Market ID is required',
        'MARKET_ID_REQUIRED'
      );
    }

    const body = await request.json();
    const { shares, positionId } = PredictionMarketSellSchema.parse(body);

    // Execute sell with RLS
    const {
      grossProceeds,
      netProceeds,
      pnl,
      remainingShares,
      positionClosed,
      calculation,
      updatedMarket,
      sellSide,
    } = await asUser(user, async (db) => {
      // Get or find market
      let market = await db.market.findUnique({
        where: { id: marketId },
      });

      // If market doesn't exist, try to find Question and create Market
      if (!market) {
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

        if (!question && !isNaN(Number(marketId))) {
          const questions = await questionModel.question.findMany({
            where: { questionNumber: Number.parseInt(marketId, 10) },
            orderBy: { createdDate: 'desc' },
            take: 1,
          });
          question = questions[0] || null;
        }

        if (!question) {
          throw new NotFoundError('Market or Question', marketId);
        }

        if (question.status !== 'active') {
          throw new BusinessLogicError(
            `Question is ${question.status}, cannot trade`,
            'QUESTION_INACTIVE',
            { status: question.status, marketId }
          );
        }

        const endDate = new Date(question.resolutionDate);
        // Use 10,000 liquidity for acceptable price impact (<5% for $100 trades)
        const initialLiquidity = 10000;
        const now = new Date();

        // Check if market exists
        const existingMarket = await db.market.findUnique({
          where: { id: question.id },
        });

        if (existingMarket) {
          market = existingMarket;
        } else {
          market = await db.market.create({
            data: {
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
              updatedAt: now,
            },
          });
        }
      }

      // Check if market is still active
      if (market.resolved) {
        throw new BusinessLogicError(
          'Cannot sell from resolved market',
          'MARKET_RESOLVED',
          { marketId }
        );
      }

      // Get user's position
      const position = await db.position.findFirst({
        where: {
          userId: user.userId,
          marketId,
          ...(positionId ? { id: positionId } : {}),
        },
      });

      if (!position) {
        throw new NotFoundError('Position', `${user.userId}-${marketId}`);
      }

      // Validate sufficient shares
      if (Number(position.shares) < shares) {
        throw new BusinessLogicError(
          `Insufficient shares. Have ${Number(position.shares)}, trying to sell ${shares}`,
          'INSUFFICIENT_SHARES',
          { have: Number(position.shares), requested: shares }
        );
      }

      const sellSide: 'yes' | 'no' = position.side ? 'yes' : 'no';

      // Calculate proceeds using AMM with fees
      const calculation = PredictionPricing.calculateSellWithFees(
        Number(market.yesShares),
        Number(market.noShares),
        sellSide,
        shares
      );

      const grossProceeds = calculation.totalCost; // Gross proceeds before fee
      const netProceeds = calculation.netProceeds!; // Net proceeds after fee

      // Credit net proceeds to balance
      await WalletService.credit(
        user.userId,
        netProceeds,
        'pred_sell',
        `Sold ${shares} ${sellSide.toUpperCase()} shares in: ${market.question}`,
        marketId
      );

      // Update market shares (use gross proceeds for liquidity)
      const currentLiquidity = Number.parseFloat(market.liquidity);
      const newLiquidity = currentLiquidity - grossProceeds;

      const updatedMarket = await db.market.update({
        where: { id: marketId },
        data: {
          yesShares: String(calculation.newYesShares),
          noShares: String(calculation.newNoShares),
          liquidity: String(newLiquidity),
          updatedAt: new Date(),
        },
      });

      // Update or close position
      const remaining = Number(position.shares) - shares;

      if (remaining <= 0.01) {
        await db.position.delete({
          where: { id: position.id },
        });
      } else {
        await db.position.update({
          where: { id: position.id },
          data: {
            shares: String(remaining),
            updatedAt: new Date(),
          },
        });
      }

      // Calculate PnL (use net proceeds)
      const costBasis = Number(position.avgPrice) * shares;
      const profitLoss = netProceeds - costBasis;
      await WalletService.recordPnL(
        user.userId,
        profitLoss,
        'prediction_sell',
        marketId
      );

      return {
        grossProceeds,
        netProceeds,
        pnl: profitLoss,
        remainingShares: remaining,
        positionClosed: remaining <= 0.01,
        calculation,
        updatedMarket,
        sellSide,
      };
    });

    // Process trading fee and distribute to referrer if applicable
    const feeResult = await FeeService.processTradingFee(
      user.userId,
      FEE_CONFIG.FEE_TYPES.PRED_SELL,
      grossProceeds,
      undefined,
      marketId
    );

    const newBalance = await WalletService.getBalance(user.userId);

    logger.info(
      'Shares sold successfully with fee',
      {
        userId: user.userId,
        marketId,
        sharesSold: shares,
        grossProceeds,
        netProceeds,
        fee: feeResult.feeCharged,
        pnl,
      },
      'POST /api/markets/predictions/[id]/sell'
    );

    // Track prediction sell event
    trackServerEvent(user.userId, 'prediction_sold', {
      marketId,
      sharesSold: shares,
      grossProceeds,
      netProceeds,
      pnl,
      pnlPercent: pnl > 0 ? (pnl / (grossProceeds - pnl)) * 100 : 0,
      priceImpact: calculation.priceImpact,
      feeCharged: feeResult.feeCharged,
      positionClosed,
      remainingShares,
    }).catch((error) => {
      logger.warn('Failed to track prediction_sold event', { error });
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
        'Failed to record price history for prediction sell',
        { error, marketId },
        'POST /api/markets/predictions/[id]/sell'
      );
    });

    await invalidateAfterPredictionTrade(marketId).catch((error) => {
      logger.warn(
        'Failed to invalidate prediction trades cache after sell',
        { error, marketId },
        'POST /api/markets/predictions/[id]/sell'
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
        action: 'sell',
        side: sellSide,
        shares,
        amount: netProceeds,
        price: calculation.avgPrice,
        source: 'user_trade',
        timestamp: new Date().toISOString(),
      },
    });

    return successResponse({
      sharesSold: shares,
      grossProceeds,
      netProceeds,
      pnl,
      market: {
        yesPrice: calculation.newYesPrice,
        noPrice: calculation.newNoPrice,
        priceImpact: calculation.priceImpact,
      },
      fee: {
        amount: feeResult.feeCharged,
        referrerPaid: feeResult.referrerPaid,
      },
      remainingShares,
      positionClosed,
      newBalance: newBalance.balance,
      newLifetimePnL: newBalance.lifetimePnL,
    });
  }
);
